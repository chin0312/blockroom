"use client";

import {
  MicrophoneSlash,
  MonitorArrowUp,
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
  const connectStream = (node: HTMLMediaElement | null) => {
    if (node) node.srcObject = stream;
  };
  if (!video) return <audio ref={connectStream} autoPlay muted={muted} />;
  return <video ref={connectStream} autoPlay muted={muted} playsInline />;
}

export function ActiveMembers({
  members,
  currentClientId,
  localStream,
  remoteStreams = {},
}: ActiveMembersProps) {
  if (!members.length) {
    return (
      <div className="members-empty">
        <div className="empty-module" aria-hidden="true"><UserCircle size={34} /></div>
        <h3>No one has joined yet</h3>
        <p>The member wall appears only when a connected wallet joins this room.</p>
      </div>
    );
  }

  return (
    <div className="members-grid" aria-live="polite">
      {members.map((member) => {
        const isCurrent = member.clientId === currentClientId;
        const stream = isCurrent ? localStream : remoteStreams[member.clientId];
        const hasVideo = Boolean(stream && (member.cameraOn || member.sharing));
        return <article
          className={member.clientId === currentClientId ? "member-card current" : "member-card"}
          key={member.clientId}
        >
          <div className={hasVideo ? `member-module has-media${member.sharing ? " screen-media" : ""}` : "member-module"} aria-hidden={!hasVideo}>
            {stream && hasVideo ? (
              <StreamPlayer stream={stream} muted={isCurrent} video />
            ) : (
              <UserCircle size={38} weight="light" />
            )}
            <span className={`member-state ${member.status}`} />
          </div>
          {stream && !hasVideo && !isCurrent && <StreamPlayer stream={stream} muted={false} video={false} />}
          <div className="member-identity">
            <div>
              <strong>{shortAddress(member.address)}</strong>
              {member.clientId === currentClientId && <span className="you-label">You</span>}
            </div>
            <span>{statusLabel[member.status]}</span>
          </div>
          <div className="member-signals" aria-label="Member controls status">
            {member.muted && <span title="Microphone muted"><MicrophoneSlash size={16} /></span>}
            {member.cameraOn && <span title="Camera on"><VideoCamera size={16} /></span>}
            {member.sharing && <span className="sharing" title="Sharing Proof of Work"><MonitorArrowUp size={16} /></span>}
          </div>
        </article>;
      })}
    </div>
  );
}
