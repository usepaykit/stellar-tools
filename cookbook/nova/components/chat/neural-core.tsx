"use client";

import { useCallback, useState } from "react";

import { useTheme } from "@/components/theme-provider";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Layers, Moon, Sun } from "lucide-react";

import { CommandDock } from "./command-dock";
import { ConversationStream } from "./conversation-stream";
import { LatentSidebar, Message } from "./latent-sidebar";
import { MessageSuggestions } from "./message-suggestions";

export function NeuralCore() {
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [input, setInput] = useState("");
  const meteredProductId = "prod_EwUjIQrgLI0IqOCrkff2";
  const customerId = "cus_EwUj9PvpRWOj1es1SUKKWfBq";
  const {
    messages: aiMessages,
    sendMessage,
    status,
  } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat", body: { productId: meteredProductId, customerId } }),
  });
  const isLoading = status === "submitted" || status === "streaming";

  const messages: Message[] = aiMessages.map((m) => ({
    id: m.id,
    role: m.role as "user" | "assistant",
    content:
      m.parts
        ?.filter((part) => part.type === "text")
        .map((part) => part.text)
        .join("") || "",
    timestamp: new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
  }));

  const handleSuggestionSelect = useCallback((suggestion: string) => {
    setInput(suggestion);
  }, []);

  const handleSuggestionSubmit = useCallback(
    (suggestion: string) => {
      sendMessage({ text: suggestion });
    },
    [sendMessage]
  );

  const handleSubmit = useCallback(() => {
    if (!input.trim() || isLoading) return;
    sendMessage({ text: input });
    setInput("");
  }, [input, isLoading, sendMessage]);

  const handleNewConversation = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  const handleCheckout = async () => {
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await res.json();
    console.log(data);
    window.location.href = data.url;
  };

  return (
    <div className="bg-background relative flex h-screen flex-col overflow-hidden">
      <div className="noise-overlay" aria-hidden="true" />

      {/* Header */}
      <header className="border-border flex items-center justify-between border-b px-6 py-4 md:px-16 lg:px-24">
        <div className="flex items-center gap-3">
          <span className="text-foreground font-mono text-[11px] tracking-[0.2em] uppercase">StellarTools</span>
          <span className="text-muted-foreground/50 font-mono text-[9px]">/</span>
          <span className="text-foreground font-mono text-[11px] tracking-[0.2em] uppercase">Nova</span>
          <span className="text-muted-foreground/50 max-w-[200px] truncate font-mono text-[9px] uppercase">
            {messages.length === 0 ? "New Conversation" : "Active Conversation"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="text-muted-foreground hover:text-foreground magnetic-hover flex h-8 w-8 items-center justify-center transition-colors"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <button
            onClick={() => setSidebarOpen(true)}
            className="text-muted-foreground hover:text-foreground magnetic-hover flex items-center gap-2 px-3 py-1.5 transition-colors"
            aria-label="Open history sidebar"
          >
            <Layers className="h-4 w-4" />
            <span className="hidden font-mono text-[10px] tracking-wider uppercase sm:inline">History</span>
          </button>
        </div>
      </header>

      <ConversationStream messages={messages} isThinking={isLoading} />

      <button
        className="bg-primary text-primary-foreground absolute right-4 bottom-4 z-50 rounded-md px-4 py-2"
        onClick={handleCheckout}
      >
        Checkout
      </button>

      <MessageSuggestions
        onSelectSuggestion={handleSuggestionSelect}
        onSubmitSuggestion={handleSuggestionSubmit}
        isVisible={messages.length === 0}
      />

      <CommandDock
        value={input}
        onChange={setInput}
        onSubmit={handleSubmit}
        isThinking={isLoading}
        disabled={isLoading}
        showSuggestions={messages.length === 0}
      />

      <LatentSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        conversations={[]}
        activeConversationId={null}
        onSelectConversation={() => {}}
        onNewConversation={handleNewConversation}
      />
    </div>
  );
}
