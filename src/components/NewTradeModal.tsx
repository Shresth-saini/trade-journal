'use client';

import { useState, useRef, useCallback } from 'react';
import { Trade } from '@/types';
import { addTrade, updateTrade } from '@/lib/trades';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const MISTAKE_PRESETS = [
  'Overtrading', 'Early Exit', 'No Stop Loss', 'Revenge Trade',
  'FOMO Entry', 'Sized Too Big', 'Sized Too Low', 'Missed Entry',
  'Moved Stop', 'Chased Entry', 'Ignored Rules', 'Bad Timing', 'Over Leveraged',
];

const TYPE_PRESETS = [
  'Breakout', 'Pullback', 'Reversal', 'Trend Following', 'Scalp',
  'Swing', 'News Play', 'Support/Resistance', 'Pattern',
];

const SESSIONS = ['NY AM', 'NY PM', 'London', 'Asia', 'Pre-Market', 'Post-Market', 'Overnight'];

const PSYCH_OPTIONS = [
  'Neutral', 'Confident', 'Anxious', 'Greedy', 'Fearful',
  'Frustrated', 'Excited', 'Calm', 'Tired', 'Distracted',
];

const RATINGS = ['C-', 'C', 'B', 'A', 'A+'];

interface Props {
  onClose: () => void;
  onSaved: () => void;
  editTrade?: Trade | null;
}

export default function NewTradeModal({ onClose, onSaved, editTrade }: Props) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const [form, setForm] = useState<Omit<Trade, 'id' | 'userId' | 'createdAt'>>({
    asset: editTrade?.asset ?? '',
    direction: editTrade?.direction ?? 'BUY',
    date: editTrade?.date ?? todayStr,
    pnl: editTrade?.pnl ?? 0,
    rr: editTrade?.rr ?? 0,
    session: editTrade?.session ?? 'NY AM',
    rating: editTrade?.rating ?? '',
    type: editTrade?.type ?? [],
    mistakes: editTrade?.mistakes ?? [],
    psychologyBefore: editTrade?.psychologyBefore ?? 'Neutral',
    psychologyAfter: editTrade?.psychologyAfter ?? 'Neutral',
    screenshots: editTrade?.screenshots ?? [],
    notes: editTrade?.notes ?? '',
  });

  const [customTag, setCustomTag] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const updateForm = (key: keyof typeof form, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleMistake = (m: string) => {
    setForm((prev) => ({
      ...prev,
      mistakes: prev.mistakes.includes(m)
        ? prev.mistakes.filter((x) => x !== m)
        : [...prev.mistakes, m],
    }));
  };

  const toggleType = (t: string) => {
    setForm((prev) => ({
      ...prev,
      type: prev.type.includes(t)
        ? prev.type.filter((x) => x !== t)
        : [...prev.type, t],
    }));
  };

  const addCustomTag = () => {
    if (customTag.trim() && !form.type.includes(customTag.trim())) {
      setForm((prev) => ({ ...prev, type: [...prev.type, customTag.trim()] }));
      setCustomTag('');
    }
  };

  const handleScreenshot = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      const remaining = 5 - form.screenshots.length;
      Array.from(files)
        .slice(0, remaining)
        .forEach((file) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const result = e.target?.result as string;
            if (result) {
              setForm((prev) => ({
                ...prev,
                screenshots: [...prev.screenshots, result],
              }));
            }
          };
          reader.readAsDataURL(file);
        });
    },
    [form.screenshots.length]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) handleScreenshot({ 0: file, length: 1 } as any);
        }
      }
    },
    [handleScreenshot]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      handleScreenshot(e.dataTransfer.files);
    },
    [handleScreenshot]
  );

  const removeScreenshot = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      screenshots: prev.screenshots.filter((_, i) => i !== idx),
    }));
  };

  const handleSave = async () => {
    if (!form.asset.trim()) {
      toast.error('Asset name is required');
      return;
    }
    if (!user) return;

    setIsSaving(true);
    try {
      if (editTrade?.id) {
        await updateTrade(editTrade.id, { ...form });
        toast.success('Trade updated!');
      } else {
        await addTrade({ ...form, userId: user.uid });
        toast.success('Trade added!');
      }
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save trade');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" onPaste={handlePaste}>
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">{editTrade ? 'Edit Trade' : 'New Trade'}</h2>
          <button
            id="modal-close-btn"
            className="modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="modal-body">
          {/* Trade Details */}
          <div className="modal-section-title">Trade Details</div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">
                Asset <span className="required">*</span>
              </label>
              <input
                id="trade-asset"
                list="asset-suggestions"
                className="form-input"
                placeholder="Type or select..."
                value={form.asset}
                onChange={(e) => updateForm('asset', e.target.value)}
              />
              <datalist id="asset-suggestions">
                {['EUR/USD', 'GBP/USD', 'NAS100', 'SPX500', 'XAUUSD', 'BTC/USD', 'ETH/USD', 'AAPL', 'TSLA', 'NVDA'].map((a) => (
                  <option key={a} value={a} />
                ))}
              </datalist>
            </div>
            <div className="form-group">
              <label className="form-label">Direction</label>
              <select
                id="trade-direction"
                className="form-input"
                value={form.direction}
                onChange={(e) => updateForm('direction', e.target.value)}
              >
                <option value="BUY">BUY</option>
                <option value="SELL">SELL</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Date</label>
              <input
                id="trade-date"
                type="date"
                className="form-input"
                value={form.date}
                onChange={(e) => updateForm('date', e.target.value)}
                style={{ colorScheme: 'dark' }}
              />
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">
                P&L ($) <span className="required">*</span>
              </label>
              <input
                id="trade-pnl"
                type="number"
                className="form-input"
                placeholder="0"
                value={form.pnl || ''}
                onChange={(e) => updateForm('pnl', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">RR</label>
              <input
                id="trade-rr"
                type="number"
                step="0.1"
                className="form-input"
                placeholder="0.0"
                value={form.rr || ''}
                onChange={(e) => updateForm('rr', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Session</label>
              <select
                id="trade-session"
                className="form-input"
                value={form.session}
                onChange={(e) => updateForm('session', e.target.value)}
              >
                {SESSIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Rating */}
          <div className="modal-section-title">Rating</div>
          <div className="rating-group">
            {RATINGS.map((r) => (
              <button
                key={r}
                id={`rating-${r.replace('+', 'plus').replace('-', 'minus')}`}
                className={`rating-btn ${form.rating === r ? 'selected' : ''}`}
                onClick={() => updateForm('rating', form.rating === r ? '' : r)}
              >
                {r}
              </button>
            ))}
            {!form.rating && <span className="rating-not-rated">Not rated</span>}
          </div>

          {/* Type */}
          <div className="modal-section-title">Type</div>
          <div className="tags-input-container">
            {form.type.map((t) => (
              <span key={t} className="tag-chip">
                {t}
                <span className="tag-chip-remove" onClick={() => toggleType(t)}>×</span>
              </span>
            ))}
            {form.type.length === 0 && (
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Add tags...</span>
            )}
          </div>
          <div className="preset-tags">
            {TYPE_PRESETS.map((t) => (
              <button
                key={t}
                className={`preset-tag ${form.type.includes(t) ? 'active' : ''}`}
                onClick={() => toggleType(t)}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="custom-tag-row">
            <input
              id="custom-tag-input"
              className="form-input"
              placeholder="Custom → Enter"
              value={customTag}
              onChange={(e) => setCustomTag(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addCustomTag()}
            />
            <button
              id="add-custom-tag-btn"
              className="btn btn-primary"
              onClick={addCustomTag}
              style={{ padding: '10px 16px', flexShrink: 0 }}
            >
              Add
            </button>
          </div>

          {/* Mistakes */}
          <div className="modal-section-title">Mistakes</div>
          <div className="tags-input-container">
            {form.mistakes.map((m) => (
              <span key={m} className="tag-chip mistake">
                {m}
                <span className="tag-chip-remove" onClick={() => toggleMistake(m)}>×</span>
              </span>
            ))}
            {form.mistakes.length === 0 && (
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>None...</span>
            )}
          </div>
          <div className="preset-tags">
            {MISTAKE_PRESETS.map((m) => (
              <button
                key={m}
                className={`preset-tag mistake-tag ${form.mistakes.includes(m) ? 'active' : ''}`}
                onClick={() => toggleMistake(m)}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Psychology */}
          <div className="modal-section-title">Psychology</div>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Before</label>
              <select
                id="trade-psych-before"
                className="form-input"
                value={form.psychologyBefore}
                onChange={(e) => updateForm('psychologyBefore', e.target.value)}
              >
                {PSYCH_OPTIONS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">After</label>
              <select
                id="trade-psych-after"
                className="form-input"
                value={form.psychologyAfter}
                onChange={(e) => updateForm('psychologyAfter', e.target.value)}
              >
                {PSYCH_OPTIONS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Screenshots */}
          <div className="modal-section-title">
            Screenshots ({form.screenshots.length}/5)
          </div>
          {form.screenshots.length > 0 && (
            <div className="screenshots-preview">
              {form.screenshots.map((src, i) => (
                <div key={i} className="screenshot-thumb-wrap">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`Screenshot ${i + 1}`} className="screenshot-thumb" />
                  <button
                    className="screenshot-thumb-remove"
                    onClick={() => removeScreenshot(i)}
                    aria-label="Remove screenshot"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
          {form.screenshots.length < 5 && (
            <div
              id="screenshots-drop-zone"
              className="screenshots-area"
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
            >
              📷 Paste · Drag · Click — {5 - form.screenshots.length} slots left
              <br />
              <span style={{ color: 'var(--accent-yellow)', fontSize: 11 }}>
                ⚠ Keep images small — large screenshots may fail to save
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                onChange={(e) => handleScreenshot(e.target.files)}
              />
            </div>
          )}

          {/* Notes */}
          <div className="modal-section-title">Notes</div>
          <textarea
            id="trade-notes"
            className="form-input"
            placeholder="Add your trade notes, thoughts, lessons learned..."
            rows={4}
            value={form.notes}
            onChange={(e) => updateForm('notes', e.target.value)}
            style={{ marginBottom: 8 }}
          />
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button
            id="cancel-trade-btn"
            className="btn btn-ghost"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            id="save-trade-btn"
            className="btn btn-primary"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : editTrade ? 'Update Trade' : 'Save Trade'}
          </button>
        </div>
      </div>
    </div>
  );
}
