    // ============ NAVIGATION ============
    let currentPage = 'pagePre';
    function switchPage(id) {
        currentPage = id;
        document.querySelectorAll('.page').forEach(p => p.classList.toggle('active', p.id === id));
        document.querySelectorAll('.nav-item').forEach((n, i) => {
            const pages = ['pagePre','pageQuiz','pageOuts','pagePlay','pageGloss'];
            n.classList.toggle('active', pages[i] === id);
        });
        if(id === 'pageOuts' && !outs.on) outStart();
    }

    function subTab(page, sub) {
        const panel = document.getElementById('page' + {pre:'Pre',outs:'Outs'}[page]);
        panel.querySelectorAll('.subtab').forEach(t => t.classList.remove('active'));
        panel.querySelectorAll('.subpanel').forEach(p => p.classList.remove('active'));
        event.target.classList.add('active');
        document.getElementById(page + '-' + sub).classList.add('active');
    }

    // ============ SHARED UTILS ============
    function getAction(pos, hand, vs) {
        const r = vs ? VS_RAISE[pos] : OPEN_RANGES[pos];
        if (r.raise.includes(hand)) return {action: vs?'3-BET':'RAISE', cls:'raise'};
        if (r.call.includes(hand)) return {action:'CALL', cls:'call'};
        return {action:'FOLD', cls:'fold'};
    }

    function normalizeHand(raw) {
        if (raw.length < 2 || raw.length > 3) return null;
        const m = {'a':'A','k':'K','q':'Q','j':'J','t':'T','2':'2','3':'3','4':'4','5':'5','6':'6','7':'7','8':'8','9':'9'};
        let r1 = m[raw[0]], r2 = m[raw[1]];
        if (!r1||!r2) return null;
        if (raw.length === 2) return r1===r2 ? r1+r2 : null;
        const s = raw[2];
        if (s!=='s'&&s!=='o') return null;
        const o = 'AKQJT98765432';
        if (o.indexOf(r1)>o.indexOf(r2)) [r1,r2]=[r2,r1];
        return r1+r2+s;
    }

    function handNotation(cards) {
        const o = 'AKQJT98765432';
        let r1=cards[0].r, r2=cards[1].r;
        if (o.indexOf(r1)>o.indexOf(r2)) [r1,r2]=[r2,r1];
        if (r1===r2) return r1+r2;
        return r1+r2+(cards[0].s===cards[1].s?'s':'o');
    }

    function dr(r) { return r==='T'?'10':r; }

    function randCard() {
        return {r: RANKS[Math.floor(Math.random()*13)], s: Math.floor(Math.random()*4)};
    }

    function cardHtml(r, sIdx) {
        const suit = SUITS[sIdx];
        const isRed = suit.c==='red';
        return `<span${isRed?' class="red"':''}>${dr(r)}${suit.s}</span>`;
    }

    function randomHand() {
        const x = Math.random();
        if (x < 0.077) { const r = RANKS[Math.floor(Math.random()*13)]; return r+r; }
        let r1=Math.floor(Math.random()*13), r2=Math.floor(Math.random()*13);
        while(r1===r2) r2=Math.floor(Math.random()*13);
        if(r1>r2) [r1,r2]=[r2,r1];
        return RANKS[r1]+RANKS[r2]+(Math.random()<0.5?'s':'o');
    }

    // ============ PREFLOP CLI ============
    let cliHist = [];
    document.getElementById('cliInput').addEventListener('keydown', e => {
        if (e.key==='Enter') { cliProcess(e.target.value.trim()); e.target.value=''; }
    });

    function cliProcess(raw) {
        if (!raw) return;
        let vs=false, input=raw.toLowerCase();
        if (input.startsWith('v ')) { vs=true; input=input.slice(2).trim(); }
        const parts = input.split(/\s+/);
        if (parts.length!==2) { cliShow(t('cliFmt'),'',''); return; }
        const pos = POS_ALIAS[parts[0]];
        if (!pos) { cliShow(t('cliPosErr'),'',''); return; }
        const hand = normalizeHand(parts[1]);
        if (!hand) { cliShow(t('cliHandErr'),'',''); return; }
        const res = getAction(pos, hand, vs);
        cliShow(res.action, `${pos} · ${hand} · ${vs?'vs Raise':'Open'}`, res.cls);
        cliHist.unshift({cmd:raw, action:res.action, cls:res.cls});
        if (cliHist.length>10) cliHist.pop();
        document.getElementById('cliHistory').innerHTML = cliHist.map(h=>`<div class="history-item"><span class="cmd">${h.cmd}</span><span class="act ${h.cls}">${h.action}</span></div>`).join('');
    }

    function cliShow(action, detail, cls) {
        const el = document.getElementById('cliResult');
        el.className = 'result-box' + (cls?' '+cls:'');
        el.innerHTML = `<div class="action-text ${cls}">${action}</div>${detail?`<div class="detail-text">${detail}</div>`:''}`;
    }

    // ============ PREFLOP GUI ============
    let gui = {pos:null, fac:0, suit:0, cards:[]};

    function guiInit() {
        document.getElementById('guiPos').innerHTML = POSITIONS.map((p,i)=>`<div class="btn" onclick="guiSetPos(${i})">${p}</div>`).join('');
        document.getElementById('guiFacing').innerHTML = [t('open'),t('vsRaise')].map((f,i)=>`<div class="btn${i===0?' active':''}" onclick="guiSetFac(${i})">${f}</div>`).join('');
        guiRenderSuits(); guiRenderGrid(); guiRenderSel();
    }
    function guiSetPos(i) { gui.pos=i; const bs=document.getElementById('guiPos').children; for(let b of bs)b.classList.remove('active'); bs[i].classList.add('active'); guiEval(); }
    function guiSetFac(i) { gui.fac=i; const bs=document.getElementById('guiFacing').children; for(let b of bs)b.classList.remove('active'); bs[i].classList.add('active'); guiEval(); }
    function guiRenderSuits() { document.getElementById('guiSuits').innerHTML = SUITS.map((s,i)=>`<div class="suit-btn${i===gui.suit?' active':''}" style="color:${s.c==='red'?'#f85149':'#e6edf3'}" onclick="gui.suit=${i};guiRenderSuits();guiRenderGrid();">${s.s}</div>`).join(''); }
    function guiRenderGrid() { const s=SUITS[gui.suit]; document.getElementById('guiGrid').innerHTML = RANKS.map(r=>{const sel=gui.cards.some(c=>c.r===r&&c.s===gui.suit); return `<div class="card-cell${s.c==='red'?' red':''}${sel?' selected':''}" onclick="guiPickCard('${r}',${gui.suit})">${dr(r)}${s.s}</div>`;}).join(''); }
    function guiRenderSel() { let h=''; for(let i=0;i<2;i++){if(gui.cards[i]){const c=gui.cards[i],s=SUITS[c.s];h+=`<div class="card-show ${s.c}">${dr(c.r)}${s.s}</div>`;}else h+='<div class="card-show empty">?</div>';} document.getElementById('guiSelected').innerHTML=h; }
    function guiPickCard(r,s) { const idx=gui.cards.findIndex(c=>c.r===r&&c.s===s); if(idx!==-1)gui.cards.splice(idx,1); else if(gui.cards.length<2)gui.cards.push({r,s}); else gui.cards[1]={r,s}; guiRenderGrid();guiRenderSel();guiEval(); }
    function guiEval() { const el=document.getElementById('guiResult'); if(gui.pos===null||gui.cards.length!==2){el.className='result-box';el.innerHTML=`<div style="color:#484f58">${t('selectPosCards')}</div>`;return;} const hand=handNotation(gui.cards),pos=POSITIONS[gui.pos],vs=gui.fac===1,res=getAction(pos,hand,vs); el.className='result-box '+res.cls; el.innerHTML=`<div style="color:#4a9eff;font-size:0.8rem">${hand} · ${pos} · ${vs?t('vsRaise'):t('open')}</div><div class="action-text ${res.cls}">${res.action}</div>`; }
    function guiReset() { gui={pos:null,fac:0,suit:0,cards:[]}; guiInit(); document.getElementById('guiResult').className='result-box'; document.getElementById('guiResult').innerHTML=`<div style="color:#484f58">${t('selectPosCards')}</div>`; }

    // ============ PREFLOP QUIZ ============
    let pq = {on:false, ans:false, correct:0, total:0, streak:0, positions:[...POSITIONS], facing:'both', diff:'all', hand:null, pos:null, vs:false, answer:null};

    function pqInitSettings() {
        document.getElementById('pqPosSet').innerHTML = `<div class="btn active" onclick="pqTogglePos(this,'all')">${t('all')}</div>`+POSITIONS.map(p=>`<div class="btn active" onclick="pqTogglePos(this,'${p}')">${p}</div>`).join('');
        document.getElementById('pqFacSet').innerHTML = [t('both'),t('openOnly'),t('vsOnly')].map((f,i)=>`<div class="btn${i===0?' active':''}" onclick="pqSetFac(this,${i})">${f}</div>`).join('');
        document.getElementById('pqDiffSet').innerHTML = [t('allHands'),t('borderHands')].map((f,i)=>`<div class="btn${i===0?' active':''}" onclick="pqSetDiff(this,${i})">${f}</div>`).join('');
    }
    function pqTogglePos(el,p) { if(p==='all'){const a=el.classList.contains('active');const bs=el.parentElement.children;for(let b of bs){a?b.classList.remove('active'):b.classList.add('active');}pq.positions=a?[]:[...POSITIONS];}else{el.classList.toggle('active');pq.positions=[];const bs=el.parentElement.children;for(let i=1;i<bs.length;i++)if(bs[i].classList.contains('active'))pq.positions.push(POSITIONS[i-1]);bs[0].classList.toggle('active',pq.positions.length===6);}}
    function pqSetFac(el,i) { pq.facing=['both','open','vs'][i]; const bs=el.parentElement.children;for(let b of bs)b.classList.remove('active');el.classList.add('active'); }
    function pqSetDiff(el,i) { pq.diff=['all','border'][i]; const bs=el.parentElement.children;for(let b of bs)b.classList.remove('active');el.classList.add('active'); }

    function pqStart() {
        if(!pq.positions.length){alert(t('selectPos'));return;}
        pq.on=true;pq.correct=0;pq.total=0;pq.streak=0;
        document.getElementById('pqSettings').style.display='none';
        document.getElementById('pqBtns').style.display='flex';
        document.getElementById('pqHint').style.display='block';
        pqNext();
    }

    function pqNext() {
        pq.ans=false;
        document.getElementById('pqFeedback').style.display='none';
        document.getElementById('pqBtns').style.display='flex';
        const pos = pq.positions[Math.floor(Math.random()*pq.positions.length)];
        let vs = pq.facing==='vs'?true:pq.facing==='open'?false:Math.random()<0.35;
        const hand = pq.diff==='border' ? getBorderHand(pos,vs) : randomHand();
        const res = getAction(pos,hand,vs);
        pq.hand=hand; pq.pos=pos; pq.vs=vs; pq.answer=res.cls;

        const ss=['♠','♥','♦','♣'];
        const r1=hand[0],r2=hand[1],suf=hand.length===3?hand[2]:'';
        let dh;
        if(suf==='s'){const si=Math.floor(Math.random()*4);const s=ss[si];const red=si===1||si===2;dh=`<span${red?' class="red"':''}>${dr(r1)}${s}</span> <span${red?' class="red"':''}>${dr(r2)}${s}</span>`;}
        else{const s1=Math.floor(Math.random()*4);let s2=(s1+1+Math.floor(Math.random()*3))%4;dh=`<span${(s1===1||s1===2)?' class="red"':''}>${dr(r1)}${ss[s1]}</span> <span${(s2===1||s2===2)?' class="red"':''}>${dr(r2)}${ss[s2]}</span>`;}

        document.getElementById('pqCard').innerHTML=`<div class="situation">${vs?t('oppRaised'):t('noOneIn')}</div><div class="position">${pos}</div><div class="hand">${dh}</div>`;
    }

    function pqAnswer(a) {
        if(pq.ans) return;
        pq.ans=true; pq.total++;
        const ok = a===pq.answer;
        if(ok){pq.correct++;pq.streak++;}else pq.streak=0;
        const labels={raise:'RAISE',call:'CALL',fold:'FOLD'};
        const reason = getReason(pq.pos,pq.hand,pq.vs,pq.answer);
        const table = buildRangeTable(pq.pos,pq.vs,pq.hand);
        const el=document.getElementById('pqFeedback');
        el.style.display='block';
        el.className='feedback '+(ok?'correct':'wrong');
        el.innerHTML=`<div class="action-text ${ok?'correct':'wrong'}">${ok?t('correct'):t('wrong')}</div><div class="detail-text">${pq.pos} · ${pq.hand} → ${labels[pq.answer]}</div><div class="detail-text" style="margin-top:8px;color:${ok?'#7ee787':'#f0883e'}">${reason}</div>${table}<button class="big-btn" onclick="pqNext()" style="max-width:200px;">${t('next')} (N)</button>`;
        document.getElementById('pqBtns').style.display='none';
        document.getElementById('pqScore').textContent=`${pq.correct}/${pq.total}`;
        document.getElementById('pqAcc').textContent=pq.total?Math.round(pq.correct/pq.total*100)+'%':'-';
        document.getElementById('pqStreak').textContent=pq.streak>1?pq.streak+' '+t('streak'):'';
    }

    function getBorderHand(pos,vs) {
        const ranges=vs?VS_RAISE[pos]:OPEN_RANGES[pos];
        const pool=[...ranges.raise.slice(-3),...ranges.call];
        const folds=[];
        for(let i=0;i<13;i++)for(let j=i;j<13;j++){if(i===j){const h=RANKS[i]+RANKS[j];if(!ranges.raise.includes(h)&&!ranges.call.includes(h))folds.push(h);}else{const hs=RANKS[i]+RANKS[j]+'s',ho=RANKS[i]+RANKS[j]+'o';if(!ranges.raise.includes(hs)&&!ranges.call.includes(hs))folds.push(hs);if(!ranges.raise.includes(ho)&&!ranges.call.includes(ho))folds.push(ho);}}
        pool.push(...folds.slice(0,10));
        return pool[Math.floor(Math.random()*pool.length)];
    }

    function getReason(pos,hand,vs,action) {
        if(LANG==='en') return getReasonEn(pos,hand,vs,action);
        const pn={UTG:'얼리(UTG)',MP:'미들(MP)',CO:'레이트(CO)',BTN:'버튼(BTN)',SB:'스몰블라인드',BB:'빅블라인드'}[pos];
        const isPair=hand.length===2, isSuited=hand.endsWith('s'), r1=hand[0],r2=hand[1];
        const hi='AKQJT', rv={'A':14,'K':13,'Q':12,'J':11,'T':10,'9':9,'8':8,'7':7,'6':6,'5':5,'4':4,'3':3,'2':2};
        const isBway=hi.includes(r1)&&hi.includes(r2), isConn=!isPair&&Math.abs(rv[r1]-rv[r2])===1;
        if(action==='raise'){
            if(vs){if(isPair&&'AKQJ'.includes(r1))return`${hand}는 프리미엄 페어. ${pn}에서 3-벳으로 주도권.`;if(hand.startsWith('AK'))return`AK는 프리미엄. 3-벳으로 팟을 키우거나 폴드시키기.`;return`${hand}는 ${pn}에서 3-벳 가능한 강한 핸드.`;}
            if(isPair&&hi.includes(r1))return`${hand} 프리미엄 페어. ${pn}에서 당연히 레이즈.`;
            if(isPair)return`포켓${r1}${r2}. ${pn}에서 페어 오픈 가능.`;
            if(hand.startsWith('AK'))return`AK는 프리플랍 최강 드로잉 핸드.`;
            if(isBway&&isSuited)return`${r1}${r2}s 브로드웨이 수티드. 탑페어/플러시/스트레이트 모두 가능.`;
            if(isBway)return`${r1}${r2} 브로드웨이. ${pn}에서 오픈 가치 충분.`;
            if(r1==='A'&&isSuited)return`A${r2}s. 넛 플러시 가능성 + 하이카드.`;
            if(isSuited&&isConn)return`${r1}${r2}s 수티드 커넥터. 플러시+스트레이트 양쪽.`;
            return`${hand}는 ${pn}에서 오픈 가능.`;
        }
        if(action==='call'){
            if(vs){if(isPair)return`포켓${r1}${r2}. 셋마이닝 — 맞으면 큰 팟.`;if(r1==='A')return`${hand}. 강하지만 3-벳엔 부족. 콜로 플랍 보기.`;return`${hand}. ${pn}에서 콜은 가능하지만 레이즈하기엔 약함.`;}
            if(isPair)return`포켓${r1}${r2}. ${pn}에서 오픈 레이즈는 경계선. 콜/림프.`;
            if(r1==='A'&&isSuited)return`${hand}. 넛 플러시 가능성 있지만 레이즈하기엔 ${pn}에서 약간 부족.`;
            return`${hand}. ${pn}에서 플레이 가능하지만 레이즈할 핸드는 아님.`;
        }
        if(vs){if(r1==='A'&&!isSuited)return`${hand} 오프수트. A 있지만 키커 약하고 수티드 아님.`;if(isBway&&!isSuited)return`${hand} 오프수트. 상대 레인지에 지배당하기 쉬움.`;return`${hand}. ${pn}에서 상대 레이즈 콜하기엔 약함.`;}
        if(r1==='A'&&!isSuited&&rv[r2]<=9)return`${hand}. A 있지만 키커 약하고 오프수트. 큰 돈 잃기 쉬움.`;
        if(isBway&&!isSuited)return`${hand} 오프수트. ${pn}에서 도미네이트 당하기 쉬움.`;
        return`${hand}. ${pn}에서 수익적이지 않음. 좋은 카드 기다리기.`;
    }

    function getReasonEn(pos,hand,vs,action) {
        const pn={UTG:'early(UTG)',MP:'middle(MP)',CO:'late(CO)',BTN:'button(BTN)',SB:'small blind',BB:'big blind'}[pos];
        const isPair=hand.length===2, isSuited=hand.endsWith('s'), r1=hand[0],r2=hand[1];
        const hi='AKQJT', rv={'A':14,'K':13,'Q':12,'J':11,'T':10,'9':9,'8':8,'7':7,'6':6,'5':5,'4':4,'3':3,'2':2};
        const isBway=hi.includes(r1)&&hi.includes(r2), isConn=!isPair&&Math.abs(rv[r1]-rv[r2])===1;
        if(action==='raise'){
            if(vs){if(isPair&&'AKQJ'.includes(r1))return`${hand} is a premium pair. 3-bet for initiative from ${pn}.`;if(hand.startsWith('AK'))return`AK is premium. 3-bet to build the pot or force a fold.`;return`${hand} is strong enough to 3-bet from ${pn}.`;}
            if(isPair&&hi.includes(r1))return`${hand} premium pair. Clear raise from ${pn}.`;
            if(isPair)return`Pocket ${r1}${r2}. Openable pair from ${pn}.`;
            if(hand.startsWith('AK'))return`AK is the strongest preflop drawing hand.`;
            if(isBway&&isSuited)return`${r1}${r2}s broadway suited. Can make top pair/flush/straight.`;
            if(isBway)return`${r1}${r2} broadway. Good enough to open from ${pn}.`;
            if(r1==='A'&&isSuited)return`A${r2}s. Nut flush potential + high card.`;
            if(isSuited&&isConn)return`${r1}${r2}s suited connector. Flush + straight potential.`;
            return`${hand} is openable from ${pn}.`;
        }
        if(action==='call'){
            if(vs){if(isPair)return`Pocket ${r1}${r2}. Set mining — big pot if you hit.`;if(r1==='A')return`${hand}. Strong but not enough to 3-bet. Call and see a flop.`;return`${hand}. Callable from ${pn} but too weak to raise.`;}
            if(isPair)return`Pocket ${r1}${r2}. Borderline for open-raise from ${pn}.`;
            if(r1==='A'&&isSuited)return`${hand}. Nut flush possible but not strong enough to raise from ${pn}.`;
            return`${hand}. Playable from ${pn} but not a raising hand.`;
        }
        if(vs){if(r1==='A'&&!isSuited)return`${hand} offsuit. Has an ace but weak kicker, not suited.`;if(isBway&&!isSuited)return`${hand} offsuit. Easily dominated by opponent's range.`;return`${hand}. Too weak to call a raise from ${pn}.`;}
        if(r1==='A'&&!isSuited&&rv[r2]<=9)return`${hand}. Ace with weak kicker, offsuit. Easy to lose big.`;
        if(isBway&&!isSuited)return`${hand} offsuit. Easily dominated from ${pn}.`;
        return`${hand}. Not profitable from ${pn}. Wait for better cards.`;
    }

    function buildRangeTable(pos,vs,cur) {
        const ranges=vs?VS_RAISE[pos]:OPEN_RANGES[pos];
        let h='<div style="overflow-x:auto;margin-top:12px;"><table style="border-collapse:collapse;font-size:0.55rem;min-width:260px;width:100%;">';
        h+='<tr><td></td>';for(const r of RANKS)h+=`<td style="text-align:center;padding:1px;color:#8b949e;">${dr(r)}</td>`;h+='</tr>';
        for(let i=0;i<13;i++){h+=`<tr><td style="padding:1px;color:#8b949e;">${dr(RANKS[i])}</td>`;
        for(let j=0;j<13;j++){let hand;if(i===j)hand=RANKS[i]+RANKS[j];else if(j>i)hand=RANKS[i]+RANKS[j]+'s';else hand=RANKS[j]+RANKS[i]+'o';
        let bg='#161b22',c='#484f58';if(ranges.raise.includes(hand)){bg='#1a3d1a';c='#3fb950';}else if(ranges.call.includes(hand)){bg='#2d2000';c='#d29922';}
        const isCur=hand===cur;h+=`<td style="text-align:center;padding:1px 2px;background:${bg};color:${c};${isCur?'border:2px solid #fff;':'border:1px solid #21262d;'}font-weight:${isCur?'800':'400'};border-radius:2px;">${hand}</td>`;}h+='</tr>';}
        h+=`</table></div><div style="margin-top:4px;font-size:0.6rem;color:#8b949e;"><span style="color:#3fb950">■</span>${t('rangeRaise')} <span style="color:#d29922">■</span>${t('rangeCall')} <span style="color:#484f58">■</span>${t('rangeFold')} <span style="border:1px solid #fff;padding:0 2px">□</span>${t('rangeCurrent')}</div>`;
        return h;
    }

    // ============ OUTS PRACTICE ============
    let outs = {on:false, ans:false, correct:0, total:0, answer:0, hand:[], board:[], drawType:'', drawDesc:'', drawDescEn:''};

    function outsGenScenario() {
        const types = ['flush','oesd','gutshot','overcards','pair-trips'];
        const type = types[Math.floor(Math.random()*types.length)];
        let hand=[], board=[], answer=0, drawType='', drawDesc='', drawDescEn='';

        if(type==='flush') {
            const suit = Math.floor(Math.random()*4);
            const otherSuit = (suit+1)%4;
            const ranks = [0,1,2,3,4,5,6,7,8,9,10,11,12].sort(()=>Math.random()-0.5);
            hand = [{rank:ranks[0],suit},{rank:ranks[1],suit}];
            board = [{rank:ranks[2],suit},{rank:ranks[3],suit},{rank:ranks[4],suit:otherSuit}];
            answer = 9;
            drawType = LANG==='en'?'Flush Draw':'플러시 드로우';
            drawDesc = '같은 무늬 4장. 남은 같은 무늬 13-4 = 9장';
            drawDescEn = '4 cards of same suit. Remaining: 13-4 = 9';
        } else if(type==='oesd') {
            const start = 1 + Math.floor(Math.random()*9);
            const seq = [start, start+1, start+2, start+3];
            const suits = [0,1,2,3].sort(()=>Math.random()-0.5);
            hand = [{rank:seq[0],suit:suits[0]},{rank:seq[1],suit:suits[1]}];
            board = [{rank:seq[2],suit:suits[2]},{rank:seq[3],suit:suits[3]},{rank:(seq[0]+7)%13,suit:suits[0]}];
            answer = 8;
            drawType = LANG==='en'?'Open-ended Straight Draw':'오픈엔드 스트레이트 드로우';
            drawDesc = '양쪽으로 완성 가능. 양끝 각 4장 = 8장';
            drawDescEn = 'Open on both ends. 4 cards each side = 8';
        } else if(type==='gutshot') {
            const start = 1 + Math.floor(Math.random()*9);
            const seq = [start, start+1, start+3, start+4];
            const suits = [0,1,2,3].sort(()=>Math.random()-0.5);
            hand = [{rank:seq[0],suit:suits[0]},{rank:seq[1],suit:suits[1]}];
            board = [{rank:seq[2],suit:suits[2]},{rank:seq[3],suit:suits[3]},{rank:(seq[0]+8)%13,suit:suits[0]}];
            answer = 4;
            drawType = LANG==='en'?'Gutshot Straight Draw':'거트샷 스트레이트 드로우';
            drawDesc = '가운데 1장 필요. 4장';
            drawDescEn = 'Need 1 middle card. 4 outs';
        } else if(type==='overcards') {
            hand = [{rank:0,suit:0},{rank:1,suit:1}];
            const lowRanks = [5,6,7,8,9,10,11,12].sort(()=>Math.random()-0.5);
            board = [{rank:lowRanks[0],suit:2},{rank:lowRanks[1],suit:3},{rank:lowRanks[2],suit:0}];
            answer = 6;
            drawType = LANG==='en'?'Two Overcards':'오버카드 2장';
            drawDesc = '내 패(A,K)가 보드보다 높음. 페어가 되려면 A 3장 + K 3장 = 6장';
            drawDescEn = 'Hand (A,K) higher than board. Need to pair: 3 Aces + 3 Kings = 6';
        } else {
            const pairRank = 2 + Math.floor(Math.random()*11);
            hand = [{rank:pairRank,suit:0},{rank:pairRank,suit:1}];
            const others = [0,1,2,3,4,5,6,7,8,9,10,11,12].filter(r=>r!==pairRank).sort(()=>Math.random()-0.5);
            board = [{rank:others[0],suit:2},{rank:others[1],suit:3},{rank:others[2],suit:0}];
            answer = 2;
            drawType = LANG==='en'?'Pair → Three of a Kind':'원페어 → 트리플';
            drawDesc = '포켓페어에서 셋 만들기. 남은 같은 카드 = 2장';
            drawDescEn = 'Pocket pair to set. 2 remaining cards of same rank';
        }
        return {hand, board, answer, drawType, drawDesc, drawDescEn};
    }

    function outStart() {
        outs.on=true; outs.correct=0; outs.total=0;
        outNext();
    }

    function outNext() {
        outs.ans=false;
        document.getElementById('outFeedback').style.display='none';
        document.getElementById('outInput').style.display='block';
        document.getElementById('outsNum').value='';

        const s = outsGenScenario();
        outs.answer = s.answer;
        outs.drawType = s.drawType;
        outs.drawDesc = s.drawDesc;
        outs.drawDescEn = s.drawDescEn;

        const handHtml = s.hand.map(c=>`<div class="board-card ${SUITS[c.suit].c}">${dr(RANKS[c.rank])}${SUITS[c.suit].s}</div>`).join('');
        const boardHtml = s.board.map(c=>`<div class="board-card ${SUITS[c.suit].c}">${dr(RANKS[c.rank])}${SUITS[c.suit].s}</div>`).join('');

        const myHandLabel = LANG==='en'?'My Hand':'내 패';
        const boardLabel = LANG==='en'?'Board':'보드';
        document.getElementById('outCard').innerHTML=`<div class="situation">${s.drawType}</div><div style="margin:10px 0;"><div style="color:var(--text-muted);font-size:0.7rem;margin-bottom:4px;">${myHandLabel}</div><div class="board-cards">${handHtml}</div></div><div style="margin:10px 0;"><div style="color:var(--text-muted);font-size:0.7rem;margin-bottom:4px;">${boardLabel}</div><div class="board-cards">${boardHtml}</div></div><div style="color:var(--text-muted);font-size:0.8rem;margin-top:8px;">${t('outsQ')}</div>`;
        document.getElementById('outsNum').focus();
    }

    function outSubmit() {
        if(outs.ans)return;
        const val = parseInt(document.getElementById('outsNum').value);
        if(isNaN(val)) return;
        outs.ans=true; outs.total++;
        const ok = val===outs.answer;
        if(ok) outs.correct++;
        const el=document.getElementById('outFeedback');
        el.style.display='block';
        el.className='feedback '+(ok?'correct':'wrong');
        const pct2 = outs.answer*2, pct4=outs.answer*4;
        const desc = LANG==='en'?outs.drawDescEn:outs.drawDesc;
        el.innerHTML=`<div class="action-text ${ok?'correct':'wrong'}">${ok?t('correct'):t('wrong')}</div><div class="detail-text">${outs.answer} ${t('outsAnswer')}</div><div class="detail-text" style="margin-top:8px;color:${ok?'var(--accent)':'#f0883e'};">${desc}</div><div class="detail-text" style="margin-top:6px;">${t('rule24')}: ${t('river')} ${pct2}% · ${t('turnRiver')} ${pct4}%</div><button class="big-btn" onclick="outNext()" style="max-width:200px;">${t('next')} (N)</button>`;
        document.getElementById('outInput').style.display='none';
        document.getElementById('outScore').textContent=`${outs.correct}/${outs.total}`;
        document.getElementById('outAcc').textContent=outs.total?Math.round(outs.correct/outs.total*100)+'%':'-';
    }

    // ============ POT ODDS CALC ============
    function calcPotOdds() {
        const pot=parseFloat(document.getElementById('potSize').value)||0;
        const bet=parseFloat(document.getElementById('betSize').value)||0;
        const outsN=parseInt(document.getElementById('outsCount').value)||0;
        if(!pot||!bet){document.getElementById('calcResult').innerHTML='<span style="color:#f85149">' + t('potBetReq') + '</span>';return;}
        const callCost=bet;
        const potOdds=Math.round(callCost/(pot+bet+callCost)*100);
        const equity2=outsN*2;
        const equity4=outsN*4;
        let verdict='';
        if(outsN){
            if(equity2>=potOdds) verdict=`<span style="color:#3fb950">${t('callOkRiver')} (${equity2}% ≥ ${potOdds}%)</span>`;
            else if(equity4>=potOdds) verdict=`<span style="color:#d29922">${t('callOkTurn')} (${equity4}% ≥ ${potOdds}%)</span>`;
            else verdict=`<span style="color:#f85149">${t('foldMath')} (${equity4}% < ${potOdds}%)</span>`;
        }
        document.getElementById('calcResult').innerHTML=`${t('needed')} <strong>${potOdds}%</strong><br><span style="font-size:0.85rem;color:#8b949e;">${t('call')} ${callCost} / ${t('pot')} ${pot+bet+callCost}</span>${outsN?`<br><br>${verdict}`:''} `;
    }

    // ============ GLOSSARY ============
    function getGlossary() { return LANG === 'en' ? GLOSSARY_EN : GLOSSARY; }
    function initGloss() {
        renderGloss(getGlossary());
    }
    function renderGloss(list) {
        document.getElementById('glossList').innerHTML = list.map(t=>`<div class="term-item"><div class="term-name">${t.name}</div><div class="term-desc">${t.desc}</div></div>`).join('');
    }
    function filterGloss() {
        const q = document.getElementById('glossSearch').value.toLowerCase();
        const g = getGlossary();
        renderGloss(q ? g.filter(t=>t.name.toLowerCase().includes(q)||t.desc.toLowerCase().includes(q)) : g);
    }

    // ============ KEYBOARD SHORTCUTS ============
    document.addEventListener('keydown', e => {
        if(e.target.tagName==='INPUT') {
            if(e.target.id==='outsNum' && e.key==='Enter') outSubmit();
            return;
        }
        if((currentPage==='pagePre' || currentPage==='pageQuiz') && pq.on) {
            if(pq.ans){if(e.key==='n'||e.key==='N'||e.key===' ')pqNext();}
            else{if(e.key==='r'||e.key==='R')pqAnswer('raise');if(e.key==='c'||e.key==='C')pqAnswer('call');if(e.key==='f'||e.key==='F')pqAnswer('fold');}
        }
        if(currentPage==='pageOuts' && outs.on && outs.ans) {
            if(e.key==='n'||e.key==='N'||e.key===' ')outNext();
        }
    });

