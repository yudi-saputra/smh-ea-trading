"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DataTableAction,
  DataTableCard,
  DataTableEmpty,
  DataTablePagination,
  DataTableSearch,
  DataTableToolbar,
  dataTableBodyClass,
  dataTableCellClass,
  dataTableHeadClass,
  dataTableHeaderClass,
  dataTableHeaderRowClass,
  dataTableRowClass,
} from "@/components/admin/tables/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatAffiliateStatus } from "@/lib/affiliates";
import { cn } from "@/lib/utils";

export type AffiliateRow = {
  id: string;
  code: string;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  notes: string;
  memberCount: number;
  createdAt: string;
};

type FormValues = {
  code: string;
  name: string;
  email: string;
  phone: string;
  notes: string;
  status: string;
};

const emptyForm = (): FormValues => ({
  code: "",
  name: "",
  email: "",
  phone: "",
  notes: "",
  status: "ACTIVE",
});

function AffiliateFormFields({
  values,
  onChange,
}: {
  values: FormValues;
  onChange: (patch: Partial<FormValues>) => void;
}) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="aff-code">Kode</Label>
        <Input
          id="aff-code"
          required
          value={values.code}
          onChange={(e) => onChange({ code: e.target.value.toUpperCase() })}
          className="font-mono uppercase"
          placeholder="SMH-UDI"
          autoComplete="off"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="aff-name">Nama</Label>
        <Input
          id="aff-name"
          required
          value={values.name}
          onChange={(e) => onChange({ name: e.target.value })}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="aff-email">Email</Label>
        <Input
          id="aff-email"
          type="email"
          required
          value={values.email}
          onChange={(e) => onChange({ email: e.target.value })}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="aff-phone">Telepon (opsional)</Label>
        <Input
          id="aff-phone"
          value={values.phone}
          onChange={(e) => onChange({ phone: e.target.value })}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="aff-notes">Catatan (opsional)</Label>
        <textarea
          id="aff-notes"
          rows={2}
          value={values.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
          className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 flex min-h-16 w-full rounded-md border bg-transparent px-2.5 py-2 text-sm shadow-xs outline-none focus-visible:ring-3"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="aff-status">Status</Label>
        <Switch
          id="aff-status"
          checked={values.status === "ACTIVE"}
          onCheckedChange={(checked) =>
            onChange({ status: checked ? "ACTIVE" : "INACTIVE" })
          }
        />
      </div>
    </div>
  );
}

export function AffiliatesTable({
  header,
  rows,
}: {
  header?: ReactNode;
  rows: AffiliateRow[];
}) {
  const router = useRouter();
  const [data, setData] = useState(rows);
  const [filter, setFilter] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editRow, setEditRow] = useState<AffiliateRow | null>(null);
  const [deleteRow, setDeleteRow] = useState<AffiliateRow | null>(null);
  const [form, setForm] = useState<FormValues>(emptyForm);

  useEffect(() => {
    setData(rows);
  }, [rows]);

  function openCreate() {
    setError(null);
    setForm(emptyForm());
    setCreateOpen(true);
  }

  function openEdit(row: AffiliateRow) {
    setError(null);
    setForm({
      code: row.code,
      name: row.name,
      email: row.email,
      phone: row.phone ?? "",
      notes: row.notes,
      status: row.status,
    });
    setEditRow(row);
  }

  function closeDialogs() {
    setCreateOpen(false);
    setEditRow(null);
    setForm(emptyForm());
    setError(null);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/admin/affiliates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Gagal menambah afiliator");
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
    setSaving(true);
    setBusyId(editRow.id);
    try {
      const res = await fetch(`/api/admin/affiliates/${editRow.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Gagal memperbarui afiliator");
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
      const res = await fetch(`/api/admin/affiliates/${deleteRow.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Gagal menghapus afiliator");
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

  const columns = useMemo<ColumnDef<AffiliateRow>[]>(
    () => [
      {
        accessorKey: "code",
        header: "Kode",
        cell: ({ row }) => (
          <span className="font-mono text-sm font-medium">
            {row.original.code}
          </span>
        ),
      },
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
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.email}</span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge
            variant={
              row.original.status === "ACTIVE" ? "default" : "secondary"
            }
          >
            {formatAffiliateStatus(row.original.status)}
          </Badge>
        ),
      },
      {
        accessorKey: "memberCount",
        header: "Member",
        cell: ({ row }) => (
          <span className="tabular-nums">{row.original.memberCount}</span>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Dibuat",
        cell: ({ row }) => (
          <span className="text-muted-foreground tabular-nums">
            {format(new Date(row.original.createdAt), "d MMM yyyy", {
              locale: localeId,
            })}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Aksi",
        cell: ({ row }) => {
          const a = row.original;
          const busy = busyId === a.id;
          return (
            <div className="flex justify-end gap-1">
              <DataTableAction
                label="Edit"
                disabled={busy}
                onClick={() => openEdit(a)}
              >
                <PencilIcon />
              </DataTableAction>
              <DataTableAction
                label="Hapus"
                disabled={busy}
                onClick={() => setDeleteRow(a)}
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
      const a = row.original;
      return (
        a.code.toLowerCase().includes(q) ||
        a.name.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        (a.phone?.toLowerCase().includes(q) ?? false) ||
        formatAffiliateStatus(a.status).toLowerCase().includes(q)
      );
    },
  });

  return (
    <div className="space-y-4">
      {header}

      {error && !createOpen && !editRow && !deleteRow ? (
        <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <DataTableCard
        toolbar={
          <DataTableToolbar>
            <DataTableSearch
              value={filter}
              onChange={setFilter}
              placeholder="Cari kode, nama, atau email…"
            />
            <Button onClick={openCreate} className="gap-2 shrink-0">
              <PlusIcon className="size-4" />
              Tambah
            </Button>
          </DataTableToolbar>
        }
        footer={<DataTablePagination table={table} />}
      >
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
                title="Belum ada afiliator"
                description="Klik Tambah untuk membuat afiliator baru."
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

      <Dialog open={createOpen} onOpenChange={(open) => !open && closeDialogs()}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={(e) => void handleCreate(e)} className="grid gap-4">
            <DialogHeader>
              <DialogTitle>Tambah afiliator</DialogTitle>
              <DialogDescription>
                Buat kode referral untuk dilampirkan saat member daftar.
              </DialogDescription>
            </DialogHeader>
            {error ? (
              <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            ) : null}
            <AffiliateFormFields
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
        open={!!editRow}
        onOpenChange={(open) => !open && closeDialogs()}
      >
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={(e) => void handleEdit(e)} className="grid gap-4">
            <DialogHeader>
              <DialogTitle>Edit afiliator</DialogTitle>
              <DialogDescription>
                Perbarui data dan status afiliator.
              </DialogDescription>
            </DialogHeader>
            {error ? (
              <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            ) : null}
            <AffiliateFormFields
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

      <AlertDialog
        open={deleteRow != null}
        onOpenChange={(open) => {
          if (!open && busyId === null) setDeleteRow(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus afiliator?</AlertDialogTitle>
            <AlertDialogDescription>
              Afiliator{" "}
              <span className="font-medium text-foreground">
                {deleteRow?.name}
              </span>{" "}
              ({deleteRow?.code}) akan dihapus. Member yang terhubung tetap ada;
              tautan referral mereka dikosongkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error ? (
            <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busyId !== null}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={busyId !== null}
              onClick={(e) => {
                e.preventDefault();
                void confirmDelete();
              }}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
