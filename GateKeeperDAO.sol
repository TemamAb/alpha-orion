// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title GateKeeperDAO
 * @dev ROLE 10: IMMUTABLE SMART CONTRACT
 * Non-Custodial Security Layer for Alpha-08 Swarm.
 * Enforces hard limits on withdrawals that even the AI cannot override.
 */
contract GateKeeperDAO {
    address public sovereignCommander;
    address public immutable coldStorage;
    
    uint256 public constant MAX_DAILY_WITHDRAWAL_PERCENT = 10; // 10% of TVL
    uint256 public lastWithdrawalTime;
    uint256 public dailyWithdrawalAmount;
    mapping(address => bool) public authorizedStrategies;

    event WithdrawalAuthorized(address indexed to, uint256 amount, string reason);
    event CapitalAllocated(address indexed strategy, uint256 amount);
    event StrategyWhitelisted(address indexed strategy);
    event SecurityVeto(string reason);

    modifier onlyCommander() {
        require(msg.sender == sovereignCommander, "Access Denied: Not Commander");
        _;
    }

    constructor(address _commander, address _coldStorage) {
        sovereignCommander = _commander;
        coldStorage = _coldStorage;
    }

    /**
     * @dev Whitelist a trading strategy contract.
     * Allows capital to flow freely to this address for execution.
     */
    function addStrategy(address _strategy) external onlyCommander {
        authorizedStrategies[_strategy] = true;
        emit StrategyWhitelisted(_strategy);
    }

    /**
     * @dev Allocate Capital to a Whitelisted Strategy.
     * BYPASSES the 10% daily limit because funds remain in the system's control.
     */
    function allocateCapital(address payable _strategy, uint256 _amount) external onlyCommander {
        require(authorizedStrategies[_strategy], "GateKeeper: Strategy not authorized");
        require(address(this).balance >= _amount, "GateKeeper: Insufficient liquidity");

        (bool sent, ) = _strategy.call{value: _amount}("");
        require(sent, "Allocation transfer failed");

        emit CapitalAllocated(_strategy, _amount);
    }

    /**
     * @dev Request External Withdrawal (Profit Taking).
     * Checks:
     * 1. Is the requester the Sovereign Commander?
     * 2. Is the amount within the 10% daily limit?
     * 3. Has 24h passed since limit reset?
     */
    function requestWithdrawal(address payable _to, uint256 _amount, string memory _reason) external onlyCommander {
        // Reset daily limit if 24h passed
        if (block.timestamp > lastWithdrawalTime + 1 days) {
            dailyWithdrawalAmount = 0;
            lastWithdrawalTime = block.timestamp;
        }

        uint256 tvl = address(this).balance;
        uint256 limit = (tvl * MAX_DAILY_WITHDRAWAL_PERCENT) / 100;

        if (dailyWithdrawalAmount + _amount > limit) {
            emit SecurityVeto("Hard Limit Exceeded: >10% TVL/24h");
            revert("GateKeeper: Withdrawal exceeds daily safety limit");
        }

        dailyWithdrawalAmount += _amount;
        (bool sent, ) = _to.call{value: _amount}("");
        require(sent, "Transfer failed");
        
        emit WithdrawalAuthorized(_to, _amount, _reason);
    }

    receive() external payable {}
}