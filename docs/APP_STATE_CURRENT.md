# AKKA — App State Documentation

> **Generated**: 2026-02-23
> **Version**: Post Round 16 (10 Puzzle Visual Types)
> **Stack**: React 19 + Vite 7 + Supabase + TailwindCSS 4 + Framer Motion
> **Viewport**: Mobile-first (390×844 @2x)

---

## Table of Contents

1. [Routes & Pages](#1-routes--pages)
2. [Daily Pack Flow](#2-daily-pack-flow)
3. [Puzzle System](#3-puzzle-system)
4. [Gamification](#4-gamification)
5. [Admin Back-Office](#5-admin-back-office)
6. [News Feed](#6-news-feed)
7. [Auth Flow](#7-auth-flow)
8. [Supabase Tables](#8-supabase-tables)

---

## 1. Routes & Pages

### Public Routes

| Route | Component | Screenshot | Description |
|-------|-----------|------------|-------------|
| `/login` | `LoginPage` | `01_login.png` | Email/password login + "Try Demo" button for instant demo access |

### Player Routes (authenticated)

| Route | Component | Screenshot | Description |
|-------|-----------|------------|-------------|
| `/` | `HomePage` | `02_home_dashboard.png` | Main dashboard: daily challenge CTA, streak display, XP bar, level badge, quick stats, ranking preview |
| `/` (scrolled) | `HomePage` | `02b_home_scrolled.png` | Bottom section: weekly ranking, recent activity |
| `/quiz` | `QuizPage` | `03a_quiz_start.png` | Daily pack launcher: shows theme, 3 questions + puzzle + lesson. Start button |
| `/quiz` (in-progress) | `QuizPage` | `03b_quiz_question.png` | Question card with 4 answer options, timer, progress bar (1/3, 2/3, 3/3) |
| `/quiz` (feedback) | `QuizPage` | `03c_quiz_feedback.png` | Answer feedback: correct/wrong indicator, explanation, XP earned, next button |
| `/puzzle` | `PuzzlePage` | `03e_puzzle.png` | Interactive puzzle with visual component (10 visual types), tap-to-spot or other interaction |
| `/lesson` | `LessonPage` | `03f_lesson.png` | Lesson of the Day: title, structured content, key takeaway, related to puzzle |
| `/results` | `QuizResultsPage` | `04_results.png` | Session summary: score, XP earned, streak update, badges unlocked, share button |
| `/news` | `NewsPage` | `05_news_feed.png` | Scrollable news feed: article cards with image, title, summary, category badges, date |
| `/news/:id` | `ArticleDetailPage` | — | Full article view: image header, content, source link, related articles |
| `/leaderboard` | `LeaderboardPage` | `06_leaderboard.png` | Weekly rankings: top 3 podium, full list with XP, level badges, league system |
| `/profile` | `ProfilePage` | `07_profile.png` | User profile: avatar, level, XP progress, stats grid, badges collection, streak calendar |

### Admin Routes (is_admin=true)

| Route | Component | Screenshot | Description |
|-------|-----------|------------|-------------|
| `/admin` | `DashboardPage` | `08_admin_dashboard.png` | Admin overview: user stats, content stats, generation costs, recent activity |
| `/admin/generate` | `GeneratePage` | `09_admin_generator.png` | AI content generator: generate packs (3Q + puzzle + lesson), news summaries |
| `/admin/questions` | `QuestionsPage` | `10_admin_questions.png` | Question bank: list, filter by theme/difficulty/status, edit, preview, bulk actions |
| `/admin/daily` | `DailyQuizPage` | `11_admin_calendar.png` | Calendar planner: assign/unassign packs to dates, auto-fill, pack picker |
| `/admin/news` | `AdminNewsPage` | `12_admin_news.png` | News management: fetch, summarize, edit, publish/unpublish articles |

### Layout

- **`PlayerLayout`** — Bottom tab bar: Home, Quiz, News, Leaderboard, Profile
- **`AdminLayout`** — Sidebar nav: Dashboard, Generator, Questions, Calendar, News + unplanned days counter
- **`AuthGuard`** — Redirects unauthenticated users to `/login`
- **`AdminGuard`** — Checks `profiles.is_admin` flag, redirects non-admins

---

## 2. Daily Pack Flow

### Architecture

Each day has **one daily pack** containing:

```
Daily Pack
├── 3 Themed Questions (QCM, 4 options each)
├── 1 Puzzle (interactive visual challenge)
└── 1 Lesson (educational content related to the puzzle)
```

### Pack Generation Pipeline

```
Admin clicks "Generate Pack" on GeneratePage
    │
    ├── Step 1: generate-pack-questions (Edge Function)
    │   └── Claude API → 3 QCM questions on theme
    │       → Inserts into `questions` table
    │       → Auto-translates to FR/IT/ES
    │
    ├── Step 2: generate-pack-puzzle (Edge Function)
    │   └── Claude API → 1 puzzle with context_data + visual_type
    │       → Inserts into `puzzles` table
    │       → Auto-translates to FR/IT/ES
    │       → Validates visual_type against 10 valid types
    │
    ├── Step 3: generate-pack-lesson (Edge Function)
    │   └── Claude API → 1 lesson directly related to puzzle
    │       → Inserts into `daily_lessons` table
    │       → Auto-translates to FR/IT/ES
    │       → Uses puzzle visual_type for contextual teaching
    │
    └── Step 4: Create pack record
        └── Inserts into `daily_packs` table
            → Links question_ids[], puzzle_id, lesson_id
            → Sets theme, difficulty, status
```

### Player Quiz Session Flow

```
Player opens /quiz
    │
    ├── Load today's pack from `daily_packs` (by assigned_date)
    │   └── If no pack today → load random unplayed pack (practice mode)
    │
    ├── Question 1/3 → Answer → Feedback (XP earned) → Next
    ├── Question 2/3 → Answer → Feedback (XP earned) → Next
    ├── Question 3/3 → Answer → Feedback (XP earned) → Next
    │
    ├── Puzzle Phase
    │   └── Interactive visual puzzle (tap_to_spot, ab_choice, etc.)
    │   └── Visual rendered by TapToSpotBoard → VIEW_MAP[visual_type]
    │
    ├── Lesson Phase
    │   └── "Lesson of the Day" — educational content tied to puzzle
    │
    └── Results Screen
        └── Score (0-3), total XP, streak update, badges, share
```

### Pack Data Model

```sql
daily_packs {
  id              uuid PK
  theme           text          -- e.g., "fundraising", "due_diligence"
  difficulty      text          -- "easy" | "medium" | "hard"
  question_ids    uuid[]        -- Array of 3 question IDs
  puzzle_id       uuid FK       -- → puzzles.id
  lesson_id       uuid FK       -- → daily_lessons.id
  assigned_date   date          -- Calendar assignment (nullable)
  status          text          -- "draft" | "ready" | "published"
  created_at      timestamptz
}
```

---

## 3. Puzzle System

### 6 Interaction Types

| Type | Description | UX |
|------|-------------|-----|
| `tap_to_spot` | Find the flaw in a visual document | Tap on the row/cell containing the error |
| `ab_choice` | Compare two options (A vs B) | Select which version is correct/better |
| `fill_gap` | Fill in a missing value | Type or select the correct number/text |
| `match_chart` | Match data to chart elements | Drag & drop or tap to match |
| `before_after` | Identify what changed | Spot the difference between two states |
| `crash_point` | Find where things went wrong | Identify the critical failure point |

### 10 Visual Types (for `tap_to_spot`)

Each visual type renders a specialized, realistic financial document:

| Visual Type | Component | What It Looks Like |
|------------|-----------|-------------------|
| `cap_table` | `CapTableView` | Spreadsheet-style shareholder table with columns: Investor, Shares, %, Amount |
| `bar_chart` | `BarChartView` | SVG bar chart showing MRR/Revenue data with labeled axes |
| `term_sheet` | `TermSheetView` | Legal document with clause rows and highlighted terms |
| `metric_cards` | `MetricCardsView` | 2-column grid of KPI cards (MRR, CAC, LTV, etc.) |
| `pnl_table` | `PnlTableView` | Profit & Loss statement with Revenue, COGS, Opex, Net sections |
| `cohort_grid` | `CohortGridView` | Retention heatmap with month cohorts and percentage cells |
| `funding_timeline` | `FundingTimelineView` | Horizontal timeline of funding rounds with amounts and dates |
| `unit_economics` | `UnitEconomicsView` | Per-unit breakdown: Revenue, COGS, Gross Margin, Opex, Net |
| `investor_email` | `InvestorEmailView` | Formatted email layout mimicking a CEO investor update |
| `comp_table` | `CompTableView` | Comparison table of similar companies with key metrics |

### Puzzle Data Model

```sql
puzzles {
  id                uuid PK
  title             text          -- EN title
  title_fr/it/es    text          -- Translated titles
  interaction_type  text          -- One of 6 types above
  context_data      jsonb         -- Visual data (rows, columns, visual_type, etc.)
  answer            jsonb         -- Correct answer(s)
  explanation       text          -- EN explanation
  explanation_fr/it/es text      -- Translated explanations
  hint              text          -- Optional hint
  difficulty        text          -- "easy" | "medium" | "hard"
  theme             text          -- Content theme
  status            text          -- "active" | "draft"
}
```

### TapToSpotBoard Router

```jsx
// src/components/puzzles/TapToSpotBoard.jsx
const VIEW_MAP = {
  cap_table:        CapTableView,
  bar_chart:        BarChartView,
  term_sheet:       TermSheetView,
  metric_cards:     MetricCardsView,
  pnl_table:        PnlTableView,
  cohort_grid:      CohortGridView,
  funding_timeline: FundingTimelineView,
  unit_economics:   UnitEconomicsView,
  investor_email:   InvestorEmailView,
  comp_table:       CompTableView,
};
// Falls back to DefaultListView for legacy puzzles without visual_type
```

---

## 4. Gamification

### XP System

| Action | XP Earned |
|--------|-----------|
| Start a quiz | +5 |
| Correct answer | +20 |
| Fast answer (<5s) | +15 bonus |
| Medium speed (5-10s) | +5 bonus |
| Perfect score (3/3) | +50 bonus |
| Daily goal complete | +100 bonus |
| Streak bonus | +10 per day |

**Streak Multiplier**: Starts at 1.0×, increases with consecutive days. Caps at 2.0×.

### 10 Levels

| Level | Name | XP Required |
|-------|------|-------------|
| 1 | Initiate | 0 |
| 2 | Learner | 500 |
| 3 | Investor | 2,000 |
| 4 | Analyst | 5,000 |
| 5 | Angel | 12,000 |
| 6 | Strategist | 25,000 |
| 7 | Expert | 50,000 |
| 8 | Visionary | 100,000 |
| 9 | Legend | 200,000 |
| 10 | Whale | 500,000 |

Each level has a unique color and icon. Progress bar shows XP toward next level.

### 15 Badges (3 Tiers)

| Tier | Examples |
|------|----------|
| **Common** (Bronze) | First Quiz, 3-Day Streak, 10 Questions Answered |
| **Uncommon** (Silver) | Perfect Score, 7-Day Streak, 50 Questions, Speed Demon |
| **Rare** (Gold) | 30-Day Streak, 100% Month, All Themes Mastered |

Badges are awarded automatically via `checkAndAwardBadges()` after each quiz session.

### Streak System

- **Reset time**: 4:00 AM CET daily
- **Streak freeze**: 3 available per month (preserves streak without playing)
- **Visual**: Fire emoji + counter on home dashboard, calendar view on profile
- **Streak history** tracked in `streak_history` table (played, freeze_used, streak_broken)

### Weekly Leaderboard

- Resets every Monday at 00:00 CET
- Rankings by total weekly XP
- Top 3 displayed on podium with special styling
- League system planned (Bronze → Silver → Gold → Diamond)

---

## 5. Admin Back-Office

### Dashboard (`/admin`)
- **User stats**: Total users, active today, new this week
- **Content stats**: Questions count, puzzles count, packs count, lessons count
- **Generation costs**: API calls tracker from `ai_generation_batches`
- **Unplanned days**: Alert showing next 7 days without assigned packs
- **Recent activity**: Latest generation batches and their costs

### AI Generator (`/admin/generate`)

The main content creation hub. Two modes:

**Pack Generation**:
1. Select theme (fundraising, due_diligence, valuation, term_sheets, etc.)
2. Select difficulty (easy/medium/hard)
3. Click "Generate Pack" → calls 3 edge functions sequentially
4. Progress bar shows: Questions → Puzzle → Lesson → Translations
5. Real-time cost tracking ($0.015 per API call estimate)
6. Preview generated content before saving

**News Generation**:
1. Fetches articles from GNews API (6 categories × 4 languages)
2. AI summarization via Firecrawl + Claude
3. Preview summaries before publishing

### Questions Bank (`/admin/questions`)
- Filterable list of all questions
- Filter by: theme, difficulty, status (active/draft/archived), language
- Inline editing of question text and options
- Bulk status changes
- Shows which pack each question belongs to
- Schedule info: which dates the question is assigned via packs

### Calendar Planner (`/admin/daily`)
- Monthly calendar view
- Each day shows: Pack theme + status or "Empty"
- Click day to expand: see pack details (3 questions, puzzle, lesson)
- **Assign pack**: Pick from unassigned packs
- **Unassign pack**: Remove pack from date
- **Auto-fill packs**: Automatically assign unassigned packs to empty future dates
- Color coding: Green (pack assigned), Red (empty), Blue (today)

### News Management (`/admin/news`)
- List of all news articles with status
- Fetch new articles from GNews API
- Generate AI summaries (4 languages)
- Edit titles, summaries, categories
- Publish/unpublish controls
- Image URL management

---

## 6. News Feed

### Architecture

```
GNews API (6 categories)
    │
    ├── fetch-news Edge Function
    │   └── Fetches latest articles by category
    │   └── Categories: startup, fundraising, vc, fintech, ipo, ma
    │
    ├── generate-summaries Edge Function
    │   └── Firecrawl scrapes full article content
    │   └── Claude generates 4-language summaries
    │
    └── Stored in `news_articles` table
        └── 224 articles currently
```

### Player Experience

- **News Page** (`/news`): Scrollable feed of article cards
  - Article image (with fallback gradient)
  - Title (localized)
  - Summary snippet (localized)
  - Category badge (color-coded)
  - Publication date
  - Source name
- **Article Detail** (`/news/:id`): Full article view
  - Hero image
  - Full summary content
  - "Read original" link to source
  - Related articles sidebar

### Multilingual Support

Each article has:
- `title` / `title_fr` / `title_it` / `title_es`
- `summary` / `summary_fr` / `summary_it` / `summary_es`
- `content` (original scraped text)
- App language selection determines which version to display

---

## 7. Auth Flow

### Technology
- **Supabase Auth** with email/password
- JWT tokens stored in localStorage
- `AuthContext` wraps the app, provides `user`, `profile`, `loading` state

### Flow

```
App loads → AuthContext.useEffect()
    │
    ├── supabase.auth.getSession()
    │   └── If valid session → load profile from `profiles` table
    │   └── If no session → redirect to /login
    │
    ├── supabase.auth.onAuthStateChange()
    │   └── Listens for SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED
    │   └── Updates user/profile state reactively
    │
    └── Profile loading
        └── Fetches from `profiles` table by user.id
        └── Includes: display_name, xp, level, streak, is_admin, language
```

### Login Page

- **Email + Password** form
- **"Try Demo" button**: Logs in with `demo@akka.app` / `demo123`
- After login → redirect to `/` (home dashboard)
- Admin users see admin nav in sidebar

### Route Protection

```jsx
<AuthGuard>        {/* Redirects to /login if not authenticated */}
  <PlayerLayout>   {/* Bottom tab bar */}
    <Route path="/" element={<HomePage />} />
    <Route path="/quiz" element={<QuizPage />} />
    ...
  </PlayerLayout>
</AuthGuard>

<AdminGuard>       {/* Checks profiles.is_admin === true */}
  <AdminLayout>    {/* Sidebar nav */}
    <Route path="/admin" element={<DashboardPage />} />
    ...
  </AdminLayout>
</AdminGuard>
```

### User Profiles

Created automatically on first login via Supabase trigger. Default values:
- `xp`: 0
- `level`: 1
- `streak_current`: 0
- `streak_best`: 0
- `is_admin`: false
- `language`: "en"

---

## 8. Supabase Tables

### Core Tables

#### `profiles` (10 rows)
User profile data linked to Supabase Auth.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid PK | = auth.users.id |
| `display_name` | text | User display name |
| `avatar_url` | text | Profile picture URL |
| `xp` | integer | Total experience points |
| `level` | integer | Current level (1-10) |
| `streak_current` | integer | Current consecutive day streak |
| `streak_best` | integer | All-time best streak |
| `investor_score` | integer | Composite investor skill score |
| `is_admin` | boolean | Admin access flag |
| `language` | text | Preferred language (en/fr/it/es) |
| `streak_freezes_remaining` | integer | Monthly freeze allowance |
| `last_played_at` | timestamptz | Last quiz completion time |

#### `questions` (81 rows)
QCM questions with 4-language support.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid PK | |
| `question` | text | EN question text |
| `question_fr/it/es` | text | Translated question text |
| `options` | jsonb | EN answer options array |
| `options_fr/it/es` | jsonb | Translated options |
| `correct_answer` | integer | Index of correct option (0-3) |
| `explanation` | text | EN explanation |
| `explanation_fr/it/es` | text | Translated explanations |
| `theme` | text | Content theme |
| `difficulty` | text | easy/medium/hard |
| `status` | text | active/draft/archived |
| `source` | text | Generation source (ai/manual) |

#### `puzzles` (33 rows)
Interactive visual puzzles.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid PK | |
| `title` / `title_fr/it/es` | text | Puzzle title (4 languages) |
| `interaction_type` | text | One of 6 interaction types |
| `context_data` | jsonb | Visual data + `visual_type` field |
| `answer` | jsonb | Correct answer definition |
| `explanation` / `explanation_fr/it/es` | text | Explanation (4 languages) |
| `hint` / `hint_fr/it/es` | text | Optional hint (4 languages) |
| `difficulty` | text | easy/medium/hard |
| `theme` | text | Content theme |
| `status` | text | active/draft |

#### `daily_lessons` (27 rows)
Educational lessons tied to puzzles.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid PK | |
| `theme` | text | Lesson theme |
| `title` / `title_fr/it/es` | text | Lesson title (4 languages) |
| `content` / `content_fr/it/es` | text | Full lesson content (4 languages) |
| `key_takeaway` / `key_takeaway_fr/it/es` | text | Summary takeaway (4 languages) |
| `puzzle_id` | uuid FK | Related puzzle |
| `status` | text | active/draft |

#### `daily_packs` (9 rows)
The core scheduling unit — one pack per day.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid PK | |
| `theme` | text | Pack theme |
| `difficulty` | text | easy/medium/hard |
| `question_ids` | uuid[] | Array of 3 question IDs |
| `puzzle_id` | uuid FK | → puzzles.id |
| `lesson_id` | uuid FK | → daily_lessons.id |
| `assigned_date` | date | Calendar date (nullable) |
| `status` | text | draft/ready/published |

#### `daily_quizzes` (3 rows) — LEGACY
> ⚠️ **Deprecated**: Being removed in favor of `daily_packs`. Had 5 individual question columns.

### Player Activity Tables

#### `quiz_sessions` (0 rows)
Records each completed quiz attempt.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid PK | |
| `user_id` | uuid FK | → profiles.id |
| `pack_id` | uuid FK | → daily_packs.id |
| `score` | integer | Questions correct (0-3) |
| `xp_earned` | integer | Total XP from session |
| `streak_at_time` | integer | Streak when played |
| `speed_bonus_total` | integer | Speed bonus XP |
| `completed_at` | timestamptz | Completion time |

#### `quiz_answers` (0 rows)
Individual answer records per question.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid PK | |
| `session_id` | uuid FK | → quiz_sessions.id |
| `question_id` | uuid FK | → questions.id |
| `selected_answer` | integer | User's answer index |
| `is_correct` | boolean | Correctness |
| `response_time_ms` | integer | Answer speed in ms |
| `xp_earned` | integer | XP for this answer |

#### `puzzle_attempts` (0 rows)
Puzzle interaction tracking.

#### `badges_earned` (0 rows)
Badge unlock records per user.

#### `streak_history` (0 rows)
Daily streak tracking (played, freeze_used, streak_broken).

#### `leaderboard_weekly` (0 rows)
Weekly XP rankings with league system.

### Content & System Tables

#### `news_articles` (224 rows)
News content with multilingual summaries.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid PK | |
| `title` / `title_fr/it/es` | text | Article title (4 languages) |
| `summary` / `summary_fr/it/es` | text | AI summary (4 languages) |
| `content` | text | Original scraped content |
| `source_url` | text | Original article URL |
| `source_name` | text | Publisher name |
| `image_url` | text | Article image |
| `category` | text | startup/fundraising/vc/fintech/ipo/ma |
| `published_at` | timestamptz | Original publication date |
| `status` | text | published/draft |

#### `ai_generation_batches` (24 rows)
Tracks AI API usage and costs.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid PK | |
| `type` | text | pack/news/translate |
| `api_calls` | integer | Number of API calls |
| `estimated_cost_usd` | numeric | Cost estimate |
| `duration_ms` | integer | Generation time |
| `metadata` | jsonb | Additional details |

#### `app_settings` (11 rows)
Key-value configuration store.

---

## Edge Functions

| Function | Purpose | API Calls |
|----------|---------|-----------|
| `generate-pack-questions` | Generate 3 QCM questions via Claude | 1-2 (gen + translate) |
| `generate-pack-puzzle` | Generate 1 puzzle with visual_type | 1-2 (gen + translate) |
| `generate-pack-lesson` | Generate 1 lesson tied to puzzle | 1-2 (gen + translate) |
| `generate-daily-pack` | Orchestrate full pack generation | 4-6 total |
| `translate-pack` | Translate content to FR/IT/ES | 1-3 |
| `fetch-news` | Fetch articles from GNews API | 0 (REST only) |
| `generate-summaries` | Firecrawl + Claude summarization | 1 per article |

**AI Model**: `claude-sonnet-4-20250514`
**Retry Strategy**: 5 attempts with exponential backoff (8s → 40s)
**Estimated Cost**: ~$0.015 per API call

---

## Screenshots Reference

| File | Page | Status |
|------|------|--------|
| `01_login.png` | Login page with email form + Try Demo | ✅ Captured |
| `02_home_dashboard.png` | Home dashboard (demo user) | ✅ Captured |
| `02b_home_scrolled.png` | Home scrolled — ranking section | ✅ Captured |
| `03a_quiz_start.png` | Quiz start screen | ✅ Captured |
| `03b_quiz_question.png` | Quiz question view | ⚠️ Auth required |
| `03c_quiz_feedback.png` | Answer feedback | ⚠️ Auth required |
| `03d_quiz_q2.png` | Second question | ⚠️ Auth required |
| `03e_puzzle.png` | Puzzle page | ⚠️ Requires active session |
| `03f_lesson.png` | Lesson page | ⚠️ Requires active session |
| `04_results.png` | Results page | ⚠️ Requires active session |
| `05_news_feed.png` | News feed (demo user) | ✅ Captured |
| `06_leaderboard.png` | Leaderboard | ⚠️ Auth lost |
| `07_profile.png` | Profile page | ⚠️ Auth lost |
| `08_admin_dashboard.png` | Admin dashboard | ⚠️ Admin auth required |
| `09_admin_generator.png` | AI Generator | ⚠️ Admin auth required |
| `10_admin_questions.png` | Questions bank | ⚠️ Admin auth required |
| `11_admin_calendar.png` | Calendar planner | ⚠️ Admin auth required |
| `12_admin_news.png` | News management | ⚠️ Admin auth required |
| `13_progression_path.png` | Progression modal | ⚠️ UI interaction required |

> Note: Screenshots marked ⚠️ show the login page due to Puppeteer auth injection limitations.
> The headless browser cannot maintain Supabase auth sessions through `onAuthStateChange`.
> To capture all pages, use Chrome DevTools or manual screenshots.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────┐
│                   React SPA                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │  Player   │ │  Admin   │ │  Shared          │ │
│  │  Pages    │ │  Pages   │ │  Components      │ │
│  │          │ │          │ │  - PuzzleViews   │ │
│  │  Home    │ │  Dash    │ │  - XP Animations │ │
│  │  Quiz    │ │  Gen     │ │  - Badge Cards   │ │
│  │  News    │ │  Q's     │ │  - Level Bar     │ │
│  │  Board   │ │  Cal     │ │  - Streak Fire   │ │
│  │  Profile │ │  News    │ │                  │ │
│  └──────────┘ └──────────┘ └──────────────────┘ │
│                      │                           │
│              AuthContext + Supabase Client        │
└──────────────────────┬───────────────────────────┘
                       │
          ┌────────────┼────────────┐
          │            │            │
   ┌──────┴──────┐ ┌──┴───┐ ┌─────┴─────┐
   │  Supabase   │ │ Edge │ │  External  │
   │  Postgres   │ │ Func │ │  APIs      │
   │             │ │      │ │            │
   │  profiles   │ │ gen- │ │  Claude    │
   │  questions  │ │ pack │ │  (Anthro.) │
   │  puzzles    │ │ -q/p │ │            │
   │  lessons    │ │ /l   │ │  GNews     │
   │  packs      │ │      │ │            │
   │  news       │ │ fetch│ │  Firecrawl │
   │  sessions   │ │ news │ │            │
   │  badges     │ │      │ │            │
   └─────────────┘ └──────┘ └────────────┘
```

---

*Generated by Claude Code — AKKA Quiz App Documentation*
