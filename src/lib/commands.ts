/** Commands accepted by SMH_Controller ProcessCommand */
export const PHASE1_COMMANDS = new Set([
  "/on",
  "/off",
  "/pause",
  "/reset",
  "/status",
  "/conservative",
  "/aggressive",
  "/oneway",
  "/twoway",
  "/setlayer",
  "/setmultiplier",
  "/settarget",
  "/setcutloss",
  "/maxlot",
  "/maxlayer",
  "/tradetime",
  "/tradestart",
  "/tradeend",
]);

export function normalizeCommandText(raw: string) {
  let text = raw.trim().toLowerCase();
  if (!text.startsWith("/")) text = `/${text}`;
  return text;
}

export function isAllowedPhase1Command(text: string) {
  const base = text.split(/\s+/)[0];
  return PHASE1_COMMANDS.has(base);
}
