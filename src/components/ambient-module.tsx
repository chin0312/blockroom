type AmbientVariant =
  | "identity"
  | "room"
  | "time"
  | "proof"
  | "signature"
  | "coworking"
  | "hackathon";

type AmbientSize = "hero" | "panel" | "card" | "mini" | "nano";

function Satellite({ className }: { className: string }) {
  return (
    <span className={`ambient-satellite ${className}`}>
      <i className="ambient-satellite-shell" />
      <i className="ambient-satellite-light" />
    </span>
  );
}

export function AmbientModule({
  variant = "room",
  size = "panel",
  className = "",
}: {
  variant?: AmbientVariant;
  size?: AmbientSize;
  className?: string;
}) {
  return (
    <div
      className={`ambient-module ambient-${variant} ambient-size-${size} ${className}`.trim()}
      aria-hidden="true"
    >
      <span className="ambient-haze" />
      <span className="ambient-ground">
        <i className="ambient-terrain ambient-terrain-a" />
        <i className="ambient-terrain ambient-terrain-b" />
        <span className="ambient-pod">
          <i className="ambient-pod-back" />
          <i className="ambient-pod-window" />
          <i className="ambient-pod-seat" />
          <i className="ambient-pod-core" />
        </span>
        <Satellite className="ambient-satellite-a" />
        <Satellite className="ambient-satellite-b" />
        <Satellite className="ambient-satellite-c" />
        <Satellite className="ambient-satellite-d" />
        <i className="ambient-pebble ambient-pebble-a" />
        <i className="ambient-pebble ambient-pebble-b" />
      </span>
    </div>
  );
}
