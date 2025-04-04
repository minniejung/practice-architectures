// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "./AbstractVault.sol";
import "./VaultLib.sol";
import "./IVaultAdmin.sol";

contract InterestVault is AbstractVault, IVaultAdmin {
    using VaultLib for uint256;

    address public owner;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
        interestRate = 5; // default 5% APR
    }

    function setInterestRate(uint256 newRate) external override onlyOwner {
        interestRate = newRate;
    }

    function stake() external payable override {
        require(msg.value > 0, "Must stake > 0");
        require(stakes[msg.sender].amount == 0, "Already staked");

        stakes[msg.sender] = Stake(msg.value, block.timestamp);
        emit Staked(msg.sender, msg.value, block.timestamp);
    }

    function withdraw(uint256 amount) external override {
        Stake memory userStake = stakes[msg.sender];
        require(userStake.amount >= amount, "Insufficient staked amount");
        require(
            block.timestamp >= userStake.timestamp + lockPeriod,
            "Staking period not met"
        );

        uint256 interest = VaultLib.calculateInterest(
            amount,
            interestRate,
            block.timestamp - userStake.timestamp
        );
        uint256 payout = amount + interest;

        stakes[msg.sender].amount -= amount;
        if (stakes[msg.sender].amount == 0) {
            delete stakes[msg.sender];
        }

        (bool success, ) = msg.sender.call{value: payout}("");
        require(success, "Transfer failed");

        emit Withdrawn(msg.sender, amount, interest);
    }

    receive() external payable {}
}
