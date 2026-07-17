// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";

interface IBlockRoomSessions {
    function totalCompletedSessions(address owner) external view returns (uint256);
    function totalCumulativeDuration(address owner) external view returns (uint256);
}

/// @title BlockRoom Badges
/// @notice Two non-transferable achievements backed by confirmed Session totals.
contract BlockRoomBadges is ERC1155 {
    uint256 public constant FIRST_SESSION_BADGE = 1;
    uint256 public constant FOCUS_24_HOURS_BADGE = 2;
    uint256 public constant FOCUS_24_HOURS = 24 hours;

    string public constant name = "BlockRoom Achievements";
    string public constant symbol = "BRBADGE";

    IBlockRoomSessions public immutable sessions;

    error ZeroSessionContract();
    error InvalidBadge(uint256 badgeId);
    error BadgeNotEligible(uint256 badgeId);
    error BadgeAlreadyClaimed(uint256 badgeId);
    error Soulbound();

    event BadgeClaimed(address indexed owner, uint256 indexed badgeId);

    constructor(address sessionContract) ERC1155("") {
        if (sessionContract == address(0)) revert ZeroSessionContract();
        sessions = IBlockRoomSessions(sessionContract);
    }

    function isBadgeEligible(address owner, uint256 badgeId) public view returns (bool) {
        if (badgeId == FIRST_SESSION_BADGE) {
            return sessions.totalCompletedSessions(owner) >= 1;
        }
        if (badgeId == FOCUS_24_HOURS_BADGE) {
            return sessions.totalCumulativeDuration(owner) >= FOCUS_24_HOURS;
        }
        revert InvalidBadge(badgeId);
    }

    function hasClaimedBadge(address owner, uint256 badgeId) public view returns (bool) {
        _requireValidBadge(badgeId);
        return balanceOf(owner, badgeId) == 1;
    }

    function claimBadge(uint256 badgeId) external {
        _requireValidBadge(badgeId);
        if (!isBadgeEligible(msg.sender, badgeId)) revert BadgeNotEligible(badgeId);
        if (balanceOf(msg.sender, badgeId) != 0) revert BadgeAlreadyClaimed(badgeId);

        _mint(msg.sender, badgeId, 1, "");
        emit BadgeClaimed(msg.sender, badgeId);
    }

    function uri(uint256 badgeId) public pure override returns (string memory) {
        _requireValidBadge(badgeId);
        bool firstSession = badgeId == FIRST_SESSION_BADGE;
        string memory badgeName = firstSession ? "First Session" : "24 Hour Focus";
        string memory requirement = firstSession
            ? "At least one confirmed eligible BlockRoom session"
            : "At least 86,400 seconds of confirmed BlockRoom focus time";
        string memory accent = firstSession ? "A7E5D3" : "C8B8E0";
        string memory svg = string.concat(
            '<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">',
            '<rect width="1024" height="1024" rx="160" fill="#F5F5F3"/>',
            '<circle cx="512" cy="430" r="250" fill="#', accent, '" opacity=".58"/>',
            '<circle cx="512" cy="430" r="170" fill="#FAFAF8" stroke="#0C0A09" stroke-width="10"/>',
            '<circle cx="512" cy="430" r="52" fill="#0C0A09"/>',
            '<text x="512" y="785" text-anchor="middle" font-family="Georgia,serif" font-size="68" fill="#0C0A09">',
            badgeName,
            '</text><text x="512" y="850" text-anchor="middle" font-family="Arial,sans-serif" font-size="30" fill="#4E4E4E">BlockRoom Achievement</text></svg>'
        );
        string memory image = string.concat(
            "data:image/svg+xml;base64,",
            Base64.encode(bytes(svg))
        );
        string memory json = string.concat(
            '{"name":"', badgeName,
            '","description":"A non-transferable BlockRoom focus achievement.","image":"', image,
            '","attributes":[{"trait_type":"Achievement requirement","value":"', requirement,
            '"},{"trait_type":"Brand","value":"BlockRoom"},{"trait_type":"Transferability","value":"Soulbound"}]}'
        );
        return string.concat("data:application/json;base64,", Base64.encode(bytes(json)));
    }

    function setApprovalForAll(address, bool) public pure override {
        revert Soulbound();
    }

    function _update(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory values
    ) internal override {
        if (from != address(0) && to != address(0)) revert Soulbound();
        super._update(from, to, ids, values);
    }

    function _requireValidBadge(uint256 badgeId) private pure {
        if (badgeId != FIRST_SESSION_BADGE && badgeId != FOCUS_24_HOURS_BADGE) {
            revert InvalidBadge(badgeId);
        }
    }
}
