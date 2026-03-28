"use client";

import * as React from "react";

import { ColumnFiltersState } from "@tanstack/react-table";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function useSyncTableFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = React.useMemo(() => {
    const raw = searchParams.get("q");
    if (!raw) return [] as ColumnFiltersState;
    try {
      const decoded = JSON.parse(window.atob(raw));

      return decoded.map((f: any) => ({
        ...f,
        value:
          typeof f.value === "object" && f.value !== null
            ? Object.fromEntries(
                Object.entries(f.value).map(([k, v]) => [
                  k,
                  typeof v === "string" && /^\d{4}-\d{2}-\d{2}T/.test(v) ? new Date(v) : v,
                ])
              )
            : f.value,
      }));
    } catch (e) {
      return [] as ColumnFiltersState;
    }
  }, [searchParams]);

  const setFilters = React.useCallback(
    (updaterOrValue: ColumnFiltersState | ((old: ColumnFiltersState) => ColumnFiltersState)) => {
      const nextValue = typeof updaterOrValue === "function" ? updaterOrValue(filters) : updaterOrValue;

      const params = new URLSearchParams(searchParams.toString());
      if (nextValue.length > 0) {
        params.set("q", window.btoa(JSON.stringify(nextValue)));
      } else {
        params.delete("q");
      }

      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [filters, pathname, router, searchParams]
  );

  return [filters, setFilters] as const;
}
