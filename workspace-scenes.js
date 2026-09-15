'use strict';

// Native vector scenery shares the home shop's wood, brass and sage palette.
// No external assets, character portraits, or game actions live in the artwork.
function workspaceScene(page){
  const rect=(x,y,w,h,fill,rx=0)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}"/>`;
  const line=(x,y,x2,y2,color,width=4)=>`<path d="M${x} ${y}L${x2} ${y2}" stroke="${color}" stroke-width="${width}" fill="none"/>`;
  const circle=(x,y,r,fill)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`;
  const group=(x,y,body,scale=1)=>`<g transform="translate(${x} ${y}) scale(${scale})">${body}</g>`;
  const cup=(x,y,color='#f2e2ba',scale=1)=>group(x,y,`${rect(0,0,32,30,color,5)}<path d="M32 5C53 2 53 26 32 23" fill="none" stroke="${color}" stroke-width="6"/>${rect(-5,32,46,4,'#baac84',2)}`,scale);
  const steam=(x,y)=>`<path class="scene-steam" d="M${x} ${y}q-9 -10 0 -20t0 -20" fill="none" stroke="#fff4d3" stroke-opacity=".6" stroke-width="4" stroke-linecap="round"/>`;
  const plant=(x,y,scale=1)=>group(x,y,`<path d="M29 67Q-12 27 7 9Q47 18 29 67M31 67Q21 1 42 -9Q66 18 31 67M33 68Q42 20 68 28Q74 56 33 68" fill="#4d714e"/>${line(31,76,33,24,'#35583d',5)}<path d="M8 64H55L48 107H16Z" fill="#b9784f"/>`,scale);
  const windowArt=(x,y,w=180,h=150,night=false)=>group(x,y,`${rect(0,0,w,h,'#435a49')}${rect(8,8,w-16,h-16,night?'#354e57':'#d9c58c')}${rect(8,h*.58,w*.25,h*.42-8,night?'#263d42':'#819185')}${rect(w*.32,h*.4,w*.3,h*.6-8,night?'#263d42':'#71897e')}${rect(w*.68,h*.51,w*.32-8,h*.49-8,night?'#263d42':'#8f9c88')}${night?circle(w-32,30,12,'#ecdc9c'):''}${line(w/2,4,w/2,h-4,'#435a49',8)}${line(4,h*.6,w-4,h*.6,'#435a49',7)}`);
  const lamp=(x,y)=>`${line(x,0,x,y,'#465142',5)}<path d="M${x-34} ${y+23}L${x-18} ${y}H${x+18}L${x+34} ${y+23}Z" fill="#b68a4c"/>${rect(x-27,y+23,54,5,'#f2d897',2)}<path d="M${x-25} ${y+28}L${x-100} 260H${x+100}L${x+25} ${y+28}Z" fill="#fae9b4" opacity=".065"/>`;
  const shelf=(x,y,w)=>`${rect(x,y,w,10,'#765638')}${rect(x+12,y+10,8,16,'#51442e')}${rect(x+w-20,y+10,8,16,'#51442e')}`;
  const jar=(x,y,color='#b98d57')=>`${rect(x,y,28,43,color,4)}${rect(x-2,y-4,32,8,'#645a3f',2)}${rect(x+5,y+15,18,14,'#e5d8b4',2)}`;
  const counter=(x,y,w)=>`${rect(x+8,y+14,w,76,'#553e2b')}${rect(x,y,w,78,'#906845')}${Array.from({length:Math.floor(w/55)},(_,i)=>line(x+25+i*55,y+5,x+25+i*55,y+78,'#7f5b3c',2)).join('')}${rect(x-8,y-10,w+16,16,'#e0c799',3)}`;
  const frame=(x,y,w,h,body)=>group(x,y,`${rect(4,6,w,h,'#29362a',2)}${rect(0,0,w,h,'#805d3a',2)}${rect(7,7,w-14,h-14,'#244438')}${body}`);
  const machine=(x,y)=>group(x,y,`${rect(0,0,150,103,'#aebba5',9)}${rect(6,8,138,28,'#385e4c',5)}${[30,60,120].map(a=>circle(a,22,5,'#e4bc72')).join('')}${rect(20,47,110,12,'#526f60',3)}${rect(30,59,7,13,'#314d41')}${rect(107,59,7,13,'#314d41')}${rect(10,93,130,7,'#456051')}${cup(60,68,'#f2e2ba',.7)}${steam(73,67)}`);
  const base=`${rect(0,0,960,360,'#aeb39a')}${[55,110,165].map(y=>line(0,y,960,y,'#a2a98f',2)).join('')}${rect(0,205,960,95,'#365342')}${Array.from({length:21},(_,i)=>line(i*48,211,i*48,300,'#2d483a',3)).join('')}${rect(0,201,960,9,'#788565')}${rect(0,300,960,60,'#88785c')}${[320,348].map(y=>line(0,y,960,y,'#74634c',2)).join('')}${line(0,300,960,300,'#394534',7)}`;
  const building=(x,y,w,h,color,awning=false)=>group(x,y,`${rect(0,0,w,h,color)}${rect(-6,-7,w+12,11,'#43584a')}${rect(14,24,w-28,25,'#294739',2)}${rect(17,72,w*.43,h-84,'#d9c892')}${rect(w*.57,72,w*.3,h-72,'#3a5b4b')}${rect(w*.61,83,w*.22,48,'#99b0a0')}${circle(w*.79,h-34,3,'#d8b26c')}${line(17,115,w*.43+17,115,'#4e6755',5)}${awning?`<path d="M7 57H${w-7}L${w+3} 84H-3Z" fill="#ede0b4"/>${[.1,.3,.5,.7,.9].map(n=>`<path d="M${w*n-9} 57h18l3 27h-24Z" fill="#72886a"/>`).join('')}`:''}`);
  let art='',caption='',label='';
  switch(page){
    case 'shifts':
      label='The espresso bar, with waiting cups, order tickets and a steaming machine';caption='The next batch starts here.';
      art=base+windowArt(55,28,200,158)+lamp(490,42)+shelf(650,98,238)+[675,717,759,823].map(x=>jar(x,55)).join('')+frame(325,42,235,104,`${line(348-325,29,190,29,'#d6d6ac',5)}${[49,66,82].map(y=>line(25,y,165,y,'#91aa8e',3)).join('')}`)+counter(130,257,700)+machine(510,151)+cup(270,211)+cup(326,211)+cup(380,211)+`${rect(164,158,67,88,'#ecdfbd',2)}${[178,190,202,214].map(y=>line(175,y,218,y,'#a09370',3)).join('')}`+plant(851,205,.8);break;
    case 'locations':
    case 'rivals':{
      const night=page==='rivals';label=night?'A neighbouring coffee shop lit up across the street':'A row of coffee shops and a cart along the neighbourhood street';caption=night?'There is good coffee on both sides of the street.':'One little corner of town. Plenty of room to grow.';
      art=rect(0,0,960,360,night?'#344e53':'#d4c697')+circle(780,48,25,night?'#eadba9':'#ede0b5')+rect(0,232,960,128,'#8a8068')+rect(0,293,960,67,'#5b645a')+line(0,325,960,325,'#c0ba8d',3)+building(65,77,220,180,'#a99570',true)+building(342,36,240,221,night?'#6c8572':'#8da187',true)+building(638,96,208,161,'#a97b58')+plant(877,209,.75)+`${rect(175,246,120,44,'#476f53',3)}${rect(170,236,130,12,'#dfc795')}${line(181,192,181,240,'#705237')}${line(288,192,288,240,'#705237')}<path d="M162 195L180 178H290L307 195Z" fill="#e5c17f"/>${circle(191,297,10,'#32483b')}${circle(280,297,10,'#32483b')}${cup(224,215,'#f3deb3',.55)}`;
      break;
    }
    case 'stockroom':
      label='Stockroom shelves filled with coffee bags, jars, pitchers and delivery boxes';caption='A place for every bag, bottle and spare cup.';
      art=base+`${rect(115,25,12,280,'#665438')}${rect(823,25,12,280,'#665438')}`+[109,201,291].map(y=>shelf(104,y,742)).join('')+[145,194,244,410,460,510,681,731,781].map(x=>jar(x,66,x>600?'#b4bca0':'#bd9364')).join('')+[150,244,430,650,740].map(x=>group(x,137,`<path d="M0 0H56L62 57H-6Z" fill="#c3a16d"/>${rect(10,15,35,24,'#e8d9ad')}${circle(27,27,7,'#5c7957')}`)).join('')+`${rect(142,221,167,65,'#b18c59',3)}${rect(210,221,21,65,'#d4ba84')}${rect(348,233,147,53,'#ae8151',3)}${rect(410,233,17,53,'#d8bf8d')}`+cup(583,248,'#ddd8b5')+cup(647,248,'#a8b9a0')+cup(711,248,'#dfc18b');break;
    case 'crew':
      label='The staff room with aprons on hooks, a rota board and mugs ready for the crew';caption='Good coffee takes a good crew.';
      art=base+windowArt(55,38,177,153)+frame(295,32,270,155,`${rect(20,19,230,20,'#d1c698')}${[55,82,109].map(y=>line(22,y,245,y,'#819677',2)).join('')}${[77,132,187].map(x=>line(x,48,x,137,'#819677',2)).join('')}${rect(89,62,28,11,'#d4b670')}${rect(199,88,28,11,'#d4b670')}`)+shelf(623,63,234)+[655,730,805].map((x,i)=>`${circle(x,84,5,'#d9b972')}<path d="M${x-13} 99H${x+13}L${x+17} 120L${x+30} 133V214H${x-30}V133L${x-17} 120Z" fill="${['#54795e','#b89a6e','#7b8b6b'][i]}"/>${rect(x-14,166,28,24,'#ffffff15',3)}`).join('')+counter(185,272,520)+[247,321,395,469,543].map(x=>cup(x,236,'#e9d9b5',.8)).join('')+plant(844,217,.8);break;
    case 'challenges':
      label='A small coffee competition stage with a trophy, judging cups and bunting';caption='A little friendly competition. A moment worth celebrating.';
      art=base+`<path d="M90 25Q480 115 870 25" stroke="#6e6447" stroke-width="3" fill="none"/>`+[150,250,350,450,550,650,750,850].map((x,i)=>`<path d="M${x-17} ${40+30*Math.sin((x/960)*Math.PI)}l17 34 17 -30Z" fill="${i%2?'#cc9b63':'#577c60'}"/>`).join('')+frame(323,96,310,111,`${circle(155,49,27,'#bd9752')}${circle(155,49,20,'#e2c77f')}${line(100,88,210,88,'#c5ceaa',4)}`)+counter(207,281,546)+`${rect(431,247,98,24,'#d3b472',2)}${rect(466,219,28,29,'#d3b472')}<path d="M449 170H511V193Q480 240 449 193Z" fill="#e8c97d"/><path d="M450 177H432Q430 210 462 210M510 177H528Q530 210 498 210" fill="none" stroke="#d5ad61" stroke-width="7"/>`+cup(284,240)+cup(359,240)+cup(595,240)+plant(96,208,.9)+plant(815,208,.9);break;
    case 'reserve':
      label='A quiet back office with a sturdy safe, ledger and desk lamp';caption='A little set aside for a rainy day.';
      art=base+windowArt(92,34,191,151)+`${rect(594,57,206,239,'#354d42',12)}${rect(610,73,174,204,'#526c58',8)}${rect(625,88,145,175,'#415c4b',5)}${circle(699,170,39,'#a1aa86')}${circle(699,170,27,'#49624f')}${[0,120,240].map(a=>`<path d="M699 170h31" transform="rotate(${a} 699 170)" stroke="#d0bb82" stroke-width="8" stroke-linecap="round"/>`).join('')}${rect(747,120,8,45,'#c2bc96',3)}`+counter(136,263,384)+`${rect(262,225,125,26,'#8d7250',3)}${rect(267,225,115,19,'#eee0b8')}${line(324,228,324,243,'#ab9b76',2)}${rect(416,240,53,9,'#bb965d',3)}${line(442,240,442,163,'#b8955b',6)}<path d="M401 164Q442 109 483 164Z" fill="#527157"/>`+cup(188,225)+plant(834,222,.75);break;
    case 'breakroom':
      label='A cosy break room with a sofa, reading lamp, plants and a hot drink';caption='Put the kettle on. The rush can wait.';
      art=base+windowArt(350,25,263,150)+lamp(206,73)+`${rect(200,194,370,85,'#597b5a',20)}${rect(177,226,421,66,'#698665',16)}${rect(178,211,44,77,'#496c4e',14)}${rect(554,211,44,77,'#496c4e',14)}${rect(235,207,110,56,'#bba275',11)}${rect(423,207,105,56,'#8e9b73',11)}${rect(204,289,17,22,'#654e34')}${rect(554,289,17,22,'#654e34')}`+counter(639,263,134)+cup(681,225)+steam(695,220)+plant(804,154,1.3)+frame(85,79,112,86,`<path d="M18 68L43 26L63 48L83 19L95 68Z" fill="#92a47c"/>`);break;
    case 'profile':
      label='The boss’s desk, with a notebook, coffee, certificates and a collection shelf';caption='Your desk. Your plans. Your kind of coffee shop.';
      art=base+windowArt(66,33,199,151)+frame(331,28,130,104,`${rect(16,15,98,74,'#e3d6ae')}${circle(65,46,17,'#b89b5b')}${line(35,77,95,77,'#8f926e',3)}`)+frame(485,45,111,88,`${rect(15,14,81,60,'#dbd1ab')}${line(28,34,82,34,'#889274',3)}${line(28,49,69,49,'#889274',3)}`)+shelf(649,133,220)+[668,711,754,797].map((x,i)=>rect(x,76+i*4,28,57-i*4,['#867957','#4d7057','#bb9768','#98a583'][i],2)).join('')+counter(192,267,578)+`${rect(350,223,153,33,'#766c48',3)}${rect(355,219,143,30,'#ede1be',2)}${line(425,222,425,246,'#b4a888',2)}${line(367,231,410,231,'#b4a888',2)}${line(437,231,482,231,'#b4a888',2)}`+cup(572,228)+steam(587,223)+plant(826,225,.7);break;
    default:return '';
  }
  return `<figure class="workspace-scene"><svg viewBox="0 0 960 360" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${label}" xmlns="http://www.w3.org/2000/svg">${art}</svg><figcaption>${caption}</figcaption></figure>`;
}
