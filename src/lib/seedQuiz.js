import { supabase } from './supabase'

/**
 * 5 seed questions covering each macro_category — for testing without the Edge Function.
 * Answers use jsonb array format: answers_en: ["A","B","C","D"]
 * correct_answer_index is 1-based (1–4).
 */
const SEED_QUESTIONS = [
  {
    question_en: 'Which company became Europe\'s most valuable startup after its 2023 re-valuation?',
    question_fr: 'Quelle entreprise est devenue la startup la plus valorisee d\'Europe apres sa re-evaluation en 2023 ?',
    answers_en: ['Klarna', 'Revolut', 'Checkout.com', 'Adyen'],
    answers_fr: ['Klarna', 'Revolut', 'Checkout.com', 'Adyen'],
    correct_answer_index: 1,
    explanation_en: 'Klarna regained its position as Europe\'s most valuable private fintech after raising new funding at a significantly higher valuation.',
    explanation_fr: 'Klarna a retrouve sa position de fintech privee la plus valorisee d\'Europe apres une nouvelle levee de fonds.',
    macro_category: 'Ecosystem & Culture',
    sub_category: 'success_stories',
    difficulty: 'medium',
    status: 'approved',
    source: 'manual',
  },
  {
    question_en: 'What does "Series A" typically refer to in startup financing?',
    question_fr: 'A quoi fait reference la "Serie A" dans le financement de startups ?',
    answers_en: [
      'The first significant round of venture capital financing',
      'An IPO on a secondary market',
      'A government grant for innovation',
      'A debt financing round from banks',
    ],
    answers_fr: [
      'Le premier tour significatif de financement par capital-risque',
      'Une introduction en bourse sur un marche secondaire',
      'Une subvention gouvernementale pour l\'innovation',
      'Un tour de financement par dette bancaire',
    ],
    correct_answer_index: 1,
    explanation_en: 'Series A is typically the first significant round of venture capital financing, following seed funding, used to optimize products and scale user base.',
    explanation_fr: 'La Serie A est generalement le premier tour significatif de capital-risque, utilise pour optimiser le produit et developper la base utilisateurs.',
    macro_category: 'Foundational Knowledge',
    sub_category: 'funding_stages',
    difficulty: 'easy',
    status: 'approved',
    source: 'manual',
  },
  {
    question_en: 'What is a good monthly burn rate for a pre-Series A startup with $2M in funding?',
    question_fr: 'Quel est un bon taux de burn mensuel pour une startup pre-Serie A avec 2M$ de financement ?',
    answers_en: [
      '$80K-120K/month (18-24 months runway)',
      '$500K/month',
      '$10K/month',
      '$1M/month',
    ],
    answers_fr: [
      '80K-120K$/mois (18-24 mois de runway)',
      '500K$/mois',
      '10K$/mois',
      '1M$/mois',
    ],
    correct_answer_index: 1,
    explanation_en: 'A good burn rate maintains 18-24 months of runway. With $2M funding, that means $80K-120K/month, balancing growth speed with financial prudence.',
    explanation_fr: 'Un bon taux de burn maintient 18-24 mois de runway. Avec 2M$, cela signifie 80K-120K$/mois.',
    macro_category: 'KPIs / Expert Knowledge',
    sub_category: 'financial_metrics',
    difficulty: 'hard',
    status: 'approved',
    source: 'manual',
  },
  {
    question_en: 'Which AI model architecture powers most modern large language models like GPT and Claude?',
    question_fr: 'Quelle architecture de modele IA alimente la plupart des grands modeles de langage comme GPT et Claude ?',
    answers_en: [
      'Transformer',
      'Convolutional Neural Network (CNN)',
      'Recurrent Neural Network (RNN)',
      'Generative Adversarial Network (GAN)',
    ],
    answers_fr: [
      'Transformer',
      'Reseau de neurones convolutif (CNN)',
      'Reseau de neurones recurrent (RNN)',
      'Reseau antagoniste generatif (GAN)',
    ],
    correct_answer_index: 1,
    explanation_en: 'The Transformer architecture, introduced in the 2017 paper "Attention Is All You Need", is the foundation of virtually all modern LLMs including GPT, Claude, and Llama.',
    explanation_fr: 'L\'architecture Transformer, introduite en 2017, est le fondement de pratiquement tous les LLMs modernes.',
    macro_category: 'Trends & Tech',
    sub_category: 'ai_technology',
    difficulty: 'medium',
    status: 'approved',
    source: 'manual',
  },
  {
    question_en: 'Compared to public equities, what is a key disadvantage of startup investing?',
    question_fr: 'Comparee aux actions cotees, quel est un inconvenient cle de l\'investissement en startups ?',
    answers_en: [
      'Very low liquidity — you can\'t easily sell your shares',
      'Lower potential returns',
      'Too much regulatory oversight',
      'No tax advantages',
    ],
    answers_fr: [
      'Tres faible liquidite — on ne peut pas facilement vendre ses parts',
      'Des rendements potentiels plus faibles',
      'Trop de surveillance reglementaire',
      'Aucun avantage fiscal',
    ],
    correct_answer_index: 1,
    explanation_en: 'Startup investments are highly illiquid — there\'s typically no secondary market, and exits can take 7-10 years through IPO or acquisition.',
    explanation_fr: 'Les investissements en startups sont tres illiquides — il n\'y a generalement pas de marche secondaire, et les sorties prennent 7-10 ans.',
    macro_category: 'Startups vs. Other Asset Classes',
    sub_category: 'risk_comparison',
    difficulty: 'easy',
    status: 'approved',
    source: 'manual',
  },
]

/**
 * Fisher-Yates shuffle — in-place, returns the same array reference.
 */
function fisherYatesShuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/**
 * Seeds 5 test questions and creates a daily_quiz for today.
 * daily_quizzes uses question_1_id..question_5_id (not an array).
 * Returns { success, error, quizId }
 */
export async function seedTestQuiz() {
  try {
    // 1. Insert seed questions
    const { data: questions, error: qError } = await supabase
      .from('questions')
      .insert(SEED_QUESTIONS)
      .select('id')

    if (qError) throw qError

    const ids = questions.map((q) => q.id)

    // 2. Get today's date
    const today = new Date().toISOString().split('T')[0]

    // 3. Check if a daily quiz already exists for today
    const { data: existing } = await supabase
      .from('daily_quizzes')
      .select('id')
      .eq('quiz_date', today)
      .single()

    if (existing) {
      // Update existing quiz with new question IDs
      const { error: uError } = await supabase
        .from('daily_quizzes')
        .update({
          question_1_id: ids[0],
          question_2_id: ids[1],
          question_3_id: ids[2],
          question_4_id: ids[3],
          question_5_id: ids[4],
        })
        .eq('id', existing.id)

      if (uError) throw uError
      return { success: true, quizId: existing.id }
    }

    // 4. Create new daily quiz for today
    const { data: quiz, error: dqError } = await supabase
      .from('daily_quizzes')
      .insert({
        quiz_date: today,
        question_1_id: ids[0],
        question_2_id: ids[1],
        question_3_id: ids[2],
        question_4_id: ids[3],
        question_5_id: ids[4],
        auto_generated: false,
      })
      .select('id')
      .single()

    if (dqError) throw dqError

    return { success: true, quizId: quiz.id }
  } catch (err) {
    console.error('Seed quiz error:', err)
    return { success: false, error: err.message }
  }
}

/**
 * Replay quiz — picks 5 UNIQUE random approved questions from the DB,
 * creates/updates today's daily_quiz. No duplicates guaranteed via Fisher-Yates.
 * Returns { success, error, quizId }
 */
export async function replayQuiz() {
  try {
    const today = new Date().toISOString().split('T')[0]

    // 1. Fetch all approved question IDs
    const { data: allQ, error: qErr } = await supabase
      .from('questions')
      .select('id')
      .eq('status', 'approved')

    if (qErr) throw qErr
    if (!allQ || allQ.length < 5) throw new Error('Not enough approved questions (need 5)')

    // 2. Fisher-Yates shuffle for true randomness
    const arr = [...allQ]
    fisherYatesShuffle(arr)
    const picked = arr.slice(0, 5).map((q) => q.id)

    // 3. Safety check — no duplicates
    const uniquePicked = [...new Set(picked)]
    if (uniquePicked.length < 5) throw new Error('Duplicate questions detected, retry')

    // 4. Check if a daily quiz already exists for today
    const { data: existing } = await supabase
      .from('daily_quizzes')
      .select('id')
      .eq('quiz_date', today)
      .single()

    if (existing) {
      const { error: uError } = await supabase
        .from('daily_quizzes')
        .update({
          question_1_id: picked[0],
          question_2_id: picked[1],
          question_3_id: picked[2],
          question_4_id: picked[3],
          question_5_id: picked[4],
        })
        .eq('id', existing.id)

      if (uError) throw uError
      return { success: true, quizId: existing.id }
    }

    // 5. Create new daily quiz
    const { data: quiz, error: dqError } = await supabase
      .from('daily_quizzes')
      .insert({
        quiz_date: today,
        question_1_id: picked[0],
        question_2_id: picked[1],
        question_3_id: picked[2],
        question_4_id: picked[3],
        question_5_id: picked[4],
        auto_generated: false,
      })
      .select('id')
      .single()

    if (dqError) throw dqError

    return { success: true, quizId: quiz.id }
  } catch (err) {
    console.error('Replay quiz error:', err)
    return { success: false, error: err.message }
  }
}
