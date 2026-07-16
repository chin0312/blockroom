type AmbientVariant =
  | "identity"
  | "room"
  | "time"
  | "proof"
  | "signature"
  | "coworking"
  | "hackathon";

type AmbientSize = "hero" | "panel" | "card" | "mini" | "nano";

import { Icon, type IconName } from "./icons";

const variantIcons: Record<AmbientVariant, IconName> = {
  identity: "wallet",
  room: "group",
  time: "timer",
  proof: "shield",
  signature: "check",
  coworking: "briefcase",
  hackathon: "cube",
};

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
      <span className="ambient-bloom" />
      <span className="ambient-glyph"><Icon name={variantIcons[variant]} size={size === "nano" ? 18 : size === "mini" ? 22 : 28} /></span>
    </div>
  );
}
