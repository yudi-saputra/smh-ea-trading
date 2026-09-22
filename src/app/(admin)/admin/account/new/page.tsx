import { redirect } from "next/navigation";

/** Legacy URL - create flow is now a dialog on /admin/account. */
export default function AdminNewTerminalRedirect() {
  redirect("/admin/account");
}
