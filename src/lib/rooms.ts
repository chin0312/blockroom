export type RoomType = "Learning" | "Co-working" | "Hackathon";

export type Room = {
  slug: string;
  name: string;
  type: RoomType;
  description: string;
  intention: string;
  accent: "cobalt" | "periwinkle" | "steel" | "midnight";
};

export const rooms: Room[] = [
  {
    slug: "learning-room-1",
    name: "Learning Room 1",
    type: "Learning",
    description: "Group study session — open to anyone learning together",
    intention: "Bring one clear topic and use the room as a quiet focus anchor.",
    accent: "cobalt",
  },
  {
    slug: "learning-room-2",
    name: "Learning Room 2",
    type: "Learning",
    description: "Group study session — open to anyone learning together",
    intention: "A second open space for reading, practice, or course work.",
    accent: "periwinkle",
  },
  {
    slug: "co-working-space-1",
    name: "Co-working Space 1",
    type: "Co-working",
    description: "Focus together, work independently, body-double style",
    intention: "Set a task, keep the room open, and work without performative updates.",
    accent: "steel",
  },
  {
    slug: "hackathon-preparation",
    name: "Hackathon Preparation",
    type: "Hackathon",
    description: "Prep together for your next hackathon",
    intention: "Use the space for focused planning, building, or submission prep.",
    accent: "midnight",
  },
];

export function getRoom(slug: string) {
  return rooms.find((room) => room.slug === slug);
}
