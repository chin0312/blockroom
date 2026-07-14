"use client";

import {
  MicrophoneSlash,
  MonitorArrowUp,
  UserCircle,
} from "@phosphor-icons/react";
import { shortAddress, type RoomMember } from "@/lib/realtime-types";

type ActiveMembersProps = {
  members: RoomMember[];
  currentClientId?: string;
};

const statusLabel = {
  focusing: "Focusing",
  paused: "Paused",
  available: "In space",
};

export function ActiveMembers({ members, currentClientId }: ActiveMembersProps) {
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
      {members.map((member) => (
        <article
          className={member.clientId === currentClientId ? "member-card current" : "member-card"}
          key={member.clientId}
        >
          <div className="member-module" aria-hidden="true">
            <UserCircle size={38} weight="light" />
            <span className={`member-state ${member.status}`} />
          </div>
          <div className="member-identity">
            <div>
              <strong>{shortAddress(member.address)}</strong>
              {member.clientId === currentClientId && <span className="you-label">You</span>}
            </div>
            <span>{statusLabel[member.status]}</span>
          </div>
          <div className="member-signals" aria-label="Member controls status">
            {member.muted && <span title="Microphone muted"><MicrophoneSlash size={16} /></span>}
            {member.sharing && <span className="sharing" title="Sharing Proof of Work"><MonitorArrowUp size={16} /></span>}
          </div>
        </article>
      ))}
    </div>
  );
}

