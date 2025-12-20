import React from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MixinProps, splitProps } from "@/lib/mixin";
import { cn } from "@/lib/utils";

type LabelProps = React.ComponentProps<typeof Label>;
type ErrorProps = React.ComponentProps<"p">;

interface TextFieldProps
  extends
    Omit<React.ComponentProps<typeof Input>, "value" | "onChange">,
    MixinProps<"label", Omit<LabelProps, "children">>,
    MixinProps<"error", Omit<ErrorProps, "children">> {
  id: string;
  value: string;
  onChange: (value: string) => void;
  label: LabelProps["children"] | null;
  error: ErrorProps["children"] | null;
}

export const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(
  ({ id, value, onChange, label, error, ...mixProps }) => {
    const {
      label: labelProps,
      error: errorProps,
      rest,
    } = splitProps(mixProps, "label", "error");

    return (
      <div className="space-y-2">
        {label && (
          <Label {...labelProps} htmlFor={id}>
            {label}
          </Label>
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
    MixinProps<"error", Omit<ErrorProps, "children">> {
  id: string;
  value: string;
  onChange: (value: string) => void;
  label: LabelProps["children"] | null;
  error: ErrorProps["children"] | null;
}

export const TextAreaField = React.forwardRef<
  HTMLTextAreaElement,
  TextAreaFieldProps
>(({ id, value, onChange, label, error, ...mixProps }, ref) => {
  const {
    label: labelProps,
    error: errorProps,
    rest,
  } = splitProps(mixProps, "label", "error");

  return (
    <div className="space-y-2">
      {label && (
        <Label {...labelProps} htmlFor={id}>
          {label}
        </Label>
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
