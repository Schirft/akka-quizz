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

  const langTitle = puzzle[`title_${lang}`] || puzzle.title || 'Problem of the Day';
  const langHint = puzzle[`hint_${lang}`] || puzzle.hint || '';

  // Use translated context_data if available AND non-empty for the current language
  const localizedCtx = lang !== 'en' ? puzzle[`context_data_${lang}`] : null;
  const hasLocalizedCtx = localizedCtx && typeof localizedCtx === 'object' && Object.keys(localizedCtx).length > 0;
  const localizedPuzzle = hasLocalizedCtx
    ? { ...puzzle, context_data: localizedCtx }
    : puzzle;

  // Extract question from context_data for prominent display
  const ctx = localizedPuzzle.context_data || {};
  const question = ctx[`question_${lang}`] || ctx.question_en || ctx.question || '';

  return (
    <div style={{ width: '100%' }}>
      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#111827', margin: 0 }}>{langTitle}</h2>
        {puzzle.subtitle && (
          <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>{puzzle.subtitle}</p>
        )}
      </div>

      {/* Question — prominent display above the board */}
      {question && (
        <div style={{
          margin: '0 16px 12px', padding: '10px 14px',
          background: '#EEF2FF', border: '1px solid #C7D2FE',
          borderRadius: 10, fontSize: 14, fontWeight: 600,
          color: '#3730A3', lineHeight: 1.5, textAlign: 'center',
        }}>
          {question}
        </div>
      )}

      {/* Hint — shown before the board so the player knows what to look for */}
      {langHint && (
        <div style={{
          margin: '0 16px 12px', padding: '8px 12px',
          background: '#fffbeb', border: '1px solid #fde68a',
          borderRadius: 8, fontSize: 12, color: '#92400e',
        }}>
          <strong>Hint:</strong> {langHint}
        </div>
      )}

      {/* Board — uses localized context_data, question hidden (shown above) */}
      <Board puzzle={localizedPuzzle} onAnswer={onAnswer} lang={lang} hideQuestion />
    </div>
  );
}
