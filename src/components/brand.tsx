import Link from "next/link";

export function Brand() {
  return (
    <Link className="brand" href="/" aria-label="BlockRoom home">
      <span className="brand-mark" aria-hidden="true">
        <span className="brand-orbit brand-orbit-a" />
        <span className="brand-orbit brand-orbit-b" />
        <span className="brand-orbit brand-orbit-c" />
      </span>
      <span>BlockRoom</span>
    </Link>
  );
}
