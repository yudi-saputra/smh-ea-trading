import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  PowerOffIcon,
  ServerIcon,
  UsersIcon,
  ZapIcon,
  type LucideIcon,
} from "lucide-react";

export type OverviewStats = {
  totalMembers: number;
  totalEa: number;
  eaAktif: number;
  eaNonAktif: number;
};

function StatIcon({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-md",
        "border border-border/60 bg-muted/40 text-muted-foreground",
      )}
      aria-hidden
    >
      <Icon className="size-3.5" strokeWidth={1.75} />
    </span>
  );
}

export function SectionCards({ stats }: { stats: OverviewStats }) {
  return (
    <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Member</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.totalMembers}
          </CardTitle>
          <CardAction>
            <StatIcon icon={UsersIcon} />
          </CardAction>
        </CardHeader>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total EA</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.totalEa}
          </CardTitle>
          <CardAction>
            <StatIcon icon={ServerIcon} />
          </CardAction>
        </CardHeader>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>EA Aktif</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.eaAktif}
          </CardTitle>
          <CardAction>
            <StatIcon icon={ZapIcon} />
          </CardAction>
        </CardHeader>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>EA Non-Aktif</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.eaNonAktif}
          </CardTitle>
          <CardAction>
            <StatIcon icon={PowerOffIcon} />
          </CardAction>
        </CardHeader>
      </Card>
    </div>
  );
}
