import React, { useState } from 'react';

export default function CrashPointBoard({ puzzle, onAnswer, lang = 'en' }) {
  const [selected, setSelected] = useState(null);
  const ctx = puzzle.context_data || {};
  const dataPoints = ctx.data || [];
  const burnData = ctx.monthly_burn || [];
  const question = ctx[`question_${lang}`] || ctx.question || 'Tap the danger month';

  const maxCash = Math.max(...dataPoints.map(d => d.cash || 0), 1);

  const handleTap = (month) => {
    setSelected(month);
    onAnswer(month);
  };

  return (
    <div style={{ padding: 16 }}>
      <p style={{ fontWeight: 600, marginBottom: 12, fontSize: 15, color: '#1a1a1a' }}>{question}</p>

      {/* Chart */}
      <div style={{
        display: 'flex', alignItems: 'flex-end', gap: 2, height: 160,
        borderBottom: '2px solid #e5e7eb', marginBottom: 8, position: 'relative'
      }}>
        {dataPoints.map((d, i) => {
          const h = Math.max((d.cash / maxCash) * 140, 4);
          const isSelected = selected === d.month;
          const isDanger = d.cash < (burnData[i]?.burn || 0) * 3;
          return (
            <div
              key={d.month}
              onClick={() => handleTap(d.month)}
              style={{
                flex: 1, height: h, cursor: 'pointer', borderRadius: '4px 4px 0 0',
                background: isSelected ? '#16a34a' : isDanger ? '#fbbf24' : '#d1d5db',
                border: isSelected ? '2px solid #15803d' : '1px solid transparent',
                transition: 'all 0.2s',
                position: 'relative',
              }}
              title={`${d.month}: €${(d.cash / 1000).toFixed(0)}k`}
            />
          );
        })}
      </div>

      {/* Labels */}
      <div style={{ display: 'flex', gap: 2 }}>
        {dataPoints.map(d => (
          <div key={d.month} style={{
            flex: 1, fontSize: 9, textAlign: 'center', color: '#6b7280',
            transform: 'rotate(-45deg)', transformOrigin: 'center',
          }}>
            {d.month?.replace(/\s*20\d\d/, '').slice(0, 3)}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 11, color: '#6b7280' }}>
        <span><span style={{ display: 'inline-block', width: 10, height: 10, background: '#d1d5db', borderRadius: 2, marginRight: 4 }} />Safe</span>
        <span><span style={{ display: 'inline-block', width: 10, height: 10, background: '#fbbf24', borderRadius: 2, marginRight: 4 }} />Warning</span>
        <span><span style={{ display: 'inline-block', width: 10, height: 10, background: '#16a34a', borderRadius: 2, marginRight: 4 }} />Selected</span>
      </div>
    </div>
  );
}
