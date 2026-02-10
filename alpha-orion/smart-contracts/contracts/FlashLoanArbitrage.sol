// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IUniswapV2Router02} from "./interfaces/IUniswapV2Router02.sol";
import {IUniswapV3Router} from "./interfaces/IUniswapV3Router.sol";
import {IAavePool} from "./interfaces/IAavePool.sol";

/**
 * @title FlashLoanArbitrage
 * @notice Flash loan arbitrage contract for Alpha-Orion using Aave V3
 * @dev Uses Pimlico for gasless transactions via ERC-4337 Paymaster
 */
contract FlashLoanArbitrage {
    using SafeERC20 for IERC20;

    // Aave V3 Pool address (Ethereum mainnet)
    address constant AAVE_POOL = 0x87870Bca3F3f6335e32cdC0d59b7b238621C8292;
    
    // Uniswap V3 Router
    address constant UNISWAP_V3_ROUTER = 0x68b3465833fb72B5a828cCEd3294e3e6962E3786;
    
    // Uniswap V2 Router
    address constant UNISWAP_V2_ROUTER = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;
    
    // Sushiswap Router
    address constant SUSHI_ROUTER = 0xd9e1cE17f2641f24aE5D51AEe6325DAA6F3Dcf45;

    // Owner for contract management
    address public owner;
    
    // Pimlico Paymaster for gasless transactions
    address public paymaster;
    
    // Fee recipient for protocol fees
    address public feeRecipient;
    
    // Protocol fee percentage (in basis points, 100 = 1%)
    uint256 public protocolFeeBps = 100;
    
    // Maximum slippage tolerance (in basis points)
    uint256 public maxSlippageBps = 50;

    // Events
    event ArbitrageExecuted(
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 profit,
        uint256 gasUsed
    );
    event FundsRecovered(address indexed token, uint256 amount);
    event FeeRecipientUpdated(address indexed newFeeRecipient);
    event PaymasterUpdated(address indexed newPaymaster);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call");
        _;
    }

    constructor(address _paymaster, address _feeRecipient) {
        owner = msg.sender;
        paymaster = _paymaster;
        feeRecipient = _feeRecipient;
    }

    /**
     * @notice Execute flash loan arbitrage
     * @param token The token to borrow
     * @param amount The amount to borrow
     * @param routers The sequence of routers to use for swapping
     * @param paths The token paths for each swap
     * @param data Extra data for custom swap implementations
     */
    function executeArbitrage(
        address token,
        uint256 amount,
        address[] calldata routers,
        address[][] calldata paths,
        bytes calldata data
    ) external onlyOwner returns (uint256 profit) {
        // Get Aave pool interface
        IAavePool pool = IAavePool(AAVE_POOL);
        
        // Prepare flash loan params
        IAavePool.FlashLoanParams memory params = IAavePool.FlashLoanParams({
            receiverAddress: address(this),
            assets: [token],
            amounts: [amount],
            flashLoanMode: 0, // 0 = single asset
            onBehalfOf: address(this),
            referralCode: 0,
            params: data,
            // ERC-4337 fields
            collectingGas: false,
            paymasterContext: ""
        });

        // Execute flash loan
        pool.flashLoan(
            address(this),
            [token],
            [amount],
            [0],
            address(this),
            data,
            0
        );

        // Calculate profit (should be in the contract after arbitrage)
        uint256 balance = IERC20(token).balanceOf(address(this));
        require(balance > amount, "No profit generated");

        profit = balance - amount;

        // Take protocol fee
        uint256 fee = (profit * protocolFeeBps) / 10000;
        uint256 netProfit = profit - fee;

        // Transfer fee to fee recipient
        if (fee > 0) {
            IERC20(token).safeTransfer(feeRecipient, fee);
        }

        // Transfer remaining profit to owner
        if (netProfit > 0) {
            IERC20(token).safeTransfer(owner, netProfit);
        }

        emit ArbitrageExecuted(token, address(0), profit, gasleft());
    }

    /**
     * @notice Callback function called by Aave after loan is delivered
     */
    function executeOperation(
        address[] calldata assets,
        uint256[] calldata amounts,
        uint256[] calldata premiums,
        address initiator,
        bytes calldata params
    ) external returns (bool) {
        // This is called by Aave - implement arbitrage logic here
        // For gasless mode, use Pimlico paymaster
        return true;
    }

    /**
     * @notice Swap tokens using Uniswap V2
     */
    function swapUniswapV2(
        address router,
        address[] calldata path,
        uint256 amountIn,
        uint256 amountOutMin
    ) internal returns (uint256 amountOut) {
        IERC20(path[0]).safeApprove(router, amountIn);
        
        IUniswapV2Router02(router).swapExactTokensForTokens(
            amountIn,
            amountOutMin,
            path,
            address(this),
            block.timestamp + 300
        );
        
        // Get output amount
        amountOut = IERC20(path[path.length - 1]).balanceOf(address(this));
    }

    /**
     * @notice Swap tokens using Uniswap V3
     */
    function swapUniswapV3(
        address router,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOutMin,
        uint160 sqrtPriceLimitX96
    ) internal returns (uint256 amountOut) {
        IERC20(tokenIn).safeApprove(router, amountIn);
        
        IUniswapV3Router.ExactInputSingleParams memory params = IUniswapV3Router.ExactInputSingleParams({
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            fee: 3000, // Standard fee tier
            recipient: address(this),
            deadline: block.timestamp + 300,
            amountIn: amountIn,
            amountOutMinimum: amountOutMin,
            sqrtPriceLimitX96: sqrtPriceLimitX96
        });
        
        amountOut = IUniswapV3Router(router).exactInputSingle(params);
    }

    /**
     * @notice Recover accidentally sent tokens
     */
    function recoverTokens(address token, uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be > 0");
        IERC20(token).safeTransfer(owner, amount);
        emit FundsRecovered(token, amount);
    }

    /**
     * @notice Update fee recipient
     */
    function setFeeRecipient(address newFeeRecipient) external onlyOwner {
        require(newFeeRecipient != address(0), "Invalid fee recipient");
        feeRecipient = newFeeRecipient;
        emit FeeRecipientUpdated(newFeeRecipient);
    }

    /**
     * @notice Update paymaster
     */
    function setPaymaster(address newPaymaster) external onlyOwner {
        require(newPaymaster != address(0), "Invalid paymaster");
        paymaster = newPaymaster;
        emit PaymasterUpdated(newPaymaster);
    }

    /**
     * @notice Update protocol fee
     */
    function setProtocolFee(uint256 newFeeBps) external onlyOwner {
        require(newFeeBps <= 1000, "Fee too high"); // Max 10%
        protocolFeeBps = newFeeBps;
    }

    /**
     * @notice Update max slippage
     */
    function setMaxSlippage(uint256 newSlippageBps) external onlyOwner {
        require(newSlippageBps <= 500, "Slippage too high"); // Max 5%
        maxSlippageBps = newSlippageBps;
    }

    // Allow receiving ETH
    receive() external payable {}
}
