/* 空中飞人 · 启动 */
(function () {
  'use strict';

  function boot() {
    if (!window.FXEngine || !window.FXUI) {
      console.error('游戏脚本未正确加载');
      return;
    }
    window.FXEngine.init();
    window.FXUI.init();
    window.setInterval(() => window.FXEngine.tick(), 1500);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
