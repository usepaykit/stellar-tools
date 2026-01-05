import React from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { MixinProps, splitProps } from "@/lib/mixin";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import moment from "moment";

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





export interface TimePickerProps
  extends
    MixinProps<"label", Omit<LabelProps, "children">>,
    MixinProps<"error", Omit<ErrorProps, "children">>,
    MixinProps<"helpText", Omit<HelpTextProps, "children">>,
    MixinProps<
      "input",
      Omit<React.ComponentProps<typeof Input>, "value" | "onChange" | "type">
    > {
  id: string;
  value: string | undefined;
  onChange: (time: string | undefined) => void;
  label?: LabelProps["children"] | null;
  error?: ErrorProps["children"] | null;
  helpText?: HelpTextProps["children"] | null;
  placeholder?: string;
  disabled?: boolean;
  showSeconds?: boolean;
}

export const TimePicker = React.forwardRef<HTMLInputElement, TimePickerProps>(
  (
    {
      id,
      value,
      onChange,
      label,
      error,
      helpText,
      placeholder = "00:00",
      disabled = false,
      showSeconds = false,
      ...mixProps
    },
    ref
  ) => {
    const {
      label: labelProps,
      error: errorProps,
      helpText: helpTextProps,
      input: inputProps,
    } = splitProps(mixProps, "label", "error", "helpText", "input");

    return (
      <div className="space-y-2">
        {label && (
          <Label
            {...labelProps}
            htmlFor={id}
            className={cn("text-sm font-medium", labelProps.className)}
          >
            {label}
          </Label>
        )}

        {helpText && (
          <p
            {...helpTextProps}
            className={cn(
              "text-muted-foreground text-sm",
              helpTextProps.className
            )}
          >
            {helpText}
          </p>
        )}

        <Input
          {...inputProps}
          ref={ref}
          id={id}
          type="time"
          step={showSeconds ? "1" : undefined}
          value={value || ""}
          onChange={(e) => onChange(e.target.value || undefined)}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "bg-background w-full appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none",
            inputProps.className
          )}
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

TimePicker.displayName = "TimePicker";

export interface DateTimePickerProps
  extends
    MixinProps<"label", Omit<LabelProps, "children">>,
    MixinProps<"error", Omit<ErrorProps, "children">>,
    MixinProps<"helpText", Omit<HelpTextProps, "children">>,
    MixinProps<
      "calendar",
      Omit<React.ComponentProps<typeof Calendar>, "selected" | "onSelect">
    > {
  id: string;
  value: { date: Date | undefined; time: string | undefined };
  onChange: (value: {
    date: Date | undefined;
    time: string | undefined;
  }) => void;
  label?: LabelProps["children"] | null;
  error?: ErrorProps["children"] | null;
  helpText?: HelpTextProps["children"] | null;
  datePlaceholder?: string;
  timePlaceholder?: string;
  disabled?: boolean;
  dateFormat?: string;
  showSeconds?: boolean;
  layout?: "horizontal" | "vertical";
}

export const DateTimePicker = React.forwardRef<
  HTMLDivElement,
  DateTimePickerProps
>(
  (
    {
      id,
      value,
      onChange,
      label,
      error,
      helpText,
      datePlaceholder = "Select date",
      timePlaceholder = "00:00",
      disabled = false,
      dateFormat = "PPP",
      showSeconds = false,
      layout = "horizontal",
      ...mixProps
    },
    ref
  ) => {
    const {
      label: labelProps,
      error: errorProps,
      helpText: helpTextProps,
      calendar: calendarProps,
    } = splitProps(mixProps, "label", "error", "helpText", "calendar");

    const [open, setOpen] = React.useState(false);

    return (
      <div ref={ref} className="space-y-2">
        {label && (
          <Label
            {...labelProps}
            htmlFor={`${id}-date`}
            className={cn("text-sm font-medium", labelProps.className)}
          >
            {label}
          </Label>
        )}

        {helpText && (
          <p
            {...helpTextProps}
            className={cn(
              "text-muted-foreground text-sm",
              helpTextProps.className
            )}
          >
            {helpText}
          </p>
        )}

        <div
          className={cn(
            "gap-4",
            layout === "horizontal" ? "flex" : "flex flex-col"
          )}
        >
          <div className="flex-1">
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  id={`${id}-date`}
                  variant="outline"
                  disabled={disabled}
                  data-empty={!value.date}
                  className={cn(
                    "data-[empty=true]:text-muted-foreground w-full justify-start text-left font-normal"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {value.date ? (
                    moment(value.date).format(dateFormat)
                  ) : (
                    <span>{datePlaceholder}</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  {...calendarProps}
                  mode="single"
                  selected={value.date}
                  onSelect={(date) => {
                    onChange({ ...value, date });
                    setOpen(false);
                  }}
                  disabled={disabled}
                  autoFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className={layout === "horizontal" ? "w-32" : "flex-1"}>
            <Input
              id={`${id}-time`}
              type="time"
              step={showSeconds ? "1" : undefined}
              value={value.time || ""}
              onChange={(e) =>
                onChange({ ...value, time: e.target.value || undefined })
              }
              placeholder={timePlaceholder}
              disabled={disabled}
              className={cn(
                "bg-background w-full appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
              )}
            />
          </div>
        </div>

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

DateTimePicker.displayName = "DateTimePicker";
