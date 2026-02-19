import React, { useState } from 'react';

export default function MatchChartBoard({ puzzle, onAnswer, lang = 'en' }) {
  const [selected, setSelected] = useState(null);
  const ctx = puzzle.context_data || {};
  const charts = ctx.charts || [];
  const description = ctx[`description_${lang}`] || ctx.description || '';

  const handlePick = (id) => {
    setSelected(id);
    onAnswer(id);
  };

  const renderMiniChart = (chart) => {
    const data = chart.data || [];
    if (data.length === 0) return null;
    const maxVal = Math.max(...data.map(d => typeof d === 'number' ? d : d.y || d.value || 0), 1);
    const isSelected = selected === chart.id;

    return (
      <div
        key={chart.id}
        onClick={() => handlePick(chart.id)}
        style={{
          flex: 1, minWidth: 100, border: isSelected ? '2px solid #16a34a' : '2px solid #e5e7eb',
          borderRadius: 12, padding: 12, cursor: 'pointer',
          background: isSelected ? '#f0fdf4' : 'white',
          transition: 'all 0.2s',
        }}
      >
        <div style={{
          fontWeight: 600, fontSize: 13, textAlign: 'center', marginBottom: 8,
          color: isSelected ? '#15803d' : '#374151',
        }}>
          {chart.label || `Chart ${chart.id.toUpperCase()}`}
        </div>

        {/* Simple bar chart */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 60 }}>
          {data.map((d, i) => {
            const val = typeof d === 'number' ? d : d.y || d.value || 0;
            const h = Math.max((val / maxVal) * 50, 2);
            return (
              <div key={i} style={{
                flex: 1, height: h, borderRadius: '3px 3px 0 0',
                background: isSelected ? '#16a34a' : '#9ca3af',
              }} />
            );
          })}
        </div>

        {isSelected && (
          <div style={{ textAlign: 'center', marginTop: 6, color: '#16a34a', fontSize: 12, fontWeight: 600 }}>
            &#10003; Selected
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ padding: 16 }}>
      <p style={{ fontWeight: 600, marginBottom: 8, fontSize: 15, color: '#1a1a1a' }}>Match the description to the chart</p>

      {/* Description box */}
      <div style={{
        background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10,
        padding: 14, marginBottom: 16, fontSize: 14, color: '#334155',
        lineHeight: 1.5, fontStyle: 'italic',
      }}>
        "{description}"
      </div>

      {/* Charts */}
      <div style={{ display: 'flex', gap: 10 }}>
        {charts.map(c => renderMiniChart(c))}
      </div>
    </div>
  );
}
