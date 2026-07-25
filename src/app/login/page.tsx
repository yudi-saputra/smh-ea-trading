import { redirect } from "next/navigation";

/** Legacy URL → /member/login */
export default function LegacyLoginRedirect() {
  redirect("/member/login");
}
