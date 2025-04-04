// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

interface IVaultAdmin {
    /// @notice Allows the admin to set a new interest rate
    /// @param newRate The new annual interest rate (e.g., 5 for 5%)
    function setInterestRate(uint256 newRate) external;
}
