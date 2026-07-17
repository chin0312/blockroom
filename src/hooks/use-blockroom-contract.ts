"use client";

import { useCallback, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  readContract,
  switchChain,
  waitForTransactionReceipt,
  writeContract,
} from "@wagmi/core";
import { useAccount, useConfig, usePublicClient } from "wagmi";
import type { Address, Hex } from "viem";
import {
  FIRST_SESSION_BADGE_ID,
  FOCUS_24_HOURS_BADGE_ID,
  badgeContractAbi,
  roomIdForSlug,
  sessionContractAbi,
} from "@/contracts/blockroom";
import {
  getChainConfig,
  isSupportedChainId,
  type SupportedChainId,
} from "@/config/chains";
import { rooms } from "@/lib/rooms";
import type {
  ConfirmedSessionRecord,
  OnchainSessionDraft,
} from "@/lib/session-store";
import { useSession } from "@/components/session-provider";

type TransactionState = {
  status:
    | "idle"
    | "awaiting-wallet"
    | "submitting"
    | "confirmed"
    | "rejected"
    | "failed";
  hash?: Hex;
  error?: string;
};

const roomSlugById = new Map(
  rooms.map((room) => [roomIdForSlug(room.slug).toLowerCase(), room.slug]),
);

function rejectedByUser(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  return (
    message.includes("reject") ||
    message.includes("denied") ||
    message.includes("cancelled")
  );
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

export function useConfirmedSessions(
  address?: Address,
  chainId?: number,
) {
  const supportedChainId = isSupportedChainId(chainId) ? chainId : undefined;
  const chain = getChainConfig(supportedChainId);
  const contractAddress = chain?.contracts.sessions;
  const publicClient = usePublicClient({ chainId: supportedChainId });

  return useQuery({
    queryKey: [
      "blockroom",
      supportedChainId,
      "sessions",
      contractAddress,
      address?.toLowerCase(),
    ],
    enabled: Boolean(contractAddress && address && publicClient),
    staleTime: 8_000,
    queryFn: async (): Promise<ConfirmedSessionRecord[]> => {
      if (!contractAddress || !address || !publicClient) return [];
      const sessionIds = await publicClient.readContract({
        address: contractAddress,
        abi: sessionContractAbi,
        functionName: "getSessionIds",
        args: [address],
      });
      const records = await Promise.all(
        sessionIds.map(async (sessionId) => {
          const session = await publicClient.readContract({
            address: contractAddress,
            abi: sessionContractAbi,
            functionName: "getSession",
            args: [sessionId],
          });
          return {
            sessionId,
            walletAddress: session.owner,
            roomId: session.roomId,
            roomSlug:
              roomSlugById.get(session.roomId.toLowerCase()) ?? "unknown-room",
            startedAt: Number(session.startedAt),
            endedAt: Number(session.endedAt),
            durationSeconds: Number(session.durationSeconds),
            recordedAt: Number(session.recordedAt),
          } satisfies ConfirmedSessionRecord;
        }),
      );
      return records.sort((a, b) => b.endedAt - a.endedAt);
    },
  });
}

export function useSessionSubmission() {
  const config = useConfig();
  const queryClient = useQueryClient();
  const { address, chainId } = useAccount();
  const { markSession } = useSession();
  const [transaction, setTransaction] = useState<TransactionState>({
    status: "idle",
  });

  const isConfigured = useCallback(
    (targetChainId: number | undefined) =>
      Boolean(getChainConfig(targetChainId)?.contracts.sessions),
    [],
  );

  const submit = useCallback(
    async (session: OnchainSessionDraft) => {
      const targetChain = getChainConfig(session.chainId);
      const contractAddress = targetChain?.contracts.sessions;
      if (!targetChain || !contractAddress) {
        const error = targetChain
          ? `Session recording is not deployed on ${targetChain.name} yet. This session remains pending.`
          : "This session belongs to an unsupported network and remains pending.";
        markSession(session.sessionId, { status: "failed", error });
        setTransaction({ status: "failed", error });
        return false;
      }
      if (
        !address ||
        address.toLowerCase() !== session.walletAddress.toLowerCase()
      ) {
        const error =
          "Reconnect the wallet that owns this session before recording it.";
        markSession(session.sessionId, { status: "failed", error });
        setTransaction({ status: "failed", error });
        return false;
      }
      if (!session.endedAt) {
        const error = "This session has not been frozen with a final duration.";
        setTransaction({ status: "failed", error });
        return false;
      }

      markSession(session.sessionId, {
        status: "awaiting-confirmation",
        error: undefined,
      });
      setTransaction({ status: "awaiting-wallet" });
      try {
        if (chainId !== session.chainId) {
          await switchChain(config, { chainId: session.chainId });
        }
        if (session.status === "submitting" && session.txHash) {
          setTransaction({ status: "submitting", hash: session.txHash });
          const pendingReceipt = await waitForTransactionReceipt(config, {
            chainId: session.chainId,
            hash: session.txHash,
            confirmations: 1,
          });
          if (pendingReceipt.status !== "success") {
            throw new Error("The submitted session transaction reverted.");
          }
          markSession(session.sessionId, {
            status: "confirmed",
            txHash: session.txHash,
            confirmedAt: new Date().toISOString(),
            error: undefined,
          });
          setTransaction({ status: "confirmed", hash: session.txHash });
          await queryClient.invalidateQueries({
            queryKey: ["blockroom", session.chainId],
          });
          return true;
        }

        const alreadyRecorded = await readContract(config, {
          address: contractAddress,
          abi: sessionContractAbi,
          functionName: "isSessionRecorded",
          args: [session.sessionId],
          chainId: session.chainId,
        });
        if (alreadyRecorded) {
          markSession(session.sessionId, {
            status: "confirmed",
            confirmedAt: new Date().toISOString(),
            error: undefined,
          });
          setTransaction({ status: "confirmed", hash: session.txHash });
          await queryClient.invalidateQueries({
            queryKey: ["blockroom", session.chainId],
          });
          return true;
        }

        const hash = await writeContract(config, {
          address: contractAddress,
          abi: sessionContractAbi,
          functionName: "recordSession",
          args: [
            session.sessionId,
            session.roomId,
            BigInt(session.startedAt),
            BigInt(session.endedAt),
            BigInt(session.durationSeconds),
          ],
          chainId: session.chainId,
          account: address,
        });
        markSession(session.sessionId, {
          status: "submitting",
          txHash: hash,
          error: undefined,
        });
        setTransaction({ status: "submitting", hash });
        const receipt = await waitForTransactionReceipt(config, {
          chainId: session.chainId,
          hash,
          confirmations: 1,
        });
        if (receipt.status !== "success") {
          throw new Error("The transaction receipt reported a revert.");
        }
        markSession(session.sessionId, {
          status: "confirmed",
          txHash: hash,
          confirmedAt: new Date().toISOString(),
          error: undefined,
        });
        setTransaction({ status: "confirmed", hash });
        await queryClient.invalidateQueries({
          queryKey: ["blockroom", session.chainId],
        });
        return true;
      } catch (error) {
        const rejected = rejectedByUser(error);
        const message = rejected
          ? "Wallet confirmation was rejected. The eligible session is still available to retry."
          : errorMessage(
              error,
              "The session transaction failed. It is still available to retry.",
            );
        markSession(session.sessionId, {
          status: rejected ? "rejected" : "failed",
          error: message,
        });
        setTransaction({
          status: rejected ? "rejected" : "failed",
          hash: session.txHash,
          error: message,
        });
        return false;
      }
    },
    [address, chainId, config, markSession, queryClient],
  );

  return { ...transaction, submit, isConfigured };
}

export function useBadgeContractState(
  address?: Address,
  chainId?: number,
) {
  const supportedChainId = isSupportedChainId(chainId) ? chainId : undefined;
  const chain = getChainConfig(supportedChainId);
  const contractAddress = chain?.contracts.badges;
  const publicClient = usePublicClient({ chainId: supportedChainId });

  return useQuery({
    queryKey: [
      "blockroom",
      supportedChainId,
      "badges",
      contractAddress,
      address?.toLowerCase(),
    ],
    enabled: Boolean(contractAddress && address && publicClient),
    staleTime: 8_000,
    queryFn: async () => {
      if (!contractAddress || !address || !publicClient) {
        return {
          firstEligible: false,
          focusEligible: false,
          firstClaimed: false,
          focusClaimed: false,
        };
      }
      const [
        firstEligible,
        focusEligible,
        firstClaimed,
        focusClaimed,
      ] = await Promise.all([
        publicClient.readContract({
          address: contractAddress,
          abi: badgeContractAbi,
          functionName: "isBadgeEligible",
          args: [address, FIRST_SESSION_BADGE_ID],
        }),
        publicClient.readContract({
          address: contractAddress,
          abi: badgeContractAbi,
          functionName: "isBadgeEligible",
          args: [address, FOCUS_24_HOURS_BADGE_ID],
        }),
        publicClient.readContract({
          address: contractAddress,
          abi: badgeContractAbi,
          functionName: "hasClaimedBadge",
          args: [address, FIRST_SESSION_BADGE_ID],
        }),
        publicClient.readContract({
          address: contractAddress,
          abi: badgeContractAbi,
          functionName: "hasClaimedBadge",
          args: [address, FOCUS_24_HOURS_BADGE_ID],
        }),
      ]);
      return {
        firstEligible,
        focusEligible,
        firstClaimed,
        focusClaimed,
      };
    },
  });
}

export function useBadgeClaim(chainId?: number) {
  const config = useConfig();
  const queryClient = useQueryClient();
  const { address, chainId: connectedChainId } = useAccount();
  const [transaction, setTransaction] = useState<TransactionState>({
    status: "idle",
  });
  const supportedChainId = isSupportedChainId(chainId) ? chainId : undefined;
  const chain = getChainConfig(supportedChainId);
  const contractAddress = chain?.contracts.badges;

  const claim = useCallback(
    async (badgeId: 1n | 2n) => {
      if (!chain || !contractAddress || !address || !supportedChainId) {
        setTransaction({
          status: "failed",
          error: chain
            ? `Badge claiming is not deployed on ${chain.name} yet.`
            : "Connect a wallet to a supported network first.",
        });
        return undefined;
      }
      setTransaction({ status: "awaiting-wallet" });
      try {
        if (connectedChainId !== supportedChainId) {
          await switchChain(config, { chainId: supportedChainId });
        }
        const hash = await writeContract(config, {
          address: contractAddress,
          abi: badgeContractAbi,
          functionName: "claimBadge",
          args: [badgeId],
          chainId: supportedChainId,
          account: address,
        });
        setTransaction({ status: "submitting", hash });
        const receipt = await waitForTransactionReceipt(config, {
          chainId: supportedChainId,
          hash,
          confirmations: 1,
        });
        if (receipt.status !== "success") {
          throw new Error("The badge transaction reverted.");
        }
        setTransaction({ status: "confirmed", hash });
        await queryClient.invalidateQueries({
          queryKey: ["blockroom", supportedChainId],
        });
        return hash;
      } catch (error) {
        const rejected = rejectedByUser(error);
        setTransaction({
          status: rejected ? "rejected" : "failed",
          error: rejected
            ? "Wallet confirmation was rejected. No badge was minted."
            : errorMessage(error, "The badge claim failed."),
        });
        return undefined;
      }
    },
    [
      address,
      chain,
      config,
      connectedChainId,
      contractAddress,
      queryClient,
      supportedChainId,
    ],
  );

  return {
    ...transaction,
    claim,
    configured: Boolean(contractAddress),
  };
}

export type { SupportedChainId };
