'use strict';

// Difficulty is authored against the landing mechanic, not the old score roll.
// New content should open with meaningful uncovered green space, while old
// content is deliberately allowed to become easy as the player's crew grows.
const coffeeDifficulty={
  shift:{starter:1.25,levelOne:1.58,base:1.72,linear:.145,curve:.27,min:1.15,max:9},
  rival:{base:1.62,linear:.155,curve:.25,min:1.15,max:9.2},
  event:{base:1.62,linear:.22,quadratic:.045,min:1.15,max:9.2},
  boss:{base:3,linear:.18,curve:.30,min:1.2,max:10}
};

function coffeeDifficultyValues(base,weights,{min=1.15,max=9.2,low=.72,spread=.28}={}){
  return Object.fromEntries(coffeeShiftTraits.map(t=>{
    const weight=weights[t.id]??.5;
    return [t.id,Math.round(clamp(base*(low+spread*weight),min,max)*10)/10];
  }));
}

// Regular serves have a forgiving entry point, never a free win. Later serves
// are fixed milestones, so preparation makes a visible difference at unlock.
coffeeShiftRequirements=function(shift){
  if(shift.requirements)return shift.requirements;
  const weights=coffeeShiftWeight(shift);
  if(shift.id==='open')return Object.fromEntries(coffeeShiftTraits.map(t=>[t.id,coffeeDifficulty.shift.starter]));
  const level=Math.max(1,shift.level||1);
  const base=(level===1?coffeeDifficulty.shift.levelOne:coffeeDifficulty.shift.base)
    +(level-1)*coffeeDifficulty.shift.linear
    +Math.sqrt(level-1)*coffeeDifficulty.shift.curve;
  return coffeeDifficultyValues(base,weights,{min:coffeeDifficulty.shift.min,max:coffeeDifficulty.shift.max,low:.58,spread:.42});
};

// Challenge profiles keep every spoke relevant. A low-weight trait matters
// less, but never collapses to the player's starting value.
coffeeProfile=function(id,name,base,weights,limits={}){
  return {
    id,
    name,
    weights,
    requirements:coffeeDifficultyValues(base,weights,{min:limits.min??1.15,max:limits.max??9.2,low:.72,spread:.28})
  };
};

coffeeRivalProfile=function(r){
  const weights=Object.values(coffeeEventWeights)[r.id%3];
  const n=Math.max(0,r.level-1);
  const base=coffeeDifficulty.rival.base+n*coffeeDifficulty.rival.linear+Math.sqrt(n)*coffeeDifficulty.rival.curve;
  return coffeeProfile(`rival-${r.id}`,r.name,base,weights,{min:coffeeDifficulty.rival.min,max:coffeeDifficulty.rival.max});
};

// Events are the renewable challenge ladder. Early tier jumps are controlled,
// then accelerate later so the current tier keeps asking for real growth.
coffeeEventProfile=function(type){
  const tier=coffeeEventTier(type),n=tier-1;
  const base=coffeeDifficulty.event.base+n*coffeeDifficulty.event.linear+n*n*coffeeDifficulty.event.quadratic;
  return coffeeProfile(`event-${type}`,coffeeEventNames[type],base,coffeeEventWeights[type],{min:coffeeDifficulty.event.min,max:coffeeDifficulty.event.max});
};

coffeeBossProfile=function(b){
  const n=Math.max(0,b.level-1);
  const base=coffeeDifficulty.boss.base+n*coffeeDifficulty.boss.linear+Math.sqrt(n)*coffeeDifficulty.boss.curve;
  return coffeeProfile(`boss-${b.id}`,b.name,base,{
    speed:.75,
    craft:b.quality>=b.service?1:.8,
    service:1,
    teamwork:.9,
    composure:1
  },{min:coffeeDifficulty.boss.min,max:coffeeDifficulty.boss.max});
};

function coffeeChallengeOdds(activity){
  return coffeeTraitCoverage(coffeeShiftRequirements(activity),coffeePlayerTraits(activity)).percent;
}
