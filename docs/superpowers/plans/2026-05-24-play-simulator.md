# Play Simulator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a full-hand poker simulator (preflop→river) with AI opponents, GTO feedback, chip tracking, and session statistics to HoldemSsam.

**Architecture:** New "Play" page in the existing single-file app (index.html). Game engine logic (deck, hand evaluation, AI decisions, GTO feedback) lives in clearly separated script sections. State flows through a single `sim` object. Uses existing i18n `t()` function for bilingual support.

**Tech Stack:** Vanilla JS, CSS, HTML — all in index.html. localStorage for stats persistence. No build tools or external libraries.

---

## File Structure

All changes happen in **`index.html`** (single-file architecture). The work is organized into logical script sections:

| Section | Responsibility |
|---------|---------------|
| CSS (new rules) | Table view, card display, action buttons, stats panel |
| HTML (new page) | `#pagePlay` markup — setup screen, table, review, stats |
| i18n (new keys) | All play-related text in ko/en |
| Deck & Evaluator | Shuffle, deal, 7-card hand evaluation |
| AI Engine | Profile-based preflop/postflop decisions |
| Game Loop | Hand flow: blinds → deal → streets → showdown |
| GTO Feedback | Per-street recommendation + verdict |
| Stats & Chips | Session tracking, chip graph, localStorage |
| Nav update | 5th tab in bottom-nav, applyLang additions |

---

## Task 1: i18n Keys + Navigation Shell

Add the "Play" tab to navigation and all i18n keys needed for the simulator.

**Files:**
- Modify: `index.html` — i18n section (~line 386), bottom-nav (~line 375), applyLang function, switchPage

- [ ] **Step 1: Add i18n keys for Play simulator**

In the `ko` object inside I18N (after the `oppRaised` line), add:

```javascript
            // Play simulator
            navPlay: '플레이', playTitle: '플레이',
            playerCount: '인원수', startStack: '시작 스택',
            startSession: '세션 시작', endSession: '세션 종료',
            rebuy: '리바이', nextHand: '다음 핸드',
            review: '리뷰', stats: '통계',
            fold: '폴드', check: '체크', call: '콜',
            bet: '벳', raise: '레이즈', allIn: '올인',
            potLabel: '팟', stackLabel: '스택', blinds: '블라인드',
            handsPlayed: '핸드 수', winRate: '승률(BB/핸드)',
            vpipLabel: 'VPIP', pfrLabel: 'PFR', afLabel: 'AF',
            showdownPct: '쇼다운 %', chipGraph: '칩 그래프',
            correct: '정답!', suboptimal: '아쉬움', mistake: '실수',
            preflopStreet: '프리플랍', flopStreet: '플랍',
            turnStreet: '턴', riverStreet: '리버',
            yourAction: '내 액션', recommended: '추천', bust: '파산',
            sessionSummary: '세션 요약', profit: '수익',
            setupTitle: '테이블 설정',
            tight: '타이트', regular: '레귤러', loose: '루즈', aggressive: '어그레시브',
            aiProfile: 'AI 성향',
```

In the `en` object (after the `oppRaised` line), add:

```javascript
            // Play simulator
            navPlay: 'Play', playTitle: 'Play',
            playerCount: 'Players', startStack: 'Starting Stack',
            startSession: 'Start Session', endSession: 'End Session',
            rebuy: 'Rebuy', nextHand: 'Next Hand',
            review: 'Review', stats: 'Stats',
            fold: 'Fold', check: 'Check', call: 'Call',
            bet: 'Bet', raise: 'Raise', allIn: 'All-in',
            potLabel: 'Pot', stackLabel: 'Stack', blinds: 'Blinds',
            handsPlayed: 'Hands Played', winRate: 'Win Rate (BB/hand)',
            vpipLabel: 'VPIP', pfrLabel: 'PFR', afLabel: 'AF',
            showdownPct: 'Showdown %', chipGraph: 'Chip Graph',
            correct: 'Correct!', suboptimal: 'Suboptimal', mistake: 'Mistake',
            preflopStreet: 'Preflop', flopStreet: 'Flop',
            turnStreet: 'Turn', riverStreet: 'River',
            yourAction: 'Your Action', recommended: 'Recommended', bust: 'Busted',
            sessionSummary: 'Session Summary', profit: 'Profit',
            setupTitle: 'Table Setup',
            tight: 'Tight', regular: 'Regular', loose: 'Loose', aggressive: 'Aggressive',
            aiProfile: 'AI Profile',
```

- [ ] **Step 2: Add Play page HTML shell and nav tab**

After the `pageGloss` div (around line 371), add:

```html
        <!-- ===== Play Page ===== -->
        <div class="page" id="pagePlay">
            <div id="playSetup" class="card-box">
                <div class="section-title" id="playSetupTitle">테이블 설정</div>
                <div class="section-title" style="margin-top:10px; font-size:0.75rem;" id="playPlayerLabel">인원수</div>
                <div class="btn-group" id="playPlayerCount"></div>
                <div class="section-title" style="margin-top:10px; font-size:0.75rem;" id="playProfileLabel">AI 성향</div>
                <div class="btn-group" id="playProfileSet"></div>
                <button class="big-btn" id="playStartBtn" onclick="simStart()">세션 시작</button>
            </div>
            <div id="playTable" style="display:none;"></div>
            <div id="playReview" style="display:none;"></div>
            <div id="playStats" style="display:none;"></div>
        </div>
```

Update the bottom-nav to include a 5th tab (before the glossary tab):

```html
        <div class="nav-item" onclick="switchPage('pagePlay')"><span class="nav-icon">🃏</span>플레이</div>
```

- [ ] **Step 3: Update applyLang to handle Play page**

In the `applyLang()` function, add after the glossary section:

```javascript
        // Play page
        const playSetupTitle = document.getElementById('playSetupTitle');
        if(playSetupTitle) playSetupTitle.textContent = t('setupTitle');
        const playPlayerLabel = document.getElementById('playPlayerLabel');
        if(playPlayerLabel) playPlayerLabel.textContent = t('playerCount');
        const playProfileLabel = document.getElementById('playProfileLabel');
        if(playProfileLabel) playProfileLabel.textContent = t('aiProfile');
        const playStartBtn = document.getElementById('playStartBtn');
        if(playStartBtn) playStartBtn.textContent = t('startSession');

        const navItems2 = document.querySelectorAll('.nav-item');
        const navKeys2 = ['navPre','navRank','navOuts','navPlay','navGloss'];
        navItems2.forEach((n,i) => { if(navKeys2[i]) n.lastChild.textContent = t(navKeys2[i]); });
```

Also update the existing navItems block to use the 5-item array (replace the old 4-item nav update).

- [ ] **Step 4: Add setup screen initialization**

At the bottom of the script (before `// ============ INIT ============`), add:

```javascript
    // ============ PLAY SIMULATOR ============
    function simInitSetup() {
        document.getElementById('playPlayerCount').innerHTML = [2,3,4,5,6].map((n,i)=>`<div class="btn${i===0?' active':''}" onclick="simSetPlayers(this,${n})">${n}</div>`).join('');
        document.getElementById('playProfileSet').innerHTML = ['tight','regular','loose','aggressive'].map((p,i)=>`<div class="btn${i===1?' active':''}" onclick="simSetProfile(this,'${p}')">${t(p)}</div>`).join('');
    }
    let simConfig = { players: 2, profile: 'regular' };
    function simSetPlayers(el,n) { simConfig.players=n; const bs=el.parentElement.children; for(let b of bs)b.classList.remove('active'); el.classList.add('active'); }
    function simSetProfile(el,p) { simConfig.profile=p; const bs=el.parentElement.children; for(let b of bs)b.classList.remove('active'); el.classList.add('active'); }
```

Add `simInitSetup();` to the INIT section.

- [ ] **Step 5: Verify navigation works**

Open `http://localhost:8080` in a browser. Confirm:
- 5 tabs show in bottom nav
- Clicking "Play" shows setup screen with player count + profile buttons
- Language toggle updates Play page labels

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "feat: Play 탭 추가 — 네비게이션, i18n 키, 설정 화면 셸"
```

---

## Task 2: Deck, Shuffle, and Hand Evaluator

Core poker logic: create a deck, shuffle it (Fisher-Yates), and evaluate the best 5-card hand from 7 cards.

**Files:**
- Modify: `index.html` — new script section before the PLAY SIMULATOR section

- [ ] **Step 1: Implement deck creation and Fisher-Yates shuffle**

Add this section after the SHARED DATA section (after line ~662):

```javascript
    // ============ DECK & EVALUATOR ============
    function createDeck() {
        const deck = [];
        for(let s = 0; s < 4; s++)
            for(let r = 0; r < 13; r++)
                deck.push({ rank: r, suit: s }); // rank: 0=A,1=K,...12=2  suit: 0=♠,1=♥,2=♦,3=♣
        return deck;
    }

    function shuffleDeck(deck) {
        for(let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        return deck;
    }
```

- [ ] **Step 2: Implement hand evaluator**

The evaluator scores a 5-card hand with a numeric rank (higher = better). Then we pick the best 5 from 7.

```javascript
    function rankValue(r) { return r === 0 ? 14 : 13 - r; } // A=14, K=13, ..., 2=2

    function evaluate5(cards) {
        const ranks = cards.map(c => rankValue(c.rank)).sort((a,b) => b - a);
        const suits = cards.map(c => c.suit);
        const isFlush = suits.every(s => s === suits[0]);
        const isStr = (ranks[0]-ranks[4]===4 && new Set(ranks).size===5) || (ranks[0]===14&&ranks[1]===5&&ranks[2]===4&&ranks[3]===3&&ranks[4]===2);
        const isLowStr = ranks[0]===14&&ranks[1]===5;

        const counts = {};
        ranks.forEach(r => { counts[r] = (counts[r]||0)+1; });
        const groups = Object.entries(counts).sort((a,b)=>b[1]-a[1]||(+b[0])-(+a[0]));
        const pattern = groups.map(g=>g[1]).join('');

        let score = 0;
        const kickers = groups.map(g => +g[0]);

        if(isFlush && isStr) score = isLowStr ? 8*10000000+5 : 8*10000000+ranks[0];
        else if(pattern==='41') score = 7*10000000+kickers[0]*100+kickers[1];
        else if(pattern==='32') score = 6*10000000+kickers[0]*100+kickers[1];
        else if(isFlush) score = 5*10000000+ranks[0]*10000+ranks[1]*1000+ranks[2]*100+ranks[3]*10+ranks[4];
        else if(isStr) score = 4*10000000+(isLowStr?5:ranks[0]);
        else if(pattern==='311') score = 3*10000000+kickers[0]*10000+kickers[1]*100+kickers[2];
        else if(pattern==='221') score = 2*10000000+kickers[0]*10000+kickers[1]*100+kickers[2];
        else if(pattern==='2111') score = 1*10000000+kickers[0]*10000+kickers[1]*1000+kickers[2]*100+kickers[3];
        else score = ranks[0]*10000+ranks[1]*1000+ranks[2]*100+ranks[3]*10+ranks[4];

        return score;
    }

    function bestHand(cards7) {
        let best = 0;
        for(let i = 0; i < 7; i++)
            for(let j = i+1; j < 7; j++) {
                const hand5 = cards7.filter((_,idx) => idx!==i && idx!==j);
                const s = evaluate5(hand5);
                if(s > best) best = s;
            }
        return best;
    }

    function handCategory(score) {
        const tier = Math.floor(score / 10000000);
        return ['high-card','one-pair','two-pair','three-kind','straight','flush','full-house','four-kind','straight-flush'][tier];
    }
```

- [ ] **Step 3: Test evaluator in browser console**

Open the app, open DevTools console, and run:

```javascript
// Test: AA vs KK on empty board (preflop all-in)
const d = shuffleDeck(createDeck());
const aa = [{rank:0,suit:0},{rank:0,suit:1}]; // A♠ A♥
const kk = [{rank:1,suit:2},{rank:1,suit:3}]; // K♦ K♣
const board = d.slice(0,5);
console.log('AA score:', bestHand([...aa,...board]));
console.log('KK score:', bestHand([...kk,...board]));
// AA score should be >= KK score most of the time
```

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: 덱 생성, Fisher-Yates 셔플, 7카드 핸드 평가기 추가"
```

---

## Task 3: AI Decision Engine

Implement AI opponent logic for preflop (range-based) and postflop (hand-strength-based) decisions.

**Files:**
- Modify: `index.html` — new AI section after the evaluator

- [ ] **Step 1: Define AI preflop ranges per profile**

```javascript
    // ============ AI ENGINE ============
    const AI_PROFILES = {
        tight:      { vpip: 0.18, pfr: 0.14, bluffFreq: 0.1, callDown: 0.3 },
        regular:    { vpip: 0.24, pfr: 0.20, bluffFreq: 0.2, callDown: 0.5 },
        loose:      { vpip: 0.35, pfr: 0.22, bluffFreq: 0.25, callDown: 0.7 },
        aggressive: { vpip: 0.28, pfr: 0.24, bluffFreq: 0.35, callDown: 0.6 }
    };

    function aiPreflopAction(player, sim) {
        const profile = AI_PROFILES[player.profile];
        const hand = cardNotation(player.cards);
        const pos = sim.positions[player.seat];
        const facingRaise = sim.currentBet > 1;

        if(facingRaise) {
            const ranges = VS_RAISE[pos];
            if(ranges && ranges.raise.includes(hand)) return { action:'raise', amount: sim.currentBet * 3 };
            if(ranges && ranges.call.includes(hand)) return { action:'call', amount: sim.currentBet };
            if(Math.random() < profile.bluffFreq * 0.3) return { action:'call', amount: sim.currentBet };
            return { action:'fold' };
        } else {
            const ranges = OPEN_RANGES[pos];
            if(ranges && ranges.raise.includes(hand)) return { action:'raise', amount: 2.5 };
            if(ranges && ranges.call.includes(hand)) {
                return Math.random() < profile.pfr/profile.vpip ? { action:'raise', amount: 2.5 } : { action:'call', amount: 1 };
            }
            if(Math.random() < (profile.vpip - 0.15) * 0.5) return { action:'call', amount: sim.currentBet || 1 };
            return { action:'fold' };
        }
    }
```

- [ ] **Step 2: Implement hand notation helper for AI range lookup**

```javascript
    function cardNotation(cards) {
        const r1 = RANKS[cards[0].rank], r2 = RANKS[cards[1].rank];
        if(cards[0].rank === cards[1].rank) return r1 + r2;
        const suited = cards[0].suit === cards[1].suit;
        const hi = cards[0].rank < cards[1].rank ? r1 : r2;
        const lo = cards[0].rank < cards[1].rank ? r2 : r1;
        return hi + lo + (suited ? 's' : 'o');
    }
```

- [ ] **Step 3: Implement postflop AI hand strength evaluation**

```javascript
    function aiHandStrength(player, board) {
        const all = [...player.cards, ...board];
        const score = bestHand(all);
        const cat = handCategory(score);

        const pairRanks = board.map(c=>rankValue(c.rank));
        const topBoard = Math.max(...pairRanks);
        const myRanks = player.cards.map(c=>rankValue(c.rank));
        const hasOverpair = player.cards[0].rank===player.cards[1].rank && rankValue(player.cards[0].rank) > topBoard;

        if(['straight-flush','four-kind','full-house'].includes(cat)) return 'monster';
        if(cat==='flush' || cat==='straight') return 'monster';
        if(cat==='three-kind' && player.cards[0].rank===player.cards[1].rank) return 'monster'; // set
        if(cat==='two-pair') return 'strong';
        if(cat==='three-kind') return 'strong'; // trips
        if(hasOverpair) return 'strong';
        if(cat==='one-pair' && myRanks.includes(topBoard)) return 'strong'; // top pair

        // Draw detection
        const suitCounts = [0,0,0,0];
        all.forEach(c => suitCounts[c.suit]++);
        const flushDraw = suitCounts.some(c => c === 4);
        const sortedRanks = all.map(c=>rankValue(c.rank)).sort((a,b)=>a-b);
        const unique = [...new Set(sortedRanks)];
        let straightOuts = 0;
        for(let i=0;i<=unique.length-4;i++) {
            if(unique[i+3]-unique[i]<=4) straightOuts = Math.max(straightOuts, 4);
            if(i+4<unique.length && unique[i+4]-unique[i]===4) straightOuts = 8;
        }
        if(flushDraw || straightOuts >= 8) return 'draw';

        if(cat==='one-pair') return 'medium';
        return 'weak';
    }
```

- [ ] **Step 4: Implement postflop AI action selector**

```javascript
    function aiPostflopAction(player, sim) {
        const profile = AI_PROFILES[player.profile];
        const strength = aiHandStrength(player, sim.board);
        const inPosition = sim.actOrder[sim.actOrder.length-1] === player.seat;
        const potOdds = sim.currentBet > 0 ? sim.currentBet / (sim.pot + sim.currentBet) : 0;

        if(strength === 'monster') {
            if(sim.currentBet > 0) return { action:'raise', amount: Math.round(sim.pot * 2) };
            return { action:'bet', amount: Math.round(sim.pot * 0.75) };
        }
        if(strength === 'strong') {
            if(sim.currentBet > 0) {
                if(sim.currentBet > sim.pot) return { action:'call', amount: sim.currentBet };
                return Math.random() < 0.4 ? { action:'raise', amount: Math.round(sim.pot * 0.75) } : { action:'call', amount: sim.currentBet };
            }
            return { action:'bet', amount: Math.round(sim.pot * (0.5 + Math.random()*0.25)) };
        }
        if(strength === 'draw') {
            if(sim.currentBet > 0) {
                if(potOdds < 0.3) return { action:'call', amount: sim.currentBet };
                return Math.random() < profile.callDown ? { action:'call', amount: sim.currentBet } : { action:'fold' };
            }
            return Math.random() < profile.bluffFreq ? { action:'bet', amount: Math.round(sim.pot * 0.5) } : { action:'check' };
        }
        if(strength === 'medium') {
            if(sim.currentBet > 0) {
                if(sim.currentBet <= sim.pot * 0.5 && Math.random() < profile.callDown) return { action:'call', amount: sim.currentBet };
                return { action:'fold' };
            }
            return inPosition && Math.random() < 0.3 ? { action:'bet', amount: Math.round(sim.pot * 0.33) } : { action:'check' };
        }
        // weak
        if(sim.currentBet > 0) return { action:'fold' };
        return Math.random() < profile.bluffFreq * 0.5 ? { action:'bet', amount: Math.round(sim.pot * 0.5) } : { action:'check' };
    }
```

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat: AI 엔진 — 프리플랍 레인지 + 포스트플랍 핸드강도 기반 의사결정"
```

---

## Task 4: Game Loop — Session, Hand Flow, Betting Rounds

Implement the core game loop: session start, dealing, betting rounds, showdown, pot distribution.

**Files:**
- Modify: `index.html` — expand the PLAY SIMULATOR section

- [ ] **Step 1: Define session state and start function**

Replace the placeholder `simStart` and add session state:

```javascript
    let sim = null;

    function simStart() {
        const numPlayers = simConfig.players;
        const players = [];
        for(let i = 0; i < numPlayers; i++) {
            players.push({
                id: i,
                profile: i === 0 ? 'human' : simConfig.profile,
                stack: 100,
                cards: [],
                folded: false,
                allIn: false,
                bet: 0
            });
        }
        sim = {
            players: players,
            userSeat: 0,
            dealer: Math.floor(Math.random() * numPlayers),
            deck: [],
            board: [],
            pot: 0,
            currentBet: 0,
            street: 'preflop',
            actIndex: 0,
            actOrder: [],
            handHistory: [],
            stats: { hands:0, vpipCount:0, pfrCount:0, betRaiseCount:0, callCount:0, showdownCount:0, won:0 },
            chipHistory: [100],
            positions: []
        };
        document.getElementById('playSetup').style.display = 'none';
        document.getElementById('playTable').style.display = 'block';
        simNewHand();
    }
```

- [ ] **Step 2: Implement hand setup (blinds, deal, position assignment)**

```javascript
    function simNewHand() {
        sim.deck = shuffleDeck(createDeck());
        sim.board = [];
        sim.pot = 0;
        sim.currentBet = 0;
        sim.street = 'preflop';
        sim.handHistory = [];

        // Rotate dealer
        sim.dealer = (sim.dealer + 1) % sim.players.length;

        // Assign positions
        const n = sim.players.length;
        const posNames = n === 2 ? ['BTN','BB'] : n === 3 ? ['BTN','SB','BB'] : n === 4 ? ['BTN','SB','BB','UTG'] : n === 5 ? ['BTN','SB','BB','UTG','CO'] : ['BTN','SB','BB','UTG','MP','CO'];
        sim.positions = [];
        for(let i = 0; i < n; i++) {
            sim.positions[(sim.dealer + i) % n] = posNames[i];
        }

        // Reset players
        sim.players.forEach(p => { p.cards = []; p.folded = false; p.allIn = false; p.bet = 0; });

        // Deal hole cards
        let cardIdx = 0;
        sim.players.forEach(p => { p.cards = [sim.deck[cardIdx++], sim.deck[cardIdx++]]; });
        sim.deckIdx = cardIdx;

        // Post blinds
        const sbSeat = (sim.dealer + 1) % n;
        const bbSeat = (sim.dealer + 2) % n;
        if(n === 2) { // heads-up: dealer=SB, other=BB
            simPostBlind(sim.dealer, 0.5);
            simPostBlind((sim.dealer+1)%n, 1);
        } else {
            simPostBlind(sbSeat, 0.5);
            simPostBlind(bbSeat, 1);
        }
        sim.currentBet = 1;

        // Set action order (preflop: UTG first, or BTN in heads-up)
        sim.actOrder = [];
        const firstAct = n === 2 ? sim.dealer : (bbSeat + 1) % n;
        for(let i = 0; i < n; i++) {
            const seat = (firstAct + i) % n;
            if(!sim.players[seat].folded && !sim.players[seat].allIn) sim.actOrder.push(seat);
        }
        sim.actIndex = 0;

        simRenderTable();
        simNextAction();
    }

    function simPostBlind(seat, amount) {
        const p = sim.players[seat];
        const actual = Math.min(amount, p.stack);
        p.stack -= actual;
        p.bet = actual;
        sim.pot += actual;
        if(p.stack === 0) p.allIn = true;
    }
```

- [ ] **Step 3: Implement action processing and betting round logic**

```javascript
    function simNextAction() {
        if(sim.actIndex >= sim.actOrder.length) {
            simEndBettingRound();
            return;
        }
        const seat = sim.actOrder[sim.actIndex];
        if(sim.players[seat].folded || sim.players[seat].allIn) {
            sim.actIndex++;
            simNextAction();
            return;
        }
        if(seat === sim.userSeat) {
            simShowActions();
        } else {
            setTimeout(() => {
                const ai = sim.players[seat];
                let decision;
                if(sim.street === 'preflop') decision = aiPreflopAction(ai, sim);
                else decision = aiPostflopAction(ai, sim);
                simProcessAction(seat, decision);
            }, 400);
        }
    }

    function simProcessAction(seat, decision) {
        const p = sim.players[seat];
        const action = decision.action;

        if(action === 'fold') {
            p.folded = true;
        } else if(action === 'check') {
            // no money moved
        } else if(action === 'call') {
            const toCall = Math.min(sim.currentBet - p.bet, p.stack);
            p.stack -= toCall;
            p.bet += toCall;
            sim.pot += toCall;
            if(p.stack === 0) p.allIn = true;
        } else if(action === 'bet' || action === 'raise') {
            const amount = Math.min(decision.amount, p.stack);
            const totalBet = action === 'bet' ? amount : sim.currentBet + amount;
            const toAdd = Math.min(totalBet - p.bet, p.stack);
            p.stack -= toAdd;
            p.bet += toAdd;
            sim.pot += toAdd;
            sim.currentBet = p.bet;
            if(p.stack === 0) p.allIn = true;
            // Reset action order — everyone needs to act again
            sim.actOrder = [];
            for(let i = 1; i <= sim.players.length; i++) {
                const s = (seat + i) % sim.players.length;
                if(!sim.players[s].folded && !sim.players[s].allIn && s !== seat) sim.actOrder.push(s);
            }
            sim.actIndex = 0;
            simLogAction(seat, action, p.bet);
            simRenderTable();
            simNextAction();
            return;
        } else if(action === 'allin') {
            const toAdd = p.stack;
            p.bet += toAdd;
            sim.pot += toAdd;
            p.stack = 0;
            p.allIn = true;
            if(p.bet > sim.currentBet) sim.currentBet = p.bet;
        }

        simLogAction(seat, action, p.bet);
        sim.actIndex++;
        simRenderTable();
        simNextAction();
    }

    function simLogAction(seat, action, amount) {
        sim.handHistory.push({ street: sim.street, seat, action, amount });
    }
```

- [ ] **Step 4: Implement betting round end + street transitions**

```javascript
    function simEndBettingRound() {
        // Reset bets for next street
        sim.players.forEach(p => p.bet = 0);
        sim.currentBet = 0;

        // Check if hand is over (only 1 player left)
        const active = sim.players.filter(p => !p.folded);
        if(active.length === 1) {
            simAwardPot(active[0].id);
            return;
        }

        // Check if all remaining are all-in (no more actions possible)
        const canAct = active.filter(p => !p.allIn);
        if(canAct.length <= 1) {
            // Run out remaining board
            while(sim.board.length < 5) {
                sim.board.push(sim.deck[sim.deckIdx++]);
            }
            simShowdown();
            return;
        }

        // Advance street
        if(sim.street === 'preflop') {
            sim.street = 'flop';
            sim.board = [sim.deck[sim.deckIdx++], sim.deck[sim.deckIdx++], sim.deck[sim.deckIdx++]];
        } else if(sim.street === 'flop') {
            sim.street = 'turn';
            sim.board.push(sim.deck[sim.deckIdx++]);
        } else if(sim.street === 'turn') {
            sim.street = 'river';
            sim.board.push(sim.deck[sim.deckIdx++]);
        } else {
            simShowdown();
            return;
        }

        // Postflop action order: SB first (or first active after dealer)
        sim.actOrder = [];
        for(let i = 1; i <= sim.players.length; i++) {
            const s = (sim.dealer + i) % sim.players.length;
            if(!sim.players[s].folded && !sim.players[s].allIn) sim.actOrder.push(s);
        }
        sim.actIndex = 0;

        simRenderTable();
        simNextAction();
    }
```

- [ ] **Step 5: Implement showdown and pot award**

```javascript
    function simShowdown() {
        sim.street = 'showdown';
        const active = sim.players.filter(p => !p.folded);
        let bestScore = -1, winnerId = -1;
        active.forEach(p => {
            const s = bestHand([...p.cards, ...sim.board]);
            if(s > bestScore) { bestScore = s; winnerId = p.id; }
        });
        sim.stats.showdownCount++;
        simAwardPot(winnerId);
    }

    function simAwardPot(winnerId) {
        sim.players[winnerId].stack += sim.pot;
        sim.pot = 0;
        sim.street = 'showdown';

        // Track stats
        sim.stats.hands++;
        if(winnerId === sim.userSeat) sim.stats.won++;
        sim.chipHistory.push(sim.players[sim.userSeat].stack);

        // Track user VPIP/PFR
        const userPreActions = sim.handHistory.filter(h => h.seat === sim.userSeat && h.street === 'preflop');
        const userVoluntary = userPreActions.some(a => a.action !== 'fold' && a.action !== 'check');
        const userRaised = userPreActions.some(a => a.action === 'raise' || a.action === 'bet');
        if(userVoluntary) sim.stats.vpipCount++;
        if(userRaised) sim.stats.pfrCount++;

        // Track AF
        const userActions = sim.handHistory.filter(h => h.seat === sim.userSeat);
        userActions.forEach(a => {
            if(a.action==='bet'||a.action==='raise') sim.stats.betRaiseCount++;
            if(a.action==='call') sim.stats.callCount++;
        });

        simRenderReview(winnerId);
    }
```

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "feat: 게임 루프 — 세션 시작, 딜링, 베팅 라운드, 쇼다운, 팟 분배"
```

---

## Task 5: Table UI — Rendering and User Actions

Build the visual table: cards, opponents, pot, and action buttons.

**Files:**
- Modify: `index.html` — CSS for table + render functions

- [ ] **Step 1: Add CSS for the play table**

In the `<style>` section, add:

```css
        /* Play Simulator */
        .sim-table { text-align: center; }
        .sim-board { display: flex; justify-content: center; gap: 6px; margin: 12px 0; min-height: 60px; }
        .sim-card { width: 40px; height: 56px; border-radius: 6px; background: #21262d; border: 1px solid #30363d; display: flex; align-items: center; justify-content: center; font-size: 0.9rem; font-weight: 700; }
        .sim-card.red { color: #f85149; }
        .sim-card.black { color: #e6edf3; }
        .sim-card.hidden { background: #2d333b; color: #2d333b; border-color: #444c56; }
        .sim-pot { color: #d29922; font-weight: 700; font-size: 1rem; margin: 8px 0; }
        .sim-seats { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; margin: 12px 0; }
        .sim-seat { background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 8px; min-width: 80px; font-size: 0.7rem; text-align: center; }
        .sim-seat.active { border-color: #7ee787; }
        .sim-seat.folded { opacity: 0.4; }
        .sim-seat .seat-pos { color: #8b949e; font-size: 0.6rem; }
        .sim-seat .seat-stack { color: #e6edf3; font-weight: 600; }
        .sim-seat .seat-action { color: #d29922; font-size: 0.65rem; margin-top: 2px; }
        .sim-my-cards { display: flex; justify-content: center; gap: 8px; margin: 12px 0; }
        .sim-my-cards .sim-card { width: 50px; height: 70px; font-size: 1.1rem; border-color: #7ee787; }
        .sim-actions { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; margin: 12px 0; }
        .sim-actions .act-btn { padding: 10px 16px; border-radius: 8px; border: 1px solid #30363d; background: #21262d; color: #e6edf3; font-weight: 600; font-size: 0.8rem; cursor: pointer; }
        .sim-actions .act-btn:hover { border-color: #7ee787; }
        .sim-actions .act-btn.fold { border-color: #f85149; color: #f85149; }
        .sim-actions .act-btn.call { border-color: #d29922; color: #d29922; }
        .sim-actions .act-btn.raise { border-color: #3fb950; color: #3fb950; }
        .sim-sizes { display: flex; gap: 4px; justify-content: center; margin-top: 6px; }
        .sim-sizes .size-btn { padding: 6px 10px; border-radius: 6px; border: 1px solid #30363d; background: #161b22; color: #8b949e; font-size: 0.7rem; cursor: pointer; }
        .sim-sizes .size-btn:hover { border-color: #58a6ff; color: #58a6ff; }
```

- [ ] **Step 2: Implement table rendering**

```javascript
    function simRenderTable() {
        const el = document.getElementById('playTable');
        const user = sim.players[sim.userSeat];

        // Board cards
        let boardHtml = '';
        for(let i = 0; i < 5; i++) {
            if(i < sim.board.length) {
                const c = sim.board[i];
                const color = SUITS[c.suit].c;
                boardHtml += `<div class="sim-card ${color}">${RANKS[c.rank]}${SUITS[c.suit].s}</div>`;
            } else {
                boardHtml += `<div class="sim-card hidden">?</div>`;
            }
        }

        // Opponent seats
        let seatsHtml = '';
        sim.players.forEach((p, i) => {
            if(i === sim.userSeat) return;
            const pos = sim.positions[i] || '';
            const lastAct = sim.handHistory.filter(h=>h.seat===i).pop();
            const actText = lastAct ? lastAct.action.toUpperCase() : '';
            seatsHtml += `<div class="sim-seat${p.folded?' folded':''}${sim.actOrder[sim.actIndex]===i?' active':''}">
                <div class="seat-pos">${pos} ${p.profile!=='human'?'('+p.profile[0].toUpperCase()+')':''}</div>
                <div class="seat-stack">${p.stack.toFixed(1)} BB</div>
                <div class="seat-action">${p.folded?'FOLD':actText}</div>
            </div>`;
        });

        // My cards
        let myCardsHtml = '';
        user.cards.forEach(c => {
            const color = SUITS[c.suit].c;
            myCardsHtml += `<div class="sim-card ${color}">${RANKS[c.rank]}${SUITS[c.suit].s}</div>`;
        });

        el.innerHTML = `
            <div class="sim-table">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                    <span style="color:#8b949e;font-size:0.7rem;">${t('blinds')}: 0.5/1 BB</span>
                    <span style="color:#8b949e;font-size:0.7rem;">${sim.positions[sim.userSeat]} · ${t('stackLabel')}: ${user.stack.toFixed(1)} BB</span>
                    <button class="size-btn" onclick="simEndSession()" style="color:#f85149;border-color:#f85149;">${t('endSession')}</button>
                </div>
                <div class="sim-seats">${seatsHtml}</div>
                <div class="sim-board">${boardHtml}</div>
                <div class="sim-pot">${t('potLabel')}: ${sim.pot.toFixed(1)} BB</div>
                <div class="sim-my-cards">${myCardsHtml}</div>
                <div class="sim-actions" id="simActions"></div>
                <div class="sim-sizes" id="simSizes"></div>
            </div>`;
    }
```

- [ ] **Step 3: Implement action button display and user input**

```javascript
    function simShowActions() {
        const user = sim.players[sim.userSeat];
        const toCall = sim.currentBet - user.bet;
        let html = '';
        html += `<button class="act-btn fold" onclick="simUserAct('fold')">Fold</button>`;
        if(toCall <= 0) {
            html += `<button class="act-btn call" onclick="simUserAct('check')">${t('check')}</button>`;
            html += `<button class="act-btn raise" onclick="simShowBetSizes('bet')">${t('bet')}</button>`;
        } else {
            html += `<button class="act-btn call" onclick="simUserAct('call')">${t('call')} ${toCall.toFixed(1)}</button>`;
            html += `<button class="act-btn raise" onclick="simShowBetSizes('raise')">${t('raise')}</button>`;
        }
        html += `<button class="act-btn" onclick="simUserAct('allin')">${t('allIn')}</button>`;
        document.getElementById('simActions').innerHTML = html;
    }

    function simShowBetSizes(type) {
        const sizes = type === 'bet'
            ? [['1/3', sim.pot*0.33], ['1/2', sim.pot*0.5], ['2/3', sim.pot*0.66], ['Pot', sim.pot]]
            : [['2x', sim.currentBet*2], ['3x', sim.currentBet*3], ['Pot', sim.pot+sim.currentBet]];
        const user = sim.players[sim.userSeat];
        let html = sizes.map(([label, amt]) => {
            const capped = Math.min(Math.round(amt*10)/10, user.stack);
            return `<button class="size-btn" onclick="simUserAct('${type}',${capped})">${label} (${capped.toFixed(1)})</button>`;
        }).join('');
        html += `<button class="size-btn" onclick="simUserAct('allin')">${t('allIn')}</button>`;
        document.getElementById('simSizes').innerHTML = html;
    }

    function simUserAct(action, amount) {
        if(action === 'allin') {
            const user = sim.players[sim.userSeat];
            amount = user.stack + user.bet;
            action = sim.currentBet > 0 ? 'raise' : 'bet';
        }
        simProcessAction(sim.userSeat, { action, amount: amount || sim.currentBet });
    }
```

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: 테이블 UI — 보드, 상대 좌석, 내 카드, 액션 버튼 렌더링"
```

---

## Task 6: Hand Review + GTO Feedback

After each hand, show a per-street review comparing user's actions to GTO recommendations.

**Files:**
- Modify: `index.html` — review panel rendering + GTO recommendation logic

- [ ] **Step 1: Implement GTO recommendation engine**

```javascript
    // ============ GTO FEEDBACK ============
    function gtoRecommendPreflop(hand, pos, facingRaise) {
        if(facingRaise) {
            const ranges = VS_RAISE[pos];
            if(ranges && ranges.raise.includes(hand)) return 'raise';
            if(ranges && ranges.call.includes(hand)) return 'call';
            return 'fold';
        }
        const ranges = OPEN_RANGES[pos];
        if(ranges && ranges.raise.includes(hand)) return 'raise';
        if(ranges && ranges.call.includes(hand)) return 'call';
        return 'fold';
    }

    function gtoRecommendPostflop(playerCards, board, currentBet, pot, inPosition) {
        const all = [...playerCards, ...board];
        const score = bestHand(all);
        const cat = handCategory(score);
        const pairRanks = board.map(c=>rankValue(c.rank));
        const topBoard = Math.max(...pairRanks);
        const myRanks = playerCards.map(c=>rankValue(c.rank));
        const hasOverpair = playerCards[0].rank===playerCards[1].rank && rankValue(playerCards[0].rank) > topBoard;

        // Determine strength
        let strength;
        if(['straight-flush','four-kind','full-house','flush','straight'].includes(cat)) strength = 'monster';
        else if(cat==='three-kind' && playerCards[0].rank===playerCards[1].rank) strength = 'monster';
        else if(cat==='two-pair' || cat==='three-kind' || hasOverpair) strength = 'strong';
        else if(cat==='one-pair' && myRanks.includes(topBoard)) strength = 'strong';
        else {
            const suitCounts = [0,0,0,0];
            all.forEach(c => suitCounts[c.suit]++);
            const flushDraw = suitCounts.some(c => c === 4);
            if(flushDraw) strength = 'draw';
            else if(cat==='one-pair') strength = 'medium';
            else strength = 'weak';
        }

        // Decision matrix
        if(currentBet > 0) {
            if(strength==='monster') return 'raise';
            if(strength==='strong') return 'call';
            if(strength==='draw') return pot > 0 && currentBet/(pot+currentBet) < 0.3 ? 'call' : 'fold';
            if(strength==='medium') return currentBet <= pot*0.5 ? 'call' : 'fold';
            return 'fold';
        } else {
            if(strength==='monster') return 'bet';
            if(strength==='strong') return 'bet';
            if(strength==='draw') return inPosition ? 'bet' : 'check';
            if(strength==='medium') return 'check';
            return 'check';
        }
    }
```

- [ ] **Step 2: Implement review rendering**

```javascript
    function simRenderReview(winnerId) {
        const user = sim.players[sim.userSeat];
        const won = winnerId === sim.userSeat;
        const chipDelta = user.stack - sim.chipHistory[sim.chipHistory.length - 2];
        const userHand = cardNotation(user.cards);
        const userPos = sim.positions[sim.userSeat];

        // Build per-street feedback
        let streets = ['preflop','flop','turn','river'];
        let reviewHtml = '';

        streets.forEach(street => {
            const userActs = sim.handHistory.filter(h => h.seat===sim.userSeat && h.street===street);
            if(userActs.length === 0) return;

            const streetLabel = t(street+'Street');
            const boardAtStreet = street==='preflop' ? [] : street==='flop' ? sim.board.slice(0,3) : street==='turn' ? sim.board.slice(0,4) : sim.board;

            userActs.forEach(act => {
                let rec;
                if(street==='preflop') {
                    const facingRaise = sim.handHistory.some(h=>h.street==='preflop'&&h.seat!==sim.userSeat&&(h.action==='raise'||h.action==='bet'));
                    rec = gtoRecommendPreflop(userHand, userPos, facingRaise);
                } else {
                    const prevBet = sim.handHistory.filter(h=>h.street===street&&h.seat!==sim.userSeat).some(h=>h.action==='bet'||h.action==='raise');
                    const inPos = sim.actOrder[sim.actOrder.length-1] === sim.userSeat;
                    rec = gtoRecommendPostflop(user.cards, boardAtStreet, prevBet?sim.currentBet:0, sim.pot, inPos);
                }

                const userAction = act.action;
                const actionMatch = (userAction===rec) || (userAction==='check'&&rec==='check') || (userAction==='call'&&rec==='call');
                const closeEnough = (userAction==='call'&&rec==='raise') || (userAction==='bet'&&rec==='raise') || (userAction==='raise'&&rec==='bet');
                let verdict, color;
                if(actionMatch) { verdict = t('correct'); color = '#3fb950'; }
                else if(closeEnough) { verdict = t('suboptimal'); color = '#d29922'; }
                else { verdict = t('mistake'); color = '#f85149'; }

                reviewHtml += `<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid #21262d;">
                    <span style="color:#8b949e;font-size:0.7rem;">${streetLabel}</span>
                    <span style="font-size:0.75rem;">${t('yourAction')}: <strong>${userAction.toUpperCase()}</strong></span>
                    <span style="font-size:0.75rem;">${t('recommended')}: <strong>${rec.toUpperCase()}</strong></span>
                    <span style="color:${color};font-weight:700;font-size:0.75rem;">${verdict}</span>
                </div>`;
            });
        });

        // Show board at showdown
        let boardHtml = sim.board.map(c => `<span class="sim-card" style="display:inline-block;width:30px;height:40px;font-size:0.7rem;margin:2px;${SUITS[c.suit].c==='red'?'color:#f85149;':''}">${RANKS[c.rank]}${SUITS[c.suit].s}</span>`).join('');

        const el = document.getElementById('playTable');
        el.innerHTML = `
            <div style="text-align:center;margin-bottom:12px;">
                <div style="font-size:1.2rem;font-weight:700;color:${won?'#3fb950':'#f85149'};">${won?'+':''} ${chipDelta.toFixed(1)} BB</div>
                <div style="color:#8b949e;font-size:0.75rem;margin-top:4px;">${userHand} · ${userPos}</div>
                <div style="margin:8px 0;">${boardHtml}</div>
            </div>
            <div style="background:#161b22;border-radius:8px;padding:12px;margin-bottom:12px;">
                ${reviewHtml || '<div style="color:#8b949e;text-align:center;">No actions to review</div>'}
            </div>
            <div style="display:flex;gap:8px;justify-content:center;">
                <button class="big-btn" onclick="simNextHandCheck()" style="max-width:160px;">${t('nextHand')}</button>
                <button class="big-btn" onclick="simShowStats()" style="max-width:120px;background:#21262d;">${t('stats')}</button>
            </div>`;
    }

    function simNextHandCheck() {
        const user = sim.players[sim.userSeat];
        if(user.stack <= 0) {
            simShowBust();
            return;
        }
        simNewHand();
    }

    function simShowBust() {
        const el = document.getElementById('playTable');
        el.innerHTML = `
            <div style="text-align:center;padding:40px 0;">
                <div style="font-size:1.5rem;font-weight:700;color:#f85149;">${t('bust')}</div>
                <div style="margin-top:16px;display:flex;gap:8px;justify-content:center;">
                    <button class="big-btn" onclick="simRebuy()" style="max-width:140px;">${t('rebuy')}</button>
                    <button class="big-btn" onclick="simShowStats()" style="max-width:140px;background:#21262d;">${t('stats')}</button>
                </div>
            </div>`;
    }

    function simRebuy() {
        sim.players[sim.userSeat].stack = 100;
        sim.chipHistory.push(100);
        simNewHand();
    }
```

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: 핸드 리뷰 — 스트릿별 GTO 피드백 + 칩 변동 표시"
```

---

## Task 7: Session Statistics + Chip Graph

Display session-level statistics and a chip graph using inline SVG.

**Files:**
- Modify: `index.html` — stats panel rendering + localStorage persistence

- [ ] **Step 1: Implement stats display**

```javascript
    function simShowStats() {
        const s = sim.stats;
        const user = sim.players[sim.userSeat];
        const profit = user.stack - 100;
        const vpip = s.hands > 0 ? Math.round(s.vpipCount/s.hands*100) : 0;
        const pfr = s.hands > 0 ? Math.round(s.pfrCount/s.hands*100) : 0;
        const af = s.callCount > 0 ? (s.betRaiseCount/s.callCount).toFixed(1) : '-';
        const sd = s.hands > 0 ? Math.round(s.showdownCount/s.hands*100) : 0;
        const winRate = s.hands > 0 ? (profit/s.hands).toFixed(2) : '0';

        // Chip graph SVG
        const graphHtml = simChipGraph();

        const el = document.getElementById('playTable');
        el.innerHTML = `
            <div style="text-align:center;margin-bottom:16px;">
                <div style="font-size:0.85rem;font-weight:700;color:#7ee787;">${t('sessionSummary')}</div>
            </div>
            <div style="background:#161b22;border-radius:8px;padding:12px;margin-bottom:12px;">
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:0.75rem;">
                    <div><span style="color:#8b949e;">${t('handsPlayed')}:</span> <strong>${s.hands}</strong></div>
                    <div><span style="color:#8b949e;">${t('profit')}:</span> <strong style="color:${profit>=0?'#3fb950':'#f85149'}">${profit>=0?'+':''}${profit.toFixed(1)} BB</strong></div>
                    <div><span style="color:#8b949e;">${t('winRate')}:</span> <strong>${winRate} BB</strong></div>
                    <div><span style="color:#8b949e;">${t('vpipLabel')}:</span> <strong>${vpip}%</strong></div>
                    <div><span style="color:#8b949e;">${t('pfrLabel')}:</span> <strong>${pfr}%</strong></div>
                    <div><span style="color:#8b949e;">${t('afLabel')}:</span> <strong>${af}</strong></div>
                    <div><span style="color:#8b949e;">${t('showdownPct')}:</span> <strong>${sd}%</strong></div>
                </div>
            </div>
            <div style="background:#161b22;border-radius:8px;padding:12px;margin-bottom:12px;">
                <div style="color:#8b949e;font-size:0.7rem;margin-bottom:8px;">${t('chipGraph')}</div>
                ${graphHtml}
            </div>
            <div style="display:flex;gap:8px;justify-content:center;">
                <button class="big-btn" onclick="simNextHandCheck()" style="max-width:160px;">${t('nextHand')}</button>
                <button class="big-btn" onclick="simEndSession()" style="max-width:140px;background:#21262d;color:#f85149;">${t('endSession')}</button>
            </div>`;
    }
```

- [ ] **Step 2: Implement chip graph as inline SVG**

```javascript
    function simChipGraph() {
        const data = sim.chipHistory;
        if(data.length < 2) return '<div style="color:#484f58;text-align:center;font-size:0.7rem;">Not enough data</div>';

        const w = 280, h = 80, pad = 5;
        const min = Math.min(...data) - 5;
        const max = Math.max(...data) + 5;
        const xStep = (w - pad*2) / (data.length - 1);
        const yScale = (h - pad*2) / (max - min || 1);

        const points = data.map((v, i) => `${pad + i*xStep},${h - pad - (v-min)*yScale}`);
        const polyline = points.join(' ');
        const baseline = h - pad - (100-min)*yScale;

        return `<svg width="100%" viewBox="0 0 ${w} ${h}" style="max-width:${w}px;display:block;margin:0 auto;">
            <line x1="${pad}" y1="${baseline}" x2="${w-pad}" y2="${baseline}" stroke="#30363d" stroke-dasharray="3"/>
            <polyline points="${polyline}" fill="none" stroke="#7ee787" stroke-width="1.5"/>
            <circle cx="${points[points.length-1].split(',')[0]}" cy="${points[points.length-1].split(',')[1]}" r="3" fill="#7ee787"/>
        </svg>`;
    }
```

- [ ] **Step 3: Implement end session + localStorage save**

```javascript
    function simEndSession() {
        // Save to localStorage
        const saved = JSON.parse(localStorage.getItem('holdemssam-sessions') || '[]');
        saved.push({
            date: new Date().toISOString(),
            hands: sim.stats.hands,
            profit: sim.players[sim.userSeat].stack - 100,
            vpip: sim.stats.hands > 0 ? Math.round(sim.stats.vpipCount/sim.stats.hands*100) : 0,
            pfr: sim.stats.hands > 0 ? Math.round(sim.stats.pfrCount/sim.stats.hands*100) : 0
        });
        localStorage.setItem('holdemssam-sessions', JSON.stringify(saved.slice(-50))); // keep last 50

        sim = null;
        document.getElementById('playTable').style.display = 'none';
        document.getElementById('playSetup').style.display = 'block';
        simInitSetup();
    }
```

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: 세션 통계 — VPIP/PFR/AF/칩 그래프 + localStorage 저장"
```

---

## Task 8: Integration, Polish, and Deploy

Final integration: ensure everything works together, language toggle covers all new UI, and deploy to GitHub Pages.

**Files:**
- Modify: `index.html` — final wiring
- Modify: `sw.js` — bump cache version

- [ ] **Step 1: Wire initialization in INIT section**

Ensure the INIT section calls `simInitSetup()`:

```javascript
    // ============ INIT ============
    guiInit();
    pqInitSettings();
    initGloss();
    simInitSetup();
    applyLang();
```

- [ ] **Step 2: Update applyLang nav to handle 5 items**

Replace the existing nav update in `applyLang()`:

```javascript
        const navItems = document.querySelectorAll('.nav-item');
        const navKeys = ['navPre','navRank','navOuts','navPlay','navGloss'];
        navItems.forEach((n,i) => { if(navKeys[i]) n.lastChild.textContent = t(navKeys[i]); });
```

Remove the old 4-item nav update and the duplicate `navItems2` block from Task 1 step 3 (consolidate into one).

- [ ] **Step 3: Test full flow in browser**

Open `http://localhost:8080`, test:
1. Switch to Play tab — setup screen shows
2. Select 3 players, profile "loose", start session
3. Play through a full hand — preflop through showdown
4. Review screen shows per-street feedback
5. Click "Next Hand" — new hand starts
6. Click "Stats" — statistics display with chip graph
7. Toggle language — all Play UI switches to English
8. End session — returns to setup

- [ ] **Step 4: Bump service worker cache**

In `sw.js`, update:

```javascript
const CACHE_NAME = 'holdemssam-v4';
```

- [ ] **Step 5: Commit and push**

```bash
git add index.html sw.js
git commit -m "feat: Play 시뮬레이터 통합 완료 — 풀 핸드, AI, GTO 피드백, 통계"
git push origin main
```

---

## Summary

| Task | Description | Key Deliverable |
|------|-------------|-----------------|
| 1 | Nav + i18n + setup shell | Play tab visible, setup screen works |
| 2 | Deck + evaluator | Cards shuffle, hands evaluate correctly |
| 3 | AI engine | AI makes reasonable preflop/postflop decisions |
| 4 | Game loop | Full hand: deal→bet→showdown→pot award |
| 5 | Table UI | Visual table with action buttons |
| 6 | Hand review | Per-street GTO feedback after each hand |
| 7 | Session stats | VPIP/PFR/AF/chip graph/localStorage |
| 8 | Integration + deploy | Everything wired, deployed to GitHub Pages |
