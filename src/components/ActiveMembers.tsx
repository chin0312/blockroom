"use client";

import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  MicrophoneSlash,
  MonitorArrowUp,
  PushPin,
  PushPinSlash,
  UserCircle,
  VideoCamera,
} from "@phosphor-icons/react";
import { motion, useReducedMotion } from "motion/react";
import { getChainConfig } from "@/config/chains";
import { clampParticipantPage, participantPageSize } from "@/lib/room-presence";
import { shortAddress, type RoomParticipant } from "@/lib/realtime-types";

type ActiveMembersProps = {
  members: RoomParticipant[];
  currentAddress?: string;
  localStream?: MediaStream | null;
  remoteStreams?: Record<string, MediaStream>;
};

const statusLabel = {
  focusing: "Focusing",
  paused: "Paused",
  available: "In space",
};

function StreamPlayer({ stream, muted, video }: { stream: MediaStream; muted: boolean; video: boolean }) {
  const mediaRef = useRef<HTMLMediaElement | null>(null);

  useLayoutEffect(() => {
    const node = mediaRef.current;
    if (!node) return;
    if (node.srcObject !== stream) node.srcObject = stream;

    const resumePlayback = () => {
      void node.play().catch(() => {
        // Browsers can briefly defer autoplay while entering fullscreen.
        // The loadeddata/canplay events below retry without replacing srcObject.
      });
    };

    resumePlayback();
    node.addEventListener("loadeddata", resumePlayback);
    node.addEventListener("canplay", resumePlayback);
    return () => {
      node.removeEventListener("loadeddata", resumePlayback);
      node.removeEventListener("canplay", resumePlayback);
      if (node.srcObject === stream) node.srcObject = null;
    };
  }, [muted, stream, video]);

  if (!video) return <audio ref={mediaRef as React.RefObject<HTMLAudioElement | null>} autoPlay muted={muted} />;
  return <video ref={mediaRef as React.RefObject<HTMLVideoElement | null>} autoPlay muted={muted} playsInline preload="auto" />;
}

function useSpeakingActivity(stream: MediaStream | null | undefined, enabled: boolean) {
  const [activity, setActivity] = useState({ speaking: false, level: 0 });

  useEffect(() => {
    const audioTrack = stream?.getAudioTracks().find((track) => track.readyState === "live");
    if (!audioTrack || !enabled) {
      queueMicrotask(() => setActivity({ speaking: false, level: 0 }));
      return;
    }

    const AudioContextClass = window.AudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();
    const analyser = context.createAnalyser();
    const source = context.createMediaStreamSource(new MediaStream([audioTrack]));
    const samples = new Float32Array(analyser.fftSize);
    let animationFrame = 0;
    let speakingFrames = 0;
    let quietFrames = 0;
    let lastState = false;
    let smoothedLevel = 0;
    let noiseFloor = 0.008;
    let lastPublishedLevel = 0;
    let lastPublishedAt = 0;

    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.82;
    source.connect(analyser);
    void context.resume().catch(() => undefined);

    const measure = () => {
      analyser.getFloatTimeDomainData(samples);
      let squareSum = 0;
      for (const sample of samples) {
        squareSum += sample * sample;
      }
      const rms = Math.sqrt(squareSum / samples.length);
      smoothedLevel = smoothedLevel * 0.72 + rms * 0.28;
      const threshold = Math.max(0.018, Math.min(0.075, noiseFloor * 2.4 + 0.006));
      if (smoothedLevel < threshold) noiseFloor = noiseFloor * 0.97 + smoothedLevel * 0.03;

      if (smoothedLevel > threshold) {
        speakingFrames += 1;
        quietFrames = 0;
      } else {
        quietFrames += 1;
        speakingFrames = 0;
      }
      const nextState = lastState ? quietFrames < 10 : speakingFrames >= 3;
      const stateChanged = nextState !== lastState;
      lastState = nextState;
      const normalizedLevel = nextState
        ? Math.min(1, Math.max(0.08, (smoothedLevel - threshold) / Math.max(0.04, 0.16 - threshold)))
        : 0;
      const now = performance.now();
      if (
        stateChanged ||
        now - lastPublishedAt > 55 && Math.abs(normalizedLevel - lastPublishedLevel) > 0.035
      ) {
        lastPublishedAt = now;
        lastPublishedLevel = normalizedLevel;
        setActivity({ speaking: nextState, level: normalizedLevel });
      }
      animationFrame = window.requestAnimationFrame(measure);
    };
    animationFrame = window.requestAnimationFrame(measure);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      source.disconnect();
      analyser.disconnect();
      void context.close();
    };
  }, [enabled, stream]);

  return activity;
}

function MemberTile({
  member,
  stream,
  isCurrent,
  isPinned,
  primary,
  onPin,
}: {
  member: RoomParticipant;
  stream?: MediaStream | null;
  isCurrent: boolean;
  isPinned: boolean;
  primary?: boolean;
  onPin: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const liveVideoTrack = stream?.getVideoTracks().find((track) => track.readyState === "live" && track.enabled);
  const hasVideo = Boolean(liveVideoTrack);
  const isScreenShare = Boolean(member.sharing || liveVideoTrack?.getSettings().displaySurface);
  const { speaking, level } = useSpeakingActivity(stream, !member.muted);
  return (
    <motion.article
      layout={reduceMotion ? false : "position"}
      transition={{ layout: { duration: 0.32, ease: [0.16, 1, 0.3, 1] } }}
      className={`meeting-tile${primary ? " primary" : ""}${isScreenShare ? " sharing" : ""}${speaking ? " speaking" : ""}`}
      style={{ "--voice-level": level } as CSSProperties}
    >
      <div className="meeting-media">
        {stream && hasVideo ? (
          <StreamPlayer stream={stream} muted={isCurrent} video />
        ) : (
          <div className={`meeting-avatar avatar-${member.avatar ?? "violet"}`} aria-label="Camera off">
            <UserCircle size={primary ? 74 : 48} weight="light" />
          </div>
        )}
        {stream && !hasVideo && !isCurrent && <StreamPlayer stream={stream} muted={false} video={false} />}
        <button
          type="button"
          className="pin-control"
          onClick={onPin}
          aria-label={`${isPinned ? "Unpin" : "Pin"} ${shortAddress(member.address)}`}
          title={isPinned ? "Return to grid" : "Pin to main stage"}
        >
          {isPinned ? <PushPinSlash size={18} /> : <PushPin size={18} />}
          <span>{isPinned ? "Unpin" : "Pin"}</span>
        </button>
        {isScreenShare && <span className="share-label"><MonitorArrowUp size={15} /> Screen sharing</span>}
        {speaking && <span className="speaking-indicator" aria-label="Speaking"><i /><i /><i /></span>}
        <span className={`member-state ${member.status}`} aria-label={statusLabel[member.status]} />
      </div>
      <footer className="meeting-tile-footer">
        <div>
          <strong>{shortAddress(member.address)}</strong>
          {isCurrent && <span className="you-label">You</span>}
          <span>{statusLabel[member.status]}</span>
          {getChainConfig(member.chainId)?.name && <span>{getChainConfig(member.chainId)?.name}</span>}
        </div>
        <div className="member-signals" aria-label="Member media status">
          {member.muted && <span title="Microphone muted"><MicrophoneSlash size={16} /></span>}
          {member.cameraOn && <span title="Camera on"><VideoCamera size={16} /></span>}
          {member.sharing && <span className="sharing" title="Sharing screen"><MonitorArrowUp size={16} /></span>}
        </div>
      </footer>
    </motion.article>
  );
}

function ActiveMembersView({
  members,
  currentAddress,
  localStream,
  remoteStreams = {},
}: ActiveMembersProps) {
  const [pinnedParticipantKey, setPinnedParticipantKey] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(6);
  const touchStartRef = useRef<number | null>(null);
  const previousSharingRef = useRef<string | null>(null);
  const sharingMember = members.find((member) => member.sharing);

  useEffect(() => {
    let frame = 0;
    const updatePageSize = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const next = participantPageSize(window.innerWidth, window.innerHeight);
        setPageSize((current) => current === next ? current : next);
      });
    };
    updatePageSize();
    window.addEventListener("resize", updatePageSize, { passive: true });
    window.addEventListener("orientationchange", updatePageSize);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", updatePageSize);
      window.removeEventListener("orientationchange", updatePageSize);
    };
  }, []);

  const pageCount = Math.max(1, Math.ceil(members.length / pageSize));
  const safePage = clampParticipantPage(page, members.length, pageSize);
  const visibleMembers = useMemo(
    () => members.slice(safePage * pageSize, safePage * pageSize + pageSize),
    [members, pageSize, safePage],
  );

  useEffect(() => {
    if (page !== safePage) queueMicrotask(() => setPage(safePage));
  }, [page, safePage]);

  useEffect(() => {
    if (pinnedParticipantKey && !members.some((member) => member.participantKey === pinnedParticipantKey)) {
      queueMicrotask(() => setPinnedParticipantKey(null));
    }
  }, [members, pinnedParticipantKey]);

  useEffect(() => {
    const sharingId = sharingMember?.participantKey ?? null;
    if (sharingId && sharingId !== previousSharingRef.current && !pinnedParticipantKey) {
      const sharingIndex = members.findIndex((member) => member.participantKey === sharingId);
      queueMicrotask(() => {
        setPinnedParticipantKey(sharingId);
        if (sharingIndex >= 0) setPage(Math.floor(sharingIndex / pageSize));
      });
    }
    previousSharingRef.current = sharingId;
  }, [members, pageSize, pinnedParticipantKey, sharingMember?.participantKey]);

  if (!members.length) {
    return (
      <div className="members-empty">
        <div className="empty-module" aria-hidden="true"><UserCircle size={34} /></div>
        <h3>No one has joined yet</h3>
        <p>The member wall appears only when a connected wallet joins this room.</p>
      </div>
    );
  }

  const pinnedMember = visibleMembers.find((member) => member.participantKey === pinnedParticipantKey);
  const isCurrentMember = (member: RoomParticipant) =>
    member.participantKey === currentAddress?.toLowerCase();
  const streamFor = (member: RoomParticipant) =>
    isCurrentMember(member) ? localStream : remoteStreams[member.clientId];
  const renderTile = (member: RoomParticipant) => (
    <MemberTile
      key={member.participantKey}
      member={member}
      stream={streamFor(member)}
      isCurrent={isCurrentMember(member)}
      isPinned={member.participantKey === pinnedParticipantKey}
      primary={member.participantKey === pinnedParticipantKey}
      onPin={() => setPinnedParticipantKey((current) => current === member.participantKey ? null : member.participantKey)}
    />
  );

  return (
    <div
      className="meeting-stage-shell"
      onTouchStart={(event) => { touchStartRef.current = event.touches[0]?.clientX ?? null; }}
      onTouchEnd={(event) => {
        const start = touchStartRef.current;
        const end = event.changedTouches[0]?.clientX;
        touchStartRef.current = null;
        if (start == null || end == null || Math.abs(end - start) < 48) return;
        setPage((current) => clampParticipantPage(current + (end < start ? 1 : -1), members.length, pageSize));
      }}
    >
      <div
        className={`meeting-stage meeting-grid count-${visibleMembers.length}${pinnedMember ? ` has-pin${visibleMembers.length === 1 ? " solo-pin" : ""}` : ""}`}
        aria-live="polite"
      >
        {visibleMembers.map((member) => renderTile(member))}
      </div>
      {pageCount > 1 && (
        <nav className="meeting-pagination" aria-label="Participant pages">
          <button type="button" disabled={safePage === 0} onClick={() => setPage((current) => Math.max(0, current - 1))} aria-label="Previous participant page">←</button>
          <span>Page {safePage + 1} of {pageCount}</span>
          <div>{Array.from({ length: pageCount }, (_, index) => <button key={index} type="button" className={index === safePage ? "active" : ""} onClick={() => setPage(index)} aria-label={`Participant page ${index + 1}`} />)}</div>
          <button type="button" disabled={safePage === pageCount - 1} onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))} aria-label="Next participant page">→</button>
        </nav>
      )}
    </div>
  );
}

export const ActiveMembers = memo(ActiveMembersView);
