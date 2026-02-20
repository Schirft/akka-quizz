import React from 'react';
import TapToSpotBoard from './TapToSpotBoard';
import ABChoiceBoard from './ABChoiceBoard';
import FillGapBoard from './FillGapBoard';
import MatchChartBoard from './MatchChartBoard';
import BeforeAfterBoard from './BeforeAfterBoard';
import CrashPointBoard from './CrashPointBoard';

const BOARDS = {
  tap_to_spot: TapToSpotBoard,
  ab_choice: ABChoiceBoard,
  fill_gap: FillGapBoard,
  match_chart: MatchChartBoard,
  before_after: BeforeAfterBoard,
  crash_point: CrashPointBoard,
};

export default function PuzzleRenderer({ puzzle, onAnswer, lang = 'en' }) {
  if (!puzzle) return null;

  const type = puzzle.interaction_type || 'tap_to_spot';
  const Board = BOARDS[type];

  if (!Board) {
    return (
      <div style={{ padding: 20, textAlign: 'center', color: '#6b7280' }}>
        <p>Unknown puzzle type: <code>{type}</code></p>
      </div>
    );
  }

  const langTitle = puzzle[`title_${lang}`] || puzzle.title || 'The Catch';
  const langHint = puzzle[`hint_${lang}`] || puzzle.hint || '';

  return (
    <div style={{ width: '100%' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 12 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#111827', margin: 0 }}>{langTitle}</h2>
        {puzzle.subtitle && (
          <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>{puzzle.subtitle}</p>
        )}
      </div>

      {/* Board */}
      <Board puzzle={puzzle} onAnswer={onAnswer} lang={lang} />

      {/* Hint */}
      {langHint && (
        <div style={{
          marginTop: 12, padding: '10px 14px', background: '#fffbeb',
          border: '1px solid #fde68a', borderRadius: 8,
          fontSize: 13, color: '#92400e',
        }}>
          <strong>Hint:</strong> {langHint}
        </div>
      )}
    </div>
  );
}
