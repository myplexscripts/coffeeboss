'use strict';

const CB_SCENES = new Set([
  'home','shifts','rivals','locations','stockroom','crew','challenges','breakroom','reserve','profile'
]);

const CB_SCENE_LABELS = {
  home:'Shop artwork',
  shifts:'Shift artwork',
  rivals:'Rival artwork',
  locations:'Location artwork',
  stockroom:'Stockroom artwork',
  crew:'Crew artwork',
  challenges:'Challenge artwork',
  breakroom:'Break room artwork',
  reserve:'Reserve artwork',
  profile:'Boss artwork'
};

function cbSceneArt(scene, compact=false){
  if(!CB_SCENES.has(scene)) return '';
  const klass = compact ? 'scene-art scene-placeholder compact' : 'scene-art scene-placeholder';
  const label = CB_SCENE_LABELS[scene] || 'Artwork';
  return `<div class="${klass}" aria-label="${label} placeholder">
    <div class="scene-placeholder-inner">
      <i data-lucide="image"></i>
      <span>${label}</span>
      <small>10:3 image slot</small>
    </div>
  </div>`;
}
