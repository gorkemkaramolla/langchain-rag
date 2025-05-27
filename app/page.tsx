"use client";

import type React from "react";

import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Send,
  Trash2,
  Bot,
  User,
  Loader2,
  Copy,
  Check,
  AlertCircle,
  Maximize2,
  Minimize2,
} from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  id: string;
}

const examplePrompts = [
  "TORUNLAR GYO hangi projeleri var?",
  "Mall of İstanbul'da hangi mağazalar var?",
  "TORUNLAR hakkında bilgi ver",
];

export default function TorunlarChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!loading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [loading]);

  const generateMessageId = () => {
    return Math.random().toString(36).substr(2, 9);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
      id: generateMessageId(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const allMessages = [...messages, userMessage];

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: allMessages,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.messages && data.messages[0]) {
        const assistantMessage: Message = {
          role: "assistant",
          content: data.messages[0].content,
          timestamp: new Date(),
          id: generateMessageId(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("Error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Bilinmeyen bir hata oluştu";
      setError(`Hata: ${errorMessage}`);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Üzgünüm, şu anda teknik bir sorun yaşanıyor. Lütfen daha sonra tekrar deneyin.",
          timestamp: new Date(),
          id: generateMessageId(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const sendExamplePrompt = (prompt: string) => {
    setInput(prompt);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const clearChat = () => {
    setMessages([]);
    setError(null);
    inputRef.current?.focus();
  };

  const copyToClipboard = async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Bot className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">TORUNLAR GYO</h1>
              <p className="text-sm text-muted-foreground">
                AI Powered Assistant
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Badge
              variant="secondary"
              className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
            >
              Aktif
            </Badge>
            {messages.length > 0 && (
              <Button variant="outline" size="sm" onClick={clearChat}>
                <Trash2 className="w-4 h-4 mr-2" />
                Temizle
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Chat container */}
      <div className="container mx-auto px-4 py-6">
        <Card className="flex flex-col h-[calc(100vh-10rem)] max-w-4xl mx-auto">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div className="flex items-center space-x-2">
              <Bot className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Sohbet</CardTitle>
              {messages.length > 0 && (
                <Badge variant="outline">{messages.length} mesaj</Badge>
              )}
            </div>
          </CardHeader>

          <Separator />

          {/* Example prompts */}
          <div className="px-6 pt-4 pb-2 flex flex-wrap gap-2">
            {examplePrompts.map((prompt, i) => (
              <Button
                key={i}
                variant="outline"
                size="sm"
                onClick={() => sendExamplePrompt(prompt)}
                disabled={loading}
                className="text-xs h-8"
              >
                {prompt}
              </Button>
            ))}
          </div>

          {/* Messages */}
          <ScrollArea className={`flex-1 px-6 py-4 `}>
            <div className="space-y-6">
              {messages.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bot className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    TORUNLAR GYO AI Asistanına Hoş Geldiniz
                  </h3>
                  <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                    TORUNLAR GYO ve bağlı şirketleri hakkında sorularınızı
                    sorabilirsiniz.
                  </p>
                  <div className="flex flex-wrap justify-center gap-2 text-xs">
                    {examplePrompts.map((p, i) => (
                      <Badge key={i} variant="secondary">
                        {p.length > 20 ? p.slice(0, 20) + "..." : p}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.role === "assistant" && (
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        <Bot className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}

                  <div className="max-w-[70%] relative group">
                    <div
                      className={`rounded-lg p-3 ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground ml-auto"
                          : "bg-muted"
                      }`}
                    >
                      <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed">
                        {message.content}
                      </pre>
                    </div>

                    <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
                      <span>{formatTime(message.timestamp)}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          copyToClipboard(message.content, message.id)
                        }
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                      >
                        {copiedMessageId === message.id ? (
                          <Check className="w-3 h-3 text-green-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {message.role === "user" && (
                    <Avatar className="w-8 h-8">
                      <AvatarFallback>
                        <User className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex gap-3 justify-start">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-muted rounded-lg p-3 max-w-[70%]">
                    <p className="text-sm text-muted-foreground italic">
                      Yanıt geliyor...
                    </p>
                  </div>
                </div>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <Separator />

          {/* Input */}
          <CardContent className="p-4">
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <Input
                ref={inputRef}
                placeholder="Sorunuzu yazın..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                disabled={loading}
                className="flex-1"
              />
              <Button
                type="submit"
                disabled={loading || !input.trim()}
                size="icon"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
