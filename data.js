'use strict';


const VERSION = 1;
const SAVE_KEY = 'coffeeBossSaveV1';
const ENERGY_REGEN_MS = 60_000;
const DRIVE_REGEN_MS = 90_000;
const MORALE_REGEN_MS = 120_000;
const INCOME_TICK_MS = 60_000;
const formatMoney = n => '$' + Math.max(0, Math.floor(n)).toLocaleString('en-CA');
const clamp = (v,min,max) => Math.max(min,Math.min(max,v));
const pick = arr => arr[Math.floor(Math.random()*arr.length)];
const uid = () => Math.random().toString(36).slice(2,9);
const icon = name => `<i data-lucide="${name}"></i>`;

const districts = [
  { id:'old-market', name:'Old Market', level:1, description:'Your first neighbourhood. Cheap rent, regulars, and plenty to prove.', icon:'store' },
  { id:'downtown', name:'Downtown', level:8, description:'Office towers, lunch rushes, impatient commuters, and bigger money.', icon:'building-2' },
  { id:'university', name:'University', level:16, description:'Late nights, study crowds, seasonal chaos, and relentless volume.', icon:'graduation-cap' },
  { id:'waterfront', name:'Waterfront', level:26, description:'Tourists, premium drinks, weekend surges, and expensive tastes.', icon:'waves' },
  { id:'airport', name:'Airport', level:40, description:'High rent, captive customers, enormous throughput, and no quiet hours.', icon:'plane' }
];

const shifts = [
  { id:'open', district:'old-market', level:1, name:'Serve the Regulars', description:'Pour a few familiar orders and keep the counter moving. A short, repeatable shift.', energy:3, cash:[35,55], xp:5, mastery:8, icon:'coffee', loot:['paper-cups'] },
  { id:'morning', district:'old-market', level:1, name:'Handle the Morning Rush', description:'Keep the line moving without letting drink quality slip.', energy:5, cash:[65,95], xp:8, mastery:10, icon:'sunrise', loot:['oat-milk','syrup-pump'] },
  { id:'delivery', district:'old-market', level:2, name:'Fill a Delivery Order', description:'Box drinks and pastries for a nearby office.', energy:7, cash:[105,145], xp:11, mastery:12, icon:'bike', loot:['delivery-bag'] },
  { id:'train', district:'old-market', level:3, name:'Train a New Barista', description:'Spend time now to make the whole crew stronger later.', energy:9, cash:[135,185], xp:15, mastery:14, icon:'graduation-cap', loot:['training-cards'] },
  { id:'catering', district:'old-market', level:5, name:'Cater a Small Event', description:'Prep urns, pastry trays, cups, milk, and a lot of patience.', energy:12, cash:[220,310], xp:21, mastery:17, icon:'party-popper', loot:['thermal-carafe','event-crate'] },

  { id:'office-rush', district:'downtown', level:8, name:'Crush the Office Rush', description:'Hundreds of people want caffeine at exactly the same time.', energy:14, cash:[330,430], xp:28, mastery:20, icon:'briefcase-business', loot:['batch-brewer','fast-pitcher'] },
  { id:'corporate', district:'downtown', level:10, name:'Fulfil Office Orders', description:'Prepare another round of coffee for your office customers.', energy:18, cash:[470,630], xp:36, mastery:24, icon:'handshake', loot:['client-book'] },
  { id:'launch', district:'downtown', level:12, name:'Serve Seasonal Specials', description:'Mix another batch of the seasonal favourite and keep the orders moving.', energy:20, cash:[580,760], xp:42, mastery:26, icon:'sparkles', loot:['seasonal-syrup'] },

  { id:'study', district:'university', level:16, name:'Survive Study Week', description:'The shop is full from open to close. Nobody plans on leaving.', energy:23, cash:[800,1020], xp:55, mastery:29, icon:'book-open', loot:['cold-brew-tower'] },
  { id:'campus', district:'university', level:19, name:'Deliver Campus Orders', description:'Get the next batch of coffee to departments and campus events.', energy:28, cash:[1100,1450], xp:68, mastery:33, icon:'file-signature', loot:['service-cart'] },

  { id:'weekend', district:'waterfront', level:26, name:'Run the Weekend Surge', description:'Tourists pour in. Every table turns twice as fast.', energy:32, cash:[1750,2200], xp:82, mastery:37, icon:'waves', loot:['premium-grinder'] },
  { id:'private', district:'waterfront', level:31, name:'Host a Private Tasting', description:'Serve rare coffees to people who absolutely notice the details.', energy:38, cash:[2350,3100], xp:97, mastery:41, icon:'wine', loot:['cupping-set','rare-beans'] },

  { id:'gate-rush', district:'airport', level:40, name:'Handle a Gate Rush', description:'A delayed flight empties straight into your line.', energy:45, cash:[3900,4900], xp:120, mastery:45, icon:'plane-takeoff', loot:['rapid-rinser'] },
  { id:'airline', district:'airport', level:46, name:'Serve the Airline Lounge', description:'Handle another round of lounge orders with unforgiving standards.', energy:52, cash:[5600,7200], xp:150, mastery:50, icon:'badge-check', loot:['precision-brewer'] }
];

const locations = [
  { id:'cart', level:1, name:'Coffee Cart', description:'A compact setup that quietly earns while you are away.', cost:450, income:12, icon:'shopping-cart', district:'old-market' },
  { id:'kiosk', level:3, name:'Market Kiosk', description:'Small footprint, strong foot traffic, simple menu.', cost:1250, income:34, icon:'store', district:'old-market' },
  { id:'corner', level:6, name:'Corner Café', description:'A proper neighbourhood café with regulars and seating.', cost:3900, income:96, icon:'coffee', district:'old-market' },
  { id:'tower', level:8, name:'Office Tower Bar', description:'Built for speed and morning volume.', cost:9200, income:210, icon:'building', district:'downtown' },
  { id:'lobby', level:11, name:'Hotel Lobby Café', description:'Higher prices and steady all-day traffic.', cost:18500, income:390, icon:'hotel', district:'downtown' },
  { id:'campus-kiosk', level:16, name:'Campus Kiosk', description:'Cheap drinks, huge volume, very long days.', cost:36000, income:720, icon:'graduation-cap', district:'university' },
  { id:'study-cafe', level:20, name:'Study Café', description:'A large sit-down store that stays busy late.', cost:69000, income:1280, icon:'book-open', district:'university' },
  { id:'boardwalk', level:26, name:'Boardwalk Café', description:'Premium pricing with wild seasonal swings.', cost:135000, income:2300, icon:'waves', district:'waterfront' },
  { id:'roastery', level:32, name:'Micro Roastery', description:'Supply your stores and sell higher-margin beans.', cost:260000, income:4200, icon:'factory', district:'waterfront' },
  { id:'terminal', level:40, name:'Terminal Café', description:'Expensive to run, impossible to ignore.', cost:520000, income:7800, icon:'plane', district:'airport' },
  { id:'lounge', level:48, name:'Lounge Coffee Bar', description:'High-end coffee for premium travellers.', cost:980000, income:14200, icon:'armchair', district:'airport' }
];

const items = [
  { id:'paper-cups', name:'Branded Cup Stack', type:'service', service:1, quality:0, cost:75, icon:'cup-soda', rarity:'Common' },
  { id:'oat-milk', name:'Oat Milk Case', type:'quality', service:0, quality:2, cost:120, icon:'milk', rarity:'Common' },
  { id:'syrup-pump', name:'Fast Syrup Pump', type:'service', service:2, quality:0, cost:150, icon:'pipette', rarity:'Common' },
  { id:'delivery-bag', name:'Insulated Delivery Bag', type:'service', service:3, quality:1, cost:260, icon:'package', rarity:'Common' },
  { id:'training-cards', name:'Training Cards', type:'training', service:1, quality:3, cost:320, icon:'notebook-tabs', rarity:'Uncommon' },
  { id:'thermal-carafe', name:'Thermal Carafe Set', type:'equipment', service:3, quality:3, cost:520, icon:'thermometer', rarity:'Uncommon' },
  { id:'event-crate', name:'Event Service Crate', type:'service', service:4, quality:2, cost:650, icon:'archive', rarity:'Uncommon' },
  { id:'batch-brewer', name:'Commercial Batch Brewer', type:'equipment', service:7, quality:3, cost:1400, icon:'heater', rarity:'Rare' },
  { id:'fast-pitcher', name:'Quick-Pour Pitcher Set', type:'service', service:6, quality:2, cost:1150, icon:'glass-water', rarity:'Rare' },
  { id:'client-book', name:'Corporate Client Book', type:'training', service:3, quality:7, cost:1850, icon:'contact-round', rarity:'Rare' },
  { id:'seasonal-syrup', name:'Seasonal Recipe Kit', type:'quality', service:2, quality:8, cost:2100, icon:'sparkles', rarity:'Rare' },
  { id:'cold-brew-tower', name:'Cold Brew Tower', type:'equipment', service:8, quality:9, cost:5200, icon:'beaker', rarity:'Epic' },
  { id:'service-cart', name:'Campus Service Cart', type:'service', service:11, quality:5, cost:6800, icon:'shopping-basket', rarity:'Epic' },
  { id:'premium-grinder', name:'Premium Flat Burr Grinder', type:'equipment', service:8, quality:15, cost:11500, icon:'settings', rarity:'Epic' },
  { id:'cupping-set', name:'Competition Cupping Set', type:'quality', service:4, quality:16, cost:13800, icon:'circle-dot', rarity:'Epic' },
  { id:'rare-beans', name:'Rare Microlot Beans', type:'quality', service:2, quality:20, cost:18500, icon:'bean', rarity:'Legendary' },
  { id:'rapid-rinser', name:'Rapid Pitcher Rinser', type:'service', service:18, quality:6, cost:25500, icon:'shower-head', rarity:'Legendary' },
  { id:'precision-brewer', name:'Precision Brewer', type:'equipment', service:14, quality:22, cost:42000, icon:'gauge', rarity:'Legendary' }
];

const crewNames = ['Maya','Jordan','Priya','Noah','Avery','Sam','Lena','Chris','Nico','Taylor','Riley','Jules','Morgan','Alex'];
const crewRoles = ['Barista','Shift Lead','Trainer','Coffee Master'];
const rivalNames = ['Roast House','Juniper Coffee','Third Street','North & Oak','Daily Ritual','Common Ground','Early Bird','Steam & Stone','Little Fox','Blackbird Coffee'];

const bosses = [
  { id:'critic', level:4, name:'The Anonymous Critic', description:'A respected reviewer walks in during your busiest hour.', hp:180, service:18, quality:16, reward:650, xp:80, item:'thermal-carafe', icon:'newspaper' },
  { id:'festival', level:10, name:'City Coffee Festival', description:'A packed public tasting puts your shop beside the best in town.', hp:480, service:42, quality:38, reward:2600, xp:190, item:'batch-brewer', icon:'trophy' },
  { id:'chain', level:18, name:'Big Chain Opening', description:'A polished competitor opens two doors down and comes for your regulars.', hp:980, service:68, quality:72, reward:8400, xp:430, item:'cold-brew-tower', icon:'building-2' },
  { id:'championship', level:29, name:'Regional Barista Championship', description:'Your crew gets one shot to prove the shop belongs on the map.', hp:1900, service:110, quality:126, reward:28000, xp:860, item:'premium-grinder', icon:'medal' },
  { id:'contract', level:43, name:'Airport Concession Bid', description:'Win the tender and prove you can operate at an entirely different scale.', hp:3600, service:185, quality:174, reward:95000, xp:1700, item:'precision-brewer', icon:'plane' }
];

const collections = [
  { id:'essentials', name:'Shop Essentials', reward:{cash:1200, skill:1}, items:['paper-cups','oat-milk','syrup-pump','delivery-bag','training-cards'] },
  { id:'service', name:'Service Speed', reward:{cash:4500, skill:2}, items:['thermal-carafe','event-crate','batch-brewer','fast-pitcher','service-cart'] },
  { id:'craft', name:'Coffee Craft', reward:{cash:14000, skill:3}, items:['seasonal-syrup','cold-brew-tower','premium-grinder','cupping-set','rare-beans'] }
];

const defaultState = () => ({
  version:VERSION,
  name:'Coffee Boss',
  level:1,
  xp:0,
  cash:550,
  reserve:0,
  morale:100,
  maxMorale:100,
  energy:28,
  maxEnergy:28,
  drive:8,
  maxDrive:8,
  service:1,
  quality:1,
  skillBalanceVersion:2,
  skillPoints:0,
  bossPoints:0,
  bossStyle:null,
  district:'old-market',
  owned:{ cart:0 },
  inventory:{ 'paper-cups':1 },
  crew:[{id:uid(),name:'Maya',role:'Barista',power:2}],
  shiftMastery:{},
  bossDamage:{},
  defeatedBosses:[],
  rivalsBeaten:0,
  rivalLosses:0,
  collectionsClaimed:[],
  achievements:[],
  feed:[{id:uid(),icon:'coffee',text:'You took over a tiny coffee shop in Old Market.',time:Date.now()}],
  lastUpdate:Date.now(),
  lastEnergyRegen:Date.now(),
  lastDriveRegen:Date.now(),
  lastMoraleRegen:Date.now(),
  lastIncome:Date.now(),
  lifetimeIncome:0,
  jobsCompleted:0,
  itemsFound:0,
  locationsBought:0,
  challengeTokens:3,
  maxChallengeTokens:3,
  lastChallengeToken:Date.now()
});
