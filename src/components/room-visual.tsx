import type { Room } from "@/lib/rooms";

function Cuboid({ className, illuminated = false }: { className: string; illuminated?: boolean }) {
  return (
    <span className={`crystal-cuboid ${className}`}>
      <i className="cuboid-face cuboid-top">
        {illuminated && <b className="cuboid-light" />}
      </i>
      <i className="cuboid-face cuboid-front" />
      <i className="cuboid-face cuboid-side" />
    </span>
  );
}

function LearningModule({ variant }: { variant: number }) {
  if (variant % 2 === 0) {
    return (
      <>
        <Cuboid className="learning-cluster-deck" />
        <Cuboid className="learning-cluster-core" illuminated />
        <Cuboid className="learning-tower tower-nw" illuminated />
        <Cuboid className="learning-tower tower-ne" illuminated />
        <Cuboid className="learning-tower tower-se" illuminated />
        <Cuboid className="learning-tower tower-sw" illuminated />
      </>
    );
  }

  return (
    <>
      <Cuboid className="learning-console-deck" />
      <Cuboid className="learning-console-cube" illuminated />
      <Cuboid className="learning-console-rail" />
      <Cuboid className="learning-console-key key-one" illuminated />
      <Cuboid className="learning-console-key key-two" illuminated />
      <Cuboid className="learning-console-key key-three" illuminated />
    </>
  );
}

function CoworkingModule() {
  return (
    <>
      <Cuboid className="coworking-cube coworking-core" illuminated />
      <Cuboid className="coworking-cube coworking-nw" illuminated />
      <Cuboid className="coworking-cube coworking-ne" illuminated />
      <Cuboid className="coworking-cube coworking-se" illuminated />
      <Cuboid className="coworking-cube coworking-sw" illuminated />
    </>
  );
}

function HackathonModule() {
  return (
    <>
      <Cuboid className="hack-stack hack-stack-bottom" />
      <Cuboid className="hack-stack hack-stack-middle" />
      <Cuboid className="hack-stack hack-stack-top" />
      <Cuboid className="hack-stack-key hack-key-one" illuminated />
      <Cuboid className="hack-stack-key hack-key-two" illuminated />
      <Cuboid className="hack-stack-key hack-key-three" illuminated />
      <Cuboid className="hack-stack-key hack-key-four" illuminated />
    </>
  );
}

export function RoomVisual({ room, compact = false }: { room: Room; compact?: boolean }) {
  const variant = Number(room.slug.at(-1)) || 1;
  const typeClass = room.type.toLowerCase().replace("-", "");

  return (
    <div className={`room-art room-art-${room.accent}${compact ? " compact" : ""}`} aria-hidden="true">
      <span className={`crystal-room-module module-${typeClass} module-variant-${variant}`}>
        <span className="crystal-module-shadow" />
        {room.type === "Learning" && <LearningModule variant={variant} />}
        {room.type === "Co-working" && <CoworkingModule />}
        {room.type === "Hackathon" && <HackathonModule />}
      </span>
    </div>
  );
}
