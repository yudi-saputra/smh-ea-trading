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
import { CopyIcon, EyeIcon, KeyRoundIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CreateAccountForm,
  type TraderOption,
} from "@/components/admin/account/create-account-form";
import { DatePicker } from "@/components/shared/date-picker";
import {
  DataTableAction,
  DataTableActionButton,
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
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toExpiryDateInput } from "@/lib/expiry";
import { cn } from "@/lib/utils";

export type AccountRow = {
  id: string;
  terminalId: string;
  name: string;
  online: boolean;
  eaStatus: string;
  apiKey: string | null;
  ownerEmail: string | null;
  ownerName: string | null;
  expiry: string;
  expiryLabel: "none" | "active" | "expiring" | "expired";
  expiresAt: string | null;
};

function expiryTone(label: AccountRow["expiryLabel"]) {
  if (label === "expired") return "text-trading-loss";
  if (label === "expiring") return "text-trading-gold";
  return "";
}

function statusTone(status: string) {
  const s = status.toLowerCase();
  if (s === "on") return "text-trading-profit";
  if (s === "paused") return "text-trading-gold";
  return "text-muted-foreground";
}

function ApiKeyCell({ apiKey }: { apiKey: string | null }) {
  const [copied, setCopied] = useState(false);

  if (!apiKey) {
    return <span className="text-muted-foreground">—</span>;
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(apiKey!);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex max-w-56 items-center gap-1">
      <code className="truncate font-mono text-xs" title={apiKey}>
        {apiKey}
      </code>
      <DataTableActionButton
        label={copied ? "Tersalin" : "Salin ApiKey"}
        onClick={copy}
      >
        <CopyIcon />
      </DataTableActionButton>
    </div>
  );
}

export function AccountsTable({
  header,
  rows,
  showOwner,
  traders = [],
  canCreate = false,
  canGenerateApiKey = false,
}: {
  header?: ReactNode;
  rows: AccountRow[];
  showOwner: boolean;
  traders?: TraderOption[];
  canCreate?: boolean;
  canGenerateApiKey?: boolean;
  /** @deprecated Detail memakai dialog; prop diabaikan. */
  basePath?: string;
}) {
  const router = useRouter();
  const [data, setData] = useState(rows);
  const [filter, setFilter] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createKey, setCreateKey] = useState(0);
  const [viewRow, setViewRow] = useState<AccountRow | null>(null);
  const [editRow, setEditRow] = useState<AccountRow | null>(null);
  const [editExpiresAt, setEditExpiresAt] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [deleteRow, setDeleteRow] = useState<AccountRow | null>(null);
  const [generateRow, setGenerateRow] = useState<AccountRow | null>(null);
  const [revealedKey, setRevealedKey] = useState<{
    name: string;
    terminalId: string;
    apiKey: string;
  } | null>(null);
  const [keyCopied, setKeyCopied] = useState(false);

  useEffect(() => {
    setData(rows);
  }, [rows]);

  function openCreate() {
    setCreateKey((k) => k + 1);
    setCreateOpen(true);
  }

  function closeCreate() {
    setCreateOpen(false);
    router.refresh();
  }

  function openEdit(row: AccountRow) {
    setError(null);
    setViewRow(null);
    setEditRow(row);
    setEditExpiresAt(toExpiryDateInput(row.expiresAt));
  }

  function closeEdit() {
    setEditRow(null);
    setEditExpiresAt("");
    setEditSaving(false);
  }

  function closeView() {
    setViewRow(null);
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editRow) return;
    setError(null);
    setEditSaving(true);
    try {
      const res = await fetch(`/api/account/${editRow.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expiresAt: editExpiresAt.trim() || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Gagal memperbarui akun");
        return;
      }
      closeEdit();
      router.refresh();
    } catch {
      setError("Kesalahan jaringan");
    } finally {
      setEditSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteRow) return;
    const row = deleteRow;
    setError(null);
    setBusyId(row.id);
    try {
      const res = await fetch(`/api/account/${row.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Gagal menghapus akun");
        return;
      }
      setData((prev) => prev.filter((r) => r.id !== row.id));
      if (editRow?.id === row.id) closeEdit();
      if (viewRow?.id === row.id) closeView();
      setDeleteRow(null);
      router.refresh();
    } catch {
      setError("Kesalahan jaringan");
    } finally {
      setBusyId(null);
    }
  }

  async function confirmGenerateKey() {
    if (!generateRow) return;
    const row = generateRow;
    setError(null);
    setBusyId(row.id);
    try {
      const res = await fetch(`/api/account/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rotateApiKey: true }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Gagal generate API Key");
        return;
      }
      if (!json.apiKey) {
        setError("API Key tidak dikembalikan server");
        return;
      }
      setData((prev) =>
        prev.map((r) =>
          r.id === row.id ? { ...r, apiKey: json.apiKey as string } : r,
        ),
      );
      setViewRow((v) =>
        v?.id === row.id ? { ...v, apiKey: json.apiKey as string } : v,
      );
      setGenerateRow(null);
      setKeyCopied(false);
      setRevealedKey({
        name: row.name,
        terminalId: row.terminalId,
        apiKey: json.apiKey,
      });
      toast.success("Berhasil", {
        description: "API Key berhasil di-generate.",
      });
      router.refresh();
    } catch {
      setError("Kesalahan jaringan");
    } finally {
      setBusyId(null);
    }
  }

  async function copyRevealedKey() {
    if (!revealedKey) return;
    try {
      await navigator.clipboard.writeText(revealedKey.apiKey);
      setKeyCopied(true);
      window.setTimeout(() => setKeyCopied(false), 1500);
    } catch {
      setKeyCopied(false);
    }
  }

  const columns = useMemo<ColumnDef<AccountRow>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Member",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.name}</span>
        ),
      },
      {
        accessorKey: "terminalId",
        header: "ID Trading",
        cell: ({ row }) => (
          <span className="font-mono text-sm">{row.original.terminalId}</span>
        ),
      },
      {
        id: "apiKey",
        header: "API Key",
        cell: ({ row }) => <ApiKeyCell apiKey={row.original.apiKey} />,
      },
      {
        id: "expiry",
        header: "Expired",
        cell: ({ row }) => (
          <span
            className={cn("tabular-nums", expiryTone(row.original.expiryLabel))}
          >
            {row.original.expiry}
          </span>
        ),
      },
      {
        id: "eaStatus",
        header: "EA Status",
        cell: ({ row }) => {
          const status = row.original.eaStatus;
          if (!status || status === "-" || status === "—") {
            return <span className="text-muted-foreground">—</span>;
          }
          return (
            <span
              className={cn(
                "text-sm font-medium uppercase",
                statusTone(status),
              )}
            >
              {status}
            </span>
          );
        },
      },
      {
        id: "online",
        header: "MT Status",
        cell: ({ row }) => (
          <Badge variant={row.original.online ? "default" : "secondary"}>
            {row.original.online ? "Online" : "Offline"}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: "Aksi",
        cell: ({ row }) => {
          const r = row.original;
          const busy = busyId === r.id;
          return (
            <div className="flex justify-end gap-1">
              <DataTableAction
                label="Detail"
                disabled={busy}
                onClick={() => setViewRow(r)}
              >
                <EyeIcon />
              </DataTableAction>
              {canGenerateApiKey ? (
                <DataTableAction
                  label="Generate API Key"
                  disabled={busy}
                  onClick={() => {
                    setError(null);
                    setGenerateRow(r);
                  }}
                >
                  <KeyRoundIcon />
                </DataTableAction>
              ) : null}
              <DataTableAction
                label="Edit"
                disabled={busy}
                onClick={() => openEdit(r)}
              >
                <PencilIcon />
              </DataTableAction>
              <DataTableAction
                label="Hapus"
                disabled={busy}
                onClick={() => setDeleteRow(r)}
              >
                <Trash2Icon />
              </DataTableAction>
            </div>
          );
        },
      },
    ],
    [busyId, canGenerateApiKey],
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
      const r = row.original;
      return (
        r.name.toLowerCase().includes(q) ||
        r.terminalId.toLowerCase().includes(q) ||
        (r.apiKey?.toLowerCase().includes(q) ?? false) ||
        (r.ownerEmail?.toLowerCase().includes(q) ?? false) ||
        (r.ownerName?.toLowerCase().includes(q) ?? false) ||
        r.eaStatus.toLowerCase().includes(q) ||
        (r.online ? "online" : "offline").includes(q)
      );
    },
  });

  const detailRows = viewRow
    ? [
        { label: "Member", value: viewRow.name },
        { label: "ID Trading", value: viewRow.terminalId },
        ...(showOwner
          ? [
              {
                label: "Owner",
                value: viewRow.ownerName ?? viewRow.ownerEmail ?? "—",
              },
            ]
          : []),
        {
          label: "MT Status",
          value: viewRow.online ? "Online" : "Offline",
        },
        { label: "EA Status", value: viewRow.eaStatus },
        { label: "Expired", value: viewRow.expiry },
        ...(viewRow.apiKey
          ? [{ label: "API Key", value: viewRow.apiKey }]
          : []),
      ]
    : [];

  return (
    <div className="space-y-4">
      {header}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <DataTableSearch
          value={filter}
          onChange={setFilter}
          placeholder="Cari member atau ID trading…"
        />
        {canCreate ? (
          <Button
            type="button"
            className="gap-2 shrink-0"
            onClick={openCreate}
            disabled={traders.length === 0}
          >
            <PlusIcon className="size-4" />
            Tambah
          </Button>
        ) : null}
      </div>

      {error &&
      !createOpen &&
      editRow === null &&
      deleteRow === null &&
      viewRow === null &&
      generateRow === null &&
      revealedKey === null ? (
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
                title="Belum ada akun"
                description={
                  canCreate
                    ? traders.length === 0
                      ? "Semua member aktif sudah punya akun, atau buat member dulu."
                      : "Klik Tambah untuk membuat akun baru."
                    : "Buat terminal baru untuk memulai."
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

      {canCreate ? (
        <Dialog
          open={createOpen}
          onOpenChange={(open) => {
            if (!open) closeCreate();
            else setCreateOpen(true);
          }}
        >
          <DialogContent className="sm:max-w-[425px]">
            <CreateAccountForm
              key={createKey}
              isAdmin
              traders={traders}
              embedded
              onDone={closeCreate}
            />
          </DialogContent>
        </Dialog>
      ) : null}

      <Dialog open={viewRow !== null} onOpenChange={(open) => !open && closeView()}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Detail Akun</DialogTitle>
            <DialogDescription>Informasi lengkap akun trading.</DialogDescription>
          </DialogHeader>
          {viewRow ? (
            <div className="flex flex-col">
              {detailRows.map((row, index, list) => (
                <div key={row.label}>
                  <div className="flex items-center justify-between gap-4 py-2.5 text-sm">
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className="max-w-[60%] text-right font-medium break-all">
                      {row.value}
                    </span>
                  </div>
                  {index < list.length - 1 ? <Separator /> : null}
                </div>
              ))}
            </div>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeView}>
              Tutup
            </Button>
            {viewRow ? (
              <Button type="button" onClick={() => openEdit(viewRow)}>
                Edit
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editRow} onOpenChange={(open) => !open && closeEdit()}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={(e) => void saveEdit(e)} className="grid gap-4">
            <DialogHeader>
              <DialogTitle>Edit akun</DialogTitle>
              <DialogDescription>
                Ubah tanggal kedaluwarsa akun.
              </DialogDescription>
            </DialogHeader>
            {error ? (
              <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            ) : null}
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-terminal-id">ID Trading</Label>
                <Input
                  id="edit-terminal-id"
                  value={editRow?.terminalId ?? ""}
                  disabled
                  className="font-mono"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-expiresAt">Tanggal kedaluwarsa</Label>
                <DatePicker
                  id="edit-expiresAt"
                  value={editExpiresAt}
                  onChange={setEditExpiresAt}
                  placeholder="Tanpa batas"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={closeEdit}
                disabled={editSaving}
              >
                Batal
              </Button>
              <Button type="submit" disabled={editSaving}>
                {editSaving ? "Menyimpan…" : "Simpan"}
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
            <AlertDialogTitle>Hapus akun?</AlertDialogTitle>
            <AlertDialogDescription>
              Akun{" "}
              <span className="font-medium text-foreground">
                {deleteRow?.name}
              </span>{" "}
              (ID Trading {deleteRow?.terminalId}) akan dihapus permanen.
              ApiKey terkait ikut hilang.
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
              {busyId !== null ? "Menghapus…" : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={generateRow != null}
        onOpenChange={(open) => {
          if (!open && busyId === null) setGenerateRow(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Generate API Key?</AlertDialogTitle>
            <AlertDialogDescription>
              Key lama untuk{" "}
              <span className="font-medium text-foreground">
                {generateRow?.name}
              </span>{" "}
              (ID Trading {generateRow?.terminalId}) langsung tidak berlaku.
              Tempel key baru di SMH_Controller.
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
              disabled={busyId !== null}
              onClick={(e) => {
                e.preventDefault();
                void confirmGenerateKey();
              }}
            >
              {busyId !== null ? "Generating…" : "Generate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={revealedKey !== null}
        onOpenChange={(open) => !open && setRevealedKey(null)}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>API Key</DialogTitle>
            <DialogDescription>
              Salin ApiKey sekarang. Key lama sudah tidak berlaku.
            </DialogDescription>
          </DialogHeader>
          <pre className="overflow-x-auto rounded-md border bg-muted/40 px-3 py-2 font-mono text-xs break-all whitespace-pre-wrap">
            {revealedKey?.apiKey}
          </pre>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => void copyRevealedKey()}
              className="gap-2"
            >
              <CopyIcon className="size-4" />
              {keyCopied ? "Tersalin" : "Salin"}
            </Button>
            <Button type="button" onClick={() => setRevealedKey(null)}>
              Selesai
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
