'use client';

import type React from 'react';

import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Send,
  Trash2,
  Bot,
  User,
  Loader2,
  Copy,
  Check,
  AlertCircle,
  Settings,
} from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  id: string;
  isStreaming?: boolean;
}

type ModelProvider = 'openai' | 'anthropic' | 'grok';

interface ModelConfig {
  provider: ModelProvider;
  model: string;
  name: string;
  description: string;
  color: string;
}

const MODELS: Record<string, ModelConfig> = {
  'gpt-4-nano': {
    provider: 'openai',
    model: 'gpt-4.1-nano',
    name: 'GPT-4 Nano',
    description: 'Fast and efficient',
    color: 'bg-green-500',
  },
  'claude-haiku': {
    provider: 'anthropic',
    model: 'claude-3-haiku-20240307',
    name: 'Claude Haiku',
    description: 'Quick and smart',
    color: 'bg-orange-500',
  },
  'grok-mini': {
    provider: 'grok',
    model: 'grok-beta',
    name: 'Grok Mini',
    description: 'Witty and fast',
    color: 'bg-purple-500',
  },
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>('gpt-4-nano');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      const container = messagesEndRef.current.parentElement;
      if (container) {
        const isAtBottom =
          container.scrollHeight - container.scrollTop <=
          container.clientHeight + 100;
        if (isAtBottom) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }
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

  const [totalTokens, setTotalTokens] = useState({
    prompt: 0,
    completion: 0,
    total: 0,
  });

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
      id: generateMessageId(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError(null);

    // Create assistant message placeholder
    const assistantMessageId = generateMessageId();
    const assistantMessage: Message = {
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      id: assistantMessageId,
      isStreaming: true,
    };

    setMessages((prev) => [...prev, assistantMessage]);

    try {
      const allMessages = [...messages, userMessage];
      const modelConfig = MODELS[selectedModel];

      // Create abort controller for this request
      abortControllerRef.current = new AbortController();

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: allMessages,
          provider: modelConfig.provider,
          model: modelConfig.model,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body reader available');
      }

      let accumulatedContent = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === 'content') {
                accumulatedContent += data.content;

                // Update the streaming message
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? { ...msg, content: accumulatedContent }
                      : msg
                  )
                );
              } else if (data.type === 'done') {
                // Update token usage and mark streaming as complete
                setTotalTokens({
                  prompt: data.tokenUsage?.promptTokens || 0,
                  completion: data.tokenUsage?.completionTokens || 0,
                  total: data.tokenUsage?.totalTokens || 0,
                });

                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? { ...msg, isStreaming: false }
                      : msg
                  )
                );
              } else if (data.type === 'error') {
                throw new Error(data.error);
              }
            } catch (parseError) {
              console.error('Error parsing SSE data:', parseError);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);

      if (error instanceof Error && error.name === 'AbortError') {
        // Request was aborted
        setMessages((prev) =>
          prev.filter((msg) => msg.id !== assistantMessageId)
        );
        return;
      }

      const errorMessage =
        error instanceof Error ? error.message : 'An unknown error occurred';
      setError(`Error: ${errorMessage}`);

      // Update the assistant message with error
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content:
                  'Sorry, there is a technical issue right now. Please try again later.',
                isStreaming: false,
              }
            : msg
        )
      );
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const sendExamplePrompt = (prompt: string) => {
    setInput(prompt);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const clearChat = () => {
    // Abort any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setMessages([]);
    setError(null);
    setLoading(false);
    inputRef.current?.focus();
  };

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setLoading(false);

    // Mark any streaming messages as complete
    setMessages((prev) =>
      prev.map((msg) =>
        msg.isStreaming ? { ...msg, isStreaming: false } : msg
      )
    );
  };

  const copyToClipboard = async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const currentModel = MODELS[selectedModel];

  return (
    <div className='min-h-screen bg-background flex flex-col overflow-hidden'>
      {/* Header */}

      {/* Chat container */}
      <div className='container mx-auto px-4 py-6'>
        <Card className='flex flex-col h-[calc(100vh-10rem)] max-w-4xl mx-auto'>
          {/* <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-4'>
            <div className='flex items-center space-x-2'>
              <div className={`w-5 h-5 ${currentModel.color} rounded`} />
              <CardTitle className='text-lg'>Chat</CardTitle>
              {messages.length > 0 && (
                <Badge variant='outline'>{messages.length} messages</Badge>
              )}
            </div>
            <div className='flex items-center space-x-2'>
              <Badge variant='secondary' className='text-xs'>
                Tokens: {totalTokens.total}
              </Badge>
            </div>
          </CardHeader> */}

          {/* Model Selector */}
          <div className='px-6 pb-4'>
            <div className='flex items-center space-x-2'>
              <Settings className='w-4 h-4 text-muted-foreground' />
              <span className='text-sm font-medium'>Model:</span>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger className='w-48'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(MODELS).map(([key, model]) => (
                    <SelectItem key={key} value={key}>
                      <div className='flex items-center space-x-2'>
                        <div
                          className={`w-3 h-3 ${model.color} rounded-full`}
                        />
                        <div>
                          <div className='font-medium'>{model.name}</div>
                          <div className='text-xs text-muted-foreground'>
                            {model.description}
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Messages */}
          <ScrollArea className='flex-1 px-6 py-4 overflow-y-auto'>
            <div className='space-y-6 min-h-full'>
              {messages.length === 0 && (
                <div className='text-center py-12'>
                  <div
                    className={`w-16 h-16 ${currentModel.color} rounded-full flex items-center justify-center mx-auto mb-4`}
                  >
                    <Bot className='w-8 h-8 text-white' />
                  </div>
                  <h3 className='text-lg font-semibold mb-2'>
                    Welcome to {currentModel.name}
                  </h3>
                  <p className='text-muted-foreground mb-4 max-w-md mx-auto'>
                    {currentModel.description} - Ask me anything!
                  </p>
                  <div className='flex-none px-6 pt-4 pb-2 flex flex-wrap gap-2 justify-center'>
                    {[
                      'Tell me about your services.',
                      'Where is your main office located?',
                      'What can you help me with?',
                    ].map((prompt, i) => (
                      <Button
                        key={i}
                        variant='outline'
                        size='sm'
                        onClick={() => sendExamplePrompt(prompt)}
                        disabled={loading}
                        className='text-xs h-8'
                      >
                        {prompt}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <Avatar className='w-8 h-8'>
                      <AvatarFallback
                        className={`${currentModel.color} text-white`}
                      >
                        {message.isStreaming ? (
                          <Loader2 className='w-4 h-4 animate-spin' />
                        ) : (
                          <Bot className='w-4 h-4' />
                        )}
                      </AvatarFallback>
                    </Avatar>
                  )}

                  <div className='max-w-[70%] relative group'>
                    <div
                      className={`rounded-lg p-3 ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground ml-auto'
                          : 'bg-muted'
                      }`}
                    >
                      <pre className='whitespace-pre-wrap break-words font-sans text-sm leading-relaxed'>
                        {message.content}
                        {message.isStreaming && (
                          <span className='inline-block w-2 h-4 bg-current ml-1 animate-pulse' />
                        )}
                      </pre>
                    </div>

                    <div className='flex items-center justify-between mt-1 text-xs text-muted-foreground'>
                      <span>{formatTime(message.timestamp)}</span>
                      {!message.isStreaming && (
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() =>
                            copyToClipboard(message.content, message.id)
                          }
                          className='opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0'
                        >
                          {copiedMessageId === message.id ? (
                            <Check className='w-3 h-3 text-green-600' />
                          ) : (
                            <Copy className='w-3 h-3' />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>

                  {message.role === 'user' && (
                    <Avatar className='w-8 h-8'>
                      <AvatarFallback>
                        <User className='w-4 h-4' />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}

              {error && (
                <Alert variant='destructive'>
                  <AlertCircle className='h-4 w-4' />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <Separator className='flex-none' />

          {/* Input */}
          <CardContent className='flex-none p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
            <div className='flex items-center gap-2'>
              <Input
                ref={inputRef}
                placeholder={`Ask ${currentModel.name} a question...`}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                disabled={loading}
                className='flex-1'
              />
              <Button
                onClick={handleSubmit}
                disabled={loading || !input.trim()}
                size='icon'
              >
                {loading ? (
                  <Loader2 className='w-4 h-4 animate-spin' />
                ) : (
                  <Send className='w-4 h-4' />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
