// src/main.js —— 入口：创建画布与装配，唯一一处 Work.register
// 职责：mount 时建画布/启动引擎；destroy 时停 RAF、解绑监听、清 stage

var mainRafId = 0;       // RAF 句柄（Work.register 闭包可见，供 destroy 清理）
var mainKeyHandler = null;  // 键盘监听句柄
var mainCanvas = null;      // 画布引用，destroy 时从 stage 移除

function mainCreateCanvas(bounds) {
  var canvas = document.createElement('canvas');
  canvas.width = bounds.width;
  canvas.height = bounds.height;
  var g = canvas.getContext('2d');
  return { canvas: canvas, g: g };
}

Work.register({
  name: 'star-catch',
  mount: function (ctx) {
    var made = mainCreateCanvas(ctx.bounds);
    made.canvas.style.position = 'absolute';
    made.canvas.style.left = '0px';
    made.canvas.style.top = '0px';
    ctx.stage.appendChild(made.canvas);
    mainCanvas = made.canvas;

    uiBuildOverlay(ctx.stage, ctx.bounds);
    engineInit(made.g, ctx.bounds);

    mainKeyHandler = function (e) { engineOnKey(e); };
    window.addEventListener('keydown', mainKeyHandler);
    window.addEventListener('keyup', mainKeyHandler);

    var loop = function (t) {
      engineStep(t);
      uiRender(made.g);
      mainRafId = requestAnimationFrame(loop);
    };
    mainRafId = requestAnimationFrame(loop);
  },
  destroy: function () {
    if (mainRafId) { cancelAnimationFrame(mainRafId); mainRafId = 0; }
    if (mainKeyHandler) {
      window.removeEventListener('keydown', mainKeyHandler);
      window.removeEventListener('keyup', mainKeyHandler);
      mainKeyHandler = null;
    }
    engineDispose();
    if (mainCanvas && mainCanvas.parentNode) {
      mainCanvas.parentNode.removeChild(mainCanvas);
    }
    mainCanvas = null;
  }
});
