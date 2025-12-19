"use client";

import * as React from "react";
import Image from "next/image";
import { Check, Copy } from "lucide-react";
import { useTheme } from "next-themes";
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  oneDark,
  oneLight,
} from "react-syntax-highlighter/dist/esm/styles/prism";

import bash from "react-syntax-highlighter/dist/esm/languages/prism/bash";
import json from "react-syntax-highlighter/dist/esm/languages/prism/json";
import tsx from "react-syntax-highlighter/dist/esm/languages/prism/tsx";
import typescript from "react-syntax-highlighter/dist/esm/languages/prism/typescript";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMounted } from "@/hooks/use-mounted";
import { cn } from "@/lib/utils";

SyntaxHighlighter.registerLanguage("tsx", tsx);
SyntaxHighlighter.registerLanguage("typescript", typescript);
SyntaxHighlighter.registerLanguage("bash", bash);
SyntaxHighlighter.registerLanguage("json", json);

interface CodeBlockProps {
  language?: string;
  children: string;
  filename?: string;
  logo?: string;
  showCopyButton?: boolean;
  className?: string;
  maxHeight?: string;
}

export function CodeBlock({
  language = "tsx",
  children,
  filename,
  logo,
  showCopyButton = true,
  className,
  maxHeight = "400px",
}: CodeBlockProps) {
  const mounted = useMounted();
  const { resolvedTheme } = useTheme();
  const [copied, setCopied] = React.useState(false);

  // Normalize language
  const lang = language.toLowerCase();
  const isShell = ["bash", "sh", "shell", "zsh"].includes(lang);

  // Copy Logic
  const copyToClipboard = React.useCallback(async () => {
    if (!children) return;
    await navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [children]);

  const syntaxTheme = React.useMemo(() => {
    const isDark = resolvedTheme === "dark";
    const baseTheme = isDark ? oneDark : oneLight;

    const bg = isShell
      ? isDark
        ? "#1f1f1f"
        : "#f5f5f5" // Muted for shell
      : isDark
      ? "#0f0f0f"
      : "#fafafa"; // Standard for code

    return {
      ...baseTheme,
      'pre[class*="language-"]': {
        ...baseTheme['pre[class*="language-"]'],
        background: bg,
        margin: 0,
        padding: "1rem",
        borderRadius: "0 0 8px 8px", // Bottom corners only if header exists
      },
      'code[class*="language-"]': {
        ...baseTheme['code[class*="language-"]'],
        background: "transparent", // Let pre handle the bg
        fontSize: "0.875rem", // text-sm
        fontFamily: "var(--font-mono, monospace)", // Use your app's mono font
      },
    };
  }, [resolvedTheme, isShell]);

  if (!mounted) {
    return (
      <div
        className={cn(
          "w-full h-[100px] animate-pulse rounded-lg bg-muted",
          className
        )}
      />
    );
  }

  // Shell blocks usually don't need a filename header unless explicitly provided
  const showHeader = !isShell || filename;

  const hasMaxHeight = maxHeight && maxHeight !== "none";

  return (
    <TooltipProvider delayDuration={200}>
      <div
        className={cn(
          "group relative w-full overflow-hidden rounded-xl border bg-muted/50 text-sm flex flex-col",
          className
        )}
        style={hasMaxHeight ? { maxHeight } : undefined}
      >
        {/* Header Section - Sticky */}
        {showHeader && (
          <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-muted/50 px-3 py-2 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              {logo && (
                <Image
                  src={logo}
                  alt="Tech logo"
                  width={14}
                  height={14}
                  className="object-contain"
                />
              )}
              {filename && (
                <span className="text-xs font-medium text-muted-foreground">
                  {filename}
                </span>
              )}
            </div>

            {showCopyButton && !isShell && (
              <CopyButton copied={copied} onCopy={copyToClipboard} />
            )}
          </div>
        )}

        {/* Code Content with ScrollArea */}
        {hasMaxHeight ? (
          <ScrollArea className="flex-1 min-h-0">
            <div className={`max-h-[${maxHeight}]`}>
              <SyntaxHighlighter
                language={lang}
                style={syntaxTheme}
                showLineNumbers={false}
                wrapLines={false}
                customStyle={{
                  margin: 0,
                  borderRadius: showHeader ? "0 0 8px 8px" : "8px",
                }}
              >
                {children.trim()}
              </SyntaxHighlighter>
            </div>
          </ScrollArea>
        ) : (
          <div className="relative w-full overflow-x-auto">
            <SyntaxHighlighter
              language={lang}
              style={syntaxTheme}
              showLineNumbers={false}
              wrapLines={false}
              customStyle={{
                margin: 0,
                borderRadius: showHeader ? "0 0 8px 8px" : "8px",
              }}
            >
              {children.trim()}
            </SyntaxHighlighter>

            {/* Floating Copy Button for Shell/No-Header view */}
            {!showHeader && showCopyButton && (
              <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
                <CopyButton
                  copied={copied}
                  onCopy={copyToClipboard}
                  variant="floating"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

function CopyButton({
  copied,
  onCopy,
  variant = "standard",
}: {
  copied: boolean;
  onCopy: () => void;
  variant?: "standard" | "floating";
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-6 w-6 text-muted-foreground hover:bg-muted-foreground/10 hover:text-foreground",
            variant === "floating" && "bg-muted/80 backdrop-blur-sm h-8 w-8"
          )}
          onClick={onCopy}
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-green-500" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
          <span className="sr-only">Copy code</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {copied ? "Copied!" : "Copy to clipboard"}
      </TooltipContent>
    </Tooltip>
  );
}
