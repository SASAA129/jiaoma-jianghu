(() => {
  "use strict";

  const W = 390;
  const H = 844;
  const LANES = 3;
  const LANE_XS = [W * 0.22, W * 0.5, W * 0.78];
  const PLAYER_Y = H * 0.78;
  const MAX_HP = 3;
  const GAME_MAX_S = 90;
  const STAR_THRESH = [200, 400, 700];

  const KIND = {
    FOOD: "food",
    PACKET: "packet",
    DEBT: "debt",
    SOUP: "soup",
    STOOL: "stool",
  };

  const EMOJI = {
    food: ["🥬", "🥩", "🦐", "🍄", "🍜"],
    packet: "🧧",
    debt: "😱",
    soup: "🍲",
    stool: "🪑",
    player: "🧑‍🍳",
  };

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const elOverlay = document.getElementById("overlay");
  const elResult = document.getElementById("result");
  const elHud = document.getElementById("ui-hud");
  const elScore = document.getElementById("score");
  const elTimer = document.getElementById("timer");
  const elCombo = document.getElementById("combo");
  const elHp = document.getElementById("hp");
  const elStars = document.getElementById("stars");
  const elResultTitle = document.getElementById("result-title");
  const elResultScore = document.getElementById("result-score");
  const elResultDetail = document.getElementById("result-detail");

  let state = null;
  let raf = 0;
  let lastTs = 0;

  function fitCanvas() {
    const wrap = document.getElementById("wrap");
    const rw = wrap.clientWidth;
    const rh = wrap.clientHeight;
    const scale = Math.min(rw / W, rh / H);
    canvas.style.width = Math.floor(W * scale) + "px";
    canvas.style.height = Math.floor(H * scale) + "px";
  }
  window.addEventListener("resize", fitCanvas);
  fitCanvas();

  function phaseFor(t) {
    if (t < 20) return { speed: 220, spawn: 0.85, hard: 0.12, name: "教学" };
    if (t < 45) return { speed: 280, spawn: 0.72, hard: 0.32, name: "催账" };
    if (t < 75) return { speed: 360, spawn: 0.58, hard: 0.48, name: "加速" };
    return { speed: 440, spawn: 0.48, hard: 0.58, name: "极限" };
  }

  function freshState() {
    return {
      running: true,
      ended: false,
      t: 0,
      score: 0,
      hp: MAX_HP,
      combo: 0, // consecutive collects
      pendingMult: false, // next collect gets ×1.5
      lane: 1,
      targetLane: 1,
      laneX: LANE_XS[1],
      objects: [],
      spawnAcc: 0,
      scroll: 0,
      flash: 0,
      floaters: [],
      foods: 0,
      packets: 0,
      hits: 0,
      endReason: "",
    };
  }

  function spawnObject(s) {
    const ph = phaseFor(s.t);
    const lane = Math.floor(Math.random() * LANES);
    // Avoid stacking too many on same lane recently
    const nearSame = s.objects.filter(
      (o) => o.lane === lane && o.y > -80 && o.y < 120
    ).length;
    if (nearSame > 0 && Math.random() < 0.7) return;

    let kind;
    const roll = Math.random();
    if (roll < ph.hard) {
      // obstacle mix
      const r2 = Math.random();
      if (s.t >= 20 && r2 < 0.35) kind = KIND.DEBT;
      else if (r2 < 0.7) kind = KIND.SOUP;
      else kind = KIND.STOOL;
    } else {
      // reward
      if (Math.random() < 0.18) kind = KIND.PACKET;
      else kind = KIND.FOOD;
    }

    // Mid-late: sometimes sandwich with two obstacles + packet in middle
    if (s.t >= 45 && Math.random() < 0.18) {
      s.objects.push({
        kind: KIND.SOUP,
        lane: 0,
        y: -60,
        hit: false,
        emoji: EMOJI.soup,
      });
      s.objects.push({
        kind: KIND.PACKET,
        lane: 1,
        y: -60,
        hit: false,
        emoji: EMOJI.packet,
      });
      s.objects.push({
        kind: Math.random() < 0.5 ? KIND.STOOL : KIND.DEBT,
        lane: 2,
        y: -60,
        hit: false,
        emoji: Math.random() < 0.5 ? EMOJI.stool : EMOJI.debt,
      });
      return;
    }

    let emoji;
    if (kind === KIND.FOOD)
      emoji = EMOJI.food[Math.floor(Math.random() * EMOJI.food.length)];
    else emoji = EMOJI[kind];

    s.objects.push({ kind, lane, y: -70, hit: false, emoji });
  }

  function addFloater(s, text, x, y, color) {
    s.floaters.push({ text, x, y, life: 0.8, color: color || "#fff" });
  }

  function applyHit(s, dmg, label) {
    s.hp = Math.max(0, s.hp - dmg);
    s.combo = 0;
    s.pendingMult = false;
    s.hits += 1;
    s.flash = 0.35;
    addFloater(s, label, s.laneX, PLAYER_Y - 50, "#ff6b6b");
    if (s.hp <= 0) endGame(s, "体力耗尽");
  }

  function applyCollect(s, base, label) {
    let gain = base;
    if (s.pendingMult) {
      gain = Math.round(base * 1.5);
      s.pendingMult = false;
      addFloater(s, "×1.5!", s.laneX + 40, PLAYER_Y - 70, "#ffd24a");
    }
    s.score += gain;
    s.combo += 1;
    if (s.combo > 0 && s.combo % 5 === 0) {
      s.pendingMult = true;
      addFloater(s, "连击加成就绪!", s.laneX, PLAYER_Y - 90, "#7dffb3");
    }
    addFloater(s, `+${gain}`, s.laneX, PLAYER_Y - 50, "#7dffb3");
    if (base === 10) s.foods += 1;
    else s.packets += 1;
  }

  function collide(s, o) {
    if (o.hit) return;
    if (o.lane !== s.targetLane && o.lane !== s.lane) return;
    // Only when close to player vertically
    const dy = Math.abs(o.y - PLAYER_Y);
    if (dy > 42) return;
    // If still sliding between lanes, require being closer to target
    if (s.lane !== s.targetLane) {
      const tx = LANE_XS[s.targetLane];
      if (Math.abs(s.laneX - tx) > 28) return;
    }
    o.hit = true;
    switch (o.kind) {
      case KIND.FOOD:
        applyCollect(s, 10, "+10");
        break;
      case KIND.PACKET:
        applyCollect(s, 50, "+50");
        break;
      case KIND.DEBT:
        applyHit(s, 2, "催账 -2");
        break;
      case KIND.SOUP:
        applyHit(s, 1, "泼汤 -1");
        break;
      case KIND.STOOL:
        applyHit(s, 1, "绊倒 -1");
        break;
    }
  }

  function endGame(s, reason) {
    if (s.ended) return;
    s.ended = true;
    s.running = false;
    s.endReason = reason;
    const stars = starCount(s.score);
    elStars.textContent = "★".repeat(stars) + "☆".repeat(3 - stars);
    elResultTitle.textContent =
      reason === "体力耗尽" ? "出局了" : "本局结束";
    elResultScore.textContent = `${s.score} 分`;
    elResultDetail.textContent = `${reason} · 菜 ${s.foods} · 红包 ${s.packets} · 撞 ${s.hits} · ${Math.floor(s.t)}s`;
    elHud.classList.add("hidden");
    elResult.classList.remove("hidden");
    cancelAnimationFrame(raf);
  }

  function starCount(score) {
    let n = 0;
    for (const th of STAR_THRESH) if (score >= th) n++;
    return n;
  }

  function update(s, dt) {
    s.t += dt;
    if (s.t >= GAME_MAX_S) {
      endGame(s, "撑满 90 秒");
      return;
    }

    const ph = phaseFor(s.t);
    s.scroll += ph.speed * dt;

    // Smooth lane move
    const tx = LANE_XS[s.targetLane];
    const dx = tx - s.laneX;
    if (Math.abs(dx) < 2) {
      s.laneX = tx;
      s.lane = s.targetLane;
    } else {
      s.laneX += Math.sign(dx) * Math.min(Math.abs(dx), 900 * dt);
    }

    // Spawn
    s.spawnAcc += dt;
    if (s.spawnAcc >= ph.spawn) {
      s.spawnAcc = 0;
      spawnObject(s);
      // Early game: sometimes double food to teach collecting
      if (s.t < 15 && Math.random() < 0.35) spawnObject(s);
    }

    // Move objects
    for (const o of s.objects) {
      o.y += ph.speed * dt;
      collide(s, o);
    }
    s.objects = s.objects.filter((o) => o.y < H + 80 && !o.hit);

    // Floaters
    for (const f of s.floaters) {
      f.y -= 40 * dt;
      f.life -= dt;
    }
    s.floaters = s.floaters.filter((f) => f.life > 0);

    if (s.flash > 0) s.flash -= dt;

    // HUD
    elScore.textContent = `分 ${s.score}`;
    elTimer.textContent = `${Math.floor(s.t)}s`;
    const comboLabel = s.pendingMult
      ? `连击 ${s.combo} · ×1.5`
      : `连击 ${s.combo}`;
    elCombo.textContent = comboLabel;
    elHp.textContent = "❤️".repeat(s.hp) + "🖤".repeat(MAX_HP - s.hp);
  }

  function drawRoad(s) {
    // Background
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#1c100c");
    g.addColorStop(1, "#3a2418");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // Lane strips
    const roadL = W * 0.08;
    const roadR = W * 0.92;
    ctx.fillStyle = "#4a3224";
    ctx.fillRect(roadL, 0, roadR - roadL, H);

    // Lane dividers (scrolling dashes)
    ctx.strokeStyle = "rgba(255,220,150,0.35)";
    ctx.lineWidth = 3;
    ctx.setLineDash([18, 22]);
    ctx.lineDashOffset = -s.scroll * 0.4;
    for (let i = 1; i < LANES; i++) {
      const x = (LANE_XS[i - 1] + LANE_XS[i]) / 2;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Side walls
    ctx.fillStyle = "#2a1810";
    ctx.fillRect(0, 0, roadL, H);
    ctx.fillRect(roadR, 0, W - roadR, H);
    ctx.fillStyle = "#e8a84a";
    ctx.fillRect(roadL - 3, 0, 3, H);
    ctx.fillRect(roadR, 0, 3, H);

    // Decorative hanging lamps
    ctx.font = "22px serif";
    ctx.textAlign = "center";
    const lampY = ((s.scroll * 0.15) % 160) - 40;
    for (let y = lampY; y < H; y += 160) {
      ctx.globalAlpha = 0.55;
      ctx.fillText("🏮", 22, y);
      ctx.fillText("🏮", W - 22, y);
      ctx.globalAlpha = 1;
    }
  }

  function drawObject(o) {
    const x = LANE_XS[o.lane];
    const y = o.y;
    // Shadow
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.ellipse(x, y + 22, 22, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Color block under emoji
    let col = "#666";
    if (o.kind === KIND.FOOD) col = "#3d8b4a";
    else if (o.kind === KIND.PACKET) col = "#c0392b";
    else if (o.kind === KIND.DEBT) col = "#6c3483";
    else if (o.kind === KIND.SOUP) col = "#d68910";
    else if (o.kind === KIND.STOOL) col = "#7d6608";
    ctx.fillStyle = col;
    roundRect(x - 26, y - 26, 52, 52, 12);
    ctx.fill();

    ctx.font = "32px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(o.emoji, x, y + 2);
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawPlayer(s) {
    const x = s.laneX;
    const y = PLAYER_Y;
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.beginPath();
    ctx.ellipse(x, y + 28, 26, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#e67e22";
    roundRect(x - 30, y - 30, 60, 60, 14);
    ctx.fill();
    ctx.strokeStyle = "#ffe0a0";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = "36px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(EMOJI.player, x, y + 2);

    if (s.pendingMult) {
      ctx.font = "bold 12px sans-serif";
      ctx.fillStyle = "#ffd24a";
      ctx.fillText("×1.5 就绪", x, y - 42);
    }
  }

  function draw(s) {
    drawRoad(s);
    // Draw objects back-to-front by y
    const sorted = s.objects.slice().sort((a, b) => a.y - b.y);
    for (const o of sorted) drawObject(o);
    drawPlayer(s);

    // Floaters
    for (const f of s.floaters) {
      ctx.globalAlpha = Math.max(0, f.life / 0.8);
      ctx.font = "bold 18px sans-serif";
      ctx.fillStyle = f.color;
      ctx.textAlign = "center";
      ctx.fillText(f.text, f.x, f.y);
      ctx.globalAlpha = 1;
    }

    // Hit flash
    if (s.flash > 0) {
      ctx.fillStyle = `rgba(200,30,30,${s.flash * 0.5})`;
      ctx.fillRect(0, 0, W, H);
    }

    // Phase hint (first few seconds)
    if (s.t < 4) {
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      roundRect(W / 2 - 110, 80, 220, 40, 10);
      ctx.fill();
      ctx.fillStyle = "#ffe0a0";
      ctx.font = "14px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("左右滑 / 点半屏换道", W / 2, 105);
    }
  }

  function loop(ts) {
    if (!state || !state.running) return;
    if (!lastTs) lastTs = ts;
    let dt = (ts - lastTs) / 1000;
    lastTs = ts;
    if (dt > 0.05) dt = 0.05;
    update(state, dt);
    draw(state);
    if (state.running) raf = requestAnimationFrame(loop);
  }

  function startGame() {
    state = freshState();
    lastTs = 0;
    elOverlay.classList.add("hidden");
    elResult.classList.add("hidden");
    elHud.classList.remove("hidden");
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(loop);
  }

  function move(dir) {
    if (!state || !state.running) return;
    state.targetLane = Math.max(0, Math.min(2, state.targetLane + dir));
  }

  // Input: tap half-screen + swipe
  let touchX0 = null;
  let touchY0 = null;
  let swiped = false;

  function onPointerDown(e) {
    const p = e.touches ? e.touches[0] : e;
    touchX0 = p.clientX;
    touchY0 = p.clientY;
    swiped = false;
  }
  function onPointerMove(e) {
    if (touchX0 == null) return;
    const p = e.touches ? e.touches[0] : e;
    const dx = p.clientX - touchX0;
    const dy = p.clientY - touchY0;
    if (!swiped && Math.abs(dx) > 36 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      move(dx < 0 ? -1 : 1);
      swiped = true;
      touchX0 = p.clientX;
    }
  }
  function onPointerUp(e) {
    if (touchX0 == null) return;
    if (!swiped && state && state.running) {
      const p = e.changedTouches ? e.changedTouches[0] : e;
      const rect = canvas.getBoundingClientRect();
      const x = p.clientX - rect.left;
      if (x < rect.width / 2) move(-1);
      else move(1);
    }
    touchX0 = null;
    touchY0 = null;
    swiped = false;
  }

  canvas.addEventListener("touchstart", onPointerDown, { passive: true });
  canvas.addEventListener("touchmove", onPointerMove, { passive: true });
  canvas.addEventListener("touchend", onPointerUp, { passive: true });
  canvas.addEventListener("mousedown", onPointerDown);
  window.addEventListener("mouseup", onPointerUp);
  window.addEventListener("mousemove", (e) => {
    if (e.buttons === 1) onPointerMove(e);
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") move(-1);
    if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") move(1);
    if ((e.key === "Enter" || e.key === " ") && elOverlay && !elOverlay.classList.contains("hidden")) {
      startGame();
    }
    if ((e.key === "Enter" || e.key === " ") && elResult && !elResult.classList.contains("hidden")) {
      startGame();
    }
  });

  document.getElementById("btn-start").addEventListener("click", startGame);
  document.getElementById("btn-retry").addEventListener("click", startGame);

  // Expose for automated self-test / screenshots
  window.__PAOKU__ = {
    start: startGame,
    move,
    getState: () => state,
    endNow: (reason) => state && endGame(state, reason || "测试结算"),
    W,
    H,
  };
})();
