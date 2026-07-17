import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("BlockRoomV1Module", (m) => {
  const sessions = m.contract("BlockRoomSessions");
  const badges = m.contract("BlockRoomBadges", [sessions]);

  return { sessions, badges };
});
