# Typography Rules

Aturan ukuran & penggunaan font untuk SMH Control Panel. Mengikuti best practice **shadcn/ui** dan **dashboard-01**.

## Prinsip

1. **Satu sumber kebenaran per surface** — jangan campur token Tailwind dengan kelas `type-*` di file yang sama tanpa alasan.
2. **Admin / dashboard** → pakai token Tailwind shadcn (`text-sm`, `text-base`, `text-2xl`, …).
3. **Client mobile** → boleh pakai skala `type-*` di `globals.css` (lebih compact untuk layar kecil).
4. **Jangan** hardcode `text-[13px]`, `text-[15px]`, dll. kecuali kasus sangat spesial.

---

## Skala (Admin / shadcn)

| Peran | Class | Kapan dipakai |
|--------|--------|----------------|
| Page title | `text-2xl font-semibold tracking-tight` | Judul halaman (`h1`/`h2`) |
| Section title | `text-lg font-medium` | Sub-heading di dalam halaman |
| App header | `text-base font-medium` | Judul di `SiteHeader` |
| Body / UI | `text-sm` | Tabel, form, dialog, deskripsi, tombol default |
| Table header | `text-sm font-medium` | `TableHead` / header kolom |
| Helper / meta | `text-sm text-muted-foreground` | Subtitle, hint, pagination kiri |
| Micro (jarang) | `text-xs text-muted-foreground` | Badge kecil, caption sekunder |

### Weight

- `font-medium` — label, item aktif, nilai penting
- `font-semibold` — page title, angka KPI besar
- Hindari `font-bold` kecuali brand/display

### Warna teks

- Default: `text-foreground`
- Sekunder: `text-muted-foreground`
- Jangan pakai abu custom (`text-gray-*`) jika token semantic sudah ada

---

## Skala (Client / `type-*`)

Hanya untuk UI client (home, account, profile). Definisi di `src/app/globals.css`:

| Class | Peran |
|--------|--------|
| `type-label` | Label uppercase kecil |
| `type-caption` / `type-micro` | Meta sangat kecil |
| `type-body` / `type-body-sm` | Body mobile |
| `type-ui` | UI default client |
| `type-title` | Judul kartu / section |
| `type-display` | Display / hero |

Jangan pakai `type-*` di halaman admin (`src/app/(admin)/**`, `src/components/admin/**`).

---

## Folder structure (`src/components`)

Komponen dibagi per domain. **Jangan** taruh komponen domain di root `src/components/`.

| Folder | Isi |
|--------|-----|
| `ui/` | shadcn only — tanpa business logic |
| `admin/layout/` | Shell admin: sidebar, header, nav, section cards |
| `admin/tables/` | Data tables + helper `data-table` |
| `admin/account/` | Form create/expiry akun (terminal) |
| `admin/banners/` | Banner manager |
| `member/` | UI member portal `/member/*` (home, account, profile) |
| `auth/` | Form login / register |
| `shared/` | Dipakai lintas admin + member (theme, logo, date-picker) |
| `skeletons/` | Loading skeletons |

Aturan singkat:

- Fitur admin baru → `components/admin/...` sesuai subfolder
- Fitur member baru → `components/member/...`
- Auth forms → `components/auth/...`
- Shared lintas surface → `components/shared/...`
- Nama export publik ikut domain (`MemberAppShell`, `UsersTable`, `AuthLoginForm`); path mengikuti folder
- **Peta URL & redirect:** lihat `docs/ROUTING.md` — update file itu setiap ada perubahan route

---

## Admin list / data table (dashboard-01)

Referensi kanonik: `src/components/admin/tables/users-table.tsx` + helpers di `data-table.tsx`.
Halaman list admin lain (packages, accounts, api-keys, …) **harus** mengikuti pola ini.

### Layout halaman (urutan vertikal)

```
space-y-4
├── header          ← page title + subtitle (dari page.tsx via prop)
├── toolbar         ← OUTSIDE card: search kiri, CTA kanan
├── DataTableCard   ← HANYA tabel (outline border)
└── DataTablePagination  ← OUTSIDE card
```

- **Jangan** taruh search / tombol Tambah di dalam `DataTableCard`.
- **Jangan** bungkus pagination di dalam card.

### Page header (`page.tsx`)

```tsx
<header={
  <div className="space-y-1">
    <h2 className="text-2xl font-semibold tracking-tight">…</h2>
    <p className="text-sm text-muted-foreground">…</p>
  </div>
}
```

### Toolbar

```tsx
<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
  <DataTableSearch value={…} onChange={…} placeholder="Cari …" />
  <Button onClick={openCreate} className="gap-2 shrink-0">
    <PlusIcon className="size-4" />
    Tambah
  </Button>
</div>
```

### Tabel — pakai token dari `data-table.tsx`

| Token | Dipakai di |
|-------|------------|
| `dataTableHeaderClass` | `TableHeader` (`sticky` + `bg-muted`) |
| `dataTableHeaderRowClass` | `TableRow` di header |
| `dataTableHeadClass` | `TableHead` (`text-sm font-medium`) |
| `dataTableBodyClass` | `TableBody` (`bg-background`) |
| `dataTableRowClass` | `TableRow` body |
| `dataTableCellClass` | `TableCell` (`px-4 py-3 text-sm`) |
| `dataTableScrollClass` | Max height default ScrollArea di dalam `DataTableCard` |
| `DataTableEmpty` | Empty state (1 row, `colSpan` = jumlah kolom) |
| `DataTableCard` | Card tabel; **otomatis** bungkus children dengan `ScrollArea` |

Kolom Aksi: `TableHead` + cell `text-right`; tombol di `flex justify-end gap-1`.

### Aksi baris

Pakai `DataTableAction` (icon + tooltip), **satu per aksi** — jangan bungkus beberapa button di satu `DataTableAction` tanpa `label`.

```tsx
<div className="flex justify-end gap-1">
  <DataTableAction label="Show" onClick={…}><EyeIcon /></DataTableAction>
  <DataTableAction label="Edit" onClick={…}><PencilIcon /></DataTableAction>
  <DataTableAction label="Hapus" onClick={…}><Trash2Icon /></DataTableAction>
</div>
```

### Dialog / AlertDialog

- `DialogContent`: default `bg-popover` (sudah di `ui/dialog`) — jangan override ke `bg-background` kecuali perlu.
- Lebar form: `sm:max-w-106.25` (atau biarkan default `sm:max-w-md`).
- Form: `<form className="grid gap-4">` mengelilingi header + fields + footer.
- Field: `Label` + `Input` dalam `grid gap-2` (bukan `bg-secondary` custom di input).
- Error: `rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive`.
- Footer: Batal (`variant="outline"`) + primary; hapus pakai `AlertDialogAction variant="destructive"`.
- Detail (Show): key–value `text-sm`, label `text-muted-foreground`, value `font-medium`, pisah dengan `Separator` — **bukan** input disabled.
- Form panjang: bungkus isi dialog dengan `ScrollArea` (`max-h-[90vh]`), **jangan** `overflow-y-auto` ad-hoc di `DialogContent`.

```tsx
<DialogContent className="sm:max-w-106.25 gap-0 overflow-hidden p-0">
  <ScrollArea className="max-h-[90vh]">
    <form className="grid gap-4 p-6">…</form>
  </ScrollArea>
</DialogContent>
```

### Empty state

Wajib pakai `DataTableEmpty` (membungkus `Empty` dari `@/components/ui/empty`) — **jangan** teks polos di `TableCell`.

```tsx
{table.getRowModel().rows.length === 0 ? (
  <DataTableEmpty
    colSpan={columns.length}
    title="Belum ada …"
    description="Opsional: petunjuk singkat."
  />
) : (
  …
)}
```

- `title` wajib, singkat (mis. `Belum ada member.`)
- `description` opsional — konteks / next step
- `action` opsional — CTA (jarang; tombol Tambah biasanya di toolbar)

### Scroll area

- UI: `@/components/ui/scroll-area` (`ScrollArea` + `ScrollBar`)
- Admin list: `DataTableCard` sudah membungkus tabel dengan `ScrollArea` (`dataTableScrollClass` = `max-h-[min(60vh,36rem)]`)
- Override tinggi: `<DataTableCard scrollClassName="max-h-96">…`
- Nonaktifkan scroll: `<DataTableCard scrollClassName={false}>…`
- Header tabel tetap sticky (`dataTableHeaderClass`) di dalam viewport scroll
- Dialog / panel tinggi: pakai `ScrollArea`, bukan `overflow-y-auto` mentah

### Stack

- `@tanstack/react-table` + helpers `DataTable*` dari `@/components/admin/tables/data-table`
- Empty state: `DataTableEmpty` (bukan teks polos / `Empty` ad-hoc di cell)
- Scroll: `ScrollArea` via `DataTableCard` / dialog panjang
- Jangan copy-paste class header/cell secara ad-hoc; import token yang sudah ada

---

## Contoh

```tsx
// ✅ Page header (admin)
<div className="space-y-1">
  <h2 className="text-2xl font-semibold tracking-tight">Daftar Pengguna</h2>
  <p className="text-sm text-muted-foreground">Kelola pengguna dan role.</p>
</div>

// ✅ Table
<TableHead className="text-sm font-medium">Nama</TableHead>
<TableCell className="text-sm">…</TableCell>

// ✅ Dialog
<DialogTitle className="text-base font-semibold">Edit pengguna</DialogTitle>
<DialogDescription className="text-sm text-muted-foreground">…</DialogDescription>

// ❌ Hindari
<h2 className="text-[22px] font-bold">…</h2>
<p className="type-body">…</p> // di admin
```

---

## Checklist PR / review

- [ ] Judul halaman pakai `text-2xl font-semibold tracking-tight`
- [ ] Deskripsi / helper pakai `text-sm text-muted-foreground`
- [ ] Form, table, dialog konsisten `text-sm`
- [ ] Tidak ada `text-[Npx]` baru
- [ ] Admin tidak memakai `type-*`
- [ ] Member tidak memaksa `text-2xl` besar ala dashboard kecuali memang perlu
- [ ] Komponen baru ada di folder domain yang benar (`admin` / `member` / `auth` / `shared`), bukan root `components/`
- [ ] Admin list: toolbar + pagination di luar card; pakai token `dataTable*` dari `data-table.tsx`
- [ ] Empty state pakai `DataTableEmpty` (bukan teks polos)
- [ ] Scroll tabel / dialog panjang pakai `ScrollArea` (bukan `overflow-y-auto` ad-hoc)
- [ ] Aksi baris pakai `DataTableAction` (satu per tombol + `label`)
