import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ActivityIcon, ClockIcon, TrendingUpIcon, ZapIcon } from "lucide-react";

export type OverviewStats = {
  totalTerminals: number;
  online: number;
  eaOn: number;
  pendingCommands: number;
};

function pct(part: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((part / total) * 100);
}

export function SectionCards({ stats }: { stats: OverviewStats }) {
  const onlinePct = pct(stats.online, stats.totalTerminals);
  const eaPct = pct(stats.eaOn, stats.totalTerminals);

  return (
    <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Terminals</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.totalTerminals}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">Fleet</Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Registered in your scope
            <TrendingUpIcon className="size-4" />
          </div>
          <div className="text-muted-foreground">
            All terminals you can manage
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Online</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.online}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <ActivityIcon />
              {onlinePct}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Heartbeat within 30s
            <ActivityIcon className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Live connection from Controller
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>EA Active</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.eaOn}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <ZapIcon />
              {eaPct}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Status on or paused
            <ZapIcon className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Expert Advisors currently running
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Pending</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.pendingCommands}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <ClockIcon />
              Queue
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Awaiting controller poll
            <ClockIcon className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Commands still in PENDING status
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
