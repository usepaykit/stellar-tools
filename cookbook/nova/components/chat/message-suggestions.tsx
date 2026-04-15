"use client";

import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

interface MessageSuggestionsProps {
  onSelectSuggestion: (suggestion: string) => void;
  onSubmitSuggestion?: (suggestion: string) => void;
  isVisible: boolean;
}

const SUGGESTIONS = [
  "Write a full business plan for a SaaS startup",
  "Debug this React component and explain why it breaks",
  "Generate 10 cold email variations for a product launch",
  "Explain Stellar blockchain payments like I'm 5",
];

export function MessageSuggestions({ onSelectSuggestion, onSubmitSuggestion, isVisible }: MessageSuggestionsProps) {
  if (!isVisible) {
    return null;
  }

  const handleSuggestionClick = (suggestion: string) => {
    onSelectSuggestion(suggestion);
    // Auto-submit if the callback is provided
    if (onSubmitSuggestion) {
      setTimeout(() => {
        onSubmitSuggestion(suggestion);
      }, 50);
    }
  };

  return (
    <div className="px-6 py-6 md:px-16 lg:px-24">
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="text-accent h-4 w-4" />
        <span className="text-muted-foreground/70 font-mono text-[10px] tracking-widest uppercase">
          Suggested Prompts
        </span>
      </div>

      <div className="stagger-children grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SUGGESTIONS.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => handleSuggestionClick(suggestion)}
            className={cn(
              "group relative px-4 py-3",
              "text-foreground text-left text-sm leading-relaxed",
              "obsidian-glass",
              "hover:border-accent/50 hover:shadow-accent/10 hover:shadow-lg",
              "transition-all duration-300",
              "magnetic-hover"
            )}
          >
            <span className="relative z-10">{suggestion}</span>

            {/* Subtle gradient overlay on hover */}
            <div className="from-primary/0 via-primary/5 to-accent/0 pointer-events-none absolute inset-0 bg-gradient-to-r opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          </button>
        ))}
      </div>
    </div>
  );
}
