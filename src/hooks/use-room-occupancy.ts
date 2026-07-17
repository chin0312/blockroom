"use client";

import { useEffect, useMemo, useState } from "react";
import type { LobbyMember, RoomMember } from "@/lib/realtime-types";
import { freshRoomSessions, lobbyParticipants, reconcileRoomParticipants, ROOM_DISCONNECT_TIMEOUT_MS } from "@/lib/room-presence";
import { getSupabaseRealtimeClient, isSupabaseRealtimeConfigured } from "@/lib/supabase-realtime";

const STALE_AFTER_MS = ROOM_DISCONNECT_TIMEOUT_MS;
function readLocalParticipants(roomSlug: string) {
  try {
    const members = JSON.parse(
      window.localStorage.getItem(`blockroom:presence:${roomSlug}`) ?? "{}",
    ) as Record<string, RoomMember>;
    const now = Date.now();
    const fresh = freshRoomSessions(Object.values(members), now, STALE_AFTER_MS);
    return reconcileRoomParticipants(fresh).map((participant) => participant.participantKey);
  } catch {
    return [];
  }
}

export function useRoomOccupancy(roomSlugs: string[]) {
  const slugKey = roomSlugs.join("|");
  const stableSlugs = useMemo(() => slugKey.split("|").filter(Boolean), [slugKey]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [addresses, setAddresses] = useState<Record<string, string[]>>({});
  const mode = isSupabaseRealtimeConfigured ? "supabase" : "local-tabs";

  useEffect(() => {
    if (mode === "local-tabs") {
      const refresh = () => {
        const nextAddresses = Object.fromEntries(
          stableSlugs.map((slug) => [slug, readLocalParticipants(slug)]),
        );
        setAddresses(nextAddresses);
        setCounts(Object.fromEntries(stableSlugs.map((slug) => [slug, nextAddresses[slug].length])));
      };
      refresh();
      const interval = window.setInterval(refresh, 2_000);
      window.addEventListener("storage", refresh);
      return () => {
        window.clearInterval(interval);
        window.removeEventListener("storage", refresh);
      };
    }

    const client = getSupabaseRealtimeClient();
    if (!client) return;
    const channel = client.channel("blockroom:lobby");
    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<LobbyMember>();
        const nextAddresses = lobbyParticipants(Object.values(state).flat(), stableSlugs);
        setAddresses(nextAddresses);
        setCounts(Object.fromEntries(stableSlugs.map((slug) => [slug, nextAddresses[slug].length])));
      })
      .subscribe();

    return () => {
      void channel.unsubscribe();
    };
  }, [mode, stableSlugs]);

  return { counts, addresses, mode };
}
