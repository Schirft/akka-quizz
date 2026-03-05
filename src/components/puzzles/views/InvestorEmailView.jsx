import React, { useState } from 'react';

export default function InvestorEmailView({ puzzle, onAnswer, lang = 'en', hideQuestion }) {
  const [selected, setSelected] = useState(null);
  const ctx = puzzle.context_data || {};
  const rows = ctx.rows || [];
  const question = hideQuestion ? null : (ctx[`question_${lang}`] || ctx.question_en || ctx.question || 'Which paragraph buries bad news?');
  const emailFrom = ctx[`email_from_${lang}`] || ctx.email_from || 'CEO';
  const emailSubject = ctx[`email_subject_${lang}`] || ctx.email_subject || 'Quarterly Update';
  const emailDate = ctx.email_date || '';

  const handleTap = (id) => {
    if (selected !== null) return;
    setSelected(id);
    onAnswer(id);
  };

  return (
    <div className="p-4">
      {question && <p className="font-semibold mb-3 text-[15px] text-gray-900">{question}</p>}
      {/* Email container */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        {/* Email header */}
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold text-gray-400 uppercase w-12">From</span>
            <span className="text-sm text-gray-800 font-medium">{emailFrom}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold text-gray-400 uppercase w-12">Subject</span>
            <span className="text-sm text-gray-800 font-semibold">{emailSubject}</span>
          </div>
          {emailDate && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold text-gray-400 uppercase w-12">Date</span>
              <span className="text-[12px] text-gray-500">{emailDate}</span>
            </div>
          )}
        </div>
        {/* Email body — paragraphs */}
        <div className="divide-y divide-gray-100">
          {rows.map((row, i) => {
            const isSelected = selected === row.id;
            const isOther = selected !== null && !isSelected;
            return (
              <div
                key={row.id || i}
                onClick={() => handleTap(row.id)}
                role="button"
                className={`px-4 py-3 cursor-pointer transition-all duration-300 ${
                  isSelected
                    ? 'bg-yellow-100'
                    : isOther
                      ? 'opacity-40 cursor-default'
                      : 'hover:bg-yellow-50/50'
                }`}
                style={{ minHeight: 44 }}
              >
                {/* No section label — user must READ the content */}
                <p className={`text-[13px] leading-relaxed ${
                  isSelected ? 'text-yellow-900' : 'text-gray-700'
                }`}>
                  {row.value || row.label || ''}
                </p>
                {isSelected && (
                  <div className="flex items-center gap-1 mt-1.5">
                    <span className="text-yellow-600 text-sm"></span>
                    <span className="text-[10px] font-semibold text-yellow-700 uppercase tracking-wide">Flagged</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
