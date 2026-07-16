"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RtcSignal, RoomMember } from "@/lib/realtime-types";

type PeerState = {
  pc: RTCPeerConnection;
  makingOffer: boolean;
  ignoreOffer: boolean;
  isSettingRemoteAnswerPending: boolean;
  polite: boolean;
  pendingCandidates: RTCIceCandidateInit[];
};

type SendSignal = (signal: Omit<RtcSignal, "senderId">) => Promise<void>;
type SubscribeSignals = (listener: (signal: RtcSignal) => void) => () => void;

const RTC_CONFIGURATION: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export function useRoomMedia({
  clientId,
  members,
  joined,
  sendSignal,
  subscribeSignals,
  updateMember,
}: {
  clientId: string;
  members: RoomMember[];
  joined: boolean;
  sendSignal: SendSignal;
  subscribeSignals: SubscribeSignals;
  updateMember: (updates: Partial<Pick<RoomMember, "muted" | "sharing" | "cameraOn">>) => Promise<void>;
}) {
  const peersRef = useRef(new Map<string, PeerState>());
  const outboundStreamRef = useRef<MediaStream | null>(null);
  const microphoneTrackRef = useRef<MediaStreamTrack | null>(null);
  const cameraTrackRef = useRef<MediaStreamTrack | null>(null);
  const screenTrackRef = useRef<MediaStreamTrack | null>(null);
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
  const [mediaError, setMediaError] = useState<string | null>(null);

  const publishSignal = useCallback(
    (targetId: string, signal: Omit<RtcSignal, "senderId" | "targetId">) =>
      sendSignal({ ...signal, targetId }),
    [sendSignal],
  );

  const ensurePeer = useCallback((remoteId: string) => {
    const existing = peersRef.current.get(remoteId);
    if (existing) return existing;

    const pc = new RTCPeerConnection(RTC_CONFIGURATION);
    const peer: PeerState = {
      pc,
      makingOffer: false,
      ignoreOffer: false,
      isSettingRemoteAnswerPending: false,
      polite: clientId.localeCompare(remoteId) > 0,
      pendingCandidates: [],
    };
    peersRef.current.set(remoteId, peer);

    const outboundStream = outboundStreamRef.current ?? new MediaStream();
    outboundStreamRef.current = outboundStream;
    outboundStream.getTracks().forEach((track) => {
      pc.addTrack(track, outboundStream);
    });
    pc.onicecandidate = ({ candidate }) => {
      if (candidate) void publishSignal(remoteId, { kind: "ice", candidate: candidate.toJSON() });
    };
    pc.ontrack = (event) => {
      const stream = event.streams[0] ?? new MediaStream([event.track]);
      setRemoteStreams((current) => ({ ...current, [remoteId]: stream }));
    };
    pc.onconnectionstatechange = () => {
      if (["failed", "closed", "disconnected"].includes(pc.connectionState)) {
        setRemoteStreams((current) => {
          const next = { ...current };
          delete next[remoteId];
          return next;
        });
      }
    };
    pc.onnegotiationneeded = async () => {
      try {
        peer.makingOffer = true;
        await pc.setLocalDescription();
        if (pc.localDescription) {
          await publishSignal(remoteId, {
            kind: pc.localDescription.type === "answer" ? "answer" : "offer",
            description: pc.localDescription.toJSON(),
          });
        }
      } catch {
        setMediaError("A peer connection could not be negotiated.");
      } finally {
        peer.makingOffer = false;
      }
    };
    return peer;
  }, [clientId, publishSignal]);

  const replaceOutboundTrack = useCallback(async (kind: "audio" | "video", track: MediaStreamTrack | null) => {
    const outboundStream = outboundStreamRef.current ?? new MediaStream();
    outboundStreamRef.current = outboundStream;
    const previous = outboundStream.getTracks().find((item) => item.kind === kind);
    if (previous) outboundStream.removeTrack(previous);
    if (track) outboundStream.addTrack(track);

    await Promise.all(Array.from(peersRef.current.values()).map(async ({ pc }) => {
      const sender = pc.getTransceivers().find(
        (item) => item.sender.track?.kind === kind || (!item.sender.track && item.receiver.track.kind === kind),
      )?.sender;
      if (sender) await sender.replaceTrack(track);
      else if (track) pc.addTrack(track, outboundStream);
    }));
  }, []);

  const refreshPreview = useCallback(() => {
    const tracks = [
      screenTrackRef.current ?? cameraTrackRef.current,
      microphoneTrackRef.current,
    ].filter((track): track is MediaStreamTrack => Boolean(track && track.readyState === "live"));
    setPreviewStream(tracks.length ? new MediaStream(tracks) : null);
  }, []);

  const stopScreenShare = useCallback(async () => {
    const screenTrack = screenTrackRef.current;
    screenTrackRef.current = null;
    if (screenTrack) screenTrack.stop();
    await replaceOutboundTrack("video", cameraTrackRef.current);
    refreshPreview();
    await updateMember({ sharing: false });
  }, [refreshPreview, replaceOutboundTrack, updateMember]);

  const toggleMicrophone = useCallback(async (currentlyMuted: boolean) => {
    setMediaError(null);
    try {
      if (currentlyMuted) {
        let track = microphoneTrackRef.current;
        if (!track || track.readyState === "ended") {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          track = stream.getAudioTracks()[0] ?? null;
          microphoneTrackRef.current = track;
          if (track) track.enabled = true;
          await replaceOutboundTrack("audio", track);
        } else {
          track.enabled = true;
        }
        refreshPreview();
        await updateMember({ muted: false });
      } else {
        if (microphoneTrackRef.current) microphoneTrackRef.current.enabled = false;
        refreshPreview();
        await updateMember({ muted: true });
      }
    } catch (error) {
      setMediaError(error instanceof Error ? error.message : "Microphone permission was not granted.");
    }
  }, [refreshPreview, replaceOutboundTrack, updateMember]);

  const toggleCamera = useCallback(async (currentlyOn: boolean) => {
    setMediaError(null);
    try {
      if (currentlyOn) {
        const track = cameraTrackRef.current;
        cameraTrackRef.current = null;
        if (track) track.stop();
        if (!screenTrackRef.current) await replaceOutboundTrack("video", null);
        refreshPreview();
        await updateMember({ cameraOn: false });
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      const track = stream.getVideoTracks()[0] ?? null;
      cameraTrackRef.current = track;
      if (!screenTrackRef.current) await replaceOutboundTrack("video", track);
      refreshPreview();
      await updateMember({ cameraOn: Boolean(track) });
    } catch (error) {
      setMediaError(error instanceof Error ? error.message : "Camera permission was not granted.");
    }
  }, [refreshPreview, replaceOutboundTrack, updateMember]);

  const toggleScreenShare = useCallback(async (currentlySharing: boolean) => {
    setMediaError(null);
    if (currentlySharing) {
      await stopScreenShare();
      return;
    }
    try {
      if (!navigator.mediaDevices?.getDisplayMedia) throw new Error("Screen capture is unavailable in this browser.");
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      const track = stream.getVideoTracks()[0] ?? null;
      if (!track) throw new Error("No screen video track was provided.");
      track.contentHint = "detail";
      screenTrackRef.current = track;
      refreshPreview();
      await replaceOutboundTrack("video", track);
      await updateMember({ sharing: true });
      track.addEventListener("ended", () => void stopScreenShare(), { once: true });
    } catch (error) {
      const failedTrack = screenTrackRef.current;
      screenTrackRef.current = null;
      if (failedTrack) failedTrack.stop();
      refreshPreview();
      await replaceOutboundTrack("video", cameraTrackRef.current).catch(() => undefined);
      await updateMember({ sharing: false }).catch(() => undefined);
      setMediaError(error instanceof Error ? error.message : "Screen sharing permission was not granted.");
    }
  }, [refreshPreview, replaceOutboundTrack, stopScreenShare, updateMember]);

  useEffect(() => subscribeSignals((signal) => {
    if (signal.targetId !== clientId || signal.senderId === clientId) return;
    void (async () => {
      const peer = ensurePeer(signal.senderId);
      const { pc } = peer;
      try {
        if (signal.kind === "ice" && signal.candidate) {
          if (!pc.remoteDescription) {
            peer.pendingCandidates.push(signal.candidate);
            return;
          }
          try {
            await pc.addIceCandidate(signal.candidate);
          } catch {
            if (!peer.ignoreOffer) throw new Error("ICE candidate failed");
          }
          return;
        }
        if (!signal.description) return;
        const readyForOffer = !peer.makingOffer &&
          (pc.signalingState === "stable" || peer.isSettingRemoteAnswerPending);
        const offerCollision = signal.description.type === "offer" && !readyForOffer;
        peer.ignoreOffer = !peer.polite && offerCollision;
        if (peer.ignoreOffer) return;
        peer.isSettingRemoteAnswerPending = signal.description.type === "answer";
        await pc.setRemoteDescription(signal.description);
        peer.isSettingRemoteAnswerPending = false;
        await Promise.all(peer.pendingCandidates.splice(0).map((candidate) => pc.addIceCandidate(candidate)));
        if (signal.description.type === "offer") {
          await pc.setLocalDescription();
          if (pc.localDescription) {
            await publishSignal(signal.senderId, {
              kind: "answer",
              description: pc.localDescription.toJSON(),
            });
          }
        }
      } catch {
        setMediaError("A peer media connection could not be completed.");
      }
    })();
  }), [clientId, ensurePeer, publishSignal, subscribeSignals]);

  useEffect(() => {
    if (!joined) return;
    const remoteIds = new Set(
      members.filter((member) => member.clientId !== clientId).map((member) => member.clientId),
    );
    remoteIds.forEach((remoteId) => ensurePeer(remoteId));
    peersRef.current.forEach((peer, remoteId) => {
      if (remoteIds.has(remoteId)) return;
      peer.pc.close();
      peersRef.current.delete(remoteId);
      setRemoteStreams((current) => {
        const next = { ...current };
        delete next[remoteId];
        return next;
      });
    });
  }, [clientId, ensurePeer, joined, members]);

  const stopAllMedia = useCallback(() => {
    microphoneTrackRef.current?.stop();
    cameraTrackRef.current?.stop();
    screenTrackRef.current?.stop();
    microphoneTrackRef.current = null;
    cameraTrackRef.current = null;
    screenTrackRef.current = null;
    outboundStreamRef.current?.getTracks().forEach((track) => track.stop());
    outboundStreamRef.current = null;
    peersRef.current.forEach(({ pc }) => pc.close());
    peersRef.current.clear();
    setPreviewStream(null);
    setRemoteStreams({});
  }, []);

  useEffect(() => stopAllMedia, [stopAllMedia]);

  return {
    previewStream,
    remoteStreams,
    mediaError,
    toggleMicrophone,
    toggleCamera,
    toggleScreenShare,
    stopAllMedia,
  };
}
