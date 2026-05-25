// ============ i18n ============
    let LANG = localStorage.getItem('holdem-lang') || 'ko';

    const I18N = {
        ko: {
            title: '🃏 홀덤쌤', subtitle: '초보를 위한 홀덤 트레이닝 ✨', langBtn: 'EN',
            navPre: '프리플랍', navQuiz: '퀴즈', navOuts: '아웃츠', navGloss: '용어',
            tabCli: 'CLI', tabGui: 'GUI', tabPractice: '연습', tabCalc: '계산기',
            cliPlaceholder: 'utg aks', cliWaiting: '입력 대기중...',
            position: '포지션', situation: '상황', myCards: '내 카드', open: '오픈', vsRaise: 'vs 레이즈',
            selectPosCards: '포지션과 카드 선택', reset: '초기화',
            score: '점수:', accuracy: '정답률:', streak: '연속!',
            afterSettings: '설정 후 시작', all: '전체', both: '둘 다', openOnly: '오픈만', vsOnly: 'vs만',
            difficulty: '난이도', allHands: '전체', borderHands: '경계 핸드',
            startQuiz: '퀴즈 시작 🚀', next: '다음', correct: '🎉 정답!', wrong: '😅 오답',
            selectPos: '포지션 선택',
            raise: 'RAISE', call: 'CALL', fold: 'FOLD',
            rangeRaise: '레이즈', rangeCall: '콜', rangeFold: '폴드', rangeCurrent: '현재',
            outsQ: '아웃츠는 몇 개?', outsStart: '아웃츠 연습 시작 🚀', outsAnswer: '개', confirm: '확인',
            rule24: '2-4 룰', rule24t: '턴+리버: 아웃츠 × 4 = 확률%', rule24r: '리버만: 아웃츠 × 2 = 확률%',
            commonOuts: '흔한 아웃츠',
            flushDraw: '플러시 드로우: 9', openEnd: '오픈엔드: 8', gutshot: '거트샷: 4',
            twoPairFH: '투페어→풀하우스: 4', onePairTrips: '원페어→트리플: 2',
            potCalc: '🧮 팟 오즈 계산기', pot: '팟', bet: '벳', outs: '아웃츠', calc: '계산',
            potBetReq: '팟과 벳을 입력하세요', needed: '필요 확률:',
            callOkRiver: '리버만 남아도 콜 OK', callOkTurn: '턴+리버면 콜 OK', foldMath: '폴드가 수학적으로 맞음',
            glossSearch: '용어 검색...',
            river: '리버', turnRiver: '턴+리버',
            noOneIn: '아무도 안 들어왔다', oppRaised: '상대가 레이즈했다',
            srcPreflop: '기준: 6-Max Cash GTO Preflop Charts (100BB, RFI/vs Raise)',
            srcOuts: '기준: Standard Outs Count (52장 덱 기본 확률 계산)',
            hintPQ: '<kbd>R</kbd> <kbd>C</kbd> <kbd>F</kbd> · 다음 <kbd>N</kbd>',
            cliHelp: '<code>[포지션] [핸드]</code> Enter<br>포지션: <code>utg</code> <code>mp</code> <code>co</code> <code>btn</code> <code>sb</code> <code>bb</code><br>핸드: <code>aa</code> <code>aks</code> <code>kqo</code> · vs레이즈: <code>v co aks</code>',
            navPlay: '플레이', setupTitle: '🎮 테이블 설정',
            playerCount: '인원수', aiProfile: 'AI 성향',
            startSession: '세션 시작 🚀', endSession: '세션 종료',
            rebuy: '리바이', nextHand: '다음 핸드',
            simReview: '리뷰', simStats: '통계',
            simFold: '폴드', simCheck: '체크', simCall: '콜',
            simBet: '벳', simRaise: '레이즈', simAllIn: '올인',
            potLabel: '팟', stackLabel: '스택', blindsLabel: '블라인드',
            handsPlayed: '핸드 수', winRate: '승률(BB/핸드)',
            vpipLabel: 'VPIP', pfrLabel: 'PFR', afLabel: 'AF',
            showdownPct: '쇼다운 %', chipGraph: '칩 그래프',
            simCorrect: '👍 정답', simSuboptimal: '🤔 아쉬움', simMistake: '❌ 실수',
            preflopStreet: '프리플랍', flopStreet: '플랍', turnStreet: '턴', riverStreet: '리버',
            yourAction: '내 액션', recommended: '추천',
            bust: '💸 파산', sessionSummary: '📊 세션 요약', profit: '수익',
            tight: '타이트', regular: '레귤러', loose: '루즈', aggressive: '어그레시브',
        },
        en: {
            title: '🃏 HoldemSsam', subtitle: 'Holdem Training for Beginners ✨', langBtn: '한',
            navPre: 'Preflop', navQuiz: 'Quiz', navOuts: 'Outs', navGloss: 'Glossary',
            tabCli: 'CLI', tabGui: 'GUI', tabPractice: 'Practice', tabCalc: 'Calculator',
            cliPlaceholder: 'utg aks', cliWaiting: 'Waiting for input...',
            position: 'Position', situation: 'Situation', myCards: 'My Cards', open: 'Open', vsRaise: 'vs Raise',
            selectPosCards: 'Select position and cards', reset: 'Reset',
            score: 'Score:', accuracy: 'Accuracy:', streak: 'streak!',
            afterSettings: 'Configure and start', all: 'All', both: 'Both', openOnly: 'Open only', vsOnly: 'vs only',
            difficulty: 'Difficulty', allHands: 'All', borderHands: 'Borderline',
            startQuiz: 'Start Quiz 🚀', next: 'Next', correct: '🎉 Correct!', wrong: '😅 Wrong',
            selectPos: 'Select position',
            raise: 'RAISE', call: 'CALL', fold: 'FOLD',
            rangeRaise: 'Raise', rangeCall: 'Call', rangeFold: 'Fold', rangeCurrent: 'Current',
            outsQ: 'How many outs?', outsStart: 'Start Outs Practice 🚀', outsAnswer: 'outs', confirm: 'Submit',
            rule24: 'Rule of 2 & 4', rule24t: 'Turn+River: Outs × 4 = %', rule24r: 'River only: Outs × 2 = %',
            commonOuts: 'Common Outs',
            flushDraw: 'Flush draw: 9', openEnd: 'Open-ended: 8', gutshot: 'Gutshot: 4',
            twoPairFH: 'Two pair→Full house: 4', onePairTrips: 'One pair→Trips: 2',
            potCalc: '🧮 Pot Odds Calculator', pot: 'Pot', bet: 'Bet', outs: 'Outs', calc: 'Calculate',
            potBetReq: 'Enter pot and bet', needed: 'Required equity:',
            callOkRiver: 'Call OK (river only)', callOkTurn: 'Call OK (turn+river)', foldMath: 'Fold is mathematically correct',
            glossSearch: 'Search terms...',
            river: 'River', turnRiver: 'Turn+River',
            noOneIn: 'No one has entered', oppRaised: 'Opponent raised',
            srcPreflop: 'Source: 6-Max Cash GTO Preflop Charts (100BB, RFI/vs Raise)',
            srcOuts: 'Source: Standard Outs Count (52-card deck probability)',
            hintPQ: '<kbd>R</kbd> <kbd>C</kbd> <kbd>F</kbd> · Next <kbd>N</kbd>',
            cliHelp: '<code>[position] [hand]</code> Enter<br>Position: <code>utg</code> <code>mp</code> <code>co</code> <code>btn</code> <code>sb</code> <code>bb</code><br>Hand: <code>aa</code> <code>aks</code> <code>kqo</code> · vs raise: <code>v co aks</code>',
            navPlay: 'Play', setupTitle: '🎮 Table Setup',
            playerCount: 'Players', aiProfile: 'AI Profile',
            startSession: 'Start Session 🚀', endSession: 'End Session',
            rebuy: 'Rebuy', nextHand: 'Next Hand',
            simReview: 'Review', simStats: 'Stats',
            simFold: 'Fold', simCheck: 'Check', simCall: 'Call',
            simBet: 'Bet', simRaise: 'Raise', simAllIn: 'All-in',
            potLabel: 'Pot', stackLabel: 'Stack', blindsLabel: 'Blinds',
            handsPlayed: 'Hands', winRate: 'Win Rate (BB/hand)',
            vpipLabel: 'VPIP', pfrLabel: 'PFR', afLabel: 'AF',
            showdownPct: 'Showdown %', chipGraph: 'Chip Graph',
            simCorrect: '👍 Correct', simSuboptimal: '🤔 Suboptimal', simMistake: '❌ Mistake',
            preflopStreet: 'Preflop', flopStreet: 'Flop', turnStreet: 'Turn', riverStreet: 'River',
            yourAction: 'Your Action', recommended: 'Recommended',
            bust: '💸 Busted', sessionSummary: '📊 Session Summary', profit: 'Profit',
            tight: 'Tight', regular: 'Regular', loose: 'Loose', aggressive: 'Aggressive',
        }
    };

    const GLOSSARY_EN = [
        {name:'All-in',desc:'Betting all your remaining chips'},
        {name:'Ante',desc:'A forced bet all players make before the hand starts (tournaments)'},
        {name:'Outs',desc:'Cards remaining in the deck that can improve your hand to a winner'},
        {name:'Open',desc:'The first raise when no one has bet yet'},
        {name:'Overcard',desc:'A hole card higher than any card on the board'},
        {name:'Offsuit',desc:'Two cards of different suits'},
        {name:'Value Bet',desc:'Betting expecting a weaker hand to call'},
        {name:'Buy-in',desc:'The amount required to join a game'},
        {name:'Bankroll',desc:'Total funds available for poker'},
        {name:'Button (BTN)',desc:'Dealer position. Acts last post-flop — the most advantageous seat'},
        {name:'Blind',desc:'Forced bets. SB and BB post before cards are dealt'},
        {name:'Bluff',desc:'Betting with a weak hand to make opponents fold'},
        {name:'Blocker',desc:'A card you hold that reduces the chance your opponent has a specific hand'},
        {name:'Board',desc:'Community cards on the table (flop + turn + river)'},
        {name:'Broadway',desc:'T, J, Q, K, A cards. Or a straight made from them'},
        {name:'Set',desc:'Three of a kind using a pocket pair + one board card'},
        {name:'Set Mining',desc:'Calling with a pocket pair hoping to hit a set'},
        {name:'Semi-bluff',desc:'Betting with a draw — win if they fold or if you hit'},
        {name:'Suited',desc:'Two cards of the same suit'},
        {name:'Suited Connector',desc:'Consecutive cards of the same suit (e.g., 8♥9♥)'},
        {name:'Straddle',desc:'A voluntary blind raise from UTG position'},
        {name:'Stack',desc:'Total chips a player has'},
        {name:'Steal',desc:'A late position raise to take the blinds'},
        {name:'Slowplay',desc:'Playing a strong hand weakly to trap opponents'},
        {name:'C-bet (Continuation Bet)',desc:'When the preflop raiser bets again on the flop'},
        {name:'Check-raise',desc:'Checking first, then raising when an opponent bets'},
        {name:'Connector',desc:'Two cards in consecutive rank (e.g., 78, JT)'},
        {name:'Cold Call',desc:'Calling a raise and re-raise without having previously bet'},
        {name:'Kicker',desc:'The side card that determines the winner when pairs are equal'},
        {name:'Tight',desc:'Playing style that plays few hands'},
        {name:'Turn',desc:'The fourth community card'},
        {name:'Tell',desc:'A behavior or habit that reveals information about a player\'s hand'},
        {name:'Tilt',desc:'Playing emotionally and making irrational decisions'},
        {name:'Three of a Kind',desc:'Three cards of the same rank'},
        {name:'Draw',desc:'An incomplete hand that needs one or two cards to complete'},
        {name:'Dominate',desc:'When hands share a card but one has a better kicker (e.g., AK vs AJ)'},
        {name:'Nuts',desc:'The best possible hand on the current board'},
        {name:'Nit',desc:'An extremely tight player'},
        {name:'GTO',desc:'Game Theory Optimal. A strategy that cannot be exploited'},
        {name:'ICM',desc:'Independent Chip Model. Calculates real value of tournament chips'},
        {name:'Pot',desc:'Total money bet in the current hand'},
        {name:'Pot Odds',desc:'Ratio of call cost to pot size. Determines mathematical value of calling'},
        {name:'Position',desc:'Your place in the betting order. Later position = more advantage'},
        {name:'Premium Hand',desc:'Top-tier hands like AA, KK, QQ, AK'},
        {name:'Preflop',desc:'First betting round after receiving 2 hole cards'},
        {name:'Flop',desc:'Second round where 3 community cards are dealt simultaneously'},
        {name:'Flush Draw',desc:'Having 4 cards of the same suit, needing 1 more for a flush'},
        {name:'Fold Equity',desc:'Added value from the chance your bet makes opponents fold'},
        {name:'Fit or Fold',desc:'Strategy of continuing only if the flop helps your hand'},
        {name:'Hand Range',desc:'The set of hands a player might have in a given situation'},
        {name:'Hole Cards',desc:'Your 2 private cards that only you can see'},
        {name:'EV (Expected Value)',desc:'Long-term average profit/loss of a specific play'},
        {name:'3-bet',desc:'A re-raise against an initial raise'},
        {name:'4-bet',desc:'A re-raise against a 3-bet'},
        {name:'Limp',desc:'Calling the big blind preflop without raising'},
        {name:'River',desc:'The fifth and final community card'},
        {name:'Reverse Implied Odds',desc:'Extra money you might lose even when your draw completes if opponent has better'},
        {name:'Loose',desc:'Playing style that plays many hands'},
        {name:'LAG',desc:'Loose-Aggressive. Plays a wide range aggressively'},
        {name:'Implied Odds',desc:'Current pot odds + potential future winnings'},
        {name:'Equity',desc:'Your expected share of the pot based on current hand strength'},
        {name:'Overbet',desc:'Betting more than the pot size'},
        {name:'Underbet',desc:'Betting a very small amount relative to the pot'},
        {name:'Barrel',desc:'Consecutive bets. Double barrel = flop+turn, Triple barrel = flop+turn+river'},
        {name:'Pot Control',desc:'Managing pot size with medium-strength hands'},
        {name:'Multiway',desc:'A pot with 3+ players involved'},
        {name:'Heads-up',desc:'Only two players remaining'},
        {name:'Regular',desc:'A skilled player who regularly plays at a stake'},
        {name:'Fish',desc:'A weak or inexperienced player (derogatory)'},
        {name:'Variance',desc:'Short-term luck factor. Results swinging independent of skill'},
        {name:'Gutshot',desc:'Straight draw needing one specific middle card (4 outs)'},
        {name:'Open-ended',desc:'Straight draw that can complete on either end (8 outs)'},
        {name:'Trips',desc:'Three of a kind using one hole card + a board pair (differs from a set)'},
        {name:'Donk Bet',desc:'A bet made by a non-aggressor into the preflop raiser'},
        {name:'Showdown',desc:'Revealing hands after the final betting round to determine the winner'},
        {name:'Drawing Dead',desc:'Having no possible card that can improve your hand to a winner'},
        {name:'Hero Call',desc:'Calling with a weak hand to catch a suspected bluff'},
        {name:'Original Raiser',desc:'The player who made the first raise preflop'},
        {name:'Muck',desc:'Folding without showing your cards'},
        {name:'Freeze Out',desc:'A tournament format with no re-entry allowed'},
        {name:'TPTK',desc:'Top Pair Top Kicker. Pairing the highest board card with the best kicker'},
        {name:'VPIP',desc:'Voluntarily Put Money In Pot. Percentage of hands a player enters voluntarily'},
        {name:'Passive Player',desc:'A player who mostly calls rather than betting or raising'},
        {name:'Aggressive Player',desc:'A player who frequently bets and raises'},
        {name:'Bubble',desc:'The stage just before reaching the money in a tournament'},
        {name:'Add-on',desc:'Buying additional chips at a specific point in a tournament'},
        {name:'Odds',desc:'The ratio of the cost to call versus the potential reward'},
        {name:'Coin Flip',desc:'A situation where two players have roughly 50/50 equity (e.g., AK vs QQ)'},
        {name:'Pot Committed',desc:'Having invested so much in the pot that folding is no longer viable'},
        {name:'Squeeze',desc:'A large 3-bet after an open-raise and one or more callers'},
        {name:'Isolation',desc:'Raising to play heads-up against a limper'},
    ];

    function t(key) { return I18N[LANG][key] || I18N.ko[key] || key; }

    function toggleLang() {
        LANG = LANG === 'ko' ? 'en' : 'ko';
        localStorage.setItem('holdem-lang', LANG);
        applyLang();
    }

    function applyLang() {
        document.documentElement.lang = LANG;
        document.querySelector('.lang-toggle').textContent = t('langBtn');
        document.getElementById('appTitle').textContent = t('title');
        document.getElementById('appSub').textContent = t('subtitle');

        const navItems = document.querySelectorAll('.nav-item');
        const navKeys = ['navPre','navQuiz','navOuts','navPlay','navGloss'];
        navItems.forEach((n,i) => { if(navKeys[i]) n.lastChild.textContent = t(navKeys[i]); });

        const preTabs = document.querySelectorAll('#pagePre .subtab');
        ['tabCli','tabGui'].forEach((k,i) => { if(preTabs[i]) preTabs[i].textContent = t(k); });

        const outsTabs = document.querySelectorAll('#pageOuts .subtab');
        ['tabPractice','tabCalc'].forEach((k,i) => { if(outsTabs[i]) outsTabs[i].textContent = t(k); });

        document.getElementById('cliInput').placeholder = t('cliPlaceholder');
        document.getElementById('cliResult').innerHTML = '<div style="color:#484f58">' + t('cliWaiting') + '</div>';
        const cliHelpBox = document.querySelector('#pre-cli .help-box');
        if(cliHelpBox) cliHelpBox.innerHTML = t('cliHelp');

        const guiLabels = document.querySelectorAll('#pre-gui .section-title');
        ['position','situation','myCards'].forEach((k,i) => { if(guiLabels[i]) guiLabels[i].textContent = t(k); });
        document.querySelector('#pre-gui .reset-btn').textContent = t('reset');
        document.getElementById('guiFacing').innerHTML = [t('open'),t('vsRaise')].map((f,i)=>`<div class="btn${i===(gui?gui.fac:0)?' active':''}" onclick="guiSetFac(${i})">${f}</div>`).join('');

        document.querySelectorAll('#pqBtns .q-btn')[0].textContent = t('raise');
        document.querySelectorAll('#pqBtns .q-btn')[1].textContent = t('call');
        document.querySelectorAll('#pqBtns .q-btn')[2].textContent = t('fold');

        if(!pq.on) {
            pqInitSettings();
            const pqSections = document.querySelectorAll('#pqSettings .section-title');
            if(pqSections[0]) pqSections[0].textContent = t('position');
            if(pqSections[1]) pqSections[1].textContent = t('situation');
            if(pqSections[2]) pqSections[2].textContent = t('difficulty');
            document.querySelector('#pqSettings .big-btn').textContent = t('startQuiz');
        }


        document.getElementById('outStartBtn').textContent = t('outsStart');
        document.querySelector('#outInput .big-btn').textContent = t('confirm');

        const calcLabels = document.querySelectorAll('#outs-calc .calc-label');
        calcLabels[0].textContent = t('pot'); calcLabels[1].textContent = t('bet'); calcLabels[2].textContent = t('outs');
        document.querySelector('#outs-calc .big-btn').textContent = t('calc');
        document.querySelector('#outs-calc .section-title').textContent = t('potCalc');

        if(!pq.on) document.getElementById('pqCard').innerHTML = '<div style="color:#484f58">' + t('afterSettings') + '</div>';
        if(!outs.on) document.getElementById('outCard').innerHTML = '<div style="color:#484f58">' + t('outsQ') + '</div>';

        document.querySelectorAll('.score-label').forEach(el => {
            const val = el.querySelector('.score-value');
            if(val) {
                if(val.id && val.id.includes('Score')) el.childNodes[0].textContent = t('score') + ' ';
                else if(val.id && val.id.includes('Acc')) el.childNodes[0].textContent = t('accuracy') + ' ';
            }
        });

        const sourceNotes = document.querySelectorAll('.source-note');
        if(sourceNotes[0]) sourceNotes[0].textContent = t('srcPreflop');
        if(sourceNotes[1]) sourceNotes[1].textContent = t('srcOuts');

        const pqHintEl = document.getElementById('pqHint');
        if(pqHintEl) pqHintEl.textContent = LANG === 'ko' ? '[R] [C] [F] · 다음 [N]' : '[R] [C] [F] · Next [N]';

        const calcHelpBox = document.querySelector('#outs-calc .help-box');
        if(calcHelpBox) calcHelpBox.innerHTML = `<strong>${t('rule24')}</strong><br>${t('rule24t')}<br>${t('rule24r')}<br><br><strong>${t('commonOuts')}</strong><br>${t('flushDraw')} · ${t('openEnd')} · ${t('gutshot')}<br>${t('twoPairFH')} · ${t('onePairTrips')}`;

        document.getElementById('glossSearch').placeholder = t('glossSearch');
        renderGloss(LANG === 'en' ? GLOSSARY_EN : GLOSSARY);

        // Play page
        const pst = document.getElementById('playSetupTitle');
        if(pst) pst.textContent = t('setupTitle');
        const ppl = document.getElementById('playPlayerLabel');
        if(ppl) ppl.textContent = t('playerCount');
        const pprl = document.getElementById('playProfileLabel');
        if(pprl) pprl.textContent = t('aiProfile');
        const psb = document.getElementById('playStartBtn');
        if(psb) psb.textContent = t('startSession');
        if(typeof simInitSetup==='function') simInitSetup();
    }
