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
    icon: '📊',
    visual_type: 'cap_table',
    questions: [
      {
        id: 'q_01_1',
        question_en: 'A startup has 10M authorized shares. Founders hold 6M, investors 3M, and the ESOP pool is 1.5M shares. What is the actual fully diluted ownership of the founders?',
        question_fr: 'Une startup a 10M d\'actions autorisees. Les fondateurs detiennent 6M, les investisseurs 3M et le pool ESOP est de 1,5M d\'actions. Quelle est la participation reelle des fondateurs en fully diluted ?',
        answers_en: ['60%', '57.1%', '50%', '66.7%'],
        answers_fr: ['60%', '57,1%', '50%', '66,7%'],
        correct_answer_index: 2,
        explanation_en: 'Fully diluted includes all shares: 6M / (6M + 3M + 1.5M) = 6M / 10.5M = 57.1%. The authorized share count is irrelevant; what matters is total outstanding + reserved shares.',
        explanation_fr: 'Le fully diluted inclut toutes les actions : 6M / (6M + 3M + 1,5M) = 6M / 10,5M = 57,1%. Le nombre d\'actions autorisees est sans importance ; ce qui compte, c\'est le total des actions en circulation + reservees.',
        category: 'Foundational Knowledge'
      },
      {
        id: 'q_01_2',
        question_en: 'In a Series A round, a VC invests €2M at a €8M pre-money valuation. The ESOP pool is expanded from 10% to 15% BEFORE the round. Who bears the cost of the ESOP expansion?',
        question_fr: 'Lors d\'un tour de Series A, un VC investit 2M\u20ac a une valorisation pre-money de 8M\u20ac. Le pool ESOP est elargi de 10% a 15% AVANT le tour. Qui supporte le cout de l\'expansion du pool ESOP ?',
        answers_en: ['Only the VC investor', 'Only the founders and existing shareholders', 'Shared equally between founders and VC', 'The future employees receiving the options'],
        answers_fr: ['Uniquement l\'investisseur VC', 'Uniquement les fondateurs et actionnaires existants', 'Partage egal entre fondateurs et VC', 'Les futurs employes recevant les options'],
        correct_answer_index: 2,
        explanation_en: 'When the ESOP pool is expanded pre-money, the dilution comes entirely from existing shareholders (founders). The VC\'s ownership is calculated after the pool expansion, so they are not diluted by it. This is a common negotiation point in term sheets.',
        explanation_fr: 'Lorsque le pool ESOP est elargi en pre-money, la dilution provient entierement des actionnaires existants (fondateurs). La participation du VC est calculee apres l\'expansion du pool, donc il n\'est pas dilue. C\'est un point de negociation courant dans les term sheets.',
        category: 'KPIs / Expert Knowledge'
      },
      {
        id: 'q_01_3',
        question_en: 'What is anti-dilution protection in a startup financing context?',
        question_fr: 'Qu\'est-ce que la protection anti-dilution dans le contexte du financement de startups ?',
        answers_en: ['A guarantee that share price will always increase', 'A clause that adjusts investor share price if a future round is at a lower valuation', 'Legal protection preventing the company from issuing new shares', 'Insurance against total loss of investment'],
        answers_fr: ['Une garantie que le prix de l\'action augmentera toujours', 'Une clause qui ajuste le prix de l\'action de l\'investisseur si un tour futur est a une valorisation inferieure', 'Une protection juridique empechant l\'entreprise d\'emettre de nouvelles actions', 'Une assurance contre la perte totale de l\'investissement'],
        correct_answer_index: 2,
        explanation_en: 'Anti-dilution provisions (weighted average or full ratchet) protect investors by adjusting their conversion price downward if the company raises money at a lower valuation (a "down round"). Full ratchet is more investor-friendly; weighted average is more common.',
        explanation_fr: 'Les clauses anti-dilution (moyenne ponderee ou full ratchet) protegent les investisseurs en ajustant leur prix de conversion a la baisse si l\'entreprise leve des fonds a une valorisation inferieure (un "down round"). Le full ratchet est plus favorable a l\'investisseur ; la moyenne ponderee est plus courante.',
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
      explanation: 'The ESOP pool claims 15% but when you add all rows: 45% + 30% + 12% + 15% = 102%. The ESOP pool should be 13% for the numbers to work. This inflated ESOP dilutes founders more than disclosed.',
      explanation_fr: 'Le pool ESOP affiche 15% mais quand on additionne toutes les lignes : 45% + 30% + 12% + 15% = 102%. Le pool ESOP devrait etre de 13% pour que les chiffres fonctionnent. Ce pool ESOP gonfle dilue les fondateurs plus que ce qui est divulgue.',
      context_data: {
        visual_type: 'cap_table',
        question_en: 'This Series A cap table was shared during due diligence. Can you spot the error?',
        question_fr: 'Cette table de capitalisation Series A a ete partagee lors de la due diligence. Pouvez-vous reperer l\'erreur ?',
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
      content_en: '**What is a Cap Table?**\n\nA capitalization table (cap table) is a spreadsheet that shows the equity ownership structure of a company. It lists all shareholders, their share classes, and ownership percentages.\n\n**Why Dilution Matters**\n\nEvery time a startup raises money by issuing new shares, existing shareholders own a smaller percentage of the company. This is dilution. A founder who starts with 100% might own 50% after a seed round and 30% after Series A.\n\n**Key Concepts**\n\n- **Pre-money valuation**: Company value before new investment\n- **Post-money valuation**: Pre-money + new investment amount\n- **Fully diluted**: Includes all shares, options, and convertible instruments\n- **ESOP pool**: Shares reserved for employee stock options, typically 10-20%\n\n**Watch Out For**\n\n- ESOP expansion before a round (dilutes founders, not new investors)\n- Anti-dilution clauses that can shift ownership in down rounds\n- Convertible notes and SAFEs that haven\'t converted yet but will add to dilution',
      content_fr: '**Qu\'est-ce qu\'une table de capitalisation ?**\n\nUne table de capitalisation (cap table) est un tableau qui montre la structure de propriete d\'une entreprise. Elle liste tous les actionnaires, leurs classes d\'actions et leurs pourcentages de participation.\n\n**Pourquoi la dilution est importante**\n\nChaque fois qu\'une startup leve des fonds en emettant de nouvelles actions, les actionnaires existants possedent un pourcentage plus petit de l\'entreprise. C\'est la dilution. Un fondateur qui commence avec 100% pourrait posseder 50% apres un tour de seed et 30% apres la Series A.\n\n**Concepts cles**\n\n- **Valorisation pre-money** : Valeur de l\'entreprise avant le nouvel investissement\n- **Valorisation post-money** : Pre-money + montant du nouvel investissement\n- **Fully diluted** : Inclut toutes les actions, options et instruments convertibles\n- **Pool ESOP** : Actions reservees pour les stock-options des employes, generalement 10-20%\n\n**Points de vigilance**\n\n- L\'expansion du pool ESOP avant un tour (dilue les fondateurs, pas les nouveaux investisseurs)\n- Les clauses anti-dilution qui peuvent modifier la repartition en cas de down round\n- Les notes convertibles et SAFEs qui n\'ont pas encore ete converties mais qui augmenteront la dilution',
      key_takeaway_en: 'Always verify that cap table percentages add up to exactly 100% and understand who bears the cost of ESOP expansion.',
      key_takeaway_fr: 'Verifiez toujours que les pourcentages de la cap table totalisent exactement 100% et comprenez qui supporte le cout de l\'expansion du pool ESOP.',
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
    icon: '📈',
    visual_type: 'bar_chart',
    questions: [
      {
        id: 'q_02_1',
        question_en: 'A SaaS startup reports MRR growing from €50K to €80K over 6 months. What is the monthly growth rate (CMGR)?',
        question_fr: 'Une startup SaaS rapporte un MRR passant de 50K\u20ac a 80K\u20ac en 6 mois. Quel est le taux de croissance mensuel (CMGR) ?',
        answers_en: ['10%', '8.1%', '5%', '16.7%'],
        answers_fr: ['10%', '8,1%', '5%', '16,7%'],
        correct_answer_index: 2,
        explanation_en: 'CMGR = (End/Start)^(1/months) - 1 = (80/50)^(1/6) - 1 = 1.6^(0.167) - 1 = ~8.1%. Simple average (30K/6/50K = 10%) overstates growth. CMGR gives the compounded monthly rate.',
        explanation_fr: 'CMGR = (Fin/Debut)^(1/mois) - 1 = (80/50)^(1/6) - 1 = 1,6^(0,167) - 1 = ~8,1%. La moyenne simple (30K/6/50K = 10%) surestime la croissance. Le CMGR donne le taux mensuel compose.',
        category: 'KPIs / Expert Knowledge'
      },
      {
        id: 'q_02_2',
        question_en: 'Which of the following is the MOST reliable indicator of healthy revenue growth for a B2B SaaS startup?',
        question_fr: 'Lequel des indicateurs suivants est le PLUS fiable pour evaluer une croissance saine du revenu d\'une startup B2B SaaS ?',
        answers_en: ['Total registered users increasing 50% QoQ', 'Net Revenue Retention (NRR) above 120%', 'Gross merchandise value (GMV) doubling year-over-year', 'Website traffic growing 200% month-over-month'],
        answers_fr: ['Total d\'utilisateurs inscrits en hausse de 50% par trimestre', 'Retention nette du revenu (NRR) superieure a 120%', 'Valeur brute des marchandises (GMV) doublant d\'annee en annee', 'Trafic du site web en croissance de 200% mois par mois'],
        correct_answer_index: 2,
        explanation_en: 'Net Revenue Retention above 120% means existing customers are spending 20%+ more over time through upsells and expansion, even accounting for churn. This is the gold standard for SaaS health because it shows product-market fit with existing customers.',
        explanation_fr: 'Une retention nette du revenu superieure a 120% signifie que les clients existants depensent 20%+ de plus au fil du temps via des upsells et expansions, meme en tenant compte du churn. C\'est le standard d\'excellence pour la sante SaaS car cela montre un product-market fit avec les clients existants.',
        category: 'KPIs / Expert Knowledge'
      },
      {
        id: 'q_02_3',
        question_en: 'A startup claims "3x revenue growth year-over-year." Their revenue went from €100K to €300K. However, €150K came from a one-time enterprise contract. What is the organic recurring growth?',
        question_fr: 'Une startup revendique "une croissance du CA de 3x en annee glissante." Son CA est passe de 100K\u20ac a 300K\u20ac. Cependant, 150K\u20ac proviennent d\'un contrat unique avec une entreprise. Quelle est la croissance organique recurrente ?',
        answers_en: ['200%', '150%', '50%', '300%'],
        answers_fr: ['200%', '150%', '50%', '300%'],
        correct_answer_index: 3,
        explanation_en: 'Stripping out the one-time €150K contract, recurring revenue only grew from €100K to €150K, which is 50% growth. One-time contracts inflate metrics and are not reliable indicators of sustainable growth.',
        explanation_fr: 'En excluant le contrat ponctuel de 150K\u20ac, le revenu recurrent n\'a progresse que de 100K\u20ac a 150K\u20ac, soit une croissance de 50%. Les contrats ponctuels gonflent les metriques et ne sont pas des indicateurs fiables de croissance durable.',
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
      explanation: 'April shows €195K but 30% growth from March (€180K) would be €234K. April actually dropped ~8% instead of growing. The CEO cherry-picked the overall trend while hiding a significant dip.',
      explanation_fr: 'Avril affiche 195K\u20ac mais une croissance de 30% depuis mars (180K\u20ac) donnerait 234K\u20ac. Avril a en fait baisse de ~8% au lieu de croitre. Le CEO a selectionne la tendance globale tout en cachant une baisse significative.',
      context_data: {
        visual_type: 'bar_chart',
        question_en: 'The CEO claims consistent 30% MoM revenue growth. Which month breaks the pattern?',
        question_fr: 'Le CEO affirme une croissance mensuelle constante de 30%. Quel mois brise le schema ?',
        claim_en: 'CEO claims: "We have maintained 30% month-over-month revenue growth since January"',
        claim_fr: 'Le CEO affirme : "Nous avons maintenu une croissance mensuelle de 30% depuis janvier"',
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
      content_en: '**Revenue Growth: The #1 Startup Metric**\n\nRevenue growth is the most scrutinized metric in startup investing. But not all growth is created equal.\n\n**MRR vs ARR**\n\n- **MRR** (Monthly Recurring Revenue): Predictable monthly subscription revenue\n- **ARR** (Annual Recurring Revenue): MRR x 12, used for annual planning\n- Always ask: Is this revenue recurring, or does it include one-time deals?\n\n**Growth Rate Calculations**\n\n- **MoM** (Month-over-Month): Best for early stage, shows acceleration\n- **YoY** (Year-over-Year): Eliminates seasonality, better for mature startups\n- **CMGR** (Compounded Monthly Growth Rate): The honest way to report multi-month growth\n\n**Red Flags in Revenue Reporting**\n\n- Mixing recurring and one-time revenue without disclosure\n- Reporting bookings or GMV instead of actual revenue\n- Cherry-picking the best month-to-month comparison\n- Ignoring churn and only showing gross new revenue',
      content_fr: '**Croissance du revenu : la metrique #1 des startups**\n\nLa croissance du revenu est la metrique la plus scrutee en investissement startup. Mais toutes les croissances ne se valent pas.\n\n**MRR vs ARR**\n\n- **MRR** (Revenu Mensuel Recurrent) : Revenu d\'abonnement mensuel previsible\n- **ARR** (Revenu Annuel Recurrent) : MRR x 12, utilise pour la planification annuelle\n- Demandez toujours : Ce revenu est-il recurrent, ou inclut-il des ventes ponctuelles ?\n\n**Calculs de taux de croissance**\n\n- **MoM** (Mois par mois) : Ideal pour le stade precoce, montre l\'acceleration\n- **YoY** (Annee par annee) : Elimine la saisonnalite, meilleur pour les startups matures\n- **CMGR** (Taux de croissance mensuel compose) : La facon honnete de rapporter la croissance multi-mois\n\n**Signaux d\'alerte dans le reporting du revenu**\n\n- Melanger revenu recurrent et ponctuel sans le signaler\n- Rapporter les reservations ou le GMV au lieu du revenu reel\n- Choisir la meilleure comparaison mois par mois\n- Ignorer le churn et ne montrer que le nouveau revenu brut',
      key_takeaway_en: 'Always calculate growth rates yourself using CMGR and separate recurring revenue from one-time deals.',
      key_takeaway_fr: 'Calculez toujours les taux de croissance vous-meme en utilisant le CMGR et separez le revenu recurrent des ventes ponctuelles.',
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
    icon: '📜',
    visual_type: 'term_sheet',
    questions: [
      {
        id: 'q_03_1',
        question_en: 'What does a "full ratchet" anti-dilution clause mean for founders in a down round?',
        question_fr: 'Que signifie une clause anti-dilution "full ratchet" pour les fondateurs en cas de down round ?',
        answers_en: ['Founders get additional shares to compensate', 'Investor shares are repriced to the lowest future round price, massively diluting founders', 'All shareholders are diluted equally', 'The clause prevents any future fundraising below current valuation'],
        answers_fr: ['Les fondateurs recoivent des actions supplementaires en compensation', 'Les actions de l\'investisseur sont reprices au prix le plus bas du tour futur, diluant massivement les fondateurs', 'Tous les actionnaires sont dilues egalement', 'La clause empeche toute levee de fonds future en dessous de la valorisation actuelle'],
        correct_answer_index: 2,
        explanation_en: 'Full ratchet means the investor\'s conversion price drops to match any lower future round price, regardless of the amount raised. This can be devastating for founders, transferring massive ownership in a down round. Weighted average anti-dilution is much more founder-friendly.',
        explanation_fr: 'Le full ratchet signifie que le prix de conversion de l\'investisseur baisse pour correspondre a tout prix de tour futur inferieur, independamment du montant leve. Cela peut etre devastateur pour les fondateurs, transferant une propriete massive en cas de down round. L\'anti-dilution a moyenne ponderee est beaucoup plus favorable aux fondateurs.',
        category: 'Foundational Knowledge'
      },
      {
        id: 'q_03_2',
        question_en: 'A term sheet includes a "2x participating preferred" liquidation preference. If the company sells for €20M and the investor put in €5M for 25% ownership, how much does the investor receive?',
        question_fr: 'Un term sheet inclut une preference de liquidation "2x participating preferred". Si l\'entreprise est vendue pour 20M\u20ac et que l\'investisseur a mis 5M\u20ac pour 25% de propriete, combien l\'investisseur recoit-il ?',
        answers_en: ['€5M (1x return)', '€10M (2x return)', '€12.5M (2x preference + 25% of remainder)', '€15M (3x return)'],
        answers_fr: ['5M\u20ac (retour 1x)', '10M\u20ac (retour 2x)', '12,5M\u20ac (preference 2x + 25% du reste)', '15M\u20ac (retour 3x)'],
        correct_answer_index: 3,
        explanation_en: 'With 2x participating preferred: First, investor gets 2x their money = €10M. Then they ALSO participate in the remaining €10M at their 25% ownership = €2.5M. Total: €12.5M out of €20M, leaving founders with €7.5M despite owning 75%.',
        explanation_fr: 'Avec une preference participative 2x : D\'abord, l\'investisseur recoit 2x son argent = 10M\u20ac. Puis il participe AUSSI aux 10M\u20ac restants a hauteur de ses 25% = 2,5M\u20ac. Total : 12,5M\u20ac sur 20M\u20ac, laissant aux fondateurs 7,5M\u20ac malgre 75% de propriete.',
        category: 'KPIs / Expert Knowledge'
      },
      {
        id: 'q_03_3',
        question_en: 'Which term sheet clause gives investors the right to block a company sale they disagree with, even if founders and other shareholders approve?',
        question_fr: 'Quelle clause du term sheet donne aux investisseurs le droit de bloquer une vente de l\'entreprise avec laquelle ils sont en desaccord, meme si les fondateurs et autres actionnaires l\'approuvent ?',
        answers_en: ['Tag-along rights', 'Protective provisions (veto rights)', 'Right of first refusal', 'Drag-along rights'],
        answers_fr: ['Droits de suite (tag-along)', 'Clauses protectrices (droits de veto)', 'Droit de preemption', 'Droits d\'entrainement (drag-along)'],
        correct_answer_index: 2,
        explanation_en: 'Protective provisions (veto rights) give investors the power to block certain corporate actions, including M&A transactions, new share issuances, or changes to the company\'s charter. This can prevent exits that don\'t meet investor return expectations.',
        explanation_fr: 'Les clauses protectrices (droits de veto) donnent aux investisseurs le pouvoir de bloquer certaines actions de l\'entreprise, y compris les transactions M&A, les nouvelles emissions d\'actions ou les modifications des statuts. Cela peut empecher des sorties qui ne repondent pas aux attentes de retour de l\'investisseur.',
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
      explanation: 'The board composition clause gives investors 3 out of 5 seats at Series A stage. This is highly unusual and gives investors majority board control, effectively letting them fire the CEO or block any strategic decision. Standard is 2 founders + 1 investor + 1 independent + 1 CEO.',
      explanation_fr: 'La clause de composition du conseil donne aux investisseurs 3 sieges sur 5 au stade Series A. C\'est tres inhabituel et donne aux investisseurs le controle majoritaire du conseil, leur permettant effectivement de renvoyer le CEO ou de bloquer toute decision strategique. Le standard est 2 fondateurs + 1 investisseur + 1 independant + 1 CEO.',
      context_data: {
        visual_type: 'term_sheet',
        question_en: 'Review this Series A term sheet. Which clause should raise the biggest red flag?',
        question_fr: 'Examinez ce term sheet de Series A. Quelle clause devrait lever le plus grand signal d\'alerte ?',
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
      content_en: '**What is a Term Sheet?**\n\nA term sheet outlines the key terms and conditions of an investment. It is usually non-binding but sets the framework for the final legal documents.\n\n**Key Economic Terms**\n\n- **Valuation**: Pre-money determines your dilution. Higher is better for founders.\n- **Liquidation Preference**: Determines payout order in an exit. 1x non-participating is standard. Anything above 1x or "participating" heavily favors investors.\n- **Anti-dilution**: Protects investors in down rounds. Weighted average is fair; full ratchet is aggressive.\n\n**Key Control Terms**\n\n- **Board Composition**: Who controls the board controls the company. Founders should maintain at least equal representation at Series A.\n- **Protective Provisions**: Investor veto rights on major decisions. Keep the list narrow.\n- **Drag-along**: Can force minority shareholders to join an approved sale.\n\n**Red Flags to Watch**\n\n- Participating preferred with multiples above 1x\n- Full ratchet anti-dilution\n- Investor-majority board at early stage\n- Excessive protective provisions\n- Founder vesting resets on existing shares',
      content_fr: '**Qu\'est-ce qu\'un term sheet ?**\n\nUn term sheet decrit les termes et conditions cles d\'un investissement. Il est generalement non contraignant mais etablit le cadre des documents juridiques finaux.\n\n**Termes economiques cles**\n\n- **Valorisation** : Le pre-money determine votre dilution. Plus c\'est eleve, mieux c\'est pour les fondateurs.\n- **Preference de liquidation** : Determine l\'ordre de paiement lors d\'une sortie. 1x non-participatif est le standard. Tout ce qui depasse 1x ou "participatif" favorise fortement les investisseurs.\n- **Anti-dilution** : Protege les investisseurs en cas de down round. La moyenne ponderee est equitable ; le full ratchet est agressif.\n\n**Termes de controle cles**\n\n- **Composition du conseil** : Qui controle le conseil controle l\'entreprise. Les fondateurs doivent maintenir au moins une representation egale en Series A.\n- **Clauses protectrices** : Droits de veto des investisseurs sur les decisions majeures. Gardez la liste etroite.\n- **Drag-along** : Peut forcer les actionnaires minoritaires a rejoindre une vente approuvee.\n\n**Signaux d\'alerte**\n\n- Preference participative avec multiples superieurs a 1x\n- Anti-dilution full ratchet\n- Conseil a majorite investisseur au stade precoce\n- Clauses protectrices excessives\n- Remise a zero du vesting des fondateurs sur les actions existantes',
      key_takeaway_en: 'The most dangerous term sheet clauses are about control (board seats, veto rights), not just valuation.',
      key_takeaway_fr: 'Les clauses les plus dangereuses d\'un term sheet concernent le controle (sieges au conseil, droits de veto), pas seulement la valorisation.',
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
    icon: '📱',
    visual_type: 'metric_cards',
    questions: [
      {
        id: 'q_04_1',
        question_en: 'Which KPI best measures whether a SaaS startup has achieved product-market fit?',
        question_fr: 'Quel KPI mesure le mieux si une startup SaaS a atteint le product-market fit ?',
        answers_en: ['Number of registered users', 'Monthly active users / registered users ratio plus NRR above 100%', 'Total funding raised', 'Number of features shipped per quarter'],
        answers_fr: ['Nombre d\'utilisateurs inscrits', 'Ratio utilisateurs actifs mensuels / inscrits plus NRR superieur a 100%', 'Total des fonds leves', 'Nombre de fonctionnalites livrees par trimestre'],
        correct_answer_index: 2,
        explanation_en: 'Product-market fit is best measured by engagement (DAU/MAU ratio) and retention (NRR > 100%). Registered users is a vanity metric, funding raised shows investor interest not product fit, and features shipped measures output not outcomes.',
        explanation_fr: 'Le product-market fit se mesure le mieux par l\'engagement (ratio DAU/MAU) et la retention (NRR > 100%). Les utilisateurs inscrits sont une metrique de vanite, les fonds leves montrent l\'interet des investisseurs pas le product fit, et les fonctionnalites livrees mesurent la production pas les resultats.',
        category: 'KPIs / Expert Knowledge'
      },
      {
        id: 'q_04_2',
        question_en: 'What is a "vanity metric" in the context of startup KPIs?',
        question_fr: 'Qu\'est-ce qu\'une "metrique de vanite" dans le contexte des KPI de startups ?',
        answers_en: ['A metric that only founders care about', 'A metric that looks impressive but does not correlate with business health or growth', 'Any metric related to social media', 'A metric that investors ignore during due diligence'],
        answers_fr: ['Une metrique dont seuls les fondateurs se soucient', 'Une metrique qui semble impressionnante mais ne correle pas avec la sante ou la croissance de l\'entreprise', 'Toute metrique liee aux reseaux sociaux', 'Une metrique que les investisseurs ignorent pendant la due diligence'],
        correct_answer_index: 2,
        explanation_en: 'Vanity metrics (total downloads, registered users, page views) look good in presentations but don\'t indicate real business traction. Actionable metrics (DAU/MAU, retention, NRR, LTV/CAC) actually correlate with business success.',
        explanation_fr: 'Les metriques de vanite (telechargements totaux, utilisateurs inscrits, pages vues) sont belles en presentation mais n\'indiquent pas une traction commerciale reelle. Les metriques actionnables (DAU/MAU, retention, NRR, LTV/CAC) correlent reellement avec le succes commercial.',
        category: 'Foundational Knowledge'
      },
      {
        id: 'q_04_3',
        question_en: 'A startup shows a LTV/CAC ratio of 5:1. Is this a good sign?',
        question_fr: 'Une startup affiche un ratio LTV/CAC de 5:1. Est-ce un bon signe ?',
        answers_en: ['No, it means they are spending too much on acquisition', 'Yes, but only if the payback period is under 18 months', 'Yes, it always means the business is healthy', 'No, a ratio above 3:1 means the company is underinvesting in growth'],
        answers_fr: ['Non, cela signifie qu\'ils depensent trop en acquisition', 'Oui, mais seulement si la periode de retour est inferieure a 18 mois', 'Oui, cela signifie toujours que l\'entreprise est saine', 'Non, un ratio superieur a 3:1 signifie que l\'entreprise sous-investit dans la croissance'],
        correct_answer_index: 2,
        explanation_en: 'A LTV/CAC of 5:1 looks great, but the payback period matters enormously. If it takes 36 months to recoup CAC, the company may run out of cash before seeing returns. A ratio of 3:1+ with payback under 18 months is the gold standard.',
        explanation_fr: 'Un LTV/CAC de 5:1 semble excellent, mais la periode de retour compte enormement. S\'il faut 36 mois pour recuperer le CAC, l\'entreprise peut manquer de tresorerie avant de voir les retours. Un ratio de 3:1+ avec un retour sous 18 mois est le standard d\'excellence.',
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
      explanation: 'Total app downloads (850K) is a classic vanity metric. It tells you nothing about how many people actually USE the app. The real engagement metrics (MRR growth, retention, LTV/CAC) are what matter. A startup could have 850K downloads but only 5K active users.',
      explanation_fr: 'Le total des telechargements (850K) est une metrique de vanite classique. Cela ne vous dit rien sur le nombre de personnes qui UTILISENT reellement l\'app. Les vraies metriques d\'engagement (croissance MRR, retention, LTV/CAC) sont ce qui compte. Une startup pourrait avoir 850K telechargements mais seulement 5K utilisateurs actifs.',
      context_data: {
        visual_type: 'metric_cards',
        question_en: 'This startup dashboard highlights key metrics for investors. Which one is a vanity metric that hides the real picture?',
        question_fr: 'Ce tableau de bord met en avant les metriques cles pour les investisseurs. Laquelle est une metrique de vanite qui cache la realite ?',
        rows: [
          { id: 'card1', icon: '💰', label: 'MRR', value: '\u20ac45K', trend: '+12%' },
          { id: 'card2', icon: '📊', label: 'Net Retention', value: '118%', trend: '+3%' },
          { id: 'card3', icon: '📲', label: 'Total Downloads', value: '850K', trend: '+45%' },
          { id: 'card4', icon: '🎯', label: 'LTV/CAC', value: '3.2x', trend: '+0.4' },
          { id: 'card5', icon: '⏱️', label: 'CAC Payback', value: '11 mo', trend: '-2 mo' }
        ]
      }
    },
    lesson: {
      id: 'ls_04',
      title_en: 'Startup KPIs That Actually Matter',
      title_fr: 'Les KPI de startups qui comptent vraiment',
      content_en: '**Vanity vs Actionable Metrics**\n\nNot all metrics are created equal. Vanity metrics (total users, downloads, page views) look good but don\'t drive decisions. Actionable metrics correlate directly with business health.\n\n**The Key SaaS Metrics**\n\n- **MRR/ARR**: Monthly/Annual Recurring Revenue - your revenue baseline\n- **NRR** (Net Revenue Retention): Do existing customers spend more over time? 100%+ is good, 120%+ is exceptional\n- **LTV/CAC**: Customer lifetime value vs acquisition cost. 3:1 is the benchmark\n- **CAC Payback**: How many months to recoup customer acquisition cost. Under 18 months is healthy\n- **Churn Rate**: Monthly customer loss. Under 3% monthly for SMB, under 1% for enterprise\n\n**Red Flags in KPI Dashboards**\n\n- Highlighting vanity metrics prominently\n- Mixing different time periods to make trends look better\n- Not disclosing churn alongside growth numbers\n- Using "total" metrics instead of "active" metrics',
      content_fr: '**Metriques de vanite vs actionnables**\n\nToutes les metriques ne se valent pas. Les metriques de vanite (utilisateurs totaux, telechargements, pages vues) sont belles mais ne guident pas les decisions. Les metriques actionnables correlent directement avec la sante de l\'entreprise.\n\n**Les metriques SaaS cles**\n\n- **MRR/ARR** : Revenu Mensuel/Annuel Recurrent - votre base de revenu\n- **NRR** (Retention Nette du Revenu) : Les clients existants depensent-ils plus au fil du temps ? 100%+ est bien, 120%+ est exceptionnel\n- **LTV/CAC** : Valeur vie client vs cout d\'acquisition. 3:1 est la reference\n- **CAC Payback** : Combien de mois pour recuperer le cout d\'acquisition client. Moins de 18 mois est sain\n- **Taux de churn** : Perte mensuelle de clients. Moins de 3% mensuel pour PME, moins de 1% pour enterprise\n\n**Signaux d\'alerte dans les tableaux de bord KPI**\n\n- Mettre en avant les metriques de vanite\n- Melanger differentes periodes pour embellir les tendances\n- Ne pas divulguer le churn a cote des chiffres de croissance\n- Utiliser des metriques "totales" au lieu d\'"actives"',
      key_takeaway_en: 'Focus on actionable metrics (NRR, LTV/CAC, churn) over vanity metrics (downloads, registered users) when evaluating startups.',
      key_takeaway_fr: 'Concentrez-vous sur les metriques actionnables (NRR, LTV/CAC, churn) plutot que les metriques de vanite (telechargements, utilisateurs inscrits) lors de l\'evaluation des startups.',
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
    icon: '💰',
    visual_type: 'pnl_table',
    questions: [
      {
        id: 'q_05_1',
        question_en: 'A startup claims 18 months of runway with €85K monthly revenue and total monthly expenses of €72K. What critical information is missing from this calculation?',
        question_fr: 'Une startup revendique 18 mois de runway avec 85K\u20ac de revenu mensuel et 72K\u20ac de depenses mensuelles totales. Quelle information critique manque a ce calcul ?',
        answers_en: ['The number of employees', 'The cash balance and whether revenue is growing or flat', 'The office location', 'The founding date'],
        answers_fr: ['Le nombre d\'employes', 'Le solde de tresorerie et si le revenu croit ou stagne', 'La localisation du bureau', 'La date de fondation'],
        correct_answer_index: 2,
        explanation_en: 'Runway = Cash Balance / Monthly Burn. With €13K monthly net income (85K-72K), the company is actually cash-flow positive. The 18-month runway claim suggests they are burning cash, meaning revenue may not be as reliable as stated, or there are hidden expenses.',
        explanation_fr: 'Runway = Solde de tresorerie / Burn mensuel. Avec 13K\u20ac de revenu net mensuel (85K-72K), l\'entreprise est en fait cash-flow positive. L\'affirmation de 18 mois de runway suggere qu\'ils brulent du cash, ce qui signifie que le revenu n\'est peut-etre pas aussi fiable qu\'annonce, ou qu\'il y a des depenses cachees.',
        category: 'KPIs / Expert Knowledge'
      },
      {
        id: 'q_05_2',
        question_en: 'What is "gross margin" and why is it critical for SaaS startups?',
        question_fr: 'Qu\'est-ce que la "marge brute" et pourquoi est-elle critique pour les startups SaaS ?',
        answers_en: ['Total revenue minus all expenses; it shows overall profitability', 'Revenue minus cost of goods sold; SaaS should target 70-80%+ gross margins', 'Revenue minus marketing costs; it shows acquisition efficiency', 'Net income divided by revenue; it measures operational efficiency'],
        answers_fr: ['Revenu total moins toutes les depenses ; cela montre la rentabilite globale', 'Revenu moins cout des marchandises vendues ; le SaaS devrait viser 70-80%+ de marge brute', 'Revenu moins couts marketing ; cela montre l\'efficacite d\'acquisition', 'Revenu net divise par le revenu ; cela mesure l\'efficacite operationnelle'],
        correct_answer_index: 2,
        explanation_en: 'Gross margin = (Revenue - COGS) / Revenue. For SaaS, COGS includes hosting, support, and infrastructure costs. Healthy SaaS gross margins are 70-80%+. Below 60% suggests the business model may not scale well or has structural cost issues.',
        explanation_fr: 'Marge brute = (Revenu - COGS) / Revenu. Pour le SaaS, le COGS inclut l\'hebergement, le support et les couts d\'infrastructure. Les marges brutes SaaS saines sont de 70-80%+. En dessous de 60%, le modele economique peut ne pas bien scaler ou avoir des problemes de couts structurels.',
        category: 'Foundational Knowledge'
      },
      {
        id: 'q_05_3',
        question_en: 'A startup reports €500K ARR with a 40% year-over-year growth rate. They are burning €50K/month and have €400K in the bank. What is their biggest risk?',
        question_fr: 'Une startup rapporte 500K\u20ac d\'ARR avec un taux de croissance annuel de 40%. Ils brulent 50K\u20ac/mois et ont 400K\u20ac en banque. Quel est leur plus grand risque ?',
        answers_en: ['Growth is too slow for VC expectations', 'They have only 8 months of runway and may not close a round in time', 'Their ARR is too low for Series A', 'The burn rate is too conservative'],
        answers_fr: ['La croissance est trop lente pour les attentes VC', 'Ils n\'ont que 8 mois de runway et pourraient ne pas boucler un tour a temps', 'Leur ARR est trop bas pour une Series A', 'Le burn rate est trop conservateur'],
        correct_answer_index: 2,
        explanation_en: '€400K / €50K monthly burn = 8 months of runway. Fundraising typically takes 3-6 months. They need to start NOW or risk running out of cash before closing. This is the "default dead" scenario that Paul Graham warns about.',
        explanation_fr: '400K\u20ac / 50K\u20ac de burn mensuel = 8 mois de runway. La levee de fonds prend generalement 3-6 mois. Ils doivent commencer MAINTENANT ou risquer de manquer de tresorerie avant de conclure. C\'est le scenario "default dead" dont Paul Graham met en garde.',
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
      explanation: '"Professional services" at \u20ac12K/mo is suspiciously vague and large. Often, startups bury consulting fees for the founders or related-party payments under this category. This should be broken down further. It could be hiding founder salaries, related-party transactions, or non-recurring legal costs being treated as recurring.',
      explanation_fr: '"Services professionnels" a 12K\u20ac/mois est suspicieusement vague et eleve. Souvent, les startups cachent les honoraires de consulting pour les fondateurs ou les paiements a des parties liees sous cette categorie. Cela devrait etre detaille davantage. Cela pourrait cacher des salaires de fondateurs, des transactions avec des parties liees, ou des couts juridiques non recurrents traites comme recurrents.',
      context_data: {
        visual_type: 'pnl_table',
        question_en: 'Review this P&L summary. Which expense line looks suspicious and deserves deeper investigation?',
        question_fr: 'Examinez ce resume du compte de resultat. Quelle ligne de depense semble suspecte et merite une enquete approfondie ?',
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
      content_en: '**Understanding the P&L**\n\nThe Profit & Loss statement shows revenue, costs, and whether the company is making or losing money. For startups, it reveals the burn rate and path to profitability.\n\n**Key Lines to Examine**\n\n- **Revenue**: Is it recurring? Growing? From many customers or just a few?\n- **COGS**: Direct costs of delivering the product. Should be low for SaaS (hosting, support).\n- **Gross Margin**: Revenue - COGS. Target 70%+ for SaaS.\n- **Operating Expenses**: Salaries, marketing, R&D, G&A\n- **Net Burn**: Total cash going out minus cash coming in each month\n\n**Common P&L Red Flags**\n\n- Vague expense categories that hide large amounts\n- Founder compensation buried in "consulting" or "professional services"\n- One-time revenue booked as recurring\n- Missing or understated cost categories\n- Runway calculations that assume continued revenue growth',
      content_fr: '**Comprendre le compte de resultat**\n\nLe compte de resultat montre les revenus, les couts et si l\'entreprise gagne ou perd de l\'argent. Pour les startups, il revele le taux de combustion et le chemin vers la rentabilite.\n\n**Lignes cles a examiner**\n\n- **Revenu** : Est-il recurrent ? En croissance ? De nombreux clients ou seulement quelques-uns ?\n- **COGS** : Couts directs de livraison du produit. Devrait etre faible pour le SaaS (hebergement, support).\n- **Marge brute** : Revenu - COGS. Objectif 70%+ pour le SaaS.\n- **Depenses operationnelles** : Salaires, marketing, R&D, frais generaux\n- **Burn net** : Total des sorties de tresorerie moins les entrees chaque mois\n\n**Signaux d\'alerte courants dans le P&L**\n\n- Categories de depenses vagues qui cachent des montants importants\n- Remuneration des fondateurs cachee dans "consulting" ou "services professionnels"\n- Revenu ponctuel comptabilise comme recurrent\n- Categories de couts manquantes ou sous-estimees\n- Calculs de runway qui supposent une croissance continue du revenu',
      key_takeaway_en: 'Always ask for expense breakdowns on vague categories and verify that runway calculations include realistic revenue assumptions.',
      key_takeaway_fr: 'Demandez toujours le detail des depenses sur les categories vagues et verifiez que les calculs de runway incluent des hypotheses de revenu realistes.',
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
    icon: '🔄',
    visual_type: 'cohort_grid',
    questions: [
      {
        id: 'q_06_1',
        question_en: 'A startup shows 85% month-1 retention across all cohorts. However, month-6 retention is only 20%. What does this suggest?',
        question_fr: 'Une startup affiche une retention de 85% au mois 1 dans toutes les cohortes. Cependant, la retention au mois 6 n\'est que de 20%. Qu\'est-ce que cela suggere ?',
        answers_en: ['The product has strong initial appeal but fails to deliver long-term value', 'This is normal for most SaaS products', 'The company needs more marketing investment', 'The pricing is too high'],
        answers_fr: ['Le produit a un attrait initial fort mais echoue a delivrer de la valeur a long terme', 'C\'est normal pour la plupart des produits SaaS', 'L\'entreprise a besoin de plus d\'investissement marketing', 'Le prix est trop eleve'],
        correct_answer_index: 1,
        explanation_en: 'A steep retention curve (85% to 20%) indicates the product captures initial interest but users don\'t find enough value to stay. This is a product-market fit problem. Healthy SaaS retention should flatten (level off) after month 2-3, not continue to decline sharply.',
        explanation_fr: 'Une courbe de retention abrupte (85% a 20%) indique que le produit capte l\'interet initial mais les utilisateurs ne trouvent pas assez de valeur pour rester. C\'est un probleme de product-market fit. La retention SaaS saine devrait se stabiliser apres le mois 2-3, pas continuer a decliner fortement.',
        category: 'KPIs / Expert Knowledge'
      },
      {
        id: 'q_06_2',
        question_en: 'What does it mean when later cohorts show BETTER retention than earlier cohorts?',
        question_fr: 'Que signifie le fait que les cohortes recentes montrent une MEILLEURE retention que les cohortes precedentes ?',
        answers_en: ['The market is getting bigger', 'The product is improving and delivering more value over time', 'The company is spending more on marketing', 'New users are less demanding'],
        answers_fr: ['Le marche s\'agrandit', 'Le produit s\'ameliore et delivre plus de valeur au fil du temps', 'L\'entreprise depense plus en marketing', 'Les nouveaux utilisateurs sont moins exigeants'],
        correct_answer_index: 2,
        explanation_en: 'Improving retention across newer cohorts is a strong positive signal. It usually means the product team is iterating effectively, the onboarding is improving, or the product itself has gotten better. Investors love to see this trend.',
        explanation_fr: 'L\'amelioration de la retention dans les cohortes plus recentes est un signal positif fort. Cela signifie generalement que l\'equipe produit itere efficacement, l\'onboarding s\'ameliore, ou le produit lui-meme s\'est ameliore. Les investisseurs adorent voir cette tendance.',
        category: 'KPIs / Expert Knowledge'
      },
      {
        id: 'q_06_3',
        question_en: 'A startup only shows you cohort retention data starting from their best-performing quarter. What should you do?',
        question_fr: 'Une startup ne vous montre les donnees de retention par cohorte qu\'a partir de leur meilleur trimestre. Que devriez-vous faire ?',
        answers_en: ['Accept the data as representative', 'Ask for the full historical cohort data including all quarters', 'Focus only on the most recent cohort', 'Ignore cohort data and look at aggregate retention instead'],
        answers_fr: ['Accepter les donnees comme representatives', 'Demander les donnees completes de toutes les cohortes historiques', 'Se concentrer uniquement sur la cohorte la plus recente', 'Ignorer les donnees de cohorte et regarder la retention agrege'],
        correct_answer_index: 2,
        explanation_en: 'Cherry-picking the starting point for cohort data is a common tactic to hide early poor performance or a declining trend. Always request the complete picture. If a startup resists sharing full cohort data, that itself is a red flag.',
        explanation_fr: 'Choisir le point de depart des donnees de cohorte est une tactique courante pour cacher une mauvaise performance precoce ou une tendance declinante. Demandez toujours le tableau complet. Si une startup resiste a partager les donnees completes de cohorte, c\'est en soi un signal d\'alerte.',
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
      explanation: 'Q3 2024 cohort shows dramatically worse retention: dropping from 100 to 40 by M1, then to 15 by M3. Other cohorts retain 70%+ at M1. This suggests a product issue, bad channel acquisition, or a broken feature that was live during Q3. Investors should investigate what changed.',
      explanation_fr: 'La cohorte Q3 2024 montre une retention dramatiquement pire : chutant de 100 a 40 au M1, puis a 15 au M3. Les autres cohortes retiennent 70%+ au M1. Cela suggere un probleme produit, une mauvaise acquisition de canal, ou une fonctionnalite cassee en production pendant le Q3. Les investisseurs devraient enqueter sur ce qui a change.',
      context_data: {
        visual_type: 'cohort_grid',
        question_en: 'This cohort retention grid shows user retention by signup quarter. Which cohort has a major retention problem?',
        question_fr: 'Cette grille de retention par cohorte montre la retention utilisateur par trimestre d\'inscription. Quelle cohorte a un probleme de retention majeur ?',
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
      content_en: '**What is Cohort Analysis?**\n\nCohort analysis groups users by when they signed up and tracks their behavior over time. It reveals whether retention is improving, stable, or declining - information that aggregate metrics hide.\n\n**Reading a Cohort Grid**\n\n- **Rows** = cohorts (groups of users who joined in the same period)\n- **Columns** = time periods after signup (M0, M1, M2, etc.)\n- **Values** = percentage of the original cohort still active\n- A healthy product shows retention curves that flatten (level off) rather than continuing to decline\n\n**What Good Looks Like**\n\n- M1 retention above 60% for B2C, 85%+ for B2B SaaS\n- Curves that flatten after month 2-3\n- Later cohorts retaining better than earlier ones (product improving)\n- Consistent patterns across cohorts\n\n**Red Flags**\n\n- Cohorts that never flatten (continuous decline = no product-market fit)\n- One cohort dramatically worse than others (investigate what changed)\n- Only showing recent cohorts (hiding early poor performance)\n- Mixing paid and organic users in the same cohort',
      content_fr: '**Qu\'est-ce que l\'analyse par cohorte ?**\n\nL\'analyse par cohorte regroupe les utilisateurs par date d\'inscription et suit leur comportement au fil du temps. Elle revele si la retention s\'ameliore, est stable ou decline - une information que les metriques agregees cachent.\n\n**Lire une grille de cohorte**\n\n- **Lignes** = cohortes (groupes d\'utilisateurs inscrits a la meme periode)\n- **Colonnes** = periodes apres l\'inscription (M0, M1, M2, etc.)\n- **Valeurs** = pourcentage de la cohorte originale encore active\n- Un produit sain montre des courbes de retention qui se stabilisent plutot que de continuer a decliner\n\n**A quoi ressemble une bonne retention**\n\n- Retention M1 superieure a 60% pour B2C, 85%+ pour B2B SaaS\n- Courbes qui se stabilisent apres le mois 2-3\n- Cohortes recentes retenant mieux que les precedentes (produit en amelioration)\n- Schemas coherents entre les cohortes\n\n**Signaux d\'alerte**\n\n- Cohortes qui ne se stabilisent jamais (declin continu = pas de product-market fit)\n- Une cohorte dramatiquement pire que les autres (investiguer ce qui a change)\n- Ne montrer que les cohortes recentes (cacher la mauvaise performance precoce)\n- Melanger utilisateurs payes et organiques dans la meme cohorte',
      key_takeaway_en: 'Always ask for the full cohort history and watch for individual cohorts that break the pattern, as they reveal hidden product or acquisition issues.',
      key_takeaway_fr: 'Demandez toujours l\'historique complet des cohortes et surveillez les cohortes individuelles qui brisent le schema, car elles revelent des problemes caches de produit ou d\'acquisition.',
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
    icon: '🏦',
    visual_type: 'funding_timeline',
    questions: [
      {
        id: 'q_07_1',
        question_en: 'A startup raised a Seed at €3M valuation, Series A at €15M, and now seeks Series B. The Series B lead proposes €10M valuation. What is this called?',
        question_fr: 'Une startup a leve un Seed a 3M\u20ac de valorisation, Series A a 15M\u20ac, et cherche maintenant une Series B. Le lead du Series B propose une valorisation de 10M\u20ac. Comment appelle-t-on cela ?',
        answers_en: ['A flat round', 'A down round', 'A bridge round', 'A recap round'],
        answers_fr: ['Un tour plat (flat round)', 'Un tour baissier (down round)', 'Un tour relais (bridge round)', 'Un tour de recapitalisation'],
        correct_answer_index: 2,
        explanation_en: 'A down round occurs when a company raises capital at a lower valuation than the previous round. This triggers anti-dilution provisions and signals that the company has not met growth expectations. It can be very dilutive for founders and early investors.',
        explanation_fr: 'Un down round se produit lorsqu\'une entreprise leve des capitaux a une valorisation inferieure a celle du tour precedent. Cela declenche les clauses anti-dilution et signale que l\'entreprise n\'a pas atteint les attentes de croissance. Cela peut etre tres dilutif pour les fondateurs et les investisseurs precoces.',
        category: 'Foundational Knowledge'
      },
      {
        id: 'q_07_2',
        question_en: 'What is the typical expected valuation step-up between a Seed round and Series A for a high-performing startup?',
        question_fr: 'Quelle est l\'augmentation de valorisation typiquement attendue entre un tour de Seed et une Series A pour une startup performante ?',
        answers_en: ['2x (double)', '3-5x', '10x+', '1.5x'],
        answers_fr: ['2x (double)', '3-5x', '10x+', '1,5x'],
        correct_answer_index: 2,
        explanation_en: 'High-performing startups typically see a 3-5x valuation step-up from Seed to Series A. This reflects significant progress in product development, initial revenue, and demonstrated traction. Below 2x often signals underwhelming progress.',
        explanation_fr: 'Les startups performantes voient typiquement une augmentation de valorisation de 3-5x du Seed a la Series A. Cela reflete des progres significatifs dans le developpement produit, le revenu initial et la traction demontree. En dessous de 2x, cela signale souvent des progres decevants.',
        category: 'Foundational Knowledge'
      },
      {
        id: 'q_07_3',
        question_en: 'Why might a startup choose a convertible note or SAFE over a priced equity round?',
        question_fr: 'Pourquoi une startup pourrait-elle choisir une note convertible ou un SAFE plutot qu\'un tour de financement en equity ?',
        answers_en: ['Convertible instruments always give better terms to founders', 'It defers valuation negotiation and is faster and cheaper to close', 'It eliminates dilution entirely', 'Investors prefer it because it guarantees returns'],
        answers_fr: ['Les instruments convertibles donnent toujours de meilleures conditions aux fondateurs', 'Cela differe la negociation de valorisation et c\'est plus rapide et moins cher a conclure', 'Cela elimine entierement la dilution', 'Les investisseurs le preferent car cela garantit des rendements'],
        correct_answer_index: 2,
        explanation_en: 'SAFEs and convertible notes defer the valuation discussion to the next priced round, are simpler documents (lower legal costs), and close faster. They don\'t eliminate dilution - they just postpone calculating it. The discount and cap still determine the eventual conversion price.',
        explanation_fr: 'Les SAFEs et notes convertibles reportent la discussion de valorisation au prochain tour price, sont des documents plus simples (couts juridiques plus faibles), et se concluent plus rapidement. Ils n\'eliminent pas la dilution - ils reportent simplement son calcul. La decote et le cap determinent toujours le prix de conversion final.',
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
      explanation: 'The Bridge round in 2024-03 raised \u20ac800K at a \u20ac7M valuation, but the previous Series A was at \u20ac12M. This is a hidden down round disguised as a "bridge." The valuation dropped 42% but calling it a bridge makes it sound like a routine top-up rather than the warning sign it really is.',
      explanation_fr: 'Le tour Bridge en 2024-03 a leve 800K\u20ac a une valorisation de 7M\u20ac, mais la Series A precedente etait a 12M\u20ac. C\'est un down round cache deguise en "bridge." La valorisation a baisse de 42% mais l\'appeler un bridge le fait paraitre comme un complement de routine plutot que le signal d\'alerte qu\'il est reellement.',
      context_data: {
        visual_type: 'funding_timeline',
        question_en: 'Review this startup\'s funding history. One round is actually a disguised down round. Which one?',
        question_fr: 'Examinez l\'historique de financement de cette startup. Un tour est en fait un down round deguise. Lequel ?',
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
      content_en: '**The Funding Lifecycle**\n\nStartups typically raise capital in stages, each with different expectations:\n\n- **Pre-seed / FFF**: \u20ac50K-500K. Friends, family, founders. Idea stage.\n- **Seed**: \u20ac500K-3M. Angel investors, seed funds. MVP or early traction.\n- **Series A**: \u20ac3-15M. VCs. Proven product-market fit, repeatable sales process.\n- **Series B+**: \u20ac10M+. Scaling proven model. Strong unit economics.\n\n**Valuation Step-ups**\n\nEach round should show meaningful valuation increase reflecting progress. Typical step-ups: Seed to A (3-5x), A to B (2-3x).\n\n**Watch Out For**\n\n- **Down rounds**: Valuation lower than previous round. Triggers anti-dilution.\n- **Bridge rounds**: Can be healthy (extending runway to hit milestones) or a red flag (company struggling to raise a proper round).\n- **Flat rounds**: Same valuation as previous. May signal stagnation.\n- **Too-frequent small raises**: Sign the company can\'t plan finances well.',
      content_fr: '**Le cycle de financement**\n\nLes startups levent generalement des capitaux par etapes, chacune avec des attentes differentes :\n\n- **Pre-seed / FFF** : 50K-500K\u20ac. Amis, famille, fondateurs. Stade de l\'idee.\n- **Seed** : 500K-3M\u20ac. Business angels, fonds de seed. MVP ou traction initiale.\n- **Series A** : 3-15M\u20ac. VCs. Product-market fit prouve, processus de vente repeatable.\n- **Series B+** : 10M\u20ac+. Passage a l\'echelle d\'un modele prouve. Unit economics solides.\n\n**Augmentations de valorisation**\n\nChaque tour devrait montrer une augmentation significative de valorisation refletant les progres. Augmentations typiques : Seed a A (3-5x), A a B (2-3x).\n\n**Points de vigilance**\n\n- **Down rounds** : Valorisation inferieure au tour precedent. Declenche l\'anti-dilution.\n- **Bridge rounds** : Peut etre sain (extension du runway pour atteindre des jalons) ou un signal d\'alerte (l\'entreprise peine a lever un tour classique).\n- **Flat rounds** : Meme valorisation que le tour precedent. Peut signaler la stagnation.\n- **Levees petites et trop frequentes** : Signe que l\'entreprise ne sait pas planifier ses finances.',
      key_takeaway_en: 'Bridge rounds at lower valuations than the prior round are down rounds in disguise - always compare the valuation to the previous round, not just the label.',
      key_takeaway_fr: 'Les tours bridge a une valorisation inferieure au tour precedent sont des down rounds deguises - comparez toujours la valorisation au tour precedent, pas seulement le nom.',
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
    icon: '🧮',
    visual_type: 'unit_economics',
    questions: [
      {
        id: 'q_08_1',
        question_en: 'A SaaS startup charges \u20ac49.99/user/month. Hosting costs \u20ac3.20/user, support \u20ac4.50/user, and payment processing \u20ac1.50/user. What is the gross margin?',
        question_fr: 'Une startup SaaS facture 49,99\u20ac/utilisateur/mois. L\'hebergement coute 3,20\u20ac/utilisateur, le support 4,50\u20ac/utilisateur et le traitement des paiements 1,50\u20ac/utilisateur. Quelle est la marge brute ?',
        answers_en: ['81.6%', '72.0%', '90.4%', '76.2%'],
        answers_fr: ['81,6%', '72,0%', '90,4%', '76,2%'],
        correct_answer_index: 1,
        explanation_en: 'COGS per user = \u20ac3.20 + \u20ac4.50 + \u20ac1.50 = \u20ac9.20. Gross margin = (\u20ac49.99 - \u20ac9.20) / \u20ac49.99 = \u20ac40.79 / \u20ac49.99 = 81.6%. This is a healthy SaaS gross margin, well above the 70% benchmark.',
        explanation_fr: 'COGS par utilisateur = 3,20\u20ac + 4,50\u20ac + 1,50\u20ac = 9,20\u20ac. Marge brute = (49,99\u20ac - 9,20\u20ac) / 49,99\u20ac = 40,79\u20ac / 49,99\u20ac = 81,6%. C\'est une marge brute SaaS saine, bien au-dessus du benchmark de 70%.',
        category: 'KPIs / Expert Knowledge'
      },
      {
        id: 'q_08_2',
        question_en: 'Why is it a problem when a startup classifies customer success salaries as operating expense instead of COGS?',
        question_fr: 'Pourquoi est-ce un probleme quand une startup classe les salaires du customer success en charge operationnelle plutot qu\'en COGS ?',
        answers_en: ['It makes the tax bill higher', 'It artificially inflates gross margins, making the business look more scalable than it is', 'It has no impact on financial analysis', 'It only matters for public companies'],
        answers_fr: ['Cela augmente la facture fiscale', 'Cela gonfle artificiellement les marges brutes, faisant paraitre l\'entreprise plus scalable qu\'elle ne l\'est', 'Cela n\'a aucun impact sur l\'analyse financiere', 'Cela ne concerne que les entreprises cotees'],
        correct_answer_index: 2,
        explanation_en: 'If customer success is essential to delivering the product (onboarding, ongoing support), it should be in COGS. Putting it in opex inflates gross margin, making the business appear more scalable. This is one of the most common accounting tricks in SaaS startups.',
        explanation_fr: 'Si le customer success est essentiel a la livraison du produit (onboarding, support continu), il devrait etre dans le COGS. Le mettre en opex gonfle la marge brute, faisant paraitre l\'entreprise plus scalable. C\'est l\'un des tours comptables les plus courants dans les startups SaaS.',
        category: 'KPIs / Expert Knowledge'
      },
      {
        id: 'q_08_3',
        question_en: 'A startup has a CAC of \u20ac200 and LTV of \u20ac600. The payback period is 14 months. Should you invest?',
        question_fr: 'Une startup a un CAC de 200\u20ac et un LTV de 600\u20ac. La periode de retour est de 14 mois. Devriez-vous investir ?',
        answers_en: ['Yes, LTV/CAC of 3x is the gold standard', 'Probably yes, but verify how LTV is calculated and what churn assumptions are used', 'No, 14-month payback is too long', 'Yes, these are perfect metrics'],
        answers_fr: ['Oui, un LTV/CAC de 3x est le standard d\'excellence', 'Probablement oui, mais verifiez comment le LTV est calcule et quelles hypotheses de churn sont utilisees', 'Non, 14 mois de retour c\'est trop long', 'Oui, ce sont des metriques parfaites'],
        correct_answer_index: 2,
        explanation_en: 'The metrics look good (3x LTV/CAC, 14-month payback) but you must verify: Is LTV based on projected or actual data? What churn rate is assumed? Does CAC include all acquisition costs? Many startups use optimistic churn assumptions that inflate LTV significantly.',
        explanation_fr: 'Les metriques semblent bonnes (LTV/CAC de 3x, retour en 14 mois) mais vous devez verifier : Le LTV est-il base sur des donnees projetees ou reelles ? Quel taux de churn est suppose ? Le CAC inclut-il tous les couts d\'acquisition ? Beaucoup de startups utilisent des hypotheses de churn optimistes qui gonflent significativement le LTV.',
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
      explanation: '"Onboarding specialists" at \u20ac6.00/user is classified as opex (operating expense), but onboarding is a direct cost of delivering the product. It should be in COGS. Moving it to COGS changes gross margin from 72% to 60%, which is below the healthy SaaS threshold of 70%.',
      explanation_fr: '"Specialistes d\'onboarding" a 6,00\u20ac/utilisateur est classe en opex (charge operationnelle), mais l\'onboarding est un cout direct de livraison du produit. Il devrait etre dans le COGS. Le deplacer vers le COGS change la marge brute de 72% a 60%, ce qui est en dessous du seuil sain de 70% pour le SaaS.',
      context_data: {
        visual_type: 'unit_economics',
        question_en: 'This SaaS startup claims 72% gross margin. Find the misclassified cost that inflates this number.',
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
      content_en: '**What Are Unit Economics?**\n\nUnit economics measure the profitability of a single unit of your business (one customer, one transaction, one subscription). They answer: "Does this business make money at the individual level?"\n\n**Key Metrics**\n\n- **COGS (Cost of Goods Sold)**: Direct costs to deliver the product to one user\n- **Gross Margin**: (Revenue - COGS) / Revenue. Target 70%+ for SaaS\n- **CAC (Customer Acquisition Cost)**: Total sales + marketing cost / new customers acquired\n- **LTV (Lifetime Value)**: Revenue per customer x gross margin x average customer lifespan\n- **LTV/CAC Ratio**: Target 3x+. Below 1x means losing money on each customer.\n\n**Common Manipulation Tactics**\n\n- Misclassifying COGS items as operating expenses to inflate gross margin\n- Using projected LTV instead of actual measured LTV\n- Excluding certain acquisition channels from CAC calculation\n- Not fully loading COGS (e.g., leaving out payment processing or support costs)',
      content_fr: '**Qu\'est-ce que l\'economie unitaire ?**\n\nL\'economie unitaire mesure la rentabilite d\'une seule unite de votre entreprise (un client, une transaction, un abonnement). Elle repond a la question : "Cette entreprise gagne-t-elle de l\'argent au niveau individuel ?"\n\n**Metriques cles**\n\n- **COGS (Cout des marchandises vendues)** : Couts directs pour livrer le produit a un utilisateur\n- **Marge brute** : (Revenu - COGS) / Revenu. Objectif 70%+ pour le SaaS\n- **CAC (Cout d\'acquisition client)** : Cout total ventes + marketing / nouveaux clients acquis\n- **LTV (Valeur vie client)** : Revenu par client x marge brute x duree moyenne du client\n- **Ratio LTV/CAC** : Objectif 3x+. En dessous de 1x signifie perdre de l\'argent sur chaque client.\n\n**Tactiques de manipulation courantes**\n\n- Mal classer les elements COGS en charges operationnelles pour gonfler la marge brute\n- Utiliser un LTV projete au lieu d\'un LTV reel mesure\n- Exclure certains canaux d\'acquisition du calcul du CAC\n- Ne pas charger completement le COGS (par ex., omettre le traitement des paiements ou les couts de support)',
      key_takeaway_en: 'Verify that all product delivery costs (support, onboarding, infrastructure) are properly classified as COGS before trusting gross margin numbers.',
      key_takeaway_fr: 'Verifiez que tous les couts de livraison du produit (support, onboarding, infrastructure) sont correctement classes en COGS avant de faire confiance aux chiffres de marge brute.',
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
    icon: '📧',
    visual_type: 'investor_email',
    questions: [
      {
        id: 'q_09_1',
        question_en: 'What is the primary purpose of a regular investor update email?',
        question_fr: 'Quel est l\'objectif principal d\'un email de mise a jour regulier aux investisseurs ?',
        answers_en: ['To ask for more money', 'To maintain transparency, build trust, and leverage investor networks for help', 'To fulfill a legal obligation', 'To showcase vanity metrics'],
        answers_fr: ['Demander plus d\'argent', 'Maintenir la transparence, construire la confiance et tirer parti des reseaux des investisseurs pour de l\'aide', 'Remplir une obligation legale', 'Mettre en avant des metriques de vanite'],
        correct_answer_index: 2,
        explanation_en: 'Good investor updates build trust through transparency, both good and bad news. They also leverage investor expertise by explicitly asking for help (intros, advice, hiring). The best updates include specific asks that investors can act on.',
        explanation_fr: 'Les bonnes mises a jour investisseurs construisent la confiance par la transparence, les bonnes comme les mauvaises nouvelles. Elles exploitent aussi l\'expertise des investisseurs en demandant explicitement de l\'aide (introductions, conseils, recrutement). Les meilleures mises a jour incluent des demandes specifiques sur lesquelles les investisseurs peuvent agir.',
        category: 'Ecosystem & Culture'
      },
      {
        id: 'q_09_2',
        question_en: 'In an investor update, a CEO writes: "We are exploring strategic alternatives to optimize our path forward." What does this usually mean?',
        question_fr: 'Dans une mise a jour investisseur, un CEO ecrit : "Nous explorons des alternatives strategiques pour optimiser notre trajectoire." Que signifie generalement cette formulation ?',
        answers_en: ['The company is pivoting to a new product', 'The company may be looking for an acquirer or considering shutting down', 'The company is expanding to new markets', 'The company is raising a new round'],
        answers_fr: ['L\'entreprise pivote vers un nouveau produit', 'L\'entreprise cherche peut-etre un acquereur ou envisage de fermer', 'L\'entreprise se developpe sur de nouveaux marches', 'L\'entreprise leve un nouveau tour'],
        correct_answer_index: 2,
        explanation_en: '"Exploring strategic alternatives" is corporate jargon that often signals the company is struggling and may be looking for a buyer or considering winding down. Good news is usually stated directly; bad news gets wrapped in euphemisms.',
        explanation_fr: '"Explorer des alternatives strategiques" est un jargon d\'entreprise qui signale souvent que l\'entreprise est en difficulte et cherche peut-etre un acquereur ou envisage de cesser ses activites. Les bonnes nouvelles sont generalement annoncees directement ; les mauvaises sont enveloppees d\'euphemismes.',
        category: 'Ecosystem & Culture'
      },
      {
        id: 'q_09_3',
        question_en: 'Which of the following is a red flag in an investor update email?',
        question_fr: 'Lequel des elements suivants est un signal d\'alerte dans un email de mise a jour investisseur ?',
        answers_en: ['The CEO includes a "lowlights" section with honest challenges', 'Key metrics like MRR and churn are missing from the update', 'The update asks investors for specific introductions', 'The CEO mentions a team member departure and the plan to backfill'],
        answers_fr: ['Le CEO inclut une section "points negatifs" avec des defis honnetes', 'Les metriques cles comme le MRR et le churn sont absentes de la mise a jour', 'La mise a jour demande aux investisseurs des introductions specifiques', 'Le CEO mentionne le depart d\'un membre de l\'equipe et le plan pour le remplacer'],
        correct_answer_index: 2,
        explanation_en: 'Missing key metrics in an investor update is a major red flag. When founders stop sharing metrics, it usually means the numbers are bad. Transparency about challenges (lowlights) and team changes are actually positive signs of good communication.',
        explanation_fr: 'L\'absence de metriques cles dans une mise a jour investisseur est un signal d\'alerte majeur. Quand les fondateurs arretent de partager les metriques, cela signifie generalement que les chiffres sont mauvais. La transparence sur les defis et les changements d\'equipe sont en fait des signes positifs de bonne communication.',
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
    icon: '🔍',
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
        explanation_en: 'Higher growth rates mean faster compounding of future revenue. Investors assign higher multiples because today\'s $10M ARR growing at 100% YoY will be worth much more in 3 years than $10M ARR growing at 20%. This is why growth rate is the single biggest driver of SaaS valuations.',
        explanation_fr: 'Des taux de croissance plus eleves signifient une composition plus rapide du revenu futur. Les investisseurs attribuent des multiples plus eleves car 10M$ d\'ARR aujourd\'hui croissant a 100% YoY vaudra bien plus dans 3 ans que 10M$ d\'ARR croissant a 20%. C\'est pourquoi le taux de croissance est le principal moteur des valorisations SaaS.',
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
      content_en: '**What is Comparable Analysis?**\n\nComparable (comp) analysis values a startup by comparing it to similar companies with known valuations. The most common metric is EV/Revenue (Enterprise Value divided by Revenue).\n\n**Building a Good Comp Table**\n\n- Select 5-10 companies with similar business models, growth rates, and target markets\n- Use the median multiple, not the average (which is skewed by outliers)\n- Adjust for differences in growth rate, margins, and market position\n- Include public companies and recent private transactions\n\n**Common Pitfalls**\n\n- **Cherry-picking**: Only selecting the highest-valued comparables\n- **Apples to oranges**: Comparing early-stage to mature companies\n- **Ignoring growth differential**: A 10x multiple for a 100% grower is very different from 10x for a 20% grower\n- **Stale data**: Using multiples from peak markets during a downturn\n\n**The Growth Adjustment**\n\nAlways normalize for growth. The "Rule of 40" (growth rate + profit margin should exceed 40%) is a useful benchmark for SaaS companies at scale.',
      content_fr: '**Qu\'est-ce que l\'analyse des comparables ?**\n\nL\'analyse des comparables (comps) valorise une startup en la comparant a des entreprises similaires dont la valorisation est connue. La metrique la plus courante est EV/Revenu (Valeur d\'Entreprise divisee par le Revenu).\n\n**Construire un bon tableau de comparables**\n\n- Selectionnez 5-10 entreprises avec des modeles economiques, taux de croissance et marches cibles similaires\n- Utilisez le multiple median, pas la moyenne (qui est biaisee par les valeurs aberrantes)\n- Ajustez pour les differences de taux de croissance, marges et position de marche\n- Incluez les entreprises cotees et les transactions privees recentes\n\n**Pieges courants**\n\n- **Selection biaisee** : Ne selectionner que les comparables les plus valorises\n- **Comparer l\'incomparable** : Comparer des entreprises early-stage a des entreprises matures\n- **Ignorer le differentiel de croissance** : Un multiple de 10x pour une entreprise croissant a 100% est tres different de 10x pour une croissance a 20%\n- **Donnees obsoletes** : Utiliser des multiples de marches haussiers pendant un ralentissement\n\n**L\'ajustement de croissance**\n\nNormalisez toujours pour la croissance. La "Regle de 40" (taux de croissance + marge beneficiaire doit depasser 40%) est un benchmark utile pour les entreprises SaaS a l\'echelle.',
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
        explanation_en: 'With participating preferred, investors "double dip" - they get their preference first, then also share in remaining proceeds pro-rata. Non-participating must choose: take the preference OR convert to common and share pro-rata. This makes a huge difference in exit scenarios.',
        explanation_fr: 'Avec le preferentiel participatif, les investisseurs font un "double dip" - ils recoivent d\'abord leur preference, puis participent aussi aux produits restants au prorata. Le non-participatif doit choisir : prendre la preference OU convertir en ordinaire et partager au prorata. Cela fait une enorme difference dans les scenarios de sortie.',
        category: 'Foundational Knowledge'
      },
      {
        id: 'q_11_2',
        question_en: 'An investor offers a higher valuation but demands 2 board seats and participating preferred. Another offers a lower valuation with 1 board seat and non-participating preferred. As a founder, what should you prioritize?',
        question_fr: 'Un investisseur offre une valorisation plus elevee mais exige 2 sieges au conseil et du preferentiel participatif. Un autre offre une valorisation plus basse avec 1 siege au conseil et du preferentiel non-participatif. En tant que fondateur, que devriez-vous privilegier ?',
        answers_en: ['Always take the highest valuation', 'Consider the full terms package - control provisions and liquidation rights often matter more than valuation', 'Board seats don\'t matter at the early stage', 'Participating vs non-participating is irrelevant'],
        answers_fr: ['Toujours prendre la valorisation la plus elevee', 'Considerez l\'ensemble des termes - les clauses de controle et les droits de liquidation comptent souvent plus que la valorisation', 'Les sieges au conseil n\'importent pas au stade precoce', 'Participatif vs non-participatif est sans importance'],
        correct_answer_index: 2,
        explanation_en: 'Headline valuation is important but can be undermined by aggressive terms. 2x participating preferred can take significantly more in an exit than 1x non-participating at a higher valuation. Board control can lead to being fired from your own company. Evaluate the full package.',
        explanation_fr: 'La valorisation affichee est importante mais peut etre sapee par des termes agressifs. Le preferentiel participatif 2x peut prendre significativement plus lors d\'une sortie que le non-participatif 1x a une valorisation plus elevee. Le controle du conseil peut mener a etre renvoye de sa propre entreprise. Evaluez l\'ensemble du package.',
        category: 'Foundational Knowledge'
      },
      {
        id: 'q_11_3',
        question_en: 'What is a "drag-along" clause and when does it benefit founders?',
        question_fr: 'Qu\'est-ce qu\'une clause de "drag-along" et quand beneficie-t-elle aux fondateurs ?',
        answers_en: ['It forces minority shareholders to sell, which benefits founders when they want to exit but a small investor blocks the sale', 'It allows founders to drag the company into bankruptcy', 'It gives investors the right to force founders to work longer', 'It prevents any acquisition from happening'],
        answers_fr: ['Elle force les actionnaires minoritaires a vendre, ce qui beneficie aux fondateurs quand ils veulent sortir mais un petit investisseur bloque la vente', 'Elle permet aux fondateurs de mettre l\'entreprise en faillite', 'Elle donne aux investisseurs le droit de forcer les fondateurs a travailler plus longtemps', 'Elle empeche toute acquisition'],
        correct_answer_index: 1,
        explanation_en: 'Drag-along rights force minority shareholders to participate in a sale approved by the majority. This helps founders when they find a buyer but a small shareholder refuses to sell. However, it can also be used by majority investors against founder wishes if the investors hold enough shares.',
        explanation_fr: 'Les droits de drag-along forcent les actionnaires minoritaires a participer a une vente approuvee par la majorite. Cela aide les fondateurs quand ils trouvent un acquereur mais un petit actionnaire refuse de vendre. Cependant, cela peut aussi etre utilise par les investisseurs majoritaires contre la volonte des fondateurs si les investisseurs detiennent suffisamment d\'actions.',
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
      explanation: 'Offer A is better for the founder despite a slightly higher valuation on Offer B. Offer A has 1x non-participating preferred (standard), founder-majority board (2 founders + 1 investor), and a higher pre-money. Offer B has 2x participating preferred (double dip!), investor-majority board (2 investors + 1 founder), which means they could fire you and take a disproportionate share of any exit.',
      explanation_fr: 'L\'Offre A est meilleure pour le fondateur malgre une valorisation legerement plus elevee pour l\'Offre B. L\'Offre A a un preferentiel non-participatif 1x (standard), un conseil a majorite fondateurs (2 fondateurs + 1 investisseur), et un pre-money plus eleve. L\'Offre B a un preferentiel participatif 2x (double dip !), un conseil a majorite investisseurs (2 investisseurs + 1 fondateur), ce qui signifie qu\'ils pourraient vous renvoyer et prendre une part disproportionnee de toute sortie.',
      context_data: {
        question_en: 'Which deal offers better terms for the founder?',
        question_fr: 'Quel deal offre de meilleures conditions pour le fondateur ?',
        option_a: {
          title: 'Offer A - VC Fund',
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
      content_en: '**Beyond the Headline Valuation**\n\nFounders often fixate on valuation, but the terms of the deal can matter more than the price. A \u20ac10M valuation with aggressive terms can leave founders worse off than a \u20ac7M valuation with clean terms.\n\n**Key Terms to Compare**\n\n- **Liquidation preference**: 1x non-participating is founder-friendly. Anything higher or participating is aggressive.\n- **Board composition**: Founders should maintain control at seed and Series A. Losing board control means losing the company.\n- **Anti-dilution**: Weighted average is standard. Full ratchet is very investor-friendly.\n- **Protective provisions**: How many decisions require investor approval?\n- **Founder vesting**: Is it standard 4-year/1-year cliff, or are there unusual terms?\n\n**The "Waterfall" Analysis**\n\nAlways model out different exit scenarios (\u20ac5M, \u20ac20M, \u20ac100M) to see how much founders actually receive under each offer\'s terms. Participating preferred and multiple liquidation preferences dramatically reduce founder payouts in modest exits.',
      content_fr: '**Au-dela de la valorisation affichee**\n\nLes fondateurs se focalisent souvent sur la valorisation, mais les termes du deal peuvent compter plus que le prix. Une valorisation de 10M\u20ac avec des termes agressifs peut laisser les fondateurs dans une pire situation qu\'une valorisation de 7M\u20ac avec des termes propres.\n\n**Termes cles a comparer**\n\n- **Preference de liquidation** : 1x non-participatif est favorable aux fondateurs. Tout ce qui est superieur ou participatif est agressif.\n- **Composition du conseil** : Les fondateurs devraient maintenir le controle au seed et Series A. Perdre le controle du conseil signifie perdre l\'entreprise.\n- **Anti-dilution** : La moyenne ponderee est standard. Le full ratchet est tres favorable aux investisseurs.\n- **Clauses protectrices** : Combien de decisions necessitent l\'approbation des investisseurs ?\n- **Vesting fondateurs** : Est-ce le standard 4 ans/1 an de cliff, ou y a-t-il des termes inhabituels ?\n\n**L\'analyse en "cascade"**\n\nModelisez toujours differents scenarios de sortie (5M\u20ac, 20M\u20ac, 100M\u20ac) pour voir combien les fondateurs recoivent reellement sous les termes de chaque offre. Le preferentiel participatif et les preferences de liquidation multiples reduisent dramatiquement les paiements aux fondateurs dans les sorties modestes.',
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
    icon: '📝',
    visual_type: 'ab_choice',
    questions: [
      {
        id: 'q_12_1',
        question_en: 'What is a SAFE (Simple Agreement for Future Equity)?',
        question_fr: 'Qu\'est-ce qu\'un SAFE (Simple Agreement for Future Equity) ?',
        answers_en: ['A type of loan that must be repaid with interest', 'An agreement where an investor gives money now in exchange for equity in a future priced round', 'A government-backed insurance for startup investments', 'A stock purchase agreement at a fixed price'],
        answers_fr: ['Un type de pret qui doit etre rembourse avec interets', 'Un accord ou un investisseur donne de l\'argent maintenant en echange d\'equity lors d\'un futur tour price', 'Une assurance gouvernementale pour les investissements en startup', 'Un contrat d\'achat d\'actions a prix fixe'],
        correct_answer_index: 2,
        explanation_en: 'A SAFE is an investment instrument created by Y Combinator. The investor provides capital now, and it converts to equity in the next priced funding round. Key terms include a valuation cap and/or discount rate that determine the conversion price.',
        explanation_fr: 'Un SAFE est un instrument d\'investissement cree par Y Combinator. L\'investisseur fournit du capital maintenant, et il se convertit en equity lors du prochain tour de financement price. Les termes cles incluent un cap de valorisation et/ou un taux de decote qui determinent le prix de conversion.',
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
        explanation_en: 'Stacking multiple SAFEs creates "hidden" dilution that only becomes visible at conversion. Founders may not realize how much ownership they have given away until the priced round happens and all SAFEs convert simultaneously. This is sometimes called "SAFE stacking."',
        explanation_fr: 'Empiler plusieurs SAFEs cree une dilution "cachee" qui ne devient visible qu\'a la conversion. Les fondateurs peuvent ne pas realiser combien de propriete ils ont cede jusqu\'a ce que le tour price arrive et que tous les SAFEs se convertissent simultanement. C\'est parfois appele le "SAFE stacking."',
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
      explanation: 'For an early-stage startup, the SAFE (Option A) is better. It has no interest, no maturity date, simpler documents, and lower legal costs. The convertible note (Option B) has interest accrual, a maturity date (creating pressure to raise), and is technically debt that could force repayment. The SAFE also has a lower cap, meaning the startup gives less equity away.',
      explanation_fr: 'Pour une startup early-stage, le SAFE (Option A) est meilleur. Il n\'a pas d\'interets, pas de date d\'echeance, des documents plus simples et des couts juridiques plus faibles. La note convertible (Option B) a des interets cumules, une date d\'echeance (creant une pression pour lever), et est techniquement une dette qui pourrait forcer le remboursement. Le SAFE a aussi un cap plus bas, ce qui signifie que la startup cede moins d\'equity.',
      context_data: {
        question_en: 'You are a pre-seed startup. Which instrument is better for your first \u20ac300K raise?',
        question_fr: 'Vous etes une startup pre-seed. Quel instrument est meilleur pour votre premiere levee de 300K\u20ac ?',
        option_a: {
          title: 'Option A - SAFE',
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
      content_en: '**Three Ways to Invest Early**\n\nEarly-stage startups typically use one of three instruments:\n\n**SAFE (Simple Agreement for Future Equity)**\n- Created by Y Combinator, now standard for pre-seed/seed\n- Not debt, no interest, no maturity date\n- Converts to equity at next priced round\n- Key terms: Valuation cap and/or discount\n- Fast to close, low legal costs (\u20ac1-3K)\n\n**Convertible Note**\n- Technically debt that converts to equity\n- Has interest (typically 4-8%) and a maturity date (18-24 months)\n- If maturity hits without conversion, it becomes repayable debt\n- Higher legal costs than SAFE\n\n**Priced Equity Round**\n- Direct purchase of shares at a set price per share\n- Requires full legal documentation (more expensive)\n- Creates a clear cap table with defined ownership\n- Standard from Series A onward\n\n**When to Use What**\n\n- Pre-seed: SAFE (simplest, fastest)\n- Seed: SAFE or priced round (depends on size)\n- Series A+: Always priced equity round',
      content_fr: '**Trois facons d\'investir tot**\n\nLes startups early-stage utilisent typiquement l\'un de ces trois instruments :\n\n**SAFE (Simple Agreement for Future Equity)**\n- Cree par Y Combinator, maintenant standard pour le pre-seed/seed\n- Pas une dette, pas d\'interets, pas de date d\'echeance\n- Se convertit en equity au prochain tour price\n- Termes cles : Cap de valorisation et/ou decote\n- Rapide a conclure, couts juridiques faibles (1-3K\u20ac)\n\n**Note convertible**\n- Techniquement une dette qui se convertit en equity\n- A des interets (typiquement 4-8%) et une date d\'echeance (18-24 mois)\n- Si l\'echeance arrive sans conversion, cela devient une dette remboursable\n- Couts juridiques plus eleves que le SAFE\n\n**Tour de financement price**\n- Achat direct d\'actions a un prix defini par action\n- Necessite une documentation juridique complete (plus couteux)\n- Cree une cap table claire avec une propriete definie\n- Standard a partir de la Series A\n\n**Quand utiliser quoi**\n\n- Pre-seed : SAFE (le plus simple, le plus rapide)\n- Seed : SAFE ou tour price (depend de la taille)\n- Series A+ : Toujours un tour d\'equity price',
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
        explanation_en: 'Without written contracts: IP may legally belong to the founders personally (not the company), founders can leave with no restrictions, there is no non-compete or confidentiality protection, and the company has a weak legal foundation. This is a dealbreaker for most investors.',
        explanation_fr: 'Sans contrats ecrits : la PI peut legalement appartenir aux fondateurs personnellement (pas a l\'entreprise), les fondateurs peuvent partir sans restrictions, il n\'y a pas de protection de non-concurrence ou de confidentialite, et l\'entreprise a une base juridique faible. C\'est un critere eliminatoire pour la plupart des investisseurs.',
        category: 'Ecosystem & Culture'
      },
      {
        id: 'q_13_2',
        question_en: 'What is the most important thing to verify about a startup\'s intellectual property during due diligence?',
        question_fr: 'Quelle est la chose la plus importante a verifier concernant la propriete intellectuelle d\'une startup lors de la due diligence ?',
        answers_en: ['That they have filed for patents', 'That all IP is properly assigned to the company (not owned by individuals, contractors, or previous employers)', 'That they use proprietary technology', 'That they have a large patent portfolio'],
        answers_fr: ['Qu\'ils ont depose des brevets', 'Que toute la PI est correctement assignee a l\'entreprise (pas detenue par des individus, des prestataires ou des employeurs precedents)', 'Qu\'ils utilisent une technologie proprietaire', 'Qu\'ils ont un grand portefeuille de brevets'],
        correct_answer_index: 2,
        explanation_en: 'IP assignment is critical. If code was written by contractors without proper assignment clauses, or by founders who were employed elsewhere at the time, the company may not legally own its core technology. This is one of the most common due diligence issues.',
        explanation_fr: 'L\'assignation de la PI est critique. Si le code a ete ecrit par des prestataires sans clauses d\'assignation appropriees, ou par des fondateurs qui etaient employes ailleurs a l\'epoque, l\'entreprise peut ne pas legalement posseder sa technologie principale. C\'est l\'un des problemes de due diligence les plus courants.',
        category: 'Ecosystem & Culture'
      },
      {
        id: 'q_13_3',
        question_en: 'You notice a startup has 80% of its revenue from a single customer. What type of risk is this?',
        question_fr: 'Vous remarquez qu\'une startup tire 80% de son revenu d\'un seul client. Quel type de risque est-ce ?',
        answers_en: ['Technology risk', 'Customer concentration risk - if that one customer churns, the business collapses', 'Market risk', 'Regulatory risk'],
        answers_fr: ['Risque technologique', 'Risque de concentration client - si ce client part, l\'entreprise s\'effondre', 'Risque de marche', 'Risque reglementaire'],
        correct_answer_index: 2,
        explanation_en: 'Customer concentration risk means the business is dangerously dependent on a few customers. If the top customer represents more than 25-30% of revenue, it is a significant risk. At 80%, losing that customer would be catastrophic. Diversification is essential for sustainable growth.',
        explanation_fr: 'Le risque de concentration client signifie que l\'entreprise est dangereusement dependante de quelques clients. Si le premier client represente plus de 25-30% du revenu, c\'est un risque significatif. A 80%, perdre ce client serait catastrophique. La diversification est essentielle pour une croissance durable.',
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
      explanation: 'IP assignment shows "Completed" with a green trend, but it says "verbal agreements." Verbal IP assignments are not enforceable in most jurisdictions. Without written IP assignment agreements, the company may not legally own its code, designs, or inventions. This should be flagged as a critical blocker, not a completed item.',
      explanation_fr: 'L\'assignation de la PI affiche "Complete" avec une tendance verte, mais elle dit "accords verbaux." Les assignations verbales de PI ne sont pas executoires dans la plupart des juridictions. Sans accords ecrits d\'assignation de PI, l\'entreprise peut ne pas legalement posseder son code, ses designs ou ses inventions. Cela devrait etre signale comme un bloqueur critique, pas un element complete.',
      context_data: {
        visual_type: 'metric_cards',
        question_en: 'Review this due diligence status board. One item is showing a green status but actually has a critical issue hiding in the details.',
        question_fr: 'Examinez ce tableau de bord de due diligence. Un element affiche un statut vert mais a en realite un probleme critique cache dans les details.',
        rows: [
          { id: 'card1', icon: '📋', label: 'Employment Contracts', value: 'All signed', trend: 'Complete' },
          { id: 'card2', icon: '💰', label: 'Financial Audit', value: 'Clean report', trend: 'Complete' },
          { id: 'card3', icon: '⚖️', label: 'Legal Structure', value: 'SAS registered', trend: 'Complete' },
          { id: 'card4', icon: '🔒', label: 'IP Assignment', value: 'Verbal agreements', trend: 'Complete' },
          { id: 'card5', icon: '📊', label: 'Customer Contracts', value: '12 active', trend: '+3 this quarter' }
        ]
      }
    },
    lesson: {
      id: 'ls_13',
      title_en: 'Due Diligence Essentials for Startup Investors',
      title_fr: 'Les essentiels de la due diligence pour les investisseurs en startups',
      content_en: '**What is Due Diligence?**\n\nDue diligence is the investigation process before making an investment. It verifies the startup\'s claims, identifies risks, and ensures there are no hidden problems.\n\n**Key Areas to Investigate**\n\n- **Legal**: Corporate structure, IP ownership, employment contracts, regulatory compliance\n- **Financial**: Revenue verification, burn rate accuracy, cap table correctness, outstanding debts\n- **Product**: Technology assessment, competitive moat, scalability\n- **Team**: Background checks, reference calls, founder relationships\n- **Market**: Total addressable market, competitive landscape, timing\n\n**Common Due Diligence Dealbreakers**\n\n- IP not properly assigned to the company\n- Missing or incorrect cap table\n- Undisclosed debts or legal disputes\n- Customer concentration above 30% in one client\n- Founder conflicts or missing vesting agreements\n\n**The Process**\n\nTypically takes 2-6 weeks. Larger rounds require more thorough DD. Seed investments may have lighter DD but should still cover IP, cap table, and basic financials.',
      content_fr: '**Qu\'est-ce que la due diligence ?**\n\nLa due diligence est le processus d\'investigation avant de faire un investissement. Elle verifie les affirmations de la startup, identifie les risques et s\'assure qu\'il n\'y a pas de problemes caches.\n\n**Domaines cles a investiguer**\n\n- **Juridique** : Structure societaire, propriete de la PI, contrats de travail, conformite reglementaire\n- **Financier** : Verification du revenu, precision du burn rate, exactitude de la cap table, dettes en cours\n- **Produit** : Evaluation technologique, avantage concurrentiel, scalabilite\n- **Equipe** : Verification des antecedents, appels de references, relations entre fondateurs\n- **Marche** : Marche total adressable, paysage concurrentiel, timing\n\n**Criteres eliminatoires courants**\n\n- PI non correctement assignee a l\'entreprise\n- Cap table manquante ou incorrecte\n- Dettes ou litiges juridiques non divulgues\n- Concentration client superieure a 30% sur un client\n- Conflits entre fondateurs ou accords de vesting manquants\n\n**Le processus**\n\nDure typiquement 2-6 semaines. Les tours plus importants necessitent une DD plus approfondie. Les investissements seed peuvent avoir une DD plus legere mais devraient quand meme couvrir la PI, la cap table et les finances de base.',
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
    icon: '🔥',
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
        explanation_en: 'Fundraising typically takes 3-6 months. Starting with 6-9 months of runway remaining gives enough buffer to complete the process without desperation pricing. Starting too late forces founders to accept bad terms. Below 3 months, you are in "emergency mode."',
        explanation_fr: 'La levee de fonds prend typiquement 3-6 mois. Commencer avec 6-9 mois de runway restant donne suffisamment de marge pour completer le processus sans pricing de desespoir. Commencer trop tard force les fondateurs a accepter de mauvais termes. En dessous de 3 mois, vous etes en "mode urgence."',
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
      explanation: 'November shows a burn rate of \u20ac120K - a sudden 50% spike from October (\u20ac80K). While December returns to \u20ac85K, the November spike is unexplained. It could be a one-time cost, but an unacknowledged 50% burn spike is a red flag that suggests poor financial discipline or hidden expenses the CEO is not explaining.',
      explanation_fr: 'Novembre affiche un burn rate de 120K\u20ac - un pic soudain de 50% par rapport a octobre (80K\u20ac). Bien que decembre revienne a 85K\u20ac, le pic de novembre est inexplique. Cela pourrait etre un cout ponctuel, mais un pic de burn de 50% non reconnu est un signal d\'alerte qui suggere une mauvaise discipline financiere ou des depenses cachees que le CEO n\'explique pas.',
      context_data: {
        visual_type: 'bar_chart',
        question_en: 'The CEO says burn rate has been "stable and controlled" for the past 6 months. Which month contradicts this claim?',
        question_fr: 'Le CEO dit que le burn rate est "stable et controle" depuis 6 mois. Quel mois contredit cette affirmation ?',
        claim_en: 'CEO states: "Our burn has remained stable at approximately \u20ac80K/month throughout H2"',
        claim_fr: 'Le CEO declare : "Notre burn est reste stable a environ 80K\u20ac/mois pendant tout le S2"',
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
      content_en: '**Burn Rate Fundamentals**\n\nBurn rate measures how fast a startup spends its cash reserves. It is arguably the most important operational metric for an early-stage company.\n\n**Key Calculations**\n\n- **Gross burn**: Total monthly expenses (cash out)\n- **Net burn**: Total monthly expenses minus revenue (net cash consumed)\n- **Runway**: Cash in bank / monthly net burn = months until cash runs out\n- **Default alive/dead**: If the startup reaches profitability before running out of cash, they are "default alive"\n\n**What Drives Burn**\n\n- People costs (typically 60-80% of startup expenses)\n- Infrastructure and hosting\n- Marketing and customer acquisition\n- Office and administrative costs\n\n**Burn Rate Red Flags**\n\n- Unexplained spikes in monthly burn\n- Burn increasing faster than revenue\n- Runway calculations that assume revenue growth\n- Committed future expenses not reflected in current burn (new hires, office leases)\n- No plan to reach profitability or raise before cash runs out',
      content_fr: '**Fondamentaux du burn rate**\n\nLe burn rate mesure a quelle vitesse une startup depense ses reserves de tresorerie. C\'est probablement la metrique operationnelle la plus importante pour une entreprise en phase precoce.\n\n**Calculs cles**\n\n- **Gross burn** : Depenses mensuelles totales (sorties de tresorerie)\n- **Net burn** : Depenses mensuelles totales moins le revenu (tresorerie nette consommee)\n- **Runway** : Tresorerie en banque / net burn mensuel = mois avant d\'etre a court de tresorerie\n- **Default alive/dead** : Si la startup atteint la rentabilite avant de manquer de tresorerie, elle est "default alive"\n\n**Ce qui genere le burn**\n\n- Couts de personnel (typiquement 60-80% des depenses de startup)\n- Infrastructure et hebergement\n- Marketing et acquisition client\n- Bureau et couts administratifs\n\n**Signaux d\'alerte du burn rate**\n\n- Pics inexpliques du burn mensuel\n- Burn augmentant plus vite que le revenu\n- Calculs de runway qui supposent une croissance du revenu\n- Depenses futures engagees non refletees dans le burn actuel (nouvelles embauches, baux de bureaux)\n- Pas de plan pour atteindre la rentabilite ou lever avant que le cash ne s\'epuise',
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
    icon: '🎯',
    visual_type: 'ab_choice',
    questions: [
      {
        id: 'q_15_1',
        question_en: 'Why do experienced angel investors typically build portfolios of 20+ startup investments rather than concentrating on 2-3 "best" picks?',
        question_fr: 'Pourquoi les business angels experimentes construisent-ils typiquement des portefeuilles de 20+ investissements en startups plutot que de se concentrer sur 2-3 "meilleurs" choix ?',
        answers_en: ['Because they cannot identify the best startups', 'Because startup returns follow a power law - a few massive winners drive all returns, and you cannot predict which ones in advance', 'Because larger portfolios are easier to manage', 'Because it reduces their tax burden'],
        answers_fr: ['Parce qu\'ils ne peuvent pas identifier les meilleures startups', 'Parce que les rendements des startups suivent une loi de puissance - quelques gagnants massifs generent tous les rendements, et on ne peut pas predire lesquels a l\'avance', 'Parce que les portefeuilles plus grands sont plus faciles a gerer', 'Parce que cela reduit leur charge fiscale'],
        correct_answer_index: 2,
        explanation_en: 'Startup returns follow a power law distribution: in a typical fund, 1-2 investments generate 80%+ of all returns. Since even the best investors cannot reliably pick winners, diversification (20-30+ investments) ensures you have enough "shots on goal" to capture those outlier returns.',
        explanation_fr: 'Les rendements des startups suivent une distribution en loi de puissance : dans un fonds typique, 1-2 investissements generent 80%+ de tous les rendements. Comme meme les meilleurs investisseurs ne peuvent pas choisir de maniere fiable les gagnants, la diversification (20-30+ investissements) garantit d\'avoir assez de "tirs au but" pour capturer ces rendements exceptionnels.',
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
        explanation_en: 'Follow-on investing means reserving 50%+ of your total fund to invest more in your winners. Since you can identify winners after 12-18 months of performance data, follow-on capital lets you double down on proven companies rather than spreading equally across all investments.',
        explanation_fr: 'Le follow-on investing signifie reserver 50%+ de votre fonds total pour investir davantage dans vos gagnants. Comme vous pouvez identifier les gagnants apres 12-18 mois de donnees de performance, le capital de follow-on vous permet de doubler la mise sur les entreprises prouvees plutot que de repartir egalement entre tous les investissements.',
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
      explanation: 'Strategy B is better despite deploying less per initial deal. It invests in 25 startups (vs 5), providing critical diversification given the power law. It reserves 60% for follow-on in winners (vs 0%). Strategy A\'s concentration in 5 deals with no follow-on reserve is extremely risky - statistically, 2-3 of those 5 will return zero, and without follow-on capital, you cannot maintain your stake in winners.',
      explanation_fr: 'La Strategie B est meilleure malgre un deploiement moindre par deal initial. Elle investit dans 25 startups (vs 5), fournissant une diversification critique etant donne la loi de puissance. Elle reserve 60% pour le follow-on dans les gagnants (vs 0%). La concentration de la Strategie A sur 5 deals sans reserve de follow-on est extremement risquee - statistiquement, 2-3 de ces 5 retourneront zero, et sans capital de follow-on, vous ne pouvez pas maintenir votre participation dans les gagnants.',
      context_data: {
        question_en: 'You have \u20ac500K to invest in startups over the next 3 years. Which portfolio strategy is better?',
        question_fr: 'Vous avez 500K\u20ac a investir dans des startups sur les 3 prochaines annees. Quelle strategie de portefeuille est meilleure ?',
        option_a: {
          title: 'Strategy A - Concentrated',
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
      content_en: '**The Power Law of Startup Returns**\n\nStartup investing follows a power law: a tiny fraction of investments generate the vast majority of returns. In a typical angel portfolio, 1-2 companies out of 20-30 will drive 80%+ of total returns. 30-50% of investments will return zero.\n\n**Portfolio Construction Best Practices**\n\n- **Diversify**: Target 20-30+ investments minimum\n- **Reserve for follow-on**: Keep 50-60% of your capital for reinvesting in winners\n- **Consistent check sizes**: Avoid putting too much into any single initial deal\n- **Time diversification**: Invest across 2-3 years of vintages, not all at once\n\n**The Math of Angel Investing**\n\nWith a 25-company portfolio at \u20ac10K each (\u20ac250K total):\n- ~10 will return \u20ac0 (total loss)\n- ~8 will return 0.5-2x (\u20ac40-160K total)\n- ~5 will return 2-5x (\u20ac100-250K total)\n- ~2 will return 10x+ (\u20ac200K+ total)\n- The 2 winners make the entire portfolio profitable\n\n**Common Mistakes**\n\n- Over-concentrating in a few "sure things" (there are no sure things)\n- Spending all capital upfront with no follow-on reserves\n- Not tracking portfolio performance rigorously\n- Emotional investing rather than systematic approach',
      content_fr: '**La loi de puissance des rendements startup**\n\nL\'investissement en startup suit une loi de puissance : une infime fraction des investissements genere la grande majorite des rendements. Dans un portefeuille d\'ange typique, 1-2 entreprises sur 20-30 genereront 80%+ des rendements totaux. 30-50% des investissements retourneront zero.\n\n**Meilleures pratiques de construction de portefeuille**\n\n- **Diversifier** : Viser 20-30+ investissements minimum\n- **Reserver pour le follow-on** : Garder 50-60% de votre capital pour reinvestir dans les gagnants\n- **Tailles de tickets coherentes** : Eviter de mettre trop dans un seul deal initial\n- **Diversification temporelle** : Investir sur 2-3 annees de millesimes, pas tout d\'un coup\n\n**Les mathematiques de l\'investissement angel**\n\nAvec un portefeuille de 25 entreprises a 10K\u20ac chacune (250K\u20ac total) :\n- ~10 retourneront 0\u20ac (perte totale)\n- ~8 retourneront 0,5-2x (40-160K\u20ac total)\n- ~5 retourneront 2-5x (100-250K\u20ac total)\n- ~2 retourneront 10x+ (200K\u20ac+ total)\n- Les 2 gagnants rendent le portefeuille entier profitable\n\n**Erreurs courantes**\n\n- Sur-concentrer dans quelques "valeurs sures" (il n\'y a pas de valeur sure)\n- Depenser tout le capital d\'avance sans reserves de follow-on\n- Ne pas suivre rigoureusement la performance du portefeuille\n- Investir sur l\'emotion plutot qu\'avec une approche systematique',
      key_takeaway_en: 'Diversification across 20+ startups with 50-60% reserved for follow-on is the proven strategy - concentration in a few picks ignores the power law of venture returns.',
      key_takeaway_fr: 'La diversification sur 20+ startups avec 50-60% reserve pour le follow-on est la strategie prouvee - la concentration sur quelques choix ignore la loi de puissance des rendements en venture.',
      theme: 'portfolio_construction'
    }
  }
];