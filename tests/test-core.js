// Core logic tests — run with: node tests/test-core.js
// No dependencies needed. Uses vm module to load source files safely.

const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Create shared context for all source files
const context = vm.createContext({ console, Math, Object, Set, Array, JSON, localStorage: { getItem: () => null, setItem: () => {} }, document: { querySelectorAll:()=>[], querySelector:()=>null, getElementById:()=>null, documentElement:{} } });

const files = ['js/i18n.js', 'js/data.js', 'js/simulator.js'];
files.forEach(f => {
    const code = fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
    vm.runInContext(code, context);
});

let pass = 0, fail = 0;
function assert(cond, msg) {
    if (cond) { pass++; console.log(`  + ${msg}`); }
    else { fail++; console.log(`  FAIL: ${msg}`); }
}

const { createDeck, shuffleDeck, evaluate5, bestHand, handCategory, cardNotation, aiPreflopAction, gtoRecommendPreflop, rankValue } = context;

// ============ DECK TESTS ============
console.log('\n[Deck & Shuffle]');

const deck = createDeck();
assert(deck.length === 52, 'Deck has 52 cards');
assert(deck[0].rank === 0 && deck[0].suit === 0, 'First card is A spade');
assert(deck[51].rank === 12 && deck[51].suit === 3, 'Last card is 2 club');

const shuffled = shuffleDeck([...deck]);
assert(shuffled.length === 52, 'Shuffled deck still has 52 cards');
const same = shuffled.every((c, i) => c.rank === deck[i].rank && c.suit === deck[i].suit);
assert(!same, 'Shuffled deck differs from original');

// ============ HAND EVALUATOR TESTS ============
console.log('\n[Hand Evaluator]');

// Royal flush: A K Q J T all spades
const royalFlush = [{rank:0,suit:0},{rank:1,suit:0},{rank:2,suit:0},{rank:3,suit:0},{rank:4,suit:0}];
const rfScore = evaluate5(royalFlush);
assert(rfScore >= 8e7, 'Royal flush scores as straight flush tier');

// Four of a kind: AAAA K
const quads = [{rank:0,suit:0},{rank:0,suit:1},{rank:0,suit:2},{rank:0,suit:3},{rank:1,suit:0}];
const quadScore = evaluate5(quads);
assert(quadScore >= 7e7 && quadScore < 8e7, 'Four of a kind in tier 7');

// Full house: KKK QQ
const fh = [{rank:1,suit:0},{rank:1,suit:1},{rank:1,suit:2},{rank:2,suit:0},{rank:2,suit:1}];
const fhScore = evaluate5(fh);
assert(fhScore >= 6e7 && fhScore < 7e7, 'Full house in tier 6');

// Flush: A J 9 7 5 all spades
const flush = [{rank:0,suit:0},{rank:3,suit:0},{rank:5,suit:0},{rank:7,suit:0},{rank:9,suit:0}];
const flushScore = evaluate5(flush);
assert(flushScore >= 5e7 && flushScore < 6e7, 'Flush in tier 5');

// Straight: T 9 8 7 6
const straight = [{rank:4,suit:0},{rank:5,suit:1},{rank:6,suit:2},{rank:7,suit:3},{rank:8,suit:0}];
const strScore = evaluate5(straight);
assert(strScore >= 4e7 && strScore < 5e7, 'Straight in tier 4');

// Wheel: A 2 3 4 5
const wheel = [{rank:0,suit:0},{rank:12,suit:1},{rank:11,suit:2},{rank:10,suit:3},{rank:9,suit:0}];
const wheelScore = evaluate5(wheel);
assert(wheelScore >= 4e7 && wheelScore < 5e7, 'Wheel (A-5) is a straight');

// Three of a kind
const trips = [{rank:2,suit:0},{rank:2,suit:1},{rank:2,suit:2},{rank:3,suit:0},{rank:5,suit:1}];
const tripsScore = evaluate5(trips);
assert(tripsScore >= 3e7 && tripsScore < 4e7, 'Three of a kind in tier 3');

// Two pair
const twoPair = [{rank:1,suit:0},{rank:1,suit:1},{rank:2,suit:0},{rank:2,suit:1},{rank:3,suit:0}];
const tpScore = evaluate5(twoPair);
assert(tpScore >= 2e7 && tpScore < 3e7, 'Two pair in tier 2');

// One pair
const onePair = [{rank:0,suit:0},{rank:0,suit:1},{rank:1,suit:0},{rank:2,suit:1},{rank:3,suit:2}];
const opScore = evaluate5(onePair);
assert(opScore >= 1e7 && opScore < 2e7, 'One pair in tier 1');

// High card
const highCard = [{rank:0,suit:0},{rank:1,suit:1},{rank:2,suit:2},{rank:3,suit:3},{rank:5,suit:0}];
const hcScore = evaluate5(highCard);
assert(hcScore < 1e7, 'High card in tier 0');

// Ranking order
assert(rfScore > quadScore, 'Straight flush > Four of a kind');
assert(quadScore > fhScore, 'Four of a kind > Full house');
assert(fhScore > flushScore, 'Full house > Flush');
assert(flushScore > strScore, 'Flush > Straight');
assert(strScore > tripsScore, 'Straight > Three of a kind');
assert(tripsScore > tpScore, 'Three of a kind > Two pair');
assert(tpScore > opScore, 'Two pair > One pair');
assert(opScore > hcScore, 'One pair > High card');

// bestHand from 7 cards
console.log('\n[Best Hand from 7]');
const sevenCards = [...royalFlush, {rank:12,suit:1}, {rank:11,suit:2}];
const best7 = bestHand(sevenCards);
assert(best7 === rfScore, 'Best hand from 7 finds royal flush');

// handCategory
assert(handCategory(rfScore) === 'straight-flush', 'Category: straight-flush');
assert(handCategory(quadScore) === 'four-kind', 'Category: four-kind');
assert(handCategory(fhScore) === 'full-house', 'Category: full-house');
assert(handCategory(opScore) === 'one-pair', 'Category: one-pair');

// ============ CARD NOTATION ============
console.log('\n[Card Notation]');
assert(cardNotation([{rank:0,suit:0},{rank:0,suit:1}]) === 'AA', 'Pocket aces = AA');
assert(cardNotation([{rank:0,suit:0},{rank:1,suit:0}]) === 'AKs', 'AKs suited');
assert(cardNotation([{rank:0,suit:0},{rank:1,suit:1}]) === 'AKo', 'AKo offsuit');
assert(cardNotation([{rank:1,suit:2},{rank:0,suit:3}]) === 'AKo', 'K A sorted to AKo');

// ============ AI PREFLOP ============
console.log('\n[AI Preflop]');
const fakeSimPre = { currentBet: 0, positions: { 0:'BTN' } };
const aiPlayer = { profile:'regular', cards:[{rank:0,suit:0},{rank:0,suit:1}], seat:0 };
const aaAction = aiPreflopAction(aiPlayer, fakeSimPre);
assert(aaAction.action === 'raise', 'AI raises AA from BTN');

// ============ GTO FEEDBACK ============
console.log('\n[GTO Feedback]');
const gtoAA = gtoRecommendPreflop('AA', 'UTG', false);
assert(gtoAA === 'raise', 'GTO: raise AA from UTG');

const gtoJunk = gtoRecommendPreflop('72o', 'UTG', false);
assert(gtoJunk === 'fold', 'GTO: fold 72o from UTG');

// ============ OUTS SCENARIOS ============
console.log('\n[Outs Scenarios]');

// Load app.js in a context with enough DOM stubs
const mockEl = () => ({style:{},textContent:'',innerHTML:'',value:'',focus:()=>{},querySelectorAll:()=>[],querySelector:()=>mockEl(),addEventListener:()=>{},classList:{add:()=>{},remove:()=>{},toggle:()=>false,contains:()=>false},children:[],childNodes:[{textContent:''}],lastChild:{textContent:''},getBoundingClientRect:()=>({})});
const appContext = vm.createContext({
    console, Math, Object, Set, Array, JSON, Number, parseInt, parseFloat, isNaN,
    localStorage: { getItem: () => null, setItem: () => {} },
    document: { querySelectorAll:()=>[], querySelector:()=>mockEl(), getElementById:()=>mockEl(), documentElement:{lang:''}, addEventListener:()=>{} },
    window: { addEventListener:()=>{} }, event: { target:{classList:{add:()=>{}}} }
});
const appFiles = ['js/i18n.js', 'js/data.js', 'js/app.js'];
appFiles.forEach(f => {
    const code = fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
    vm.runInContext(code, appContext);
});

const { outsGenScenario } = appContext;

// Test: outsGenScenario returns valid structure
for(let i=0; i<20; i++) {
    const s = outsGenScenario();
    assert(s.hand.length === 2, `Scenario ${i+1}: hand has 2 cards`);
    assert(s.board.length === 3, `Scenario ${i+1}: board has 3 cards`);
    assert(typeof s.answer === 'number' && s.answer > 0, `Scenario ${i+1}: answer is positive number (${s.answer})`);
    assert([2,4,6,8,9].includes(s.answer), `Scenario ${i+1}: answer is valid outs count (${s.answer})`);

    // Verify no duplicate cards
    const allCards = [...s.hand, ...s.board];
    const cardKeys = allCards.map(c => `${c.rank}-${c.suit}`);
    const unique = new Set(cardKeys);
    assert(unique.size === 5, `Scenario ${i+1}: all 5 cards unique`);
}

// Test flush draw specifically
let foundFlush = false;
for(let i=0; i<100; i++) {
    const s = outsGenScenario();
    if(s.answer === 9) {
        const suitCounts = [0,0,0,0];
        [...s.hand, ...s.board].forEach(c => suitCounts[c.suit]++);
        const maxSuit = Math.max(...suitCounts);
        assert(maxSuit === 4, 'Flush draw: 4 cards of same suit');
        foundFlush = true;
        break;
    }
}
assert(foundFlush, 'Flush draw scenario generated within 100 tries');

// Test overcards
let foundOver = false;
for(let i=0; i<100; i++) {
    const s = outsGenScenario();
    if(s.answer === 6) {
        assert(s.hand[0].rank === 0 && s.hand[1].rank === 1, 'Overcards: hand is A,K');
        const boardHighest = Math.min(...s.board.map(c=>c.rank));
        assert(boardHighest > 1, 'Overcards: board cards all lower than K');
        foundOver = true;
        break;
    }
}
assert(foundOver, 'Overcards scenario generated within 100 tries');

// ============ SUMMARY ============
console.log('\n' + '='.repeat(40));
console.log('Results: ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail > 0 ? 1 : 0);
