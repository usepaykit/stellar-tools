"use client";

import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputGroup } from "@/components/ui/input-group";
import { MixinProps, splitProps } from "@/lib/mixin";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface TagInputPickerProps
  extends
    MixinProps<
      "input",
      Omit<React.ComponentProps<typeof Input>, "value" | "onChange">
    >,
    MixinProps<"tag", Omit<React.ComponentProps<typeof Badge>, "children">> {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
}

export const TagInputPicker = React.forwardRef<
  HTMLInputElement,
  TagInputPickerProps
>(
  (
    {
      className,
      value = [],
      onChange,
      placeholder,
      ...props
    }: TagInputPickerProps,
    ref
  ) => {
    const [pendingData, setPendingData] = React.useState("");

    const { input, tag, rest } = splitProps(props, "input", "tag");

    const addPendingData = () => {
      if (pendingData) {
        const newData = new Set([...value, pendingData.trim()]);
        onChange(Array.from(newData));
        setPendingData("");
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        addPendingData();
      } else if (e.key === "Backspace" && !pendingData && value.length > 0) {
        e.preventDefault();
        const newValue = [...value];
        newValue.pop();
        onChange(newValue);
      } else if (e.key === ",") {
        e.preventDefault(); // Treat comma as a delimiter
        addPendingData();
      }
    };

    const removeTag = (tagToRemove: string) => {
      onChange(value.filter((t) => t !== tagToRemove));
    };

    return (
      <InputGroup
        className={cn("h-auto min-h-10 flex-wrap gap-2 p-2", className)}
        {...rest}
      >
        {value.map((t) => (
          <Badge
            key={t}
            variant="secondary"
            className={cn("gap-1 pr-1", tag.className)}
            {...tag}
          >
            {t}
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 p-0 hover:bg-transparent"
              onClick={() => removeTag(t)}
            >
              <X className="text-muted-foreground hover:text-foreground h-3 w-3" />
            </Button>
          </Badge>
        ))}

        <Input
          ref={ref}
          data-slot="input-group-control"
          className={cn(
            "h-7 min-w-[80px] flex-1 border-0 bg-transparent px-1 shadow-none focus-visible:ring-0",
            input.className
          )}
          value={pendingData}
          onChange={(e) => setPendingData(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={addPendingData} // Optional: Add tag when user clicks away
          placeholder={value.length === 0 ? placeholder : ""}
          {...input}
        />
      </InputGroup>
    );
  }
);

TagInputPicker.displayName = "TagInputPicker";
