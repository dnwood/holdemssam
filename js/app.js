    // ============ NAVIGATION ============
    let currentPage = 'pagePre';
    function switchPage(id) {
        currentPage = id;
        document.querySelectorAll('.page').forEach(p => p.classList.toggle('active', p.id === id));
        document.querySelectorAll('.nav-item').forEach((n, i) => {
            const pages = ['pagePre','pageRank','pageOuts','pageGloss'];
            n.classList.toggle('active', pages[i] === id);
        });
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

    // ============ HAND RANKING QUIZ ============
    let hr = {on:false, ans:false, correct:0, total:0, streak:0, answer:null};
    const RANK_ORDER = {14:'A',13:'K',12:'Q',11:'J',10:'T',9:'9',8:'8',7:'7',6:'6',5:'5',4:'4',3:'3',2:'2'};
    const HAND_TYPES = ['high-card','one-pair','two-pair','three-kind','straight','flush','full-house','four-kind','straight-flush'];
    const HAND_NAMES = {'high-card':'하이카드','one-pair':'원페어','two-pair':'투페어','three-kind':'트리플','straight':'스트레이트','flush':'플러시','full-house':'풀하우스','four-kind':'포카드','straight-flush':'스트레이트 플러시'};

    function hrStart() {
        hr.on=true; hr.correct=0; hr.total=0; hr.streak=0;
        document.getElementById('hrStartBtn').style.display='none';
        document.getElementById('hrBtns').style.display='flex';
        document.getElementById('hrHint').style.display='block';
        hrNext();
    }

    function hrNext() {
        hr.ans=false;
        document.getElementById('hrFeedback').style.display='none';
        document.getElementById('hrBtns').style.display='flex';
        const typeA = Math.floor(Math.random()*9);
        let typeB = Math.floor(Math.random()*9);
        if(Math.random()<0.3) typeB=typeA;

        let answer;
        if(typeA>typeB) answer='a';
        else if(typeB>typeA) answer='b';
        else answer='tie';
        hr.answer = answer;

        const nameA=HAND_NAMES[HAND_TYPES[typeA]], nameB=HAND_NAMES[HAND_TYPES[typeB]];
        const HAND_NAMES_EN = {'high-card':'High Card','one-pair':'One Pair','two-pair':'Two Pair','three-kind':'Three of a Kind','straight':'Straight','flush':'Flush','full-house':'Full House','four-kind':'Four of a Kind','straight-flush':'Straight Flush'};
        const nameAL = LANG==='en' ? HAND_NAMES_EN[HAND_TYPES[typeA]] : nameA;
        const nameBL = LANG==='en' ? HAND_NAMES_EN[HAND_TYPES[typeB]] : nameB;
        const el=document.getElementById('hrCard');
        el.innerHTML=`<div class="situation">${t('hrTitle')}</div><div style="display:flex;justify-content:center;gap:20px;margin-top:12px;"><div style="text-align:center;"><div style="color:#4a9eff;font-weight:700;margin-bottom:4px;">A</div><div style="font-size:1.2rem;font-weight:700;">${nameAL}</div></div><div style="color:#484f58;font-size:1.5rem;align-self:center;">vs</div><div style="text-align:center;"><div style="color:#d2a8ff;font-weight:700;margin-bottom:4px;">B</div><div style="font-size:1.2rem;font-weight:700;">${nameBL}</div></div></div>`;
    }

    function hrAnswer(a) {
        if(hr.ans)return;
        hr.ans=true; hr.total++;
        const ok=a===hr.answer;
        if(ok){hr.correct++;hr.streak++;}else hr.streak=0;
        const labels={a:t('hrA'),b:t('hrB'),tie:t('hrTie')};
        const el=document.getElementById('hrFeedback');
        el.style.display='block';
        el.className='feedback '+(ok?'correct':'wrong');
        el.innerHTML=`<div class="action-text ${ok?'correct':'wrong'}">${ok?t('correct'):t('wrong')}</div><div class="detail-text">${labels[hr.answer]}</div><div class="detail-text" style="margin-top:10px;font-size:0.7rem;text-align:left;line-height:1.8;">${t('hrOrder')}<br>${t('hrRankOrder')}</div><button class="big-btn" onclick="hrNext()" style="max-width:200px;">${t('next')} (N)</button>`;
        document.getElementById('hrBtns').style.display='none';
        document.getElementById('hrScore').textContent=`${hr.correct}/${hr.total}`;
        document.getElementById('hrAcc').textContent=hr.total?Math.round(hr.correct/hr.total*100)+'%':'-';
        document.getElementById('hrStreak').textContent=hr.streak>1?hr.streak+' '+t('streak'):'';
    }

    // ============ OUTS PRACTICE ============
    let outs = {on:false, ans:false, correct:0, total:0, answer:0, draw:'', board:[]};

    const OUTS_SCENARIOS = [
        {draw:'플러시 드로우', drawEn:'Flush Draw', desc:'같은 무늬 4장 (보드3+핸드1). 남은 같은 무늬 = 9장', descEn:'4 cards of same suit (board 3 + hand 1). Remaining same suit = 9', outs:9},
        {draw:'오픈엔드 스트레이트', drawEn:'Open-ended Straight', desc:'양쪽으로 완성 가능한 스트레이트. 양쪽 4장씩 = 8장', descEn:'Straight draw open on both ends. 4 cards each side = 8', outs:8},
        {draw:'거트샷 스트레이트', drawEn:'Gutshot Straight', desc:'가운데 1장 필요한 스트레이트. 4장', descEn:'Inside straight draw needing 1 middle card = 4', outs:4},
        {draw:'투페어 → 풀하우스', drawEn:'Two Pair → Full House', desc:'투페어에서 풀하우스. 남은 4장 중 하나 = 4장', descEn:'Two pair improving to full house = 4', outs:4},
        {draw:'원페어 → 트리플', drawEn:'One Pair → Trips', desc:'원페어에서 셋. 남은 같은 카드 = 2장', descEn:'One pair improving to three of a kind = 2', outs:2},
        {draw:'오버카드 2장', drawEn:'Two Overcards', desc:'보드에 안 맞고 오버카드 2장. 각 3장씩 = 6장', descEn:'Two overcards, 3 each remaining = 6', outs:6},
        {draw:'플러시+오픈엔드', drawEn:'Flush + Open-ended', desc:'플러시 드로우 + 오픈엔드. 9+6(겹치는 2장 제외) = 15장', descEn:'Flush draw + open-ended. 9+6 (minus 2 overlap) = 15', outs:15},
        {draw:'플러시+거트샷', drawEn:'Flush + Gutshot', desc:'플러시 드로우 + 거트샷. 9+3(겹치는 1장 제외) = 12장', descEn:'Flush draw + gutshot. 9+3 (minus 1 overlap) = 12', outs:12},
        {draw:'셋 → 풀하우스/포카드', drawEn:'Set → Full House/Quads', desc:'셋에서 풀하우스 또는 포카드. 보드 페어 6장 + 포카드 1장 = 7장', descEn:'Set to full house or quads. Board pair 6 + quad 1 = 7', outs:7},
        {draw:'오버카드 1장', drawEn:'One Overcard', desc:'에이스 하나만 오버카드. 남은 A = 3장', descEn:'One ace as overcard. Remaining aces = 3', outs:3},
    ];

    function outStart() {
        outs.on=true; outs.correct=0; outs.total=0;
        document.getElementById('outStartBtn').style.display='none';
        outNext();
    }

    function outNext() {
        outs.ans=false;
        document.getElementById('outFeedback').style.display='none';
        document.getElementById('outInput').style.display='block';
        document.getElementById('outsNum').value='';

        const scenario = OUTS_SCENARIOS[Math.floor(Math.random()*OUTS_SCENARIOS.length)];
        outs.answer = scenario.outs;
        outs.draw = scenario.draw;
        outs.desc = scenario.desc;
        outs.descEn = scenario.descEn;

        const ss = ['♠','♥','♦','♣'];
        const board = [];
        for(let i=0;i<3;i++) board.push({r:RANKS[Math.floor(Math.random()*13)], s:Math.floor(Math.random()*4)});

        const drawName = LANG==='en' ? scenario.drawEn : scenario.draw;
        document.getElementById('outCard').innerHTML=`<div class="situation">${drawName}</div><div class="board-cards">${board.map(c=>`<div class="board-card ${SUITS[c.s].c}">${dr(c.r)}${SUITS[c.s].s}</div>`).join('')}</div><div style="color:#8b949e;font-size:0.8rem;">${t('outsQ')}</div>`;
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
        el.innerHTML=`<div class="action-text ${ok?'correct':'wrong'}">${ok?t('correct'):t('wrong')}</div><div class="detail-text">${outs.answer} ${t('outsAnswer')}</div><div class="detail-text" style="margin-top:8px;color:${ok?'#7ee787':'#f0883e'};">${LANG==='en'?outs.descEn:outs.desc}</div><div class="detail-text" style="margin-top:6px;">${t('rule24')}: ${t('river')} ${pct2}% · ${t('turnRiver')} ${pct4}%</div><button class="big-btn" onclick="outNext()" style="max-width:200px;">${t('next')} (N)</button>`;
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
        if(currentPage==='pagePre' && pq.on) {
            if(pq.ans){if(e.key==='n'||e.key==='N'||e.key===' ')pqNext();}
            else{if(e.key==='r'||e.key==='R')pqAnswer('raise');if(e.key==='c'||e.key==='C')pqAnswer('call');if(e.key==='f'||e.key==='F')pqAnswer('fold');}
        }
        if(currentPage==='pageRank' && hr.on) {
            if(hr.ans){if(e.key==='n'||e.key==='N'||e.key===' ')hrNext();}
            else{if(e.key==='a'||e.key==='A')hrAnswer('a');if(e.key==='t'||e.key==='T')hrAnswer('tie');if(e.key==='b'||e.key==='B')hrAnswer('b');}
        }
        if(currentPage==='pageOuts' && outs.on && outs.ans) {
            if(e.key==='n'||e.key==='N'||e.key===' ')outNext();
        }
    });

