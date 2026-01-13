"use client";

import * as React from "react";

import { DataTable } from "@/components/data-table";
import { TagInputPicker } from "@/components/tag-input-picker";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { MixinProps, splitProps } from "@/lib/mixin";
import { cn } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";

export interface EntityPickerProps<T>
  extends
    MixinProps<"label", React.ComponentProps<typeof Label>>,
    MixinProps<"table", Omit<React.ComponentProps<typeof DataTable>, "columns" | "data">>,
    MixinProps<
      "tagInput",
      Omit<React.ComponentProps<typeof TagInputPicker>, "id" | "value" | "onChange">
    > {
  id: string;
  value: string[];
  onChange: (value: string[]) => void;
  data: T[];
  getItemId: (item: T) => string;
  getTagLabel: (item: T) => string;
  columns: ColumnDef<T, any>[];
  isLoading?: boolean;
  searchKeys?: (keyof T)[];
  label?: React.ReactNode;
  error?: React.ReactNode;
  emptyMessage?: string;
  multiple?: boolean;
}

export function EntityPicker<T extends Record<string, any>>(props: EntityPickerProps<T>) {
  const {
    id,
    value = [],
    onChange,
    data,
    getItemId,
    getTagLabel,
    columns,
    isLoading,
    searchKeys = [],
    label,
    error,
    multiple = false,
    ...restProps
  } = props;

  const [search, setSearch] = React.useState("");

  const { table: tp, tagInput: tip } = splitProps(restProps, "table", "tagInput");

  const filteredData = React.useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter((item) =>
      searchKeys.some((k) =>
        String(item[k] ?? "")
          .toLowerCase()
          .includes(q)
      )
    );
  }, [data, search, searchKeys]);

  const tagValues = React.useMemo(
    () =>
      value
        .map((id) => data.find((d) => getItemId(d) === id))
        .filter(Boolean)
        .map((item) => getTagLabel(item!)),
    [value, data, getItemId, getTagLabel]
  );

  const handleRowClick = React.useCallback(
    (row: T) => {
      const id = getItemId(row);
      if (multiple) {
        onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
      } else {
        onChange([id]);
      }
      setSearch("");
    },
    [multiple, value, onChange, getItemId, setSearch]
  );

  const pickerCols = React.useMemo(
    () => [
      {
        id: "select",
        size: 40,
        cell: ({ row }: any) => {
          const isSelected = value.includes(getItemId(row.original));

          return (
            <div className="flex justify-center">
              <Checkbox checked={isSelected} onCheckedChange={() => handleRowClick(row.original)} />
            </div>
          );
        },
      },
      ...columns,
    ],
    [columns, value, getItemId, handleRowClick]
  );

  return (
    <div className="flex flex-col gap-3">
      <TagInputPicker
        {...tip}
        id={id}
        label={label}
        error={error}
        value={tagValues}
        inputValue={search}
        inputOnChange={setSearch}
        onChange={(newTags) => {
          const newIds = newTags
            .map((t) => data.find((d) => getTagLabel(d) === t))
            .filter(Boolean)
            .map((d) => getItemId(d!));
          // Enforce single-select if multiple is false
          onChange(multiple ? newIds : newIds.slice(-1));
        }}
      />

      <DataTable
        {...tp}
        data={filteredData}
        columns={pickerCols}
        isLoading={isLoading}
        onRowClick={handleRowClick}
        // Icon-only pagination: targets buttons inside DataTable's footer wrapper
        className={cn(
          "rounded-md border [&_button]:relative [&_button]:h-8 [&_button]:w-8 [&_button]:p-0 [&_button]:text-[0px]",
          "[&_button:first-of-type]:after:content-['←'] [&_button:last-of-type]:after:content-['→']",
          "[&_button:after]:text-foreground [&_button:after]:absolute [&_button:after]:inset-0 [&_button:after]:flex [&_button:after]:items-center [&_button:after]:justify-center [&_button:after]:text-sm",
          tp.className
        )}
      />
    </div>
  );
}
