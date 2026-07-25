import { redirect } from "next/navigation";

/** Legacy URL → /member/account */
export default function LegacyAccountRedirect() {
  redirect("/member/account");
}
