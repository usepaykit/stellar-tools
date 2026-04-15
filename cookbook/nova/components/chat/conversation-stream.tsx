"use client";

import { useEffect, useRef } from "react";

import { NeuralMonitor } from "./neutral-monitor";
import { StreamMessage } from "./stream-message";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

interface ConversationStreamProps {
  messages: Message[];
  isThinking?: boolean;
}

export function ConversationStream({ messages, isThinking = false }: ConversationStreamProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  const isEmpty = messages.length === 0;

  return (
    <div className="scrollbar-neural flex-1 overflow-y-auto px-6 md:px-16 lg:px-24">
      {/* Neural Monitor - Always visible at top */}
      <NeuralMonitor isThinking={isThinking} />

      {isEmpty ? (
        <div className="stagger-children flex flex-col items-center justify-center py-16">
          <p className="text-foreground/80 mb-2 font-serif text-2xl">Welcome to the Nova Chat by StelarTools</p>
          <p className="text-muted-foreground max-w-md text-center text-sm leading-relaxed">
            A new kind of intelligence, ready to assist. Begin your discourse below.
          </p>
        </div>
      ) : (
        <div className="space-y-10 pb-8">
          {messages.map((message) => (
            <StreamMessage
              key={message.id}
              role={message.role}
              content={message.content}
              timestamp={message.timestamp}
            />
          ))}

          {/* Thinking indicator */}
          {isThinking && (
            <div className="animate-drift-up">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-muted-foreground font-mono text-[10px] tracking-[0.15em] uppercase">
                  NEURAL_CORE
                </span>
              </div>
              <div className="text-muted-foreground flex items-center gap-2">
                <span className="bg-primary h-1.5 w-1.5 animate-pulse rounded-full" />
                <span
                  className="bg-primary/80 h-1.5 w-1.5 animate-pulse rounded-full"
                  style={{ animationDelay: "150ms" }}
                />
                <span
                  className="bg-accent h-1.5 w-1.5 animate-pulse rounded-full"
                  style={{ animationDelay: "300ms" }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
