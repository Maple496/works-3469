// src/entities.js —— 实体与规则
// 职责：挡板/星星/粒子的生成、更新、重置

var entities = {
  paddle: null,   // { x, y, w, h, vx }
  stars: [],      // [{ x, y, r, vy, spin, rot, miss }]
  particles: [],  // [{ x, y, vx, vy, life, maxLife }]
  bounds: null
};

var PADDLE_W = 90;
var PADDLE_H = 14;
var PADDLE_SPEED = 380;   // px/s
var PADDLE_MARGIN = 8;
var STAR_MIN_R = 9;
var STAR_MAX_R = 14;
var STAR_BASE_VY = 80;    // 1 级基础下落速度
var STAR_VY_PER_LEVEL = 25;
var PARTICLE_LIFE = 0.6;

function entitiesReset(bounds) {
  entities.bounds = bounds;
  entities.stars = [];
  entities.particles = [];
  entities.paddle = {
    x: bounds.w / 2,
    y: bounds.h - PADDLE_H / 2 - PADDLE_MARGIN,
    w: PADDLE_W,
    h: PADDLE_H,
    vx: 0
  };
}

// 生成一颗星星（随机 x、下落速度随 level 提升）
function entitiesSpawnStar(level) {
  var b = entities.bounds;
  var r = STAR_MIN_R + Math.random() * (STAR_MAX_R - STAR_MIN_R);
  var star = {
    x: r + Math.random() * (b.w - r * 2),
    y: -r - 2,
    r: r,
    vy: STAR_BASE_VY + (level || 1) * STAR_VY_PER_LEVEL * (0.75 + Math.random() * 0.5),
    spin: (Math.random() * 2 - 1) * 3,
    rot: Math.random() * Math.PI * 2,
    miss: false
  };
  entities.stars.push(star);
  return star;
}

// 每帧更新：挡板位移、星星下落、粒子寿命衰减
function entitiesUpdate(dt) {
  var b = entities.bounds;
  if (entities.paddle) {
    entities.paddle.x += entities.paddle.vx * dt;
    var half = entities.paddle.w / 2;
    if (entities.paddle.x < half) entities.paddle.x = half;
    if (entities.paddle.x > b.w - half) entities.paddle.x = b.w - half;
  }
  var i;
  for (i = 0; i < entities.stars.length; i++) {
    var s = entities.stars[i];
    s.y += s.vy * dt;
    s.rot += s.spin * dt;
    if (!s.miss && s.y - s.r > b.h) s.miss = true;
  }
  for (i = entities.particles.length - 1; i >= 0; i--) {
    var p = entities.particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 260 * dt; // 轻微重力
    p.life -= dt;
    if (p.life <= 0) entities.particles.splice(i, 1);
  }
}

// 命中反馈：在 (x, y) 处爆出 8-12 个粒子
function entitiesBurst(x, y) {
  var n = 8 + Math.floor(Math.random() * 5);
  for (var i = 0; i < n; i++) {
    var a = Math.random() * Math.PI * 2;
    var sp = 60 + Math.random() * 140;
    entities.particles.push({
      x: x,
      y: y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp - 40,
      life: PARTICLE_LIFE * (0.6 + Math.random() * 0.6),
      maxLife: PARTICLE_LIFE
    });
  }
}

// 挡板左右移动（由 engineOnKey 调用）：dir = -1/0/1
function entitiesMovePaddle(dir) {
  if (!entities.paddle) return;
  entities.paddle.vx = dir * PADDLE_SPEED;
}

// 移除已 miss 的星星，返回移除数量（供 engine 结算）
function entitiesSweepMissed() {
  var removed = 0;
  for (var i = entities.stars.length - 1; i >= 0; i--) {
    if (entities.stars[i].miss) {
      entities.stars.splice(i, 1);
      removed++;
    }
  }
  return removed;
}

// 移除指定星星（供 engine 命中后调用）
function entitiesRemoveStar(star) {
  var i = entities.stars.indexOf(star);
  if (i >= 0) entities.stars.splice(i, 1);
}
