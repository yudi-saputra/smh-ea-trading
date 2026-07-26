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
import { Switch } from "@/components/ui/switch";
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
import { formatMemberStatus } from "@/lib/members";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

export type MemberPackageOption = {
  id: string;
  name: string;
};

export type MemberRow = {
  id: string;
  packageId: string;
  packageName: string;
  name: string;
  email: string;
  password: string;
  idTrading: string;
  passwordTrading: string;
  serverBroker: string;
  status: string;
};

type FormValues = {
  packageId: string;
  name: string;
  email: string;
  password: string;
  idTrading: string;
  passwordTrading: string;
  serverBroker: string;
  status: string;
};

const emptyForm = (packageId = ""): FormValues => ({
  packageId,
  name: "",
  email: "",
  password: "",
  idTrading: "",
  passwordTrading: "",
  serverBroker: "",
  status: "ACTIVE",
});

function MemberFormFields({
  mode,
  packages,
  values,
  onChange,
}: {
  mode: "create" | "edit";
  packages: MemberPackageOption[];
  values: FormValues;
  onChange: (patch: Partial<FormValues>) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="grid gap-2">
        <Label htmlFor="member-name">Nama</Label>
        <Input
          id="member-name"
          required
          value={values.name}
          onChange={(e) => onChange({ name: e.target.value })}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="member-email">Email</Label>
        <Input
          id="member-email"
          type="email"
          required
          value={values.email}
          onChange={(e) => onChange({ email: e.target.value })}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="member-password">
          Password{mode === "edit" ? " (opsional)" : ""}
        </Label>
        <PasswordInput
          id="member-password"
          required={mode === "create"}
          value={values.password}
          onChange={(e) => onChange({ password: e.target.value })}
          autoComplete="new-password"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="member-package">Paket</Label>
        <Select
          value={values.packageId || undefined}
          onValueChange={(packageId) => onChange({ packageId })}
        >
          <SelectTrigger id="member-package" className="w-full">
            <SelectValue placeholder="Pilih paket" />
          </SelectTrigger>
          <SelectContent>
            {packages.map((pkg) => (
              <SelectItem key={pkg.id} value={pkg.id}>
                {pkg.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="member-idTrading">ID Trading</Label>
        <Input
          id="member-idTrading"
          required
          value={values.idTrading}
          onChange={(e) => onChange({ idTrading: e.target.value })}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="member-passwordTrading">
          Password Trading{mode === "edit" ? " (opsional)" : ""}
        </Label>
        <PasswordInput
          id="member-passwordTrading"
          required={mode === "create"}
          value={values.passwordTrading}
          onChange={(e) => onChange({ passwordTrading: e.target.value })}
          autoComplete="new-password"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="member-serverBroker">Server Broker</Label>
        <Input
          id="member-serverBroker"
          required
          value={values.serverBroker}
          onChange={(e) => onChange({ serverBroker: e.target.value })}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="member-status">Status</Label>
        <div className="flex h-9 items-center">
          <Switch
            id="member-status"
            checked={values.status === "ACTIVE"}
            onCheckedChange={(checked) =>
              onChange({ status: checked ? "ACTIVE" : "INACTIVE" })
            }
          />
        </div>
      </div>
    </div>
  );
}

export function MembersTable({
  header,
  rows,
  packages,
}: {
  header?: ReactNode;
  rows: MemberRow[];
  packages: MemberPackageOption[];
}) {
  const router = useRouter();
  const [data, setData] = useState(rows);
  const [filter, setFilter] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [viewRow, setViewRow] = useState<MemberRow | null>(null);
  const [editRow, setEditRow] = useState<MemberRow | null>(null);
  const [deleteRow, setDeleteRow] = useState<MemberRow | null>(null);
  const [form, setForm] = useState<FormValues>(emptyForm());

  useEffect(() => {
    setData(rows);
  }, [rows]);

  function openCreate() {
    setError(null);
    setForm(emptyForm(packages[0]?.id ?? ""));
    setCreateOpen(true);
  }

  function openEdit(row: MemberRow) {
    setError(null);
    setForm({
      packageId: row.packageId,
      name: row.name,
      email: row.email,
      password: "",
      idTrading: row.idTrading,
      passwordTrading: "",
      serverBroker: row.serverBroker,
      status: row.status,
    });
    setEditRow(row);
  }

  function closeDialogs() {
    setCreateOpen(false);
    setViewRow(null);
    setEditRow(null);
    setForm(emptyForm());
    setError(null);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.packageId) {
      setError("Paket wajib dipilih");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Gagal menambah member");
        return;
      }
      closeDialogs();
      router.refresh();
    } catch {
      setError("Kesalahan jaringan");
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editRow) return;
    setError(null);
    if (!form.packageId) {
      setError("Paket wajib dipilih");
      return;
    }
    setSaving(true);
    setBusyId(editRow.id);
    try {
      const body: Record<string, string> = {
        packageId: form.packageId,
        name: form.name,
        email: form.email,
        idTrading: form.idTrading,
        serverBroker: form.serverBroker,
        status: form.status,
      };
      if (form.password.trim()) body.password = form.password;
      if (form.passwordTrading.trim()) {
        body.passwordTrading = form.passwordTrading;
      }

      const res = await fetch(`/api/admin/members/${editRow.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Gagal memperbarui member");
        return;
      }
      closeDialogs();
      router.refresh();
    } catch {
      setError("Kesalahan jaringan");
    } finally {
      setSaving(false);
      setBusyId(null);
    }
  }

  async function confirmDelete() {
    if (!deleteRow) return;
    setError(null);
    setBusyId(deleteRow.id);
    try {
      const res = await fetch(`/api/admin/members/${deleteRow.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Gagal menghapus member");
        return;
      }
      setDeleteRow(null);
      router.refresh();
    } catch {
      setError("Kesalahan jaringan");
    } finally {
      setBusyId(null);
    }
  }

  async function toggleStatus(row: MemberRow, checked: boolean) {
    const next = checked ? "ACTIVE" : "INACTIVE";
    const prev = row.status;
    setError(null);
    setBusyId(row.id);
    setData((list) =>
      list.map((m) => (m.id === row.id ? { ...m, status: next } : m)),
    );
    setViewRow((v) => (v?.id === row.id ? { ...v, status: next } : v));
    try {
      const res = await fetch(`/api/admin/members/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const json = await res.json();
      if (!res.ok) {
        setData((list) =>
          list.map((m) => (m.id === row.id ? { ...m, status: prev } : m)),
        );
        setViewRow((v) => (v?.id === row.id ? { ...v, status: prev } : v));
        setError(json.error ?? "Gagal mengubah status");
        return;
      }
      router.refresh();
    } catch {
      setData((list) =>
        list.map((m) => (m.id === row.id ? { ...m, status: prev } : m)),
      );
      setViewRow((v) => (v?.id === row.id ? { ...v, status: prev } : v));
      setError("Kesalahan jaringan");
    } finally {
      setBusyId(null);
    }
  }

  const columns = useMemo<ColumnDef<MemberRow>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Nama",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.name}</span>
        ),
      },
      {
        accessorKey: "email",
        header: "Email",
      },
      {
        accessorKey: "packageName",
        header: "Paket",
      },
      {
        accessorKey: "idTrading",
        header: "ID Trading",
      },
      {
        accessorKey: "serverBroker",
        header: "Server Broker",
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const member = row.original;
          const busy = busyId === member.id;
          return (
            <Switch
              size="sm"
              checked={member.status === "ACTIVE"}
              disabled={busy}
              aria-label={
                member.status === "ACTIVE"
                  ? "Nonaktifkan member"
                  : "Aktifkan member"
              }
              onCheckedChange={(checked) => {
                void toggleStatus(member, checked);
              }}
            />
          );
        },
      },
      {
        id: "actions",
        header: "Aksi",
        cell: ({ row }) => {
          const member = row.original;
          const busy = busyId === member.id;
          return (
            <div className="flex justify-end gap-1">
              <DataTableAction
                label="Detail"
                disabled={busy}
                onClick={() => setViewRow(member)}
              >
                <EyeIcon />
              </DataTableAction>
              <DataTableAction
                label="Edit"
                disabled={busy}
                onClick={() => openEdit(member)}
              >
                <PencilIcon />
              </DataTableAction>
              <DataTableAction
                label="Hapus"
                disabled={busy}
                onClick={() => setDeleteRow(member)}
              >
                <Trash2Icon />
              </DataTableAction>
            </div>
          );
        },
      },
    ],
    [busyId],
  );

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
      const m = row.original;
      return (
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.packageName.toLowerCase().includes(q) ||
        m.idTrading.toLowerCase().includes(q) ||
        m.serverBroker.toLowerCase().includes(q) ||
        formatMemberStatus(m.status).toLowerCase().includes(q)
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
          placeholder="Cari nama, email, paket, ID trading…"
        />
        <Button
          onClick={openCreate}
          className="gap-2 shrink-0"
          disabled={packages.length === 0}
        >
          <PlusIcon className="size-4" />
          Tambah
        </Button>
      </div>

      {error &&
      !createOpen &&
      editRow === null &&
      deleteRow === null &&
      viewRow === null ? (
        <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

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
                title={
                  packages.length === 0
                    ? "Belum bisa menambah member"
                    : "Belum ada member"
                }
                description={
                  packages.length === 0
                    ? "Buat paket dulu sebelum menambah member."
                    : "Klik Tambah untuk membuat member baru."
                }
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
        <DialogContent className="sm:max-w-2xl gap-0 overflow-hidden p-0">
          <ScrollArea className="max-h-[90vh]">
            <form
              onSubmit={(e) => void handleCreate(e)}
              className="grid gap-4 p-6"
            >
              <DialogHeader>
                <DialogTitle>Tambah Member</DialogTitle>
                <DialogDescription>
                  Buat member baru beserta kredensial trading.
                </DialogDescription>
              </DialogHeader>
              {error ? (
                <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              ) : null}
              <MemberFormFields
                mode="create"
                packages={packages}
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
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog
        open={viewRow !== null}
        onOpenChange={(open) => !open && closeDialogs()}
      >
        <DialogContent className="sm:max-w-[425px] gap-0 overflow-hidden p-0">
          <ScrollArea className="max-h-[90vh]">
            <div className="grid gap-4 p-6">
              <DialogHeader>
                <DialogTitle>Detail Member</DialogTitle>
                <DialogDescription>
                  Informasi lengkap member.
                </DialogDescription>
              </DialogHeader>
              {viewRow ? (
                <div className="flex flex-col">
                  {[
                    { label: "Nama", value: viewRow.name },
                    { label: "Email", value: viewRow.email },
                    { label: "Password", value: viewRow.password },
                    { label: "Paket", value: viewRow.packageName },
                    { label: "ID Trading", value: viewRow.idTrading },
                    {
                      label: "Password Trading",
                      value: viewRow.passwordTrading,
                    },
                    { label: "Server Broker", value: viewRow.serverBroker },
                    {
                      label: "Status",
                      value: formatMemberStatus(viewRow.status),
                    },
                  ].map((row, index, list) => (
                    <div key={row.label}>
                      <div className="flex items-center justify-between gap-4 py-2.5 text-sm">
                        <span className="text-muted-foreground">{row.label}</span>
                        <span className="text-right font-medium break-all">
                          {row.value}
                        </span>
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
                {viewRow ? (
                  <Button
                    type="button"
                    onClick={() => {
                      const row = viewRow;
                      setViewRow(null);
                      openEdit(row);
                    }}
                  >
                    Edit
                  </Button>
                ) : null}
              </DialogFooter>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editRow !== null}
        onOpenChange={(open) => !open && closeDialogs()}
      >
        <DialogContent className="sm:max-w-2xl gap-0 overflow-hidden p-0">
          <ScrollArea className="max-h-[90vh]">
            <form
              onSubmit={(e) => void handleEdit(e)}
              className="grid gap-4 p-6"
            >
              <DialogHeader>
                <DialogTitle>Edit Member</DialogTitle>
                <DialogDescription>
                  Ubah data member. Kosongkan password jika tidak ingin diganti.
                </DialogDescription>
              </DialogHeader>
              {error ? (
                <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              ) : null}
              <MemberFormFields
                mode="edit"
                packages={packages}
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
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteRow !== null}
        onOpenChange={(open) => !open && setDeleteRow(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus member?</AlertDialogTitle>
            <AlertDialogDescription>
              Member{" "}
              <span className="font-medium text-foreground">
                {deleteRow?.name}
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
            <AlertDialogCancel disabled={busyId !== null}>Batal</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={busyId !== null}
              onClick={(e) => {
                e.preventDefault();
                void confirmDelete();
              }}
            >
              {busyId !== null ? "Menghapus…" : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
