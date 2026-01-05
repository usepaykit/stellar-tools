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
import * as RadioGroupPrimitive from "@/components/ui/radio-group";
import * as SelectPrimitive from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MixinProps, splitProps } from "@/lib/mixin";
import { cn } from "@/lib/utils";
import { CalendarIcon, Loader2 } from "lucide-react";
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


type SelectTriggerProps = React.ComponentProps<
  typeof SelectPrimitive.SelectTrigger
>;

interface SelectPickerProps
  extends
    Omit<
      React.ComponentProps<typeof SelectPrimitive.Select>,
      "value" | "onChange"
    >,
    MixinProps<"trigger", Omit<SelectTriggerProps, "children">>,
    MixinProps<
      "triggerValue",
      Omit<React.ComponentProps<typeof SelectPrimitive.SelectValue>, "children">
    >,
    MixinProps<
      "item",
      Omit<
        React.ComponentProps<typeof SelectPrimitive.SelectItem>,
        "children" | "value"
      >
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
  } = splitProps(
    mixProps,
    "label",
    "error",
    "helpText",
    "trigger",
    "triggerValue"
  );

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
};

interface RadioGroupPickerProps
  extends
    Omit<
      React.ComponentProps<typeof RadioGroupPrimitive.RadioGroup>,
      "value" | "onChange"
    >,
    MixinProps<
      "item",
      Omit<
        React.ComponentProps<typeof RadioGroupPrimitive.RadioGroupItem>,
        "children" | "value" | "itemRef" | "ref" | "type"
      >
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
        <p
          {...helpTextProps}
          className={cn("text-sm", helpTextProps.className)}
        >
          {helpText}
        </p>
      )}

      <RadioGroupPrimitive.RadioGroup
        {...rest}
        value={value}
        onValueChange={onChange}
      >
        <div
          className={cn(
            "flex flex-col gap-2",
            itemLayout === "horizontal" ? "flex-row" : "flex-col"
          )}
        >
          {items.map((item) => (
            <div key={item.value} className="flex items-center space-x-2">
              <RadioGroupPrimitive.RadioGroupItem
                {...itemProps}
                id={item.value}
                type="button"
                ref={undefined}
                value={item.value}
              />
              <Label htmlFor={item.value} className="font-normal">
                {item.label}
              </Label>
            </div>
          ))}
        </div>
      </RadioGroupPrimitive.RadioGroup>

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
};

// -- DATE PICKER --

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
              onSelect={(date) => {
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
