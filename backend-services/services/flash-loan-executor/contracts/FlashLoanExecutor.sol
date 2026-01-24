// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// Flash Loan interfaces
interface IFlashLoanReceiver {
    function executeOperation(
        address asset,
        uint256 amount,
        uint256 fee,
        address initiator,
        bytes calldata params
    ) external returns (bytes32);
}

interface IFlashLoanProvider {
    function flashLoan(
        address receiver,
        address token,
        uint256 amount,
        bytes calldata params
    ) external;
}

// DEX Router interfaces
interface IUniswapV3Router {
    struct ExactInputParams {
        bytes path;
        address recipient;
        uint256 deadline;
        uint256 amountIn;
        uint256 amountOutMinimum;
    }

    struct ExactOutputParams {
        bytes path;
        address recipient;
        uint256 deadline;
        uint256 amountOut;
        uint256 amountInMaximum;
    }

    function exactInput(ExactInputParams calldata params)
        external
        payable
        returns (uint256 amountOut);

    function exactOutput(ExactOutputParams calldata params)
        external
        payable
        returns (uint256 amountIn);
}

interface IUniswapV2Router {
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);

    function getAmountsOut(uint amountIn, address[] calldata path)
        external
        view
        returns (uint[] memory amounts);
}

/**
 * FlashLoanExecutor - Production Flash Loan Arbitrage Contract
 * 
 * Supports:
 * - Multi-hop arbitrage trading
 * - Flash loan borrowing and repayment
 * - DEX routing (Uniswap V2/V3, Sushiswap)
 * - Profit extraction and transfer
 */
contract FlashLoanExecutor is IFlashLoanReceiver, ReentrancyGuard, Ownable {
    // State variables
    address public flashLoanProvider; // Aave or other FL provider
    address public uniswapV3Router = 0x68b3465833fb72B5a828cCEd3294e3e6962E3786;
    address public uniswapV2Router = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;
    
    uint256 public totalProfitGenerated;
    uint256 public totalTradesExecuted;
    
    // Execution parameters
    struct ArbitrageParams {
        address[] tokenPath;
        uint256 initialAmount;
        uint256 minProfitThreshold;
        uint256 maxSlippage; // in basis points (0-10000, where 10000 = 100%)
    }

    // Events
    event FlashLoanExecuted(
        address indexed asset,
        uint256 amount,
        uint256 fee,
        uint256 profit
    );
    
    event ArbitrageCompleted(
        address indexed initiator,
        uint256 inputAmount,
        uint256 outputAmount,
        uint256 profit,
        address[] tokenPath
    );
    
    event ProfitWithdrawn(
        address indexed recipient,
        uint256 amount
    );

    constructor(address _flashLoanProvider) {
        flashLoanProvider = _flashLoanProvider;
    }

    /**
     * Initiate flash loan for arbitrage
     */
    function flashLoanArbitrage(
        address asset,
        uint256 amount,
        address[] calldata tokenPath,
        uint256 minProfitThreshold,
        uint256 maxSlippage
    ) external onlyOwner nonReentrant returns (bool) {
        require(tokenPath.length >= 2, "Invalid token path");
        require(amount > 0, "Invalid amount");

        // Encode parameters for callback
        ArbitrageParams memory params = ArbitrageParams({
            tokenPath: tokenPath,
            initialAmount: amount,
            minProfitThreshold: minProfitThreshold,
            maxSlippage: maxSlippage
        });

        bytes memory encodedParams = abi.encode(params);

        // Initiate flash loan
        IFlashLoanProvider(flashLoanProvider).flashLoan(
            address(this),
            asset,
            amount,
            encodedParams
        );

        return true;
    }

    /**
     * Flash loan callback - Executes during flash loan
     */
    function executeOperation(
        address asset,
        uint256 amount,
        uint256 fee,
        address initiator,
        bytes calldata params
    ) external override nonReentrant returns (bytes32) {
        require(msg.sender == flashLoanProvider, "Unauthorized flash loan provider");
        require(IERC20(asset).balanceOf(address(this)) >= amount, "Flash loan failed");

        // Decode parameters
        ArbitrageParams memory arbParams = abi.decode(params, (ArbitrageParams));

        // Execute triangular arbitrage
        uint256 outputAmount = _executeArbitrage(
            arbParams.tokenPath,
            amount,
            arbParams.maxSlippage
        );

        // Calculate profit
        uint256 amountOwed = amount + fee;
        require(outputAmount >= amountOwed, "Insufficient profit to repay flash loan");

        uint256 profit = outputAmount - amountOwed;
        require(profit >= arbParams.minProfitThreshold, "Profit below threshold");

        // Approve flash loan provider for repayment
        IERC20(asset).approve(flashLoanProvider, amountOwed);

        // Update metrics
        totalProfitGenerated += profit;
        totalTradesExecuted++;

        emit FlashLoanExecuted(asset, amount, fee, profit);

        return keccak256("ERC3156FlashBorrower.onFlashLoan");
    }

    /**
     * Execute multi-hop arbitrage on DEXes
     */
    function _executeArbitrage(
        address[] memory tokenPath,
        uint256 inputAmount,
        uint256 maxSlippage
    ) internal returns (uint256 outputAmount) {
        require(tokenPath.length >= 2, "Invalid path length");

        // Step 1: Approve first hop
        IERC20(tokenPath[0]).approve(uniswapV2Router, inputAmount);

        if (tokenPath.length == 2) {
            // Direct swap
            outputAmount = _swapTokens(
                tokenPath[0],
                tokenPath[1],
                inputAmount,
                maxSlippage
            );
        } else {
            // Multi-hop swap
            outputAmount = inputAmount;
            for (uint256 i = 0; i < tokenPath.length - 1; i++) {
                address[] memory path = new address[](2);
                path[0] = tokenPath[i];
                path[1] = tokenPath[i + 1];

                outputAmount = _swapTokens(
                    path[0],
                    path[1],
                    outputAmount,
                    maxSlippage
                );

                // Approve next swap
                if (i < tokenPath.length - 2) {
                    IERC20(tokenPath[i + 1]).approve(uniswapV2Router, outputAmount);
                }
            }
        }

        emit ArbitrageCompleted(
            tx.origin,
            inputAmount,
            outputAmount,
            outputAmount > inputAmount ? outputAmount - inputAmount : 0,
            tokenPath
        );

        return outputAmount;
    }

    /**
     * Swap tokens on Uniswap V2
     */
    function _swapTokens(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 maxSlippage
    ) internal returns (uint256 amountOut) {
        IUniswapV2Router router = IUniswapV2Router(uniswapV2Router);

        address[] memory path = new address[](2);
        path[0] = tokenIn;
        path[1] = tokenOut;

        // Get minimum output with slippage protection
        uint256[] memory amounts = router.getAmountsOut(amountIn, path);
        uint256 minAmountOut = (amounts[1] * (10000 - maxSlippage)) / 10000;

        // Execute swap
        uint256[] memory results = router.swapExactTokensForTokens(
            amountIn,
            minAmountOut,
            path,
            address(this),
            block.timestamp + 300 // 5 minute deadline
        );

        return results[results.length - 1];
    }

    /**
     * Direct token swap (non-flash loan)
     */
    function swap(
        address[] calldata path,
        uint256 amountIn,
        uint256 minAmountOut
    ) external onlyOwner nonReentrant returns (uint256 amountOut) {
        require(path.length >= 2, "Invalid path");

        // Transfer tokens from caller
        IERC20(path[0]).transferFrom(msg.sender, address(this), amountIn);

        // Execute swap
        amountOut = _executeArbitrage(path, amountIn, 50); // 0.5% slippage

        // Transfer output to caller
        IERC20(path[path.length - 1]).transfer(msg.sender, amountOut);

        return amountOut;
    }

    /**
     * Withdraw profits
     */
    function withdrawProfit(address token, uint256 amount) external onlyOwner nonReentrant {
        require(amount > 0, "Invalid amount");
        require(IERC20(token).balanceOf(address(this)) >= amount, "Insufficient balance");

        IERC20(token).transfer(owner(), amount);
        emit ProfitWithdrawn(owner(), amount);
    }

    /**
     * Withdraw all profits of a token
     */
    function withdrawAllProfit(address token) external onlyOwner nonReentrant {
        uint256 balance = IERC20(token).balanceOf(address(this));
        require(balance > 0, "No balance to withdraw");

        IERC20(token).transfer(owner(), balance);
        emit ProfitWithdrawn(owner(), balance);
    }

    /**
     * Get current balance of a token
     */
    function getBalance(address token) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }

    /**
     * Get contract metrics
     */
    function getMetrics() external view returns (
        uint256 totalProfit,
        uint256 totalTrades,
        uint256 contractBalance
    ) {
        return (
            totalProfitGenerated,
            totalTradesExecuted,
            address(this).balance
        );
    }

    /**
     * Update router addresses
     */
    function setRouterAddresses(
        address _uniswapV3Router,
        address _uniswapV2Router
    ) external onlyOwner {
        uniswapV3Router = _uniswapV3Router;
        uniswapV2Router = _uniswapV2Router;
    }

    /**
     * Emergency function to recover stuck tokens
     */
    function emergencyWithdraw(address token) external onlyOwner {
        uint256 balance = IERC20(token).balanceOf(address(this));
        if (balance > 0) {
            IERC20(token).transfer(owner(), balance);
        }
    }

    // Allow contract to receive ETH
    receive() external payable {}
}
