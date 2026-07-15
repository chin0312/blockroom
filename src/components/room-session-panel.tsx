"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChatCircleText,
  CheckCircle,
  ClockCountdown,
  Microphone,
  MicrophoneSlash,
  MonitorArrowUp,
  PaperPlaneTilt,
  Play,
  SignOut,
  UsersThree,
  VideoCamera,
  VideoCameraSlash,
  WarningCircle,
} from "@phosphor-icons/react";
import { useAccount } from "wagmi";
import { useRoomMedia } from "@/hooks/use-room-media";
import { useRoomOccupancy } from "@/hooks/use-room-occupancy";
import { useRoomRealtime } from "@/hooks/use-room-realtime";
import { shortAddress } from "@/lib/realtime-types";
import type { Room } from "@/lib/rooms";
import { ActiveMembers } from "./ActiveMembers";
import { REQUIRED_SESSION_SECONDS, useSession } from "./session-provider";
import { WalletControl } from "./wallet-control";

function formatTimer(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function RoomSessionPanel({ room }: { room: Room }) {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const {
    hydrated,
    getActiveSession,
    startSession,
    pauseSession,
    resumeSession,
    tickSession,
    completeSession,
  } = useSession();
  const realtime = useRoomRealtime(room.slug, address, room.capacity);
  const occupancy = useRoomOccupancy([room.slug]);
  const [activeTab, setActiveTab] = useState<"members" | "chat">("members");
  const [draft, setDraft] = useState("");
  const session = getActiveSession(address);
  const isCurrentRoom = session?.roomSlug === room.slug;
  const elapsed = isCurrentRoom ? session.elapsedSeconds : 0;
  const eligible = elapsed >= REQUIRED_SESSION_SECONDS;
  const remaining = Math.max(0, REQUIRED_SESSION_SECONDS - elapsed);
  const progress = Math.min(100, (elapsed / REQUIRED_SESSION_SECONDS) * 100);
  const me = realtime.members.find((member) => member.clientId === realtime.clientId);
  const media = useRoomMedia({
    clientId: realtime.clientId,
    members: realtime.members,
    joined: realtime.joined,
    sendSignal: realtime.sendRtcSignal,
    subscribeSignals: realtime.subscribeRtcSignals,
    updateMember: realtime.updateMember,
  });
  const liveCount = Math.max(occupancy.counts[room.slug] ?? 0, realtime.members.length);
  const roomFull = liveCount >= room.capacity;

  useEffect(() => {
    if (!address || !realtime.joined || !isCurrentRoom || session.paused) return;
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") tickSession(room.slug, address);
    }, 1000);
    return () => window.clearInterval(interval);
  }, [address, isCurrentRoom, realtime.joined, room.slug, session?.paused, tickSession]);

  useEffect(() => {
    if (!address || !realtime.joined) return;
    function handleVisibilityChange() {
      if (document.visibilityState === "hidden") {
        if (isCurrentRoom) pauseSession(address!);
        void realtime.updateMember({ status: "paused" });
      } else {
        if (isCurrentRoom) resumeSession(address!);
        void realtime.updateMember({ status: isCurrentRoom ? "focusing" : "available" });
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [address, isCurrentRoom, pauseSession, realtime, resumeSession]);

  async function handleJoin() {
    if (roomFull) return;
    await realtime.join();
  }

  function handleStart() {
    if (!address || !realtime.joined) return;
    startSession(room.slug, address);
    void realtime.updateMember({ status: "focusing" });
  }

  async function handleLeave() {
    if (address && isCurrentRoom) pauseSession(address);
    media.stopAllMedia();
    await realtime.leave();
    router.push("/rooms");
  }

  function handleComplete() {
    if (!address) return;
    const record = completeSession(address);
    if (!record) return;
    void realtime.updateMember({ status: "available" });
    router.push("/dashboard");
  }

  async function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (await realtime.sendMessage(draft)) setDraft("");
  }

  if (!hydrated) {
    return <div className="workspace-skeleton" aria-label="Loading room state" />;
  }

  if (!realtime.joined) {
    return (
      <section className="join-space-panel">
        <div className="join-space-visual" aria-hidden="true">
          <span className="protocol-orbit orbit-one" />
          <span className="protocol-orbit orbit-two" />
          <div className="protocol-core"><UsersThree size={46} weight="light" /></div>
          <span className="protocol-node node-one" />
          <span className="protocol-node node-two" />
          <span className="protocol-node node-three" />
        </div>
        <div className="join-space-copy">
          <span className="product-kicker">Realtime space</span>
          <h2>{isConnected ? "Ready to publish your presence" : "Connect before you join"}</h2>
          <p>
            Only wallets that press Join Room appear here. Closing the page or
            leaving removes your presence. This room supports up to {room.capacity} members.
          </p>
          {realtime.mode === "local-tabs" && (
            <div className="transport-notice"><WarningCircle size={19} /> Same-browser tab mode. Add Supabase keys for different-browser testing.</div>
          )}
          {realtime.error && <div className="inline-error" role="alert">{realtime.error}</div>}
          {isConnected ? (
            <button className="product-button primary" type="button" onClick={handleJoin} disabled={realtime.status === "connecting" || roomFull}>
              <UsersThree size={19} /> {roomFull ? "Room full" : realtime.status === "connecting" ? "Joining room" : `Join Room (${liveCount}/${room.capacity})`}
            </button>
          ) : (
            <WalletControl placement="hero" />
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="room-workspace">
      <div className="workspace-main">
        <div className="workspace-tabs" role="tablist" aria-label="Room workspace views">
          <button type="button" role="tab" aria-selected={activeTab === "members"} className={activeTab === "members" ? "active" : ""} onClick={() => setActiveTab("members")}>
            <UsersThree size={18} /> Active members <span>{realtime.members.length}/{room.capacity}</span>
          </button>
          <button type="button" role="tab" aria-selected={activeTab === "chat"} className={activeTab === "chat" ? "active" : ""} onClick={() => setActiveTab("chat")}>
            <ChatCircleText size={18} /> Discussions
          </button>
        </div>

        <div className="workspace-view">
          {activeTab === "members" ? (
            <ActiveMembers
              members={realtime.members}
              currentClientId={realtime.clientId}
              localStream={media.previewStream}
              remoteStreams={media.remoteStreams}
            />
          ) : (
            <div className="chat-panel">
              <div className="chat-log" aria-live="polite">
                {realtime.messages.length ? realtime.messages.map((message) => (
                  <article className={message.clientId === realtime.clientId ? "chat-message own" : "chat-message"} key={message.id}>
                    <div><strong>{shortAddress(message.address)}</strong><time dateTime={message.sentAt}>{new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" }).format(new Date(message.sentAt))}</time></div>
                    <p>{message.body}</p>
                  </article>
                )) : (
                  <div className="chat-empty"><ChatCircleText size={34} /><h3>No messages in this room</h3><p>Send the first message. Nothing is prefilled or stored as fake history.</p></div>
                )}
              </div>
              <form className="chat-composer" onSubmit={handleSend}>
                <label htmlFor="room-message">Message this room</label>
                <div><input id="room-message" value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={500} placeholder="Share a real update" /><button type="submit" aria-label="Send message" disabled={!draft.trim()}><PaperPlaneTilt size={19} /></button></div>
              </form>
            </div>
          )}
        </div>

        <div className="spatial-controls" aria-label="Spatial controls">
          <button type="button" onClick={() => media.toggleMicrophone(Boolean(me?.muted))}>
            {me?.muted ? <MicrophoneSlash size={19} /> : <Microphone size={19} />}
            {me?.muted ? "Unmute" : "Mute"}
          </button>
          <button type="button" className={me?.cameraOn ? "active" : ""} onClick={() => media.toggleCamera(Boolean(me?.cameraOn))}>
            {me?.cameraOn ? <VideoCamera size={19} /> : <VideoCameraSlash size={19} />}
            {me?.cameraOn ? "Stop Camera" : "Webcam"}
          </button>
          <button type="button" className={me?.sharing ? "active" : ""} onClick={() => media.toggleScreenShare(Boolean(me?.sharing))}>
            <MonitorArrowUp size={19} /> {me?.sharing ? "Stop sharing" : "Share Screen"}
          </button>
          <button type="button" className="leave" onClick={handleLeave}><SignOut size={19} /> Leave Space</button>
        </div>
        {media.mediaError && <div className="control-error" role="alert"><WarningCircle size={17} /> {media.mediaError}</div>}
      </div>

      <aside className="session-console-new">
        <div className="console-heading"><span>Session console</span><span className={`connection-state ${realtime.status}`}>{realtime.mode === "supabase" ? "Realtime" : "Local tabs"}</span></div>
        <div className="timer-display"><strong>{formatTimer(elapsed)}</strong><span>/ 30:00</span></div>
        <div className="timer-progress" aria-label={`${Math.round(progress)} percent complete`}><span style={{ width: `${progress}%` }} /></div>
        <div className="focus-state"><span className={isCurrentRoom && !session.paused ? "pulse active" : "pulse"} />{!isCurrentRoom ? "Timer not started" : session.paused ? "Paused while hidden" : "Visible time counting"}</div>
        <div className="console-divider" />
        {!isCurrentRoom ? (
          <button className="product-button primary console-action" type="button" onClick={handleStart} disabled={Boolean(session)}><Play size={19} /> Start 30-minute session</button>
        ) : (
          <button className="product-button primary console-action" type="button" onClick={handleComplete} disabled={!eligible}><CheckCircle size={20} /> Complete Session</button>
        )}
        <p className="console-note"><ClockCountdown size={18} />{eligible ? "Eligible. Completion creates a local wallet activity record." : `${formatTimer(remaining)} of visible room time remaining.`}</p>
        <div className="console-truth"><strong>Visible-time rule</strong><p>Switching tabs pauses both your timer and the status other members see.</p></div>
        <button className="back-to-rooms" type="button" onClick={() => router.push("/rooms")}><ArrowLeft size={17} /> Room directory</button>
      </aside>
    </section>
  );
}
