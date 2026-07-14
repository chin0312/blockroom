import Link from "next/link";

export function Brand() {
  return (
    <Link className="brand" href="/" aria-label="BlockRoom home">
      <span className="brand-mark" aria-hidden="true">
        <span className="brand-core" />
      </span>
      <span>BlockRoom</span>
    </Link>
  );
}
