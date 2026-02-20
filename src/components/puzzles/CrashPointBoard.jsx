import React, { useState } from 'react';

export default function CrashPointBoard({ puzzle, onAnswer, lang = 'en' }) {
  const [selected, setSelected] = useState(null);
  const ctx = puzzle.context_data || {};
  const dataPoints = ctx.data || ctx.monthly_data || [];
  const burnData = ctx.monthly_burn || [];
  const question = ctx[`question_${lang}`] || ctx.question_en || ctx.question || 'Tap the danger month';

  const maxCash = Math.max(...dataPoints.map(d => d.cash || d.value || 0), 1);

  const handleTap = (month) => {
    if (selected !== null) return; // Block double-click
    setSelected(month);
    onAnswer(month);
  };

  return (
    <div className="p-4">
      <p className="font-semibold mb-3 text-[15px] text-gray-900">{question}</p>

      {/* Chart */}
      <div className="flex items-end gap-0.5 h-40 border-b-2 border-gray-200 mb-2 relative">
        {dataPoints.map((d, i) => {
          const cash = d.cash || d.value || 0;
          const h = Math.max((cash / maxCash) * 140, 4);
          const month = d.month || d.label || `M${i + 1}`;
          const isSelected = selected === month;
          const isOther = selected !== null && !isSelected;
          const isDanger = cash < (burnData[i]?.burn || 0) * 3;
          return (
            <div
              key={month}
              onClick={() => handleTap(month)}
              className={`flex-1 rounded-t cursor-pointer transition-all ${
                isSelected
                  ? 'bg-green-600 ring-2 ring-green-400'
                  : isOther
                    ? 'opacity-40'
                    : isDanger
                      ? 'bg-amber-400 hover:bg-amber-500'
                      : 'bg-gray-300 hover:bg-gray-400'
              }`}
              style={{ height: h }}
              title={`${month}: €${(cash / 1000).toFixed(0)}k`}
            />
          );
        })}
      </div>

      {/* Labels */}
      <div className="flex gap-0.5">
        {dataPoints.map((d, i) => {
          const month = d.month || d.label || `M${i + 1}`;
          return (
            <div key={month} className="flex-1 text-[9px] text-center text-gray-500"
              style={{ transform: 'rotate(-45deg)', transformOrigin: 'center' }}>
              {month.replace?.(/\s*20\d\d/, '').slice(0, 3) || month}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex gap-4 mt-3 text-[11px] text-gray-500">
        <span className="flex items-center gap-1">
          <span className="inline-block w-2.5 h-2.5 bg-gray-300 rounded-sm" />Safe
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2.5 h-2.5 bg-amber-400 rounded-sm" />Warning
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2.5 h-2.5 bg-green-600 rounded-sm" />Selected
        </span>
      </div>
    </div>
  );
}
