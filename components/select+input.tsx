"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { InputGroup, InputGroupInput } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ChevronsUpDown, Loader2 } from "lucide-react";

import { CheckMark } from "./icon";

export interface SelectInputValue {
  amount: string;
  option: string;
}

export interface SelectInputProps {
  id: string;
  value: SelectInputValue;
  onChange: (value: SelectInputValue) => void;
  options: string[];
  isLoading?: boolean;
  label?: string;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export const SelectInput = React.forwardRef<HTMLInputElement, SelectInputProps>(
  (
    {
      id,
      value,
      onChange,
      options = [],
      isLoading = false,
      label,
      error,
      disabled,
      placeholder = "Select option...",
      className,
    },
    ref
  ) => {
    const [open, setOpen] = React.useState(false);

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;

      // Regex: Allow empty, or positive decimal numbers (e.g., 1, 1.5, 0.5)
      if (inputValue === "" || /^\d*\.?\d*$/.test(inputValue)) {
        onChange({ ...value, amount: inputValue });
      }
    };

    const handleOptionSelect = (option: string) => {
      onChange({ ...value, option });
      setOpen(false);
    };

    return (
      <div className={cn("space-y-2", className)}>
        {label && (
          <Label className="text-sm font-medium" htmlFor={id}>
            {label}
          </Label>
        )}

        <InputGroup
          className={cn(
            "border-input relative mt-2 flex h-10 w-full rounded-md border bg-transparent text-sm",
            "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
            error && "border-destructive"
          )}
        >
          <Popover open={open} onOpenChange={setOpen} modal={false}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                role="combobox"
                aria-expanded={open}
                disabled={disabled || isLoading || options.length === 0}
                className="border-input hover:bg-accent hover:text-accent-foreground flex h-full min-w-[100px] justify-start gap-2 rounded-r-none border-r bg-transparent px-3"
              >
                {isLoading ? (
                  <Loader2 className="text-muted-foreground h-4 w-4 shrink-0 animate-spin" />
                ) : (
                  <>
                    <span className="font-medium">{value.option || "Select"}</span>
                    <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
                  </>
                )}
              </Button>
            </PopoverTrigger>

            <PopoverContent className="w-[200px] p-0" align="start" onWheel={(e) => e.stopPropagation()}>
              <Command>
                <CommandInput placeholder="Search option..." />
                <CommandList>
                  <CommandEmpty>No option found.</CommandEmpty>
                  <CommandGroup>
                    {options.map((option) => (
                      <CommandItem key={option} value={option} onSelect={() => handleOptionSelect(option)}>
                        <CheckMark
                          className={cn("mr-2 h-4 w-4", value.option === option ? "opacity-100" : "opacity-0")}
                        />
                        {option}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          <InputGroupInput
            id={id}
            ref={ref}
            type="text"
            inputMode="decimal"
            placeholder={placeholder}
            value={value.amount}
            onChange={handleAmountChange}
            disabled={disabled}
            className="no-autofill-bg flex-1 border-0 bg-transparent px-3 py-1 text-sm shadow-none focus-visible:ring-0"
            aria-invalid={!!error}
          />
        </InputGroup>

        {error && (
          <p className="text-destructive text-sm font-medium" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

SelectInput.displayName = "SelectInput";
