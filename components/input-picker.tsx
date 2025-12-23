import React from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MixinProps, splitProps } from "@/lib/mixin";
import { cn } from "@/lib/utils";

type LabelProps = React.ComponentProps<typeof Label>;
type ErrorProps = React.ComponentProps<"p">;
type HelpTextProps = React.ComponentProps<"p">;

interface TextFieldProps
  extends
    Omit<React.ComponentProps<typeof Input>, "value" | "onChange">,
    MixinProps<"label", Omit<LabelProps, "children">>,
    MixinProps<"error", Omit<ErrorProps, "children">>,
    MixinProps<"helpText", Omit<HelpTextProps, "children">> {
  id: string;
  value: string;
  onChange: (value: string) => void;
  label: LabelProps["children"] | null;
  error: ErrorProps["children"] | null;
  helpText?: HelpTextProps["children"] | null;
}

export const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(
  ({ id, value, onChange, label, error, helpText, ...mixProps }) => {
    const {
      label: labelProps,
      error: errorProps,
      helpText: helpTextProps,
      rest,
    } = splitProps(mixProps, "label", "error", "helpText");

    return (
      <div className="space-y-2">
        {label && (
          <Label {...labelProps} htmlFor={id}>
            {label}
          </Label>
        )}

        {helpText && (
          <p
            {...helpTextProps}
            className={cn("text-sm", helpTextProps.className)}
          >
            {helpText}
          </p>
        )}

        <Input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          {...rest}
          className={cn("w-full", rest.className)}
        />

        {error && (
          <p
            {...errorProps}
            className={cn("text-destructive text-sm", errorProps.className)}
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);
TextField.displayName = "TextField";

interface TextAreaFieldProps
  extends
    Omit<React.ComponentProps<typeof Textarea>, "value" | "onChange">,
    MixinProps<"label", Omit<LabelProps, "children">>,
    MixinProps<"error", Omit<ErrorProps, "children">>,
    MixinProps<"helpText", Omit<HelpTextProps, "children">> {
  id: string;
  value: string;
  onChange: (value: string) => void;
  label: LabelProps["children"] | null;
  error: ErrorProps["children"] | null;
  helpText?: HelpTextProps["children"] | null;
}

export const TextAreaField = React.forwardRef<
  HTMLTextAreaElement,
  TextAreaFieldProps
>(({ id, value, onChange, label, error, helpText, ...mixProps }, ref) => {
  const {
    label: labelProps,
    error: errorProps,
    helpText: helpTextProps,
    rest,
  } = splitProps(mixProps, "label", "error", "helpText");

  return (
    <div className="space-y-2">
      {label && (
        <Label {...labelProps} htmlFor={id}>
          {label}
        </Label>
      )}

      {helpText && (
        <p
          {...helpTextProps}
          className={cn("text-sm", helpTextProps.className)}
        >
          {helpText}
        </p>
      )}

      <Textarea
        {...rest}
        id={id}
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn("w-full", rest.className)}
      />

      {error && (
        <p
          {...errorProps}
          className={cn("text-destructive text-sm", errorProps.className)}
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
});

TextAreaField.displayName = "TextAreaField";

interface NumberPickerProps
  extends
    Omit<React.ComponentProps<typeof Input>, "value" | "onChange" | "type">,
    MixinProps<"label", Omit<LabelProps, "children">>,
    MixinProps<"error", Omit<ErrorProps, "children">>,
    MixinProps<"helpText", Omit<HelpTextProps, "children">> {
  id: string;
  value: number | string | undefined;
  onChange: (value: number | undefined) => void;
  label?: React.ReactNode;
  error?: React.ReactNode;
  helpText?: React.ReactNode;
  allowDecimal?: boolean;
}

export const NumberPicker = React.forwardRef<
  HTMLInputElement,
  NumberPickerProps
>((props, ref) => {
  const {
    id,
    value,
    onChange,
    label,
    error,
    helpText,
    allowDecimal = false,
    ...mixProps
  } = props;

  const {
    label: labelProps,
    error: errorProps,
    helpText: helpTextProps,
    rest,
  } = splitProps(mixProps, "label", "error", "helpText");

  const [displayValue, setDisplayValue] = React.useState<string>(() =>
    value !== undefined ? String(value) : ""
  );

  React.useEffect(() => {
    if (value !== undefined) {
      setDisplayValue(String(value));
    } else if (value === undefined && displayValue !== "") {
      setDisplayValue("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;

    if (inputValue === "") {
      setDisplayValue("");
      onChange(undefined);
      return;
    }

    // Regex: Allow positive decimal numbers, including trailing decimal point
    const regex = allowDecimal ? /^\d*\.?\d*$/ : /^\d*$/;

    if (regex.test(inputValue)) {
      setDisplayValue(inputValue);

      const parsed = parseFloat(inputValue);
      if (!isNaN(parsed)) {
        onChange(parsed);
      } else if (inputValue === "." || inputValue.endsWith(".")) {
        onChange(undefined);
      }
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <Label
          {...labelProps}
          htmlFor={id}
          className={cn(
            "text-sm leading-none font-medium",
            labelProps.className
          )}
        >
          {label}
        </Label>
      )}

      {helpText && (
        <p
          {...helpTextProps}
          className={cn("text-sm", helpTextProps.className)}
        >
          {helpText}
        </p>
      )}

      <Input
        {...rest}
        id={id}
        ref={ref}
        type="text"
        inputMode={allowDecimal ? "decimal" : "numeric"}
        value={displayValue}
        onChange={handleAmountChange}
        className={cn(
          "w-full [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
          rest.className
        )}
      />

      {error && (
        <p
          {...errorProps}
          role="alert"
          className={cn(
            "text-destructive text-sm font-medium",
            errorProps.className
          )}
        >
          {error}
        </p>
      )}
    </div>
  );
});

NumberPicker.displayName = "NumberPicker";
