export type RoomType = "Learning" | "Co-working" | "Hackathon";

export type Room = {
  slug: string;
  name: string;
  type: RoomType;
  description: string;
  intention: string;
  accent: "cobalt" | "periwinkle" | "steel" | "midnight";
  capacity: number;
};

export const ROOM_CAPACITY = 6;

const accents: Room["accent"][] = ["cobalt", "periwinkle", "steel", "midnight"];

const roomGroups: Array<{
  type: RoomType;
  slugPrefix: string;
  namePrefix: string;
  description: string;
  intention: string;
}> = [
  {
    type: "Learning",
    slugPrefix: "learning-room",
    namePrefix: "Learning Room",
    description: "Group study session, open to anyone learning together",
    intention: "Bring one clear topic and use the room as a quiet focus anchor.",
  },
  {
    type: "Co-working",
    slugPrefix: "co-working-space",
    namePrefix: "Co-working Space",
    description: "Focus together, work independently, body-double style",
    intention: "Set a task, keep the room open, and work without performative updates.",
  },
  {
    type: "Hackathon",
    slugPrefix: "hackathon-preparation",
    namePrefix: "Hackathon Preparation",
    description: "Prep together for your next hackathon",
    intention: "Use the space for focused planning, building, or submission prep.",
  },
];

export const rooms: Room[] = roomGroups.flatMap((group, groupIndex) =>
  Array.from({ length: 4 }, (_, index) => ({
    slug: `${group.slugPrefix}-${index + 1}`,
    name: `${group.namePrefix} ${index + 1}`,
    type: group.type,
    description: group.description,
    intention: group.intention,
    accent: accents[(groupIndex + index) % accents.length],
    capacity: ROOM_CAPACITY,
  })),
);

export function getRoom(slug: string) {
  return rooms.find((room) => room.slug === slug);
}
