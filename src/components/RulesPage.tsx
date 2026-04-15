'use client';

import { useState } from 'react';
import { format } from 'date-fns';

interface Rule {
  id: string;
  title: string;
  category: string;
  description: string;
}

const CATEGORIES = [
  'Entry',
  'Exit',
  'Risk Management',
  'Psychology',
  'Session',
  'General'
];

export default function RulesPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Entry');
  const [description, setDescription] = useState('');

  const todayStr = format(new Date(), 'EEEE, MMM d');

  const handleSave = () => {
    if (!title.trim()) return;
    const newRule: Rule = {
      id: Date.now().toString(),
      title,
      category,
      description
    };
    setRules([...rules, newRule]);
    setIsAdding(false);
    setTitle('');
    setDescription('');
    setCategory('Entry');
  };

  const handleCancel = () => {
    setIsAdding(false);
    setTitle('');
    setDescription('');
    setCategory('Entry');
  };

  return (
    <div className="analytics-root fade-in">
      
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Trading Rules</h2>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            {rules.length} rules · {todayStr}
          </div>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="news-btn-tab" style={{ padding: '6px 12px' }}>📋 Today</button>
            <button className="news-btn-tab" style={{ padding: '6px 12px' }}>🗓️ History</button>
            <button className="news-btn-tab" style={{ padding: '6px 12px' }}>⚙️ Manage</button>
          </div>
          <button 
            className="btn-primary" 
            style={{ padding: '6px 16px', fontSize: 13 }}
            onClick={() => setIsAdding(true)}
          >
            + Add Rule
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {isAdding ? (
        <div className="cal-panel" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 24, marginTop: 0 }}>New Rule</h3>
          
          <div className="form-group">
            <label className="form-label" style={{ fontSize: 10, letterSpacing: '0.1em' }}>RULE TITLE *</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. Only trade A+ setups" 
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginTop: 20 }}>
            <label className="form-label" style={{ fontSize: 10, letterSpacing: '0.1em' }}>CATEGORY</label>
            <select 
              className="form-input" 
              value={category}
              onChange={e => setCategory(e.target.value)}
              style={{ appearance: 'none', background: 'var(--bg-input)' }}
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginTop: 20 }}>
            <label className="form-label" style={{ fontSize: 10, letterSpacing: '0.1em' }}>DESCRIPTION</label>
            <textarea 
              className="form-input" 
              placeholder="Details, context, or why this rule matters..."
              rows={4}
              value={description}
              onChange={e => setDescription(e.target.value)}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
            <button 
              className="btn-secondary" 
              style={{ background: 'transparent', border: 'none' }}
              onClick={handleCancel}
            >
              Cancel
            </button>
            <button 
              className="btn-primary" 
              onClick={handleSave}
              disabled={!title.trim()}
            >
              Save
            </button>
          </div>
        </div>
      ) : rules.length === 0 ? (
        <div className="cal-panel" style={{ height: 400, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <div style={{ fontSize: 32 }}>📋</div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>No rules yet</h3>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Add your trading rules first, then use this page for your daily check-in.</div>
          <button 
            className="btn-primary" 
            style={{ marginTop: 8 }}
            onClick={() => setIsAdding(true)}
          >
            + Add Rules
          </button>
        </div>
      ) : (
        <div className="cal-panel" style={{ padding: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {rules.map(r => (
              <div key={r.id} style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 16, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: 15, color: 'var(--text-primary)' }}>{r.title}</strong>
                  <span className="tag-chip" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', border: '1px solid rgba(255,255,255,0.1)' }}>{r.category}</span>
                </div>
                {r.description && <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{r.description}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
