// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "@balancer-labs/v2-vault/contracts/interfaces/IVault.sol";

/**
 * @title FlashLoanReceiver
 * @dev Implements Aave V3 IFlashLoanReceiver interface for arbitrage execution
 * Supports atomic arbitrage between Uniswap V3 and Balancer
 */
contract FlashLoanReceiver {
    using SafeERC20 for IERC20;

    // Aave V3 Flash Loan interfaces
    address public immutable AAVE_POOL;

    // DEX interfaces
    ISwapRouter public immutable uniswapRouter;
    IVault public immutable balancerVault;

    // Owner for emergency functions
    address public owner;

    // Constants
    uint256 private constant MAX_UINT = type(uint256).max;

    // Events
    event ArbitrageExecuted(
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 profit,
        uint256 gasUsed
    );

    event FlashLoanReceived(
        address indexed asset,
        uint256 amount,
        uint256 premium
    );

    constructor(
        address _aavePool,
        address _uniswapRouter,
        address _balancerVault
    ) {
        AAVE_POOL = _aavePool;
        uniswapRouter = ISwapRouter(_uniswapRouter);
        balancerVault = IVault(_balancerVault);
        owner = msg.sender;
    }

    /**
     * @dev Aave V3 flash loan callback - executes arbitrage logic
     * @param asset The address of the flash-borrowed asset
     * @param amount The amount flash-borrowed
     * @param premium The fee flash-borrowed
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
    ) external returns (bool) {
        require(msg.sender == AAVE_POOL, "Caller must be Aave Pool");
        require(initiator == address(this), "Initiator must be this contract");

        emit FlashLoanReceived(asset, amount, premium);

        // Decode arbitrage parameters
        (
            address tokenOut,
            uint256 amountOutMin,
            bytes memory uniswapPath,
            bytes memory balancerData,
            bool useBalancerFirst
        ) = abi.decode(params, (address, uint256, bytes, bytes, bool));

        uint256 profit;

        if (useBalancerFirst) {
            // Balancer -> Uniswap arbitrage
            profit = _executeBalancerToUniswapArbitrage(
                asset,
                tokenOut,
                amount,
                amountOutMin,
                balancerData,
                uniswapPath
            );
        } else {
            // Uniswap -> Balancer arbitrage
            profit = _executeUniswapToBalancerArbitrage(
                asset,
                tokenOut,
                amount,
                amountOutMin,
                uniswapPath,
                balancerData
            );
        }

        // Ensure we have enough to repay the loan + premium
        uint256 totalRepayment = amount + premium;
        require(
            IERC20(asset).balanceOf(address(this)) >= totalRepayment,
            "Insufficient funds to repay flash loan"
        );

        // Approve Aave Pool to pull the repayment
        IERC20(asset).approve(AAVE_POOL, totalRepayment);

        emit ArbitrageExecuted(asset, tokenOut, amount, profit, gasleft());

        return true;
    }

    /**
     * @dev Execute Uniswap -> Balancer arbitrage
     */
    function _executeUniswapToBalancerArbitrage(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOutMin,
        bytes memory uniswapPath,
        bytes memory balancerData
    ) internal returns (uint256 profit) {
        uint256 initialBalance = IERC20(tokenIn).balanceOf(address(this));

        // Step 1: Swap tokenIn -> tokenOut on Uniswap
        uint256 uniswapAmountOut = _swapOnUniswap(
            tokenIn,
            tokenOut,
            amountIn,
            uniswapPath
        );

        // Step 2: Swap tokenOut -> tokenIn on Balancer
        uint256 balancerAmountOut = _swapOnBalancer(
            tokenOut,
            tokenIn,
            uniswapAmountOut,
            balancerData
        );

        // Calculate profit (final balance - initial balance)
        uint256 finalBalance = IERC20(tokenIn).balanceOf(address(this));
        require(finalBalance > initialBalance, "No profit from arbitrage");

        profit = finalBalance - initialBalance;
        require(profit >= amountOutMin, "Profit below minimum threshold");
    }

    /**
     * @dev Execute Balancer -> Uniswap arbitrage
     */
    function _executeBalancerToUniswapArbitrage(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOutMin,
        bytes memory balancerData,
        bytes memory uniswapPath
    ) internal returns (uint256 profit) {
        uint256 initialBalance = IERC20(tokenIn).balanceOf(address(this));

        // Step 1: Swap tokenIn -> tokenOut on Balancer
        uint256 balancerAmountOut = _swapOnBalancer(
            tokenIn,
            tokenOut,
            amountIn,
            balancerData
        );

        // Step 2: Swap tokenOut -> tokenIn on Uniswap
        uint256 uniswapAmountOut = _swapOnUniswap(
            tokenOut,
            tokenIn,
            balancerAmountOut,
            uniswapPath
        );

        // Calculate profit
        uint256 finalBalance = IERC20(tokenIn).balanceOf(address(this));
        require(finalBalance > initialBalance, "No profit from arbitrage");

        profit = finalBalance - initialBalance;
        require(profit >= amountOutMin, "Profit below minimum threshold");
    }

    /**
     * @dev Execute swap on Uniswap V3
     */
    function _swapOnUniswap(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        bytes memory path
    ) internal returns (uint256 amountOut) {
        // Approve Uniswap router
        IERC20(tokenIn).approve(address(uniswapRouter), amountIn);

        // Execute swap
        ISwapRouter.ExactInputParams memory params = ISwapRouter.ExactInputParams({
            path: path,
            recipient: address(this),
            deadline: block.timestamp + 300, // 5 minutes
            amountIn: amountIn,
            amountOutMinimum: 0 // Set by arbitrage logic
        });

        amountOut = uniswapRouter.exactInput(params);
    }

    /**
     * @dev Execute swap on Balancer
     */
    function _swapOnBalancer(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        bytes memory swapData
    ) internal returns (uint256 amountOut) {
        // Decode Balancer swap data
        (
            bytes32 poolId,
            uint256 limit,
            uint256 deadline,
            uint256[] memory funds
        ) = abi.decode(swapData, (bytes32, uint256, uint256, uint256[]));

        // Approve Balancer vault
        IERC20(tokenIn).approve(address(balancerVault), amountIn);

        // Prepare single swap
        IVault.SingleSwap memory singleSwap = IVault.SingleSwap({
            poolId: poolId,
            kind: IVault.SwapKind.GIVEN_IN,
            assetIn: tokenIn,
            assetOut: tokenOut,
            amount: amountIn,
            userData: ""
        });

        IVault.FundManagement memory fundsMgmt = IVault.FundManagement({
            sender: address(this),
            fromInternalBalance: false,
            recipient: address(this),
            toInternalBalance: false
        });

        // Execute swap
        amountOut = balancerVault.swap(singleSwap, fundsMgmt, limit, deadline);
    }

    /**
     * @dev Emergency withdrawal function
     */
    function emergencyWithdraw(address token, uint256 amount) external {
        require(msg.sender == owner, "Only owner can withdraw");
        IERC20(token).safeTransfer(owner, amount);
    }

    /**
     * @dev Transfer ownership
     */
    function transferOwnership(address newOwner) external {
        require(msg.sender == owner, "Only owner can transfer");
        owner = newOwner;
    }

    /**
     * @dev Get contract balance for a token
     */
    function getBalance(address token) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }

    /**
     * @dev Receive function to accept ETH
     */
    receive() external payable {}
}
