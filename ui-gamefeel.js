'use strict';

pageHead = function(eyebrow, title, subtitle, action=''){
  return action ? `<div class="screen-action-bar">${action}</div>` : '';
};
