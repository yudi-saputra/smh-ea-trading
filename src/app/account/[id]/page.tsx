import { redirect } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

/** Legacy URL → /member/account/[id] */
export default async function LegacyAccountDetailRedirect({ params }: Props) {
  const { id } = await params;
  redirect(`/member/account/${id}`);
}
