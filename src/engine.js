// src/engine.js —— 状态与主循环
// 职责：维护游戏状态、更新实体、处理键盘输入与碰撞

var engineState = {
  running: false,
  paused: false,
  score: 0,
  lives: 3,
  level: 1,
  time: 0
};

var engineBounds = { w: 480, h: 640 };
var engineLastT = 0;
var keys = { left: false, right: false };

// 初始化引擎：绑定 2D 上下文 g 与场地尺寸
function engineInit(g, bounds) {
  if (bounds && typeof bounds.w === 'number' && typeof bounds.h === 'number') {
    engineBounds = bounds;
  }
  engineState.running = true;
  engineState.paused = false;
  engineState.score = 0;
  engineState.lives = 3;
  engineState.level = 1;
  engineState.time = 0;
  engineLastT = 0;
  keys.left = false;
  keys.right = false;
  entitiesReset(engineBounds);
  return engineState;
}

// 键盘事件（keydown/keyup 复用），控制挡板左右移动与开始/暂停
function engineOnKey(e) {
  var down = e.type === 'keydown';
  switch (e.key) {
    case 'ArrowLeft':
    case 'a':
    case 'A':
      keys.left = down;
      e.preventDefault();
      break;
    case 'ArrowRight':
    case 'd':
    case 'D':
      keys.right = down;
      e.preventDefault();
      break;
    case ' ':
      if (down && engineState.running) {
        engineState.paused = !engineState.paused;
        engineLastT = 0; // 暂停恢复后重置时间基准，避免大步长跳帧
      }
      e.preventDefault();
      break;
  }
}

// 引擎内部步进：应用输入、更新实体、执行碰撞
function engineUpdate(dt) {
  var paddle = (typeof getPaddle === 'function') ? getPaddle() : (typeof paddle !== 'undefined' ? paddle : null);

  // 输入驱动挡板
  if (paddle) {
    var speed = paddle.speed || 320;
    if (keys.left && !keys.right) {
      paddle.x -= speed * dt;
    } else if (keys.right && !keys.left) {
      paddle.x += speed * dt;
    }
    var pw = paddle.w || 80;
    if (paddle.x < 0) paddle.x = 0;
    if (paddle.x + pw > engineBounds.w) paddle.x = engineBounds.w - pw;
  }

  // 实体更新（entities.js 负责星星下落、粒子演化等）
  entitiesUpdate(dt, engineBounds);

  // 碰撞与规则
  var ev;
  while ((ev = engineCollide()) !== null) {
    if (ev.type === 'catch') {
      engineState.score += 10 * engineState.level;
      entitiesRemove(ev.entity);
      if (typeof spawnBurst === 'function') spawnBurst(ev.entity.x, engineBounds.h - 40, '#ffd54a');
      // 每得 100 分升一级
      if (engineState.score >= engineState.level * 100) engineState.level += 1;
    } else if (ev.type === 'miss') {
      entitiesRemove(ev.entity);
      engineState.lives -= 1;
      if (engineState.lives <= 0) {
        engineState.lives = 0;
        engineState.running = false;
      }
    } else if (ev.type === 'wall') {
      ev.entity.vx = -ev.entity.vx;
    }
  }

  // 星星耗尽则补充一批
  if (typeof starsCount === 'function' && starsCount() === 0 && engineState.running) {
    entitiesSpawnStars(engineState.level);
  }
}

// 每帧逻辑步进：dt 累积、实体更新、碰撞、得分与生命判定
function engineStep(t) {
  if (!engineState.running || engineState.paused) return;
  if (!engineLastT) engineLastT = t;
  var dt = (t - engineLastT) / 1000;
  engineLastT = t;
  if (dt > 0.05) dt = 0.05; // 防止切页后大步长穿透
  engineState.time += dt;
  engineUpdate(dt);
}

// 命中判定：星与挡板/边界/底部
function engineCollide() {
  var list = (typeof getStars === 'function') ? getStars() : (typeof stars !== 'undefined' ? stars : null);
  if (!list || !list.length) return null;
  var paddle = (typeof getPaddle === 'function') ? getPaddle() : (typeof paddle !== 'undefined' ? paddle : null);
  var pw = paddle ? (paddle.w || 80) : 80;
  var py = paddle ? paddle.y : engineBounds.h - 40;
  var ph = paddle ? (paddle.h || 14) : 14;

  for (var i = 0; i < list.length; i++) {
    var s = list[i];
    var r = s.r || 10;
    // 左右墙反弹
    if (s.x - r <= 0 && s.vx < 0) return { type: 'wall', entity: s };
    if (s.x + r >= engineBounds.w && s.vx > 0) return { type: 'wall', entity: s };
    // 底部漏接
    if (s.y - r > engineBounds.h) return { type: 'miss', entity: s };
    // 挡板接住
    if (paddle &&
        s.y + r >= py && s.y - r <= py + ph &&
        s.x >= paddle.x - r && s.x <= paddle.x + pw + r &&
        s.vy > 0) {
      return { type: 'catch', entity: s };
    }
  }
  return null;
}

// 引擎销毁：清状态（RAF/监听由 main.js destroy 负责）
function engineDispose() {
  engineState.running = false;
  engineState.paused = false;
  engineState.score = 0;
  engineState.lives = 3;
  engineState.level = 1;
  engineState.time = 0;
  engineLastT = 0;
  keys.left = false;
  keys.right = false;
  entitiesReset({ w: 0, h: 0 }); // 释放实体数组（重置为空集合）
}
