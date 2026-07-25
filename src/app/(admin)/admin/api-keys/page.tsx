import { redirect } from "next/navigation";

/** Legacy route — API Keys hidup di Daftar Akun. */
export default function AdminApiKeysPage() {
  redirect("/admin/account");
}
