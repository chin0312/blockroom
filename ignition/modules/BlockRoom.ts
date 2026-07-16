import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("BlockRoomModule", (m) => {
  const blockRoom = m.contract("BlockRoom");
  return { blockRoom };
});
