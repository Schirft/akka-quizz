// Quiz UI translations — encouragements, results, CTA
// Used by QuizPage and QuizResultsPage

const quizTexts = {
  // Speech bubble encouragements (shown after correct answers)
  encouragements: {
    en: [
      "On fire!", "Keep going!", "Nailed it!", "Smart move!",
      "Brilliant!", "Champion!", "Impressive!", "Unstoppable!"
    ],
    fr: [
      "En feu !", "Continue !", "Dans le mille !", "Bien joué !",
      "Brillant !", "Champion !", "Impressionnant !", "Inarrêtable !"
    ],
    it: [
      "In fiamme!", "Continua così!", "Perfetto!", "Ben fatto!",
      "Brillante!", "Campione!", "Impressionante!", "Inarrestabile!"
    ],
    es: [
      "¡En racha!", "¡Sigue así!", "¡Diana!", "¡Bien pensado!",
      "¡Brillante!", "¡Campeón!", "¡Impresionante!", "¡Imparable!"
    ],
  },

  // Combo messages
  combo: {
    en: "Combo!",
    fr: "Combo !",
    it: "Combo!",
    es: "¡Combo!",
  },

  // Wrong answer encouragement
  wrongAnswer: {
    en: "Almost! Here's why…",
    fr: "Presque ! Voici pourquoi…",
    it: "Quasi! Ecco perché…",
    es: "¡Casi! Aquí está el porqué…",
  },

  // How members answered
  membersAnswered: {
    en: "How Akka members answered",
    fr: "Comment les membres Akka ont répondu",
    it: "Come hanno risposto i membri Akka",
    es: "Cómo respondieron los miembros de Akka",
  },

  // Results page — score messages
  scoreMessages: {
    5: {
      en: "Perfect Score!", fr: "Score parfait !",
      it: "Punteggio perfetto!", es: "¡Puntuación perfecta!",
    },
    4: {
      en: "Almost perfect!", fr: "Presque parfait !",
      it: "Quasi perfetto!", es: "¡Casi perfecto!",
    },
    3: {
      en: "Good job!", fr: "Bien joué !",
      it: "Ben fatto!", es: "¡Buen trabajo!",
    },
    2: {
      en: "Keep learning!", fr: "Continue d'apprendre !",
      it: "Continua a imparare!", es: "¡Sigue aprendiendo!",
    },
    1: {
      en: "Try again tomorrow!", fr: "Réessaie demain !",
      it: "Riprova domani!", es: "¡Inténtalo mañana!",
    },
    0: {
      en: "Don't give up!", fr: "N'abandonne pas !",
      it: "Non mollare!", es: "¡No te rindas!",
    },
  },

  // Results page
  betterThan: {
    en: "You scored better than", fr: "Tu as fait mieux que",
    it: "Hai fatto meglio di", es: "Has superado al",
  },
  ofMembers: {
    en: "of Akka members", fr: "des membres Akka",
    it: "dei membri Akka", es: "de los miembros de Akka",
  },
  comeBackTomorrow: {
    en: "Come back tomorrow for your next quiz!",
    fr: "Reviens demain pour ton prochain quiz !",
    it: "Torna domani per il prossimo quiz!",
    es: "¡Vuelve mañana para tu próximo quiz!",
  },

  // XP Breakdown
  xpCorrectAnswers: {
    en: "Correct answers", fr: "Bonnes réponses",
    it: "Risposte corrette", es: "Respuestas correctas",
  },
  xpComboBonus: {
    en: "Combo bonus", fr: "Bonus combo",
    it: "Bonus combo", es: "Bonus combo",
  },
  xpStreakBonus: {
    en: "Streak bonus", fr: "Bonus série",
    it: "Bonus serie", es: "Bonus racha",
  },
  xpDailyBonus: {
    en: "Daily bonus", fr: "Bonus quotidien",
    it: "Bonus giornaliero", es: "Bonus diario",
  },
  xpTotal: {
    en: "Total XP earned", fr: "Total XP gagnés",
    it: "XP totali guadagnati", es: "XP totales ganados",
  },
};

export function getQuizText(key, lang = 'en') {
  const text = quizTexts[key];
  if (!text) return '';
  return text[lang] || text['en'] || '';
}

export function getRandomEncouragement(lang = 'en') {
  const list = quizTexts.encouragements[lang] || quizTexts.encouragements['en'];
  return list[Math.floor(Math.random() * list.length)];
}

export function getScoreMessage(score, lang = 'en') {
  const msg = quizTexts.scoreMessages[Math.min(score, 5)] || quizTexts.scoreMessages[0];
  return msg[lang] || msg['en'];
}

export default quizTexts;
