// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

library VaultLib {
    /// @notice Calculates interest on a principal amount over time
    /// @param principal The amount staked
    /// @param annualRate Annual interest rate in percentage (e.g., 5 for 5%)
    /// @param duration Duration in seconds for which interest is calculated
    /// @return The interest amount earned
    function calculateInterest(
        uint256 principal,
        uint256 annualRate,
        uint256 duration
    ) internal pure returns (uint256) {
        // Interest = (principal * rate * time) / (100 * year)
        uint256 SECONDS_IN_YEAR = 365 * 24 * 60 * 60;
        return (principal * annualRate * duration) / (100 * SECONDS_IN_YEAR);
    }
}
