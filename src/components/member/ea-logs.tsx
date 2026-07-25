import { cn } from "@/lib/utils";

export type EaLogRow = {
  id: string;
  text: string;
  status: string;
  resultMessage: string | null;
  createdAt: string;
};

function formatLogTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatLogDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  });
}

function statusMeta(status: string) {
  const s = status.toUpperCase();
  if (s === "ACKED") {
    return {
      label: "OK",
      className: "bg-trading-profit/15 text-trading-profit",
    };
  }
  if (s === "FAILED") {
    return {
      label: "FAIL",
      className: "bg-trading-loss/15 text-trading-loss",
    };
  }
  return {
    label: "WAIT",
    className: "bg-trading-gold/15 text-trading-gold",
  };
}

const COMMAND_LABELS: Record<string, string> = {
  "/on": "ON",
  "/off": "OFF",
  "/pause": "PAUSE",
  "/reset": "RESET",
  "/status": "STATUS",
  "/conservative": "CONSERVATIVE",
  "/aggressive": "AGGRESSIVE",
  "/oneway": "1 ARAH",
  "/twoway": "2 ARAH",
  "/setlayer": "LAYER",
  "/setmultiplier": "MULTIPLIER",
  "/settarget": "TARGET",
  "/setcutloss": "CUTLOSS",
  "/maxlot": "MAX LOT",
  "/maxlayer": "MAX LAYER",
  "/tradetime": "TRADE TIME",
  "/tradestart": "TRADE START",
  "/tradeend": "TRADE END",
};

function formatCommandLabel(text: string) {
  const parts = text.trim().toLowerCase().split(/\s+/);
  const key = parts[0] ?? "";
  const normalized = key.startsWith("/") ? key : `/${key}`;
  const label =
    COMMAND_LABELS[normalized] ?? text.replace(/^\//, "").toUpperCase();
  const arg = parts.slice(1).join(" ");
  return arg ? `${label} ${arg}` : label;
}

function formatResultMessage(message: string | null) {
  if (!message) return null;
  return message
    .replace(/[—–−]/g, "-")
    .replace(/\s+/g, " ")
    .replace(/^[-:|]+\s*/, "")
    .trim();
}

function formatLogTitle(text: string, resultMessage: string | null) {
  const label = formatCommandLabel(text);
  const result = formatResultMessage(resultMessage);
  if (!result) return label;
  return `${label} - ${result}`;
}

/** List content for EA Logs drawer (no outer card). */
export function EaLogs({ logs }: { logs: EaLogRow[] }) {
  if (logs.length === 0) {
    return (
      <div className="type-caption py-8 text-center text-muted-foreground">
        Belum ada command.
      </div>
    );
  }

  return (
    <ul className="max-h-[60dvh] divide-y divide-border/50 overflow-y-auto rounded-xl border border-border/60 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {logs.map((log) => {
        const meta = statusMeta(log.status);
        return (
          <li key={log.id} className="px-3 py-3">
            <div className="flex items-start gap-2.5">
              <div className="type-micro w-[52px] shrink-0 pt-0.5 leading-tight text-muted-foreground">
                <p className="font-medium">{formatLogDate(log.createdAt)}</p>
                <p className="font-mono tabular-nums">
                  {formatLogTime(log.createdAt)}
                </p>
              </div>

              <span
                className={cn(
                  "type-micro mt-0.5 inline-flex h-5 shrink-0 items-center rounded-md px-1.5 font-bold tracking-wide",
                  meta.className,
                )}
              >
                {meta.label}
              </span>

              <div className="min-w-0 flex-1">
                <p className="type-body break-words font-semibold leading-snug text-foreground">
                  {formatLogTitle(log.text, log.resultMessage)}
                </p>
                {!log.resultMessage ? (
                  <p className="type-caption mt-1 text-muted-foreground/70">
                    Menunggu ACK dari controller
                  </p>
                ) : null}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
