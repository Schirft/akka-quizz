import React, { useState } from 'react';

export default function MatchChartBoard({ puzzle, onAnswer, lang = 'en' }) {
  const [selected, setSelected] = useState(null);
  const ctx = puzzle.context_data || {};
  const charts = ctx.charts || [];
  const description = ctx[`description_${lang}`] || ctx.description_en || ctx.description || '';
  const question = ctx[`question_${lang}`] || ctx.question_en || ctx.question || 'Match the description to the chart';

  const handlePick = (id) => {
    if (selected !== null) return; // Block double-click
    setSelected(id);
    onAnswer(id);
  };

  const renderMiniChart = (chart) => {
    const data = chart.data || [];
    if (data.length === 0) return null;
    const maxVal = Math.max(...data.map(d => typeof d === 'number' ? d : d.y || d.value || 0), 1);
    const isSelected = selected === chart.id;
    const isOther = selected !== null && !isSelected;

    return (
      <div
        key={chart.id}
        onClick={() => handlePick(chart.id)}
        className={`flex-1 min-w-[100px] rounded-xl p-3 cursor-pointer transition-all border-2 ${
          isSelected
            ? 'border-green-600 bg-green-50 ring-2 ring-green-200'
            : isOther
              ? 'border-gray-200 bg-gray-50 opacity-50'
              : 'border-gray-200 bg-white hover:border-gray-300'
        }`}
      >
        <div className={`font-semibold text-[13px] text-center mb-2 ${
          isSelected ? 'text-green-700' : 'text-gray-700'
        }`}>
          {chart.label || `Chart ${chart.id?.toString().toUpperCase()}`}
        </div>

        {/* Simple bar chart */}
        <div className="flex items-end gap-0.5 h-[60px]">
          {data.map((d, i) => {
            const val = typeof d === 'number' ? d : d.y || d.value || 0;
            const h = Math.max((val / maxVal) * 50, 2);
            return (
              <div key={i} className={`flex-1 rounded-t-sm ${
                isSelected ? 'bg-green-600' : 'bg-gray-400'
              }`} style={{ height: h }} />
            );
          })}
        </div>

        {isSelected && (
          <div className="text-center mt-1.5 text-green-600 text-xs font-semibold">
            ✓ Selected
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-4">
      <p className="font-semibold mb-2 text-[15px] text-gray-900">{question}</p>

      {/* Description box */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 mb-4 text-sm text-slate-700 leading-relaxed italic">
        "{description}"
      </div>

      {/* Charts */}
      <div className="flex gap-2.5">
        {charts.map(c => renderMiniChart(c))}
      </div>
    </div>
  );
}
