import type { Room } from "@/lib/rooms";
import { CrystalHardware } from "./crystal-hardware";

export function RoomVisual({ room, compact = false }: { room: Room; compact?: boolean }) {
  const variant = room.type === "Co-working" ? "coworking" : room.type === "Hackathon" ? "hackathon" : "room";

  return (
    <div className={`room-art room-art-${room.accent}${compact ? " compact" : ""}`} aria-hidden="true">
      <CrystalHardware variant={variant} size="card" />
    </div>
  );
}
