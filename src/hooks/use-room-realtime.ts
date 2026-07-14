"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient, type RealtimeChannel } from "@supabase/supabase-js";
import type {
  RealtimeMode,
  RealtimeStatus,
  RoomMember,
  RoomMessage,
} from "@/lib/realtime-types";

const HEARTBEAT_MS = 4_000;
const STALE_AFTER_MS = 12_000;
const MAX_MESSAGES = 100;

type LocalEvent =
  | { type: "presence"; member: RoomMember }
  | { type: "leave"; clientId: string }
  | { type: "chat"; message: RoomMessage }
  | { type: "sync-request" };

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function newClientId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function presenceKey(roomSlug: string) {
  return `blockroom:presence:${roomSlug}`;
}

function readLocalMembers(roomSlug: string): Record<string, RoomMember> {
  try {
    return JSON.parse(
      window.localStorage.getItem(presenceKey(roomSlug)) ?? "{}",
    ) as Record<string, RoomMember>;
  } catch {
    return {};
  }
}

function writeLocalMember(roomSlug: string, member: RoomMember | null, clientId: string) {
  const current = readLocalMembers(roomSlug);
  if (member) current[clientId] = member;
  else delete current[clientId];
  window.localStorage.setItem(presenceKey(roomSlug), JSON.stringify(current));
}

export function useRoomRealtime(roomSlug: string, address?: string) {
  const [clientId] = useState(newClientId);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const localChannelRef = useRef<BroadcastChannel | null>(null);
  const memberRef = useRef<RoomMember | null>(null);
  const [joined, setJoined] = useState(false);
  const [status, setStatus] = useState<RealtimeStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [membersById, setMembersById] = useState<Record<string, RoomMember>>({});
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const mode: RealtimeMode = supabaseUrl && supabaseKey ? "supabase" : "local-tabs";

  const cleanLocalMembers = useCallback(() => {
    const now = Date.now();
    const current = readLocalMembers(roomSlug);
    const fresh = Object.fromEntries(
      Object.entries(current).filter(
        ([, member]) => now - new Date(member.updatedAt).getTime() < STALE_AFTER_MS,
      ),
    );
    window.localStorage.setItem(presenceKey(roomSlug), JSON.stringify(fresh));
    setMembersById(fresh);
  }, [roomSlug]);

  const publishLocal = useCallback(
    (event: LocalEvent) => localChannelRef.current?.postMessage(event),
    [],
  );

  const leave = useCallback(async () => {
    const member = memberRef.current;
    memberRef.current = null;
    setJoined(false);
    setStatus("idle");

    if (mode === "supabase" && channelRef.current) {
      const channel = channelRef.current;
      channelRef.current = null;
      await channel.untrack();
      await channel.unsubscribe();
    } else if (member) {
      writeLocalMember(roomSlug, null, member.clientId);
      publishLocal({ type: "leave", clientId: member.clientId });
      setMembersById((current) => {
        const next = { ...current };
        delete next[member.clientId];
        return next;
      });
    }
  }, [mode, publishLocal, roomSlug]);

  const updateMember = useCallback(
    async (updates: Partial<Pick<RoomMember, "status" | "muted" | "sharing">>) => {
      const member = memberRef.current;
      if (!member) return;
      const next = { ...member, ...updates, updatedAt: new Date().toISOString() };
      memberRef.current = next;
      setMembersById((current) => ({ ...current, [next.clientId]: next }));

      if (mode === "supabase") await channelRef.current?.track(next);
      else {
        writeLocalMember(roomSlug, next, next.clientId);
        publishLocal({ type: "presence", member: next });
      }
    },
    [mode, publishLocal, roomSlug],
  );

  const join = useCallback(async () => {
    if (!address || joined || status === "connecting") return;
    setStatus("connecting");
    setError(null);

    const now = new Date().toISOString();
    const member: RoomMember = {
      clientId,
      address: address.toLowerCase(),
      status: "available",
      muted: true,
      sharing: false,
      joinedAt: now,
      updatedAt: now,
    };
    memberRef.current = member;

    if (mode === "supabase") {
      try {
        const client = createClient(supabaseUrl!, supabaseKey!, {
          realtime: { params: { eventsPerSecond: 10 } },
        });
        const channel = client.channel(`blockroom:${roomSlug}`, {
          config: { presence: { key: member.clientId }, broadcast: { self: false } },
        });
        channelRef.current = channel;

        channel
          .on("presence", { event: "sync" }, () => {
            const state = channel.presenceState<RoomMember>();
            const next: Record<string, RoomMember> = {};
            Object.values(state).flat().forEach((entry) => {
              if (entry.clientId) next[entry.clientId] = entry;
            });
            setMembersById(next);
          })
          .on("broadcast", { event: "chat" }, ({ payload }) => {
            const message = payload as RoomMessage;
            setMessages((current) => [...current.slice(-(MAX_MESSAGES - 1)), message]);
          })
          .subscribe(async (subscriptionStatus) => {
            if (subscriptionStatus === "SUBSCRIBED") {
              await channel.track(member);
              setJoined(true);
              setStatus("connected");
            }
            if (
              subscriptionStatus === "CHANNEL_ERROR" ||
              subscriptionStatus === "TIMED_OUT"
            ) {
              setStatus("error");
              setError("Realtime channel could not connect. Check the Supabase project settings.");
            }
          });
      } catch {
        memberRef.current = null;
        setStatus("error");
        setError("Realtime channel could not be created.");
      }
      return;
    }

    writeLocalMember(roomSlug, member, member.clientId);
    publishLocal({ type: "presence", member });
    cleanLocalMembers();
    setJoined(true);
    setStatus("connected");
  }, [address, cleanLocalMembers, clientId, joined, mode, publishLocal, roomSlug, status]);

  const sendMessage = useCallback(
    async (body: string) => {
      const member = memberRef.current;
      const trimmed = body.trim().slice(0, 500);
      if (!member || !trimmed) return false;
      const message: RoomMessage = {
        id: newClientId(),
        clientId: member.clientId,
        address: member.address,
        body: trimmed,
        sentAt: new Date().toISOString(),
      };
      setMessages((current) => [...current.slice(-(MAX_MESSAGES - 1)), message]);
      if (mode === "supabase") {
        await channelRef.current?.send({ type: "broadcast", event: "chat", payload: message });
      } else publishLocal({ type: "chat", message });
      return true;
    },
    [mode, publishLocal],
  );

  useEffect(() => {
    if (mode !== "local-tabs" || typeof BroadcastChannel === "undefined") return;
    const channel = new BroadcastChannel(`blockroom-room:${roomSlug}`);
    localChannelRef.current = channel;
    channel.onmessage = ({ data }: MessageEvent<LocalEvent>) => {
      if (data.type === "presence") {
        setMembersById((current) => ({ ...current, [data.member.clientId]: data.member }));
      } else if (data.type === "leave") {
        setMembersById((current) => {
          const next = { ...current };
          delete next[data.clientId];
          return next;
        });
      } else if (data.type === "chat") {
        setMessages((current) => [...current.slice(-(MAX_MESSAGES - 1)), data.message]);
      } else if (data.type === "sync-request" && memberRef.current) {
        publishLocal({ type: "presence", member: memberRef.current });
      }
    };
    publishLocal({ type: "sync-request" });
    queueMicrotask(cleanLocalMembers);
    return () => {
      channel.close();
      localChannelRef.current = null;
    };
  }, [cleanLocalMembers, mode, publishLocal, roomSlug]);

  useEffect(() => {
    if (!joined || mode !== "local-tabs") return;
    const heartbeat = window.setInterval(() => {
      if (memberRef.current) void updateMember({});
      cleanLocalMembers();
    }, HEARTBEAT_MS);
    return () => window.clearInterval(heartbeat);
  }, [cleanLocalMembers, joined, mode, updateMember]);

  useEffect(() => {
    if (address || !joined) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) void leave();
    });
    return () => {
      cancelled = true;
    };
  }, [address, joined, leave]);

  useEffect(() => {
    function handlePageHide() {
      const member = memberRef.current;
      if (!member) return;
      if (mode === "local-tabs") {
        writeLocalMember(roomSlug, null, member.clientId);
        publishLocal({ type: "leave", clientId: member.clientId });
      } else {
        void channelRef.current?.untrack();
      }
    }
    window.addEventListener("pagehide", handlePageHide);
    return () => {
      window.removeEventListener("pagehide", handlePageHide);
      void leave();
    };
  }, [leave, mode, publishLocal, roomSlug]);

  const members = useMemo(
    () => Object.values(membersById).sort((a, b) => a.joinedAt.localeCompare(b.joinedAt)),
    [membersById],
  );

  return {
    clientId,
    mode,
    status,
    error,
    joined,
    members,
    messages,
    join,
    leave,
    updateMember,
    sendMessage,
  };
}
