import React from 'react';
import CapTableView from './views/CapTableView';
import BarChartView from './views/BarChartView';
import TermSheetView from './views/TermSheetView';
import MetricCardsView from './views/MetricCardsView';
import PnlTableView from './views/PnlTableView';
import CohortGridView from './views/CohortGridView';
import FundingTimelineView from './views/FundingTimelineView';
import UnitEconomicsView from './views/UnitEconomicsView';
import InvestorEmailView from './views/InvestorEmailView';
import CompTableView from './views/CompTableView';
import DefaultListView from './views/DefaultListView';

const VIEW_MAP = {
  cap_table: CapTableView,
  bar_chart: BarChartView,
  term_sheet: TermSheetView,
  metric_cards: MetricCardsView,
  pnl_table: PnlTableView,
  cohort_grid: CohortGridView,
  funding_timeline: FundingTimelineView,
  unit_economics: UnitEconomicsView,
  investor_email: InvestorEmailView,
  comp_table: CompTableView,
};

export default function TapToSpotBoard({ puzzle, onAnswer, lang = 'en' }) {
  const ctx = puzzle.context_data || {};
  const visualType = ctx.visual_type;
  const ViewComponent = VIEW_MAP[visualType] || DefaultListView;

  return <ViewComponent puzzle={puzzle} onAnswer={onAnswer} lang={lang} />;
}
