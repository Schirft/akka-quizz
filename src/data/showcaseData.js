// Showcase data for the financial education app
// 15 complete quiz packs covering startup investing topics

export const SHOWCASE_PACKS = [
  // ============================================================
  // PACK 1: Cap Tables & Dilution
  // ============================================================
  {
    id: 'pack_01',
    theme: 'Cap Tables & Dilution',
    theme_fr: 'Tables de capitalisation & Dilution',
    difficulty: 'Hard',
    icon: '',
    visual_type: 'cap_table',
    questions: [
      {
        id: 'q_01_1',
        question_en: 'A startup has 10M authorized shares. Founders hold 6M, investors 3M, and the ESOP pool is 1.5M shares. What is the actual fully diluted ownership of the founders?',
        question_fr: 'Une startup a 10M d\'actions autorisees. Les fondateurs detiennent 6M, les investisseurs 3M et le pool ESOP est de 1,5M d\'actions. Quelle est la participation reelle des fondateurs en fully diluted ?',
        answers_en: ['60%', '57.1%', '50%', '66.7%'],
        answers_fr: ['60%', '57,1%', '50%', '66,7%'],
        correct_answer_index: 2,
        explanation_en: 'Fully diluted ownership counts all shares: 6M / (6M + 3M + 1.5M) = 57.1%. The authorized share count is irrelevant — only outstanding plus reserved shares matter.',
        explanation_fr: 'Le fully diluted compte toutes les actions : 6M / (6M + 3M + 1,5M) = 57,1%. Le nombre d\'actions autorisees est sans importance — seules comptent les actions en circulation + reservees.',
        category: 'Foundational Knowledge'
      },
      {
        id: 'q_01_2',
        question_en: 'In a Series A round, a VC invests €2M at a €8M pre-money valuation. The ESOP pool is expanded from 10% to 15% BEFORE the round. Who bears the cost of the ESOP expansion?',
        question_fr: 'Lors d\'un tour de Series A, un VC investit 2M\u20ac a une valorisation pre-money de 8M\u20ac. Le pool ESOP est elargi de 10% a 15% AVANT le tour. Qui supporte le cout de l\'expansion du pool ESOP ?',
        answers_en: ['Only the VC investor', 'Only the founders and existing shareholders', 'Shared equally between founders and VC', 'The future employees receiving the options'],
        answers_fr: ['Uniquement l\'investisseur VC', 'Uniquement les fondateurs et actionnaires existants', 'Partage egal entre fondateurs et VC', 'Les futurs employes recevant les options'],
        correct_answer_index: 2,
        explanation_en: 'Pre-money ESOP expansion dilutes only existing shareholders (founders). The VC\'s ownership is calculated after the expansion, so they bear no dilution. This is a key term sheet negotiation point.',
        explanation_fr: 'L\'expansion ESOP en pre-money dilue uniquement les actionnaires existants (fondateurs). La part du VC est calculee apres l\'expansion, donc il n\'est pas dilue. C\'est un point de negociation cle du term sheet.',
        category: 'KPIs / Expert Knowledge'
      },
      {
        id: 'q_01_3',
        question_en: 'What is anti-dilution protection in a startup financing context?',
        question_fr: 'Qu\'est-ce que la protection anti-dilution dans le contexte du financement de startups ?',
        answers_en: ['A guarantee that share price will always increase', 'A clause that adjusts investor share price if a future round is at a lower valuation', 'Legal protection preventing the company from issuing new shares', 'Insurance against total loss of investment'],
        answers_fr: ['Une garantie que le prix de l\'action augmentera toujours', 'Une clause qui ajuste le prix de l\'action de l\'investisseur si un tour futur est a une valorisation inferieure', 'Une protection juridique empechant l\'entreprise d\'emettre de nouvelles actions', 'Une assurance contre la perte totale de l\'investissement'],
        correct_answer_index: 2,
        explanation_en: 'Anti-dilution clauses adjust the investor\'s conversion price downward if a future round is at a lower valuation (down round). Full ratchet is most investor-friendly; weighted average is more common and fairer.',
        explanation_fr: 'Les clauses anti-dilution ajustent le prix de conversion de l\'investisseur a la baisse si un tour futur est a une valorisation inferieure (down round). Le full ratchet est le plus favorable a l\'investisseur ; la moyenne ponderee est plus courante et equitable.',
        category: 'Foundational Knowledge'
      }
    ],
    puzzle: {
      id: 'pz_01',
      interaction_type: 'tap_to_spot',
      title: 'Problem of the Day',
      title_fr: 'Problème du Jour',
      hint: 'Check if the ownership percentages add up correctly.',
      hint_fr: 'Verifiez si les pourcentages de participation s\'additionnent correctement.',
      answer: 'row4',
      explanation: 'All rows total 102% (45+30+12+15), not 100%. The ESOP pool should be 13%. This inflated ESOP dilutes founders more than disclosed.',
      explanation_fr: 'Toutes les lignes totalisent 102% (45+30+12+15), pas 100%. Le pool ESOP devrait etre de 13%. Ce pool ESOP gonfle dilue les fondateurs plus que ce qui est divulgue.',
      context_data: {
        visual_type: 'cap_table',
        question_en: 'This Series A cap table was shared during due diligence. Can you spot the error?',
        question_fr: 'Cette table de capitalisation Series A a ete partagee lors de la due diligence. Pouvez-vous reperer l\'erreur ?',
        question_it: 'Questa tabella di capitalizzazione Series A è stata condivisa durante la due diligence. Riesci a trovare l\'errore?',
        question_es: 'Esta tabla de capitalización Serie A fue compartida durante la due diligence. ¿Puedes encontrar el error?',
        rows: [
          { id: 'row1', label: 'Founders', shares: 4500000, value: '45%' },
          { id: 'row2', label: 'Series A Investors', shares: 3000000, value: '30%' },
          { id: 'row3', label: 'Angel Investors', shares: 1200000, value: '12%' },
          { id: 'row4', label: 'ESOP Pool', shares: 1500000, value: '15%' }
        ]
      }
    },
    lesson: {
      id: 'ls_01',
      title_en: 'Understanding Cap Tables & Dilution',
      title_fr: 'Comprendre les tables de capitalisation et la dilution',
      content_en: '**What is a Cap Table?**\n\nA cap table shows a company\'s equity ownership structure — all shareholders, share classes, and ownership percentages.\n\n**Key Concepts**\n\n- **Pre-money valuation**: Company value before new investment\n- **Post-money valuation**: Pre-money + new investment amount\n- **Fully diluted**: Includes all shares, options, and convertibles\n- **ESOP pool**: Shares reserved for employee options, typically 10-20%\n\n**Watch Out For**\n\n- ESOP expansion before a round (dilutes founders, not new investors)\n- Anti-dilution clauses shifting ownership in down rounds\n- Unconverted SAFEs and notes that will add to dilution',
      content_fr: '**Qu\'est-ce qu\'une cap table ?**\n\nUne cap table montre la structure de propriete d\'une entreprise — tous les actionnaires, classes d\'actions et pourcentages de participation.\n\n**Concepts cles**\n\n- **Valorisation pre-money** : Valeur de l\'entreprise avant le nouvel investissement\n- **Valorisation post-money** : Pre-money + montant du nouvel investissement\n- **Fully diluted** : Inclut toutes les actions, options et convertibles\n- **Pool ESOP** : Actions reservees pour les stock-options, generalement 10-20%\n\n**Points de vigilance**\n\n- L\'expansion ESOP avant un tour (dilue les fondateurs, pas les nouveaux investisseurs)\n- Les clauses anti-dilution modifiant la repartition en down round\n- Les SAFEs et notes convertibles non encore converties qui augmenteront la dilution',
      key_takeaway_en: 'Always verify cap table percentages total exactly 100% and understand who bears ESOP expansion costs.',
      key_takeaway_fr: 'Verifiez toujours que la cap table totalise 100% et comprenez qui supporte le cout de l\'expansion ESOP.',
      theme: 'cap_tables'
    }
  },

  // ============================================================
  // PACK 2: Revenue Growth Metrics
  // ============================================================
  {
    id: 'pack_02',
    theme: 'Revenue Growth Metrics',
    theme_fr: 'Indicateurs de croissance du chiffre d\'affaires',
    difficulty: 'Medium',
    icon: '',
    visual_type: 'bar_chart',
    questions: [
      {
        id: 'q_02_1',
        question_en: 'A SaaS startup reports MRR growing from €50K to €80K over 6 months. What is the monthly growth rate (CMGR)?',
        question_fr: 'Une startup SaaS rapporte un MRR passant de 50K\u20ac a 80K\u20ac en 6 mois. Quel est le taux de croissance mensuel (CMGR) ?',
        answers_en: ['10%', '8.1%', '5%', '16.7%'],
        answers_fr: ['10%', '8,1%', '5%', '16,7%'],
        correct_answer_index: 2,
        explanation_en: 'CMGR = (80/50)^(1/6) - 1 = ~8.1%. The simple average (10%) overstates growth. CMGR gives the true compounded monthly rate.',
        explanation_fr: 'CMGR = (80/50)^(1/6) - 1 = ~8,1%. La moyenne simple (10%) surestime la croissance. Le CMGR donne le vrai taux mensuel compose.',
        category: 'KPIs / Expert Knowledge'
      },
      {
        id: 'q_02_2',
        question_en: 'Which of the following is the MOST reliable indicator of healthy revenue growth for a B2B SaaS startup?',
        question_fr: 'Lequel des indicateurs suivants est le PLUS fiable pour evaluer une croissance saine du revenu d\'une startup B2B SaaS ?',
        answers_en: ['Total registered users increasing 50% QoQ', 'Net Revenue Retention (NRR) above 120%', 'Gross merchandise value (GMV) doubling year-over-year', 'Website traffic growing 200% month-over-month'],
        answers_fr: ['Total d\'utilisateurs inscrits en hausse de 50% par trimestre', 'Retention nette du revenu (NRR) superieure a 120%', 'Valeur brute des marchandises (GMV) doublant d\'annee en annee', 'Trafic du site web en croissance de 200% mois par mois'],
        correct_answer_index: 2,
        explanation_en: 'NRR above 120% means existing customers spend 20%+ more over time through upsells, even after churn. It is the gold standard for SaaS health and product-market fit.',
        explanation_fr: 'Un NRR superieur a 120% signifie que les clients existants depensent 20%+ de plus via les upsells, meme apres le churn. C\'est le standard d\'excellence pour la sante SaaS et le product-market fit.',
        category: 'KPIs / Expert Knowledge'
      },
      {
        id: 'q_02_3',
        question_en: 'A startup claims "3x revenue growth year-over-year." Their revenue went from €100K to €300K. However, €150K came from a one-time enterprise contract. What is the organic recurring growth?',
        question_fr: 'Une startup revendique "une croissance du CA de 3x en annee glissante." Son CA est passe de 100K\u20ac a 300K\u20ac. Cependant, 150K\u20ac proviennent d\'un contrat unique avec une entreprise. Quelle est la croissance organique recurrente ?',
        answers_en: ['200%', '150%', '50%', '300%'],
        answers_fr: ['200%', '150%', '50%', '300%'],
        correct_answer_index: 3,
        explanation_en: 'Without the one-time €150K contract, recurring revenue grew from €100K to €150K — only 50% growth. One-time deals inflate metrics and are not indicators of sustainable growth.',
        explanation_fr: 'Sans le contrat ponctuel de 150K\u20ac, le revenu recurrent est passe de 100K\u20ac a 150K\u20ac — soit seulement 50% de croissance. Les contrats ponctuels gonflent les metriques et ne sont pas des indicateurs de croissance durable.',
        category: 'Foundational Knowledge'
      }
    ],
    puzzle: {
      id: 'pz_02',
      interaction_type: 'tap_to_spot',
      title: 'Problem of the Day',
      title_fr: 'Problème du Jour',
      hint: 'The CEO claims consistent 30% month-over-month growth. Check each month carefully.',
      hint_fr: 'Le CEO affirme une croissance constante de 30% mois par mois. Verifiez chaque mois attentivement.',
      answer: 'apr',
      explanation: 'April shows €195K, but 30% growth from March (€180K) should be €234K. April actually dropped ~8%. The CEO cherry-picked the overall trend while hiding this dip.',
      explanation_fr: 'Avril affiche 195K\u20ac, mais 30% de croissance depuis mars (180K\u20ac) donnerait 234K\u20ac. Avril a en fait baisse de ~8%. Le CEO a selectionne la tendance globale en cachant cette baisse.',
      context_data: {
        visual_type: 'bar_chart',
        question_en: 'The CEO claims consistent 30% MoM revenue growth. Which month breaks the pattern?',
        question_fr: 'Le CEO affirme une croissance mensuelle constante de 30%. Quel mois brise le schema ?',
        question_it: 'Il CEO afferma una crescita costante del 30% mese su mese. Quale mese rompe lo schema?',
        question_es: 'El CEO afirma un crecimiento constante del 30% mes a mes. ¿Qué mes rompe el patrón?',
        claim_en: 'CEO claims: "We have maintained 30% month-over-month revenue growth since January"',
        claim_fr: 'Le CEO affirme : "Nous avons maintenu une croissance mensuelle de 30% depuis janvier"',
        claim_it: 'Il CEO afferma: "Abbiamo mantenuto una crescita del 30% mese su mese da gennaio"',
        claim_es: 'El CEO afirma: "Hemos mantenido un crecimiento del 30% mes a mes desde enero"',
        rows: [
          { id: 'jan', label: 'Jan', value: 100000 },
          { id: 'feb', label: 'Feb', value: 130000 },
          { id: 'mar', label: 'Mar', value: 180000 },
          { id: 'apr', label: 'Apr', value: 195000 },
          { id: 'may', label: 'May', value: 260000 },
          { id: 'jun', label: 'Jun', value: 340000 }
        ]
      }
    },
    lesson: {
      id: 'ls_02',
      title_en: 'Reading Revenue Growth Like a Pro',
      title_fr: 'Lire la croissance du revenu comme un pro',
      content_en: '**Revenue Growth Basics**\n\n- **MRR**: Monthly Recurring Revenue (subscription-based)\n- **ARR**: MRR x 12, used for annual planning\n- Always ask: Is this recurring or does it include one-time deals?\n\n**Growth Rate Calculations**\n\n- **MoM**: Best for early stage, shows acceleration\n- **YoY**: Eliminates seasonality, better for mature startups\n- **CMGR**: The honest way to report multi-month growth\n\n**Red Flags**\n\n- Mixing recurring and one-time revenue without disclosure\n- Reporting bookings or GMV instead of actual revenue\n- Cherry-picking the best month-to-month comparison',
      content_fr: '**Les bases de la croissance du revenu**\n\n- **MRR** : Revenu Mensuel Recurrent (base abonnement)\n- **ARR** : MRR x 12, utilise pour la planification annuelle\n- Demandez toujours : Est-ce recurrent ou inclut-il des ventes ponctuelles ?\n\n**Calculs de taux de croissance**\n\n- **MoM** : Ideal pour le stade precoce, montre l\'acceleration\n- **YoY** : Elimine la saisonnalite, meilleur pour les startups matures\n- **CMGR** : La facon honnete de rapporter la croissance multi-mois\n\n**Signaux d\'alerte**\n\n- Melanger revenu recurrent et ponctuel sans le signaler\n- Rapporter les reservations ou le GMV au lieu du revenu reel\n- Choisir la meilleure comparaison mois par mois',
      key_takeaway_en: 'Calculate growth rates yourself using CMGR and always separate recurring revenue from one-time deals.',
      key_takeaway_fr: 'Calculez les taux de croissance vous-meme avec le CMGR et separez toujours le revenu recurrent des ventes ponctuelles.',
      theme: 'revenue_growth'
    }
  },

  // ============================================================
  // PACK 3: Term Sheet Red Flags
  // ============================================================
  {
    id: 'pack_03',
    theme: 'Term Sheet Red Flags',
    theme_fr: 'Signaux d\'alerte dans les term sheets',
    difficulty: 'Hard',
    icon: '',
    visual_type: 'term_sheet',
    questions: [
      {
        id: 'q_03_1',
        question_en: 'What does a "full ratchet" anti-dilution clause mean for founders in a down round?',
        question_fr: 'Que signifie une clause anti-dilution "full ratchet" pour les fondateurs en cas de down round ?',
        answers_en: ['Founders get additional shares to compensate', 'Investor shares are repriced to the lowest future round price, massively diluting founders', 'All shareholders are diluted equally', 'The clause prevents any future fundraising below current valuation'],
        answers_fr: ['Les fondateurs recoivent des actions supplementaires en compensation', 'Les actions de l\'investisseur sont reprices au prix le plus bas du tour futur, diluant massivement les fondateurs', 'Tous les actionnaires sont dilues egalement', 'La clause empeche toute levee de fonds future en dessous de la valorisation actuelle'],
        correct_answer_index: 2,
        explanation_en: 'Full ratchet drops the investor\'s conversion price to match any lower future round price, regardless of amount raised. This can transfer massive ownership to investors in a down round. Weighted average is far more founder-friendly.',
        explanation_fr: 'Le full ratchet baisse le prix de conversion de l\'investisseur pour correspondre a tout prix futur inferieur, quel que soit le montant leve. Cela peut transferer massivement la propriete aux investisseurs en down round. La moyenne ponderee est bien plus favorable aux fondateurs.',
        category: 'Foundational Knowledge'
      },
      {
        id: 'q_03_2',
        question_en: 'A term sheet includes a "2x participating preferred" liquidation preference. If the company sells for €20M and the investor put in €5M for 25% ownership, how much does the investor receive?',
        question_fr: 'Un term sheet inclut une preference de liquidation "2x participating preferred". Si l\'entreprise est vendue pour 20M\u20ac et que l\'investisseur a mis 5M\u20ac pour 25% de propriete, combien l\'investisseur recoit-il ?',
        answers_en: ['€5M (1x return)', '€10M (2x return)', '€12.5M (2x preference + 25% of remainder)', '€15M (3x return)'],
        answers_fr: ['5M\u20ac (retour 1x)', '10M\u20ac (retour 2x)', '12,5M\u20ac (preference 2x + 25% du reste)', '15M\u20ac (retour 3x)'],
        correct_answer_index: 3,
        explanation_en: 'The investor first gets 2x their €5M = €10M, then also takes 25% of the remaining €10M = €2.5M. Total: €12.5M, leaving founders just €7.5M despite owning 75%.',
        explanation_fr: 'L\'investisseur recoit d\'abord 2x ses 5M\u20ac = 10M\u20ac, puis prend aussi 25% des 10M\u20ac restants = 2,5M\u20ac. Total : 12,5M\u20ac, laissant aux fondateurs seulement 7,5M\u20ac malgre 75% de propriete.',
        category: 'KPIs / Expert Knowledge'
      },
      {
        id: 'q_03_3',
        question_en: 'Which term sheet clause gives investors the right to block a company sale they disagree with, even if founders and other shareholders approve?',
        question_fr: 'Quelle clause du term sheet donne aux investisseurs le droit de bloquer une vente de l\'entreprise avec laquelle ils sont en desaccord, meme si les fondateurs et autres actionnaires l\'approuvent ?',
        answers_en: ['Tag-along rights', 'Protective provisions (veto rights)', 'Right of first refusal', 'Drag-along rights'],
        answers_fr: ['Droits de suite (tag-along)', 'Clauses protectrices (droits de veto)', 'Droit de preemption', 'Droits d\'entrainement (drag-along)'],
        correct_answer_index: 2,
        explanation_en: 'Protective provisions (veto rights) let investors block M&A transactions, new share issuances, or charter changes. This can prevent exits that don\'t meet investor return expectations.',
        explanation_fr: 'Les clauses protectrices (droits de veto) permettent aux investisseurs de bloquer les transactions M&A, les nouvelles emissions d\'actions ou les modifications des statuts. Cela peut empecher des sorties ne repondant pas a leurs attentes de retour.',
        category: 'Foundational Knowledge'
      }
    ],
    puzzle: {
      id: 'pz_03',
      interaction_type: 'tap_to_spot',
      title: 'Problem of the Day',
      title_fr: 'Problème du Jour',
      hint: 'Look for a clause that dramatically shifts power away from the founding team.',
      hint_fr: 'Cherchez une clause qui transfere drastiquement le pouvoir loin de l\'equipe fondatrice.',
      answer: 'clause4',
      explanation: 'Investors get 3 of 5 board seats at Series A — highly unusual. This gives them majority control to fire the CEO or block any strategic decision. Standard is 2 founders + 1 investor + 1 independent + 1 CEO.',
      explanation_fr: 'Les investisseurs obtiennent 3 sieges sur 5 au conseil en Series A — tres inhabituel. Cela leur donne le controle majoritaire pour renvoyer le CEO ou bloquer toute decision. Le standard est 2 fondateurs + 1 investisseur + 1 independant + 1 CEO.',
      context_data: {
        visual_type: 'term_sheet',
        question_en: 'Review this Series A term sheet. Which clause should raise the biggest red flag?',
        question_fr: 'Examinez ce term sheet de Series A. Quelle clause devrait lever le plus grand signal d\'alerte ?',
        question_it: 'Esamina questo term sheet di Series A. Quale clausola dovrebbe sollevare il più grande segnale d\'allarme?',
        question_es: 'Revisa este term sheet de Serie A. ¿Qué cláusula debería levantar la mayor señal de alerta?',
        document_title: 'Series A Term Sheet',
        rows: [
          { id: 'clause1', label: 'Valuation', value: 'Pre-money: \u20ac8M, Post-money: \u20ac10M' },
          { id: 'clause2', label: 'Liquidation Preference', value: '1x non-participating preferred' },
          { id: 'clause3', label: 'Anti-dilution', value: 'Broad-based weighted average' },
          { id: 'clause4', label: 'Board Composition', value: '5 seats: 3 investor-appointed, 1 founder, 1 CEO' },
          { id: 'clause5', label: 'Vesting', value: '4-year vesting, 1-year cliff for founders' },
          { id: 'clause6', label: 'Pro-rata Rights', value: 'Investor has pro-rata rights in future rounds' }
        ]
      }
    },
    lesson: {
      id: 'ls_03',
      title_en: 'Decoding Term Sheets',
      title_fr: 'Decoder les term sheets',
      content_en: '**What is a Term Sheet?**\n\nA term sheet outlines key investment terms. It is usually non-binding but sets the framework for final legal documents.\n\n**Key Economic Terms**\n\n- **Valuation**: Pre-money determines dilution. Higher is better for founders.\n- **Liquidation Preference**: Payout order in an exit. 1x non-participating is standard.\n- **Anti-dilution**: Weighted average is fair; full ratchet is aggressive.\n\n**Key Control Terms**\n\n- **Board Composition**: Founders should maintain at least equal representation at Series A.\n- **Protective Provisions**: Investor veto rights — keep the list narrow.\n- **Drag-along**: Can force minority shareholders to join an approved sale.',
      content_fr: '**Qu\'est-ce qu\'un term sheet ?**\n\nUn term sheet decrit les termes cles d\'un investissement. Il est generalement non contraignant mais etablit le cadre des documents juridiques finaux.\n\n**Termes economiques cles**\n\n- **Valorisation** : Le pre-money determine la dilution. Plus c\'est eleve, mieux c\'est pour les fondateurs.\n- **Preference de liquidation** : Ordre de paiement en sortie. 1x non-participatif est le standard.\n- **Anti-dilution** : Moyenne ponderee est equitable ; full ratchet est agressif.\n\n**Termes de controle cles**\n\n- **Composition du conseil** : Les fondateurs doivent maintenir au moins une representation egale en Series A.\n- **Clauses protectrices** : Droits de veto des investisseurs — gardez la liste etroite.\n- **Drag-along** : Peut forcer les minoritaires a rejoindre une vente approuvee.',
      key_takeaway_en: 'The most dangerous term sheet clauses concern control (board seats, veto rights), not just valuation.',
      key_takeaway_fr: 'Les clauses les plus dangereuses concernent le controle (sieges au conseil, veto), pas seulement la valorisation.',
      theme: 'term_sheets'
    }
  },

  // ============================================================
  // PACK 4: Startup KPIs Dashboard
  // ============================================================
  {
    id: 'pack_04',
    theme: 'Startup KPIs Dashboard',
    theme_fr: 'Tableau de bord KPI des startups',
    difficulty: 'Easy',
    icon: '',
    visual_type: 'metric_cards',
    questions: [
      {
        id: 'q_04_1',
        question_en: 'Which KPI best measures whether a SaaS startup has achieved product-market fit?',
        question_fr: 'Quel KPI mesure le mieux si une startup SaaS a atteint le product-market fit ?',
        answers_en: ['Number of registered users', 'Monthly active users / registered users ratio plus NRR above 100%', 'Total funding raised', 'Number of features shipped per quarter'],
        answers_fr: ['Nombre d\'utilisateurs inscrits', 'Ratio utilisateurs actifs mensuels / inscrits plus NRR superieur a 100%', 'Total des fonds leves', 'Nombre de fonctionnalites livrees par trimestre'],
        correct_answer_index: 2,
        explanation_en: 'Product-market fit is best measured by engagement (DAU/MAU ratio) and retention (NRR > 100%). Registered users and funding raised are vanity metrics that don\'t reflect actual product fit.',
        explanation_fr: 'Le product-market fit se mesure par l\'engagement (ratio DAU/MAU) et la retention (NRR > 100%). Les utilisateurs inscrits et les fonds leves sont des metriques de vanite qui ne refletent pas le vrai product fit.',
        category: 'KPIs / Expert Knowledge'
      },
      {
        id: 'q_04_2',
        question_en: 'What is a "vanity metric" in the context of startup KPIs?',
        question_fr: 'Qu\'est-ce qu\'une "metrique de vanite" dans le contexte des KPI de startups ?',
        answers_en: ['A metric that only founders care about', 'A metric that looks impressive but does not correlate with business health or growth', 'Any metric related to social media', 'A metric that investors ignore during due diligence'],
        answers_fr: ['Une metrique dont seuls les fondateurs se soucient', 'Une metrique qui semble impressionnante mais ne correle pas avec la sante ou la croissance de l\'entreprise', 'Toute metrique liee aux reseaux sociaux', 'Une metrique que les investisseurs ignorent pendant la due diligence'],
        correct_answer_index: 2,
        explanation_en: 'Vanity metrics (downloads, registered users, page views) look impressive but don\'t indicate real traction. Actionable metrics (DAU/MAU, retention, NRR, LTV/CAC) actually correlate with business success.',
        explanation_fr: 'Les metriques de vanite (telechargements, inscrits, pages vues) semblent impressionnantes mais n\'indiquent pas une vraie traction. Les metriques actionnables (DAU/MAU, retention, NRR, LTV/CAC) correlent avec le succes.',
        category: 'Foundational Knowledge'
      },
      {
        id: 'q_04_3',
        question_en: 'A startup shows a LTV/CAC ratio of 5:1. Is this a good sign?',
        question_fr: 'Une startup affiche un ratio LTV/CAC de 5:1. Est-ce un bon signe ?',
        answers_en: ['No, it means they are spending too much on acquisition', 'Yes, but only if the payback period is under 18 months', 'Yes, it always means the business is healthy', 'No, a ratio above 3:1 means the company is underinvesting in growth'],
        answers_fr: ['Non, cela signifie qu\'ils depensent trop en acquisition', 'Oui, mais seulement si la periode de retour est inferieure a 18 mois', 'Oui, cela signifie toujours que l\'entreprise est saine', 'Non, un ratio superieur a 3:1 signifie que l\'entreprise sous-investit dans la croissance'],
        correct_answer_index: 2,
        explanation_en: 'A 5:1 LTV/CAC looks great, but the payback period matters. If it takes 36 months to recoup CAC, cash may run out first. The gold standard is 3:1+ with payback under 18 months.',
        explanation_fr: 'Un LTV/CAC de 5:1 semble excellent, mais la periode de retour compte. S\'il faut 36 mois pour recuperer le CAC, la tresorerie peut s\'epuiser. Le standard est 3:1+ avec un retour sous 18 mois.',
        category: 'KPIs / Expert Knowledge'
      }
    ],
    puzzle: {
      id: 'pz_04',
      interaction_type: 'tap_to_spot',
      title: 'Problem of the Day',
      title_fr: 'Problème du Jour',
      hint: 'Which of these metrics looks impressive but tells you nothing about real business traction?',
      hint_fr: 'Laquelle de ces metriques semble impressionnante mais ne vous dit rien sur la traction reelle de l\'entreprise ?',
      answer: 'card3',
      explanation: 'Total downloads (850K) is a classic vanity metric — it says nothing about actual usage. A startup could have 850K downloads but only 5K active users. MRR, retention, and LTV/CAC are what matter.',
      explanation_fr: 'Le total des telechargements (850K) est une metrique de vanite classique — cela ne dit rien sur l\'usage reel. Une startup peut avoir 850K telechargements et seulement 5K utilisateurs actifs. MRR, retention et LTV/CAC sont ce qui compte.',
      context_data: {
        visual_type: 'metric_cards',
        question_en: 'This startup dashboard highlights key metrics for investors. Which one is a vanity metric that hides the real picture?',
        question_fr: 'Ce tableau de bord met en avant les metriques cles pour les investisseurs. Laquelle est une metrique de vanite qui cache la realite ?',
        question_it: 'Questa dashboard evidenzia le metriche chiave per gli investitori. Quale è una metrica vanity che nasconde la realtà?',
        question_es: 'Este panel destaca las métricas clave para los inversores. ¿Cuál es una métrica vanidosa que oculta la realidad?',
        rows: [
          { id: 'card1', icon: '', label: 'MRR', value: '\u20ac45K', trend: '+12%' },
          { id: 'card2', icon: '', label: 'Net Retention', value: '118%', trend: '+3%' },
          { id: 'card3', icon: '', label: 'Total Downloads', value: '850K', trend: '+45%' },
          { id: 'card4', icon: '', label: 'LTV/CAC', value: '3.2x', trend: '+0.4' },
          { id: 'card5', icon: '', label: 'CAC Payback', value: '11 mo', trend: '-2 mo' }
        ]
      }
    },
    lesson: {
      id: 'ls_04',
      title_en: 'Startup KPIs That Actually Matter',
      title_fr: 'Les KPI de startups qui comptent vraiment',
      content_en: '**Vanity vs Actionable Metrics**\n\nVanity metrics (total users, downloads) look good but don\'t drive decisions. Actionable metrics correlate directly with business health.\n\n**Key SaaS Metrics**\n\n- **MRR/ARR**: Your recurring revenue baseline\n- **NRR**: Do existing customers spend more over time? 120%+ is exceptional\n- **LTV/CAC**: Customer lifetime value vs acquisition cost. 3:1 is the benchmark\n- **CAC Payback**: Months to recoup acquisition cost. Under 18 months is healthy\n- **Churn Rate**: Under 3% monthly for SMB, under 1% for enterprise',
      content_fr: '**Metriques de vanite vs actionnables**\n\nLes metriques de vanite (utilisateurs totaux, telechargements) sont belles mais ne guident pas les decisions. Les metriques actionnables correlent directement avec la sante de l\'entreprise.\n\n**Metriques SaaS cles**\n\n- **MRR/ARR** : Votre base de revenu recurrent\n- **NRR** : Les clients existants depensent-ils plus au fil du temps ? 120%+ est exceptionnel\n- **LTV/CAC** : Valeur vie client vs cout d\'acquisition. 3:1 est la reference\n- **CAC Payback** : Mois pour recuperer le cout d\'acquisition. Moins de 18 mois est sain\n- **Taux de churn** : Moins de 3% mensuel pour PME, moins de 1% pour enterprise',
      key_takeaway_en: 'Focus on actionable metrics (NRR, LTV/CAC, churn) over vanity metrics when evaluating startups.',
      key_takeaway_fr: 'Privilegiez les metriques actionnables (NRR, LTV/CAC, churn) aux metriques de vanite pour evaluer les startups.',
      theme: 'startup_kpis'
    }
  },

  // ============================================================
  // PACK 5: P&L Analysis
  // ============================================================
  {
    id: 'pack_05',
    theme: 'P&L Analysis',
    theme_fr: 'Analyse du compte de resultat',
    difficulty: 'Medium',
    icon: '',
    visual_type: 'pnl_table',
    questions: [
      {
        id: 'q_05_1',
        question_en: 'A startup claims 18 months of runway with €85K monthly revenue and total monthly expenses of €72K. What critical information is missing from this calculation?',
        question_fr: 'Une startup revendique 18 mois de runway avec 85K\u20ac de revenu mensuel et 72K\u20ac de depenses mensuelles totales. Quelle information critique manque a ce calcul ?',
        answers_en: ['The number of employees', 'The cash balance and whether revenue is growing or flat', 'The office location', 'The founding date'],
        answers_fr: ['Le nombre d\'employes', 'Le solde de tresorerie et si le revenu croit ou stagne', 'La localisation du bureau', 'La date de fondation'],
        correct_answer_index: 2,
        explanation_en: 'With €13K net monthly income (85K-72K), the company looks cash-flow positive. Claiming 18 months of runway suggests hidden expenses or unreliable revenue. You need the cash balance to calculate real runway.',
        explanation_fr: 'Avec 13K\u20ac de revenu net mensuel (85K-72K), l\'entreprise semble cash-flow positive. Revendiquer 18 mois de runway suggere des depenses cachees ou un revenu peu fiable. Il faut le solde de tresorerie pour calculer le vrai runway.',
        category: 'KPIs / Expert Knowledge'
      },
      {
        id: 'q_05_2',
        question_en: 'What is "gross margin" and why is it critical for SaaS startups?',
        question_fr: 'Qu\'est-ce que la "marge brute" et pourquoi est-elle critique pour les startups SaaS ?',
        answers_en: ['Total revenue minus all expenses; it shows overall profitability', 'Revenue minus cost of goods sold; SaaS should target 70-80%+ gross margins', 'Revenue minus marketing costs; it shows acquisition efficiency', 'Net income divided by revenue; it measures operational efficiency'],
        answers_fr: ['Revenu total moins toutes les depenses ; cela montre la rentabilite globale', 'Revenu moins cout des marchandises vendues ; le SaaS devrait viser 70-80%+ de marge brute', 'Revenu moins couts marketing ; cela montre l\'efficacite d\'acquisition', 'Revenu net divise par le revenu ; cela mesure l\'efficacite operationnelle'],
        correct_answer_index: 2,
        explanation_en: 'Gross margin = (Revenue - COGS) / Revenue. For SaaS, COGS includes hosting, support, and infrastructure. Healthy SaaS margins are 70-80%+. Below 60% signals scaling or structural cost issues.',
        explanation_fr: 'Marge brute = (Revenu - COGS) / Revenu. Pour le SaaS, le COGS inclut hebergement, support et infrastructure. Les marges SaaS saines sont de 70-80%+. En dessous de 60%, cela signale des problemes de scalabilite ou de couts structurels.',
        category: 'Foundational Knowledge'
      },
      {
        id: 'q_05_3',
        question_en: 'A startup reports €500K ARR with a 40% year-over-year growth rate. They are burning €50K/month and have €400K in the bank. What is their biggest risk?',
        question_fr: 'Une startup rapporte 500K\u20ac d\'ARR avec un taux de croissance annuel de 40%. Ils brulent 50K\u20ac/mois et ont 400K\u20ac en banque. Quel est leur plus grand risque ?',
        answers_en: ['Growth is too slow for VC expectations', 'They have only 8 months of runway and may not close a round in time', 'Their ARR is too low for Series A', 'The burn rate is too conservative'],
        answers_fr: ['La croissance est trop lente pour les attentes VC', 'Ils n\'ont que 8 mois de runway et pourraient ne pas boucler un tour a temps', 'Leur ARR est trop bas pour une Series A', 'Le burn rate est trop conservateur'],
        correct_answer_index: 2,
        explanation_en: '€400K / €50K burn = 8 months of runway. Fundraising takes 3-6 months, so they must start now or risk running out of cash — the classic "default dead" scenario.',
        explanation_fr: '400K\u20ac / 50K\u20ac de burn = 8 mois de runway. La levee prend 3-6 mois, ils doivent commencer maintenant ou risquer de manquer de tresorerie — le scenario classique du "default dead".',
        category: 'KPIs / Expert Knowledge'
      }
    ],
    puzzle: {
      id: 'pz_05',
      interaction_type: 'tap_to_spot',
      title: 'Problem of the Day',
      title_fr: 'Problème du Jour',
      hint: 'Look at the expense categories. Is everything classified correctly?',
      hint_fr: 'Regardez les categories de depenses. Tout est-il correctement classe ?',
      answer: 'exp4',
      explanation: '"Professional services" at \u20ac12K/mo is suspiciously vague and large. Startups often bury founder consulting fees or related-party payments in this category. It should be broken down further.',
      explanation_fr: '"Services professionnels" a 12K\u20ac/mois est suspicieusement vague et eleve. Les startups cachent souvent des honoraires de fondateurs ou des paiements a des parties liees dans cette categorie. Cela doit etre detaille.',
      context_data: {
        visual_type: 'pnl_table',
        question_en: 'Review this P&L summary. Which expense line looks suspicious and deserves deeper investigation?',
        question_fr: 'Examinez ce resume du compte de resultat. Quelle ligne de depense semble suspecte et merite une enquete approfondie ?',
        question_it: 'Esamina questo riepilogo del conto economico. Quale voce di spesa sembra sospetta e merita un\'indagine approfondita?',
        question_es: 'Revisa este resumen de P&L. ¿Qué línea de gasto parece sospechosa y merece una investigación más profunda?',
        revenue: 85000,
        claimed_runway: '18 months',
        rows: [
          { id: 'exp1', label: 'Salaries (8 FTEs)', value: '\u20ac35K/mo' },
          { id: 'exp2', label: 'Cloud & Infrastructure', value: '\u20ac6K/mo' },
          { id: 'exp3', label: 'Marketing & Ads', value: '\u20ac8K/mo' },
          { id: 'exp4', label: 'Professional Services', value: '\u20ac12K/mo' },
          { id: 'exp5', label: 'Office & Admin', value: '\u20ac4K/mo' },
          { id: 'exp6', label: 'Software & Tools', value: '\u20ac2.5K/mo' }
        ]
      }
    },
    lesson: {
      id: 'ls_05',
      title_en: 'Reading a Startup P&L Statement',
      title_fr: 'Lire le compte de resultat d\'une startup',
      content_en: '**Understanding the P&L**\n\nThe P&L shows revenue, costs, and whether the company is making or losing money. For startups, it reveals burn rate and path to profitability.\n\n**Key Lines to Examine**\n\n- **Revenue**: Recurring? Growing? Diversified across customers?\n- **COGS**: Direct delivery costs. Should be low for SaaS.\n- **Gross Margin**: Revenue - COGS. Target 70%+ for SaaS.\n- **Net Burn**: Cash out minus cash in each month\n\n**Red Flags**\n\n- Vague expense categories hiding large amounts\n- Founder compensation buried in "consulting"\n- One-time revenue booked as recurring',
      content_fr: '**Comprendre le P&L**\n\nLe compte de resultat montre revenus, couts et si l\'entreprise gagne ou perd de l\'argent. Pour les startups, il revele le burn rate et le chemin vers la rentabilite.\n\n**Lignes cles a examiner**\n\n- **Revenu** : Recurrent ? En croissance ? Diversifie entre clients ?\n- **COGS** : Couts directs de livraison. Faible pour le SaaS.\n- **Marge brute** : Revenu - COGS. Objectif 70%+ pour le SaaS.\n- **Burn net** : Sorties de tresorerie moins les entrees chaque mois\n\n**Signaux d\'alerte**\n\n- Categories de depenses vagues cachant des montants importants\n- Remuneration des fondateurs cachee dans "consulting"\n- Revenu ponctuel comptabilise comme recurrent',
      key_takeaway_en: 'Always demand expense breakdowns on vague categories and verify runway calculations use realistic assumptions.',
      key_takeaway_fr: 'Exigez toujours le detail des categories vagues et verifiez que les calculs de runway sont realistes.',
      theme: 'pnl_analysis'
    }
  },

  // ============================================================
  // PACK 6: Cohort Retention
  // ============================================================
  {
    id: 'pack_06',
    theme: 'Cohort Retention',
    theme_fr: 'Retention par cohorte',
    difficulty: 'Hard',
    icon: '',
    visual_type: 'cohort_grid',
    questions: [
      {
        id: 'q_06_1',
        question_en: 'A startup shows 85% month-1 retention across all cohorts. However, month-6 retention is only 20%. What does this suggest?',
        question_fr: 'Une startup affiche une retention de 85% au mois 1 dans toutes les cohortes. Cependant, la retention au mois 6 n\'est que de 20%. Qu\'est-ce que cela suggere ?',
        answers_en: ['The product has strong initial appeal but fails to deliver long-term value', 'This is normal for most SaaS products', 'The company needs more marketing investment', 'The pricing is too high'],
        answers_fr: ['Le produit a un attrait initial fort mais echoue a delivrer de la valeur a long terme', 'C\'est normal pour la plupart des produits SaaS', 'L\'entreprise a besoin de plus d\'investissement marketing', 'Le prix est trop eleve'],
        correct_answer_index: 1,
        explanation_en: 'A steep drop from 85% to 20% means users find initial appeal but not enough long-term value. Healthy SaaS retention should flatten after month 2-3, not keep declining. This signals a product-market fit problem.',
        explanation_fr: 'Une chute abrupte de 85% a 20% signifie que les utilisateurs trouvent un attrait initial mais pas assez de valeur long terme. La retention SaaS saine devrait se stabiliser apres le mois 2-3. C\'est un probleme de product-market fit.',
        category: 'KPIs / Expert Knowledge'
      },
      {
        id: 'q_06_2',
        question_en: 'What does it mean when later cohorts show BETTER retention than earlier cohorts?',
        question_fr: 'Que signifie le fait que les cohortes recentes montrent une MEILLEURE retention que les cohortes precedentes ?',
        answers_en: ['The market is getting bigger', 'The product is improving and delivering more value over time', 'The company is spending more on marketing', 'New users are less demanding'],
        answers_fr: ['Le marche s\'agrandit', 'Le produit s\'ameliore et delivre plus de valeur au fil du temps', 'L\'entreprise depense plus en marketing', 'Les nouveaux utilisateurs sont moins exigeants'],
        correct_answer_index: 2,
        explanation_en: 'Improving retention in newer cohorts is a strong positive signal — it usually means the product is getting better, onboarding is improving, or the team is iterating effectively.',
        explanation_fr: 'L\'amelioration de la retention dans les cohortes recentes est un signal positif fort — cela signifie generalement que le produit s\'ameliore, l\'onboarding progresse, ou l\'equipe itere efficacement.',
        category: 'KPIs / Expert Knowledge'
      },
      {
        id: 'q_06_3',
        question_en: 'A startup only shows you cohort retention data starting from their best-performing quarter. What should you do?',
        question_fr: 'Une startup ne vous montre les donnees de retention par cohorte qu\'a partir de leur meilleur trimestre. Que devriez-vous faire ?',
        answers_en: ['Accept the data as representative', 'Ask for the full historical cohort data including all quarters', 'Focus only on the most recent cohort', 'Ignore cohort data and look at aggregate retention instead'],
        answers_fr: ['Accepter les donnees comme representatives', 'Demander les donnees completes de toutes les cohortes historiques', 'Se concentrer uniquement sur la cohorte la plus recente', 'Ignorer les donnees de cohorte et regarder la retention agrege'],
        correct_answer_index: 2,
        explanation_en: 'Cherry-picking the starting point hides early poor performance or declining trends. Always request the complete cohort history. Resistance to sharing full data is itself a red flag.',
        explanation_fr: 'Choisir le point de depart cache les mauvaises performances passees ou les tendances declinantes. Demandez toujours l\'historique complet des cohortes. Le refus de partager les donnees completes est en soi un signal d\'alerte.',
        category: 'Ecosystem & Culture'
      }
    ],
    puzzle: {
      id: 'pz_06',
      interaction_type: 'tap_to_spot',
      title: 'Problem of the Day',
      title_fr: 'Problème du Jour',
      hint: 'Compare the retention patterns across cohorts. Is one behaving very differently?',
      hint_fr: 'Comparez les schemas de retention entre les cohortes. L\'une se comporte-t-elle tres differemment ?',
      answer: 'c3',
      explanation: 'Q3 2024 drops to 40% at M1 while other cohorts retain 70%+. This suggests a product issue, bad acquisition channel, or broken feature during Q3. Investors should investigate what changed.',
      explanation_fr: 'Q3 2024 chute a 40% au M1 alors que les autres cohortes retiennent 70%+. Cela suggere un probleme produit, un mauvais canal d\'acquisition, ou une fonctionnalite cassee pendant le Q3. Les investisseurs devraient enqueter.',
      context_data: {
        visual_type: 'cohort_grid',
        question_en: 'This cohort retention grid shows user retention by signup quarter. Which cohort has a major retention problem?',
        question_fr: 'Cette grille de retention par cohorte montre la retention utilisateur par trimestre d\'inscription. Quelle cohorte a un probleme de retention majeur ?',
        question_it: 'Questa griglia di retention per coorte mostra la retention degli utenti per trimestre di iscrizione. Quale coorte ha un problema di retention importante?',
        question_es: 'Esta cuadrícula de retención por cohorte muestra la retención de usuarios por trimestre de registro. ¿Qué cohorte tiene un problema de retención importante?',
        columns: ['M0', 'M1', 'M2', 'M3', 'M6'],
        rows: [
          { id: 'c1', label: 'Q1 2024', values: [100, 72, 58, 50, 35] },
          { id: 'c2', label: 'Q2 2024', values: [100, 75, 62, 54, 38] },
          { id: 'c3', label: 'Q3 2024', values: [100, 40, 22, 15, 8] },
          { id: 'c4', label: 'Q4 2024', values: [100, 78, 65, 58, 42] }
        ]
      }
    },
    lesson: {
      id: 'ls_06',
      title_en: 'Cohort Retention Analysis',
      title_fr: 'Analyse de la retention par cohorte',
      content_en: '**What is Cohort Analysis?**\n\nCohort analysis groups users by signup date and tracks retention over time, revealing trends that aggregate metrics hide.\n\n**Reading a Cohort Grid**\n\n- **Rows** = cohorts (users who joined in the same period)\n- **Columns** = time after signup (M0, M1, M2...)\n- Healthy curves flatten after month 2-3 rather than continuously declining\n\n**Benchmarks & Red Flags**\n\n- M1 retention: 60%+ for B2C, 85%+ for B2B SaaS\n- Later cohorts should retain better than earlier ones\n- One dramatically worse cohort signals a product or acquisition issue\n- Showing only recent cohorts may hide early poor performance',
      content_fr: '**Qu\'est-ce que l\'analyse par cohorte ?**\n\nL\'analyse par cohorte regroupe les utilisateurs par date d\'inscription et suit leur retention, revelant des tendances que les metriques agregees cachent.\n\n**Lire une grille de cohorte**\n\n- **Lignes** = cohortes (utilisateurs inscrits a la meme periode)\n- **Colonnes** = periodes apres l\'inscription (M0, M1, M2...)\n- Les courbes saines se stabilisent apres le mois 2-3 au lieu de decliner continuellement\n\n**Benchmarks et signaux d\'alerte**\n\n- Retention M1 : 60%+ pour B2C, 85%+ pour B2B SaaS\n- Les cohortes recentes devraient mieux retenir que les anciennes\n- Une cohorte dramatiquement pire signale un probleme produit ou d\'acquisition\n- Ne montrer que les cohortes recentes peut cacher de mauvaises performances passees',
      key_takeaway_en: 'Always request full cohort history and watch for individual cohorts that break the pattern.',
      key_takeaway_fr: 'Demandez toujours l\'historique complet des cohortes et surveillez celles qui brisent le schema.',
      theme: 'cohort_retention'
    }
  },

  // ============================================================
  // PACK 7: Funding Rounds
  // ============================================================
  {
    id: 'pack_07',
    theme: 'Funding Rounds',
    theme_fr: 'Tours de financement',
    difficulty: 'Medium',
    icon: '',
    visual_type: 'funding_timeline',
    questions: [
      {
        id: 'q_07_1',
        question_en: 'A startup raised a Seed at €3M valuation, Series A at €15M, and now seeks Series B. The Series B lead proposes €10M valuation. What is this called?',
        question_fr: 'Une startup a leve un Seed a 3M\u20ac de valorisation, Series A a 15M\u20ac, et cherche maintenant une Series B. Le lead du Series B propose une valorisation de 10M\u20ac. Comment appelle-t-on cela ?',
        answers_en: ['A flat round', 'A down round', 'A bridge round', 'A recap round'],
        answers_fr: ['Un tour plat (flat round)', 'Un tour baissier (down round)', 'Un tour relais (bridge round)', 'Un tour de recapitalisation'],
        correct_answer_index: 2,
        explanation_en: 'A down round means raising at a lower valuation than the previous round. It triggers anti-dilution clauses and signals unmet growth expectations. Very dilutive for founders and early investors.',
        explanation_fr: 'Un down round signifie lever a une valorisation inferieure au tour precedent. Cela declenche les clauses anti-dilution et signale des attentes de croissance non atteintes. Tres dilutif pour fondateurs et premiers investisseurs.',
        category: 'Foundational Knowledge'
      },
      {
        id: 'q_07_2',
        question_en: 'What is the typical expected valuation step-up between a Seed round and Series A for a high-performing startup?',
        question_fr: 'Quelle est l\'augmentation de valorisation typiquement attendue entre un tour de Seed et une Series A pour une startup performante ?',
        answers_en: ['2x (double)', '3-5x', '10x+', '1.5x'],
        answers_fr: ['2x (double)', '3-5x', '10x+', '1,5x'],
        correct_answer_index: 2,
        explanation_en: 'High-performing startups typically see a 3-5x valuation step-up from Seed to Series A, reflecting strong product and revenue progress. Below 2x often signals underwhelming traction.',
        explanation_fr: 'Les startups performantes voient typiquement une augmentation de 3-5x du Seed a la Series A, refletant de forts progres produit et revenu. En dessous de 2x, cela signale souvent une traction decevante.',
        category: 'Foundational Knowledge'
      },
      {
        id: 'q_07_3',
        question_en: 'Why might a startup choose a convertible note or SAFE over a priced equity round?',
        question_fr: 'Pourquoi une startup pourrait-elle choisir une note convertible ou un SAFE plutot qu\'un tour de financement en equity ?',
        answers_en: ['Convertible instruments always give better terms to founders', 'It defers valuation negotiation and is faster and cheaper to close', 'It eliminates dilution entirely', 'Investors prefer it because it guarantees returns'],
        answers_fr: ['Les instruments convertibles donnent toujours de meilleures conditions aux fondateurs', 'Cela differe la negociation de valorisation et c\'est plus rapide et moins cher a conclure', 'Cela elimine entierement la dilution', 'Les investisseurs le preferent car cela garantit des rendements'],
        correct_answer_index: 2,
        explanation_en: 'SAFEs and convertible notes defer valuation to the next priced round, are simpler documents, and close faster. They don\'t eliminate dilution — they just postpone calculating it via the discount and cap.',
        explanation_fr: 'Les SAFEs et notes convertibles reportent la valorisation au prochain tour price, sont plus simples et se concluent plus vite. Ils n\'eliminent pas la dilution — ils reportent juste son calcul via la decote et le cap.',
        category: 'Foundational Knowledge'
      }
    ],
    puzzle: {
      id: 'pz_07',
      interaction_type: 'tap_to_spot',
      title: 'Problem of the Day',
      title_fr: 'Problème du Jour',
      hint: 'Compare valuations across rounds. Does the progression make sense?',
      hint_fr: 'Comparez les valorisations entre les tours. La progression est-elle logique ?',
      answer: 'r3',
      explanation: 'The Bridge raised \u20ac800K at \u20ac7M valuation, but the previous Series A was at \u20ac12M — a 42% drop. This is a hidden down round disguised as a "bridge" to sound routine.',
      explanation_fr: 'Le Bridge a leve 800K\u20ac a 7M\u20ac de valorisation, mais la Series A precedente etait a 12M\u20ac — une baisse de 42%. C\'est un down round cache deguise en "bridge" pour paraitre anodin.',
      context_data: {
        visual_type: 'funding_timeline',
        question_en: 'Review this startup\'s funding history. One round is actually a disguised down round. Which one?',
        question_fr: 'Examinez l\'historique de financement de cette startup. Un tour est en fait un down round deguise. Lequel ?',
        question_it: 'Esamina la storia dei finanziamenti di questa startup. Un round è in realtà un down round mascherato. Quale?',
        question_es: 'Revisa el historial de financiación de esta startup. Una ronda es en realidad una ronda a la baja disfrazada. ¿Cuál?',
        rows: [
          { id: 'r1', label: 'Seed', amount: 500000, valuation: 3000000, date: '2022-01' },
          { id: 'r2', label: 'Series A', amount: 3000000, valuation: 12000000, date: '2023-06' },
          { id: 'r3', label: 'Bridge', amount: 800000, valuation: 7000000, date: '2024-03' },
          { id: 'r4', label: 'Series B', amount: 8000000, valuation: 25000000, date: '2025-01' }
        ]
      }
    },
    lesson: {
      id: 'ls_07',
      title_en: 'Navigating Startup Funding Rounds',
      title_fr: 'Naviguer les tours de financement des startups',
      content_en: '**The Funding Lifecycle**\n\n- **Pre-seed**: \u20ac50K-500K. Idea stage.\n- **Seed**: \u20ac500K-3M. MVP or early traction.\n- **Series A**: \u20ac3-15M. Proven product-market fit.\n- **Series B+**: \u20ac10M+. Scaling a proven model.\n\n**Valuation Step-ups**\n\nTypical: Seed to A (3-5x), A to B (2-3x). Each round should reflect meaningful progress.\n\n**Watch Out For**\n\n- **Down rounds**: Lower valuation than previous. Triggers anti-dilution.\n- **Bridge rounds**: Can be healthy or a red flag if valuation drops.\n- **Flat rounds**: Same valuation — may signal stagnation.',
      content_fr: '**Le cycle de financement**\n\n- **Pre-seed** : 50K-500K\u20ac. Stade de l\'idee.\n- **Seed** : 500K-3M\u20ac. MVP ou traction initiale.\n- **Series A** : 3-15M\u20ac. Product-market fit prouve.\n- **Series B+** : 10M\u20ac+. Passage a l\'echelle d\'un modele prouve.\n\n**Augmentations de valorisation**\n\nTypiques : Seed a A (3-5x), A a B (2-3x). Chaque tour devrait refleter des progres significatifs.\n\n**Points de vigilance**\n\n- **Down rounds** : Valorisation inferieure au tour precedent. Declenche l\'anti-dilution.\n- **Bridge rounds** : Peut etre sain ou un signal d\'alerte si la valorisation baisse.\n- **Flat rounds** : Meme valorisation — peut signaler la stagnation.',
      key_takeaway_en: 'Always compare round valuations — bridge rounds at lower valuations are down rounds in disguise.',
      key_takeaway_fr: 'Comparez toujours les valorisations — les bridge rounds a valorisation inferieure sont des down rounds deguises.',
      theme: 'funding_rounds'
    }
  },

  // ============================================================
  // PACK 8: Unit Economics
  // ============================================================
  {
    id: 'pack_08',
    theme: 'Unit Economics',
    theme_fr: 'Economie unitaire',
    difficulty: 'Hard',
    icon: '',
    visual_type: 'unit_economics',
    questions: [
      {
        id: 'q_08_1',
        question_en: 'A SaaS startup charges \u20ac49.99/user/month. Hosting costs \u20ac3.20/user, support \u20ac4.50/user, and payment processing \u20ac1.50/user. What is the gross margin?',
        question_fr: 'Une startup SaaS facture 49,99\u20ac/utilisateur/mois. L\'hebergement coute 3,20\u20ac/utilisateur, le support 4,50\u20ac/utilisateur et le traitement des paiements 1,50\u20ac/utilisateur. Quelle est la marge brute ?',
        answers_en: ['81.6%', '72.0%', '90.4%', '76.2%'],
        answers_fr: ['81,6%', '72,0%', '90,4%', '76,2%'],
        correct_answer_index: 1,
        explanation_en: 'COGS = \u20ac3.20 + \u20ac4.50 + \u20ac1.50 = \u20ac9.20. Gross margin = (49.99 - 9.20) / 49.99 = 81.6%. This is healthy, well above the 70% SaaS benchmark.',
        explanation_fr: 'COGS = 3,20\u20ac + 4,50\u20ac + 1,50\u20ac = 9,20\u20ac. Marge brute = (49,99 - 9,20) / 49,99 = 81,6%. C\'est sain, bien au-dessus du benchmark SaaS de 70%.',
        category: 'KPIs / Expert Knowledge'
      },
      {
        id: 'q_08_2',
        question_en: 'Why is it a problem when a startup classifies customer success salaries as operating expense instead of COGS?',
        question_fr: 'Pourquoi est-ce un probleme quand une startup classe les salaires du customer success en charge operationnelle plutot qu\'en COGS ?',
        answers_en: ['It makes the tax bill higher', 'It artificially inflates gross margins, making the business look more scalable than it is', 'It has no impact on financial analysis', 'It only matters for public companies'],
        answers_fr: ['Cela augmente la facture fiscale', 'Cela gonfle artificiellement les marges brutes, faisant paraitre l\'entreprise plus scalable qu\'elle ne l\'est', 'Cela n\'a aucun impact sur l\'analyse financiere', 'Cela ne concerne que les entreprises cotees'],
        correct_answer_index: 2,
        explanation_en: 'If customer success is essential to product delivery, it belongs in COGS. Classifying it as opex artificially inflates gross margins — one of the most common SaaS accounting tricks.',
        explanation_fr: 'Si le customer success est essentiel a la livraison du produit, il appartient au COGS. Le classer en opex gonfle artificiellement les marges brutes — l\'un des tours comptables SaaS les plus courants.',
        category: 'KPIs / Expert Knowledge'
      },
      {
        id: 'q_08_3',
        question_en: 'A startup has a CAC of \u20ac200 and LTV of \u20ac600. The payback period is 14 months. Should you invest?',
        question_fr: 'Une startup a un CAC de 200\u20ac et un LTV de 600\u20ac. La periode de retour est de 14 mois. Devriez-vous investir ?',
        answers_en: ['Yes, LTV/CAC of 3x is the gold standard', 'Probably yes, but verify how LTV is calculated and what churn assumptions are used', 'No, 14-month payback is too long', 'Yes, these are perfect metrics'],
        answers_fr: ['Oui, un LTV/CAC de 3x est le standard d\'excellence', 'Probablement oui, mais verifiez comment le LTV est calcule et quelles hypotheses de churn sont utilisees', 'Non, 14 mois de retour c\'est trop long', 'Oui, ce sont des metriques parfaites'],
        correct_answer_index: 2,
        explanation_en: 'The 3x LTV/CAC and 14-month payback look good, but verify: Is LTV based on actual or projected data? What churn rate is assumed? Many startups use optimistic assumptions that inflate LTV.',
        explanation_fr: 'Le LTV/CAC de 3x et le retour en 14 mois semblent bons, mais verifiez : Le LTV est-il base sur des donnees reelles ou projetees ? Quel churn est suppose ? Beaucoup de startups utilisent des hypotheses optimistes qui gonflent le LTV.',
        category: 'Trends & Tech'
      }
    ],
    puzzle: {
      id: 'pz_08',
      interaction_type: 'tap_to_spot',
      title: 'Problem of the Day',
      title_fr: 'Problème du Jour',
      hint: 'The startup claims 72% gross margin. Check if all costs are in the right bucket.',
      hint_fr: 'La startup revendique 72% de marge brute. Verifiez si tous les couts sont dans la bonne categorie.',
      answer: 'o1',
      explanation: '"Onboarding specialists" (\u20ac6.00/user) is in opex but should be COGS since it is a direct product delivery cost. Moving it drops gross margin from 72% to 60%, below the 70% SaaS threshold.',
      explanation_fr: '"Specialistes d\'onboarding" (6,00\u20ac/utilisateur) est en opex mais devrait etre en COGS car c\'est un cout direct de livraison. Le deplacer fait passer la marge brute de 72% a 60%, sous le seuil SaaS de 70%.',
      context_data: {
        visual_type: 'unit_economics',
        question_en: 'This SaaS startup claims 72% gross margin. Find the misclassified cost that inflates this number.',
        question_it: 'Questa startup SaaS afferma di avere un margine lordo del 72%. Trova il costo classificato erroneamente che gonfia questo numero.',
        question_es: 'Esta startup SaaS afirma tener un margen bruto del 72%. Encuentra el costo mal clasificado que infla este número.',
        question_fr: 'Cette startup SaaS revendique 72% de marge brute. Trouvez le cout mal classe qui gonfle ce chiffre.',
        revenue_per_unit: 49.99,
        claimed_gross_margin: '72%',
        rows: [
          { id: 'c1', section: 'cogs', label: 'Cloud Hosting', value: '\u20ac3.20' },
          { id: 'c2', section: 'cogs', label: 'Customer Support', value: '\u20ac4.50' },
          { id: 'c3', section: 'cogs', label: 'Payment Processing', value: '\u20ac1.50' },
          { id: 'c4', section: 'cogs', label: 'Data Storage', value: '\u20ac1.80' },
          { id: 'o1', section: 'opex', label: 'Onboarding Specialists', value: '\u20ac6.00' },
          { id: 'o2', section: 'opex', label: 'Marketing', value: '\u20ac8.00' },
          { id: 'o3', section: 'opex', label: 'R&D Salaries', value: '\u20ac12.00' }
        ]
      }
    },
    lesson: {
      id: 'ls_08',
      title_en: 'Mastering Unit Economics',
      title_fr: 'Maitriser l\'economie unitaire',
      content_en: '**What Are Unit Economics?**\n\nUnit economics measure profitability per customer or transaction. They answer: "Does this business make money at the individual level?"\n\n**Key Metrics**\n\n- **COGS**: Direct costs to deliver the product per user\n- **Gross Margin**: (Revenue - COGS) / Revenue. Target 70%+ for SaaS\n- **CAC**: Total sales + marketing / new customers acquired\n- **LTV**: Revenue x gross margin x average lifespan. Target LTV/CAC 3x+\n\n**Common Manipulation**\n\n- Misclassifying COGS as opex to inflate gross margin\n- Using projected LTV instead of actual data\n- Excluding acquisition channels from CAC calculation',
      content_fr: '**Qu\'est-ce que l\'economie unitaire ?**\n\nL\'economie unitaire mesure la rentabilite par client ou transaction. Elle repond a : "L\'entreprise gagne-t-elle de l\'argent au niveau individuel ?"\n\n**Metriques cles**\n\n- **COGS** : Couts directs pour livrer le produit par utilisateur\n- **Marge brute** : (Revenu - COGS) / Revenu. Objectif 70%+ pour le SaaS\n- **CAC** : Cout total ventes + marketing / nouveaux clients acquis\n- **LTV** : Revenu x marge brute x duree moyenne. Objectif LTV/CAC 3x+\n\n**Manipulations courantes**\n\n- Mal classer le COGS en opex pour gonfler la marge brute\n- Utiliser un LTV projete au lieu de donnees reelles\n- Exclure certains canaux d\'acquisition du calcul du CAC',
      key_takeaway_en: 'Verify all product delivery costs are properly in COGS before trusting gross margin numbers.',
      key_takeaway_fr: 'Verifiez que tous les couts de livraison du produit sont bien en COGS avant de faire confiance aux marges brutes.',
      theme: 'unit_economics'
    }
  },

  // ============================================================
  // PACK 9: Investor Update Email
  // ============================================================
  {
    id: 'pack_09',
    theme: 'Investor Update Email',
    theme_fr: 'Email de mise a jour investisseur',
    difficulty: 'Medium',
    icon: '',
    visual_type: 'investor_email',
    questions: [
      {
        id: 'q_09_1',
        question_en: 'What is the primary purpose of a regular investor update email?',
        question_fr: 'Quel est l\'objectif principal d\'un email de mise a jour regulier aux investisseurs ?',
        answers_en: ['To ask for more money', 'To maintain transparency, build trust, and leverage investor networks for help', 'To fulfill a legal obligation', 'To showcase vanity metrics'],
        answers_fr: ['Demander plus d\'argent', 'Maintenir la transparence, construire la confiance et tirer parti des reseaux des investisseurs pour de l\'aide', 'Remplir une obligation legale', 'Mettre en avant des metriques de vanite'],
        correct_answer_index: 2,
        explanation_en: 'Good updates build trust through transparency on both good and bad news, and leverage investor networks with specific asks for help (intros, advice, hiring).',
        explanation_fr: 'Les bonnes mises a jour construisent la confiance par la transparence sur les bonnes et mauvaises nouvelles, et exploitent les reseaux des investisseurs avec des demandes d\'aide specifiques.',
        category: 'Ecosystem & Culture'
      },
      {
        id: 'q_09_2',
        question_en: 'In an investor update, a CEO writes: "We are exploring strategic alternatives to optimize our path forward." What does this usually mean?',
        question_fr: 'Dans une mise a jour investisseur, un CEO ecrit : "Nous explorons des alternatives strategiques pour optimiser notre trajectoire." Que signifie generalement cette formulation ?',
        answers_en: ['The company is pivoting to a new product', 'The company may be looking for an acquirer or considering shutting down', 'The company is expanding to new markets', 'The company is raising a new round'],
        answers_fr: ['L\'entreprise pivote vers un nouveau produit', 'L\'entreprise cherche peut-etre un acquereur ou envisage de fermer', 'L\'entreprise se developpe sur de nouveaux marches', 'L\'entreprise leve un nouveau tour'],
        correct_answer_index: 2,
        explanation_en: '"Exploring strategic alternatives" is corporate jargon for struggling — often meaning looking for a buyer or considering shutting down. Good news is stated directly; bad news gets wrapped in euphemisms.',
        explanation_fr: '"Explorer des alternatives strategiques" est du jargon signifiant des difficultes — souvent chercher un acquereur ou envisager de fermer. Les bonnes nouvelles sont directes ; les mauvaises sont enveloppees d\'euphemismes.',
        category: 'Ecosystem & Culture'
      },
      {
        id: 'q_09_3',
        question_en: 'Which of the following is a red flag in an investor update email?',
        question_fr: 'Lequel des elements suivants est un signal d\'alerte dans un email de mise a jour investisseur ?',
        answers_en: ['The CEO includes a "lowlights" section with honest challenges', 'Key metrics like MRR and churn are missing from the update', 'The update asks investors for specific introductions', 'The CEO mentions a team member departure and the plan to backfill'],
        answers_fr: ['Le CEO inclut une section "points negatifs" avec des defis honnetes', 'Les metriques cles comme le MRR et le churn sont absentes de la mise a jour', 'La mise a jour demande aux investisseurs des introductions specifiques', 'Le CEO mentionne le depart d\'un membre de l\'equipe et le plan pour le remplacer'],
        correct_answer_index: 2,
        explanation_en: 'Missing key metrics is a major red flag — when founders stop sharing numbers, they are usually bad. Transparency about challenges and team changes are actually positive signs.',
        explanation_fr: 'L\'absence de metriques cles est un signal d\'alerte majeur — quand les fondateurs arretent de partager les chiffres, c\'est generalement mauvais signe. La transparence sur les defis est en fait un signe positif.',
        category: 'Ecosystem & Culture'
      }
    ],
    puzzle: {
      id: 'pz_09',
      interaction_type: 'tap_to_spot',
      title: 'Problem of the Day',
      title_fr: 'Problème du Jour',
      hint: 'One paragraph buries critical negative information inside positive framing.',
      hint_fr: 'Un paragraphe enterre une information negative critique dans un cadrage positif.',
      answer: 'p3',
      explanation: 'Paragraph 3 buries devastating news in positive framing: "streamlined operations" means layoffs, "focusing on core segments" means they lost major customers, and "adjusted projections" means revenue targets were slashed. This is a classic example of a CEO burying bad news in euphemisms.',
      explanation_fr: 'Le paragraphe 3 enterre des nouvelles devastatrices dans un cadrage positif : "operations rationalisees" signifie des licenciements, "se concentrer sur les segments principaux" signifie qu\'ils ont perdu des clients importants, et "projections ajustees" signifie que les objectifs de revenu ont ete reduits. C\'est un exemple classique de CEO enterrant les mauvaises nouvelles dans des euphemismes.',
      context_data: {
        visual_type: 'investor_email',
        question_en: 'Read this Q4 investor update. One paragraph buries bad news in positive language. Which one?',
        question_fr: 'Lisez cette mise a jour investisseur du Q4. Un paragraphe enterre de mauvaises nouvelles dans un langage positif. Lequel ?',
        question_it: 'Leggi questo aggiornamento investitori del Q4. Un paragrafo nasconde cattive notizie in un linguaggio positivo. Quale?',
        question_es: 'Lee esta actualización para inversores del Q4. Un párrafo oculta malas noticias en un lenguaje positivo. ¿Cuál?',
        email_from: 'Sarah Chen, CEO',
        email_subject: 'Q4 Investor Update - TechFlow',
        email_date: 'Jan 15, 2025',
        rows: [
          { id: 'p1', value: 'Happy New Year! Q4 was a transformative quarter for TechFlow. We shipped our new analytics module and received excellent feedback from beta testers.' },
          { id: 'p2', value: 'MRR grew 8% to reach \u20ac52K. We onboarded 12 new enterprise customers, bringing our total to 89 paying accounts.' },
          { id: 'p3', value: 'We streamlined operations to improve efficiency, focusing on our core customer segments. After careful analysis, we adjusted projections for 2025 to reflect our refined go-to-market strategy.' },
          { id: 'p4', value: 'We closed our seed extension of \u20ac400K from existing investors, giving us runway through Q3 2025.' },
          { id: 'p5', value: 'Key ask: We are looking for introductions to VP-level product leaders at mid-market SaaS companies in the DACH region.' }
        ]
      }
    },
    lesson: {
      id: 'ls_09',
      title_en: 'Reading Between the Lines of Investor Updates',
      title_fr: 'Lire entre les lignes des mises a jour investisseurs',
      content_en: '**The Art of the Investor Update**\n\nInvestor updates are a window into how a CEO communicates. Great updates are transparent, specific, and actionable. Problematic ones use corporate jargon to hide bad news.\n\n**What to Look For**\n\n- **Metrics consistency**: Are the same KPIs reported every month? Missing metrics = red flag.\n- **Tone shifts**: Sudden shift from data-heavy to narrative-heavy updates often means numbers got worse.\n- **Euphemisms**: "Streamlined" (layoffs), "pivoted" (original plan failed), "strategic alternatives" (looking to sell/close).\n- **The buried paragraph**: Bad news hidden in the middle of good news.\n\n**Green Flags**\n\n- Honest "lowlights" section alongside highlights\n- Specific asks for investor help\n- Consistent metric reporting (good or bad)\n- Acknowledging challenges with a clear plan to address them\n\n**Red Flags**\n\n- Key metrics suddenly missing\n- Switching from hard metrics to qualitative narratives\n- Vague language around team changes or strategy shifts\n- No mention of cash position or runway',
      content_fr: '**L\'art de la mise a jour investisseur**\n\nLes mises a jour investisseurs sont une fenetre sur la facon dont un CEO communique. Les grandes mises a jour sont transparentes, specifiques et actionnables. Les problematiques utilisent le jargon d\'entreprise pour cacher les mauvaises nouvelles.\n\n**Ce qu\'il faut rechercher**\n\n- **Coherence des metriques** : Les memes KPI sont-ils rapportes chaque mois ? Metriques manquantes = signal d\'alerte.\n- **Changements de ton** : Un passage soudain de mises a jour riches en donnees a des recits indique souvent que les chiffres se sont degrades.\n- **Euphemismes** : "Rationalise" (licenciements), "pivote" (le plan original a echoue), "alternatives strategiques" (cherche a vendre/fermer).\n- **Le paragraphe enterre** : Les mauvaises nouvelles cachees au milieu des bonnes.\n\n**Signaux positifs**\n\n- Section "points negatifs" honnete a cote des points positifs\n- Demandes specifiques d\'aide aux investisseurs\n- Reporting metriques coherent (bon ou mauvais)\n- Reconnaissance des defis avec un plan clair pour y repondre\n\n**Signaux d\'alerte**\n\n- Metriques cles soudainement absentes\n- Passage de metriques dures a des recits qualitatifs\n- Langage vague autour des changements d\'equipe ou de strategie\n- Aucune mention de la position de tresorerie ou du runway',
      key_takeaway_en: 'When an investor update suddenly switches from hard metrics to vague narratives and euphemisms, the numbers are likely deteriorating.',
      key_takeaway_fr: 'Quand une mise a jour investisseur passe soudainement de metriques precises a des recits vagues et des euphemismes, les chiffres se deteriorent probablement.',
      theme: 'investor_updates'
    }
  },

  // ============================================================
  // PACK 10: Comparable Analysis
  // ============================================================
  {
    id: 'pack_10',
    theme: 'Comparable Analysis',
    theme_fr: 'Analyse des comparables',
    difficulty: 'Hard',
    icon: '',
    visual_type: 'comp_table',
    questions: [
      {
        id: 'q_10_1',
        question_en: 'When building a comparables table for a B2B SaaS startup valuation, which factor is MOST important for selecting comparable companies?',
        question_fr: 'Lors de la construction d\'un tableau de comparables pour la valorisation d\'une startup B2B SaaS, quel facteur est le PLUS important pour selectionner les entreprises comparables ?',
        answers_en: ['Same founding year', 'Similar business model, growth rate, and target market', 'Same number of employees', 'Headquartered in the same country'],
        answers_fr: ['Meme annee de fondation', 'Modele economique similaire, taux de croissance et marche cible', 'Meme nombre d\'employes', 'Siege social dans le meme pays'],
        correct_answer_index: 2,
        explanation_en: 'Good comparables share similar business models (SaaS vs marketplace), growth rates, target markets (SMB vs enterprise), and ideally similar gross margins. A fast-growing fintech SaaS is not comparable to a slow-growing HR SaaS just because both are SaaS.',
        explanation_fr: 'Les bons comparables partagent des modeles economiques similaires (SaaS vs marketplace), des taux de croissance, des marches cibles (PME vs enterprise), et idealement des marges brutes similaires. Un SaaS fintech en forte croissance n\'est pas comparable a un SaaS RH en croissance lente juste parce que les deux sont du SaaS.',
        category: 'KPIs / Expert Knowledge'
      },
      {
        id: 'q_10_2',
        question_en: 'A startup uses the top 3 highest-valued companies in their sector as comparables and arrives at a 15x revenue multiple. What is wrong with this approach?',
        question_fr: 'Une startup utilise les 3 entreprises les plus valorisees de leur secteur comme comparables et arrive a un multiple de 15x le revenu. Qu\'est-ce qui ne va pas avec cette approche ?',
        answers_en: ['Nothing, using top performers is standard practice', 'Cherry-picking the best comparables inflates the valuation; use the median of a broader set', 'They should use more than 3 companies', 'Revenue multiples are not used in startup valuation'],
        answers_fr: ['Rien, utiliser les meilleurs performeurs est la pratique standard', 'Selectionner les meilleurs comparables gonfle la valorisation ; utilisez la mediane d\'un ensemble plus large', 'Ils devraient utiliser plus de 3 entreprises', 'Les multiples de revenu ne sont pas utilises dans la valorisation de startups'],
        correct_answer_index: 2,
        explanation_en: 'Cherry-picking the highest-valued comparables is a common tactic to justify an inflated valuation. Best practice is to use the median of a representative set of 5-10+ companies with similar characteristics, not the top performers.',
        explanation_fr: 'Selectionner les comparables les plus valorises est une tactique courante pour justifier une valorisation gonflee. La meilleure pratique est d\'utiliser la mediane d\'un ensemble representatif de 5-10+ entreprises aux caracteristiques similaires, pas les meilleurs performeurs.',
        category: 'KPIs / Expert Knowledge'
      },
      {
        id: 'q_10_3',
        question_en: 'Why do high-growth SaaS companies command higher EV/Revenue multiples than slower-growth ones?',
        question_fr: 'Pourquoi les entreprises SaaS a forte croissance commandent-elles des multiples EV/Revenu plus eleves que celles a croissance plus lente ?',
        answers_en: ['Because they have better products', 'Because investors pay a premium for future revenue potential, reflected in higher present valuations', 'Because they have more employees', 'Because they have been operating longer'],
        answers_fr: ['Parce qu\'elles ont de meilleurs produits', 'Parce que les investisseurs paient une prime pour le potentiel de revenu futur, reflete dans des valorisations presentes plus elevees', 'Parce qu\'elles ont plus d\'employes', 'Parce qu\'elles existent depuis plus longtemps'],
        correct_answer_index: 2,
        explanation_en: 'Higher growth means faster compounding of future revenue. $10M ARR growing at 100% YoY will be worth far more in 3 years than $10M at 20%. Growth rate is the single biggest driver of SaaS valuations.',
        explanation_fr: 'Une croissance plus forte signifie une composition plus rapide du revenu futur. 10M$ d\'ARR croissant a 100% YoY vaudra bien plus dans 3 ans que 10M$ a 20%. Le taux de croissance est le principal moteur des valorisations SaaS.',
        category: 'Foundational Knowledge'
      }
    ],
    puzzle: {
      id: 'pz_10',
      interaction_type: 'tap_to_spot',
      title: 'Problem of the Day',
      title_fr: 'Problème du Jour',
      hint: 'One company in the comparables table does not belong. Look at its characteristics versus the others.',
      hint_fr: 'Une entreprise dans le tableau des comparables n\'a pas sa place. Regardez ses caracteristiques par rapport aux autres.',
      answer: 'co4',
      explanation: 'MegaCorp is a mature enterprise software company with \u20ac2B revenue and only 8% growth, trading at 18x EV/Revenue. The startup being valued is early-stage with \u20ac5M revenue growing 120%. Including MegaCorp cherry-picks a high multiple from a fundamentally different company to inflate the median. Remove it and the median drops significantly.',
      explanation_fr: 'MegaCorp est une entreprise de logiciels mature avec 2Mds\u20ac de revenu et seulement 8% de croissance, cotant a 18x EV/Revenu. La startup evaluee est en phase precoce avec 5M\u20ac de revenu croissant de 120%. Inclure MegaCorp selectionne un multiple eleve d\'une entreprise fondamentalement differente pour gonfler la mediane. En la retirant, la mediane baisse significativement.',
      context_data: {
        visual_type: 'comp_table',
        question_en: 'This comp table is used to justify a 12x EV/Revenue valuation for an early-stage SaaS startup with \u20ac5M ARR and 120% growth. Which comparable is cherry-picked?',
        question_fr: 'Ce tableau de comparables est utilise pour justifier une valorisation de 12x EV/Revenu pour une startup SaaS early-stage avec 5M\u20ac d\'ARR et 120% de croissance. Quel comparable est soigneusement choisi ?',
        question_it: 'Questa tabella di comparabili è usata per giustificare una valutazione di 12x EV/Ricavi per una startup SaaS early-stage con 5M€ di ARR e 120% di crescita. Quale comparabile è scelto ad arte?',
        question_es: 'Esta tabla de comparables se usa para justificar una valoración de 12x EV/Ingresos para una startup SaaS early-stage con 5M€ de ARR y 120% de crecimiento. ¿Qué comparable está seleccionado a conveniencia?',
        columns: ['Company', 'Revenue', 'EV/Revenue', 'Growth'],
        median_label: 'Median: 12.2x EV/Revenue',
        rows: [
          { id: 'co1', values: ['CloudSync', '\u20ac12M', '9.5x', '95%'] },
          { id: 'co2', values: ['DataPipe', '\u20ac8M', '11.0x', '110%'] },
          { id: 'co3', values: ['FlowAPI', '\u20ac15M', '8.5x', '80%'] },
          { id: 'co4', values: ['MegaCorp', '\u20ac2B', '18.0x', '8%'] },
          { id: 'co5', values: ['NexGen AI', '\u20ac6M', '14.0x', '150%'] }
        ]
      }
    },
    lesson: {
      id: 'ls_10',
      title_en: 'Comparable Analysis for Startup Valuation',
      title_fr: 'Analyse des comparables pour la valorisation de startups',
      content_en: '**What is Comparable Analysis?**\n\nComp analysis values a startup by comparing it to similar companies. The key metric is EV/Revenue. Use the median of 5-10 similar companies, not the average.\n\n**Key Pitfalls**\n\n- **Cherry-picking**: Selecting only the highest-valued comps\n- **Apples to oranges**: Comparing early-stage to mature companies\n- **Ignoring growth**: A 10x multiple means very different things at 100% vs 20% growth\n\nAlways normalize for growth rate using the Rule of 40 (growth + margin > 40%).',
      content_fr: '**Qu\'est-ce que l\'analyse des comparables ?**\n\nL\'analyse des comps valorise une startup en la comparant a des entreprises similaires. La metrique cle est EV/Revenu. Utilisez la mediane de 5-10 entreprises similaires, pas la moyenne.\n\n**Pieges courants**\n\n- **Selection biaisee** : Ne choisir que les comps les plus valorises\n- **Comparer l\'incomparable** : Comparer early-stage et entreprises matures\n- **Ignorer la croissance** : Un multiple de 10x signifie des choses tres differentes a 100% vs 20% de croissance\n\nNormalisez toujours pour la croissance avec la Regle de 40 (croissance + marge > 40%).',
      key_takeaway_en: 'Always check that comparable companies actually match in business model, growth rate, and stage - cherry-picked outliers can inflate valuations by 2-3x.',
      key_takeaway_fr: 'Verifiez toujours que les entreprises comparables correspondent reellement en modele economique, taux de croissance et stade - les valeurs aberrantes soigneusement choisies peuvent gonfler les valorisations de 2-3x.',
      theme: 'comparable_analysis'
    }
  },

  // ============================================================
  // PACK 11: Deal Comparison (AB Choice)
  // ============================================================
  {
    id: 'pack_11',
    theme: 'Deal Comparison',
    theme_fr: 'Comparaison de deals',
    difficulty: 'Medium',
    icon: '\u2696\uFE0F',
    visual_type: 'ab_choice',
    questions: [
      {
        id: 'q_11_1',
        question_en: 'What is the difference between "participating" and "non-participating" preferred stock?',
        question_fr: 'Quelle est la difference entre les actions preferentielles "participatives" et "non-participatives" ?',
        answers_en: ['Participating means the investor can vote on board matters', 'Participating preferred gets its liquidation preference AND then shares in remaining proceeds; non-participating must choose one or the other', 'Non-participating means the investor has no say in company decisions', 'There is no meaningful difference'],
        answers_fr: ['Participatif signifie que l\'investisseur peut voter sur les questions du conseil', 'Le preferentiel participatif recoit sa preference de liquidation ET participe ensuite aux produits restants ; le non-participatif doit choisir l\'un ou l\'autre', 'Non-participatif signifie que l\'investisseur n\'a pas son mot a dire dans les decisions de l\'entreprise', 'Il n\'y a pas de difference significative'],
        correct_answer_index: 2,
        explanation_en: 'Participating preferred = "double dip": investors get their preference first, then share in remaining proceeds. Non-participating must choose one or the other. This hugely impacts exit payouts.',
        explanation_fr: 'Preferentiel participatif = "double dip" : les investisseurs recoivent leur preference d\'abord, puis partagent les produits restants. Le non-participatif doit choisir l\'un ou l\'autre. Cela impacte enormement les paiements de sortie.',
        category: 'Foundational Knowledge'
      },
      {
        id: 'q_11_2',
        question_en: 'An investor offers a higher valuation but demands 2 board seats and participating preferred. Another offers a lower valuation with 1 board seat and non-participating preferred. As a founder, what should you prioritize?',
        question_fr: 'Un investisseur offre une valorisation plus elevee mais exige 2 sieges au conseil et du preferentiel participatif. Un autre offre une valorisation plus basse avec 1 siege au conseil et du preferentiel non-participatif. En tant que fondateur, que devriez-vous privilegier ?',
        answers_en: ['Always take the highest valuation', 'Consider the full terms package - control provisions and liquidation rights often matter more than valuation', 'Board seats don\'t matter at the early stage', 'Participating vs non-participating is irrelevant'],
        answers_fr: ['Toujours prendre la valorisation la plus elevee', 'Considerez l\'ensemble des termes - les clauses de controle et les droits de liquidation comptent souvent plus que la valorisation', 'Les sieges au conseil n\'importent pas au stade precoce', 'Participatif vs non-participatif est sans importance'],
        correct_answer_index: 2,
        explanation_en: 'Valuation can be undermined by aggressive terms. 2x participating preferred takes more in exits than 1x non-participating at higher valuation. Board control can mean getting fired from your own company. Always evaluate the full package.',
        explanation_fr: 'La valorisation peut etre sapee par des termes agressifs. Le participatif 2x prend plus en sortie que le non-participatif 1x a valorisation plus elevee. Le controle du conseil peut mener a votre renvoi. Evaluez toujours l\'ensemble du package.',
        category: 'Foundational Knowledge'
      },
      {
        id: 'q_11_3',
        question_en: 'What is a "drag-along" clause and when does it benefit founders?',
        question_fr: 'Qu\'est-ce qu\'une clause de "drag-along" et quand beneficie-t-elle aux fondateurs ?',
        answers_en: ['It forces minority shareholders to sell, which benefits founders when they want to exit but a small investor blocks the sale', 'It allows founders to drag the company into bankruptcy', 'It gives investors the right to force founders to work longer', 'It prevents any acquisition from happening'],
        answers_fr: ['Elle force les actionnaires minoritaires a vendre, ce qui beneficie aux fondateurs quand ils veulent sortir mais un petit investisseur bloque la vente', 'Elle permet aux fondateurs de mettre l\'entreprise en faillite', 'Elle donne aux investisseurs le droit de forcer les fondateurs a travailler plus longtemps', 'Elle empeche toute acquisition'],
        correct_answer_index: 1,
        explanation_en: 'Drag-along forces minority shareholders to join a sale approved by the majority. It helps founders close exits when small holders block. But it can also be used against founders by majority investors.',
        explanation_fr: 'Le drag-along force les minoritaires a participer a une vente approuvee par la majorite. Cela aide les fondateurs a boucler des sorties quand des petits actionnaires bloquent. Mais cela peut aussi etre utilise contre les fondateurs par les investisseurs majoritaires.',
        category: 'Foundational Knowledge'
      }
    ],
    puzzle: {
      id: 'pz_11',
      interaction_type: 'ab_choice',
      title: 'Problem of the Day',
      title_fr: 'Problème du Jour',
      hint: 'Look beyond the headline valuation. Consider board control and liquidation preferences.',
      hint_fr: 'Regardez au-dela de la valorisation affichee. Considerez le controle du conseil et les preferences de liquidation.',
      answer: 'a',
      explanation: 'Offer A wins: 1x non-participating preferred (standard), founder-majority board, and higher pre-money. Offer B\'s 2x participating preferred and investor-majority board means they could fire you and take more in any exit.',
      explanation_fr: 'L\'Offre A gagne : preferentiel non-participatif 1x (standard), conseil a majorite fondateurs, et pre-money plus eleve. Le preferentiel participatif 2x et le conseil a majorite investisseurs de l\'Offre B signifient qu\'ils pourraient vous renvoyer et prendre plus lors de toute sortie.',
      context_data: {
        question_en: 'Which deal offers better terms for the founder?',
        question_fr: 'Quel deal offre de meilleures conditions pour le fondateur ?',
        question_it: 'Quale deal offre condizioni migliori per il fondatore?',
        question_es: '¿Qué acuerdo ofrece mejores condiciones para el fundador?',
        option_a: {
          title: 'Offer A - VC Fund',
          title_fr: 'Offre A - Fonds VC',
          title_it: 'Offerta A - Fondo VC',
          title_es: 'Oferta A - Fondo VC',
          metrics: {
            'Pre-money': '\u20ac5M',
            'Investment': '\u20ac1.5M',
            'Board seats': '1 investor + 2 founders',
            'Liquidation pref': '1x non-participating',
            'Anti-dilution': 'Weighted average',
            'Vesting': '4yr / 1yr cliff (standard)'
          }
        },
        option_b: {
          title: 'Offer B - Angel Syndicate',
          title_fr: 'Offre B - Syndicat d\'anges',
          title_it: 'Offerta B - Sindacato di angeli',
          title_es: 'Oferta B - Sindicato de ángeles',
          metrics: {
            'Pre-money': '\u20ac4M',
            'Investment': '\u20ac1M',
            'Board seats': '2 investors + 1 founder',
            'Liquidation pref': '2x participating',
            'Anti-dilution': 'Full ratchet',
            'Vesting': '4yr / 1yr cliff + acceleration on change of control'
          }
        }
      }
    },
    lesson: {
      id: 'ls_11',
      title_en: 'Comparing Investment Offers',
      title_fr: 'Comparer les offres d\'investissement',
      content_en: '**Beyond the Headline Valuation**\n\nDeal terms often matter more than price. A \u20ac10M valuation with aggressive terms can leave founders worse off than \u20ac7M with clean terms.\n\n**Key Terms to Compare**\n\n- **Liquidation preference**: 1x non-participating is standard. Higher or participating is aggressive.\n- **Board composition**: Founders should keep control at seed/Series A.\n- **Anti-dilution**: Weighted average is standard; full ratchet is very investor-friendly.\n\nAlways model exit scenarios to see what founders actually receive under each offer.',
      content_fr: '**Au-dela de la valorisation affichee**\n\nLes termes du deal comptent souvent plus que le prix. Une valorisation de 10M\u20ac avec des termes agressifs peut laisser les fondateurs en pire situation que 7M\u20ac avec des termes propres.\n\n**Termes cles a comparer**\n\n- **Preference de liquidation** : 1x non-participatif est standard. Plus eleve ou participatif est agressif.\n- **Composition du conseil** : Les fondateurs doivent garder le controle au seed/Series A.\n- **Anti-dilution** : Moyenne ponderee est standard ; full ratchet est tres favorable aux investisseurs.\n\nModelisez toujours les scenarios de sortie pour voir ce que les fondateurs recoivent reellement sous chaque offre.',
      key_takeaway_en: 'A lower valuation with clean terms (1x non-participating, founder-controlled board) usually beats a higher valuation with aggressive terms.',
      key_takeaway_fr: 'Une valorisation plus basse avec des termes propres (1x non-participatif, conseil controle par les fondateurs) bat generalement une valorisation plus elevee avec des termes agressifs.',
      theme: 'deal_comparison'
    }
  },

  // ============================================================
  // PACK 12: SAFE vs Equity (AB Choice)
  // ============================================================
  {
    id: 'pack_12',
    theme: 'SAFE vs Equity',
    theme_fr: 'SAFE vs Equity',
    difficulty: 'Easy',
    icon: '',
    visual_type: 'ab_choice',
    questions: [
      {
        id: 'q_12_1',
        question_en: 'What is a SAFE (Simple Agreement for Future Equity)?',
        question_fr: 'Qu\'est-ce qu\'un SAFE (Simple Agreement for Future Equity) ?',
        answers_en: ['A type of loan that must be repaid with interest', 'An agreement where an investor gives money now in exchange for equity in a future priced round', 'A government-backed insurance for startup investments', 'A stock purchase agreement at a fixed price'],
        answers_fr: ['Un type de pret qui doit etre rembourse avec interets', 'Un accord ou un investisseur donne de l\'argent maintenant en echange d\'equity lors d\'un futur tour price', 'Une assurance gouvernementale pour les investissements en startup', 'Un contrat d\'achat d\'actions a prix fixe'],
        correct_answer_index: 2,
        explanation_en: 'A SAFE (by Y Combinator) gives capital now, converting to equity at the next priced round. Key terms: valuation cap and/or discount rate that set the conversion price.',
        explanation_fr: 'Un SAFE (par Y Combinator) fournit du capital maintenant, se convertissant en equity au prochain tour price. Termes cles : cap de valorisation et/ou taux de decote fixant le prix de conversion.',
        category: 'Foundational Knowledge'
      },
      {
        id: 'q_12_2',
        question_en: 'A startup raises \u20ac500K on a SAFE with a \u20ac5M cap. The Series A prices at \u20ac10M pre-money. At what effective valuation does the SAFE convert?',
        question_fr: 'Une startup leve 500K\u20ac sur un SAFE avec un cap de 5M\u20ac. La Series A est pricee a 10M\u20ac pre-money. A quelle valorisation effective le SAFE se convertit-il ?',
        answers_en: ['\u20ac10M (the Series A price)', '\u20ac5M (the cap)', '\u20ac7.5M (average of cap and round)', '\u20ac4.5M (cap minus discount)'],
        answers_fr: ['10M\u20ac (le prix de la Series A)', '5M\u20ac (le cap)', '7,5M\u20ac (moyenne du cap et du tour)', '4,5M\u20ac (cap moins decote)'],
        correct_answer_index: 2,
        explanation_en: 'The SAFE converts at the lower of the cap or the round price. Since the \u20ac5M cap is lower than the \u20ac10M Series A price, the SAFE investor gets shares at the \u20ac5M effective valuation - meaning they get 2x more shares per euro than the Series A investors.',
        explanation_fr: 'Le SAFE se convertit au plus bas entre le cap et le prix du tour. Comme le cap de 5M\u20ac est inferieur au prix de la Series A de 10M\u20ac, l\'investisseur SAFE obtient des actions a la valorisation effective de 5M\u20ac - ce qui signifie qu\'il obtient 2x plus d\'actions par euro que les investisseurs de la Series A.',
        category: 'Foundational Knowledge'
      },
      {
        id: 'q_12_3',
        question_en: 'What is a key risk of raising too much money via SAFEs before a priced round?',
        question_fr: 'Quel est un risque cle de lever trop d\'argent via des SAFEs avant un tour price ?',
        answers_en: ['SAFEs expire after 12 months', 'Multiple SAFEs at different caps create a complex cap table and can cause massive founder dilution when they all convert', 'SAFEs require monthly interest payments', 'There is no risk; SAFEs are always founder-friendly'],
        answers_fr: ['Les SAFEs expirent apres 12 mois', 'Plusieurs SAFEs a differents caps creent une cap table complexe et peuvent causer une dilution massive des fondateurs quand ils se convertissent tous', 'Les SAFEs necessitent des paiements d\'interets mensuels', 'Il n\'y a aucun risque ; les SAFEs sont toujours favorables aux fondateurs'],
        correct_answer_index: 2,
        explanation_en: 'Stacking multiple SAFEs creates hidden dilution only visible at conversion. Founders may not realize how much ownership they gave away until all SAFEs convert simultaneously at the priced round.',
        explanation_fr: 'Empiler plusieurs SAFEs cree une dilution cachee visible seulement a la conversion. Les fondateurs peuvent ne pas realiser combien ils ont cede jusqu\'a la conversion simultanee de tous les SAFEs au tour price.',
        category: 'Foundational Knowledge'
      }
    ],
    puzzle: {
      id: 'pz_12',
      interaction_type: 'ab_choice',
      title: 'Problem of the Day',
      title_fr: 'Problème du Jour',
      hint: 'Think about which instrument gives the investor more protection and which one is simpler for the startup.',
      hint_fr: 'Reflechissez a quel instrument offre plus de protection a l\'investisseur et lequel est plus simple pour la startup.',
      answer: 'a',
      explanation: 'The SAFE (Option A) is better: no interest, no maturity date, simpler documents, and lower legal costs. The convertible note creates repayment pressure at maturity and accrues interest. The SAFE also has a lower cap, meaning less dilution.',
      explanation_fr: 'Le SAFE (Option A) est meilleur : pas d\'interets, pas d\'echeance, documents plus simples et couts juridiques moindres. La note convertible cree une pression de remboursement a l\'echeance et accumule des interets. Le SAFE a aussi un cap plus bas, donc moins de dilution.',
      context_data: {
        question_en: 'You are a pre-seed startup. Which instrument is better for your first \u20ac300K raise?',
        question_fr: 'Vous etes une startup pre-seed. Quel instrument est meilleur pour votre premiere levee de 300K\u20ac ?',
        question_it: 'Sei una startup pre-seed. Quale strumento è migliore per la tua prima raccolta di 300K€?',
        question_es: 'Eres una startup pre-seed. ¿Qué instrumento es mejor para tu primera ronda de 300K€?',
        option_a: {
          title: 'Option A - SAFE',
          title_fr: 'Option A - SAFE',
          title_it: 'Opzione A - SAFE',
          title_es: 'Opción A - SAFE',
          metrics: {
            'Instrument': 'Post-money SAFE',
            'Amount': '\u20ac300K',
            'Valuation cap': '\u20ac3M',
            'Discount': '20%',
            'Interest': 'None',
            'Maturity date': 'None',
            'Legal cost': '~\u20ac2K'
          }
        },
        option_b: {
          title: 'Option B - Convertible Note',
          title_fr: 'Option B - Note convertible',
          title_it: 'Opzione B - Nota convertibile',
          title_es: 'Opción B - Nota convertible',
          metrics: {
            'Instrument': 'Convertible Note',
            'Amount': '\u20ac300K',
            'Valuation cap': '\u20ac4M',
            'Discount': '20%',
            'Interest': '5% annual (accruing)',
            'Maturity date': '24 months',
            'Legal cost': '~\u20ac8K'
          }
        }
      }
    },
    lesson: {
      id: 'ls_12',
      title_en: 'SAFE vs Convertible Notes vs Equity',
      title_fr: 'SAFE vs Notes convertibles vs Equity',
      content_en: '**Three Ways to Invest Early**\n\n**SAFE** — No debt, no interest, no maturity. Converts at next priced round. Standard for pre-seed/seed. Fast and cheap (\u20ac1-3K legal).\n\n**Convertible Note** — Debt that converts to equity. Has interest (4-8%) and maturity date (18-24 months). Creates repayment risk if no round happens.\n\n**Priced Equity** — Direct share purchase at set price. Full legal docs, clear cap table. Standard from Series A onward.\n\n**When to Use What**: Pre-seed → SAFE. Seed → SAFE or priced. Series A+ → Always priced.',
      content_fr: '**Trois facons d\'investir tot**\n\n**SAFE** — Pas de dette, pas d\'interets, pas d\'echeance. Se convertit au prochain tour price. Standard pour pre-seed/seed. Rapide et peu couteux (1-3K\u20ac juridique).\n\n**Note convertible** — Dette qui se convertit en equity. Interets (4-8%) et date d\'echeance (18-24 mois). Cree un risque de remboursement si pas de tour.\n\n**Equity price** — Achat direct d\'actions a prix fixe. Docs juridiques complets, cap table claire. Standard a partir de la Series A.\n\n**Quand utiliser quoi** : Pre-seed → SAFE. Seed → SAFE ou price. Series A+ → Toujours price.',
      key_takeaway_en: 'SAFEs are simpler and cheaper for early raises, but watch out for SAFE stacking - multiple SAFEs at different caps can cause surprise dilution at conversion.',
      key_takeaway_fr: 'Les SAFEs sont plus simples et moins chers pour les levees precoces, mais attention au SAFE stacking - plusieurs SAFEs a differents caps peuvent causer une dilution surprise a la conversion.',
      theme: 'safe_vs_equity'
    }
  },

  // ============================================================
  // PACK 13: Due Diligence Checklist
  // ============================================================
  {
    id: 'pack_13',
    theme: 'Due Diligence Checklist',
    theme_fr: 'Checklist de due diligence',
    difficulty: 'Easy',
    icon: '\u2705',
    visual_type: 'metric_cards',
    questions: [
      {
        id: 'q_13_1',
        question_en: 'During due diligence, you discover the startup has no written employment contracts with its founding team. What risk does this create?',
        question_fr: 'Pendant la due diligence, vous decouvrez que la startup n\'a pas de contrats de travail ecrits avec son equipe fondatrice. Quel risque cela cree-t-il ?',
        answers_en: ['No risk, verbal agreements are sufficient', 'IP ownership may be unclear, and founders could leave without vesting restrictions', 'It only matters for tax purposes', 'This is standard for early-stage startups'],
        answers_fr: ['Aucun risque, les accords verbaux suffisent', 'La propriete de la PI peut etre floue, et les fondateurs pourraient partir sans restrictions de vesting', 'Cela n\'a d\'importance que pour des raisons fiscales', 'C\'est standard pour les startups early-stage'],
        correct_answer_index: 2,
        explanation_en: 'Without written contracts, IP may belong to founders personally, they can leave unrestricted, and there\'s no non-compete protection. This weak legal foundation is a dealbreaker for most investors.',
        explanation_fr: 'Sans contrats ecrits, la PI peut appartenir aux fondateurs personnellement, ils peuvent partir sans restriction, et il n\'y a aucune protection de non-concurrence. Cette base juridique faible est eliminatoire pour la plupart des investisseurs.',
        category: 'Ecosystem & Culture'
      },
      {
        id: 'q_13_2',
        question_en: 'What is the most important thing to verify about a startup\'s intellectual property during due diligence?',
        question_fr: 'Quelle est la chose la plus importante a verifier concernant la propriete intellectuelle d\'une startup lors de la due diligence ?',
        answers_en: ['That they have filed for patents', 'That all IP is properly assigned to the company (not owned by individuals, contractors, or previous employers)', 'That they use proprietary technology', 'That they have a large patent portfolio'],
        answers_fr: ['Qu\'ils ont depose des brevets', 'Que toute la PI est correctement assignee a l\'entreprise (pas detenue par des individus, des prestataires ou des employeurs precedents)', 'Qu\'ils utilisent une technologie proprietaire', 'Qu\'ils ont un grand portefeuille de brevets'],
        correct_answer_index: 2,
        explanation_en: 'IP assignment is critical. If code was written by contractors without assignment clauses or by founders employed elsewhere, the company may not own its core technology. This is the most common DD issue.',
        explanation_fr: 'L\'assignation de PI est critique. Si le code a ete ecrit par des prestataires sans clauses d\'assignation ou des fondateurs employes ailleurs, l\'entreprise peut ne pas posseder sa technologie. C\'est le probleme de DD le plus courant.',
        category: 'Ecosystem & Culture'
      },
      {
        id: 'q_13_3',
        question_en: 'You notice a startup has 80% of its revenue from a single customer. What type of risk is this?',
        question_fr: 'Vous remarquez qu\'une startup tire 80% de son revenu d\'un seul client. Quel type de risque est-ce ?',
        answers_en: ['Technology risk', 'Customer concentration risk - if that one customer churns, the business collapses', 'Market risk', 'Regulatory risk'],
        answers_fr: ['Risque technologique', 'Risque de concentration client - si ce client part, l\'entreprise s\'effondre', 'Risque de marche', 'Risque reglementaire'],
        correct_answer_index: 2,
        explanation_en: 'At 80% revenue from one client, losing them would be catastrophic. Above 25-30% concentration is already a significant risk. Customer diversification is essential for sustainable growth.',
        explanation_fr: 'A 80% de revenu d\'un seul client, le perdre serait catastrophique. Au-dessus de 25-30% de concentration, c\'est deja un risque significatif. La diversification client est essentielle pour une croissance durable.',
        category: 'Startups vs. Other Asset Classes'
      }
    ],
    puzzle: {
      id: 'pz_13',
      interaction_type: 'tap_to_spot',
      title: 'Problem of the Day',
      title_fr: 'Problème du Jour',
      hint: 'One of these due diligence items is showing a green status but should actually be a critical concern.',
      hint_fr: 'L\'un de ces elements de due diligence affiche un statut vert mais devrait en realite etre une preoccupation critique.',
      answer: 'card4',
      explanation: 'IP assignment says "verbal agreements" but shows green. Verbal IP assignments are unenforceable — the company may not legally own its code or inventions. This should be a critical blocker, not marked complete.',
      explanation_fr: 'L\'assignation de PI dit "accords verbaux" mais affiche vert. Les assignations verbales de PI sont inexecutoires — l\'entreprise peut ne pas legalement posseder son code ou ses inventions. Cela devrait etre un bloqueur critique, pas marque comme complet.',
      context_data: {
        visual_type: 'metric_cards',
        question_en: 'Review this due diligence status board. One item is showing a green status but actually has a critical issue hiding in the details.',
        question_fr: 'Examinez ce tableau de bord de due diligence. Un element affiche un statut vert mais a en realite un probleme critique cache dans les details.',
        question_it: 'Esamina questo pannello di stato della due diligence. Un elemento mostra uno stato verde ma in realtà nasconde un problema critico nei dettagli.',
        question_es: 'Revisa este panel de estado de due diligence. Un elemento muestra un estado verde pero en realidad tiene un problema crítico oculto en los detalles.',
        rows: [
          { id: 'card1', icon: '', label: 'Employment Contracts', value: 'All signed', trend: 'Complete' },
          { id: 'card2', icon: '', label: 'Financial Audit', value: 'Clean report', trend: 'Complete' },
          { id: 'card3', icon: '', label: 'Legal Structure', value: 'SAS registered', trend: 'Complete' },
          { id: 'card4', icon: '', label: 'IP Assignment', value: 'Verbal agreements', trend: 'Complete' },
          { id: 'card5', icon: '', label: 'Customer Contracts', value: '12 active', trend: '+3 this quarter' }
        ]
      }
    },
    lesson: {
      id: 'ls_13',
      title_en: 'Due Diligence Essentials for Startup Investors',
      title_fr: 'Les essentiels de la due diligence pour les investisseurs en startups',
      content_en: '**What is Due Diligence?**\n\nDue diligence is the investigation before investing. It verifies claims, identifies risks, and ensures no hidden problems.\n\n**Key Areas**: Legal (IP, contracts), Financial (revenue, burn, cap table), Product (tech, moat), Team (backgrounds, references), Market (TAM, competition).\n\n**Common Dealbreakers**\n\n- IP not assigned to the company\n- Missing/incorrect cap table\n- Undisclosed debts or disputes\n- Customer concentration above 30%\n- Founder conflicts or missing vesting\n\nProcess takes 2-6 weeks. Even seed rounds should cover IP, cap table, and financials.',
      content_fr: '**Qu\'est-ce que la due diligence ?**\n\nLa due diligence est l\'investigation avant d\'investir. Elle verifie les affirmations, identifie les risques et s\'assure qu\'il n\'y a pas de problemes caches.\n\n**Domaines cles** : Juridique (PI, contrats), Financier (revenu, burn, cap table), Produit (tech, avantage concurrentiel), Equipe (antecedents, references), Marche (TAM, concurrence).\n\n**Criteres eliminatoires courants**\n\n- PI non assignee a l\'entreprise\n- Cap table manquante/incorrecte\n- Dettes ou litiges non divulgues\n- Concentration client superieure a 30%\n- Conflits fondateurs ou vesting manquant\n\nLe processus dure 2-6 semaines. Meme les tours seed doivent couvrir PI, cap table et finances.',
      key_takeaway_en: 'Written IP assignment agreements are non-negotiable - verbal agreements are unenforceable and represent a critical legal risk.',
      key_takeaway_fr: 'Les accords ecrits d\'assignation de PI sont non-negociables - les accords verbaux sont inexecutoires et representent un risque juridique critique.',
      theme: 'due_diligence'
    }
  },

  // ============================================================
  // PACK 14: Burn Rate Analysis
  // ============================================================
  {
    id: 'pack_14',
    theme: 'Burn Rate Analysis',
    theme_fr: 'Analyse du burn rate',
    difficulty: 'Medium',
    icon: '',
    visual_type: 'bar_chart',
    questions: [
      {
        id: 'q_14_1',
        question_en: 'What is the difference between "gross burn" and "net burn" rate?',
        question_fr: 'Quelle est la difference entre le taux de "gross burn" et le "net burn" ?',
        answers_en: ['They are the same thing', 'Gross burn is total monthly spending; net burn is spending minus revenue', 'Gross burn includes salaries; net burn excludes salaries', 'Gross burn is annual; net burn is monthly'],
        answers_fr: ['C\'est la meme chose', 'Le gross burn est les depenses mensuelles totales ; le net burn est les depenses moins le revenu', 'Le gross burn inclut les salaires ; le net burn les exclut', 'Le gross burn est annuel ; le net burn est mensuel'],
        correct_answer_index: 2,
        explanation_en: 'Gross burn = total monthly cash outflows (all expenses). Net burn = gross burn minus revenue (the actual cash being consumed from reserves). A company spending \u20ac100K/mo with \u20ac40K revenue has \u20ac100K gross burn but only \u20ac60K net burn.',
        explanation_fr: 'Gross burn = sorties de tresorerie mensuelles totales (toutes les depenses). Net burn = gross burn moins le revenu (le cash reellement consomme des reserves). Une entreprise depensant 100K\u20ac/mois avec 40K\u20ac de revenu a un gross burn de 100K\u20ac mais seulement 60K\u20ac de net burn.',
        category: 'Foundational Knowledge'
      },
      {
        id: 'q_14_2',
        question_en: 'A startup has \u20ac1.2M in the bank and burns \u20ac80K net per month. They claim 15 months of runway. However, they just signed a lease for a new office at \u20ac15K/month starting next month. What is their real runway?',
        question_fr: 'Une startup a 1,2M\u20ac en banque et brule 80K\u20ac net par mois. Ils revendiquent 15 mois de runway. Cependant, ils viennent de signer un bail pour un nouveau bureau a 15K\u20ac/mois a partir du mois prochain. Quel est leur vrai runway ?',
        answers_en: ['15 months', '12.6 months', '10 months', '8 months'],
        answers_fr: ['15 mois', '12,6 mois', '10 mois', '8 mois'],
        correct_answer_index: 2,
        explanation_en: 'New burn rate = \u20ac80K + \u20ac15K = \u20ac95K/month. Runway = \u20ac1.2M / \u20ac95K = 12.6 months. The startup\'s claim of 15 months ignores the committed new expense. Always ask about committed future expenses, not just current burn.',
        explanation_fr: 'Nouveau burn rate = 80K\u20ac + 15K\u20ac = 95K\u20ac/mois. Runway = 1,2M\u20ac / 95K\u20ac = 12,6 mois. L\'affirmation de la startup de 15 mois ignore la nouvelle depense engagee. Demandez toujours les depenses futures engagees, pas seulement le burn actuel.',
        category: 'KPIs / Expert Knowledge'
      },
      {
        id: 'q_14_3',
        question_en: 'When should a startup start fundraising relative to their remaining runway?',
        question_fr: 'Quand une startup devrait-elle commencer sa levee de fonds par rapport a son runway restant ?',
        answers_en: ['When they have 3 months left', 'When they have 6-9 months of runway remaining', 'Only when they run out of money', 'It does not matter, investors are always available'],
        answers_fr: ['Quand il reste 3 mois', 'Quand il reste 6-9 mois de runway', 'Seulement quand ils n\'ont plus d\'argent', 'Cela n\'a pas d\'importance, les investisseurs sont toujours disponibles'],
        correct_answer_index: 2,
        explanation_en: 'Fundraising takes 3-6 months. Starting with 6-9 months of runway avoids desperation pricing. Below 3 months is "emergency mode" where founders accept bad terms.',
        explanation_fr: 'La levee de fonds prend 3-6 mois. Commencer avec 6-9 mois de runway evite le pricing de desespoir. En dessous de 3 mois, c\'est le "mode urgence" ou les fondateurs acceptent de mauvais termes.',
        category: 'Ecosystem & Culture'
      }
    ],
    puzzle: {
      id: 'pz_14',
      interaction_type: 'tap_to_spot',
      title: 'Problem of the Day',
      title_fr: 'Problème du Jour',
      hint: 'The startup claims their burn rate is "stable and under control." Look at the trend carefully.',
      hint_fr: 'La startup affirme que leur burn rate est "stable et sous controle." Regardez la tendance attentivement.',
      answer: 'nov',
      explanation: 'November shows \u20ac120K — a 50% spike from October\'s \u20ac80K. The CEO claimed "stable" burn but this spike is unexplained. An unacknowledged 50% increase is a red flag suggesting poor financial discipline or hidden expenses.',
      explanation_fr: 'Novembre affiche 120K\u20ac — un pic de 50% par rapport aux 80K\u20ac d\'octobre. Le CEO affirmait un burn "stable" mais ce pic est inexplique. Une hausse de 50% non reconnue est un signal d\'alerte suggerant une mauvaise discipline financiere ou des depenses cachees.',
      context_data: {
        visual_type: 'bar_chart',
        question_en: 'The CEO says burn rate has been "stable and controlled" for the past 6 months. Which month contradicts this claim?',
        question_fr: 'Le CEO dit que le burn rate est "stable et controle" depuis 6 mois. Quel mois contredit cette affirmation ?',
        question_it: 'Il CEO dice che il burn rate \u00e8 stato "stabile e controllato" negli ultimi 6 mesi. Quale mese contraddice questa affermazione?',
        question_es: 'El CEO dice que el burn rate ha sido "estable y controlado" durante los \u00faltimos 6 meses. \u00bfQu\u00e9 mes contradice esta afirmaci\u00f3n?',
        claim_en: 'CEO states: "Our burn has remained stable at approximately \u20ac80K/month throughout H2"',
        claim_fr: 'Le CEO declare : "Notre burn est reste stable a environ 80K\u20ac/mois pendant tout le S2"',
        claim_it: 'Il CEO dichiara: "Il nostro burn \u00e8 rimasto stabile a circa \u20ac80K/mese per tutto il S2"',
        claim_es: 'El CEO declara: "Nuestro burn se ha mantenido estable en aproximadamente \u20ac80K/mes durante todo el S2"',
        rows: [
          { id: 'jul', label: 'Jul', value: 75000 },
          { id: 'aug', label: 'Aug', value: 78000 },
          { id: 'sep', label: 'Sep', value: 82000 },
          { id: 'oct', label: 'Oct', value: 80000 },
          { id: 'nov', label: 'Nov', value: 120000 },
          { id: 'dec', label: 'Dec', value: 85000 }
        ]
      }
    },
    lesson: {
      id: 'ls_14',
      title_en: 'Understanding Burn Rate & Runway',
      title_fr: 'Comprendre le burn rate et le runway',
      content_en: '**Burn Rate Fundamentals**\n\nBurn rate measures how fast a startup spends cash. It is the most critical metric for early-stage companies.\n\n**Key Calculations**\n\n- **Gross burn**: Total monthly expenses\n- **Net burn**: Expenses minus revenue\n- **Runway**: Cash in bank / net burn = months left\n\n**Red Flags**\n\n- Unexplained spikes in monthly burn\n- Burn increasing faster than revenue\n- Committed expenses not in current burn (new hires, leases)\n- No plan to reach profitability before cash runs out\n\nStart fundraising with 6-9 months of runway remaining.',
      content_fr: '**Fondamentaux du burn rate**\n\nLe burn rate mesure a quelle vitesse une startup depense son cash. C\'est la metrique la plus critique pour les entreprises early-stage.\n\n**Calculs cles**\n\n- **Gross burn** : Depenses mensuelles totales\n- **Net burn** : Depenses moins le revenu\n- **Runway** : Tresorerie / net burn = mois restants\n\n**Signaux d\'alerte**\n\n- Pics inexpliques du burn mensuel\n- Burn augmentant plus vite que le revenu\n- Depenses engagees non dans le burn actuel (embauches, baux)\n- Pas de plan de rentabilite avant epuisement du cash\n\nCommencez la levee avec 6-9 mois de runway restant.',
      key_takeaway_en: 'Always calculate runway using net burn plus committed future expenses, and start fundraising with at least 6-9 months of runway remaining.',
      key_takeaway_fr: 'Calculez toujours le runway en utilisant le net burn plus les depenses futures engagees, et commencez la levee de fonds avec au moins 6-9 mois de runway restant.',
      theme: 'burn_rate'
    }
  },

  // ============================================================
  // PACK 15: Portfolio Construction (AB Choice)
  // ============================================================
  {
    id: 'pack_15',
    theme: 'Portfolio Construction',
    theme_fr: 'Construction de portefeuille',
    difficulty: 'Medium',
    icon: '',
    visual_type: 'ab_choice',
    questions: [
      {
        id: 'q_15_1',
        question_en: 'Why do experienced angel investors typically build portfolios of 20+ startup investments rather than concentrating on 2-3 "best" picks?',
        question_fr: 'Pourquoi les business angels experimentes construisent-ils typiquement des portefeuilles de 20+ investissements en startups plutot que de se concentrer sur 2-3 "meilleurs" choix ?',
        answers_en: ['Because they cannot identify the best startups', 'Because startup returns follow a power law - a few massive winners drive all returns, and you cannot predict which ones in advance', 'Because larger portfolios are easier to manage', 'Because it reduces their tax burden'],
        answers_fr: ['Parce qu\'ils ne peuvent pas identifier les meilleures startups', 'Parce que les rendements des startups suivent une loi de puissance - quelques gagnants massifs generent tous les rendements, et on ne peut pas predire lesquels a l\'avance', 'Parce que les portefeuilles plus grands sont plus faciles a gerer', 'Parce que cela reduit leur charge fiscale'],
        correct_answer_index: 2,
        explanation_en: 'Startup returns follow a power law: 1-2 investments in a fund generate 80%+ of returns. Even top investors can\'t reliably pick winners, so diversification (20-30+ bets) is essential to capture those outlier returns.',
        explanation_fr: 'Les rendements startup suivent une loi de puissance : 1-2 investissements d\'un fonds generent 80%+ des rendements. Meme les meilleurs investisseurs ne peuvent pas choisir les gagnants, donc la diversification (20-30+ paris) est essentielle pour capturer ces rendements exceptionnels.',
        category: 'Startups vs. Other Asset Classes'
      },
      {
        id: 'q_15_2',
        question_en: 'What percentage of startup investments typically return 0x (total loss) in a well-managed angel portfolio?',
        question_fr: 'Quel pourcentage des investissements en startups retournent typiquement 0x (perte totale) dans un portefeuille d\'ange bien gere ?',
        answers_en: ['About 10%', 'About 30-50%', 'About 5%', 'About 80%'],
        answers_fr: ['Environ 10%', 'Environ 30-50%', 'Environ 5%', 'Environ 80%'],
        correct_answer_index: 2,
        explanation_en: 'Studies show that 30-50% of angel investments return zero. Another 20-30% return less than the invested amount. Only 5-10% generate the large returns (10x+) that make the entire portfolio profitable. This is why diversification is critical.',
        explanation_fr: 'Les etudes montrent que 30-50% des investissements angels retournent zero. 20-30% supplementaires retournent moins que le montant investi. Seuls 5-10% generent les grands rendements (10x+) qui rendent le portefeuille entier profitable. C\'est pourquoi la diversification est critique.',
        category: 'Startups vs. Other Asset Classes'
      },
      {
        id: 'q_15_3',
        question_en: 'What is "follow-on investing" and why is it important in startup portfolio strategy?',
        question_fr: 'Qu\'est-ce que le "follow-on investing" et pourquoi est-il important dans la strategie de portefeuille startup ?',
        answers_en: ['Investing in a competitor of a portfolio company', 'Reserving capital to invest more in your best-performing portfolio companies in later rounds', 'Following other investors into their deals', 'Investing the same amount in every round'],
        answers_fr: ['Investir dans un concurrent d\'une entreprise du portefeuille', 'Reserver du capital pour investir davantage dans les entreprises les plus performantes de votre portefeuille lors de tours ulterieurs', 'Suivre d\'autres investisseurs dans leurs deals', 'Investir le meme montant a chaque tour'],
        correct_answer_index: 2,
        explanation_en: 'Follow-on means reserving 50%+ of your fund to reinvest in winners. After 12-18 months of data, you can identify top performers and double down on proven companies rather than spreading capital equally.',
        explanation_fr: 'Le follow-on signifie reserver 50%+ de votre fonds pour reinvestir dans les gagnants. Apres 12-18 mois de donnees, vous pouvez identifier les performeurs et doubler la mise sur les entreprises prouvees plutot que de repartir le capital egalement.',
        category: 'Startups vs. Other Asset Classes'
      }
    ],
    puzzle: {
      id: 'pz_15',
      interaction_type: 'ab_choice',
      title: 'Problem of the Day',
      title_fr: 'Problème du Jour',
      hint: 'Think about the power law of startup returns and the importance of follow-on reserves.',
      hint_fr: 'Pensez a la loi de puissance des rendements startup et a l\'importance des reserves de follow-on.',
      answer: 'b',
      explanation: 'Strategy B wins: 25 startups provides critical diversification (power law), and 60% follow-on reserve lets you double down on winners. Strategy A\'s 5 deals with zero follow-on is extremely risky — 2-3 will return zero, and you can\'t reinvest in winners.',
      explanation_fr: 'La Strategie B gagne : 25 startups offrent une diversification critique (loi de puissance), et 60% de reserve follow-on permet de doubler la mise sur les gagnants. Les 5 deals de la Strategie A sans follow-on sont tres risques — 2-3 retourneront zero, et on ne peut pas reinvestir dans les gagnants.',
      context_data: {
        question_en: 'You have \u20ac500K to invest in startups over the next 3 years. Which portfolio strategy is better?',
        question_fr: 'Vous avez 500K\u20ac a investir dans des startups sur les 3 prochaines annees. Quelle strategie de portefeuille est meilleure ?',
        question_it: 'Hai \u20ac500K da investire in startup nei prossimi 3 anni. Quale strategia di portafoglio \u00e8 migliore?',
        question_es: 'Tienes \u20ac500K para invertir en startups durante los pr\u00f3ximos 3 a\u00f1os. \u00bfQu\u00e9 estrategia de cartera es mejor?',
        option_a: {
          title: 'Strategy A - Concentrated',
          title_fr: 'Strat\u00e9gie A - Concentr\u00e9e',
          title_it: 'Strategia A - Concentrata',
          title_es: 'Estrategia A - Concentrada',
          metrics: {
            'Total capital': '\u20ac500K',
            'Number of deals': '5 startups',
            'Average check size': '\u20ac100K per startup',
            'Follow-on reserve': '\u20ac0 (all deployed upfront)',
            'Sectors': '1 sector (deep expertise)',
            'Expected loss rate': '30-50% of deals'
          }
        },
        option_b: {
          title: 'Strategy B - Diversified',
          title_fr: 'Strat\u00e9gie B - Diversifi\u00e9e',
          title_it: 'Strategia B - Diversificata',
          title_es: 'Estrategia B - Diversificada',
          metrics: {
            'Total capital': '\u20ac500K',
            'Number of deals': '25 startups',
            'Average check size': '\u20ac8K initial per startup',
            'Follow-on reserve': '\u20ac300K (60% reserved for winners)',
            'Sectors': '3-4 sectors',
            'Expected loss rate': '30-50% of deals'
          }
        }
      }
    },
    lesson: {
      id: 'ls_15',
      title_en: 'Building a Startup Investment Portfolio',
      title_fr: 'Construire un portefeuille d\'investissement startup',
      content_en: '**The Power Law**\n\nStartup returns follow a power law: 1-2 companies out of 20-30 drive 80%+ of total returns. 30-50% will return zero.\n\n**Best Practices**\n\n- **Diversify**: Target 20-30+ investments\n- **Follow-on reserves**: Keep 50-60% of capital for reinvesting in winners\n- **Consistent tickets**: Don\'t overload any single initial deal\n- **Time diversification**: Invest across 2-3 years\n\nThe 2 winners in a 25-company portfolio make it profitable. Concentration in a few "sure things" ignores this math.',
      content_fr: '**La loi de puissance**\n\nLes rendements startup suivent une loi de puissance : 1-2 entreprises sur 20-30 generent 80%+ des rendements totaux. 30-50% retourneront zero.\n\n**Meilleures pratiques**\n\n- **Diversifier** : Viser 20-30+ investissements\n- **Reserves follow-on** : Garder 50-60% du capital pour reinvestir dans les gagnants\n- **Tickets coherents** : Ne pas surcharger un seul deal initial\n- **Diversification temporelle** : Investir sur 2-3 ans\n\nLes 2 gagnants d\'un portefeuille de 25 le rendent profitable. La concentration sur quelques "valeurs sures" ignore cette realite mathematique.',
      key_takeaway_en: 'Diversification across 20+ startups with 50-60% reserved for follow-on is the proven strategy - concentration in a few picks ignores the power law of venture returns.',
      key_takeaway_fr: 'La diversification sur 20+ startups avec 50-60% reserve pour le follow-on est la strategie prouvee - la concentration sur quelques choix ignore la loi de puissance des rendements en venture.',
      theme: 'portfolio_construction'
    }
  }
];