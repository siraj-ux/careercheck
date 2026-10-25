'use client';

import React, { useState } from 'react';
import { X, Copy, Check, Share2, Clock, ShieldCheck } from 'lucide-react';

interface ShareParentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShareParentModal({ isOpen, onClose }: ShareParentModalProps) {
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    let ignore = false;
    if (!isOpen || shareUrl) return;

    fetch('/api/results/share', { method: 'POST' })
      .then((res) => res.json())
      .then((data) => {
        if (!ignore) {
          if (data.shareUrl) {
            setShareUrl(data.shareUrl);
          } else {
            setError(data.error || 'Failed to create share link');
          }
        }
      })
      .catch((err: unknown) => {
        if (!ignore) {
          const msg = err instanceof Error ? err.message : 'Something went wrong';
          setError(msg);
        }
      });

    return () => {
      ignore = true;
    };
  }, [isOpen, shareUrl]);

  if (!isOpen) return null;

  const loading = !shareUrl && !error;

  const handleCopy = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-6 sm:p-7 shadow-lg space-y-5">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <Share2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-950">Share with Parent</h3>
            <p className="text-xs text-zinc-600">Expiring read-only view of your report</p>
          </div>
        </div>

        <p className="text-xs text-zinc-600 leading-relaxed">
          Parents or guardians can view your assessment report directly from their browser without needing to sign up or create an account.
        </p>

        {loading ? (
          <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-6 text-center text-xs text-zinc-600 animate-pulse">
            Generating secure expiring link...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">
            {error}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 rounded-2xl border border-zinc-200 bg-zinc-50/80 p-2 pl-3">
              <input
                type="text"
                readOnly
                value={shareUrl || ''}
                className="w-full bg-transparent text-xs font-mono text-zinc-800 outline-none select-all"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 active:scale-95 transition-all shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            <div className="space-y-2 rounded-2xl bg-zinc-50 p-3.5 text-[11px] text-zinc-600">
              <div className="flex items-center gap-1.5 font-medium text-zinc-700">
                <Clock className="h-3.5 w-3.5 text-indigo-600" />
                <span>Valid for 7 days</span>
              </div>
              <div className="flex items-center gap-1.5 text-zinc-600">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span>Strictly read-only. Test answers and personal login are protected.</span>
              </div>
            </div>
          </div>
        )}

        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-zinc-200 px-5 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
