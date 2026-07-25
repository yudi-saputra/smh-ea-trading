import { redirect } from "next/navigation";

/** Legacy URL → /member/profile */
export default function LegacyProfileRedirect() {
  redirect("/member/profile");
}
