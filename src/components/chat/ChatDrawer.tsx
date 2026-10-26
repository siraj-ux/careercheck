'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, X, MessageSquare, AlertCircle } from 'lucide-react';

interface ChatMessage {
  id: string;
  senderId: string;
  body: string;
  readAt: string | null;
  createdAt: string;
}

interface ChatDrawerProps {
  currentUserId: string;
  studentId: string;
  consultantId: string;
  recipientName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ChatDrawer({
  currentUserId,
  studentId,
  consultantId,
  recipientName,
  isOpen,
  onClose,
}: ChatDrawerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    let isCancelled = false;

    async function loadMessages() {
      try {
        const res = await fetch(`/api/chat?studentId=${studentId}&consultantId=${consultantId}`);
        if (res.ok && !isCancelled) {
          const data = await res.json();
          if (data.success) {
            setMessages(data.messages || []);
          }
        }
      } catch {
        // Ignore background errors
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    void loadMessages();
    const interval = setInterval(() => {
      void loadMessages();
    }, 5000); // 5s polling for messages

    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [isOpen, studentId, consultantId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || sending) return;

    setSending(true);
    setError(null);
    const bodyToSend = inputText.trim();
    setInputText('');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          consultantId,
          body: bodyToSend,
        }),
      });

      const data = await res.json();
      if (data.success && data.message) {
        setMessages((prev) => [...prev, data.message]);
      } else {
        setError(data.error || 'Failed to send message');
        setInputText(bodyToSend);
      }
    } catch {
      setError('Network error sending message.');
      setInputText(bodyToSend);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs">
      <div className="w-full max-w-md h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 bg-white">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs">
              {recipientName ? recipientName[0].toUpperCase() : 'M'}
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-950">{recipientName}</h3>
              <p className="text-[11px] text-zinc-500">Direct Mentor Messaging (30-day window)</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-zinc-50/50">
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 p-2.5 text-xs text-red-700 border border-red-200">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="py-20 text-center space-y-2">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent mx-auto" />
              <p className="text-xs text-zinc-400">Loading conversation...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="py-24 text-center space-y-2 text-zinc-400">
              <MessageSquare className="h-8 w-8 mx-auto text-zinc-300" />
              <p className="text-xs font-medium text-zinc-600">No messages exchanged yet.</p>
              <p className="text-[11px] text-zinc-400 max-w-xs mx-auto">
                Ask your mentor any questions regarding your roadmap, colleges, or career options.
              </p>
            </div>
          ) : (
            messages.map((m) => {
              const isMe = m.senderId === currentUserId;
              const timeIST = new Date(m.createdAt).toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'Asia/Kolkata',
              });

              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-xs ${
                      isMe
                        ? 'bg-indigo-600 text-white rounded-br-xs'
                        : 'bg-white border border-zinc-200 text-zinc-900 rounded-bl-xs'
                    }`}
                  >
                    {m.body}
                  </div>
                  <span className="text-[10px] text-zinc-400 font-mono mt-1 px-1">
                    {timeIST}
                  </span>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-3 border-t border-zinc-200 bg-white">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type your message..."
              disabled={sending}
              className="flex-1 rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-xs text-zinc-900 focus:bg-white focus:border-indigo-600 focus:outline-hidden transition-all"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || sending}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-white shadow-xs hover:bg-indigo-700 disabled:opacity-40 transition-all shrink-0"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
