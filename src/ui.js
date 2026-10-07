// src/ui.js —— 界面与渲染
// 职责：stage 内 absolute 覆盖层（计分/剩余命数/弹窗）+ 每帧 canvas 绘制
// 约束：所有覆盖层只能使用 position:absolute，绝不使用视口定位

var uiOverlay = null;   // 计分板 DOM 引用
var uiModal = null;     // 结束弹窗 DOM 引用

// 构建覆盖层：全部 position:absolute，挂入 stage
function uiBuildOverlay(stage, bounds) {
  if (uiOverlay && uiOverlay.parentNode) {
    uiOverlay.parentNode.removeChild(uiOverlay);
    uiOverlay = null;
  }
  uiOverlay = document.createElement('div');
  uiOverlay.style.position = 'absolute';
  uiOverlay.style.left = '8px';
  uiOverlay.style.top = '8px';
  uiOverlay.style.right = '8px';
  uiOverlay.style.padding = '4px 8px';
  uiOverlay.style.font = 'bold 14px monospace, sans-serif';
  uiOverlay.style.color = '#ffffff';
  uiOverlay.style.textShadow = '0 1px 2px rgba(0,0,0,0.8)';
  uiOverlay.style.pointerEvents = 'none';
  uiOverlay.style.whiteSpace = 'pre';
  uiOverlay.style.zIndex = '10';
  stage.appendChild(uiOverlay);
}

// 更新计分板文本（分数 / 剩余命数 / 等级）
function uiUpdateHud(state) {
  if (!uiOverlay) return;
  var score = state && typeof state.score === 'number' ? state.score : 0;
  var lives = state && typeof state.lives === 'number' ? state.lives : 3;
  var level = state && typeof state.level === 'number' ? state.level : 1;
  uiOverlay.textContent =
    '分数: ' + score +
    '   剩余命数: ' + lives + ' / 3' +
    '   等级: ' + level;
}

// 弹窗（开始/结束），带按钮回调 onAction；absolute 居中于 stage
function uiShowModal(stage, text, onAction) {
  uiHideModal();

  // 遮罩层：覆盖整个 stage，absolute
  uiModal = document.createElement('div');
  uiModal.style.position = 'absolute';
  uiModal.style.left = '0';
  uiModal.style.top = '0';
  uiModal.style.right = '0';
  uiModal.style.bottom = '0';
  uiModal.style.display = 'flex';
  uiModal.style.alignItems = 'center';
  uiModal.style.justifyContent = 'center';
  uiModal.style.background = 'rgba(0, 0, 0, 0.6)';
  uiModal.style.zIndex = '20';

  // 内容面板
  var panel = document.createElement('div');
  panel.style.display = 'flex';
  panel.style.flexDirection = 'column';
  panel.style.alignItems = 'center';
  panel.style.gap = '16px';
  panel.style.padding = '24px 32px';
  panel.style.background = 'rgba(20, 24, 40, 0.95)';
  panel.style.border = '2px solid #66aaff';
  panel.style.borderRadius = '12px';

  var label = document.createElement('div');
  label.textContent = text;
  label.style.color = '#ffffff';
  label.style.font = 'bold 18px monospace, sans-serif';
  label.style.textAlign = 'center';
  panel.appendChild(label);

  var btn = document.createElement('button');
  btn.textContent = '开始 / 继续';
  btn.style.padding = '8px 24px';
  btn.style.font = 'bold 14px monospace, sans-serif';
  btn.style.color = '#ffffff';
  btn.style.background = '#3377cc';
  btn.style.border = '1px solid #66aaff';
  btn.style.borderRadius = '6px';
  btn.style.cursor = 'pointer';
  btn.addEventListener('click', function () {
    if (typeof onAction === 'function') onAction();
  });
  panel.appendChild(btn);

  uiModal.appendChild(panel);
  stage.appendChild(uiModal);
}

function uiHideModal() {
  if (uiModal) {
    if (uiModal.parentNode) uiModal.parentNode.removeChild(uiModal);
    uiModal = null;
  }
}

// 每帧 canvas 绘制：背景、挡板、星星、粒子（用传入的 g）
function uiRender(g, state) {
  var w = g.canvas.width;
  var h = g.canvas.height;

  // 背景
  g.clearRect(0, 0, w, h);
  g.fillStyle = '#101425';
  g.fillRect(0, 0, w, h);

  if (!state) return;

  // 粒子
  var particles = state.particles || [];
  for (var i = 0; i < particles.length; i++) {
    var p = particles[i];
    if (!p) continue;
    g.globalAlpha = (typeof p.life === 'number') ? Math.max(0, Math.min(1, p.life)) : 1;
    g.fillStyle = p.color || '#ffcc66';
    g.beginPath();
    g.arc(p.x || 0, p.y || 0, p.r || 2, 0, Math.PI * 2);
    g.fill();
  }
  g.globalAlpha = 1;

  // 星星
  var stars = state.stars || [];
  for (var s = 0; s < stars.length; s++) {
    var st = stars[s];
    if (!st) continue;
    var sx = st.x || 0;
    var sy = st.y || 0;
    var sr = st.r || 6;
    g.fillStyle = st.color || '#ffdd44';
    g.beginPath();
    g.arc(sx, sy, sr, 0, Math.PI * 2);
    g.fill();
    // 高光
    g.fillStyle = 'rgba(255,255,255,0.7)';
    g.beginPath();
    g.arc(sx - sr * 0.3, sy - sr * 0.3, sr * 0.35, 0, Math.PI * 2);
    g.fill();
  }

  // 挡板
  var paddle = state.paddle;
  if (paddle) {
    g.fillStyle = paddle.color || '#66aaff';
    g.fillRect(paddle.x - paddle.w / 2, paddle.y, paddle.w, paddle.h);
  }
}
