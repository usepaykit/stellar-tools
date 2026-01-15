"use client";

import * as React from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { MixinProps, splitProps } from "@/lib/mixin";
import { cn } from "@/lib/utils";

export type TimelineEntry = {
  date: string;
  title: string;
  content: string | React.ReactNode;
};

type LabelProps = React.ComponentProps<typeof Label>;
type ContainerProps = React.ComponentProps<"div">;
type EntryProps = React.ComponentProps<"div">;

export interface TimelinePickerProps
  extends
    MixinProps<"label", React.ComponentProps<typeof Label>>,
    MixinProps<"container", ContainerProps>,
    MixinProps<"entry", EntryProps>,
    MixinProps<"separator", React.ComponentProps<typeof Separator>>,
    MixinProps<"dot", React.ComponentProps<"div">>,
    MixinProps<"title", React.ComponentProps<"h4">>,
    MixinProps<"date", React.ComponentProps<"h5">>,
    MixinProps<"card", React.ComponentProps<typeof Card>>,
    MixinProps<"cardContent", React.ComponentProps<typeof CardContent>>,
    MixinProps<"content", React.ComponentProps<"div">> {
  id: string;
  data: TimelineEntry[];
  label?: LabelProps["children"] | null;
  error?: React.ReactNode;
  helpText?: React.ReactNode;
  className?: string;
  emptyMessage?: string;
  getEntryId?: (entry: TimelineEntry, index: number) => string;
}

const DEFAULT_EMPTY_MESSAGE = "No timeline entries available";
const DEFAULT_GET_ENTRY_ID = (_: TimelineEntry, index: number) => `timeline-entry-${index}`;

const TimelineEntryItem = React.memo(
  ({
    entry: entryData,
    entryId,
    isLast,
    entryProps,
    separatorProps,
    dotProps,
    titleProps,
    dateProps,
    cardProps,
    cardContentProps,
    contentProps,
  }: {
    entry: TimelineEntry;
    entryId: string;
    isLast: boolean;
    entryProps?: EntryProps;
    separatorProps?: React.ComponentProps<typeof Separator>;
    dotProps?: React.ComponentProps<"div">;
    titleProps?: React.ComponentProps<"h4">;
    dateProps?: React.ComponentProps<"h5">;
    cardProps?: React.ComponentProps<typeof Card>;
    cardContentProps?: React.ComponentProps<typeof CardContent>;
    contentProps?: React.ComponentProps<"div">;
  }) => {
    const contentId = `${entryId}-content`;
    const titleId = `${entryId}-title`;
    const dateId = `${entryId}-date`;

    return (
      <div
        {...entryProps}
        className={cn("relative mb-0 pl-8", entryProps?.className, isLast && "mb-0")}
        role="listitem"
      >
        {!isLast && (
          <Separator
            {...separatorProps}
            orientation="vertical"
            className={cn("absolute left-2 top-2 bg-muted", separatorProps?.className)}
            style={{ height: "calc(100% + 0.5rem)" }}
            aria-hidden="true"
          />
        )}
        <div
          {...dotProps}
          className={cn(
            "absolute left-0 top-0 z-10 flex size-4 items-center justify-center rounded-full bg-primary",
            dotProps?.className
          )}
          aria-hidden="true"
        />

        <h4
          {...titleProps}
          className={cn("text-lg font-bold tracking-tight", titleProps?.className)}
          id={titleId}
        >
          {entryData.title}
        </h4>

        <h5
          {...dateProps}
          className={cn(
            "text-sm mb-0 tracking-tight text-muted-foreground",
            dateProps?.className
          )}
          id={dateId}
        >
          {entryData.date}
        </h5>

        <Card {...cardProps} className={cn("border-none shadow-none", cardProps?.className)}>
          <CardContent
            {...cardContentProps}
            className={cn("px-0", cardContentProps?.className)}
          >
            <div
              {...contentProps}
              className={cn("prose text-foreground dark:prose-invert", contentProps?.className)}
              id={contentId}
              aria-labelledby={`${titleId} ${dateId}`}
            >
              {typeof entryData.content === "string" ? (
                <div dangerouslySetInnerHTML={{ __html: entryData.content }} />
              ) : (
                entryData.content
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
);

TimelineEntryItem.displayName = "TimelineEntryItem";

const EmptyState = React.memo(
  ({
    emptyMessage,
    containerProps,
  }: {
    emptyMessage: string;
    containerProps?: ContainerProps;
  }) => (
    <div
      {...containerProps}
      className={cn(
        "text-muted-foreground flex items-center justify-center py-8 text-sm",
        containerProps?.className
      )}
    >
      {emptyMessage}
    </div>
  )
);

EmptyState.displayName = "EmptyState";

export const TimelinePicker = React.forwardRef<HTMLDivElement, TimelinePickerProps>(
  (props, ref) => {
    const {
      id,
      className,
      data = [],
      label,
      error,
      helpText,
      emptyMessage = DEFAULT_EMPTY_MESSAGE,
      getEntryId = DEFAULT_GET_ENTRY_ID,
      ...restProps
    } = props;

    const {
      container,
      entry,
      separator,
      dot,
      title,
      date,
      card,
      cardContent,
      content,
      label: labelProps,
    } = splitProps(
      restProps,
      "container",
      "entry",
      "separator",
      "dot",
      "title",
      "date",
      "card",
      "cardContent",
      "content",
      "label"
    );

    const hasData = data.length > 0;

    if (!hasData) {
      return (
        <div className={cn("flex flex-col gap-2", className)} ref={ref}>
          {label && (
            <Label {...labelProps} htmlFor={id}>
              {label}
            </Label>
          )}
          {helpText && <p className="text-muted-foreground text-sm">{helpText}</p>}
          <EmptyState emptyMessage={emptyMessage} containerProps={container} />
          {error && <p className="text-destructive text-sm">{error}</p>}
        </div>
      );
    }

    return (
      <div className={cn("flex flex-col gap-2", className)} ref={ref}>
        {label && (
          <Label {...labelProps} htmlFor={id}>
            {label}
          </Label>
        )}
        {helpText && <p className="text-muted-foreground text-sm">{helpText}</p>}

        <div
          {...container}
          className={cn("relative w-full", container?.className)}
          role="list"
          aria-label="Timeline"
        >
          {data.map((entryData, index) => {
            const entryId = getEntryId(entryData, index);
            const isLast = index === data.length - 1;

            return (
              <TimelineEntryItem
                key={entryId}
                entry={entryData}
                entryId={entryId}
                isLast={isLast}
                entryProps={entry}
                separatorProps={separator}
                dotProps={dot}
                titleProps={title}
                dateProps={date}
                cardProps={card}
                cardContentProps={cardContent}
                contentProps={content}
              />
            );
          })}
        </div>

        {error && <p className="text-destructive text-sm">{error}</p>}
      </div>
    );
  }
);

TimelinePicker.displayName = "TimelinePicker";
