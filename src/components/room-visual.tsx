import { BookOpen, Code, Laptop } from "@phosphor-icons/react/dist/ssr";
import type { Room } from "@/lib/rooms";

export function RoomVisual({ room, compact = false }: { room: Room; compact?: boolean }) {
  const kind = room.type === "Co-working" ? "coworking" : room.type === "Hackathon" ? "hackathon" : "learning";
  const Glyph = kind === "learning" ? BookOpen : kind === "coworking" ? Laptop : Code;

  return (
    <div className={`room-art room-art-${kind} room-art-${room.accent}${compact ? " compact" : ""}`} aria-hidden="true">
      <span className="room-art-bloom" />
      <span className="room-art-orbit room-art-orbit-a" />
      <span className="room-art-orbit room-art-orbit-b" />
      <span className="room-art-symbol"><Glyph size={compact ? 28 : 38} weight="light" /></span>
      <span className="room-art-detail room-art-detail-a"><Glyph size={14} weight="light" /></span>
      <span className="room-art-detail room-art-detail-b"><Glyph size={12} weight="light" /></span>
      <span className="room-art-caption">{room.type}</span>
    </div>
  );
}
