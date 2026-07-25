import { redirect } from "next/navigation";
import { getSessionMember } from "@/lib/auth-member";
import { prisma } from "@/lib/db";
import {
  MemberInfoAccordion,
  MemberLogoutButton,
  MemberProfileCard,
  MemberSocialLinks,
} from "@/components/member/profile";
import { MemberSecuritySection } from "@/components/member/change-password";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Profil Saya" };

export default async function MemberProfilePage() {
  const session = await getSessionMember();
  if (!session) redirect("/member/login");

  const member = await prisma.member.findUnique({
    where: { id: session.id },
    select: {
      email: true,
      name: true,
      createdAt: true,
    },
  });
  if (!member) redirect("/member/login");

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="type-display">Profil Saya</h2>
        <p className="type-ui text-muted-foreground">
          Kelola profil dan sesi login Anda
        </p>
      </div>

      <MemberProfileCard
        name={member.name}
        email={member.email}
        createdAt={member.createdAt.toISOString()}
      />

      <MemberSecuritySection />

      <MemberInfoAccordion />

      <MemberLogoutButton />

      <MemberSocialLinks />

      <p className="type-caption pb-2 pt-1 text-center text-muted-foreground">
        SMH Control Panel v1.1
      </p>
    </div>
  );
}
