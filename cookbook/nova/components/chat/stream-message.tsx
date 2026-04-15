"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";
import { Check, Copy, Download, Share2 } from "lucide-react";
import { JSX } from "react/jsx-runtime";

// Import JSX

interface StreamMessageProps {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

export function StreamMessage({ role, content, timestamp }: StreamMessageProps) {
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `neural-core-response-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Neural Core Response",
          text: content,
        });
      } catch (err) {
        // User cancelled or share failed, fallback to copy
        await handleCopy();
      }
    } else {
      // Fallback: copy link/content to clipboard
      await navigator.clipboard.writeText(content);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  };

  const isUser = role === "user";

  // Parse inline markdown (bold, italic, inline code)
  const parseInlineMarkdown = (text: string) => {
    const parts: (string | JSX.Element)[] = [];
    let remaining = text;
    let keyIndex = 0;

    while (remaining.length > 0) {
      // Check for inline code first (highest priority)
      const inlineCodeMatch = remaining.match(/^`([^`]+)`/);
      if (inlineCodeMatch) {
        parts.push(
          <code key={keyIndex++} className="bg-muted text-accent rounded px-1.5 py-0.5 font-mono text-[13px]">
            {inlineCodeMatch[1]}
          </code>
        );
        remaining = remaining.slice(inlineCodeMatch[0].length);
        continue;
      }

      // Check for bold (**text**)
      const boldMatch = remaining.match(/^\*\*([^*]+)\*\*/);
      if (boldMatch) {
        parts.push(
          <strong key={keyIndex++} className="text-foreground font-semibold">
            {boldMatch[1]}
          </strong>
        );
        remaining = remaining.slice(boldMatch[0].length);
        continue;
      }

      // Check for italic (*text*)
      const italicMatch = remaining.match(/^\*([^*]+)\*/);
      if (italicMatch) {
        parts.push(
          <em key={keyIndex++} className="text-foreground/80 italic">
            {italicMatch[1]}
          </em>
        );
        remaining = remaining.slice(italicMatch[0].length);
        continue;
      }

      // Find next special character or add plain text
      const nextSpecial = remaining.search(/[`*]/);
      if (nextSpecial === -1) {
        parts.push(remaining);
        break;
      } else if (nextSpecial === 0) {
        // Special char that didn't match patterns, treat as plain text
        parts.push(remaining[0]);
        remaining = remaining.slice(1);
      } else {
        parts.push(remaining.slice(0, nextSpecial));
        remaining = remaining.slice(nextSpecial);
      }
    }

    return parts;
  };

  // Simple markdown-like rendering for AI responses
  const renderContent = () => {
    if (isUser) {
      return <p className="text-[15px] leading-relaxed">{content}</p>;
    }

    // Split content by code blocks and render
    const parts = content.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      if (part.startsWith("```")) {
        const codeContent = part.replace(/```\w*\n?/g, "").replace(/```$/, "");
        return (
          <div key={index} className="group relative my-4">
            <pre className="code-block overflow-x-auto p-4">
              <code className="text-muted-foreground text-[13px]">{codeContent}</code>
            </pre>
            <button
              onClick={handleCopy}
              className={cn(
                "absolute top-2 right-2 p-1.5 opacity-0 group-hover:opacity-100",
                "magnetic-hover transition-all",
                "text-muted-foreground hover:text-foreground"
              )}
              aria-label="Copy code"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
        );
      }

      // Check for headers (## Header)
      const lines = part.split("\n");
      return lines.map((line, lineIndex) => {
        if (line.startsWith("## ")) {
          return (
            <h2 key={`${index}-${lineIndex}`} className="text-foreground mt-6 mb-3 font-serif text-xl font-medium">
              {parseInlineMarkdown(line.replace("## ", ""))}
            </h2>
          );
        }
        if (line.startsWith("# ")) {
          return (
            <h1 key={`${index}-${lineIndex}`} className="text-foreground mt-6 mb-3 font-serif text-2xl font-medium">
              {parseInlineMarkdown(line.replace("# ", ""))}
            </h1>
          );
        }
        if (line.startsWith("- ")) {
          return (
            <li key={`${index}-${lineIndex}`} className="text-foreground/90 ml-4 text-[15px] leading-relaxed">
              {parseInlineMarkdown(line.replace("- ", ""))}
            </li>
          );
        }
        if (line.trim() === "") {
          return <div key={`${index}-${lineIndex}`} className="h-3" />;
        }
        return (
          <p key={`${index}-${lineIndex}`} className="text-foreground/90 text-[15px] leading-relaxed">
            {parseInlineMarkdown(line)}
          </p>
        );
      });
    });
  };

  return (
    <div className={cn("animate-drift-up", isUser ? "flex flex-col items-end" : "flex flex-col items-start")}>
      {/* Tag */}
      <div className="mb-2 flex items-center gap-2">
        <span className="text-muted-foreground font-mono text-[10px] tracking-[0.15em] uppercase">
          {isUser ? "USER_01" : "NEURAL_CORE"}
        </span>
        {timestamp && <span className="text-muted-foreground/50 font-mono text-[10px]">{timestamp}</span>}
      </div>

      {/* Content */}
      <div className={cn("max-w-[85%]", isUser ? "text-muted-foreground text-right" : "text-left")}>
        {renderContent()}
      </div>

      {/* Action buttons for AI messages */}
      {!isUser && (
        <div className="mt-3 flex items-center gap-1">
          <button
            onClick={handleCopy}
            className={cn(
              "flex items-center gap-1.5 px-2 py-1",
              "text-muted-foreground/60 font-mono text-[10px] tracking-wider",
              "hover:text-muted-foreground magnetic-hover transition-colors"
            )}
          >
            {copied ? (
              <>
                <Check className="h-3 w-3" />
                <span>COPIED</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                <span>COPY</span>
              </>
            )}
          </button>

          <span className="text-muted-foreground/30">|</span>

          <button
            onClick={handleDownload}
            className={cn(
              "flex items-center gap-1.5 px-2 py-1",
              "text-muted-foreground/60 font-mono text-[10px] tracking-wider",
              "hover:text-muted-foreground magnetic-hover transition-colors"
            )}
          >
            <Download className="h-3 w-3" />
            <span>DOWNLOAD</span>
          </button>

          <span className="text-muted-foreground/30">|</span>

          <button
            onClick={handleShare}
            className={cn(
              "flex items-center gap-1.5 px-2 py-1",
              "text-muted-foreground/60 font-mono text-[10px] tracking-wider",
              "hover:text-muted-foreground magnetic-hover transition-colors"
            )}
          >
            {shared ? (
              <>
                <Check className="h-3 w-3" />
                <span>SHARED</span>
              </>
            ) : (
              <>
                <Share2 className="h-3 w-3" />
                <span>SHARE</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
