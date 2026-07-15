"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import type { LobbyMember, RoomMember } from "@/lib/realtime-types";

const STALE_AFTER_MS = 90_000;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function readLocalCount(roomSlug: string) {
  try {
    const members = JSON.parse(
      window.localStorage.getItem(`blockroom:presence:${roomSlug}`) ?? "{}",
    ) as Record<string, RoomMember>;
    const now = Date.now();
    return Object.values(members).filter(
      (member) => now - new Date(member.updatedAt).getTime() < STALE_AFTER_MS,
    ).length;
  } catch {
    return 0;
  }
}

export function useRoomOccupancy(roomSlugs: string[]) {
  const slugKey = roomSlugs.join("|");
  const stableSlugs = useMemo(() => slugKey.split("|").filter(Boolean), [slugKey]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const mode = supabaseUrl && supabaseKey ? "supabase" : "local-tabs";

  useEffect(() => {
    if (mode === "local-tabs") {
      const refresh = () => {
        setCounts(Object.fromEntries(stableSlugs.map((slug) => [slug, readLocalCount(slug)])));
      };
      refresh();
      const interval = window.setInterval(refresh, 2_000);
      window.addEventListener("storage", refresh);
      return () => {
        window.clearInterval(interval);
        window.removeEventListener("storage", refresh);
      };
    }

    const client = createClient(supabaseUrl!, supabaseKey!, {
      realtime: { params: { eventsPerSecond: 10 } },
    });
    const channel = client.channel("blockroom:lobby");
    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<LobbyMember>();
        const next = Object.fromEntries(stableSlugs.map((slug) => [slug, 0]));
        Object.values(state).flat().forEach((member) => {
          if (member.roomSlug in next) next[member.roomSlug] += 1;
        });
        setCounts(next);
      })
      .subscribe();

    return () => {
      void channel.unsubscribe();
    };
  }, [mode, stableSlugs]);

  return { counts, mode };
}
