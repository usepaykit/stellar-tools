import * as React from "react";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { MixinProps, splitProps } from "@/lib/mixin";
import { cn } from "@/lib/utils";

import { Label } from "./ui/label";

type LabelProps = React.ComponentProps<typeof Label>;
type ErrorProps = React.ComponentProps<"p">;
type HelpTextProps = React.ComponentProps<"p">;

interface RadioGroupPickerProps
  extends
    Omit<React.ComponentProps<typeof RadioGroup>, "value" | "onChange">,
    MixinProps<
      "item",
      Omit<React.ComponentProps<typeof RadioGroupItem>, "children" | "value" | "itemRef" | "ref" | "type">
    >,
    MixinProps<"label", Omit<LabelProps, "children">>,
    MixinProps<"error", Omit<ErrorProps, "children">>,
    MixinProps<"helpText", Omit<HelpTextProps, "children">> {
  id: string;
  value: string;
  onChange: (value: string) => void;
  items: Array<{ value: string; label: string }>;
  label?: LabelProps["children"];
  error?: ErrorProps["children"];
  helpText?: HelpTextProps["children"];
  itemLayout?: "horizontal" | "vertical";
}
export const RadioGroupPicker = ({
  id,
  value,
  onChange,
  items,
  label,
  error,
  helpText,
  itemLayout = "horizontal",
  ...mixProps
}: RadioGroupPickerProps) => {
  const {
    label: labelProps,
    error: errorProps,
    helpText: helpTextProps,
    item: itemProps,
    rest,
  } = splitProps(mixProps, "label", "error", "helpText", "item");

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

      <RadioGroup {...rest} value={value} onValueChange={onChange}>
        <div className={cn("flex flex-col gap-2", itemLayout === "horizontal" ? "flex-row" : "flex-col")}>
          {items.map((item) => (
            <div key={item.value} className="flex items-center space-x-2">
              <RadioGroupItem {...itemProps} id={item.value} type="button" ref={undefined} value={item.value} />
              <Label htmlFor={item.value} className="font-normal">
                {item.label}
              </Label>
            </div>
          ))}
        </div>
      </RadioGroup>

      {error && (
        <p {...errorProps} role="alert" className={cn("text-destructive text-sm font-medium", errorProps.className)}>
          {error}
        </p>
      )}
    </div>
  );
};
