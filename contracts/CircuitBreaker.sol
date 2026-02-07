// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Alpha-08 Sovereign Circuit Breaker
 * @dev Elite-tier emergency kill-switch with multi-agent authorization.
 * Integrated with the Alpha-08 Sovereign Hub for automated risk mitigation.
 */
contract CircuitBreaker {
    // IMMUTABLES & STORAGE
    address public immutable primaryAdmin;
    mapping(address => bool) public authorizedAgents;
    bool private _paused;
    
    // AUDIT LOGGING
    string public lastPauseReason;
    uint256 public lastActionTimestamp;

    event SystemPaused(address indexed by, string reason);
    event SystemResumed(address indexed by);
    event AgentAuthorized(address indexed agent);
    event AgentRevoked(address indexed agent);

    constructor() {
        primaryAdmin = msg.sender;
        authorizedAgents[msg.sender] = true;
        _paused = false;
    }

    modifier onlyAuthorized() {
        require(authorizedAgents[msg.sender], "SOVEREIGN: AGENT_NOT_AUTHORIZED");
        _;
    }

    modifier onlyPrimary() {
        require(msg.sender == primaryAdmin, "SOVEREIGN: PRIMARY_ADMIN_ONLY");
        _;
    }

    /**
     * @dev Check system status. Used by FlashArbExecutor for zero-gas gating.
     */
    function isPaused() external view returns (bool) {
        return _paused;
    }

    /**
     * @dev Emergency Halt. Can be called by Primary Admin or authorized AI Agent.
     */
    function pause(string calldata reason) external onlyAuthorized {
        _paused = true;
        lastPauseReason = reason;
        lastActionTimestamp = block.timestamp;
        emit SystemPaused(msg.sender, reason);
    }

    /**
     * @dev Resume operations. Only Primary Admin can resume to ensure human oversight.
     */
    function resume() external onlyPrimary {
        _paused = false;
        lastActionTimestamp = block.timestamp;
        emit SystemResumed(msg.sender);
    }

    /**
     * @dev Authorize a sub-agent (e.g., the Alpha-08 GCP AI Service Account).
     */
    function authorizeAgent(address agent) external onlyPrimary {
        authorizedAgents[agent] = true;
        emit AgentAuthorized(agent);
    }

    /**
     * @dev Revoke a sub-agent's authority.
     */
    function revokeAgent(address agent) external onlyPrimary {
        authorizedAgents[agent] = false;
        emit AgentRevoked(agent);
    }
}
