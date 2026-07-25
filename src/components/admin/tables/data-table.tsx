"use client";

import * as React from "react";
import type { Table } from "@tanstack/react-table";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  SearchIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TableCell,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Empty } from "@/components/ui/empty";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export const dataTableHeadClass =
  "h-11 px-4 text-sm font-medium text-foreground";
export const dataTableHeaderClass = "sticky top-0 z-10 bg-muted";
export const dataTableHeaderRowClass =
  "border-border/40 hover:bg-transparent";
export const dataTableCellClass = "px-4 py-3 text-sm";
export const dataTableRowClass = "border-border/40 hover:bg-muted/30";
export const dataTableBodyClass = "bg-background";
/** Max height for table scroll area inside DataTableCard. */
export const dataTableScrollClass = "max-h-[min(60vh,36rem)] w-full";

export function DataTableSearch({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative w-full max-w-sm", className)}>
      <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9 bg-background pl-9"
      />
    </div>
  );
}

export function DataTableCard({
  className,
  scrollClassName,
  children,
}: {
  className?: string;
  /** Override default scroll max-height; pass `false` to disable ScrollArea. */
  scrollClassName?: string | false;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border bg-card",
        className,
      )}
    >
      {scrollClassName === false ? (
        children
      ) : (
        <ScrollArea className={cn(dataTableScrollClass, scrollClassName)}>
          {children}
        </ScrollArea>
      )}
    </div>
  );
}

/** Empty state row inside DataTableCard — pakai `Empty` dari ui/empty. */
export function DataTableEmpty({
  colSpan,
  title,
  description,
  action,
}: {
  colSpan: number;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell colSpan={colSpan} className={cn(dataTableCellClass, "p-0")}>
        <Empty
          title={title}
          description={description}
          action={action}
          className="py-10"
        />
      </TableCell>
    </TableRow>
  );
}

export function DataTablePagination<TData>({ table }: { table: Table<TData> }) {
  const { pageIndex, pageSize } = table.getState().pagination;
  const pageCount = Math.max(table.getPageCount(), 1);
  const total = table.getFilteredRowModel().rows.length;
  const selected = table.getFilteredSelectedRowModel().rows.length;

  return (
    <div className="flex items-center justify-between gap-4 px-1">
      <div className="hidden flex-1 text-sm text-muted-foreground lg:flex">
        {selected} of {total} row(s) selected.
      </div>
      <div className="flex w-full items-center gap-8 lg:w-fit">
        <div className="hidden items-center gap-2 lg:flex">
          <span className="text-sm font-medium whitespace-nowrap">
            Rows per page
          </span>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => table.setPageSize(Number(value))}
          >
            <SelectTrigger size="sm" className="h-8 w-[4.5rem]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 30, 50].map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex w-fit items-center justify-center text-sm font-medium">
          Page {pageIndex + 1} of {pageCount}
        </div>
        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <Button
            variant="outline"
            size="icon"
            className="hidden size-8 lg:flex"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            aria-label="First page"
          >
            <ChevronsLeftIcon />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            aria-label="Previous page"
          >
            <ChevronLeftIcon />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            aria-label="Next page"
          >
            <ChevronRightIcon />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="hidden size-8 lg:flex"
            onClick={() => table.setPageIndex(pageCount - 1)}
            disabled={!table.getCanNextPage()}
            aria-label="Last page"
          >
            <ChevronsRightIcon />
          </Button>
        </div>
      </div>
    </div>
  );
}

export const DataTableActionButton = React.forwardRef<
  HTMLButtonElement,
  {
    label: string;
    children: React.ReactNode;
  } & React.ComponentProps<typeof Button>
>(function DataTableActionButton({ label, children, className, ...props }, ref) {
  return (
    <Button
      ref={ref}
      type="button"
      variant="outline"
      size="icon-sm"
      className={cn("size-8", className)}
      aria-label={label}
      {...props}
    >
      {children}
    </Button>
  );
});

/** Icon action with tooltip — use for action groups (View / Edit / Hapus). */
export function DataTableAction({
  label,
  children,
  ...props
}: {
  label: string;
  children: React.ReactNode;
} & React.ComponentProps<typeof Button>) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <DataTableActionButton label={label} {...props}>
          {children}
        </DataTableActionButton>
      </TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  );
}

const tableDateTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
  timeZone: "Asia/Jakarta",
});

export function formatTableDateTime(value: string | Date) {
  return tableDateTimeFormatter.format(new Date(value));
}
