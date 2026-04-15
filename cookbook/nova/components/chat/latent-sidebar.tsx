"use client";

import { cn } from "@/lib/utils";
import { MessageSquare, Plus, X } from "lucide-react";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  title: string;
  preview: string;
  date: string;
  messages: Message[];
}

interface LatentSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (conversation: Conversation) => void;
  onNewConversation: () => void;
}

export function LatentSidebar({
  isOpen,
  onClose,
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
}: LatentSidebarProps) {
  return (
    <>
      {/* Backdrop */}
      {isOpen && <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden" onClick={onClose} />}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed top-0 right-0 z-50 h-full w-80",
          "bg-background border-border border-l",
          "transform transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="border-border flex items-center justify-between border-b p-4">
          <span className="text-muted-foreground font-mono text-[10px] tracking-[0.2em] uppercase">History</span>
          <div className="flex items-center gap-2">
            <button
              onClick={onNewConversation}
              className="text-muted-foreground hover:text-foreground magnetic-hover p-1.5 transition-colors"
              aria-label="New conversation"
              title="New conversation"
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground magnetic-hover p-1.5 transition-colors"
              aria-label="Close sidebar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Conversations List */}
        <div className="scrollbar-neural h-[calc(100%-60px)] overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-4 text-center">
              <MessageSquare className="text-muted-foreground/30 mx-auto mb-3 h-8 w-8" />
              <p className="text-muted-foreground/50 text-[12px]">No conversations yet</p>
              <p className="text-muted-foreground/30 mt-1 text-[11px]">Start a new conversation to begin</p>
            </div>
          ) : (
            <div className="p-2">
              {conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => {
                    onSelectConversation(conversation);
                    onClose();
                  }}
                  className={cn(
                    "mb-2 w-full rounded p-4 text-left transition-all duration-200",
                    "hover:bg-muted/50",
                    activeConversationId === conversation.id
                      ? "bg-muted border-l-2 border-violet-500/70"
                      : "border-l-2 border-transparent"
                  )}
                >
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <span className="text-foreground flex-1 truncate text-[15px] font-medium">
                      {conversation.title}
                    </span>
                    <span className="text-muted-foreground shrink-0 font-mono text-[11px]">{conversation.date}</span>
                  </div>
                  <p className="text-muted-foreground line-clamp-2 text-[13px] leading-relaxed">
                    {conversation.preview}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
