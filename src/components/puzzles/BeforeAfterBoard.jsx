import React, { useState } from 'react';

export default function BeforeAfterBoard({ puzzle, onAnswer, lang = 'en' }) {
  const [selected, setSelected] = useState(null);
  const ctx = puzzle.context_data || {};
  const before = ctx.before || { title: 'Before', rows: [] };
  const after = ctx.after || { title: 'After', rows: [] };
  const question = ctx[`question_${lang}`] || ctx.question || 'Find the inconsistency';

  const handleTap = (id) => {
    setSelected(id);
    onAnswer(id);
  };

  const renderTable = (section, isAfter) => (
    <div style={{ flex: 1, minWidth: 140 }}>
      <div style={{
        fontWeight: 700, fontSize: 13, padding: '6px 10px',
        background: isAfter ? '#dcfce7' : '#f3f4f6',
        borderRadius: '8px 8px 0 0', textAlign: 'center',
        color: isAfter ? '#15803d' : '#374151',
      }}>
        {section.title}
      </div>
      <div style={{ border: '1px solid #e5e7eb', borderTop: 'none', borderRadius: '0 0 8px 8px', overflow: 'hidden' }}>
        {(section.rows || []).map((row) => {
          const isSelected = isAfter && selected === row.id;
          return (
            <div
              key={row.id}
              onClick={() => isAfter ? handleTap(row.id) : null}
              style={{
                display: 'flex', justifyContent: 'space-between', padding: '8px 10px',
                fontSize: 13, borderBottom: '1px solid #f3f4f6',
                cursor: isAfter ? 'pointer' : 'default',
                background: isSelected ? '#bbf7d0' : 'white',
                transition: 'background 0.2s',
              }}
            >
              <span style={{ color: '#374151' }}>{row.label}</span>
              <span style={{ fontWeight: 600, fontFamily: 'monospace', color: '#111827' }}>{row.value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div style={{ padding: 16 }}>
      <p style={{ fontWeight: 600, marginBottom: 12, fontSize: 15, color: '#1a1a1a' }}>{question}</p>
      <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 12 }}>Tap the incorrect value in the "After" table</p>
      <div style={{ display: 'flex', gap: 12 }}>
        {renderTable(before, false)}
        {renderTable(after, true)}
      </div>
    </div>
  );
}
