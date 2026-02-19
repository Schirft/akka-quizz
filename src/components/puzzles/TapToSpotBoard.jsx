import React, { useState } from 'react';

export default function TapToSpotBoard({ puzzle, onAnswer, lang = 'en' }) {
  const [selected, setSelected] = useState(null);
  const ctx = puzzle.context_data || {};
  const rows = ctx.rows || ctx.clauses || [];
  const question = ctx[`question_${lang}`] || ctx.question || 'Spot the flaw';

  const handleTap = (id) => {
    setSelected(id);
    onAnswer(id);
  };

  return (
    <div style={{ padding: 16 }}>
      <p style={{ fontWeight: 600, marginBottom: 12, fontSize: 15, color: '#1a1a1a' }}>{question}</p>
      <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
        {rows.map((row, i) => {
          const isSelected = selected === row.id;
          return (
            <div
              key={row.id || i}
              onClick={() => handleTap(row.id)}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 14px', cursor: 'pointer',
                borderBottom: i < rows.length - 1 ? '1px solid #f3f4f6' : 'none',
                background: isSelected ? '#dcfce7' : 'white',
                transition: 'background 0.2s',
              }}
            >
              <span style={{ fontSize: 14, color: '#374151', flex: 1 }}>
                {row.label || row.text || row.clause || row.name}
              </span>
              {row.value !== undefined && (
                <span style={{
                  fontWeight: 600, fontFamily: 'monospace', fontSize: 14,
                  color: isSelected ? '#15803d' : '#111827',
                  marginLeft: 12,
                }}>
                  {row.value}
                </span>
              )}
              {isSelected && (
                <span style={{ marginLeft: 8, fontSize: 16 }}>&#10003;</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
