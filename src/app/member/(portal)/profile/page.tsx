import { redirect } from "next/navigation";
import { getSessionMember } from "@/lib/auth-member";
import { prisma } from "@/lib/db";
import {
  MemberInfoAccordion,
  MemberLogoutButton,
  MemberProfileCard,
  MemberSocialLinks,
} from "@/components/member/profile";
import { MemberSecuritySection } from "@/components/member/security-section";
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
        Strategic Market Handler v1.3
      </p>
    </div>
  );
}
