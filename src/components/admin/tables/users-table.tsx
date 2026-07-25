"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { EyeIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DataTableAction,
  DataTableCard,
  DataTableEmpty,
  DataTablePagination,
  DataTableSearch,
  dataTableBodyClass,
  dataTableCellClass,
  dataTableHeadClass,
  dataTableHeaderClass,
  dataTableHeaderRowClass,
  dataTableRowClass,
  formatTableDateTime,
} from "@/components/admin/tables/data-table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatRoleLabel } from "@/lib/roles";
import { cn } from "@/lib/utils";

export type UserRow = {
  id: string;
  email: string;
  role: string;
  status: string;
  displayName: string | null;
  createdAt: string;
};

function roleBadgeVariant(role: string) {
  if (role === "SUPER_ADMIN") return "default";
  if (role === "STAFF") return "secondary";
  return "outline";
}

function UserFormFields({
  mode,
  allowRoleSelect,
  values,
  onChange,
}: {
  mode: "create" | "edit";
  allowRoleSelect: boolean;
  values: {
    email: string;
    displayName: string;
    password: string;
    role: string;
    status: string;
  };
  onChange: (patch: Partial<typeof values>) => void;
}) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="user-displayName">Nama</Label>
        <Input
          id="user-displayName"
          required
          value={values.displayName}
          onChange={(e) => onChange({ displayName: e.target.value })}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="user-email">Email</Label>
        <Input
          id="user-email"
          type="email"
          required
          value={values.email}
          onChange={(e) => onChange({ email: e.target.value })}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="user-password">
          {mode === "create" ? "Password" : "Password baru"}
        </Label>
        <PasswordInput
          id="user-password"
          required={mode === "create"}
          minLength={mode === "create" ? 6 : undefined}
          placeholder={
            mode === "edit" ? "Kosongkan jika tidak diubah" : undefined
          }
          value={values.password}
          onChange={(e) => onChange({ password: e.target.value })}
        />
      </div>
      {allowRoleSelect ? (
        <div className="grid gap-2">
          <Label htmlFor="user-role">Role</Label>
          <Select
            value={values.role}
            onValueChange={(role) => onChange({ role })}
          >
            <SelectTrigger id="user-role" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TRADER">{formatRoleLabel("TRADER")}</SelectItem>
              <SelectItem value="STAFF">{formatRoleLabel("STAFF")}</SelectItem>
              <SelectItem value="SUPER_ADMIN">
                {formatRoleLabel("SUPER_ADMIN")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      ) : null}
      {mode === "edit" ? (
        <div className="grid gap-2">
          <Label htmlFor="user-status">Status</Label>
          <Select
            value={values.status}
            onValueChange={(status) => onChange({ status })}
          >
            <SelectTrigger id="user-status" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="DISABLED">Disabled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      ) : null}
    </div>
  );
}

export function UsersTable({
  header,
  rows,
  allowCreateAdmin,
  canEdit,
  currentUserId,
}: {
  header?: ReactNode;
  rows: UserRow[];
  allowCreateAdmin: boolean;
  canEdit: boolean;
  currentUserId?: string;
}) {
  const router = useRouter();
  const [data, setData] = useState(rows);
  const [filter, setFilter] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [viewUser, setViewUser] = useState<UserRow | null>(null);
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [deleteUser, setDeleteUser] = useState<UserRow | null>(null);
  const [form, setForm] = useState({
    email: "",
    displayName: "",
    password: "",
    role: "TRADER",
    status: "ACTIVE",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setData(rows);
  }, [rows]);

  function resetForm(overrides?: Partial<typeof form>) {
    setForm({
      email: "",
      displayName: "",
      password: "",
      role: "TRADER",
      status: "ACTIVE",
      ...overrides,
    });
    setError(null);
  }

  function openCreate() {
    resetForm();
    setCreateOpen(true);
  }

  function openView(user: UserRow) {
    setError(null);
    setViewUser(user);
  }

  function openEdit(user: UserRow) {
    resetForm({
      email: user.email,
      displayName: user.displayName ?? "",
      password: "",
      role: user.role,
      status: user.status,
    });
    setEditUser(user);
  }

  function openDelete(user: UserRow) {
    setError(null);
    setDeleteUser(user);
  }

  function closeDialogs() {
    setCreateOpen(false);
    setViewUser(null);
    setEditUser(null);
    setDeleteUser(null);
    resetForm();
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          displayName: form.displayName,
          role: allowCreateAdmin ? form.role : "TRADER",
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Failed to create user");
        return;
      }
      closeDialogs();
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editUser) return;
    setError(null);
    setSaving(true);
    setBusyId(editUser.id);
    try {
      const payload: Record<string, string> = {
        email: form.email,
        displayName: form.displayName,
        role: form.role,
        status: form.status,
      };
      if (form.password) payload.password = form.password;

      const res = await fetch(`/api/users/${editUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Failed to update user");
        return;
      }
      const updated = json.user as UserRow;
      setData((prev) =>
        prev.map((u) =>
          u.id === editUser.id
            ? {
                ...u,
                email: updated.email,
                displayName: updated.displayName,
                role: updated.role,
                status: updated.status,
              }
            : u,
        ),
      );
      closeDialogs();
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
      setBusyId(null);
    }
  }

  async function handleDelete() {
    if (!deleteUser) return;
    setError(null);
    setSaving(true);
    setBusyId(deleteUser.id);
    try {
      const res = await fetch(`/api/users/${deleteUser.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Gagal menghapus user");
        return;
      }
      setData((prev) => prev.filter((u) => u.id !== deleteUser.id));
      closeDialogs();
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
      setBusyId(null);
    }
  }

  const columns = useMemo<ColumnDef<UserRow>[]>(() => {
    const cols: ColumnDef<UserRow>[] = [
      {
        id: "nama",
        accessorFn: (row) => row.displayName ?? row.email,
        header: "Nama",
        cell: ({ row }) => (
          <span className="font-medium">
            {row.original.displayName ?? row.original.email}
          </span>
        ),
      },
      {
        accessorKey: "email",
        header: "Email",
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.email}</span>
        ),
      },
      {
        accessorKey: "role",
        header: "Role",
        cell: ({ row }) => (
          <Badge variant={roleBadgeVariant(row.original.role)}>
            {formatRoleLabel(row.original.role)}
          </Badge>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge
            variant={
              row.original.status === "ACTIVE" ? "default" : "destructive"
            }
          >
            {row.original.status === "ACTIVE" ? "Active" : "Disabled"}
          </Badge>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Dibuat",
        cell: ({ row }) => formatTableDateTime(row.original.createdAt),
      },
      {
        id: "actions",
        header: "Aksi",
        cell: ({ row }) => {
          const u = row.original;
          const busy = busyId === u.id;
          const canDelete =
            canEdit && u.id !== currentUserId;
          return (
            <div className="flex justify-end gap-1">
              <DataTableAction
                label="Show"
                disabled={busy}
                onClick={() => openView(u)}
              >
                <EyeIcon />
              </DataTableAction>
              {canEdit ? (
                <DataTableAction
                  label="Edit"
                  disabled={busy}
                  onClick={() => openEdit(u)}
                >
                  <PencilIcon />
                </DataTableAction>
              ) : null}
              {canDelete ? (
                <DataTableAction
                  label="Hapus"
                  disabled={busy}
                  onClick={() => openDelete(u)}
                >
                  <Trash2Icon />
                </DataTableAction>
              ) : null}
            </div>
          );
        },
      },
    ];

    return cols;
  }, [canEdit, busyId, currentUserId]);

  const table = useReactTable({
    data,
    columns,
    state: { globalFilter: filter },
    onGlobalFilterChange: setFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
    globalFilterFn: (row, _columnId, value) => {
      const q = String(value).toLowerCase();
      if (!q) return true;
      const u = row.original;
      return (
        u.email.toLowerCase().includes(q) ||
        (u.displayName?.toLowerCase().includes(q) ?? false) ||
        u.role.toLowerCase().includes(q) ||
        formatRoleLabel(u.role).toLowerCase().includes(q)
      );
    },
  });

  return (
    <div className="space-y-4">
      {header}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <DataTableSearch
          value={filter}
          onChange={setFilter}
          placeholder="Cari berdasarkan nama, email, atau role…"
        />
        <Button onClick={openCreate} className="gap-2 shrink-0">
          <PlusIcon className="size-4" />
          Tambah
        </Button>
      </div>

      <DataTableCard>
        <Table>
          <TableHeader className={dataTableHeaderClass}>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className={dataTableHeaderRowClass}>
                {hg.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={cn(
                      dataTableHeadClass,
                      header.column.id === "actions" && "text-right",
                    )}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody className={dataTableBodyClass}>
            {table.getRowModel().rows.length === 0 ? (
              <DataTableEmpty
                colSpan={columns.length}
                title="Belum ada pengguna"
                description="Klik Tambah untuk membuat pengguna baru."
              />
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className={dataTableRowClass}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className={dataTableCellClass}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </DataTableCard>

      <DataTablePagination table={table} />

      <Dialog open={createOpen} onOpenChange={(open) => !open && closeDialogs()}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={(e) => void handleCreate(e)} className="grid gap-4">
            <DialogHeader>
              <DialogTitle>Tambah pengguna</DialogTitle>
              <DialogDescription>
                {allowCreateAdmin
                  ? "Buat akun baru dengan role yang dipilih."
                  : "Buat akun Trader baru untuk onboarding."}
              </DialogDescription>
            </DialogHeader>
            {error ? (
              <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            ) : null}
            <UserFormFields
              mode="create"
              allowRoleSelect={allowCreateAdmin}
              values={form}
              onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={closeDialogs}
                disabled={saving}
              >
                Batal
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Menyimpan…" : "Simpan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={viewUser !== null}
        onOpenChange={(open) => !open && closeDialogs()}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Detail Pengguna</DialogTitle>
            <DialogDescription>
              Informasi akun pengguna.
            </DialogDescription>
          </DialogHeader>
          {viewUser ? (
            <div className="flex flex-col">
              {[
                {
                  label: "Nama",
                  value: viewUser.displayName ?? viewUser.email,
                },
                { label: "Email", value: viewUser.email },
                { label: "Role", value: formatRoleLabel(viewUser.role) },
                {
                  label: "Status",
                  value:
                    viewUser.status === "ACTIVE" ? "Active" : "Disabled",
                },
                {
                  label: "Dibuat",
                  value: formatTableDateTime(viewUser.createdAt),
                },
              ].map((row, index, list) => (
                <div key={row.label}>
                  <div className="flex items-center justify-between gap-4 py-2.5 text-sm">
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className="text-right font-medium">{row.value}</span>
                  </div>
                  {index < list.length - 1 ? <Separator /> : null}
                </div>
              ))}
            </div>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeDialogs}>
              Tutup
            </Button>
            {canEdit && viewUser ? (
              <Button
                type="button"
                onClick={() => {
                  const user = viewUser;
                  setViewUser(null);
                  openEdit(user);
                }}
              >
                Edit
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editUser !== null}
        onOpenChange={(open) => !open && closeDialogs()}
      >
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={(e) => void handleEdit(e)} className="grid gap-4">
            <DialogHeader>
              <DialogTitle>Edit pengguna</DialogTitle>
              <DialogDescription>
                Ubah data di sini. Klik simpan jika sudah selesai.
              </DialogDescription>
            </DialogHeader>
            {error ? (
              <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            ) : null}
            <UserFormFields
              mode="edit"
              allowRoleSelect
              values={form}
              onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={closeDialogs}
                disabled={saving}
              >
                Batal
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Menyimpan…" : "Simpan perubahan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteUser !== null}
        onOpenChange={(open) => !open && closeDialogs()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus pengguna?</AlertDialogTitle>
            <AlertDialogDescription>
              Akun{" "}
              <span className="font-medium text-foreground">
                {deleteUser?.email}
              </span>{" "}
              akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error ? (
            <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Batal</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={saving}
              onClick={(e) => {
                e.preventDefault();
                void handleDelete();
              }}
            >
              {saving ? "Menghapus…" : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
