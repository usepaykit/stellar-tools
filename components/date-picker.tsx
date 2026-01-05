import * as React from "react";
import { MixinProps, splitProps } from "@/lib/mixin";
import { Label } from "./ui/label";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { Calendar } from "./ui/calendar";
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import moment from "moment";
import { Input } from "./ui/input";

type LabelProps = React.ComponentProps<typeof Label>;
type ErrorProps = React.ComponentProps<"p">;
type HelpTextProps = React.ComponentProps<"p">;

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
                  onSelect={(date: Date | undefined) => {
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


export interface DatePickerProps
  extends
    MixinProps<"label", Omit<LabelProps, "children">>,
    MixinProps<"error", Omit<ErrorProps, "children">>,
    MixinProps<"helpText", Omit<HelpTextProps, "children">>,
    MixinProps<"button", Omit<React.ComponentProps<typeof Button>, "onClick">>,
    MixinProps<
      "calendar",
      Omit<React.ComponentProps<typeof Calendar>, "selected" | "onSelect">
    > {
  id: string;
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  label?: LabelProps["children"] | null;
  error?: ErrorProps["children"] | null;
  helpText?: HelpTextProps["children"] | null;
  placeholder?: string;
  disabled?: boolean;
  dateFormat?: string;
}

export const DatePicker = React.forwardRef<HTMLButtonElement, DatePickerProps>(
  (
    {
      id,
      value,
      onChange,
      label,
      error,
      helpText,
      placeholder = "Select date",
      disabled = false,
      dateFormat = "PPP",
      ...mixProps
    },
    ref
  ) => {
    const {
      label: labelProps,
      error: errorProps,
      helpText: helpTextProps,
      button: buttonProps,
      calendar: calendarProps,
    } = splitProps(
      mixProps,
      "label",
      "error",
      "helpText",
      "button",
      "calendar"
    );

    const [open, setOpen] = React.useState(false);

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

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              {...buttonProps}
              ref={ref}
              id={id}
              variant="outline"
              disabled={disabled}
              data-empty={!value}
              className={cn(
                "data-[empty=true]:text-muted-foreground w-full justify-start text-left font-normal",
                buttonProps.className
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {value ? (
                moment(value).format(dateFormat)
              ) : (
                <span>{placeholder}</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              {...calendarProps}
              mode="single"
              selected={value}
              onSelect={(date: Date | undefined) => {
                onChange(date);
                setOpen(false);
              }}
              disabled={disabled}
              autoFocus
            />
          </PopoverContent>
        </Popover>

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

DatePicker.displayName = "DatePicker";
