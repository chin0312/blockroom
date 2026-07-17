// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title BlockRoom Sessions
/// @notice Stores wallet-signed, self-attested focus-session records.
/// @dev Client-supplied timestamps are validated for consistency only. This
///      contract cannot prove that a wallet owner was focused or present.
contract BlockRoomSessions {
    uint64 public constant MIN_SESSION_DURATION = 30 minutes;
    uint64 public constant MAX_FUTURE_DRIFT = 5 minutes;

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

    event SessionRecorded(
        address indexed owner,
        bytes32 indexed sessionId,
        bytes32 indexed roomId,
        uint64 startedAt,
        uint64 endedAt,
        uint64 durationSeconds,
        uint64 recordedAt
    );

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
}
