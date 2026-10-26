'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, X, CheckCircle2, AlertCircle } from 'lucide-react';

interface Slot {
  scheduledAtIso: string;
  dateString: string;
  timeIst: string;
  weekday: number;
}

interface BookingModalProps {
  consultantId: string;
  consultantName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function BookingModal({
  consultantId,
  consultantName,
  isOpen,
  onClose,
  onSuccess,
}: BookingModalProps) {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen || !consultantId) return;
    let isCancelled = false;

    fetch(`/api/booking/slots?consultantId=${consultantId}`)
      .then((res) => res.json())
      .then((data) => {
        if (isCancelled) return;
        if (data.success) {
          setSlots(data.slots || []);
        } else {
          setError(data.error || 'Failed to load slots');
        }
        setLoading(false);
      })
      .catch(() => {
        if (!isCancelled) {
          setError('Network error loading consultant slots.');
          setLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [isOpen, consultantId]);

  if (!isOpen) return null;

  const handleBooking = async () => {
    if (!selectedSlot) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/booking/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consultantId,
          scheduledAt: selectedSlot.scheduledAtIso,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      } else {
        setError(data.error || 'Booking failed');
      }
    } catch {
      setError('An error occurred during booking. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Group slots by dateString
  const groupedSlots = slots.reduce<Record<string, Slot[]>>((acc, slot) => {
    if (!acc[slot.dateString]) acc[slot.dateString] = [];
    acc[slot.dateString].push(slot);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
          <div>
            <h3 className="text-base font-bold text-zinc-950">Book 1-on-1 Strategy Session</h3>
            <p className="text-xs text-zinc-600 mt-0.5">With {consultantName} · 45 mins IST</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-2xl bg-red-50 p-3 text-xs text-red-700 border border-red-200">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="py-12 text-center space-y-3">
            <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto animate-bounce" />
            <h4 className="text-base font-bold text-zinc-950">Session Successfully Booked!</h4>
            <p className="text-xs text-zinc-600">
              Your calendar invite and reminder notifications have been prepared.
            </p>
          </div>
        ) : loading ? (
          <div className="py-16 text-center space-y-2">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent mx-auto" />
            <p className="text-xs font-medium text-zinc-500">Checking consultant availability...</p>
          </div>
        ) : slots.length === 0 ? (
          <div className="py-12 text-center text-xs text-zinc-600">
            No upcoming availability found for this mentor right now. Please check back later.
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="text-xs font-semibold text-zinc-700">
              Select an available time slot (IST):
            </div>

            <div className="max-h-72 overflow-y-auto space-y-4 pr-1">
              {Object.entries(groupedSlots).map(([dateStr, daySlots]) => {
                const formattedDate = new Date(daySlots[0].scheduledAtIso).toLocaleDateString('en-IN', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  timeZone: 'Asia/Kolkata',
                });

                return (
                  <div key={dateStr} className="space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-900 sticky top-0 bg-white py-1">
                      <Calendar className="h-3.5 w-3.5 text-indigo-600" />
                      <span>{formattedDate}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {daySlots.map((slot) => {
                        const isSelected = selectedSlot?.scheduledAtIso === slot.scheduledAtIso;
                        return (
                          <button
                            key={slot.scheduledAtIso}
                            type="button"
                            onClick={() => setSelectedSlot(slot)}
                            className={`rounded-xl border p-2 text-xs font-mono font-medium transition-all ${
                              isSelected
                                ? 'border-indigo-600 bg-indigo-50/80 text-indigo-900 shadow-xs ring-2 ring-indigo-500/20'
                                : 'border-zinc-200 hover:border-indigo-300 hover:bg-zinc-50 text-zinc-700'
                            }`}
                          >
                            <div className="flex items-center justify-center gap-1">
                              <Clock className="h-3 w-3 text-indigo-600" />
                              <span>{slot.timeIst}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t border-zinc-100 flex items-center justify-between">
              <div className="text-xs text-zinc-500">
                {selectedSlot ? (
                  <span>Selected: <strong>{selectedSlot.dateString} at {selectedSlot.timeIst}</strong></span>
                ) : (
                  <span>No slot selected</span>
                )}
              </div>

              <button
                type="button"
                disabled={!selectedSlot || submitting}
                onClick={handleBooking}
                className="rounded-full bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {submitting ? 'Confirming...' : 'Confirm Booking'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
