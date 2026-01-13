import * as React from "react";

import { MixinProps, splitProps } from "@/lib/mixin";
import { cn } from "@/lib/utils";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Loader2 } from "lucide-react";

import { Label } from "./ui/label";

type LabelProps = React.ComponentProps<typeof Label>;
type ErrorProps = React.ComponentProps<"p">;
type HelpTextProps = React.ComponentProps<"p">;

type SelectTriggerProps = React.ComponentProps<typeof SelectPrimitive.SelectTrigger>;

interface SelectPickerProps
  extends
    Omit<React.ComponentProps<typeof SelectPrimitive.Select>, "value" | "onChange">,
    MixinProps<"trigger", Omit<SelectTriggerProps, "children">>,
    MixinProps<
      "triggerValue",
      Omit<React.ComponentProps<typeof SelectPrimitive.SelectValue>, "children">
    >,
    MixinProps<
      "item",
      Omit<React.ComponentProps<typeof SelectPrimitive.SelectItem>, "children" | "value">
    >,
    MixinProps<"label", Omit<LabelProps, "children">>,
    MixinProps<"error", Omit<ErrorProps, "children">>,
    MixinProps<"helpText", Omit<HelpTextProps, "children">> {
  id: string;
  value: string;
  onChange: (value: string) => void;
  label?: LabelProps["children"];
  error?: ErrorProps["children"];
  helpText?: HelpTextProps["children"];
  items: Array<{ value: string; label: string }>;
  isLoading?: boolean;
}

export const SelectPicker = ({
  id,
  value,
  onChange,
  items,
  label,
  error,
  helpText,
  isLoading = false,
  ...mixProps
}: SelectPickerProps) => {
  const {
    label: labelProps,
    error: errorProps,
    helpText: helpTextProps,
    trigger: triggerProps,
    triggerValue: triggerValueProps,
    rest,
  } = splitProps(mixProps, "label", "error", "helpText", "trigger", "triggerValue");

  return (
    <div className="space-y-2">
      {label && (
        <Label {...labelProps} htmlFor={id}>
          {label}
        </Label>
      )}

      {helpText && (
        <p {...helpTextProps} className={cn("text-sm", helpTextProps.className)}>
          {helpText}
        </p>
      )}

      <SelectPrimitive.Select {...rest} value={value} onValueChange={onChange}>
        <SelectPrimitive.SelectTrigger {...triggerProps}>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <SelectPrimitive.SelectValue {...triggerValueProps} />
          )}
        </SelectPrimitive.SelectTrigger>

        <SelectPrimitive.SelectContent>
          {items.map((item) => (
            <SelectPrimitive.SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectPrimitive.SelectItem>
          ))}
        </SelectPrimitive.SelectContent>
      </SelectPrimitive.Select>

      {error && (
        <p
          {...errorProps}
          role="alert"
          className={cn("text-destructive text-sm font-medium", errorProps.className)}
        >
          {error}
        </p>
      )}
    </div>
  );
};
