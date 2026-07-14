import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/icons";
import { RoomSessionPanel } from "@/components/room-session-panel";
import { getRoom, rooms } from "@/lib/rooms";

export function generateStaticParams() {
  return rooms.map((room) => ({ slug: room.slug }));
}

export default async function RoomDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const room = getRoom(slug);
  if (!room) notFound();

  return (
    <div className="page-enter room-detail-page page-frame">
      <div className="room-breadcrumb">
        <Link href="/rooms"><Icon name="arrow" size={17} /> All rooms</Link>
        <span>/</span><span>{room.name}</span>
      </div>
      <header className="room-product-header">
        <div>
          <span className="type-pill">{room.type}</span>
          <h1>{room.name}</h1>
          <p>{room.description}</p>
        </div>
        <div className="room-purpose"><span>Focus context</span><strong>{room.intention}</strong></div>
      </header>
      <RoomSessionPanel room={room} />
    </div>
  );
}
