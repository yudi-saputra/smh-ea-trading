import { redirect } from "next/navigation";
import { startOfDay, subDays } from "date-fns";
import {
  canAccessTerminals,
  getSessionUser,
  terminalOwnerFilter,
} from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildMemberRegistrationSeries } from "@/lib/member-registration-series";
import { SectionCards } from "@/components/admin/layout/section-cards";
import { TopMembersTable } from "@/components/admin/dashboard/top-members-table";
import { MemberRegistrationsChart } from "@/components/admin/dashboard/member-registrations-chart";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard" };

function isEaAktif(status: string | null | undefined) {
  const s = status?.toLowerCase();
  return s === "on" || s === "paused";
}

export default async function AdminDashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");
  if (!canAccessTerminals(user.role)) redirect("/admin/users");

  const since = startOfDay(subDays(new Date(), 29));

  const [terminals, totalMembers, topMembersRaw, recentMembers] =
    await Promise.all([
      prisma.terminal.findMany({
        where: terminalOwnerFilter(user),
        select: {
          id: true,
          snapshot: { select: { status: true } },
        },
      }),
      prisma.member.count(),
      prisma.member.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          _count: { select: { ownedTerminals: true } },
        },
        orderBy: { ownedTerminals: { _count: "desc" } },
        take: 8,
      }),
      prisma.member.findMany({
        where: { createdAt: { gte: since } },
        select: { createdAt: true },
      }),
    ]);

  const eaAktif = terminals.filter((t) =>
    isEaAktif(t.snapshot?.status),
  ).length;
  const eaNonAktif = terminals.length - eaAktif;

  const topMembers = topMembersRaw.map((m) => ({
    id: m.id,
    name: m.name,
    email: m.email,
    eaCount: m._count.ownedTerminals,
  }));

  const registrationSeries = buildMemberRegistrationSeries(
    recentMembers.map((m) => m.createdAt),
  );
  const registrationTotal = recentMembers.length;

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <SectionCards
        stats={{
          totalMembers,
          totalEa: terminals.length,
          eaAktif,
          eaNonAktif,
        }}
      />

      <div className="grid grid-cols-1 gap-4 @3xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        <div className="@3xl/main:col-span-1 @5xl/main:col-span-2">
          <MemberRegistrationsChart
            data={registrationSeries}
            total={registrationTotal}
          />
        </div>

        <div className="@3xl/main:col-span-1 @5xl/main:col-span-2">
          <TopMembersTable rows={topMembers} />
        </div>
      </div>
    </div>
  );
}
