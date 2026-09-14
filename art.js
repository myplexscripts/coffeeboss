'use strict';

const CB_ART = {
  ink:'#11110f', cream:'#fff4dc', paper:'#f6e8c8', green:'#1f5b45', green2:'#174735', tan:'#d99a5f', brown:'#6f4027', pink:'#f39ab5', sky:'#97d5ef', gold:'#f0bb62', red:'#d96d68', lilac:'#b99ad9', mint:'#75b88a'
};

function cbMouth(type,x,y){
  if(type==='grin') return `<path d="M${x-16} ${y} Q${x} ${y+16} ${x+17} ${y}" fill="#fff" stroke="${CB_ART.ink}" stroke-width="5" stroke-linecap="round"/><path d="M${x-12} ${y+4} Q${x} ${y+10} ${x+12} ${y+4}" fill="none" stroke="#e97995" stroke-width="4" stroke-linecap="round"/>`;
  if(type==='laugh') return `<path d="M${x-15} ${y-1} Q${x} ${y+23} ${x+16} ${y-1} Q${x} ${y+6} ${x-15} ${y-1}Z" fill="${CB_ART.ink}"/><path d="M${x-8} ${y+10} Q${x} ${y+15} ${x+9} ${y+10}" fill="none" stroke="#ee7f99" stroke-width="5" stroke-linecap="round"/>`;
  if(type==='soft') return `<path d="M${x-11} ${y+2} Q${x} ${y+10} ${x+12} ${y+1}" fill="none" stroke="${CB_ART.ink}" stroke-width="5" stroke-linecap="round"/>`;
  if(type==='smirk') return `<path d="M${x-10} ${y+4} Q${x+2} ${y+9} ${x+13} ${y}" fill="none" stroke="${CB_ART.ink}" stroke-width="5" stroke-linecap="round"/>`;
  if(type==='o') return `<ellipse cx="${x}" cy="${y+4}" rx="8" ry="10" fill="none" stroke="${CB_ART.ink}" stroke-width="5"/>`;
  return `<path d="M${x-8} ${y+4} Q${x} ${y+8} ${x+8} ${y+4}" fill="none" stroke="${CB_ART.ink}" stroke-width="5" stroke-linecap="round"/>`;
}

function cbFace({x,y,skin='#a85f43',hair='#3d241b',shirt=CB_ART.cream,expr='soft',eyes='dots',scale=1,glasses=false,headband=false}){
  const s=scale;
  const eyeY=y-4*s;
  let eyesSvg='';
  if(eyes==='wink') eyesSvg=`<circle cx="${x-13*s}" cy="${eyeY}" r="3.8" fill="${CB_ART.ink}"/><path d="M${x+7*s} ${eyeY} q7 -5 13 1" fill="none" stroke="${CB_ART.ink}" stroke-width="4" stroke-linecap="round"/>`;
  else if(eyes==='closed') eyesSvg=`<path d="M${x-20*s} ${eyeY} q7 -5 14 0M${x+6*s} ${eyeY} q7 -5 14 0" fill="none" stroke="${CB_ART.ink}" stroke-width="4" stroke-linecap="round"/>`;
  else eyesSvg=`<circle cx="${x-13*s}" cy="${eyeY}" r="3.8" fill="${CB_ART.ink}"/><circle cx="${x+13*s}" cy="${eyeY}" r="3.8" fill="${CB_ART.ink}"/>`;
  const mouth=cbMouth(expr,x,y+16*s);
  return `<g class="cb-person">
    <path d="M${x-46*s} ${y+78*s} Q${x} ${y+50*s} ${x+46*s} ${y+78*s} L${x+52*s} ${y+116*s} L${x-52*s} ${y+116*s}Z" fill="${shirt}" stroke="${CB_ART.ink}" stroke-width="5" stroke-linejoin="round"/>
    <path d="M${x-31*s} ${y+67*s} L${x-24*s} ${y+116*s} M${x+31*s} ${y+67*s} L${x+24*s} ${y+116*s}" stroke="${CB_ART.green2}" stroke-width="11" stroke-linecap="round"/>
    <path d="M${x-31*s} ${y+116*s} V${y+82*s} H${x+31*s} V${y+116*s}" fill="${CB_ART.green}" stroke="${CB_ART.ink}" stroke-width="5"/>
    <ellipse cx="${x}" cy="${y}" rx="41" ry="45" fill="${skin}" stroke="${CB_ART.ink}" stroke-width="5"/>
    <path d="M${x-39*s} ${y-16*s} Q${x-23*s} ${y-49*s} ${x+5*s} ${y-42*s} Q${x+33*s} ${y-47*s} ${x+42*s} ${y-15*s} Q${x+18*s} ${y-31*s} ${x-6*s} ${y-27*s} Q${x-23*s} ${y-22*s} ${x-39*s} ${y-16*s}Z" fill="${hair}" stroke="${CB_ART.ink}" stroke-width="5" stroke-linejoin="round"/>
    ${headband?`<path d="M${x-34*s} ${y-25*s} Q${x} ${y-42*s} ${x+34*s} ${y-25*s}" fill="none" stroke="${CB_ART.green}" stroke-width="7"/><path d="M${x+25*s} ${y-35*s} q14 -12 22 3 q-14 8 -22 -3Z M${x+22*s} ${y-37*s} q3 -17 17 -16 q-1 15 -17 16Z" fill="${CB_ART.mint}" stroke="${CB_ART.ink}" stroke-width="4"/>`:''}
    ${eyesSvg}
    ${glasses?`<circle cx="${x-14*s}" cy="${eyeY}" r="12" fill="none" stroke="${CB_ART.ink}" stroke-width="4"/><circle cx="${x+14*s}" cy="${eyeY}" r="12" fill="none" stroke="${CB_ART.ink}" stroke-width="4"/><path d="M${x-2*s} ${eyeY}h4" stroke="${CB_ART.ink}" stroke-width="4"/>`:''}
    <path d="M${x} ${y+2*s} q6 5 -1 10" fill="none" stroke="${CB_ART.ink}" stroke-width="4" stroke-linecap="round"/>
    ${mouth}
  </g>`;
}

function cbCup(x,y,scale=1,hot=true){ return `<g><path d="M${x} ${y}h${36*scale}l${-3*scale} ${40*scale}h${-30*scale}Z" fill="${CB_ART.cream}" stroke="${CB_ART.ink}" stroke-width="4"/><path d="M${x+4*scale} ${y+10*scale}h${28*scale}v${12*scale}h${-28*scale}z" fill="${CB_ART.tan}"/><path d="M${x-2*scale} ${y}h${40*scale}" stroke="${CB_ART.ink}" stroke-width="6" stroke-linecap="round"/>${hot?`<path d="M${x+10*scale} ${y-8*scale}q-5 -8 2 -14M${x+23*scale} ${y-8*scale}q-5 -8 2 -14" fill="none" stroke="${CB_ART.paper}" stroke-width="3" stroke-linecap="round"/>`:''}</g>`; }

function cbPlant(x,y,s=1){return `<g><rect x="${x-18*s}" y="${y}" width="${36*s}" height="${26*s}" rx="7" fill="${CB_ART.cream}" stroke="${CB_ART.ink}" stroke-width="4"/><path d="M${x} ${y}q-5 -35 -27 -31q5 27 27 31q8 -35 30 -30q-4 26 -30 30q-1 -27 1 -45q16 10 14 31" fill="${CB_ART.mint}" stroke="${CB_ART.ink}" stroke-width="4" stroke-linejoin="round"/></g>`;}

function cbMachine(x,y,s=1){return `<g><rect x="${x}" y="${y}" width="${180*s}" height="${90*s}" rx="14" fill="${CB_ART.green2}" stroke="${CB_ART.ink}" stroke-width="5"/><rect x="${x+18*s}" y="${y+16*s}" width="${144*s}" height="${28*s}" rx="8" fill="${CB_ART.cream}" stroke="${CB_ART.ink}" stroke-width="4"/><circle cx="${x+48*s}" cy="${y+30*s}" r="7" fill="${CB_ART.tan}" stroke="${CB_ART.ink}" stroke-width="3"/><circle cx="${x+90*s}" cy="${y+30*s}" r="7" fill="${CB_ART.tan}" stroke="${CB_ART.ink}" stroke-width="3"/><circle cx="${x+132*s}" cy="${y+30*s}" r="7" fill="${CB_ART.tan}" stroke="${CB_ART.ink}" stroke-width="3"/><path d="M${x+55*s} ${y+54*s}v${30*s}m${70*s} -30v${30*s}" stroke="${CB_ART.ink}" stroke-width="6" stroke-linecap="round"/><path d="M${x+45*s} ${y+58*s}h${-24*s}M${x+115*s} ${y+58*s}h${24*s}" stroke="${CB_ART.ink}" stroke-width="7" stroke-linecap="round"/></g>`;}

function cbShelf(x,y,w=250){return `<g><rect x="${x}" y="${y}" width="${w}" height="12" rx="6" fill="${CB_ART.tan}" stroke="${CB_ART.ink}" stroke-width="4"/>${cbPlant(x+w-30,y-38,.7)}<rect x="${x+24}" y="${y-40}" width="42" height="40" rx="5" fill="${CB_ART.paper}" stroke="${CB_ART.ink}" stroke-width="4"/><rect x="${x+80}" y="${y-40}" width="42" height="40" rx="5" fill="#c98954" stroke="${CB_ART.ink}" stroke-width="4"/><rect x="${x+137}" y="${y-40}" width="42" height="40" rx="5" fill="${CB_ART.green}" stroke="${CB_ART.ink}" stroke-width="4"/></g>`;}

function cbSceneShell(inner,accent=CB_ART.green){
 return `<div class="scene-art" aria-hidden="true"><svg viewBox="0 0 1000 300" role="img" focusable="false"><rect width="1000" height="300" rx="24" fill="#0e1513"/><rect x="8" y="8" width="984" height="284" rx="20" fill="${accent}" opacity=".22"/>${inner}</svg></div>`;
}

function cbArtHome(){
 const p=cbFace({x:515,y:118,skin:'#9b5a41',hair:CB_ART.pink,expr:'grin',eyes:'wink',scale:1.02});
 return cbSceneShell(`<rect x="26" y="34" width="948" height="220" rx="18" fill="#f4e7ca"/><rect x="690" y="34" width="284" height="220" rx="18" fill="${CB_ART.green2}"/>${cbMachine(70,102,.92)}${cbShelf(680,115,245)}${cbPlant(872,188,.92)}<rect x="35" y="229" width="930" height="24" rx="8" fill="${CB_ART.tan}" stroke="${CB_ART.ink}" stroke-width="5"/>${p}${cbCup(565,125,.9,false)}<rect x="770" y="145" width="160" height="78" rx="16" fill="#f7e7c9" stroke="${CB_ART.ink}" stroke-width="5"/><path d="M793 199q17-39 34 0q18-39 36 0q18-39 36 0" fill="${CB_ART.gold}" stroke="${CB_ART.ink}" stroke-width="4"/>`,CB_ART.green);
}

function cbArtShifts(){
 const lead=cbFace({x:505,y:117,skin:'#9b5a41',hair:CB_ART.pink,expr:'soft',eyes:'dots',scale:.92});
 const c1=cbFace({x:135,y:173,skin:'#7d4736',hair:'#2c201c',expr:'laugh',eyes:'closed',shirt:'#e7c36d',scale:.55});
 const c2=cbFace({x:835,y:173,skin:'#e0a176',hair:'#663721',expr:'o',eyes:'dots',shirt:'#9bc4a6',scale:.55});
 return cbSceneShell(`<rect x="25" y="28" width="950" height="230" rx="18" fill="#f4e7ca"/>${cbMachine(275,125,1.05)}<rect x="30" y="223" width="940" height="27" rx="8" fill="${CB_ART.tan}" stroke="${CB_ART.ink}" stroke-width="5"/>${lead}${c1}${c2}${cbCup(636,164,.62,false)}${cbCup(685,164,.62,false)}${cbCup(734,164,.62,false)}<g>${['cup','croissant','iced'].map((_,i)=>`<rect x="${390+i*90}" y="42" width="66" height="54" rx="10" fill="${CB_ART.cream}" stroke="${CB_ART.ink}" stroke-width="4"/>`).join('')}<path d="M411 72h25v12h-25z" fill="${CB_ART.brown}"/><path d="M492 78q18-28 36 0" fill="${CB_ART.gold}" stroke="${CB_ART.ink}" stroke-width="4"/><path d="M588 60h18l5 24h-28z" fill="#9a6745" stroke="${CB_ART.ink}" stroke-width="4"/></g>`,CB_ART.gold);
}

function cbArtStockroom(){
 return cbSceneShell(`<rect x="24" y="28" width="952" height="230" rx="18" fill="#efe3c9"/><g stroke="${CB_ART.ink}" stroke-width="5"><rect x="72" y="54" width="350" height="160" rx="10" fill="#d59a61"/><rect x="82" y="64" width="330" height="140" rx="6" fill="#f3e5ca"/><path d="M82 112h330M82 158h330"/><rect x="560" y="52" width="300" height="170" rx="10" fill="#d59a61"/><rect x="570" y="62" width="280" height="150" rx="6" fill="#f3e5ca"/><path d="M570 110h280M570 158h280"/></g>${[100,165,230,295].map(x=>`<path d="M${x} 76h42l-4 28h-34z" fill="#c58a55" stroke="${CB_ART.ink}" stroke-width="4"/>`).join('')}${[595,650,705].map(x=>`<rect x="${x}" y="76" width="38" height="26" rx="5" fill="${CB_ART.green}" stroke="${CB_ART.ink}" stroke-width="4"/>`).join('')}<rect x="210" y="176" width="150" height="26" rx="7" fill="${CB_ART.green2}" stroke="${CB_ART.ink}" stroke-width="4"/><rect x="595" y="172" width="82" height="34" rx="6" fill="#c78e59" stroke="${CB_ART.ink}" stroke-width="4"/><rect x="690" y="172" width="82" height="34" rx="6" fill="#c78e59" stroke="${CB_ART.ink}" stroke-width="4"/>${cbPlant(895,175,.9)}<rect x="145" y="214" width="710" height="32" rx="8" fill="${CB_ART.tan}" stroke="${CB_ART.ink}" stroke-width="5"/><path d="M470 215q0-48 42-48q42 0 42 48" fill="${CB_ART.cream}" stroke="${CB_ART.ink}" stroke-width="4"/><circle cx="512" cy="195" r="7" fill="${CB_ART.brown}"/>`,CB_ART.brown);
}

function cbArtCrew(){
 const crew=[
  cbFace({x:170,y:137,skin:'#8d513b',hair:CB_ART.pink,expr:'grin',eyes:'wink',scale:.72}),
  cbFace({x:335,y:137,skin:'#6f4034',hair:'#f4d66f',expr:'laugh',eyes:'dots',shirt:'#ed9db4',scale:.72}),
  cbFace({x:500,y:137,skin:'#cf8e66',hair:'#3a241c',expr:'soft',eyes:'wink',glasses:true,scale:.72}),
  cbFace({x:665,y:137,skin:'#dda06f',hair:'#5f3824',expr:'o',eyes:'dots',shirt:CB_ART.lilac,scale:.72}),
  cbFace({x:830,y:137,skin:'#a6634e',hair:'#1f1c1b',expr:'smirk',eyes:'dots',shirt:'#222',headband:true,scale:.72})
 ].join('');
 return cbSceneShell(`<rect x="25" y="28" width="950" height="230" rx="18" fill="#f5e9cf"/><rect x="25" y="201" width="950" height="57" rx="18" fill="${CB_ART.green2}"/>${cbMachine(55,72,.55)}${cbShelf(730,84,200)}${crew}`,CB_ART.green);
}

function cbArtRivals(){
 const left=cbFace({x:220,y:155,skin:'#9b5a41',hair:CB_ART.pink,expr:'soft',eyes:'wink',scale:.56});
 const right=cbFace({x:785,y:155,skin:'#d59a70',hair:'#5b321f',expr:'smirk',eyes:'dots',shirt:'#3a2f2b',scale:.56});
 return cbSceneShell(`<rect x="20" y="24" width="960" height="236" rx="18" fill="#efb072"/><rect x="20" y="160" width="960" height="100" rx="18" fill="#5d6770"/><rect x="46" y="62" width="340" height="170" rx="10" fill="${CB_ART.green2}" stroke="${CB_ART.ink}" stroke-width="5"/><path d="M46 102h340" stroke="${CB_ART.ink}" stroke-width="5"/><path d="M52 74h330v35H52z" fill="${CB_ART.cream}"/><path d="M52 74l55 35 55-35 55 35 55-35 55 35 55-35" fill="none" stroke="${CB_ART.green}" stroke-width="26"/>${left}<rect x="614" y="62" width="340" height="170" rx="10" fill="#8c4d48" stroke="${CB_ART.ink}" stroke-width="5"/><path d="M614 102h340" stroke="${CB_ART.ink}" stroke-width="5"/><path d="M620 74h328v35H620z" fill="${CB_ART.cream}"/><path d="M620 74l55 35 55-35 55 35 55-35 55 35 53-35" fill="none" stroke="#c56b63" stroke-width="26"/>${right}<circle cx="500" cy="177" r="26" fill="${CB_ART.cream}" stroke="${CB_ART.ink}" stroke-width="5"/><path d="M492 166q18 8 0 22q12-18 24-10q-17 2-24-12z" fill="${CB_ART.brown}"/>`,CB_ART.red);
}

function cbArtLocations(){
 return cbSceneShell(`<rect x="22" y="28" width="956" height="230" rx="18" fill="#bde4f3"/><rect x="22" y="190" width="956" height="68" rx="18" fill="#b9b0a7"/><g stroke="${CB_ART.ink}" stroke-width="5"><rect x="50" y="130" width="150" height="78" rx="9" fill="${CB_ART.cream}"/><circle cx="65" cy="214" r="15" fill="#444"/><rect x="257" y="107" width="170" height="101" rx="9" fill="${CB_ART.paper}"/><rect x="480" y="79" width="205" height="129" rx="9" fill="#f5e5c9"/><rect x="742" y="45" width="205" height="163" rx="9" fill="#f7eddb"/></g><path d="M50 130h150" stroke="${CB_ART.green}" stroke-width="26"/><path d="M257 107h170" stroke="${CB_ART.green}" stroke-width="28"/><path d="M480 79h205" stroke="${CB_ART.green2}" stroke-width="30"/><path d="M742 45h205" stroke="${CB_ART.green2}" stroke-width="32"/>${cbFace({x:124,y:153,skin:'#9b5a41',hair:CB_ART.pink,expr:'grin',eyes:'wink',scale:.36})}${cbFace({x:342,y:135,skin:'#9b5a41',hair:CB_ART.pink,expr:'laugh',eyes:'dots',scale:.36})}<path d="M210 122h34M438 99h34M697 68h34" stroke="${CB_ART.cream}" stroke-width="9" stroke-linecap="round"/><path d="M235 112l12 10-12 10M463 89l12 10-12 10M722 58l12 10-12 10" fill="none" stroke="${CB_ART.cream}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`,CB_ART.sky);
}

function cbArtBreakroom(){
 const a=cbFace({x:300,y:150,skin:'#6f4034',hair:'#f4d66f',expr:'soft',eyes:'dots',shirt:'#ed9db4',scale:.58});
 const b=cbFace({x:500,y:150,skin:'#9b5a41',hair:CB_ART.pink,expr:'laugh',eyes:'closed',scale:.58});
 const c=cbFace({x:700,y:150,skin:'#cf8e66',hair:'#3a241c',expr:'smirk',eyes:'dots',shirt:'#222',scale:.58});
 return cbSceneShell(`<rect x="24" y="28" width="952" height="230" rx="18" fill="#f3e5cb"/><rect x="118" y="118" width="600" height="105" rx="32" fill="${CB_ART.green}" stroke="${CB_ART.ink}" stroke-width="5"/><rect x="736" y="117" width="140" height="110" rx="32" fill="#b96f4c" stroke="${CB_ART.ink}" stroke-width="5"/><ellipse cx="505" cy="228" rx="175" ry="34" fill="${CB_ART.tan}" stroke="${CB_ART.ink}" stroke-width="5"/>${a}${b}${c}${cbPlant(142,197,.8)}<rect x="805" y="55" width="100" height="92" rx="6" fill="${CB_ART.green2}" stroke="${CB_ART.ink}" stroke-width="5"/><path d="M825 70h60M825 92h60M825 114h60" stroke="${CB_ART.ink}" stroke-width="4"/>`,CB_ART.mint);
}

function cbArtChallenges(){
 const lead=cbFace({x:250,y:145,skin:'#9b5a41',hair:CB_ART.pink,expr:'soft',eyes:'dots',scale:.72});
 const j1=cbFace({x:590,y:142,skin:'#cf8e66',hair:'#3a241c',expr:'smirk',eyes:'dots',glasses:true,shirt:'#553f33',scale:.47});
 const j2=cbFace({x:735,y:142,skin:'#e0a176',hair:'#5f3824',expr:'o',eyes:'dots',shirt:CB_ART.lilac,scale:.47});
 const j3=cbFace({x:872,y:142,skin:'#8d513b',hair:'#20201f',expr:'grin',eyes:'wink',shirt:'#233',headband:true,scale:.47});
 return cbSceneShell(`<rect x="24" y="28" width="952" height="230" rx="18" fill="#f4e7ca"/><rect x="520" y="154" width="430" height="70" rx="14" fill="${CB_ART.green2}" stroke="${CB_ART.ink}" stroke-width="5"/>${lead}${j1}${j2}${j3}<g transform="translate(318 150)"><path d="M0 0h55v34q0 28-28 28q-27 0-27-28z" fill="${CB_ART.cream}" stroke="${CB_ART.ink}" stroke-width="5"/><path d="M8 12q18 16 38 0" fill="none" stroke="${CB_ART.brown}" stroke-width="4"/></g><path d="M275 138q18 4 30 22" fill="none" stroke="#d6d9d7" stroke-width="8" stroke-linecap="round"/>`,CB_ART.gold);
}

function cbSceneArt(scene){
 const map={home:cbArtHome,shifts:cbArtShifts,stockroom:cbArtStockroom,crew:cbArtCrew,rivals:cbArtRivals,locations:cbArtLocations,breakroom:cbArtBreakroom,challenges:cbArtChallenges};
 return map[scene]?map[scene]():'';
}
