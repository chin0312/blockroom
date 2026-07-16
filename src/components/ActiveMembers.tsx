"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  MicrophoneSlash,
  MonitorArrowUp,
  PushPin,
  PushPinSlash,
  UserCircle,
  VideoCamera,
} from "@phosphor-icons/react";
import { shortAddress, type RoomMember } from "@/lib/realtime-types";

type ActiveMembersProps = {
  members: RoomMember[];
  currentClientId?: string;
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
  }, [stream]);

  if (!video) return <audio ref={mediaRef as React.RefObject<HTMLAudioElement | null>} autoPlay muted={muted} />;
  return <video ref={mediaRef as React.RefObject<HTMLVideoElement | null>} autoPlay muted={muted} playsInline preload="auto" />;
}

function useSpeakingActivity(stream: MediaStream | null | undefined, enabled: boolean) {
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    const audioTrack = stream?.getAudioTracks().find((track) => track.readyState === "live");
    if (!audioTrack || !enabled) {
      queueMicrotask(() => setSpeaking(false));
      return;
    }

    const AudioContextClass = window.AudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();
    const analyser = context.createAnalyser();
    const source = context.createMediaStreamSource(new MediaStream([audioTrack]));
    const samples = new Uint8Array(analyser.fftSize);
    let animationFrame = 0;
    let speakingFrames = 0;
    let quietFrames = 0;
    let lastState = false;

    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.82;
    source.connect(analyser);
    void context.resume().catch(() => undefined);

    const measure = () => {
      analyser.getByteTimeDomainData(samples);
      let squareSum = 0;
      for (const sample of samples) {
        const normalized = (sample - 128) / 128;
        squareSum += normalized * normalized;
      }
      const rms = Math.sqrt(squareSum / samples.length);
      if (rms > 0.035) {
        speakingFrames += 1;
        quietFrames = 0;
      } else {
        quietFrames += 1;
        speakingFrames = 0;
      }
      const nextState = lastState ? quietFrames < 9 : speakingFrames >= 3;
      if (nextState !== lastState) {
        lastState = nextState;
        setSpeaking(nextState);
      }
      animationFrame = window.requestAnimationFrame(measure);
    };
    animationFrame = window.requestAnimationFrame(measure);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      source.disconnect();
      analyser.disconnect();
      void context.close();
      setSpeaking(false);
    };
  }, [enabled, stream]);

  return speaking;
}

function MemberTile({
  member,
  stream,
  isCurrent,
  isPinned,
  primary,
  onPin,
}: {
  member: RoomMember;
  stream?: MediaStream | null;
  isCurrent: boolean;
  isPinned: boolean;
  primary?: boolean;
  onPin: () => void;
}) {
  const hasVideo = Boolean(stream && (member.cameraOn || member.sharing));
  const speaking = useSpeakingActivity(stream, !member.muted);
  return (
    <article className={`meeting-tile${primary ? " primary" : ""}${member.sharing ? " sharing" : ""}${speaking ? " speaking" : ""}`}>
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
        {member.sharing && <span className="share-label"><MonitorArrowUp size={15} /> Screen sharing</span>}
        {speaking && <span className="speaking-indicator" aria-label="Speaking"><i /><i /><i /></span>}
        <span className={`member-state ${member.status}`} aria-label={statusLabel[member.status]} />
      </div>
      <footer className="meeting-tile-footer">
        <div>
          <strong>{shortAddress(member.address)}</strong>
          {isCurrent && <span className="you-label">You</span>}
          <span>{statusLabel[member.status]}</span>
        </div>
        <div className="member-signals" aria-label="Member media status">
          {member.muted && <span title="Microphone muted"><MicrophoneSlash size={16} /></span>}
          {member.cameraOn && <span title="Camera on"><VideoCamera size={16} /></span>}
          {member.sharing && <span className="sharing" title="Sharing screen"><MonitorArrowUp size={16} /></span>}
        </div>
      </footer>
    </article>
  );
}

export function ActiveMembers({
  members,
  currentClientId,
  localStream,
  remoteStreams = {},
}: ActiveMembersProps) {
  const [pinnedClientId, setPinnedClientId] = useState<string | null>(null);
  const previousSharingRef = useRef<string | null>(null);
  const sharingMember = members.find((member) => member.sharing);

  useEffect(() => {
    if (pinnedClientId && !members.some((member) => member.clientId === pinnedClientId)) {
      queueMicrotask(() => setPinnedClientId(null));
    }
  }, [members, pinnedClientId]);

  useEffect(() => {
    const sharingId = sharingMember?.clientId ?? null;
    if (sharingId && sharingId !== previousSharingRef.current && !pinnedClientId) {
      queueMicrotask(() => setPinnedClientId(sharingId));
    }
    previousSharingRef.current = sharingId;
  }, [pinnedClientId, sharingMember?.clientId]);

  if (!members.length) {
    return (
      <div className="members-empty">
        <div className="empty-module" aria-hidden="true"><UserCircle size={34} /></div>
        <h3>No one has joined yet</h3>
        <p>The member wall appears only when a connected wallet joins this room.</p>
      </div>
    );
  }

  const pinnedMember = members.find((member) => member.clientId === pinnedClientId);
  const streamFor = (member: RoomMember) =>
    member.clientId === currentClientId ? localStream : remoteStreams[member.clientId];
  const renderTile = (member: RoomMember, primary = false) => (
    <MemberTile
      key={member.clientId}
      member={member}
      stream={streamFor(member)}
      isCurrent={member.clientId === currentClientId}
      isPinned={member.clientId === pinnedClientId}
      primary={primary}
      onPin={() => setPinnedClientId((current) => current === member.clientId ? null : member.clientId)}
    />
  );

  if (pinnedMember) {
    return (
      <div className={`meeting-stage has-pin${members.length === 1 ? " solo-pin" : ""}`} aria-live="polite">
        <div className="meeting-primary">{renderTile(pinnedMember, true)}</div>
        <div className="meeting-filmstrip" aria-label="Other room members">
          {members.filter((member) => member.clientId !== pinnedMember.clientId).map((member) => renderTile(member))}
        </div>
      </div>
    );
  }

  return (
    <div className={`meeting-stage meeting-grid count-${members.length}`} aria-live="polite">
      {members.map((member) => renderTile(member))}
    </div>
  );
}
