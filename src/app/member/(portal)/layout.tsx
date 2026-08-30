import { redirect } from "next/navigation";
import { getSessionMember } from "@/lib/auth-member";
import { MemberAppShell } from "@/components/member/app-shell";

export default async function MemberPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const member = await getSessionMember();
  if (!member) redirect("/member/login");

  return <MemberAppShell>{children}</MemberAppShell>;
}
