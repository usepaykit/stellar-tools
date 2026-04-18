"use client";

import { DataTable } from "@/components/data-table";
import { ColumnDef } from "@tanstack/react-table";

interface AmbiguityGuardProps<T> {
  title: string;
  description: string;
  items: T[];
  isLoading: boolean;
  columns: ColumnDef<T>[];
  resolveTo: (item: T) => string;
  searchParams: string;
  pushRoute: (url: string) => void;
}

export function AmbiguityGuard<T>({
  title,
  description,
  items,
  isLoading,
  columns,
  resolveTo,
  searchParams,
  pushRoute,
}: AmbiguityGuardProps<T>) {
  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="border-primary h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 p-12">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>

      <DataTable
        className="border-x-0"
        columns={columns}
        data={items}
        onRowClick={(item) => {
          const url = resolveTo(item);
          const params = searchParams ? `?${searchParams}` : "";
          pushRoute(`${url}${params}`);
        }}
      />
    </div>
  );
}
