"use client";

import { SentientSphere } from "./sentinet-sphere";

interface NeuralMonitorProps {
  isThinking?: boolean;
}

export function NeuralMonitor({ isThinking = false }: NeuralMonitorProps) {
  return (
    <div className="flex flex-col items-center gap-4 py-8">
      {/* Sentient Sphere */}
      <div className="relative h-48 w-48">
        <SentientSphere />
      </div>

      {/* Status text */}
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground font-mono text-[10px] tracking-[0.2em] uppercase">
          {isThinking ? "Processing" : "Neural Core Active"}
        </span>
        {isThinking && (
          <span className="flex gap-0.5">
            <span className="h-1 w-1 animate-pulse rounded-full bg-[#3B82F6]" />
            <span className="h-1 w-1 animate-pulse rounded-full bg-[#6366F1]" style={{ animationDelay: "150ms" }} />
            <span className="h-1 w-1 animate-pulse rounded-full bg-[#8B5CF6]" style={{ animationDelay: "300ms" }} />
          </span>
        )}
      </div>
    </div>
  );
}
