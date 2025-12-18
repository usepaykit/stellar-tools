"use client";

import { useState } from "react";
import Image from "next/image";
import { useMounted } from "@/hooks/use-mounted";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Check, Copy } from "lucide-react";
import { useTheme } from "next-themes";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  oneDark,
  oneLight,
} from "react-syntax-highlighter/dist/esm/styles/prism";

/**
 * @description Type assertion to fix React 19 compatibility
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TypedSyntaxHighlighter = SyntaxHighlighter as any;

interface CodeBlockProps {
  language?: string;
  children: string;
  customStyle?: React.CSSProperties;
  componentName?: string | null;
  showCopyButton?: boolean;
  filename?: string;
  logo?: string;
  [key: string]: unknown;
}

function CodeBlockContent({
  language = "",
  children,
  customStyle,
  ...props
}: CodeBlockProps) {
  const { resolvedTheme } = useTheme();

  const customStyleObj = {
    margin: 0,
    padding: "clamp(8px, 2vw, 16px)",
    background: resolvedTheme === "dark" ? "#0f0f0f" : "#fafafa",
    fontSize: "clamp(12px, 2.5vw, 14px)",
    lineHeight: "1.6",
    fontFamily:
      'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace',
    borderRadius: "0 0 8px 8px",
    border: "none",
    whiteSpace: "pre",
    overflowX: "auto",
    width: "100%",
    maxWidth: "100%",
    ...customStyle,
  };

  // Apply muted styling for bash
  if (language === "bash") {
    customStyleObj.background =
      resolvedTheme === "dark" ? "#1f1f1f" : "#f5f5f5";
    customStyleObj.color = resolvedTheme === "dark" ? "#a1a1aa" : "#71717a";
    customStyleObj.borderRadius = "8px";
  }

  const theme =
    resolvedTheme === "dark"
      ? {
          ...oneDark,
          'pre[class*="language-"]': {
            ...oneDark['pre[class*="language-"]'],
            background: "#0f0f0f",
            margin: 0,
            borderRadius: "0 0 8px 8px",
          },
          'code[class*="language-"]': {
            ...oneDark['code[class*="language-"]'],
            background: "#0f0f0f",
          },
        }
      : {
          ...oneLight,
          'pre[class*="language-"]': {
            ...oneLight['pre[class*="language-"]'],
            background: "#fafafa",
            margin: 0,
            borderRadius: "0 0 8px 8px",
          }, 
          'code[class*="language-"]': {
            ...oneLight['code[class*="language-"]'],
            background: "#fafafa",
          },
        };

  // Override theme for bash
  if (language === "bash") {
    theme['pre[class*="language-"]'].background =
      resolvedTheme === "dark" ? "#1f1f1f" : "#f5f5f5";
    theme['code[class*="language-"]'].background =
      resolvedTheme === "dark" ? "#1f1f1f" : "#f5f5f5";
    // unify corner radius for shell blocks
    theme['pre[class*="language-"]'].borderRadius = "8px";
    theme['code[class*="language-"]'].borderRadius = "8px";
  }

  return (
    <div className="code-block-wrapper overflow-x-auto w-full">
      <TypedSyntaxHighlighter
        language={language}
        style={theme}
        customStyle={customStyleObj}
        PreTag="pre"
        showLineNumbers={false}
        wrapLines={false}
        {...props}
      >
        {children}
      </TypedSyntaxHighlighter>
    </div>
  );
}

export const CodeBlock = ({
  showCopyButton = false,
  children,
  filename,
  logo,
  ...props
}: CodeBlockProps) => {
  const mounted = useMounted();
  const [copied, setCopied] = useState(false);

  const lang = (props.language || "").toLowerCase();
  const isShell = lang === "bash" || lang === "sh" || lang === "shell";
  const shouldShowHeader = !isShell && (showCopyButton || !!filename);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 10000); // 10 seconds
  };

  if (!mounted)
    return <div className="bg-muted/20 h-6 animate-pulse rounded" />;

  // Shell variant: inline copy button inside the same block, no header
  if (!shouldShowHeader) {
    if (isShell && showCopyButton) {
      return (
        <div className="relative">
          <CodeBlockContent {...props}>{children}</CodeBlockContent>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 h-7 w-7 p-0"
                onClick={copyToClipboard}
                aria-label="Copy code"
                title={copied ? "Copied" : "Copy"}
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              {copied ? "Copied" : "Copy"}
            </TooltipContent>
          </Tooltip>
        </div>
      );
    }
    return <CodeBlockContent {...props}>{children}</CodeBlockContent>;
  }

  return (
    <div className="group bg-muted relative flex w-full flex-col items-stretch justify-between gap-1 rounded-xl overflow-hidden">
      <div className="flex w-full items-center justify-between px-2 py-1">
        {filename ? (
          <div className="flex items-center gap-2">
            {logo ? (
              <>
                <Image
                  src={logo}
                  alt=""
                  width={16}
                  height={16}
                  className="size-4 rounded-full object-contain"
                />
                <span className="text-muted-foreground">/</span>
              </>
            ) : null}
            <span className="text-sm font-medium">{filename}</span>
          </div>
        ) : (
          <div />
        )}

        {showCopyButton && !isShell && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 transition-opacity"
                onClick={copyToClipboard}
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                <span className="sr-only">Copy code</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="">
              {copied ? "Copied to clipboard" : "Copy to clipboard"}
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      <CodeBlockContent {...props}>{children}</CodeBlockContent>
    </div>
  );
};
