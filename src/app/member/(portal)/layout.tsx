import { redirect } from "next/navigation";
import { getSessionMember } from "@/lib/auth-member";
import { MemberHeader } from "@/components/member/header";

export default async function MemberPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const member = await getSessionMember();
  if (!member) redirect("/member/login");

  return <MemberHeader>{children}</MemberHeader>;
}
