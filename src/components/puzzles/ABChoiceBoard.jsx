import React, { useState } from 'react';

export default function ABChoiceBoard({ puzzle, onAnswer, lang = 'en', hideQuestion }) {
  const [selected, setSelected] = useState(null);
  const ctx = puzzle.context_data || {};
  const optA = ctx.option_a || { title: 'Deal A' };
  const optB = ctx.option_b || { title: 'Deal B' };
  const question = hideQuestion ? null : (ctx[`question_${lang}`] || ctx.question_en || ctx.question || 'Pick the better deal');

  const handlePick = (choice) => {
    if (selected !== null) return;
    setSelected(choice);
    onAnswer(choice);
  };

  // Accept metrics OR terms OR data — Claude sometimes uses different key names
  const getMetrics = (opt) => {
    if (opt.metrics && typeof opt.metrics === 'object') return opt.metrics;
    if (opt.terms && typeof opt.terms === 'object') return opt.terms;
    if (opt.data && typeof opt.data === 'object' && !Array.isArray(opt.data)) return opt.data;
    // Fallback: collect all non-metadata fields as metrics
    const skip = new Set(['title', 'description', 'description_en', 'description_fr', 'description_it', 'description_es', 'metrics', 'terms', 'data', 'ownership']);
    const fallback = {};
    for (const [key, val] of Object.entries(opt)) {
      if (skip.has(key)) continue;
      if (typeof val === 'string' || typeof val === 'number') fallback[key] = val;
    }
    // Also merge ownership if present (Claude sometimes generates this separately)
    if (opt.ownership && typeof opt.ownership === 'object') {
      Object.assign(fallback, opt.ownership);
    }
    return Object.keys(fallback).length > 0 ? fallback : {};
  };

  // Optional labels dict for translating metric keys: ctx.labels_fr = { "Total capital": "Capital total", ... }
  const metricLabels = ctx[`labels_${lang}`] || {};

  const renderMetrics = (opt) => {
    const metrics = getMetrics(opt);
    if (!metrics || typeof metrics !== 'object' || Object.keys(metrics).length === 0) return null;
    return Object.entries(metrics).map(([key, value]) => (
      <div key={key} className="flex justify-between items-baseline gap-1 py-1.5 border-b border-gray-100 text-xs">
        <span className="text-gray-500 shrink-0">{metricLabels[key] || key.replace(/_/g, ' ')}</span>
        <span className="font-semibold font-mono text-gray-900 text-right">
          {typeof value === 'number' ? value.toLocaleString() : String(value)}
        </span>
      </div>
    ));
  };

  const renderDescription = (opt) => {
    const desc = opt[`description_${lang}`] || opt.description_en || opt.description;
    if (!desc) return null;
    return <p className="text-xs text-gray-500 mt-2 italic">{desc}</p>;
  };

  const renderCard = (opt, choice) => {
    const isSelected = selected === choice;
    const isOther = selected !== null && !isSelected;
    return (
      <div
        onClick={() => handlePick(choice)}
        className={`flex-1 min-w-0 rounded-xl p-3 cursor-pointer transition-all border-2 ${
          isSelected
            ? 'border-green-600 bg-green-50 ring-2 ring-green-200'
            : isOther
              ? 'border-gray-200 bg-gray-50 opacity-60'
              : 'border-gray-200 bg-white hover:border-gray-300'
        }`}
      >
        <div className={`font-bold text-sm mb-2 text-center ${
          isSelected ? 'text-green-700' : 'text-gray-800'
        }`}>
          {opt[`title_${lang}`] || opt.title || `Option ${choice.toUpperCase()}`}
        </div>
        {renderMetrics(opt)}
        {renderDescription(opt)}
        {isSelected && (
          <div className="text-center mt-3 text-green-600 font-semibold text-sm">
            ✓ Selected
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-4">
      {question && <p className="font-semibold mb-3 text-[15px] text-gray-900">{question}</p>}
      <div className="flex gap-3">
        {renderCard(optA, 'a')}
        {renderCard(optB, 'b')}
      </div>
    </div>
  );
}
