'use client';

import { useState } from 'react';

interface Props {
  settings: {
    displayName: string;
    startingBalance: number;
    breakevenCap: number;
    ratingStyle: 'stars' | 'grades';
    theme: 'dark' | 'light';
  };
  onSave: (settings: any) => void;
}

export default function AccountPage({ settings, onSave }: Props) {
  const [displayName, setDisplayName] = useState(settings.displayName);
  const [startingBalance, setStartingBalance] = useState(settings.startingBalance.toString());
  const [breakevenCap, setBreakevenCap] = useState(settings.breakevenCap.toString());
  const [ratingStyle, setRatingStyle] = useState<'stars'|'grades'>(settings.ratingStyle);
  const [theme, setTheme] = useState<'dark'|'light'>(settings.theme);

  const beCaps = ['0', '10', '20', '35', '50'];

  const handleSave = () => {
    onSave({
      displayName,
      startingBalance: Number(startingBalance) || 0,
      breakevenCap: Number(breakevenCap) || 0,
      ratingStyle,
      theme
    });
  };

  const handleCancel = () => {
    setDisplayName(settings.displayName);
    setStartingBalance(settings.startingBalance.toString());
    setBreakevenCap(settings.breakevenCap.toString());
    setRatingStyle(settings.ratingStyle);
    setTheme(settings.theme);
  };

  return (
    <div className="analytics-root fade-in" style={{ maxWidth: 600, margin: '0 auto', paddingTop: 40 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
        <span style={{ fontSize: 20 }}>⚙️</span>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Account Settings</h2>
      </div>

      <div className="cal-panel" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        {/* DISPLAY NAME */}
        <div>
          <label style={{ display: 'block', fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 8, fontWeight: 700 }}>
            DISPLAY NAME
          </label>
          <input 
            type="text" 
            className="form-input" 
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            style={{ width: '100%', fontSize: 14, padding: '12px 16px' }}
          />
        </div>

        {/* STARTING BALANCE */}
        <div>
          <label style={{ display: 'block', fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 8, fontWeight: 700 }}>
            STARTING BALANCE ($)
          </label>
          <input 
            type="number" 
            className="form-input" 
            value={startingBalance}
            onChange={e => setStartingBalance(e.target.value)}
            style={{ width: '100%', fontSize: 14, padding: '12px 16px' }}
          />
        </div>

        {/* BREAKEVEN CAP */}
        <div>
          <label style={{ display: 'block', fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 8, fontWeight: 700 }}>
            BREAKEVEN CAP ($)
          </label>
          <input 
            type="number" 
            className="form-input" 
            value={breakevenCap}
            onChange={e => setBreakevenCap(e.target.value)}
            style={{ width: '100%', fontSize: 14, padding: '12px 16px', marginBottom: 12 }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            {beCaps.map(cap => {
              const isSelected = breakevenCap === cap;
              return (
                <button
                  key={cap}
                  onClick={() => setBreakevenCap(cap)}
                  style={{
                    padding: '6px 12px',
                    fontSize: 11,
                    borderRadius: 4,
                    border: `1px solid ${isSelected ? 'rgba(41,121,255,0.5)' : 'rgba(255,255,255,0.05)'}`,
                    background: isSelected ? 'rgba(41,121,255,0.1)' : 'transparent',
                    color: isSelected ? '#a5b4ff' : 'var(--text-muted)',
                    cursor: 'pointer'
                  }}
                >
                  ${cap}
                </button>
              );
            })}
          </div>
        </div>

        {/* RATING STYLE */}
        <div>
          <label style={{ display: 'block', fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 8, fontWeight: 700 }}>
            RATING STYLE
          </label>
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={() => setRatingStyle('stars')}
              style={{
                flex: 1,
                padding: '16px',
                borderRadius: 8,
                border: `1px solid ${ratingStyle === 'stars' ? 'rgba(186,104,200,0.5)' : 'rgba(255,255,255,0.05)'}`,
                background: ratingStyle === 'stars' ? 'rgba(186,104,200,0.1)' : 'transparent',
                color: ratingStyle === 'stars' ? '#e1bee7' : 'var(--text-muted)',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              ★ Stars
            </button>
            <button
              onClick={() => setRatingStyle('grades')}
              style={{
                flex: 1,
                padding: '16px',
                borderRadius: 8,
                border: `1px solid ${ratingStyle === 'grades' ? 'rgba(186,104,200,0.5)' : 'rgba(255,255,255,0.05)'}`,
                background: ratingStyle === 'grades' ? 'rgba(186,104,200,0.1)' : 'transparent',
                color: ratingStyle === 'grades' ? '#e1bee7' : 'var(--text-muted)',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              A+ Grades
            </button>
          </div>
        </div>

        {/* THEME */}
        <div>
          <label style={{ display: 'block', fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 8, fontWeight: 700 }}>
            THEME
          </label>
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={() => setTheme('dark')}
              style={{
                flex: 1,
                padding: '16px',
                borderRadius: 8,
                border: `1px solid ${theme === 'dark' ? 'rgba(0,230,118,0.3)' : 'rgba(255,255,255,0.05)'}`,
                background: theme === 'dark' ? 'rgba(0,230,118,0.05)' : 'transparent',
                color: theme === 'dark' ? 'var(--accent-green)' : 'var(--text-muted)',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              DARK
            </button>
            <button
              onClick={() => setTheme('light')}
              style={{
                flex: 1,
                padding: '16px',
                borderRadius: 8,
                border: `1px solid ${theme === 'light' ? 'rgba(0,230,118,0.3)' : 'rgba(255,255,255,0.05)'}`,
                background: theme === 'light' ? 'rgba(0,230,118,0.05)' : 'transparent',
                color: theme === 'light' ? 'var(--accent-green)' : 'var(--text-muted)',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              LIGHT
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}>
          <button 
            onClick={handleCancel}
            style={{ 
              background: 'transparent', 
              border: '1px solid rgba(255,255,255,0.1)', 
              color: 'var(--text-muted)',
              padding: '8px 24px',
              borderRadius: 6,
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button 
            className="btn-primary" 
            onClick={handleSave}
            style={{ padding: '8px 24px', fontSize: 14 }}
          >
            Save
          </button>
        </div>

      </div>
    </div>
  );
}
