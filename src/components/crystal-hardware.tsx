type HardwareVariant =
  | "identity"
  | "room"
  | "time"
  | "proof"
  | "signature"
  | "coworking"
  | "hackathon";

type HardwareSize = "hero" | "panel" | "card" | "mini" | "nano";

function Volume({ className, luminous = false }: { className: string; luminous?: boolean }) {
  return (
    <span className={`hardware-volume ${className}`}>
      <i className="hardware-face hardware-face-top">
        {luminous && <b className="hardware-light" />}
      </i>
      <i className="hardware-face hardware-face-front" />
      <i className="hardware-face hardware-face-side" />
    </span>
  );
}

export function CrystalHardware({
  variant = "room",
  size = "panel",
  className = "",
}: {
  variant?: HardwareVariant;
  size?: HardwareSize;
  className?: string;
}) {
  return (
    <div className={`crystal-hardware hardware-${variant} hardware-size-${size} ${className}`.trim()} aria-hidden="true">
      <span className="hardware-ground-shadow" />
      <span className="hardware-stage">
        <Volume className="hardware-base" />
        <Volume className="hardware-floor hardware-floor-low" />
        <Volume className="hardware-node hardware-node-a" luminous />
        <Volume className="hardware-node hardware-node-b" luminous />
        <Volume className="hardware-node hardware-node-c" luminous />
        <Volume className="hardware-node hardware-node-d" luminous />
        <Volume className="hardware-floor hardware-floor-mid" />
        <Volume className="hardware-chip hardware-chip-a" luminous />
        <Volume className="hardware-chip hardware-chip-b" luminous />
        <Volume className="hardware-chip hardware-chip-c" luminous />
        <Volume className="hardware-chip hardware-chip-d" luminous />
        <Volume className="hardware-floor hardware-floor-top" />
        <Volume className="hardware-lid" />
        <Volume className="hardware-cap" luminous />
      </span>
    </div>
  );
}
