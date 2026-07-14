import {
  ArrowRight,
  BookOpen,
  Briefcase,
  Check,
  Cube,
  List,
  MinusCircle,
  Pause,
  Play,
  ShieldCheck,
  Sparkle,
  SquaresFour,
  Timer,
  UsersThree,
  Wallet,
  X,
} from "@phosphor-icons/react/dist/ssr";

export type IconName =
  | "arrow"
  | "book"
  | "briefcase"
  | "check"
  | "close"
  | "cube"
  | "dashboard"
  | "empty"
  | "group"
  | "menu"
  | "pause"
  | "play"
  | "shield"
  | "spark"
  | "timer"
  | "wallet";

type PhosphorIcon = typeof ArrowRight;

const iconMap: Record<IconName, PhosphorIcon> = {
  arrow: ArrowRight,
  book: BookOpen,
  briefcase: Briefcase,
  check: Check,
  close: X,
  cube: Cube,
  dashboard: SquaresFour,
  empty: MinusCircle,
  group: UsersThree,
  menu: List,
  pause: Pause,
  play: Play,
  shield: ShieldCheck,
  spark: Sparkle,
  timer: Timer,
  wallet: Wallet,
};

export function Icon({ name, size = 24 }: { name: IconName; size?: number }) {
  const Glyph = iconMap[name];
  return <Glyph aria-hidden="true" size={size} weight="regular" />;
}
