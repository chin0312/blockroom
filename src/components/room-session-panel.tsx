"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ChatCircleText,
  CheckCircle,
  ClockCountdown,
  CornersIn,
  CornersOut,
  Microphone,
  MicrophoneSlash,
  MonitorArrowUp,
  PaperPlaneTilt,
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
import { AmbientModule } from "./ambient-module";
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
    cancelSession,
    completeSession,
  } = useSession();
  const realtime = useRoomRealtime(room.slug, address, room.capacity);
  const occupancy = useRoomOccupancy([room.slug]);
  const [activeTab, setActiveTab] = useState<"members" | "chat">("members");
  const [draft, setDraft] = useState("");
  const [leavePromptOpen, setLeavePromptOpen] = useState(false);
  const [leaveDestination, setLeaveDestination] = useState("/rooms");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenAvailable, setFullscreenAvailable] = useState(false);
  const workspaceRef = useRef<HTMLElement>(null);
  const joinTimerStartedRef = useRef(false);
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
    if (!realtime.joined) {
      joinTimerStartedRef.current = false;
      return;
    }
    if (!address || joinTimerStartedRef.current) return;
    joinTimerStartedRef.current = true;
    if (!isCurrentRoom) startSession(room.slug, address);
    else resumeSession(address);
    void realtime.updateMember({ status: "focusing" });
  }, [address, isCurrentRoom, realtime, resumeSession, room.slug, startSession]);

  useEffect(() => {
    if (!address || !realtime.joined || !isCurrentRoom || session.paused) return;
    const interval = window.setInterval(() => {
      tickSession(room.slug, address);
    }, 1000);
    return () => window.clearInterval(interval);
  }, [address, isCurrentRoom, realtime.joined, room.slug, session?.paused, tickSession]);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setFullscreenAvailable(Boolean(document.fullscreenEnabled));
    });
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === workspaceRef.current);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      cancelled = true;
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  async function handleJoin() {
    if (roomFull) return;
    await realtime.join();
  }

  const requestLeave = useCallback((destination = "/rooms") => {
    if (address && isCurrentRoom) pauseSession(address);
    void realtime.updateMember({ status: "paused" });
    setLeaveDestination(destination);
    setLeavePromptOpen(true);
  }, [address, isCurrentRoom, pauseSession, realtime]);

  const cancelLeave = useCallback(() => {
    if (address && isCurrentRoom) resumeSession(address);
    void realtime.updateMember({ status: "focusing" });
    setLeavePromptOpen(false);
  }, [address, isCurrentRoom, realtime, resumeSession]);

  async function finishLeave(save: boolean) {
    if (address) {
      if (save) completeSession(address);
      else cancelSession(address);
    }
    media.stopAllMedia();
    setLeavePromptOpen(false);
    await realtime.leave();
    if (document.fullscreenElement) await document.exitFullscreen();
    router.push(leaveDestination);
  }

  async function toggleFullscreen() {
    if (!workspaceRef.current || !fullscreenAvailable) return;
    if (document.fullscreenElement === workspaceRef.current) {
      await document.exitFullscreen();
    } else {
      await workspaceRef.current.requestFullscreen();
    }
  }

  useEffect(() => {
    if (!realtime.joined) return;
    const interceptInternalNavigation = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const destination = new URL(anchor.href, window.location.href);
      if (destination.origin !== window.location.origin || destination.pathname === window.location.pathname) return;
      event.preventDefault();
      requestLeave(`${destination.pathname}${destination.search}${destination.hash}`);
    };
    const confirmBrowserExit = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    document.addEventListener("click", interceptInternalNavigation, true);
    window.addEventListener("beforeunload", confirmBrowserExit);
    return () => {
      document.removeEventListener("click", interceptInternalNavigation, true);
      window.removeEventListener("beforeunload", confirmBrowserExit);
    };
  }, [realtime.joined, requestLeave]);

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
          <AmbientModule variant="room" size="panel" />
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
    <section ref={workspaceRef} className={`room-workspace${isFullscreen ? " is-fullscreen" : ""}`}>
      <div className="workspace-main">
        <div className="workspace-tabs">
          <div className="workspace-tab-group" role="tablist" aria-label="Room workspace views">
            <button type="button" role="tab" aria-selected={activeTab === "members"} className={activeTab === "members" ? "active" : ""} onClick={() => setActiveTab("members")}>
              <UsersThree size={18} /> Active members <span>{realtime.members.length}/{room.capacity}</span>
            </button>
            <button type="button" role="tab" aria-selected={activeTab === "chat"} className={activeTab === "chat" ? "active" : ""} onClick={() => setActiveTab("chat")}>
              <ChatCircleText size={18} /> Discussions
            </button>
          </div>
          <div className="workspace-session-chip" aria-label={`${formatTimer(elapsed)} elapsed in this room`}>
            <ClockCountdown size={17} />
            <div><strong>{formatTimer(elapsed)}</strong><span>{eligible ? "Ready to save" : `${formatTimer(remaining)} to qualify`}</span></div>
          </div>
          <button
            type="button"
            className="workspace-fullscreen-action"
            onClick={() => void toggleFullscreen()}
            disabled={!fullscreenAvailable}
            aria-label={isFullscreen ? "Exit room fullscreen" : "Open room fullscreen"}
            title={fullscreenAvailable ? (isFullscreen ? "Exit fullscreen" : "Present room fullscreen") : "Fullscreen is unavailable in this browser"}
          >
            {isFullscreen ? <CornersIn size={19} /> : <CornersOut size={19} />}
            <span>{isFullscreen ? "Exit" : "Fullscreen"}</span>
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
          <button type="button" className="leave" onClick={() => requestLeave()}><SignOut size={19} /> Leave Space</button>
        </div>
        {media.mediaError && <div className="control-error" role="alert"><WarningCircle size={17} /> {media.mediaError}</div>}
      </div>

      <div className="workspace-progress" aria-label={`${Math.round(progress)} percent of the minimum session complete`}><span style={{ width: `${progress}%` }} /></div>

      {leavePromptOpen && (
        <div className="leave-dialog-backdrop" role="presentation">
          <section className="leave-dialog" role="dialog" aria-modal="true" aria-labelledby="leave-dialog-title">
            <div className={eligible ? "leave-dialog-icon eligible" : "leave-dialog-icon"} aria-hidden="true">
              {eligible ? <CheckCircle size={30} /> : <ClockCountdown size={30} />}
            </div>
            <h2 id="leave-dialog-title">{eligible ? "Save this focus session?" : "Leave without a record?"}</h2>
            <p>
              {eligible
                ? `You accumulated ${formatTimer(elapsed)} while joined. Save this exact duration to your wallet activity before leaving.`
                : `You accumulated ${formatTimer(elapsed)}. Sessions need at least 30:00 of joined room time before they can be recorded.`}
            </p>
            <div className="leave-dialog-actions">
              {eligible && <button type="button" className="save" onClick={() => void finishLeave(true)}><CheckCircle size={18} /> Save and leave</button>}
              <button type="button" className="discard" onClick={() => void finishLeave(false)}><SignOut size={18} /> Leave without saving</button>
              <button type="button" className="cancel" onClick={cancelLeave}>Stay in room</button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
