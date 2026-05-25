# Holdem Simulator — Design Spec

## Overview

A client-side 6-Max cash game simulator added to HoldemSsam. Players make decisions from preflop through river, receive GTO-approximated feedback per street, and track chip fluctuations across a multi-hand session. Fully bilingual (ko/en) via existing i18n system.

## Core Features

### 1. Table Setup
- Player count: 2–6 (user selectable before session start)
- Starting stack: 100BB for all players
- Blinds: 0.5BB / 1BB fixed
- User's seat: always fixed at one position; position rotates each hand (dealer button moves)

### 2. Hand Flow

Each hand progresses through:

1. **Preflop** — blinds posted, hole cards dealt, action around table
2. **Flop** — 3 community cards, betting round
3. **Turn** — 1 community card, betting round
4. **River** — 1 community card, betting round
5. **Showdown** — if 2+ players remain, best hand wins

At each decision point the user selects an action. AI opponents act automatically.

### 3. User Actions

Available actions depend on context:
- **Fold** — always available
- **Check** — when no bet to call
- **Call** — match current bet
- **Bet** — when no bet yet (size: 1/3 pot, 1/2 pot, 2/3 pot, pot, custom)
- **Raise** — when facing a bet (2x, 3x, pot, all-in)
- **All-in** — always available

Bet sizing uses preset buttons + optional slider for custom amounts.

### 4. AI Opponents

Each AI has a profile that affects their range and aggression:

| Profile | VPIP | PFR | Description |
|---------|------|-----|-------------|
| Tight | ~18% | ~14% | Plays few hands, straightforward |
| Regular | ~24% | ~20% | Standard competent player |
| Loose | ~35% | ~22% | Plays many hands, calls often |
| Aggressive | ~28% | ~24% | 3-bets wide, barrels frequently |

AI decision logic:
- **Preflop**: range lookup per position and profile
- **Postflop**: hand strength category + board texture + pot odds → action lookup table

AI hand strength categories:
- Monster (set+, two pair on dry board): bet/raise large
- Strong (top pair good kicker, overpair): bet for value
- Medium (middle pair, weak top pair): check/call, occasional bet
- Draw (8+ outs): semi-bluff if in position, call if pot odds met
- Weak (no pair, missed draw): check/fold, occasional bluff (frequency based on profile)

### 5. GTO Feedback System

After each hand completes, show a hand review:

Per-street breakdown:
- **User's action** vs **Recommended action**
- Color coded: green (correct), yellow (suboptimal but acceptable), red (mistake)
- Brief explanation in user's language

Recommendation logic (GTO approximation):

**Preflop**: existing OPEN_RANGES / VS_RAISE data

**Postflop decision matrix** (hand strength x position x SPR):

| Hand Strength | In Position | Out of Position |
|---------------|-------------|-----------------|
| Monster | Bet/raise for value | Bet or check-raise |
| Strong | Bet 50-75% pot | Bet 50-66% pot |
| Draw (good) | Semi-bluff 50-66% | Check-call or donk |
| Draw (weak) | Check, call if odds | Check-fold |
| Medium | Check, call small | Check-call 1 street |
| Weak/Air | Bluff select spots | Check-fold |

SPR modifiers:
- SPR < 4: push/fold simplified decisions
- SPR > 10: multi-street planning, smaller bets

### 6. Session Statistics

Tracked per session (localStorage):
- Hands played
- Win rate (BB/hand)
- VPIP% (voluntarily put money in pot)
- PFR% (preflop raise)
- AF (aggression factor: bets+raises / calls)
- Went to showdown %
- Chip graph (hand-by-hand stack history)

End-of-session summary screen with all stats.

### 7. Chip Tracking

- Each player starts 100BB
- Pot arithmetic handled correctly (side pots if all-in vs larger stack)
- Session ends when user goes bust OR user clicks "End Session"
- User can rebuy (resets to 100BB, tracked as separate buy-in)

## UI Design

### Navigation
- New tab "Play" added to bottom nav (between Outs and Glossary, or as 5th tab)
- Icon: poker chip or card table symbol

### Table View
- Top: community board cards (centered)
- Middle: pot size display
- Around the table: opponent seats showing stack size + action indicator
- Bottom: user's hole cards (large), action buttons below

### Action UI
- Primary row: Fold | Check/Call | Bet/Raise
- Secondary: bet size presets (1/3, 1/2, 2/3, pot, all-in)
- Amount displayed clearly before confirming

### Hand Review (after each hand)
- Scrollable street-by-street timeline
- Each street: board state, user action, recommendation, verdict
- "Next Hand" button at bottom

### Session Stats Screen
- Accessible via button during session ("Stats") or at session end
- Simple bar/line chart for chip graph (CSS-only or inline SVG)

## i18n

All UI text goes through existing `t()` function. New keys added to both `ko` and `en` objects in I18N:

Key categories:
- Table setup labels (playerCount, startStack, startSession, etc.)
- Action buttons (fold, check, call, bet, raise, allIn)
- Feedback messages (correct, suboptimal, mistake, explanation templates)
- Statistics labels (handsPlayed, winRate, vpip, pfr, af, etc.)
- Session controls (endSession, rebuy, nextHand, review)

## Technical Constraints

- Pure client-side JavaScript (no build step, no backend)
- Single index.html file (consistent with current architecture)
- No external libraries
- localStorage for session persistence
- GitHub Pages compatible
- 52-card deck shuffled per hand using Fisher-Yates

## Data Model

```javascript
// Session state
session = {
  players: [{id, profile, stack, cards, folded, position}],
  userSeat: number,
  deck: [],
  board: [],
  pot: number,
  currentBet: number,
  street: 'preflop'|'flop'|'turn'|'river'|'showdown',
  handHistory: [],  // per-street actions
  stats: {hands, vpipCount, pfrCount, ...},
  chipHistory: []  // stack after each hand
}
```

## Scope Boundaries (NOT in v1)

- No tournament mode (cash only)
- No real multiplayer
- No card animations (keep it fast/simple)
- No hand history export
- No AI adaptation (profiles are static)
