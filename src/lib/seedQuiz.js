import { supabase } from './supabase'

/**
 * 5 seed questions covering each category — for testing without the Edge Function.
 */
const SEED_QUESTIONS = [
  {
    question_en: 'Which company became Europe\'s most valuable startup after its 2023 re-valuation?',
    question_fr: 'Quelle entreprise est devenue la startup la plus valorisee d\'Europe apres sa re-evaluation en 2023 ?',
    answer_1_en: 'Klarna', answer_1_fr: 'Klarna',
    answer_2_en: 'Revolut', answer_2_fr: 'Revolut',
    answer_3_en: 'Checkout.com', answer_3_fr: 'Checkout.com',
    answer_4_en: 'Adyen', answer_4_fr: 'Adyen',
    correct_answer_index: 1,
    explanation_en: 'Klarna regained its position as Europe\'s most valuable private fintech after raising new funding at a significantly higher valuation.',
    explanation_fr: 'Klarna a retrouve sa position de fintech privee la plus valorisee d\'Europe apres une nouvelle levee de fonds.',
    category: 'ecosystem_culture',
    sub_category: 'success_stories',
    difficulty: 'medium',
    status: 'approved',
    source: 'seed',
  },
  {
    question_en: 'What does "Series A" typically refer to in startup financing?',
    question_fr: 'A quoi fait reference la "Serie A" dans le financement de startups ?',
    answer_1_en: 'The first significant round of venture capital financing',
    answer_1_fr: 'Le premier tour significatif de financement par capital-risque',
    answer_2_en: 'An IPO on a secondary market',
    answer_2_fr: 'Une introduction en bourse sur un marche secondaire',
    answer_3_en: 'A government grant for innovation',
    answer_3_fr: 'Une subvention gouvernementale pour l\'innovation',
    answer_4_en: 'A debt financing round from banks',
    answer_4_fr: 'Un tour de financement par dette bancaire',
    correct_answer_index: 1,
    explanation_en: 'Series A is typically the first significant round of venture capital financing, following seed funding, used to optimize products and scale user base.',
    explanation_fr: 'La Serie A est generalement le premier tour significatif de capital-risque, utilise pour optimiser le produit et developper la base utilisateurs.',
    category: 'foundational_knowledge',
    sub_category: 'funding_stages',
    difficulty: 'easy',
    status: 'approved',
    source: 'seed',
  },
  {
    question_en: 'What is a good monthly burn rate for a pre-Series A startup with $2M in funding?',
    question_fr: 'Quel est un bon taux de burn mensuel pour une startup pre-Serie A avec 2M$ de financement ?',
    answer_1_en: '$80K-120K/month (18-24 months runway)',
    answer_1_fr: '80K-120K$/mois (18-24 mois de runway)',
    answer_2_en: '$500K/month',
    answer_2_fr: '500K$/mois',
    answer_3_en: '$10K/month',
    answer_3_fr: '10K$/mois',
    answer_4_en: '$1M/month',
    answer_4_fr: '1M$/mois',
    correct_answer_index: 1,
    explanation_en: 'A good burn rate maintains 18-24 months of runway. With $2M funding, that means $80K-120K/month, balancing growth speed with financial prudence.',
    explanation_fr: 'Un bon taux de burn maintient 18-24 mois de runway. Avec 2M$, cela signifie 80K-120K$/mois.',
    category: 'kpis_expert',
    sub_category: 'financial_metrics',
    difficulty: 'hard',
    status: 'approved',
    source: 'seed',
  },
  {
    question_en: 'Which AI model architecture powers most modern large language models like GPT and Claude?',
    question_fr: 'Quelle architecture de modele IA alimente la plupart des grands modeles de langage comme GPT et Claude ?',
    answer_1_en: 'Transformer',
    answer_1_fr: 'Transformer',
    answer_2_en: 'Convolutional Neural Network (CNN)',
    answer_2_fr: 'Reseau de neurones convolutif (CNN)',
    answer_3_en: 'Recurrent Neural Network (RNN)',
    answer_3_fr: 'Reseau de neurones recurrent (RNN)',
    answer_4_en: 'Generative Adversarial Network (GAN)',
    answer_4_fr: 'Reseau antagoniste generatif (GAN)',
    correct_answer_index: 1,
    explanation_en: 'The Transformer architecture, introduced in the 2017 paper "Attention Is All You Need", is the foundation of virtually all modern LLMs including GPT, Claude, and Llama.',
    explanation_fr: 'L\'architecture Transformer, introduite en 2017, est le fondement de pratiquement tous les LLMs modernes.',
    category: 'trends_tech',
    sub_category: 'ai_technology',
    difficulty: 'medium',
    status: 'approved',
    source: 'seed',
  },
  {
    question_en: 'Compared to public equities, what is a key disadvantage of startup investing?',
    question_fr: 'Comparee aux actions cotees, quel est un inconvenient cle de l\'investissement en startups ?',
    answer_1_en: 'Very low liquidity — you can\'t easily sell your shares',
    answer_1_fr: 'Tres faible liquidite — on ne peut pas facilement vendre ses parts',
    answer_2_en: 'Lower potential returns',
    answer_2_fr: 'Des rendements potentiels plus faibles',
    answer_3_en: 'Too much regulatory oversight',
    answer_3_fr: 'Trop de surveillance reglementaire',
    answer_4_en: 'No tax advantages',
    answer_4_fr: 'Aucun avantage fiscal',
    correct_answer_index: 1,
    explanation_en: 'Startup investments are highly illiquid — there\'s typically no secondary market, and exits can take 7-10 years through IPO or acquisition.',
    explanation_fr: 'Les investissements en startups sont tres illiquides — il n\'y a generalement pas de marche secondaire, et les sorties prennent 7-10 ans.',
    category: 'startups_vs_assets',
    sub_category: 'risk_comparison',
    difficulty: 'easy',
    status: 'approved',
    source: 'seed',
  },
]

/**
 * Seeds 5 test questions and creates a daily_quiz for today.
 * Returns { success, error, quizId }
 */
export async function seedTestQuiz() {
  try {
    // 1. Insert seed questions (upsert to avoid duplicates)
    const { data: questions, error: qError } = await supabase
      .from('questions')
      .insert(SEED_QUESTIONS)
      .select('id')

    if (qError) throw qError

    const questionIds = questions.map((q) => q.id)

    // 2. Get today's date in YYYY-MM-DD format
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
          question_ids: questionIds,
          status: 'active',
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
        question_ids: questionIds,
        status: 'active',
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
