    // ============ DECK & EVALUATOR ============
    function createDeck() {
        const deck = [];
        for(let s=0;s<4;s++) for(let r=0;r<13;r++) deck.push({rank:r,suit:s});
        return deck;
    }
    function shuffleDeck(deck) {
        for(let i=deck.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]];}
        return deck;
    }
    function rankValue(r){return 14-r;}
    function evaluate5(cards){
        const ranks=cards.map(c=>rankValue(c.rank)).sort((a,b)=>b-a);
        const suits=cards.map(c=>c.suit);
        const isFlush=suits.every(s=>s===suits[0]);
        const isStr=(ranks[0]-ranks[4]===4&&new Set(ranks).size===5)||(ranks[0]===14&&ranks[1]===5&&ranks[2]===4&&ranks[3]===3&&ranks[4]===2);
        const isLowStr=ranks[0]===14&&ranks[1]===5;
        const counts={};ranks.forEach(r=>{counts[r]=(counts[r]||0)+1;});
        const groups=Object.entries(counts).sort((a,b)=>b[1]-a[1]||(+b[0])-(+a[0]));
        const pattern=groups.map(g=>g[1]).join('');
        const kickers=groups.map(g=>+g[0]);
        let score=0;
        if(isFlush&&isStr)score=isLowStr?8e7+5:8e7+ranks[0];
        else if(pattern==='41')score=7e7+kickers[0]*100+kickers[1];
        else if(pattern==='32')score=6e7+kickers[0]*100+kickers[1];
        else if(isFlush)score=5e7+ranks[0]*1e4+ranks[1]*1e3+ranks[2]*100+ranks[3]*10+ranks[4];
        else if(isStr)score=4e7+(isLowStr?5:ranks[0]);
        else if(pattern==='311')score=3e7+kickers[0]*1e4+kickers[1]*100+kickers[2];
        else if(pattern==='221')score=2e7+kickers[0]*1e4+kickers[1]*100+kickers[2];
        else if(pattern==='2111')score=1e7+kickers[0]*1e4+kickers[1]*1e3+kickers[2]*100+kickers[3];
        else score=ranks[0]*1e4+ranks[1]*1e3+ranks[2]*100+ranks[3]*10+ranks[4];
        return score;
    }
    function bestHand(cards7){
        let best=0;
        for(let i=0;i<7;i++)for(let j=i+1;j<7;j++){
            const h=cards7.filter((_,idx)=>idx!==i&&idx!==j);
            const s=evaluate5(h);if(s>best)best=s;
        }
        return best;
    }
    function handCategory(score){
        const tier=Math.floor(score/1e7);
        return ['high-card','one-pair','two-pair','three-kind','straight','flush','full-house','four-kind','straight-flush'][tier]||'high-card';
    }

    // ============ AI ENGINE ============
    const AI_PROFILES={tight:{vpip:0.18,pfr:0.14,bluffFreq:0.1,callDown:0.3},regular:{vpip:0.24,pfr:0.20,bluffFreq:0.2,callDown:0.5},loose:{vpip:0.35,pfr:0.22,bluffFreq:0.25,callDown:0.7},aggressive:{vpip:0.28,pfr:0.24,bluffFreq:0.35,callDown:0.6}};

    function cardNotation(cards){
        const r1=RANKS[cards[0].rank],r2=RANKS[cards[1].rank];
        if(cards[0].rank===cards[1].rank)return r1+r2;
        const suited=cards[0].suit===cards[1].suit;
        const hi=cards[0].rank<cards[1].rank?r1:r2;
        const lo=cards[0].rank<cards[1].rank?r2:r1;
        return hi+lo+(suited?'s':'o');
    }

    function aiPreflopAction(player,sim){
        const profile=AI_PROFILES[player.profile];
        const hand=cardNotation(player.cards);
        const pos=sim.positions[player.seat];
        const facingRaise=sim.currentBet>2;
        if(facingRaise){
            const ranges=VS_RAISE[pos];
            if(ranges&&ranges.raise.includes(hand))return{action:'raise',amount:sim.currentBet*3};
            if(ranges&&ranges.call.includes(hand))return{action:'call',amount:sim.currentBet};
            if(Math.random()<profile.bluffFreq*0.3)return{action:'call',amount:sim.currentBet};
            return{action:'fold'};
        }else{
            const ranges=OPEN_RANGES[pos];
            if(ranges&&ranges.raise.includes(hand))return{action:'raise',amount:5};
            if(ranges&&ranges.call.includes(hand))return Math.random()<profile.pfr/profile.vpip?{action:'raise',amount:5}:{action:'call',amount:2};
            if(Math.random()<(profile.vpip-0.15)*0.5)return{action:'call',amount:sim.currentBet||2};
            return{action:'fold'};
        }
    }

    function aiHandStrength(player,board){
        const all=[...player.cards,...board];
        const score=bestHand(all);
        const cat=handCategory(score);
        const pairRanks=board.map(c=>rankValue(c.rank));
        const topBoard=Math.max(...pairRanks);
        const hasOverpair=player.cards[0].rank===player.cards[1].rank&&rankValue(player.cards[0].rank)>topBoard;
        if(['straight-flush','four-kind','full-house','flush','straight'].includes(cat))return'monster';
        if(cat==='three-kind'&&player.cards[0].rank===player.cards[1].rank)return'monster';
        if(cat==='two-pair'||cat==='three-kind'||hasOverpair)return'strong';
        if(cat==='one-pair'){const myRanks=player.cards.map(c=>rankValue(c.rank));if(myRanks.includes(topBoard))return'strong';}
        const suitCounts=[0,0,0,0];all.forEach(c=>suitCounts[c.suit]++);
        if(suitCounts.some(c=>c===4))return'draw';
        if(cat==='one-pair')return'medium';
        return'weak';
    }

    function aiPostflopAction(player,sim){
        const profile=AI_PROFILES[player.profile];
        const strength=aiHandStrength(player,sim.board);
        const potOdds=sim.currentBet>0?sim.currentBet/(sim.pot+sim.currentBet):0;
        if(strength==='monster'){
            if(sim.currentBet>0)return{action:'raise',amount:Math.round(sim.pot*2)};
            return{action:'bet',amount:Math.max(2,Math.round(sim.pot*0.75))};
        }
        if(strength==='strong'){
            if(sim.currentBet>0)return Math.random()<0.4?{action:'raise',amount:Math.round(sim.pot*0.75)}:{action:'call',amount:sim.currentBet};
            return{action:'bet',amount:Math.max(2,Math.round(sim.pot*(0.5+Math.random()*0.25)))};
        }
        if(strength==='draw'){
            if(sim.currentBet>0)return potOdds<0.3?{action:'call',amount:sim.currentBet}:{action:'fold'};
            return Math.random()<profile.bluffFreq?{action:'bet',amount:Math.max(2,Math.round(sim.pot*0.5))}:{action:'check'};
        }
        if(strength==='medium'){
            if(sim.currentBet>0)return sim.currentBet<=sim.pot*0.5&&Math.random()<profile.callDown?{action:'call',amount:sim.currentBet}:{action:'fold'};
            return{action:'check'};
        }
        if(sim.currentBet>0)return{action:'fold'};
        return Math.random()<profile.bluffFreq*0.5?{action:'bet',amount:Math.max(2,Math.round(sim.pot*0.5))}:{action:'check'};
    }

    // ============ GTO FEEDBACK ============
    function gtoRecommendPreflop(hand,pos,facingRaise){
        if(facingRaise){
            const ranges=VS_RAISE[pos];
            if(ranges&&ranges.raise.includes(hand))return'raise';
            if(ranges&&ranges.call.includes(hand))return'call';
            return'fold';
        }
        const ranges=OPEN_RANGES[pos];
        if(ranges&&ranges.raise.includes(hand))return'raise';
        if(ranges&&ranges.call.includes(hand))return'call';
        return'fold';
    }
    function gtoRecommendPostflop(playerCards,board,currentBet,pot){
        const all=[...playerCards,...board];
        const score=bestHand(all);
        const cat=handCategory(score);
        const pairRanks=board.map(c=>rankValue(c.rank));
        const topBoard=Math.max(...pairRanks);
        const hasOverpair=playerCards[0].rank===playerCards[1].rank&&rankValue(playerCards[0].rank)>topBoard;
        let strength;
        if(['straight-flush','four-kind','full-house','flush','straight'].includes(cat))strength='monster';
        else if(cat==='three-kind'&&playerCards[0].rank===playerCards[1].rank)strength='monster';
        else if(cat==='two-pair'||cat==='three-kind'||hasOverpair)strength='strong';
        else if(cat==='one-pair'&&playerCards.map(c=>rankValue(c.rank)).includes(topBoard))strength='strong';
        else{const sc=[0,0,0,0];all.forEach(c=>sc[c.suit]++);strength=sc.some(c=>c===4)?'draw':cat==='one-pair'?'medium':'weak';}
        if(currentBet>0){
            if(strength==='monster')return'raise';
            if(strength==='strong')return'call';
            if(strength==='draw')return pot>0&&currentBet/(pot+currentBet)<0.3?'call':'fold';
            if(strength==='medium')return currentBet<=pot*0.5?'call':'fold';
            return'fold';
        }else{
            if(strength==='monster'||strength==='strong')return'bet';
            return'check';
        }
    }

    // ============ PLAY SIMULATOR ============
    let sim=null;
    let simConfig={players:2,profile:'regular'};

    function simInitSetup(){
        document.getElementById('playPlayerCount').innerHTML=[2,3,4,5,6].map((n,i)=>`<div class="btn${n===simConfig.players?' active':''}" onclick="simSetPlayers(this,${n})">${n}</div>`).join('');
        document.getElementById('playProfileSet').innerHTML=['tight','regular','loose','aggressive'].map((p)=>`<div class="btn${p===simConfig.profile?' active':''}" onclick="simSetProfile(this,'${p}')">${t(p)}</div>`).join('');
    }
    function simSetPlayers(el,n){simConfig.players=n;const bs=el.parentElement.children;for(let b of bs)b.classList.remove('active');el.classList.add('active');}
    function simSetProfile(el,p){simConfig.profile=p;const bs=el.parentElement.children;for(let b of bs)b.classList.remove('active');el.classList.add('active');}

    function simStart(){
        const n=simConfig.players;
        const players=[];
        for(let i=0;i<n;i++)players.push({id:i,seat:i,profile:i===0?'human':simConfig.profile,stack:200,cards:[],folded:false,allIn:false,bet:0});
        sim={players,userSeat:0,dealer:Math.floor(Math.random()*n),deck:[],board:[],pot:0,currentBet:0,street:'preflop',actIndex:0,actOrder:[],handHistory:[],stats:{hands:0,vpipCount:0,pfrCount:0,betRaiseCount:0,callCount:0,showdownCount:0},chipHistory:[200],positions:[],deckIdx:0};
        document.getElementById('playSetup').style.display='none';
        document.getElementById('playTable').style.display='block';
        simNewHand();
    }

    function simNewHand(){
        sim.deck=shuffleDeck(createDeck());
        sim.board=[];sim.pot=0;sim.currentBet=0;sim.street='preflop';sim.handHistory=[];
        sim.dealer=(sim.dealer+1)%sim.players.length;
        const n=sim.players.length;
        const posNames=n===2?['BTN','BB']:n===3?['BTN','SB','BB']:n===4?['BTN','SB','BB','UTG']:n===5?['BTN','SB','BB','UTG','CO']:['BTN','SB','BB','UTG','MP','CO'];
        sim.positions=[];
        for(let i=0;i<n;i++)sim.positions[(sim.dealer+i)%n]=posNames[i];
        sim.players.forEach(p=>{p.cards=[];p.folded=false;p.allIn=false;p.bet=0;});
        let ci=0;sim.players.forEach(p=>{p.cards=[sim.deck[ci++],sim.deck[ci++]];});sim.deckIdx=ci;
        const sbSeat=(sim.dealer+1)%n,bbSeat=(sim.dealer+2)%n;
        if(n===2){simPostBlind(sim.dealer,1);simPostBlind((sim.dealer+1)%n,2);}
        else{simPostBlind(sbSeat,1);simPostBlind(bbSeat,2);}
        sim.currentBet=2;
        sim.actOrder=[];
        const firstAct=n===2?sim.dealer:(bbSeat+1)%n;
        for(let i=0;i<n;i++){const s=(firstAct+i)%n;if(!sim.players[s].folded&&!sim.players[s].allIn)sim.actOrder.push(s);}
        sim.actIndex=0;
        simRenderTable();simNextAction();
    }

    function simPostBlind(seat,amount){
        const p=sim.players[seat];const actual=Math.min(amount,p.stack);
        p.stack-=actual;p.bet=actual;sim.pot+=actual;
        if(p.stack===0)p.allIn=true;
    }

    function simNextAction(){
        if(sim.actIndex>=sim.actOrder.length){simEndBettingRound();return;}
        const seat=sim.actOrder[sim.actIndex];
        if(sim.players[seat].folded||sim.players[seat].allIn){sim.actIndex++;simNextAction();return;}
        if(seat===sim.userSeat){simShowActions();}
        else{setTimeout(()=>{
            const ai=sim.players[seat];
            const decision=sim.street==='preflop'?aiPreflopAction(ai,sim):aiPostflopAction(ai,sim);
            simProcessAction(seat,decision);
        },300);}
    }

    function simProcessAction(seat,decision){
        const p=sim.players[seat];const action=decision.action;
        if(action==='fold'){p.folded=true;}
        else if(action==='check'){}
        else if(action==='call'){
            const toCall=Math.min(sim.currentBet-p.bet,p.stack);
            p.stack-=toCall;p.bet+=toCall;sim.pot+=toCall;
            if(p.stack===0)p.allIn=true;
        }else if(action==='bet'||action==='raise'){
            const targetBet=action==='bet'?decision.amount:sim.currentBet+decision.amount;
            const toAdd=Math.min(targetBet-p.bet,p.stack);
            p.stack-=toAdd;p.bet+=toAdd;sim.pot+=toAdd;
            sim.currentBet=p.bet;
            if(p.stack===0)p.allIn=true;
            sim.actOrder=[];
            for(let i=1;i<=sim.players.length;i++){const s=(seat+i)%sim.players.length;if(!sim.players[s].folded&&!sim.players[s].allIn&&s!==seat)sim.actOrder.push(s);}
            sim.actIndex=0;
            simLogAction(seat,action,p.bet);simRenderTable();simNextAction();return;
        }
        simLogAction(seat,action,p.bet);sim.actIndex++;simRenderTable();simNextAction();
    }

    function simLogAction(seat,action,amount){sim.handHistory.push({street:sim.street,seat,action,amount});}

    function simEndBettingRound(){
        sim.players.forEach(p=>p.bet=0);sim.currentBet=0;
        const active=sim.players.filter(p=>!p.folded);
        if(active.length===1){simAwardPot(active[0].id);return;}
        const canAct=active.filter(p=>!p.allIn);
        if(canAct.length<=1){while(sim.board.length<5)sim.board.push(sim.deck[sim.deckIdx++]);simShowdown();return;}
        if(sim.street==='preflop'){sim.street='flop';sim.board=[sim.deck[sim.deckIdx++],sim.deck[sim.deckIdx++],sim.deck[sim.deckIdx++]];}
        else if(sim.street==='flop'){sim.street='turn';sim.board.push(sim.deck[sim.deckIdx++]);}
        else if(sim.street==='turn'){sim.street='river';sim.board.push(sim.deck[sim.deckIdx++]);}
        else{simShowdown();return;}
        sim.actOrder=[];
        for(let i=1;i<=sim.players.length;i++){const s=(sim.dealer+i)%sim.players.length;if(!sim.players[s].folded&&!sim.players[s].allIn)sim.actOrder.push(s);}
        sim.actIndex=0;simRenderTable();simNextAction();
    }

    function simShowdown(){
        sim.street='showdown';
        const active=sim.players.filter(p=>!p.folded);
        let bestScore=-1,winnerId=-1;
        active.forEach(p=>{const s=bestHand([...p.cards,...sim.board]);if(s>bestScore){bestScore=s;winnerId=p.id;}});
        sim.stats.showdownCount++;
        simAwardPot(winnerId);
    }

    function simAwardPot(winnerId){
        sim.players[winnerId].stack+=sim.pot;sim.pot=0;
        sim.stats.hands++;
        sim.chipHistory.push(sim.players[sim.userSeat].stack);
        const userPreActions=sim.handHistory.filter(h=>h.seat===sim.userSeat&&h.street==='preflop');
        if(userPreActions.some(a=>a.action!=='fold'&&a.action!=='check'))sim.stats.vpipCount++;
        if(userPreActions.some(a=>a.action==='raise'||a.action==='bet'))sim.stats.pfrCount++;
        sim.handHistory.filter(h=>h.seat===sim.userSeat).forEach(a=>{if(a.action==='bet'||a.action==='raise')sim.stats.betRaiseCount++;if(a.action==='call')sim.stats.callCount++;});
        simRenderReview(winnerId);
    }

    // ============ PLAY UI ============
    function simRenderTable(){
        const el=document.getElementById('playTable');
        const user=sim.players[sim.userSeat];
        let boardHtml='';
        for(let i=0;i<5;i++){if(i<sim.board.length){const c=sim.board[i];boardHtml+=`<div class="sim-card ${SUITS[c.suit].c}">${RANKS[c.rank]}${SUITS[c.suit].s}</div>`;}else boardHtml+=`<div class="sim-card hidden"></div>`;}
        let seatsHtml='';
        sim.players.forEach((p,i)=>{if(i===sim.userSeat)return;const pos=sim.positions[i]||'';const lastAct=sim.handHistory.filter(h=>h.seat===i).pop();const actText=lastAct?lastAct.action.toUpperCase():'';
        seatsHtml+=`<div class="sim-seat${p.folded?' folded':''}"><div class="seat-pos">${pos}</div><div class="seat-stack">${Math.round(p.stack)}</div><div class="seat-action">${p.folded?'FOLD':actText}</div></div>`;});
        let myCardsHtml='';user.cards.forEach(c=>{myCardsHtml+=`<div class="sim-card ${SUITS[c.suit].c}">${RANKS[c.rank]}${SUITS[c.suit].s}</div>`;});
        el.innerHTML=`<div class="sim-table"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;"><span style="color:#8b949e;font-size:0.7rem;">${t('blindsLabel')}: 1/2</span><span style="color:#8b949e;font-size:0.7rem;">${sim.positions[sim.userSeat]} · ${Math.round(user.stack)}</span><button class="size-btn" onclick="simEndSession()" style="color:#f85149;border-color:#f85149;font-size:0.65rem;">${t('endSession')}</button></div><div class="sim-seats">${seatsHtml}</div><div class="sim-board">${boardHtml}</div><div class="sim-pot">${t('potLabel')}: ${Math.round(sim.pot)}</div><div class="sim-my-cards">${myCardsHtml}</div><div class="sim-actions" id="simActions"></div><div class="sim-sizes" id="simSizes"></div></div>`;
    }

    function simShowActions(){
        const user=sim.players[sim.userSeat];
        const toCall=sim.currentBet-user.bet;
        let html=`<button class="act-btn act-fold" onclick="simUserAct('fold')">${t('simFold')}</button>`;
        if(toCall<=0){html+=`<button class="act-btn act-call" onclick="simUserAct('check')">${t('simCheck')}</button>`;html+=`<button class="act-btn act-raise" onclick="simShowBetSizes('bet')">${t('simBet')}</button>`;}
        else{html+=`<button class="act-btn act-call" onclick="simUserAct('call')">${t('simCall')} ${Math.round(toCall)}</button>`;html+=`<button class="act-btn act-raise" onclick="simShowBetSizes('raise')">${t('simRaise')}</button>`;}
        html+=`<button class="act-btn" onclick="simUserAct('allin')">${t('simAllIn')}</button>`;
        document.getElementById('simActions').innerHTML=html;
    }

    function simShowBetSizes(type){
        const pot=sim.pot||1;
        const sizes=type==='bet'?[['1/3',pot*0.33],['1/2',pot*0.5],['2/3',pot*0.66],['Pot',pot]]:[['2x',sim.currentBet*2],['3x',sim.currentBet*3],['Pot',pot+sim.currentBet]];
        const user=sim.players[sim.userSeat];
        let html=sizes.map(([label,amt])=>{const capped=Math.min(Math.round(amt),user.stack);return`<button class="size-btn" onclick="simUserAct('${type}',${capped})">${label} (${capped})</button>`;}).join('');
        html+=`<button class="size-btn" onclick="simUserAct('allin')">${t('simAllIn')}</button>`;
        document.getElementById('simSizes').innerHTML=html;
    }

    function simUserAct(action,amount){
        const user=sim.players[sim.userSeat];
        if(action==='allin'){amount=user.stack+user.bet;action=sim.currentBet>0?'raise':'bet';}
        simProcessAction(sim.userSeat,{action,amount:amount||sim.currentBet});
    }

    function simRenderReview(winnerId){
        const user=sim.players[sim.userSeat];
        const won=winnerId===sim.userSeat;
        const prevStack=sim.chipHistory.length>=2?sim.chipHistory[sim.chipHistory.length-2]:200;
        const chipDelta=user.stack-prevStack;
        const userHand=cardNotation(user.cards);
        const userPos=sim.positions[sim.userSeat];
        const streets=['preflop','flop','turn','river'];
        const streetKeys={preflop:'preflopStreet',flop:'flopStreet',turn:'turnStreet',river:'riverStreet'};
        let reviewHtml='';
        streets.forEach(street=>{
            const userActs=sim.handHistory.filter(h=>h.seat===sim.userSeat&&h.street===street);
            if(!userActs.length)return;
            const boardAtStreet=street==='preflop'?[]:street==='flop'?sim.board.slice(0,3):street==='turn'?sim.board.slice(0,4):sim.board;
            userActs.forEach(act=>{
                let rec;
                if(street==='preflop'){const fr=sim.handHistory.some(h=>h.street==='preflop'&&h.seat!==sim.userSeat&&(h.action==='raise'||h.action==='bet'));rec=gtoRecommendPreflop(userHand,userPos,fr);}
                else{const prevBet=sim.handHistory.filter(h=>h.street===street&&h.seat!==sim.userSeat).some(h=>h.action==='bet'||h.action==='raise');rec=gtoRecommendPostflop(user.cards,boardAtStreet,prevBet?1:0,sim.pot);}
                const ua=act.action;
                const match=(ua===rec)||(ua==='check'&&rec==='check')||(ua==='call'&&rec==='call');
                const close=(ua==='call'&&rec==='raise')||(ua==='bet'&&rec==='raise')||(ua==='raise'&&rec==='bet');
                let verdict,color;
                if(match){verdict=t('simCorrect');color='#3fb950';}
                else if(close){verdict=t('simSuboptimal');color='#d29922';}
                else{verdict=t('simMistake');color='#f85149';}
                reviewHtml+=`<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid #21262d;font-size:0.7rem;"><span style="color:#8b949e;">${t(streetKeys[street])}</span><span>${ua.toUpperCase()}</span><span style="color:#58a6ff;">${rec.toUpperCase()}</span><span style="color:${color};font-weight:700;">${verdict}</span></div>`;
            });
        });
        let boardHtml=sim.board.map(c=>`<span style="display:inline-block;margin:2px;font-weight:700;${SUITS[c.suit].c==='red'?'color:#f85149;':''}">${RANKS[c.rank]}${SUITS[c.suit].s}</span>`).join(' ');
        const el=document.getElementById('playTable');
        el.innerHTML=`<div style="text-align:center;margin-bottom:12px;"><div style="font-size:1.2rem;font-weight:700;color:${won?'#3fb950':'#f85149'};">${won?'+':''}${Math.round(chipDelta)}</div><div style="color:#8b949e;font-size:0.75rem;margin-top:4px;">${userHand} · ${userPos}</div><div style="margin:8px 0;">${boardHtml}</div></div><div style="background:#161b22;border-radius:8px;padding:12px;margin-bottom:12px;"><div style="display:flex;justify-content:space-between;padding:4px 0;font-size:0.6rem;color:#484f58;border-bottom:1px solid #30363d;margin-bottom:4px;"><span>Street</span><span>${t('yourAction')}</span><span>${t('recommended')}</span><span>Result</span></div>${reviewHtml||'<div style="color:#484f58;text-align:center;">-</div>'}</div><div style="display:flex;gap:8px;justify-content:center;"><button class="big-btn" onclick="simNextHandCheck()" style="max-width:160px;">${t('nextHand')}</button><button class="big-btn" onclick="simShowStats()" style="max-width:120px;background:#21262d;">${t('simStats')}</button></div>`;
    }

    function simNextHandCheck(){
        if(sim.players[sim.userSeat].stack<=0){simShowBust();return;}
        simNewHand();
    }
    function simShowBust(){
        document.getElementById('playTable').innerHTML=`<div style="text-align:center;padding:40px 0;"><div style="font-size:1.5rem;font-weight:700;color:#f85149;">${t('bust')}</div><div style="margin-top:16px;display:flex;gap:8px;justify-content:center;"><button class="big-btn" onclick="simRebuy()" style="max-width:140px;">${t('rebuy')}</button><button class="big-btn" onclick="simShowStats()" style="max-width:140px;background:#21262d;">${t('simStats')}</button></div></div>`;
    }
    function simRebuy(){sim.players[sim.userSeat].stack=200;sim.chipHistory.push(200);simNewHand();}

    function simShowStats(){
        const s=sim.stats,user=sim.players[sim.userSeat];
        const profit=user.stack-200;
        const vpip=s.hands>0?Math.round(s.vpipCount/s.hands*100):0;
        const pfr=s.hands>0?Math.round(s.pfrCount/s.hands*100):0;
        const af=s.callCount>0?(s.betRaiseCount/s.callCount).toFixed(1):'-';
        const sd=s.hands>0?Math.round(s.showdownCount/s.hands*100):0;
        const wr=s.hands>0?(profit/s.hands).toFixed(2):'0';
        const graph=simChipGraph();
        document.getElementById('playTable').innerHTML=`<div style="text-align:center;margin-bottom:12px;"><div style="font-size:0.85rem;font-weight:700;color:#7ee787;">${t('sessionSummary')}</div></div><div style="background:#161b22;border-radius:8px;padding:12px;margin-bottom:12px;"><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:0.75rem;"><div><span style="color:#8b949e;">${t('handsPlayed')}:</span> <strong>${s.hands}</strong></div><div><span style="color:#8b949e;">${t('profit')}:</span> <strong style="color:${profit>=0?'#3fb950':'#f85149'}">${profit>=0?'+':''}${Math.round(profit)}</strong></div><div><span style="color:#8b949e;">${t('winRate')}:</span> <strong>${wr}</strong></div><div><span style="color:#8b949e;">${t('vpipLabel')}:</span> <strong>${vpip}%</strong></div><div><span style="color:#8b949e;">${t('pfrLabel')}:</span> <strong>${pfr}%</strong></div><div><span style="color:#8b949e;">${t('afLabel')}:</span> <strong>${af}</strong></div><div><span style="color:#8b949e;">${t('showdownPct')}:</span> <strong>${sd}%</strong></div></div></div><div style="background:#161b22;border-radius:8px;padding:12px;margin-bottom:12px;"><div style="color:#8b949e;font-size:0.7rem;margin-bottom:8px;">${t('chipGraph')}</div>${graph}</div><div style="display:flex;gap:8px;justify-content:center;"><button class="big-btn" onclick="simNextHandCheck()" style="max-width:160px;">${t('nextHand')}</button><button class="big-btn" onclick="simEndSession()" style="max-width:140px;background:#21262d;color:#f85149;">${t('endSession')}</button></div>`;
    }

    function simChipGraph(){
        const data=sim.chipHistory;
        if(data.length<2)return'<div style="color:#484f58;text-align:center;font-size:0.7rem;">-</div>';
        const w=280,h=80,pad=5;
        const min=Math.min(...data)-5,max=Math.max(...data)+5;
        const xStep=(w-pad*2)/(data.length-1),yScale=(h-pad*2)/((max-min)||1);
        const pts=data.map((v,i)=>`${(pad+i*xStep).toFixed(1)},${(h-pad-(v-min)*yScale).toFixed(1)}`);
        const baseline=(h-pad-(200-min)*yScale).toFixed(1);
        const last=pts[pts.length-1].split(',');
        return`<svg width="100%" viewBox="0 0 ${w} ${h}" style="max-width:${w}px;display:block;margin:0 auto;"><line x1="${pad}" y1="${baseline}" x2="${w-pad}" y2="${baseline}" stroke="#30363d" stroke-dasharray="3"/><polyline points="${pts.join(' ')}" fill="none" stroke="#7ee787" stroke-width="1.5"/><circle cx="${last[0]}" cy="${last[1]}" r="3" fill="#7ee787"/></svg>`;
    }

    function simEndSession(){
        const saved=JSON.parse(localStorage.getItem('holdemssam-sessions')||'[]');
        saved.push({date:new Date().toISOString(),hands:sim.stats.hands,profit:sim.players[sim.userSeat].stack-100});
        localStorage.setItem('holdemssam-sessions',JSON.stringify(saved.slice(-50)));
        sim=null;
        document.getElementById('playTable').style.display='none';
        document.getElementById('playSetup').style.display='block';
        simInitSetup();
    }

