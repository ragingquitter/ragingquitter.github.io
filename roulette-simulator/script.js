// ─────────────────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────────────────
const EURO_W=[0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];
const AMER_W=[0,28,9,26,30,11,7,20,32,17,5,22,34,15,3,24,36,13,1,37,27,10,25,29,12,8,19,31,18,6,21,33,16,4,23,35,14,2];
const RED_S=new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
const CHIPS=[
  {v:1,c:'#1565c0',l:'$1'},{v:5,c:'#b71c1c',l:'$5'},{v:25,c:'#1b5e20',l:'$25'},
  {v:100,c:'#6a1b9a',l:'100'},{v:500,c:'#e65100',l:'500'},{v:1000,c:'#880e4f',l:'1K'}
];

const COL1=[1,4,7,10,13,16,19,22,25,28,31,34];
const COL2=[2,5,8,11,14,17,20,23,26,29,32,35];
const COL3=[3,6,9,12,15,18,21,24,27,30,33,36];

function numCol(n){return n===0||n===37?'green':RED_S.has(n)?'red':'black';}

// ─── GAME STATE ───
let G={
  wheel:'european',startAmt:1000,betLimits:false,
  balance:1000,bets:{},lastBets:{},betHist:[],selChip:25,
  spinning:false,wAngle:0,
  st:{spins:0,net:0,wag:0,ret:0,bw:0,bl:0,reds:0,blacks:0,zeros:0,wins:0,bstreak:0,cstreak:0}
};

// ─── PANEL SWITCHING ───
function showPanel(id){
  document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
  document.getElementById('panel-'+id).classList.add('active');
  event.currentTarget.classList.add('active');
}

// ─── SETTINGS ───
let pendingCfg={wheel:'european',startAmt:1000,betLimits:false};
function setCfg(key,val,btn,onId,offId){
  pendingCfg[key]=val;
  document.getElementById(onId).classList.add('on');
  document.getElementById(offId).classList.remove('on');
}
function setAmt(v,btn){
  pendingCfg.startAmt=v;
  document.querySelectorAll('.amt').forEach(b=>b.classList.remove('on'));
  btn.classList.add('on');
}
function applySettings(){
  G.wheel=pendingCfg.wheel;
  G.startAmt=pendingCfg.startAmt;
  G.betLimits=pendingCfg.betLimits;
  resetGame();
  buildTable();
  initStratWheels();
  document.getElementById('wheel-type-lbl').textContent=
    G.wheel==='american'?'American · 38 pockets · 5.26% edge':'European · 37 pockets · 2.70% edge';
  showPanel('play');
  document.querySelectorAll('.tab-btn')[0].classList.add('active');
  document.querySelectorAll('.tab-btn').forEach((b,i)=>{if(i>0)b.classList.remove('active');});
}

// ─── WHEEL DRAWING ───
function wheelArr(){return G.wheel==='american'?AMER_W:EURO_W;}
function stratWArr(){return S.wheel==='american'?AMER_W:EURO_W;}

function drawWheelOn(canvasId,angle,arr){
  const cv=document.getElementById(canvasId);if(!cv)return;
  const ctx=cv.getContext('2d');
  const W=cv.width,cx=W/2,cy=W/2,r=W/2-3,n=arr.length,sl=Math.PI*2/n;
  ctx.clearRect(0,0,W,W);
  for(let i=0;i<n;i++){
    const num=arr[i],s=angle+i*sl-Math.PI/2,e=s+sl;
    const col=numCol(num);
    ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,r,s,e);ctx.closePath();
    ctx.fillStyle=col==='red'?'#c0392b':col==='black'?'#1a1a1a':'#1b5e20';
    ctx.fill();ctx.strokeStyle='rgba(255,255,255,0.18)';ctx.lineWidth=0.7;ctx.stroke();
    const mid=s+sl/2,tx=cx+(r*0.72)*Math.cos(mid),ty=cy+(r*0.72)*Math.sin(mid);
    ctx.save();ctx.translate(tx,ty);ctx.rotate(mid+Math.PI/2);
    ctx.fillStyle='#fff';ctx.font=`bold ${Math.max(6,r*0.085)}px sans-serif`;
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(num===37?'00':num,0,0);ctx.restore();
  }
  ctx.beginPath();ctx.arc(cx,cy,r*0.15,0,Math.PI*2);
  ctx.fillStyle='#08001a';ctx.fill();
  ctx.strokeStyle='#00f0ff';ctx.lineWidth=1.5;ctx.stroke();
  ctx.beginPath();ctx.moveTo(cx,cy-r-1);ctx.lineTo(cx-5,cy-r+12);ctx.lineTo(cx+5,cy-r+12);
  ctx.closePath();ctx.fillStyle='#00f0ff';ctx.fill();
}

drawWheelOn('wheel-canvas',0,EURO_W);

// ─── TABLE BUILDING ───
function buildTable(){
  const isAm=G.wheel==='american';
  // zero col
  const zc=document.getElementById('zero-col');zc.innerHTML='';
  const z0=makeBetCell('z0','0','zero-cell');z0.style.flex='1';zc.appendChild(z0);
  if(isAm){const z00=makeBetCell('z00','00','zero-cell');z00.style.flex='1';zc.appendChild(z00);}
  // number grid rows: top=3,6,9... mid=2,5,8... bot=1,4,7...
  const grid=document.getElementById('num-grid');grid.innerHTML='';
  const rows=[[3,6,9,12,15,18,21,24,27,30,33,36],[2,5,8,11,14,17,20,23,26,29,32,35],[1,4,7,10,13,16,19,22,25,28,31,34]];
  rows.forEach(row=>row.forEach(n=>{
    grid.appendChild(makeBetCell(String(n),n,`num-cell ${RED_S.has(n)?'red-c':'blk-c'}`));
  }));
  // col 2:1
  const cr=document.getElementById('col-row');cr.innerHTML='';
  ['col1','col2','col3'].forEach(k=>cr.appendChild(makeBetCell(k,'2:1','out-cell')));
  // outside
  const or=document.getElementById('outside-rows');or.innerHTML='';
  const r1=document.createElement('div');r1.className='o-row';
  [{k:'d1',l:'1st 12'},{k:'d2',l:'2nd 12'},{k:'d3',l:'3rd 12'}]
    .forEach(b=>r1.appendChild(makeBetCell(b.k,b.l,'out-cell')));
  or.appendChild(r1);
  const r2=document.createElement('div');r2.className='o-row';
  [{k:'low',l:'1–18'},{k:'even',l:'Even'},{k:'red',l:'Red',ex:'red-c'},{k:'black',l:'Black',ex:'blk-c'},{k:'odd',l:'Odd'},{k:'high',l:'19–36'}]
    .forEach(b=>r2.appendChild(makeBetCell(b.k,b.l,'out-cell'+(b.ex?' '+b.ex:''))));
  or.appendChild(r2);
  refreshChips();
}

function makeBetCell(key,label,cls){
  const el=document.createElement('div');
  el.className=cls;el.dataset.key=key;el.textContent=label;
  el.addEventListener('click',()=>placeBet(key));
  el.addEventListener('contextmenu',e=>{e.preventDefault();removeBet(key);});
  return el;
}

// ─── CHIPS ───
function buildChips(){
  const row=document.getElementById('chip-row');row.innerHTML='';
  CHIPS.forEach(ch=>{
    const btn=document.createElement('div');
    btn.className='chip-btn'+(ch.v===G.selChip?' sel':'');
    btn.style.background=ch.c;btn.textContent=ch.l;
    btn.onclick=()=>{G.selChip=ch.v;document.querySelectorAll('.chip-btn').forEach(b=>b.classList.remove('sel'));btn.classList.add('sel');};
    row.appendChild(btn);
  });
}

// ─── PLACING BETS ───
const BL_S=250,BL_O=10000;
function placeBet(key){
  if(G.spinning)return;
  const chip=G.selChip;
  if(G.balance!==Infinity&&chip>G.balance){banner('Not enough balance!','lose');return;}
  if(G.betLimits){
    const isSingle=!isNaN(parseInt(key))||key==='z0'||key==='z00';
    const lim=isSingle?BL_S:BL_O;
    if((G.bets[key]||0)+chip>lim){banner(`Limit: $${lim} on this spot`,'lose');return;}
  }
  G.betHist.push({key,chip});
  G.bets[key]=(G.bets[key]||0)+chip;
  if(G.balance!==Infinity)G.balance-=chip;
  refreshChips();updBet();updBal();
}
function removeBet(key){
  if(G.spinning||!G.bets[key])return;
  if(G.balance!==Infinity)G.balance+=G.bets[key];
  delete G.bets[key];
  G.betHist=G.betHist.filter(h=>h.key!==key);
  refreshChips();updBet();updBal();
}
function doUndo(){
  if(G.spinning||!G.betHist.length)return;
  const last=G.betHist.pop();
  G.bets[last.key]=(G.bets[last.key]||0)-last.chip;
  if(G.bets[last.key]<=0)delete G.bets[last.key];
  if(G.balance!==Infinity)G.balance+=last.chip;
  refreshChips();updBet();updBal();
}
function doClear(){
  if(G.spinning)return;
  const ref=Object.values(G.bets).reduce((a,b)=>a+b,0);
  if(G.balance!==Infinity)G.balance+=ref;
  G.bets={};G.betHist=[];
  refreshChips();updBet();updBal();
}
function doRebet(){
  if(G.spinning)return;doClear();
  if(!Object.keys(G.lastBets).length)return;
  const tot=Object.values(G.lastBets).reduce((a,b)=>a+b,0);
  if(G.balance!==Infinity&&tot>G.balance){banner('Not enough to rebet','lose');return;}
  G.bets={...G.lastBets};
  if(G.balance!==Infinity)G.balance-=tot;
  refreshChips();updBet();updBal();
}
function doDouble(){
  if(G.spinning)return;
  const tot=Object.values(G.bets).reduce((a,b)=>a+b,0);
  if(G.balance!==Infinity&&tot>G.balance){banner('Not enough to double','lose');return;}
  if(G.balance!==Infinity)G.balance-=tot;
  for(const k in G.bets)G.bets[k]*=2;
  refreshChips();updBet();updBal();
}

function refreshChips(){
  document.querySelectorAll('.chip-ind').forEach(c=>c.remove());
  for(const[key,amt]of Object.entries(G.bets)){
    if(!amt)continue;
    const el=document.querySelector(`[data-key="${key}"]`);if(!el)continue;
    const ci=document.createElement('div');ci.className='chip-ind';
    const best=CHIPS.slice().reverse().find(c=>c.v<=amt)||CHIPS[0];
    ci.style.background=best.c;
    ci.textContent=amt>=1000?Math.round(amt/1000)+'K':amt;
    el.appendChild(ci);
  }
}

// ─── SPIN ───
function spin(){
  if(G.spinning)return;
  if(!Object.keys(G.bets).length){banner('Place a bet first!','');return;}
  G.spinning=true;
  document.getElementById('spin-btn').disabled=true;
  G.lastBets={...G.bets};
  const arr=wheelArr();
  const ti=Math.floor(Math.random()*arr.length),result=arr[ti];
  const sl=Math.PI*2/arr.length;
  const end=G.wAngle+Math.PI*2*Math.floor(7+Math.random()*5)+(-ti*sl-sl/2)-(G.wAngle%(Math.PI*2));
  const dur=3200+Math.random()*800,t0=performance.now(),a0=G.wAngle;
  (function anim(now){
    const t=Math.min((now-t0)/dur,1),ease=1-Math.pow(1-t,3);
    G.wAngle=a0+(end-a0)*ease;
    drawWheelOn('wheel-canvas',G.wAngle,arr);
    if(t<1){requestAnimationFrame(anim);}else{G.wAngle=end;drawWheelOn('wheel-canvas',G.wAngle,arr);finishSpin(result);}
  })(performance.now());
}

function calcWin(key,num,amt){
  const col=numCol(num);
  if(key==='z0'&&num===0)return amt*36;
  if(key==='z00'&&num===37)return amt*36;
  if(key===String(num))return amt*36;
  if(key==='red'&&col==='red')return amt*2;
  if(key==='black'&&col==='black')return amt*2;
  if(key==='even'&&num>0&&num!==37&&num%2===0)return amt*2;
  if(key==='odd'&&num%2===1&&num>0&&num!==37)return amt*2;
  if(key==='low'&&num>=1&&num<=18)return amt*2;
  if(key==='high'&&num>=19&&num<=36)return amt*2;
  if(key==='d1'&&num>=1&&num<=12)return amt*3;
  if(key==='d2'&&num>=13&&num<=24)return amt*3;
  if(key==='d3'&&num>=25&&num<=36)return amt*3;
  if(key==='col1'&&COL1.includes(num))return amt*3;
  if(key==='col2'&&COL2.includes(num))return amt*3;
  if(key==='col3'&&COL3.includes(num))return amt*3;
  return 0;
}

function finishSpin(result){
  G.spinning=false;
  document.getElementById('spin-btn').disabled=false;
  const col=numCol(result);
  const br=document.getElementById('ball-result');
  br.textContent=result===37?'00':result;br.className=col;
  const totalBet=Object.values(G.bets).reduce((a,b)=>a+b,0);
  let win=0;
  for(const[k,a]of Object.entries(G.bets))win+=calcWin(k,result,a);
  if(G.balance!==Infinity)G.balance+=win;
  const profit=win-totalBet;
  if(profit>0)banner(`✓ ${result===37?'00':result} — Won $${profit}!`,'win');
  else if(profit===0&&win>0)banner(`${result===37?'00':result} — Push (bet returned)`,'push');
  else banner(`${result===37?'00':result} — Lost $${totalBet}`,'lose');
  // stats
  const st=G.st;
  st.spins++;st.net+=profit;st.wag+=totalBet;st.ret+=win;
  if(profit>st.bw)st.bw=profit;
  if(profit<st.bl)st.bl=profit;
  if(col==='red')st.reds++;else if(col==='black')st.blacks++;else st.zeros++;
  if(profit>0){st.wins++;st.cstreak=Math.max(0,st.cstreak)+1;if(st.cstreak>st.bstreak)st.bstreak=st.cstreak;}
  else st.cstreak=0;
  G.bets={};G.betHist=[];
  refreshChips();updBet();updBal();updStats();addPip(result===37?'00':result,col);
}

function banner(msg,type){
  const b=document.getElementById('result-banner');
  b.textContent=msg;b.className=type;
}
function addPip(n,col){
  const row=document.getElementById('history-row');
  const pip=document.createElement('div');pip.className='h-pip '+col;pip.textContent=n;
  row.appendChild(pip);
  while(row.querySelectorAll('.h-pip').length>30)row.querySelectorAll('.h-pip')[0].remove();
}

// ─── DISPLAY ───
function fmt(v){return v===Infinity?'∞':'$'+v.toLocaleString();}
function updBal(){document.getElementById('bal').textContent=fmt(G.balance);}
function updBet(){document.getElementById('curbet').textContent='$'+Object.values(G.bets).reduce((a,b)=>a+b,0);}
function updStats(){
  const st=G.st;
  document.getElementById('spins').textContent=st.spins;
  const ne=document.getElementById('netpnl');
  ne.textContent=(st.net>=0?'+':'')+fmt(st.net);
  ne.className='val '+(st.net>=0?'up':'dn');
  document.getElementById('s-wag').textContent=fmt(st.wag);
  document.getElementById('s-ret').textContent=fmt(st.ret);
  document.getElementById('s-bw').textContent=st.bw>0?'+$'+st.bw:'$0';
  document.getElementById('s-bl').textContent=st.bl<0?'-$'+Math.abs(st.bl):'$0';
  document.getElementById('s-rb').textContent=st.reds+' / '+st.blacks;
  document.getElementById('s-z').textContent=st.zeros;
  document.getElementById('s-wr').textContent=st.spins>0?(st.wins/st.spins*100).toFixed(1)+'%':'—';
  document.getElementById('s-str').textContent=st.bstreak>0?st.bstreak+' wins':'—';
}
function resetGame(){
  G.balance=G.startAmt===Infinity?Infinity:G.startAmt;
  G.bets={};G.lastBets={};G.betHist=[];G.spinning=false;G.wAngle=0;
  G.st={spins:0,net:0,wag:0,ret:0,bw:0,bl:0,reds:0,blacks:0,zeros:0,wins:0,bstreak:0,cstreak:0};
  document.getElementById('history-row').innerHTML='';
  document.getElementById('ball-result').textContent='—';
  document.getElementById('ball-result').className='';
  banner('Game reset — good luck!','');
  updBal();updBet();updStats();
  drawWheelOn('wheel-canvas',0,wheelArr());
}

// ─────────────────────────────────────────────────────────
// STRATEGY SIMULATOR
// ─────────────────────────────────────────────────────────
const STRAT_INFO={
  martingale:{
    name:'Martingale',
    desc:'<b>Negative progression — doubles after every loss.</b> Start with a base bet. Each loss doubles your next bet. A single win recovers all losses plus one unit of profit, then you reset. Simple and intuitive, but long losing streaks require exponentially large bets and can easily exceed table limits or your bankroll.',
    cfg:[
      {id:'s-base',label:'Base bet ($)',type:'number',def:10},
      {id:'s-bal',label:'Starting balance ($)',type:'number',def:1000},
      {id:'s-field',label:'Bet on',type:'select',opts:['Red','Black','Odd','Even','Low (1-18)','High (19-36)'],def:0},
    ]
  },
  paroli:{
    name:'Paroli (Reverse Martingale)',
    desc:'<b>Positive progression — doubles after every win.</b> After a win you double your bet. After a loss you return to base. Most players set a cap of 3 consecutive doubles, then reset. Your maximum loss per sequence is always just one base bet — this is the key advantage over Martingale.',
    cfg:[
      {id:'s-base',label:'Base bet ($)',type:'number',def:10},
      {id:'s-bal',label:'Starting balance ($)',type:'number',def:1000},
      {id:'s-cap',label:'Win streak cap',type:'number',def:3},
      {id:'s-field',label:'Bet on',type:'select',opts:['Red','Black','Odd','Even','Low (1-18)','High (19-36)'],def:0},
    ]
  },
  dalembert:{
    name:"D'Alembert",
    desc:"<b>Gentle negative progression — +1 unit after loss, −1 unit after win.</b> Named after 18th-century mathematician Jean le Rond d'Alembert. The slowest escalating progression — you won't hit table limits nearly as quickly as Martingale. Recovery from losing runs is slower too, but risk of catastrophic loss is much lower.",
    cfg:[
      {id:'s-base',label:'Base unit ($)',type:'number',def:10},
      {id:'s-bal',label:'Starting balance ($)',type:'number',def:1000},
      {id:'s-field',label:'Bet on',type:'select',opts:['Red','Black','Odd','Even','Low (1-18)','High (19-36)'],def:0},
    ]
  },
  fibonacci:{
    name:'Fibonacci',
    desc:'<b>Negative progression following the Fibonacci sequence.</b> Sequence: 1, 1, 2, 3, 5, 8, 13, 21, 34... Move one step forward after a loss, two steps back after a win. After 7 losses a Martingale player bets 128 units; a Fibonacci player bets just 21. A balanced middle ground between D\'Alembert and Martingale.',
    cfg:[
      {id:'s-base',label:'Base unit ($)',type:'number',def:5},
      {id:'s-bal',label:'Starting balance ($)',type:'number',def:1000},
      {id:'s-field',label:'Bet on',type:'select',opts:['Red','Black','Odd','Even','Low (1-18)','High (19-36)'],def:0},
    ]
  },
  labouchere:{
    name:'Labouchere (Cancellation System)',
    desc:'<b>Custom sequence — bet = first + last number in your list.</b> Win: cross off both numbers. Lose: add the lost amount to the end. When all numbers are crossed off, you\'ve hit your profit target. The sequence determines both your target and how aggressively it escalates. A flat sequence like 2-2-2-2-2 is far less risky than 1-2-3-4-5.',
    cfg:[
      {id:'s-seq',label:'Starting sequence (comma-separated)',type:'text',def:'1,2,3,4,5'},
      {id:'s-bal',label:'Starting balance ($)',type:'number',def:1000},
      {id:'s-field',label:'Bet on',type:'select',opts:['Red','Black','Odd','Even','Low (1-18)','High (19-36)'],def:0},
    ]
  },
  jamesbond:{
    name:'James Bond',
    desc:'<b>Coverage system — bets 200 units across 25 of 37 numbers.</b> Split: 140 on 19–36, 50 on 13–18 (six-line), 10 on 0. Wins on 19–36: +80. Wins on 13–18: +100. Zero hits: +160. Loses everything when 1–12 lands (roughly 1 in 3 spins). A fixed flat-bet approach with high hit frequency.',
    cfg:[
      {id:'s-unit',label:'Unit size ($)',type:'number',def:1},
      {id:'s-bal',label:'Starting balance ($)',type:'number',def:1000},
    ]
  },
};

let S={
  name:'martingale',wheel:'european',
  balance:1000,startBal:1000,round:0,peak:1000,trough:1000,
  // martingale/paroli/dalembert/fibonacci
  base:10,curBet:10,streak:0,cap:3,unit:1,field:'red',
  // fibonacci
  fibSeq:[1,1,2,3,5,8,13,21,34,55,89,144,233],fibIdx:0,
  // labouchere
  seq:[],origSeq:[1,2,3,4,5],
  // auto
  autoTimer:null,wAngle:0
};

function initStratWheels(){
  drawWheelOn('strat-canvas',0,EURO_W);
  document.getElementById('strat-wheel-lbl').textContent=G.wheel==='american'?'American':'European';
}
initStratWheels();

function pickStrat(name,btn){
  S.name=name;
  document.querySelectorAll('.strat-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  const info=STRAT_INFO[name];
  document.getElementById('strat-name').textContent=info.name;
  document.getElementById('strat-desc').innerHTML=info.desc;
  // build config
  const cfg=document.getElementById('strat-config');cfg.innerHTML='';
  info.cfg.forEach(c=>{
    const row=document.createElement('div');row.className='cfg-row';
    const lbl=document.createElement('label');lbl.textContent=c.label;lbl.htmlFor=c.id;
    let inp;
    if(c.type==='select'){
      inp=document.createElement('select');inp.id=c.id;
      c.opts.forEach((o,i)=>{const op=document.createElement('option');op.value=o.toLowerCase().replace(/\s.*/,'');op.textContent=o;if(i===c.def)op.selected=true;inp.appendChild(op);});
    }else{
      inp=document.createElement('input');inp.type=c.type;inp.id=c.id;inp.value=c.def;
      if(c.type==='number'){inp.min=1;}
    }
    row.appendChild(lbl);row.appendChild(inp);cfg.appendChild(row);
  });
  stratReset();
}

function stratGetCfg(){
  const base=parseFloat(document.getElementById('s-base')?.value)||10;
  const bal=parseFloat(document.getElementById('s-bal')?.value)||1000;
  const field=document.getElementById('s-field')?.value||'red';
  const cap=parseInt(document.getElementById('s-cap')?.value)||3;
  const unit=parseFloat(document.getElementById('s-unit')?.value)||1;
  const seqRaw=document.getElementById('s-seq')?.value||'1,2,3,4,5';
  const seq=seqRaw.split(',').map(s=>parseFloat(s.trim())).filter(n=>!isNaN(n)&&n>0);
  return{base,bal,field,cap,unit,seq};
}

function stratReset(){
  if(S.autoTimer){clearInterval(S.autoTimer);S.autoTimer=null;document.getElementById('ss-auto').textContent='⏩ Auto-Run';}
  const cfg=stratGetCfg();
  S.balance=cfg.bal;S.startBal=cfg.bal;S.round=0;S.peak=cfg.bal;S.trough=cfg.bal;
  S.base=cfg.base;S.curBet=cfg.base;S.streak=0;S.cap=cfg.cap;S.unit=cfg.unit;
  S.field=cfg.field;S.fibIdx=0;S.wAngle=0;
  S.origSeq=[...cfg.seq];S.seq=[...cfg.seq];
  document.getElementById('strat-num').textContent='—';
  document.getElementById('strat-num').className='';
  document.getElementById('strat-log').innerHTML='<span style="color:var(--text3)">Ready. Press Spin Once or Auto-Run...</span>';
  updStratDisplay();
  drawWheelOn('strat-canvas',0,G.wheel==='american'?AMER_W:EURO_W);
}

function stratCalcBet(){
  switch(S.name){
    case'martingale':return S.curBet;
    case'paroli':return S.curBet;
    case'dalembert':return Math.max(S.base,S.curBet);
    case'fibonacci':return S.base*S.fibSeq[Math.min(S.fibIdx,S.fibSeq.length-1)];
    case'labouchere':
      if(!S.seq.length)return 0;
      return S.seq.length===1?S.seq[0]:S.seq[0]+S.seq[S.seq.length-1];
    case'jamesbond':return S.unit*200;
  }
  return S.base;
}

function stratCheckWin(result,field){
  const col=numCol(result);
  if(field==='red')return col==='red';
  if(field==='black')return col==='black';
  if(field==='odd')return result>0&&result!==37&&result%2===1;
  if(field==='even')return result>0&&result!==37&&result%2===0;
  if(field==='low')return result>=1&&result<=18;
  if(field==='high')return result>=19&&result<=36;
  return false;
}

function stratUpdate(won,betAmt,profit){
  switch(S.name){
    case'martingale':
      S.curBet=won?S.base:S.curBet*2;break;
    case'paroli':
      if(won){S.streak++;if(S.streak>=S.cap){S.curBet=S.base;S.streak=0;}else S.curBet*=2;}
      else{S.curBet=S.base;S.streak=0;}
      break;
    case'dalembert':
      S.curBet=won?Math.max(S.base,S.curBet-S.base):S.curBet+S.base;break;
    case'fibonacci':
      if(won)S.fibIdx=Math.max(0,S.fibIdx-2);else S.fibIdx++;break;
    case'labouchere':
      if(!S.seq.length)break;
      if(won){S.seq.shift();if(S.seq.length>1)S.seq.pop();}
      else S.seq.push(betAmt);
      break;
  }
}

function stratSpin(){
  if(S.name==='labouchere'&&!S.seq.length){
    stratLog('Sequence complete! Target reached. Reset to play again.','info');return;
  }
  const arr=G.wheel==='american'?AMER_W:EURO_W;
  const ti=Math.floor(Math.random()*arr.length),result=arr[ti];
  const col=numCol(result);
  const betAmt=stratCalcBet();
  if(betAmt>S.balance&&S.name!=='jamesbond'){
    stratLog('Insufficient balance — bankrupt! Reset to restart.','lose');
    if(S.autoTimer){clearInterval(S.autoTimer);S.autoTimer=null;document.getElementById('ss-auto').textContent='⏩ Auto-Run';}
    return;
  }

  // animate wheel briefly
  const _sl=Math.PI*2/arr.length;
  const end=S.wAngle+Math.PI*2*Math.floor(4+Math.random()*3)+(-(ti*_sl)-_sl/2)-(S.wAngle%(Math.PI*2));
  const dur=900,t0=performance.now(),a0=S.wAngle;
  (function anim(now){
    const t=Math.min((now-t0)/dur,1),ease=1-Math.pow(1-t,3);
    S.wAngle=a0+(end-a0)*ease;
    drawWheelOn('strat-canvas',S.wAngle,arr);
    if(t<1)requestAnimationFrame(anim);
    else{
      S.wAngle=end;drawWheelOn('strat-canvas',S.wAngle,arr);
      const sn=document.getElementById('strat-num');
      sn.textContent=result===37?'00':result;sn.className=col;
    }
  })(performance.now());

  let profit=0,won=false;
  S.round++;

  if(S.name==='jamesbond'){
    const u=S.unit;
    S.balance-=u*200;
    if(result>=19&&result<=36){profit=u*80;won=true;}
    else if(result>=13&&result<=18){profit=u*100;won=true;}
    else if(result===0){profit=u*160;won=true;}
    else profit=-(u*200);
    S.balance+=won?u*200+profit:0;
    if(!won)profit=-(u*200);
  }else{
    won=stratCheckWin(result,S.field);
    S.balance-=betAmt;
    if(won){profit=betAmt;S.balance+=betAmt*2;}
    else profit=-betAmt;
    stratUpdate(won,betAmt,profit);
  }

  if(S.balance>S.peak)S.peak=S.balance;
  if(S.balance<S.trough)S.trough=S.balance;
  const netAmt=S.balance-S.startBal;
  const lbl=result===37?'00':result;
  stratLog(`#${S.round} | Bet $${betAmt} on ${S.name==='jamesbond'?'Bond spread':S.field} | ${lbl} (${col}) | ${won?'+$'+Math.abs(profit):'-$'+Math.abs(profit)}`,won?'win':'lose');
  updStratDisplay();
}

function updStratDisplay(){
  document.getElementById('ss-bal').textContent='$'+Math.round(S.balance);
  document.getElementById('ss-rnd').textContent=S.round;
  const net=S.balance-S.startBal;
  const ne=document.getElementById('ss-net');
  ne.textContent=(net>=0?'+':'')+Math.round(net);
  ne.style.color=net>=0?'var(--win)':'var(--lose)';
  const bet=stratCalcBet();
  document.getElementById('ss-bet').textContent=bet?'$'+bet:'$0';
  document.getElementById('ss-peak').textContent='$'+Math.round(S.peak);
  document.getElementById('ss-low').textContent='$'+Math.round(S.trough);
}

function stratLog(msg,type){
  const log=document.getElementById('strat-log');
  const line=document.createElement('div');
  line.className='l-'+type;line.textContent=msg;
  log.appendChild(line);log.scrollTop=log.scrollHeight;
  // keep last 200 lines
  while(log.children.length>200)log.removeChild(log.firstChild);
}

function toggleAuto(){
  if(S.autoTimer){
    clearInterval(S.autoTimer);S.autoTimer=null;
    document.getElementById('ss-auto').textContent='⏩ Auto-Run';
  }else{
    document.getElementById('ss-auto').textContent='⏹ Stop';
    S.autoTimer=setInterval(()=>{
      stratSpin();
      // auto-stop if bankrupt or lab complete
      if(S.balance<=0||(S.name==='labouchere'&&!S.seq.length)){
        clearInterval(S.autoTimer);S.autoTimer=null;
        document.getElementById('ss-auto').textContent='⏩ Auto-Run';
      }
    },600);
  }
}

// ─────────────────────────────────────────────────────────
// BULK SIMULATION
// ─────────────────────────────────────────────────────────
let bulkChartData = []; // array of run arrays: [[bal0,bal1,...], ...]
const CHART_COLORS = ['#9b59b6','#2ecc71','#e74c3c','#3498db','#f39c12','#1abc9c','#e67e22','#e91e63','#00bcd4','#8bc34a'];

function setBulkPreset(spins, runs){
  document.getElementById('bulk-count').value = spins;
  document.getElementById('bulk-runs').value = runs;
}

function clearBulkChart(){
  bulkChartData = [];
  drawBulkChart();
  document.getElementById('bulk-summary').style.display = 'none';
  document.getElementById('bulk-progress').textContent = '';
}

// Run a single spin with no animation, returns {won, profit, result}
function stratSpinSilent(){
  const arr = G.wheel === 'american' ? AMER_W : EURO_W;
  const ti = Math.floor(Math.random() * arr.length);
  const result = arr[ti];
  const col = numCol(result);
  const betAmt = stratCalcBet();

  let profit = 0, won = false;
  S.round++;

  if(S.name === 'jamesbond'){
    const u = S.unit;
    S.balance -= u * 200;
    if(result >= 19 && result <= 36){ profit = u*80; won = true; }
    else if(result >= 13 && result <= 18){ profit = u*100; won = true; }
    else if(result === 0){ profit = u*160; won = true; }
    else profit = -(u*200);
    S.balance += won ? u*200 + profit : 0;
    if(!won) profit = -(u*200);
  } else {
    won = stratCheckWin(result, S.field);
    S.balance -= betAmt;
    if(won){ profit = betAmt; S.balance += betAmt * 2; }
    else profit = -betAmt;
    stratUpdate(won, betAmt, profit);
  }

  if(S.balance > S.peak) S.peak = S.balance;
  if(S.balance < S.trough) S.trough = S.balance;

  return { won, profit, result: result===37?'00':result, col, betAmt };
}

function runBulk(){
  const totalSpins = Math.min(parseInt(document.getElementById('bulk-count').value)||200, 100000);
  const totalRuns  = Math.min(parseInt(document.getElementById('bulk-runs').value)||1, 20);

  if(S.autoTimer){ clearInterval(S.autoTimer); S.autoTimer=null; document.getElementById('ss-auto').textContent='⏩ Auto-Run'; }

  const btn = document.getElementById('bulk-btn');
  btn.disabled = true;
  btn.textContent = '⏳ Running...';

  // We process in async chunks so the UI doesn't freeze
  let runsDone = 0;
  const allRunStats = [];

  function doRun(){
    if(runsDone >= totalRuns){
      finishBulk(allRunStats, totalSpins);
      btn.disabled = false;
      btn.textContent = '⚡ Run Bulk';
      return;
    }
    // Reset strategy state for this run (keep config)
    const cfg = stratGetCfg();
    S.balance = cfg.bal; S.startBal = cfg.bal; S.round = 0; S.peak = cfg.bal; S.trough = cfg.bal;
    S.base = cfg.base; S.curBet = cfg.base; S.streak = 0; S.cap = cfg.cap; S.unit = cfg.unit;
    S.field = cfg.field; S.fibIdx = 0;
    S.origSeq = [...cfg.seq]; S.seq = [...cfg.seq];

    const balCurve = [S.balance];
    let wins=0, bankrupt=false, labDone=false;

    // Process in batches of 2000 to stay responsive
    let spin = 0;
    function batch(){
      const end = Math.min(spin + 2000, totalSpins);
      while(spin < end){
        if(S.name==='labouchere' && !S.seq.length){ labDone=true; break; }
        const betAmt = stratCalcBet();
        if(betAmt > S.balance && S.name!=='jamesbond'){ bankrupt=true; break; }
        const r = stratSpinSilent();
        if(r.won) wins++;
        balCurve.push(Math.round(S.balance));
        spin++;
      }

      const pct = Math.round(((runsDone + spin/totalSpins)/totalRuns)*100);
      document.getElementById('bulk-progress').textContent =
        `Run ${runsDone+1}/${totalRuns} · spin ${spin}/${totalSpins} · ${pct}%`;

      if(spin < totalSpins && !bankrupt && !labDone){
        setTimeout(batch, 0); // yield to browser
      } else {
        allRunStats.push({
          balCurve, startBal: cfg.bal, endBal: S.balance,
          peak: S.peak, trough: S.trough,
          spins: spin, wins, bankrupt, labDone
        });
        bulkChartData.push(balCurve);
        drawBulkChart();
        runsDone++;
        // Update live display with final state of last run
        updStratDisplay();
        setTimeout(doRun, 0);
      }
    }
    batch();
  }

  doRun();
}

function finishBulk(allStats, targetSpins){
  document.getElementById('bulk-progress').textContent = `✓ Done — ${allStats.length} run(s) complete`;

  // log summary of last run
  const last = allStats[allStats.length-1];
  const net = last.endBal - last.startBal;
  stratLog(`── Bulk: ${last.spins} spins | Net ${net>=0?'+':''}$${net} | Peak $${last.peak} | Low $${last.trough}${last.bankrupt?' | BANKRUPT':''}`,net>=0?'win':'lose');

  // Show summary cards
  if(allStats.length > 1){
    const nets = allStats.map(r=>r.endBal-r.startBal);
    const avgNet = Math.round(nets.reduce((a,b)=>a+b,0)/nets.length);
    const bestNet = Math.max(...nets);
    const worstNet = Math.min(...nets);
    const bankruptCount = allStats.filter(r=>r.bankrupt).length;
    const avgWinRate = (allStats.reduce((a,r)=>a+r.wins/r.spins,0)/allStats.length*100).toFixed(1);

    const sg = document.getElementById('bulk-summary-grid');
    sg.innerHTML = '';
    [
      {l:'Runs',v:allStats.length},
      {l:'Avg Net P&L',v:(avgNet>=0?'+':'')+'$'+avgNet,c:avgNet>=0?'var(--win)':'var(--lose)'},
      {l:'Best Run',v:'+$'+bestNet,c:'var(--win)'},
      {l:'Worst Run',v:(worstNet>=0?'+':'')+'$'+worstNet,c:worstNet>=0?'var(--win)':'var(--lose)'},
      {l:'Bankruptcies',v:bankruptCount,c:bankruptCount>0?'var(--lose)':'var(--win)'},
      {l:'Avg Win Rate',v:avgWinRate+'%'},
    ].forEach(item=>{
      const box = document.createElement('div');
      box.className = 'stat-box';
      box.innerHTML = `<div class="sl">${item.l}</div><div class="sv" style="${item.c?'color:'+item.c:''}">${item.v}</div>`;
      sg.appendChild(box);
    });
    document.getElementById('bulk-summary').style.display = 'block';
  } else {
    const r = allStats[0];
    const net = r.endBal - r.startBal;
    const sg = document.getElementById('bulk-summary-grid');
    sg.innerHTML = '';
    [
      {l:'Spins',v:r.spins},
      {l:'Net P&L',v:(net>=0?'+':'')+'$'+net,c:net>=0?'var(--win)':'var(--lose)'},
      {l:'Win Rate',v:(r.wins/r.spins*100).toFixed(1)+'%'},
      {l:'Peak Balance',v:'$'+r.peak,c:'var(--win)'},
      {l:'Lowest Balance',v:'$'+r.trough,c:'var(--lose)'},
      {l:'Status',v:r.bankrupt?'Bankrupt':r.labDone?'Sequence Done':'Completed',c:r.bankrupt?'var(--lose)':'var(--win)'},
    ].forEach(item=>{
      const box = document.createElement('div');
      box.className = 'stat-box';
      box.innerHTML = `<div class="sl">${item.l}</div><div class="sv" style="${item.c?'color:'+item.c:''}">${item.v}</div>`;
      sg.appendChild(box);
    });
    document.getElementById('bulk-summary').style.display = 'block';
  }
}

function drawBulkChart(){
  const cv = document.getElementById('bulk-chart');
  const ctx = cv.getContext('2d');
  const rect = cv.getBoundingClientRect();
  const targetW = Math.max(1, Math.round(rect.width)) || cv.width;
  const targetH = 200;
  if(cv.width !== targetW) cv.width = targetW;
  if(cv.height !== targetH) cv.height = targetH;
  ctx.setTransform(1,0,0,1,0,0);
  const W = cv.width, H = cv.height;
  ctx.clearRect(0,0,W,H);

  if(!bulkChartData.length){
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.fillRect(0,0,W,H);
    ctx.fillStyle = '#484f58';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Run a bulk simulation to see the balance chart', W/2, H/2);
    return;
  }

  // find global min/max across all runs
  let gMin = Infinity, gMax = -Infinity, gLen = 0;
  bulkChartData.forEach(curve=>{
    curve.forEach(v=>{ if(v<gMin)gMin=v; if(v>gMax)gMax=v; });
    if(curve.length > gLen) gLen = curve.length;
  });
  if(gMin === gMax){ gMin -= 100; gMax += 100; }
  const pad = { l:60, r:16, t:14, b:36 };
  const cW = W - pad.l - pad.r, cH = H - pad.t - pad.b;

  // background
  ctx.fillStyle = 'rgba(8,0,26,0.7)';
  ctx.fillRect(0,0,W,H);

  // grid
  ctx.strokeStyle = 'rgba(255,255,255,0.07)';
  ctx.lineWidth = 1;
  const gridLines = 5;
  for(let i=0;i<=gridLines;i++){
    const y = pad.t + (cH/gridLines)*i;
    ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(pad.l+cW, y); ctx.stroke();
    const val = Math.round(gMax - (gMax-gMin)*(i/gridLines));
    ctx.fillStyle = '#484f58'; ctx.font = '10px sans-serif';
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    ctx.fillText('$'+val.toLocaleString(), pad.l-6, y);
  }

  // x axis labels
  ctx.fillStyle = '#484f58'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for(let i=0;i<=4;i++){
    const x = pad.l + (cW/4)*i;
    const spin = Math.round((gLen-1)*(i/4));
    ctx.fillText(spin, x, pad.t+cH+4);
  }
  ctx.fillText('Spins →', pad.l+cW/2, pad.t+cH+18);

  // start-balance line
  const cfg = stratGetCfg();
  const startY = pad.t + cH - ((cfg.bal - gMin)/(gMax-gMin))*cH;
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.setLineDash([6,4]); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(pad.l, startY); ctx.lineTo(pad.l+cW, startY); ctx.stroke();
  ctx.setLineDash([]);

  // draw each run
  bulkChartData.forEach((curve, ri)=>{
    const col = CHART_COLORS[ri % CHART_COLORS.length];
    ctx.strokeStyle = col;
    ctx.lineWidth = bulkChartData.length > 5 ? 1 : 1.5;
    ctx.globalAlpha = bulkChartData.length > 5 ? 0.6 : 0.85;
    ctx.beginPath();
    curve.forEach((v, i)=>{
      const x = pad.l + (i/(Math.max(curve.length-1,1)))*cW;
      const y = pad.t + cH - ((v - gMin)/(gMax-gMin))*cH;
      i===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
    });
    ctx.stroke();
  });
  ctx.globalAlpha = 1;

  // legend for multi-run
  if(bulkChartData.length > 1 && bulkChartData.length <= 10){
    bulkChartData.forEach((curve, ri)=>{
      const col = CHART_COLORS[ri % CHART_COLORS.length];
      const lx = pad.l + 10 + (ri % 5)*120;
      const ly = pad.t + 6 + Math.floor(ri/5)*14;
      ctx.fillStyle = col; ctx.fillRect(lx, ly, 18, 3);
      ctx.fillStyle = '#8b949e'; ctx.font = '10px sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      const net = curve[curve.length-1] - curve[0];
      ctx.fillText(`Run ${ri+1}: ${net>=0?'+':''}$${net}`, lx+22, ly+1);
    });
  }
}

// ─── CHART CANVAS RESIZE ───
function resizeBulkCanvas(){
  const cv=document.getElementById('bulk-chart');if(!cv)return;
  drawBulkChart();
}
window.addEventListener('resize',()=>{clearTimeout(window._crt);window._crt=setTimeout(resizeBulkCanvas,150);});
setTimeout(resizeBulkCanvas,200);

// ─── INIT ───
buildTable();
buildChips();
pickStrat('martingale',document.querySelector('.strat-btn.active'));
