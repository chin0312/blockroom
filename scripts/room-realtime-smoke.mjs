import assert from "node:assert/strict";
import nextEnv from "@next/env";
import { createClient } from "@supabase/supabase-js";
import { privateKeyToAccount } from "viem/accounts";
import {
  isSessionAdmitted,
  reconcileRoomParticipants,
} from "../src/lib/room-presence.ts";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const privateKeys = Array.from(
  { length: 7 },
  (_, index) => process.env[`BLOCKROOM_TEST_WALLET_${index + 1}_PRIVATE_KEY`],
);

if (!url || !publishableKey) throw new Error("Supabase public environment variables are required.");
if (!privateKeys.every((value) => /^(0x)?[0-9a-fA-F]{64}$/.test(value ?? ""))) {
  throw new Error("Seven disposable BlockRoom test-wallet variables are required.");
}

const addresses = privateKeys.map((key) =>
  privateKeyToAccount((key.startsWith("0x") ? key : `0x${key}`)).address.toLowerCase(),
);
assert.equal(new Set(addresses).size, 7, "Test wallets must resolve to seven unique addresses.");

const topic = `blockroom:stability-${Date.now()}`;
const connections = [];

function payload(address, clientId, offset) {
  const time = new Date(Date.now() + offset).toISOString();
  return {
    clientId,
    address,
    chainId: offset % 3 === 0 ? 10143 : offset % 3 === 1 ? 84532 : 11155111,
    visible: true,
    status: "focusing",
    muted: true,
    sharing: false,
    cameraOn: false,
    avatar: "violet",
    joinedAt: time,
    activityAt: time,
    updatedAt: time,
  };
}

async function connect(member) {
  const client = createClient(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime: { params: { eventsPerSecond: 10 } },
  });
  const channel = client.channel(topic, { config: { presence: { key: member.clientId } } });
  channel.on("presence", { event: "sync" }, () => undefined);
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Realtime subscribe timed out.")), 10_000);
    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        clearTimeout(timer);
        await channel.track(member);
        resolve();
      } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        clearTimeout(timer);
        reject(new Error("Realtime channel failed to subscribe."));
      }
    });
  });
  const connection = { client, channel, member, closed: false };
  connections.push(connection);
  return connection;
}

function rawState(observer) {
  return Object.values(observer.channel.presenceState()).flat();
}

async function waitFor(observer, predicate, message) {
  const deadline = Date.now() + 8_000;
  let lastRaw = [];
  while (Date.now() < deadline) {
    const raw = rawState(observer);
    lastRaw = raw;
    if (predicate(raw)) return raw;
    await new Promise((resolve) => setTimeout(resolve, 80));
  }
  throw new Error(`${message} raw=${lastRaw.length} unique=${reconcileRoomParticipants(lastRaw).length}`);
}

async function disconnect(connection) {
  if (connection.closed) return;
  connection.closed = true;
  await connection.channel.untrack();
  await connection.channel.unsubscribe();
  await connection.client.removeAllChannels();
}

try {
  const firstSix = [];
  for (let index = 0; index < 6; index += 1) {
    firstSix.push(await connect(payload(addresses[index], `wallet-${index + 1}`, index)));
  }
  const observer = firstSix[0];
  let raw = await waitFor(
    observer,
    (sessions) => reconcileRoomParticipants(sessions).length === 6,
    "Six unique participants did not converge.",
  );
  assert.equal(reconcileRoomParticipants(raw).length, 6);

  const seventh = await connect(payload(addresses[6], "wallet-7", 20));
  raw = await waitFor(observer, (sessions) => sessions.some((item) => item.clientId === "wallet-7"), "Seventh raw session was not observed.");
  assert.equal(isSessionAdmitted(raw, "wallet-7"), false);
  await disconnect(seventh);
  raw = await waitFor(observer, (sessions) => !sessions.some((item) => item.clientId === "wallet-7"), "Rejected session was not cleaned up.");
  assert.equal(reconcileRoomParticipants(raw).length, 6);

  const duplicate = await connect(payload(addresses[0], "wallet-1-base", 21));
  raw = await waitFor(observer, (sessions) => sessions.some((item) => item.clientId === "wallet-1-base"), "Duplicate-wallet session was not observed.");
  assert.equal(reconcileRoomParticipants(raw).length, 6);
  assert.equal(reconcileRoomParticipants(raw).find((item) => item.address === addresses[0])?.sessionCount, 2);
  await disconnect(firstSix[0]);
  raw = await waitFor(duplicate, (sessions) => !sessions.some((item) => item.clientId === "wallet-1"), "One of two wallet sessions did not leave.");
  assert.equal(reconcileRoomParticipants(raw).some((item) => item.address === addresses[0]), true);

  await disconnect(firstSix[2]);
  raw = await waitFor(duplicate, (sessions) => reconcileRoomParticipants(sessions).length === 5, "Departed participant did not release capacity.");
  const replacement = await connect(payload(addresses[6], "wallet-7-replacement", 30));
  raw = await waitFor(duplicate, (sessions) => reconcileRoomParticipants(sessions).length === 6, "Replacement participant was not admitted.");
  assert.equal(isSessionAdmitted(raw, "wallet-7-replacement"), true);
  await disconnect(replacement);

  process.stdout.write("Room realtime smoke: 6 unique, rejection cleanup, multi-session retention, and replacement passed.\n");
} finally {
  await Promise.allSettled(connections.map((connection) => disconnect(connection)));
}
