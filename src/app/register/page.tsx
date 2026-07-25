import { redirect } from "next/navigation";

/** Legacy URL → /member/register */
export default function LegacyRegisterRedirect() {
  redirect("/member/register");
}
