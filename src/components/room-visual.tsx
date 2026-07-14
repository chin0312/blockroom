import { Icon, type IconName } from "./icons";
import type { Room } from "@/lib/rooms";

const roomIcons: Record<Room["type"], IconName> = {
  Learning: "book",
  "Co-working": "briefcase",
  Hackathon: "spark",
};

export function RoomVisual({ room, compact = false }: { room: Room; compact?: boolean }) {
  return (
    <div className={`room-art room-art-${room.accent}${compact ? " compact" : ""}`} aria-hidden="true">
      <span className="room-art-grid" />
      <span className="room-art-orbit orbit-a" />
      <span className="room-art-orbit orbit-b" />
      <span className="room-art-core">
        <Icon name={roomIcons[room.type]} size={compact ? 24 : 32} />
      </span>
      <span className="room-art-node node-a" />
      <span className="room-art-node node-b" />
    </div>
  );
}
