"use client";

import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RegistrationDayPoint } from "@/lib/member-registration-series";

const chartConfig = {
  count: {
    label: "Pendaftaran",
    color: "var(--primary)",
  },
} satisfies ChartConfig;

export function MemberRegistrationsChart({
  data,
  total,
}: {
  data: RegistrationDayPoint[];
  total: number;
}) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="border-b pb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base font-medium">
              Pendaftaran Member
            </CardTitle>
            <p className="mt-0.5 text-sm text-muted-foreground">
              30 hari terakhir
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-semibold tabular-nums">{total}</p>
            <p className="text-xs text-muted-foreground">total daftar</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col pt-4">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[18.5rem] w-full"
        >
          <AreaChart
            accessibilityLayer
            data={data}
            margin={{ left: 0, right: 8, top: 8, bottom: 0 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={28}
            />
            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              width={28}
              tickMargin={4}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(_, payload) => {
                    const row = payload?.[0]?.payload as
                      | RegistrationDayPoint
                      | undefined;
                    if (!row?.date) return "";
                    return format(
                      new Date(`${row.date}T12:00:00`),
                      "d MMMM yyyy",
                      { locale: localeId },
                    );
                  }}
                  indicator="line"
                />
              }
            />
            <Area
              dataKey="count"
              type="monotone"
              fill="var(--color-count)"
              fillOpacity={0.15}
              stroke="var(--color-count)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
