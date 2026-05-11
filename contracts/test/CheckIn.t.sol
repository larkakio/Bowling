// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {CheckIn} from "../src/CheckIn.sol";

contract CheckInTest is Test {
    CheckIn public c;
    address alice = address(0xA11CE);

    function setUp() public {
        c = new CheckIn();
        vm.warp(420 * 1 days); // stable day boundaries for assertions
    }

    function test_checkIn_happyPath_emitsEvent() public {
        vm.startPrank(alice);
        vm.expectEmit(true, true, true, true);
        emit CheckIn.CheckedIn(alice, block.timestamp / 1 days, 1);
        c.checkIn();
        vm.stopPrank();
        assertEq(c.currentStreak(alice), 1);
    }

    function test_revert_on_value() public {
        vm.deal(alice, 1 ether);
        vm.startPrank(alice);
        vm.expectRevert(CheckIn.EtherNotAccepted.selector);
        c.checkIn{value: 1 wei}();
        vm.stopPrank();
    }

    function test_revert_same_day() public {
        vm.startPrank(alice);
        c.checkIn();
        vm.expectRevert(CheckIn.AlreadyCheckedInToday.selector);
        c.checkIn();
        vm.stopPrank();
    }

    function test_streak_consecutive_days() public {
        vm.startPrank(alice);
        c.checkIn();
        vm.warp(421 * 1 days);
        c.checkIn();
        assertEq(c.currentStreak(alice), 2);
        vm.warp(422 * 1 days);
        c.checkIn();
        assertEq(c.currentStreak(alice), 3);
        vm.stopPrank();
    }

    function test_streak_resets_after_gap() public {
        vm.startPrank(alice);
        c.checkIn();
        vm.warp(421 * 1 days);
        c.checkIn();
        vm.warp(424 * 1 days); // skip one day relative to streak
        c.checkIn();
        assertEq(c.currentStreak(alice), 1);
        vm.stopPrank();
    }
}
