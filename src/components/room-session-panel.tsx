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
import type { Address } from "viem";
import { useRoomMedia } from "@/hooks/use-room-media";
import { useRoomOccupancy } from "@/hooks/use-room-occupancy";
import { useRoomRealtime } from "@/hooks/use-room-realtime";
import { shortAddress } from "@/lib/realtime-types";
import type { Room } from "@/lib/rooms";
import { ActiveMembers } from "./ActiveMembers";
import { RoomVisual } from "./room-visual";
import { REQUIRED_SESSION_SECONDS, useSession } from "./session-provider";
import type { OnchainSessionDraft } from "@/lib/session-store";
import {
  getChainConfig,
  isSupportedChainId,
  transactionExplorerUrl,
} from "@/config/chains";
import { useSessionSubmission } from "@/hooks/use-blockroom-contract";
import { WalletControl } from "./wallet-control";

function formatTimer(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function RoomSessionPanel({ room }: { room: Room }) {
  const router = useRouter();
  const { address, chainId, isConnected } = useAccount();
  const {
    hydrated,
    getActiveSession,
    startSession,
    tickSession,
    finalizeSession,
    finalizeWalletSession,
  } = useSession();
  const realtime = useRoomRealtime(room.slug, address, chainId, room.capacity);
  const occupancy = useRoomOccupancy([room.slug]);
  const [activeTab, setActiveTab] = useState<"members" | "chat">("members");
  const [draft, setDraft] = useState("");
  const [leavePromptOpen, setLeavePromptOpen] = useState(false);
  const [leaveDestination, setLeaveDestination] = useState("/rooms");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [fullscreenAvailable, setFullscreenAvailable] = useState(false);
  const [frozenSession, setFrozenSession] = useState<OnchainSessionDraft | null>(null);
  const workspaceRef = useRef<HTMLElement>(null);
  const joinTimerStartedRef = useRef(false);
  const joinedWalletRef = useRef<Address | null>(null);
  const submission = useSessionSubmission();
  const connectedChain = getChainConfig(chainId);
  const supportedChainId = isSupportedChainId(chainId) ? chainId : undefined;
  const session = getActiveSession(address);
  const isCurrentRoom = session?.roomSlug === room.slug;
  const elapsed = isCurrentRoom ? session.durationSeconds : 0;
  const eligible = elapsed >= REQUIRED_SESSION_SECONDS;
  const remaining = Math.max(0, REQUIRED_SESSION_SECONDS - elapsed);
  const progress = Math.min(100, (elapsed / REQUIRED_SESSION_SECONDS) * 100);
  const me = realtime.currentSession;
  const currentParticipant = realtime.members.find(
    (member) => member.participantKey === address?.toLowerCase(),
  );
  const isPrimaryPresenceSession =
    currentParticipant?.primarySessionId === realtime.clientId;
  const media = useRoomMedia({
    clientId: realtime.clientId,
    members: realtime.members,
    joined: realtime.joined,
    sendSignal: realtime.sendRtcSignal,
    subscribeSignals: realtime.subscribeRtcSignals,
    updateMember: realtime.updateMember,
  });
  const realtimeJoined = realtime.joined;
  const updateRealtimeMember = realtime.updateMember;
  const leaveRealtime = realtime.leave;
  const stopAllMedia = media.stopAllMedia;
  const liveCount = realtime.joined
    ? realtime.members.length
    : occupancy.counts[room.slug] ?? 0;
  const walletAlreadyPresent = Boolean(
    address && occupancy.addresses[room.slug]?.includes(address.toLowerCase()),
  );
  const roomFull = liveCount >= room.capacity && !walletAlreadyPresent;

  useEffect(() => {
    if (!realtimeJoined) {
      joinTimerStartedRef.current = false;
      return;
    }
    if (
      !address ||
      !supportedChainId ||
      !isPrimaryPresenceSession ||
      joinTimerStartedRef.current
    ) return;
    joinTimerStartedRef.current = true;
    joinedWalletRef.current = address;
    if (!isCurrentRoom) startSession(room.slug, address, supportedChainId);
    void updateRealtimeMember({ status: "focusing" });
  }, [address, isCurrentRoom, isPrimaryPresenceSession, realtimeJoined, room.slug, startSession, supportedChainId, updateRealtimeMember]);

  useEffect(() => {
    if (!address || !realtimeJoined || !isCurrentRoom || !session) return;
    const interval = window.setInterval(() => {
      tickSession(session.sessionId);
    }, 1000);
    return () => window.clearInterval(interval);
  }, [address, isCurrentRoom, realtimeJoined, session, tickSession]);

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
    setLeaveDestination(destination);
    setLeavePromptOpen(true);
  }, []);

  const cancelLeave = useCallback(() => {
    setLeavePromptOpen(false);
  }, []);

  async function disconnectFromRoom() {
    media.stopAllMedia();
    setLeavePromptOpen(false);
    await realtime.leave();
    if (document.fullscreenElement) await document.exitFullscreen();
    setIsExpanded(false);
  }

  async function finishLeave(recordNow: boolean) {
    const finalized = session ? finalizeSession(session.sessionId) : null;
    await disconnectFromRoom();
    joinedWalletRef.current = null;
    if (!finalized) {
      router.push(leaveDestination);
      return;
    }
    if (!recordNow) {
      router.push(leaveDestination);
      return;
    }
    setFrozenSession(finalized);
    const confirmed = await submission.submit(finalized);
    if (confirmed) window.setTimeout(() => router.push(leaveDestination), 650);
  }

  async function retryFrozenSession() {
    if (!frozenSession) return;
    const confirmed = await submission.submit(frozenSession);
    if (confirmed) window.setTimeout(() => router.push(leaveDestination), 650);
  }

  useEffect(() => {
    const joinedWallet = joinedWalletRef.current;
    if (!realtimeJoined || !joinedWallet) return;
    if (address?.toLowerCase() === joinedWallet.toLowerCase()) return;
    const finalized = finalizeWalletSession(joinedWallet);
    if (finalized) setFrozenSession(finalized);
    stopAllMedia();
    void leaveRealtime();
    setLeavePromptOpen(false);
    joinedWalletRef.current = null;
  }, [address, finalizeWalletSession, leaveRealtime, realtimeJoined, stopAllMedia]);

  async function toggleFullscreen() {
    if (!workspaceRef.current) return;
    if (isExpanded) {
      setIsExpanded(false);
      return;
    }
    if (document.fullscreenElement === workspaceRef.current) {
      await document.exitFullscreen();
    } else if (fullscreenAvailable) {
      try {
        await workspaceRef.current.requestFullscreen();
      } catch {
        setIsExpanded(true);
      }
    } else {
      setIsExpanded(true);
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

  const transactionDialog = frozenSession ? (
    <div className="leave-dialog-backdrop" role="presentation">
      <section className="leave-dialog" role="dialog" aria-modal="true" aria-labelledby="transaction-dialog-title">
        <div className={submission.status === "confirmed" ? "leave-dialog-icon eligible" : "leave-dialog-icon"} aria-hidden="true">
          {submission.status === "confirmed" ? <CheckCircle size={30} /> : <ClockCountdown size={30} />}
        </div>
        <h2 id="transaction-dialog-title">
          {submission.status === "confirmed" ? "Recorded on-chain" : submission.status === "submitting" ? "Submitting session" : "Wallet approval required"}
        </h2>
        <p>
          {submission.status === "confirmed"
            ? `${formatTimer(frozenSession.durationSeconds)} is confirmed on ${getChainConfig(frozenSession.chainId)?.name ?? "the session network"}.`
            : submission.status === "submitting"
              ? "The wallet approved this record. BlockRoom is waiting for a successful transaction receipt."
              : submission.error ?? `${formatTimer(frozenSession.durationSeconds)} is safely pending. Approve a transaction to record the final duration on-chain.`}
        </p>
        {submission.hash && transactionExplorerUrl(frozenSession.chainId, submission.hash) && (
          <a className="transaction-link" href={transactionExplorerUrl(frozenSession.chainId, submission.hash)} target="_blank" rel="noreferrer">View transaction</a>
        )}
        <div className="leave-dialog-actions">
          {submission.status === "idle" && (
            <button type="button" className="save" disabled={!submission.isConfigured(frozenSession.chainId)} onClick={() => void retryFrozenSession()}><CheckCircle size={18} /> Record with session wallet</button>
          )}
          {(submission.status === "failed" || submission.status === "rejected") && (
            <button type="button" className="save" onClick={() => void retryFrozenSession()}><CheckCircle size={18} /> Retry wallet confirmation</button>
          )}
          {submission.status !== "submitting" && submission.status !== "awaiting-wallet" && (
            <button type="button" className="cancel" onClick={() => router.push(leaveDestination)}>Continue — record later</button>
          )}
        </div>
      </section>
    </div>
  ) : null;

  if (!realtime.joined) {
    return (
      <>
        <section className="join-space-panel">
          <div className="join-space-visual" aria-hidden="true">
            <RoomVisual room={room} />
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
            {isConnected && !connectedChain && (
              <div className="transport-notice"><WarningCircle size={19} /> Switch to Monad Testnet, Base Sepolia, or Ethereum Sepolia before joining.</div>
            )}
            {connectedChain && !connectedChain.contracts.sessions && (
              <div className="transport-notice"><WarningCircle size={19} /> Session recording is not deployed on {connectedChain.name} yet. Room collaboration remains available.</div>
            )}
            {realtime.error && <div className="inline-error" role="alert">{realtime.error}</div>}
            {isConnected ? (
              <button className="product-button primary" type="button" onClick={handleJoin} disabled={realtime.status === "connecting" || roomFull || !supportedChainId}>
                <UsersThree size={19} /> {roomFull ? "Room full" : realtime.status === "connecting" ? "Joining room" : `Join Room (${liveCount}/${room.capacity})`}
              </button>
            ) : (
              <WalletControl placement="hero" />
            )}
          </div>
        </section>
        {transactionDialog}
      </>
    );
  }

  return (
    <section ref={workspaceRef} className={`room-workspace${isFullscreen ? " is-fullscreen" : ""}${isExpanded ? " is-expanded" : ""}`}>
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
            <div><strong>{formatTimer(elapsed)}</strong><span>{eligible ? "Eligible for on-chain record" : `${formatTimer(remaining)} to qualify`}</span></div>
          </div>
          <button
            type="button"
            className="workspace-fullscreen-action"
            onClick={() => void toggleFullscreen()}
            aria-label={isFullscreen || isExpanded ? "Exit expanded room" : "Expand room"}
            title={isFullscreen || isExpanded ? "Exit expanded room" : fullscreenAvailable ? "Present room fullscreen" : "Expand room in this page"}
          >
            {isFullscreen || isExpanded ? <CornersIn size={19} /> : <CornersOut size={19} />}
            <span>{isFullscreen || isExpanded ? "Exit" : "Fullscreen"}</span>
          </button>
        </div>

        <div className="workspace-view">
          {activeTab === "members" ? (
            <ActiveMembers
              members={realtime.members}
              currentAddress={address}
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
            <h2 id="leave-dialog-title">{eligible ? "Record this focus session?" : "Leave without a record?"}</h2>
            <p>
              {eligible
                ? `You accumulated ${formatTimer(elapsed)} while joined. Leaving freezes the exact duration. A wallet transaction is required to record it on ${getChainConfig(session?.chainId)?.name ?? "the session network"}.`
                : `You accumulated ${formatTimer(elapsed)}. Sessions need at least 30:00 of joined room time before they can be recorded.`}
            </p>
            <div className="leave-dialog-actions">
              {eligible && <button type="button" className="save" onClick={() => void finishLeave(true)}><CheckCircle size={18} /> Record on-chain and leave</button>}
              <button type="button" className="discard" onClick={() => void finishLeave(false)}><SignOut size={18} /> {eligible ? "Leave — record later" : "Leave room"}</button>
              <button type="button" className="cancel" onClick={cancelLeave}>Stay in room</button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
