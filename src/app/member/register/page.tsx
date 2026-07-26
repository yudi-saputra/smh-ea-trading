import type { Metadata } from "next";
import { PackageStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { AuthRegisterForm } from "@/components/auth/register-form";
import { turnstileSiteKey } from "@/lib/turnstile";

export const metadata: Metadata = { title: "Daftar Member" };

// Build has no Postgres; page must fetch packages at request time.
export const dynamic = "force-dynamic";

export default async function MemberRegisterPage() {
  const packages = await prisma.package.findMany({
    where: { status: PackageStatus.ACTIVE },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-2xl">
        <AuthRegisterForm
          packages={packages}
          turnstileSiteKey={turnstileSiteKey()}
        />
      </div>
    </div>
  );
}
