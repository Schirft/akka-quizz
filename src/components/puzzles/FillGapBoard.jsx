import React, { useState } from 'react';

export default function FillGapBoard({ puzzle, onAnswer, lang = 'en' }) {
  const [selected, setSelected] = useState(null);
  const ctx = puzzle.context_data || {};
  const rows = ctx.rows || [];
  const missingField = ctx.missing_field || {};
  const options = ctx.options || [];
  const question = ctx[`question_${lang}`] || ctx.question || 'Fill in the missing value';

  const handlePick = (val) => {
    setSelected(val);
    onAnswer(String(val));
  };

  return (
    <div style={{ padding: 16 }}>
      <p style={{ fontWeight: 600, marginBottom: 12, fontSize: 15, color: '#1a1a1a' }}>{question}</p>

      {/* Data table */}
      <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
        {rows.map((row, i) => {
          const isMissing = row.id === missingField.row_id;
          return (
            <div key={row.id || i} style={{
              display: 'flex', justifyContent: 'space-between', padding: '10px 14px',
              borderBottom: i < rows.length - 1 ? '1px solid #f3f4f6' : 'none',
              background: isMissing ? '#fef9c3' : 'white',
            }}>
              <span style={{ fontSize: 14, color: '#374151' }}>{row.label || row.name}</span>
              <span style={{
                fontWeight: 600, fontFamily: 'monospace', fontSize: 14,
                color: isMissing ? '#d97706' : '#111827',
              }}>
                {isMissing ? '?' : (row[missingField.field] !== undefined ? row[missingField.field] : row.value)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Options */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
        {options.map((opt) => {
          const isSelected = selected === opt;
          return (
            <button
              key={opt}
              onClick={() => handlePick(opt)}
              style={{
                padding: '12px 24px', borderRadius: 10, fontSize: 16, fontWeight: 700,
                fontFamily: 'monospace', cursor: 'pointer',
                border: isSelected ? '2px solid #16a34a' : '2px solid #e5e7eb',
                background: isSelected ? '#dcfce7' : 'white',
                color: isSelected ? '#15803d' : '#1f2937',
                transition: 'all 0.2s', minWidth: 60, textAlign: 'center',
              }}
            >
              {typeof opt === 'number' ? opt.toLocaleString() : opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
