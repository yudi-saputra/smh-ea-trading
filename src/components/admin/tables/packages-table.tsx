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
import { formatPackageStatus } from "@/lib/packages";
import { cn } from "@/lib/utils";

export type PackageRow = {
  id: string;
  name: string;
  description: string;
  status: string;
};

type FormValues = {
  name: string;
  description: string;
  status: string;
};

const emptyForm = (): FormValues => ({
  name: "",
  description: "",
  status: "ACTIVE",
});

function PackageFormFields({
  values,
  onChange,
}: {
  values: FormValues;
  onChange: (patch: Partial<FormValues>) => void;
}) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="package-name">Nama</Label>
        <Input
          id="package-name"
          required
          value={values.name}
          onChange={(e) => onChange({ name: e.target.value })}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="package-description">Keterangan</Label>
        <textarea
          id="package-description"
          rows={3}
          value={values.description}
          onChange={(e) => onChange({ description: e.target.value })}
          className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 flex min-h-20 w-full rounded-md border bg-transparent px-2.5 py-2 text-sm shadow-xs outline-none focus-visible:ring-3 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="package-status">Status</Label>
        <Switch
          id="package-status"
          checked={values.status === "ACTIVE"}
          onCheckedChange={(checked) =>
            onChange({ status: checked ? "ACTIVE" : "INACTIVE" })
          }
        />
      </div>
    </div>
  );
}

export function PackagesTable({
  header,
  rows,
}: {
  header?: ReactNode;
  rows: PackageRow[];
}) {
  const router = useRouter();
  const [data, setData] = useState(rows);
  const [filter, setFilter] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editRow, setEditRow] = useState<PackageRow | null>(null);
  const [deleteRow, setDeleteRow] = useState<PackageRow | null>(null);
  const [form, setForm] = useState<FormValues>(emptyForm);

  useEffect(() => {
    setData(rows);
  }, [rows]);

  function openCreate() {
    setError(null);
    setForm(emptyForm());
    setCreateOpen(true);
  }

  function openEdit(row: PackageRow) {
    setError(null);
    setForm({
      name: row.name,
      description: row.description,
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
      const res = await fetch("/api/admin/packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Gagal menambah package");
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
      const res = await fetch(`/api/admin/packages/${editRow.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Gagal memperbarui package");
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
      const res = await fetch(`/api/admin/packages/${deleteRow.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Gagal menghapus package");
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

  const columns = useMemo<ColumnDef<PackageRow>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Nama",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.name}</span>
        ),
      },
      {
        accessorKey: "description",
        header: "Keterangan",
        cell: ({ row }) => (
          <span className="line-clamp-2 max-w-md text-muted-foreground">
            {row.original.description || "—"}
          </span>
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
            {formatPackageStatus(row.original.status)}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: "Aksi",
        cell: ({ row }) => {
          const pkg = row.original;
          const busy = busyId === pkg.id;
          return (
            <div className="flex justify-end gap-1">
              <DataTableAction
                label="Edit"
                disabled={busy}
                onClick={() => openEdit(pkg)}
              >
                <PencilIcon />
              </DataTableAction>
              <DataTableAction
                label="Hapus"
                disabled={busy}
                onClick={() => setDeleteRow(pkg)}
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
      const p = row.original;
      return (
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        formatPackageStatus(p.status).toLowerCase().includes(q)
      );
    },
  });

  return (
    <div className="space-y-4">
      {header}

      <DataTableCard
        toolbar={
          <DataTableToolbar>
            <DataTableSearch
              value={filter}
              onChange={setFilter}
              placeholder="Cari berdasarkan nama atau keterangan…"
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
                title="Belum ada package"
                description="Klik Tambah untuk membuat package baru."
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
              <DialogTitle>Tambah package</DialogTitle>
              <DialogDescription>
                Buat package baru untuk ditawarkan ke trader.
              </DialogDescription>
            </DialogHeader>
            {error ? (
              <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            ) : null}
            <PackageFormFields
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
        open={editRow !== null}
        onOpenChange={(open) => !open && closeDialogs()}
      >
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={(e) => void handleEdit(e)} className="grid gap-4">
            <DialogHeader>
              <DialogTitle>Edit Paket</DialogTitle>
              <DialogDescription>
                Ubah data paket yang akan ditampilkan.
              </DialogDescription>
            </DialogHeader>
            {error ? (
              <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            ) : null}
            <PackageFormFields
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
        open={deleteRow !== null}
        onOpenChange={(open) => !open && setDeleteRow(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus package?</AlertDialogTitle>
            <AlertDialogDescription>
              Package{" "}
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
