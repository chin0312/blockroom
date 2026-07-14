import { RoomDirectory } from "@/components/room-directory";

export default function RoomsPage() {
  return (
    <div className="page-enter inner-page page-frame rooms-page">
      <header className="editorial-header room-directory-header">
        <span className="page-code">03 / ROOMS</span>
        <div>
          <span className="section-label">Choose a focus context</span>
          <h1>Choose your<br />focus context.</h1>
        </div>
        <p>
          Enter a room to load its real presence channel. People appear only
          after a connected wallet explicitly joins.
        </p>
      </header>
      <RoomDirectory />
    </div>
  );
}
