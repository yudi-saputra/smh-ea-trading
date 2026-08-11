import { prisma } from "@/lib/db";
import { hashApiKey } from "@/lib/crypto";

export async function authenticateTerminal(
  terminalIdParam: string,
  authHeader: string | null,
) {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const apiKey = authHeader.slice(7).trim();
  if (!apiKey) return null;

  const terminal = await prisma.terminal.findUnique({
    where: { terminalId: terminalIdParam },
  });
  if (!terminal || !terminal.enabled) return null;
  if (terminal.apiKeyHash !== hashApiKey(apiKey)) return null;
  // null expiresAt = no licence end; past expiresAt must not poll/heartbeat
  if (terminal.expiresAt && terminal.expiresAt.getTime() < Date.now()) {
    return null;
  }
  return terminal;
}
