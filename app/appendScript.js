'use strict';
function appendScript(attrs) { // eslint-disable-line no-unused-vars
  let script = document.createElement('script');
  Object.assign(script, attrs);
  let body = document.querySelector('body');
  body.appendChild(script);
}
