// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@aave/core-v3/contracts/flashloan/base/FlashLoanSimpleReceiverBase.sol";
import "@aave/core-v3/contracts/interfaces/IPoolAddressesProvider.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title FlashLoanExecutor
 * @notice Executes flash loan arbitrage strategies across multiple DEXes
 * @dev Integrates with Aave V3 for flash loans and executes multi-DEX swaps
 */
contract FlashLoanExecutor is FlashLoanSimpleReceiverBase, Ownable {
    
    // Events
    event ArbitrageExecuted(
        address indexed token,
        uint256 amount,
        uint256 profit,
        uint256 timestamp
    );
    
    event EmergencyWithdrawal(
        address indexed token,
        uint256 amount,
        address indexed to
    );
    
    // State variables
    mapping(address => bool) public authorizedExecutors;
    uint256 public totalProfitGenerated;
    uint256 public totalTradesExecuted;
    bool public emergencyStop;
    
    // Modifiers
    modifier onlyAuthorized() {
        require(
            authorizedExecutors[msg.sender] || msg.sender == owner(),
            "Not authorized"
        );
        _;
    }
    
    modifier notEmergency() {
        require(!emergencyStop, "Emergency stop activated");
        _;
    }
    
    /**
     * @notice Constructor
     * @param _addressProvider Aave V3 PoolAddressesProvider address
     */
    constructor(
        IPoolAddressesProvider _addressProvider
    ) FlashLoanSimpleReceiverBase(_addressProvider) Ownable(msg.sender) {
        authorizedExecutors[msg.sender] = true;
    }
    
    /**
     * @notice Execute flash loan arbitrage
     * @param asset Token address to borrow
     * @param amount Amount to borrow
     * @param params Encoded swap path and parameters
     */
    function executeArbitrage(
        address asset,
        uint256 amount,
        bytes calldata params
    ) external onlyAuthorized notEmergency {
        
        // Request flash loan from Aave V3
        POOL.flashLoanSimple(
            address(this),
            asset,
            amount,
            params,
            0  // referral code
        );
    }
    
    /**
     * @notice Callback function called by Aave after receiving flash loan
     * @param asset The address of the flash-borrowed asset
     * @param amount The amount of the flash-borrowed asset
     * @param premium The fee of the flash-borrowed asset
     * @param initiator The address of the flashloan initiator
     * @param params The byte-encoded params passed when initiating the flashloan
     * @return True if the execution of the operation succeeds, false otherwise
     */
    function executeOperation(
        address asset,
        uint256 amount,
        uint256 premium,
        address initiator,
        bytes calldata params
    ) external override returns (bool) {
        
        // Verify caller is Aave Pool
        require(
            msg.sender == address(POOL),
            "Caller must be Aave Pool"
        );
        
        // Decode swap path from params
        (
            address[] memory path,
            address[] memory dexRouters,
            uint256[] memory minAmountsOut
        ) = abi.decode(params, (address[], address[], uint256[]));
        
        // Execute multi-DEX swap path
        uint256 finalAmount = _executeSwapPath(
            asset,
            amount,
            path,
            dexRouters,
            minAmountsOut
        );
        
        // Calculate total amount to repay (borrowed + premium)
        uint256 amountOwed = amount + premium;
        
        // Verify profitable
        require(finalAmount > amountOwed, "Arbitrage not profitable");
        
        // Calculate profit
        uint256 profit = finalAmount - amountOwed;
        
        // Update stats
        totalProfitGenerated += profit;
        totalTradesExecuted += 1;
        
        // Approve Aave Pool to pull repayment
        IERC20(asset).approve(address(POOL), amountOwed);
        
        // Emit event
        emit ArbitrageExecuted(asset, amount, profit, block.timestamp);
        
        return true;
    }
    
    /**
     * @notice Execute swap path across multiple DEXes
     * @param startToken Starting token
     * @param startAmount Starting amount
     * @param path Token swap path
     * @param dexRouters DEX router addresses for each swap
     * @param minAmountsOut Minimum amounts out for each swap
     * @return finalAmount Final amount received
     */
    function _executeSwapPath(
        address startToken,
        uint256 startAmount,
        address[] memory path,
        address[] memory dexRouters,
        uint256[] memory minAmountsOut
    ) internal returns (uint256 finalAmount) {
        
        require(path.length >= 2, "Invalid path");
        require(
            path.length - 1 == dexRouters.length,
            "Path and routers mismatch"
        );
        
        uint256 currentAmount = startAmount;
        address currentToken = startToken;
        
        // Execute each swap in the path
        for (uint256 i = 0; i < dexRouters.length; i++) {
            address tokenOut = path[i + 1];
            address router = dexRouters[i];
            uint256 minAmountOut = minAmountsOut[i];
            
            // Approve router to spend current token
            IERC20(currentToken).approve(router, currentAmount);
            
            // Execute swap (simplified - would use actual DEX interfaces)
            currentAmount = _executeSwap(
                router,
                currentToken,
                tokenOut,
                currentAmount,
                minAmountOut
            );
            
            currentToken = tokenOut;
        }
        
        return currentAmount;
    }
    
    /**
     * @notice Execute single swap on DEX
     * @param router DEX router address
     * @param tokenIn Input token
     * @param tokenOut Output token
     * @param amountIn Input amount
     * @param minAmountOut Minimum output amount
     * @return amountOut Actual output amount
     */
    function _executeSwap(
        address router,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut
    ) internal returns (uint256 amountOut) {
        
        // This is a simplified version
        // In production, would integrate with actual DEX router interfaces
        // (Uniswap V2/V3, Curve, Balancer, etc.)
        
        // For now, return amountIn as placeholder
        // Real implementation would call router.swapExactTokensForTokens()
        return amountIn;
    }
    
    /**
     * @notice Add authorized executor
     * @param executor Address to authorize
     */
    function addAuthorizedExecutor(address executor) external onlyOwner {
        authorizedExecutors[executor] = true;
    }
    
    /**
     * @notice Remove authorized executor
     * @param executor Address to remove
     */
    function removeAuthorizedExecutor(address executor) external onlyOwner {
        authorizedExecutors[executor] = false;
    }
    
    /**
     * @notice Emergency stop toggle
     */
    function toggleEmergencyStop() external onlyOwner {
        emergencyStop = !emergencyStop;
    }
    
    /**
     * @notice Emergency withdrawal of tokens
     * @param token Token address (address(0) for ETH)
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(
        address token,
        uint256 amount
    ) external onlyOwner {
        
        if (token == address(0)) {
            // Withdraw ETH
            payable(owner()).transfer(amount);
        } else {
            // Withdraw ERC20
            IERC20(token).transfer(owner(), amount);
        }
        
        emit EmergencyWithdrawal(token, amount, owner());
    }
    
    /**
     * @notice Get contract stats
     * @return profit Total profit generated
     * @return trades Total trades executed
     * @return stopped Emergency stop status
     */
    function getStats() external view returns (
        uint256 profit,
        uint256 trades,
        bool stopped
    ) {
        return (totalProfitGenerated, totalTradesExecuted, emergencyStop);
    }
    
    // Allow contract to receive ETH
    receive() external payable {}
}
