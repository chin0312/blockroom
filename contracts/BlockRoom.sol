// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";

/// @title BlockRoom
/// @notice Wallet-signed, self-attested focus sessions and non-transferable achievement badges.
/// @dev Timestamps and duration are supplied by the caller. The contract validates consistency,
///      but it cannot prove that the caller was genuinely focused or continuously present.
contract BlockRoom is ERC1155 {
    uint64 public constant MIN_SESSION_DURATION = 30 minutes;
    uint64 public constant MAX_FUTURE_DRIFT = 5 minutes;
    uint64 public constant FOCUS_24_HOURS = 24 hours;

    uint256 public constant FIRST_SESSION_BADGE = 1;
    uint256 public constant FOCUS_24_HOURS_BADGE = 2;

    string public constant name = "BlockRoom Achievements";
    string public constant symbol = "BRBADGE";

    struct Session {
        address owner;
        bytes32 roomId;
        uint64 startedAt;
        uint64 endedAt;
        uint64 durationSeconds;
        uint64 recordedAt;
    }

    mapping(bytes32 sessionId => Session) private _sessions;
    mapping(address owner => bytes32[]) private _sessionIds;
    mapping(address owner => uint256) public totalCompletedSessions;
    mapping(address owner => uint256) public totalCumulativeDuration;

    error ZeroSessionId();
    error ZeroRoomId();
    error SessionAlreadyRecorded(bytes32 sessionId);
    error InvalidSessionTimes();
    error SessionTooShort(uint64 supplied, uint64 minimum);
    error InconsistentDuration(uint64 supplied, uint64 expected);
    error EndTimeTooFarInFuture(uint64 endedAt, uint64 maximum);
    error InvalidBadge(uint256 badgeId);
    error BadgeNotEligible(uint256 badgeId);
    error BadgeAlreadyClaimed(uint256 badgeId);
    error Soulbound();

    event SessionRecorded(
        address indexed owner,
        bytes32 indexed sessionId,
        bytes32 indexed roomId,
        uint64 startedAt,
        uint64 endedAt,
        uint64 durationSeconds,
        uint64 recordedAt
    );
    event BadgeClaimed(address indexed owner, uint256 indexed badgeId);

    constructor() ERC1155("") {}

    function recordSession(
        bytes32 sessionId,
        bytes32 roomId,
        uint64 startedAt,
        uint64 endedAt,
        uint64 durationSeconds
    ) external {
        if (sessionId == bytes32(0)) revert ZeroSessionId();
        if (roomId == bytes32(0)) revert ZeroRoomId();
        if (_sessions[sessionId].owner != address(0)) revert SessionAlreadyRecorded(sessionId);
        if (startedAt == 0 || endedAt <= startedAt) revert InvalidSessionTimes();
        if (durationSeconds < MIN_SESSION_DURATION) {
            revert SessionTooShort(durationSeconds, MIN_SESSION_DURATION);
        }

        uint64 expectedDuration = endedAt - startedAt;
        if (durationSeconds != expectedDuration) {
            revert InconsistentDuration(durationSeconds, expectedDuration);
        }

        uint64 maximumEndTime = uint64(block.timestamp) + MAX_FUTURE_DRIFT;
        if (endedAt > maximumEndTime) {
            revert EndTimeTooFarInFuture(endedAt, maximumEndTime);
        }

        uint64 recordedAt = uint64(block.timestamp);
        _sessions[sessionId] = Session({
            owner: msg.sender,
            roomId: roomId,
            startedAt: startedAt,
            endedAt: endedAt,
            durationSeconds: durationSeconds,
            recordedAt: recordedAt
        });
        _sessionIds[msg.sender].push(sessionId);
        totalCompletedSessions[msg.sender] += 1;
        totalCumulativeDuration[msg.sender] += durationSeconds;

        emit SessionRecorded(
            msg.sender,
            sessionId,
            roomId,
            startedAt,
            endedAt,
            durationSeconds,
            recordedAt
        );
    }

    function isSessionRecorded(bytes32 sessionId) external view returns (bool) {
        return _sessions[sessionId].owner != address(0);
    }

    function getSession(bytes32 sessionId) external view returns (Session memory) {
        return _sessions[sessionId];
    }

    function getSessionIds(address owner) external view returns (bytes32[] memory) {
        return _sessionIds[owner];
    }

    function isBadgeEligible(address owner, uint256 badgeId) public view returns (bool) {
        if (badgeId == FIRST_SESSION_BADGE) return totalCompletedSessions[owner] >= 1;
        if (badgeId == FOCUS_24_HOURS_BADGE) return totalCumulativeDuration[owner] >= FOCUS_24_HOURS;
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
