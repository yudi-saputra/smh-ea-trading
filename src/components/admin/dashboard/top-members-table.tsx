import Link from "next/link";
import { UsersIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type TopMemberRow = {
  id: string;
  name: string;
  email: string;
  eaCount: number;
};

export function TopMembersTable({ rows }: { rows: TopMemberRow[] }) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="border-b pb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base font-medium">Top Member</CardTitle>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Member dengan jumlah EA terbanyak
            </p>
          </div>
          <Link
            href="/admin/members"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "rounded-lg",
            )}
          >
            Lihat semua
          </Link>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col px-0 pt-0 pb-0">
        <ul className="flex min-h-[18.5rem] flex-1 flex-col">
          {rows.length === 0 ? (
            <li className="flex flex-1 items-center justify-center px-6 py-10 text-center">
              <div>
                <p className="text-sm font-medium">Belum ada member</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Member dengan akun EA akan muncul di sini.
                </p>
              </div>
            </li>
          ) : (
            rows.map((row) => (
              <li
                key={row.id}
                className="flex items-center gap-3 border-b border-border/50 px-6 py-3.5 last:border-b-0"
              >
                <span
                  className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground"
                  aria-hidden
                >
                  <UsersIcon className="size-4" strokeWidth={1.75} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{row.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {row.email}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-medium tabular-nums">
                  {row.eaCount}{" "}
                  <span className="font-normal text-muted-foreground">EA</span>
                </p>
              </li>
            ))
          )}
        </ul>
      </CardContent>
    </Card>
  );
}
