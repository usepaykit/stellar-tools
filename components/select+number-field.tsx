"use client";

import * as React from "react";

import { CheckMark } from "@/components/icon";
import { NumberField } from "@/components/number-field";
import { Spinner } from "@/components/spinner";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { InputGroup } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ChevronsUpDown } from "lucide-react";

export interface SelectNumberFieldValue {
  amount: string;
  option: string;
}

export interface SelectNumberFieldProps {
  id: string;
  value: SelectNumberFieldValue;
  onChange: (value: SelectNumberFieldValue) => void;
  options: string[];
  isLoading?: boolean;
  label?: string;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  optionsDisabled?: boolean;
}

export const SelectNumberField = React.forwardRef<HTMLInputElement, SelectNumberFieldProps>(
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
      optionsDisabled,
    },
    ref
  ) => {
    const [open, setOpen] = React.useState(false);

    // Auto-reconcile partial values (e.g., "USDC" -> "USDC:ast_123")
    React.useEffect(() => {
      if (!value.option || options.length === 0) return;

      // 1. If the value is already a perfect match for an option, do nothing.
      if (options.includes(value.option)) return;

      // 2. If not, check if it's a "shorthand" (e.g., "USDC" matches "USDC:ast_123")
      // We only match if it's followed by the delimiter to avoid partial word matches
      const fullMatch = options.find((opt) => opt.startsWith(`${value.option}:`));

      if (fullMatch) {
        onChange({ ...value, option: fullMatch });
      }
    }, [options, value.option, onChange]);

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
                  <Spinner strokeColor="text-muted-foreground" size={25} />
                ) : (
                  <>
                    <span className="font-medium">
                      {value.option.includes(":") ? value.option.split(":")[0]! : (value.option ?? "Select")}
                    </span>
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
                    {options.map((option) => {
                      const hasDelimiter = option.includes(":");
                      const [displayValue, _] = hasDelimiter ? option.split(":") : [option, option];

                      return (
                        <CommandItem
                          key={option}
                          value={option}
                          onSelect={() => handleOptionSelect(option)}
                          disabled={optionsDisabled}
                        >
                          <CheckMark
                            className={cn("mr-2 h-4 w-4", value.option === option ? "opacity-100" : "opacity-0")}
                          />
                          {displayValue}
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          <NumberField
            id={id}
            ref={ref}
            value={value.amount}
            onChange={(value) =>
              handleAmountChange({ target: { value: value?.toString() } } as React.ChangeEvent<HTMLInputElement>)
            }
            disabled={disabled}
            placeholder={placeholder}
            className="no-autofill-bg flex-1 rounded-none border-0 bg-transparent px-3 py-1 text-sm shadow-none focus-visible:ring-0 dark:bg-transparent"
            aria-invalid={!!error}
            data-slot="input-group-control"
            allowDecimal
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

SelectNumberField.displayName = "SelectNumberField";
