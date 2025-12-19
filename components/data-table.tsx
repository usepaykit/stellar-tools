"use client";

import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MixinProps, splitProps } from "@/lib/mixin";
import { cn } from "@/lib/utils";
import {
  ColumnDef,
  RowSelectionState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import * as React from "react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export interface TableAction<TData> {
  label: string;
  onClick: (row: TData) => void;
  variant?: "default" | "destructive";
}

interface DataTableProps<TData, TValue>
  extends React.ComponentProps<typeof Table>,
    MixinProps<"row", React.ComponentProps<typeof TableRow>>,
    MixinProps<"checkbox", React.ComponentProps<typeof Checkbox>>,
    MixinProps<"body", React.ComponentProps<typeof TableBody>>,
    MixinProps<"head", React.ComponentProps<typeof TableHead>>,
    MixinProps<"cell", React.ComponentProps<typeof TableCell>> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  onRowClick?: (row: TData) => void;
  enableBulkSelect?: boolean;
  actions?: TableAction<TData>[];
}

export function DataTable<TData, TValue>({
  columns,
  data,
  onRowClick,
  enableBulkSelect = false,
  actions,
  ...mixProps
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});

  const { row, checkbox, body, head, cell, ...rest } = splitProps(
    mixProps,
    "row",
    "checkbox",
    "body",
    "head",
    "cell"
  );

  const tableColumns = React.useMemo(() => {
    let cols = columns;

    if (enableBulkSelect) {
      const selectColumn: ColumnDef<TData, TValue> = {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            {...checkbox}
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(checked) =>
              table.toggleAllPageRowsSelected(!!checked)
            }
            aria-label="Select all"
            className={cn(checkbox.className, "translate-y-[2px]")}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            {...checkbox}
            checked={row.getIsSelected()}
            onCheckedChange={(checked) => {
              row.toggleSelected(!!checked);
            }}
            onClick={(e) => {
              e.stopPropagation();
              e.currentTarget.focus();
            }}
            aria-label="Select row"
            className={cn("translate-y-[2px]", checkbox.className)}
          />
        ),
        enableSorting: false,
        enableHiding: false,
        size: 40,
      };
      cols = [selectColumn, ...cols];
    }

    if (actions && actions.length > 0) {
      const actionsColumn: ColumnDef<TData, TValue> = {
        id: "actions",
        header: () => <div />,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="size-8"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <MoreHorizontal className="size-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {actions.map((action, index) => (
                  <DropdownMenuItem
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      action.onClick(row.original);
                    }}
                    className={
                      action.variant === "destructive"
                        ? "text-destructive focus:text-destructive"
                        : undefined
                    }
                  >
                    {action.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
        enableSorting: false,
        enableHiding: false,
        size: 50,
      };
      cols = [...cols, actionsColumn];
    }

    return cols;
  }, [columns, enableBulkSelect, actions]);

  const reactTable = useReactTable({
    data,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      rowSelection,
    },
  });

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table {...rest}>
          <TableHeader>
            {reactTable.getHeaderGroups().map((headerGroup) => (
              <TableRow {...row} key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      style={{
                        width:
                          header.getSize() !== 150
                            ? header.getSize()
                            : undefined,
                      }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody {...body}>
            {reactTable.getRowModel().rows?.length ? (
              reactTable.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={cn(onRowClick && "cursor-pointer")}
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell {...cell} key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow {...row}>
                <TableCell
                  {...cell}
                  colSpan={tableColumns.length}
                  className={cn("h-24 text-center", cell.className)}
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {enableBulkSelect && (
            <>
              {reactTable.getFilteredSelectedRowModel().rows.length} of{" "}
              {reactTable.getFilteredRowModel().rows.length} row(s) selected.
            </>
          )}
        </div>
        <div className="space-x-2">
          <button
            className="px-3 py-2 border rounded text-sm disabled:opacity-50"
            onClick={() => reactTable.previousPage()}
            disabled={!reactTable.getCanPreviousPage()}
          >
            Previous
          </button>
          <button
            className="px-3 py-2 border rounded text-sm disabled:opacity-50"
            onClick={() => reactTable.nextPage()}
            disabled={!reactTable.getCanNextPage()}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
