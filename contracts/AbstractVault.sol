// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

abstract contract AbstractVault {
    struct Stake {
        uint256 amount;
        uint256 timestamp;
    }

    mapping(address => Stake) internal stakes;
    uint256 public interestRate;
    uint256 public lockPeriod = 60; // seconds

    event Staked(address indexed user, uint256 amount, uint256 timestamp);
    event Withdrawn(address indexed user, uint256 principal, uint256 interest);

    function stake() external payable virtual;
    function withdraw(uint256 amount) external virtual;

    function getStakedAmount() external view returns (uint256) {
        return stakes[msg.sender].amount;
    }

    function getStakeTimestamp() external view returns (uint256) {
        return stakes[msg.sender].timestamp;
    }
}
