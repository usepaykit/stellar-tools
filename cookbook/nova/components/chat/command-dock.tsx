"use client";

import { KeyboardEvent, useEffect, useRef } from "react";

import { cn } from "@/lib/utils";
import { ArrowUp, Mic, Paperclip, Sparkles } from "lucide-react";

interface CommandDockProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isThinking?: boolean;
  disabled?: boolean;
  showSuggestions?: boolean;
}

export function CommandDock({
  value,
  onChange,
  onSubmit,
  isThinking = false,
  disabled = false,
  showSuggestions = true,
}: CommandDockProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [value]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !disabled) {
        onSubmit();
      }
    }
  };

  const handleSuggestionSelect = (suggestion: string) => {
    onChange(suggestion);
  };

  return (
    <div className="px-6 pt-4 pb-6 md:px-16 lg:px-24">
      <div
        className={cn("obsidian-glass focus-glow relative transition-all duration-300", isThinking && "racing-border")}
      >
        {/* Main input container */}
        <div className="flex items-end gap-3 p-4">
          {/* Left action icons */}
          <div className="flex items-center gap-1 pb-1">
            <button
              className="text-muted-foreground hover:text-foreground magnetic-hover p-2 transition-colors"
              aria-label="Add attachment"
            >
              <Paperclip className="h-4 w-4" />
            </button>
            <button
              className="text-muted-foreground hover:text-foreground magnetic-hover p-2 transition-colors"
              aria-label="Voice input"
            >
              <Mic className="h-4 w-4" />
            </button>
          </div>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Command the Neural Core..."
            disabled={disabled}
            rows={1}
            className={cn(
              "flex-1 resize-none bg-transparent",
              "text-foreground placeholder:text-muted-foreground text-[15px]",
              "caret-foreground focus:outline-none",
              "max-h-[200px] min-h-[24px] py-1"
            )}
          />

          {/* Right action icons */}
          <div className="flex items-center gap-1 pb-1">
            <button
              className="text-muted-foreground hover:text-foreground magnetic-hover p-2 transition-colors"
              aria-label="AI suggestions"
            >
              <Sparkles className="h-4 w-4" />
            </button>

            {/* Submit button */}
            <button
              onClick={onSubmit}
              disabled={!value.trim() || disabled}
              className={cn(
                "magnetic-hover p-2 transition-all",
                value.trim() && !disabled
                  ? "text-foreground bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6]"
                  : "text-muted-foreground/30"
              )}
              aria-label="Send message"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Bottom hint */}
        <div className="flex items-center justify-between px-4 pb-3">
          <span className="text-muted-foreground/60 font-mono text-[10px] tracking-wider uppercase">
            Enter to send / Shift+Enter for new line
          </span>
          <span className="text-muted-foreground/60 font-mono text-[10px] tracking-wider">v2.0.1</span>
        </div>
      </div>
    </div>
  );
}
