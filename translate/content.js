// content.js
// run at document_start so we always catch contextmenu
document.addEventListener('contextmenu', (e) => {
  // record the click position relative to the viewport
  window._lastContextMenuCoords = {
    x: e.clientX,
    y: e.clientY
  };
}, true);
