"use client";

import { useEffect, useRef, useState } from "react";
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
  const connectStream = (node: HTMLMediaElement | null) => {
    if (node) node.srcObject = stream;
  };
  if (!video) return <audio ref={connectStream} autoPlay muted={muted} />;
  return <video ref={connectStream} autoPlay muted={muted} playsInline />;
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
  return (
    <article className={`meeting-tile${primary ? " primary" : ""}${member.sharing ? " sharing" : ""}`}>
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
