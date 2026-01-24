const axios = require('axios');
const { ethers } = require('ethers');

class PimlicoGaslessEngine {
  constructor() {
    this.apiKey = process.env.PIMLICO_API_KEY;
    this.rpcUrl = process.env.POLYGON_ZKEVM_RPC_URL || 'https://rpc.polygon-zkevm.gateway.fm';
    this.bundlerUrl = 'https://api.pimlico.io/v2/polygon-zkevm/rpc';
    this.paymasterUrl = 'https://api.pimlico.io/v2/polygon-zkevm/rpc';
    this.chainId = 1101; // Polygon zkEVM
    
    if (!this.apiKey) {
      throw new Error("Pimlico API Key is required for gasless transactions.");
    }
    
    this.provider = new ethers.providers.JsonRpcProvider(this.rpcUrl);
    console.log(`[Pimlico] Engine initialized for Polygon zkEVM with API Key: ${this.apiKey.substring(0, 6)}...`);
  }

  async getUserOperationReceipt(userOpHash) {
    try {
      const { data } = await axios.post(this.bundlerUrl, {
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_getUserOperationReceipt',
        params: [userOpHash]
      }, {
        headers: { 'Content-Type': 'application/json' }
      });

      if (data.error) {
        throw new Error(data.error.message);
      }
      return data.result;
    } catch (error) {
      console.error(`[Pimlico] Failed to get user operation receipt for ${userOpHash}:`, error.message);
      return null;
    }
  }

  async executeGaslessWithdrawal(amount, destinationAddress, tokenAddress = '0xA8CE8aee21bC2A48a5EF670afCc9274C7bbC681C') {
    console.log(`[Pimlico] Initiating gasless withdrawal of ${amount} ${tokenAddress} to ${destinationAddress}`);

    try {
      // 1. Construct UserOperation for ERC-20 transfer
      const sender = process.env.SMART_ACCOUNT_ADDRESS;
      if (!sender) {
        throw new Error("Smart account address is required.");
      }

      const erc20Abi = [
        "function transfer(address to, uint256 amount)",
        "function decimals() view returns (uint8)"
      ];
      const erc20 = new ethers.Contract(tokenAddress, erc20Abi, this.provider);
      const decimals = await erc20.decimals();
      const transferAmount = ethers.utils.parseUnits(amount.toString(), decimals);

      const callData = erc20.interface.encodeFunctionData("transfer", [destinationAddress, transferAmount]);

      const userOp = {
        sender,
        nonce: await this.getNonce(sender),
        initCode: '0x',
        callData,
        callGasLimit: ethers.utils.hexlify(100000),
        verificationGasLimit: ethers.utils.hexlify(100000),
        preVerificationGas: ethers.utils.hexlify(100000),
        maxFeePerGas: ethers.utils.hexlify(ethers.utils.parseUnits('1', 'gwei')),
        maxPriorityFeePerGas: ethers.utils.hexlify(ethers.utils.parseUnits('1', 'gwei')),
        paymasterAndData: '0x',
        signature: '0x'
      };

      // 2. Request Paymaster sponsorship
      const paymasterResponse = await axios.post(this.paymasterUrl, {
        jsonrpc: '2.0',
        id: 1,
        method: 'pm_sponsorUserOperation',
        params: [userOp, {
          apiKey: this.apiKey,
          entryPoint: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789'
        }]
      }, {
        headers: { 'Content-Type': 'application/json' }
      });

      userOp.paymasterAndData = paymasterResponse.data.result.paymasterAndData;
      userOp.callGasLimit = paymasterResponse.data.result.callGasLimit;
      userOp.preVerificationGas = paymasterResponse.data.result.preVerificationGas;
      userOp.verificationGasLimit = paymasterResponse.data.result.verificationGasLimit;

      // 3. Sign the UserOperation
      const privateKey = process.env.SMART_ACCOUNT_PRIVATE_KEY;
      if (!privateKey) {
        throw new Error("Smart account private key is required for signing.");
      }
      const entryPointAddress = '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789';
      const wallet = new ethers.Wallet(privateKey, this.provider);

      // Correctly calculate the UserOp hash to be signed
      const userOpHash = ethers.utils.keccak256(
        ethers.utils.defaultAbiCoder.encode(
          ['address', 'uint256', 'bytes32', 'bytes32', 'uint256', 'uint256', 'uint256', 'uint256', 'uint256', 'bytes32'],
          [userOp.sender, userOp.nonce, ethers.utils.keccak256(userOp.initCode), ethers.utils.keccak256(userOp.callData), userOp.callGasLimit, userOp.verificationGasLimit, userOp.preVerificationGas, userOp.maxFeePerGas, userOp.maxPriorityFeePerGas, ethers.utils.keccak256(userOp.paymasterAndData)]
        )
      );
      const packedUserOpHash = ethers.utils.keccak256(
        ethers.utils.defaultAbiCoder.encode(
            ['bytes32', 'address', 'uint256'],
            [userOpHash, entryPointAddress, this.chainId]
        )
      );
      const signature = await wallet.signMessage(ethers.utils.arrayify(packedUserOpHash));
      userOp.signature = signature;

      // 4. Send to bundler
      const bundlerResponse = await axios.post(this.bundlerUrl, {
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_sendUserOperation',
        params: [userOp, '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789']
      }, {
        headers: { 'Content-Type': 'application/json' }
      });

      return {
        success: true,
        userOpHash: bundlerResponse.data.result,
        timestamp: Date.now(),
        status: 'SUBMITTED_TO_BUNDLER'
      };
    } catch (error) {
      console.error(`[Pimlico] Gasless withdrawal failed:`, error.message);
      throw new Error(`Gasless withdrawal failed: ${error.message}`);
    }
  }

  async getNonce(sender) {
    const response = await axios.post(this.rpcUrl, {
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_getTransactionCount',
      params: [sender, 'latest']
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
    return ethers.utils.hexlify(parseInt(response.data.result, 16));
  }
}

module.exports = PimlicoGaslessEngine;