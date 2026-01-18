"use client";

import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { MixinProps, splitProps } from "@/lib/mixin";
import { cn } from "@/lib/utils";
import { Check, Plus, Search, X } from "lucide-react";

import { Label } from "./ui/label";

type ErrorProps = React.ComponentProps<"p">;
type LabelProps = React.ComponentProps<"label">;

interface PickerItem {
  id: string;
  title: string;
  subtitle?: string;
  searchValue: string;
}

interface ResourcePickerProps<T> extends MixinProps<"error", Omit<ErrorProps, "children">> {
  items: T[];
  value: string[];
  onChange: (value: string[]) => void;
  renderItem: (item: T) => PickerItem;
  placeholder?: string;
  multiple?: boolean;
  isLoading?: boolean;
  onAddNew?: () => void;
  className?: string;
  maxHeight?: string;
  skeletonRowCount?: number;
  error?: ErrorProps["children"];
  label?: LabelProps["children"];
}

// --- Internal Components ---

const SelectionRibbon = ({ items, onRemove, onClear }: any) => (
  <div className="animate-in fade-in slide-in-from-top-1 flex flex-wrap items-center gap-1.5 duration-200">
    {items.map((item: PickerItem) => (
      <Badge
        key={item.id}
        variant="secondary"
        className="bg-secondary/50 border-secondary-foreground/10 hover:bg-secondary h-6 gap-1 pr-1 pl-2 transition-colors"
      >
        <span className="max-w-[150px] truncate text-[11px] font-semibold tracking-tight">{item.title}</span>
        <button type="button" onClick={() => onRemove(item.id)} className="hover:bg-foreground/10 rounded-full p-0.5">
          <X className="size-3 cursor-pointer" />
        </button>
      </Badge>
    ))}
    <button
      type="button"
      onClick={onClear}
      className="text-muted-foreground hover:text-primary ml-1 text-[10px] font-bold uppercase transition-colors"
    >
      Clear All
    </button>
  </div>
);

const PickerRow = React.memo(({ item, isSelected, onClick }: any) => (
  <div
    onClick={() => onClick(item.id)}
    className={cn(
      "group hover:bg-accent/50 flex cursor-pointer items-center gap-3 px-4 py-2.5 transition-colors",
      isSelected && "bg-primary/5"
    )}
  >
    <div className="flex min-w-0 flex-1 flex-col">
      <span
        className={cn(
          "truncate text-sm font-semibold tracking-tight transition-colors",
          isSelected ? "text-primary" : "text-foreground/90 group-hover:text-foreground"
        )}
      >
        {item.title}
      </span>
      {item.subtitle && (
        <span className="text-muted-foreground/60 group-hover:text-muted-foreground/80 truncate text-[11px] font-medium">
          {item.subtitle}
        </span>
      )}
    </div>
    <div
      className={cn(
        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all duration-200",
        isSelected
          ? "border-primary bg-primary text-primary-foreground scale-105 shadow-sm"
          : "border-muted-foreground/20 opacity-40 group-hover:opacity-100"
      )}
    >
      {isSelected && <Check className="h-3 w-3 stroke-[3.5]" />}
    </div>
  </div>
));
PickerRow.displayName = "PickerRow";

// --- Main Component ---

export function ResourcePicker<T>({
  items,
  value,
  onChange,
  renderItem,
  placeholder = "Search resources...",
  multiple = false,
  isLoading = false,
  onAddNew,
  className,
  maxHeight = "300px",
  skeletonRowCount = 5,
  error,
  label,
  ...mixProps
}: ResourcePickerProps<T>) {
  const [query, setQuery] = React.useState("");
  const [isFocused, setIsFocused] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { error: errorProps, label: labelProps } = splitProps(mixProps, "error", "label");

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setIsFocused(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const mappedItems = React.useMemo(() => items.map(renderItem), [items, renderItem]);

  const filteredItems = React.useMemo(() => {
    const q = query.toLowerCase().trim();
    return q ? mappedItems.filter((i) => i.searchValue.toLowerCase().includes(q)) : mappedItems;
  }, [mappedItems, query]);

  const selectedItems = React.useMemo(() => mappedItems.filter((i) => value.includes(i.id)), [mappedItems, value]);

  const handleSelect = (id: string) => {
    if (multiple) {
      onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
    } else {
      onChange([id]);
      setQuery("");
      setIsFocused(false);
    }
  };

  const showResults = isFocused || query.length > 0;

  return (
    <div ref={containerRef} className={cn("relative w-full space-y-3", className)}>
      {label && <Label {...labelProps}>{label}</Label>}

      {selectedItems.length > 0 && (
        <SelectionRibbon
          items={selectedItems}
          onRemove={(id: string) => onChange(value.filter((v) => v !== id))}
          onClear={() => onChange([])}
        />
      )}

      <InputGroup
        className={cn("h-10 bg-transparent transition-all", isFocused && "ring-primary/20 border-primary ring-2")}
      >
        <InputGroupAddon>
          <Search className={cn("size-4 transition-colors", isFocused ? "text-primary" : "text-muted-foreground")} />
        </InputGroupAddon>
        <InputGroupInput
          value={query}
          onFocus={() => setIsFocused(true)}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          aria-invalid={!!error}
        />
        {!isFocused && value.length > 0 && (
          <InputGroupAddon align="inline-end" className="animate-in fade-in pointer-events-none scale-95">
            <Badge variant="default" className="h-5 px-1.5 text-[10px] font-black uppercase">
              {value.length} {multiple ? "Selected" : "Picked"}
            </Badge>
          </InputGroupAddon>
        )}
      </InputGroup>

      {showResults && (
        <div className="animate-in fade-in slide-in-from-top-2 absolute z-50 w-full pt-1 duration-200">
          <div className="bg-card flex flex-col overflow-hidden rounded-xl border shadow-xl ring-1 ring-black/5">
            <ScrollArea style={{ maxHeight }} className="bg-background">
              {isLoading ? (
                <div className="divide-border/40 divide-y">
                  {Array.from({ length: skeletonRowCount }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-4 w-2/3" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                      <Skeleton className="size-5 rounded-full" />
                    </div>
                  ))}
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="space-y-2 py-10 text-center">
                  <p className="text-muted-foreground text-sm">No matches for &quot;{query}&quot;</p>
                  {onAddNew && (
                    <Button variant="link" size="sm" onClick={onAddNew} className="h-auto gap-1 p-0">
                      <Plus className="size-3" /> Create new
                    </Button>
                  )}
                </div>
              ) : (
                <div className="divide-border/40 divide-y">
                  {filteredItems.map((item) => (
                    <PickerRow
                      key={item.id}
                      item={item}
                      multiple={multiple}
                      isSelected={value.includes(item.id)}
                      onClick={handleSelect}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
            <div className="bg-muted/5 text-muted-foreground/40 flex items-center justify-between border-t px-4 py-2 text-[10px] font-bold tracking-widest uppercase">
              <span>{filteredItems.length} Available</span>
              {multiple && <span>{value.length} Selected</span>}
            </div>
          </div>
        </div>
      )}

      {error && (
        <p {...errorProps} className={cn("text-destructive -mt-1 text-sm", errorProps.className)}>
          {error}
        </p>
      )}
    </div>
  );
}
