'use strict';

const CB_SCENES = new Set([
  'home','shifts','rivals','locations','stockroom','crew','challenges','breakroom','reserve','profile'
]);

function cbSceneArt(scene, compact=false){
  if(!CB_SCENES.has(scene)) return '';
  const klass = compact ? 'scene-art compact' : 'scene-art';
  return `<div class="${klass}" aria-hidden="true">
    <svg viewBox="0 0 1200 360" preserveAspectRatio="xMidYMid slice" focusable="false">
      <use href="assets/art/scenes.svg?v=9#${scene}"></use>
    </svg>
  </div>`;
}
