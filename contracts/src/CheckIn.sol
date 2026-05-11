// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Daily check-in on Base — user pays gas only; no ETH acceptance.
contract CheckIn {
    uint256 public constant CHECK_IN_FEE = 0;

    mapping(address => uint256) public lastCheckInDayIndex;
    mapping(address => uint256) public currentStreak;

    event CheckedIn(address indexed user, uint256 dayIndex, uint256 streak);

    error EtherNotAccepted();
    error AlreadyCheckedInToday();

    /// @dev Unix day index consistent with Prometheus / wagmi helpers: floor(timestamp / 1 days).
    function dayIndex() public view returns (uint256) {
        return block.timestamp / 1 days;
    }

    function checkIn() external payable {
        if (msg.value != 0) revert EtherNotAccepted();

        uint256 today = dayIndex();
        uint256 last = lastCheckInDayIndex[msg.sender];
        uint256 streak = currentStreak[msg.sender];

        if (last != 0 && last == today) revert AlreadyCheckedInToday();

        if (last == 0) {
            streak = 1;
        } else if (today == last + 1) {
            unchecked {
                streak += 1;
            }
        } else {
            streak = 1;
        }

        lastCheckInDayIndex[msg.sender] = today;
        currentStreak[msg.sender] = streak;

        emit CheckedIn(msg.sender, today, streak);
    }
}
