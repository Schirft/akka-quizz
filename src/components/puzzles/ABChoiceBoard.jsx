import React, { useState } from 'react';

export default function ABChoiceBoard({ puzzle, onAnswer, lang = 'en' }) {
  const [selected, setSelected] = useState(null);
  const ctx = puzzle.context_data || {};
  const optA = ctx.option_a || { title: 'Deal A', metrics: {} };
  const optB = ctx.option_b || { title: 'Deal B', metrics: {} };
  const question = ctx[`question_${lang}`] || ctx.question || 'Pick the better deal';

  const handlePick = (choice) => {
    setSelected(choice);
    onAnswer(choice);
  };

  const renderCard = (opt, choice) => {
    const isSelected = selected === choice;
    const metrics = opt.metrics || {};
    return (
      <div
        onClick={() => handlePick(choice)}
        style={{
          flex: 1, border: isSelected ? '2px solid #16a34a' : '2px solid #e5e7eb',
          borderRadius: 12, padding: 16, cursor: 'pointer',
          background: isSelected ? '#f0fdf4' : 'white',
          transition: 'all 0.2s',
        }}
      >
        <div style={{
          fontWeight: 700, fontSize: 16, marginBottom: 10, textAlign: 'center',
          color: isSelected ? '#15803d' : '#1f2937',
        }}>
          {opt.title || `Option ${choice.toUpperCase()}`}
        </div>
        {Object.entries(metrics).map(([key, value]) => (
          <div key={key} style={{
            display: 'flex', justifyContent: 'space-between', padding: '6px 0',
            borderBottom: '1px solid #f3f4f6', fontSize: 13,
          }}>
            <span style={{ color: '#6b7280' }}>{key.replace(/_/g, ' ')}</span>
            <span style={{ fontWeight: 600, fontFamily: 'monospace', color: '#111827' }}>
              {typeof value === 'number' ? value.toLocaleString() : String(value)}
            </span>
          </div>
        ))}
        {isSelected && (
          <div style={{
            textAlign: 'center', marginTop: 10, color: '#16a34a',
            fontWeight: 600, fontSize: 14,
          }}>
            &#10003; Selected
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ padding: 16 }}>
      <p style={{ fontWeight: 600, marginBottom: 12, fontSize: 15, color: '#1a1a1a' }}>{question}</p>
      <div style={{ display: 'flex', gap: 12 }}>
        {renderCard(optA, 'a')}
        {renderCard(optB, 'b')}
      </div>
    </div>
  );
}
