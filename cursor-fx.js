/* ══════════════════════════════════════════════════════════
   DELTA ENERGY — Electric Cursor Trail Effect
   Δημιουργεί ηλεκτρικές σπίθες που ακολουθούν τον κέρσορα
   ══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── Canvas setup ── */
  const canvas  = document.createElement('canvas');
  const ctx     = canvas.getContext('2d');
  canvas.style.cssText =
    'position:fixed;top:0;left:0;width:100%;height:100%;' +
    'pointer-events:none;z-index:9998;';
  document.body.appendChild(canvas);

  let W = canvas.width  = window.innerWidth;
  let H = canvas.height = window.innerHeight;

  window.addEventListener('resize', () => {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  });

  /* ── State ── */
  let mouseX = W / 2, mouseY = H / 2;
  let prevX  = mouseX, prevY  = mouseY;
  let particles  = [];
  let isMoving   = false;
  let moveTimer  = null;

  document.addEventListener('mousemove', (e) => {
    prevX  = mouseX;
    prevY  = mouseY;
    mouseX = e.clientX;
    mouseY = e.clientY;
    isMoving = true;
    clearTimeout(moveTimer);
    moveTimer = setTimeout(() => { isMoving = false; }, 100);

    /* Γεννάμε σπίθες ανάλογα με την ταχύτητα κίνησης */
    const dx    = mouseX - prevX;
    const dy    = mouseY - prevY;
    const speed = Math.sqrt(dx * dx + dy * dy);
    const count = Math.min(Math.floor(speed / 8) + 1, 3);

    for (let i = 0; i < count; i++) {
      /* Σπίθες κατά μήκος της διαδρομής */
      const t = i / count;
      const ox = prevX + dx * t;
      const oy = prevY + dy * t;
      particles.push(new ElectricSpark(ox, oy, dx * 0.03, dy * 0.03));

      /* Ευκαιριακά bolt (σπάνια, μικρά) */
      if (Math.random() < 0.04) {
        particles.push(new LightningBolt(ox, oy));
      }
    }
  });

  /* ════════════════════════════════════════════
     ELECTRIC SPARK — μικρή σπίθα με trail
     ════════════════════════════════════════════ */
  class ElectricSpark {
    constructor(x, y, inheritVx = 0, inheritVy = 0) {
      this.x     = x;
      this.y     = y;
      this.life  = 1.0;
      this.decay = 0.06 + Math.random() * 0.06;   // πεθαίνει γρηγορότερα

      const angle = Math.random() * Math.PI * 2;
      const spd   = 0.4 + Math.random() * 1.2;    // πιο αργό
      this.vx  = Math.cos(angle) * spd + inheritVx;
      this.vy  = Math.sin(angle) * spd + inheritVy;

      /* Χρώμα: αποχρώσεις πράσινου ηλεκτρισμού */
      const palette = [
        '#89EA5F', '#89EA5F',
        '#5DC832', '#a8f07a',
      ];
      this.color = palette[Math.floor(Math.random() * palette.length)];
      this.width = 0.3 + Math.random() * 0.7;     // πιο λεπτό

      /* Trail: σημεία για τη γραμμή */
      this.trail     = [{ x, y }];
      this.maxTrail  = 3 + Math.floor(Math.random() * 3);  // πιο κοντό

      /* Πιθανότητα fork (διακλάδωση) */
      this.canFork   = Math.random() < 0.08;       // λιγότερο συχνά
      this.forked    = false;
    }

    update(spawnFn) {
      /* Jitter για τo electricity feel */
      this.vx += (Math.random() - 0.5) * 0.6;
      this.vy += (Math.random() - 0.5) * 0.6 + 0.02;
      this.vx *= 0.94;
      this.vy *= 0.94;

      this.x += this.vx;
      this.y += this.vy;
      this.life -= this.decay;

      this.trail.push({ x: this.x, y: this.y });
      if (this.trail.length > this.maxTrail) this.trail.shift();

      /* Fork: γεννάμε θυγατρική σπίθα */
      if (this.canFork && !this.forked && this.life < 0.65 && this.life > 0.3) {
        this.forked = true;
        spawnFn(this.x, this.y, this.vx * 0.5, this.vy * 0.5);
      }
    }

    draw() {
      if (this.trail.length < 2) return;

      ctx.save();
      ctx.globalAlpha  = Math.max(0, this.life) * 0.55;  // πιο διαφανές
      ctx.strokeStyle  = this.color;
      ctx.lineWidth    = this.width;
      ctx.shadowColor  = '#89EA5F';
      ctx.shadowBlur   = 3 + this.width * 2;             // λιγότερο glow
      ctx.lineCap      = 'round';
      ctx.lineJoin     = 'round';

      ctx.beginPath();
      ctx.moveTo(this.trail[0].x, this.trail[0].y);
      for (let i = 1; i < this.trail.length; i++) {
        /* Μικρό zigzag για αίσθηση ηλεκτρισμού */
        const jx = (Math.random() - 0.5) * 1.5;
        const jy = (Math.random() - 0.5) * 1.5;
        ctx.lineTo(this.trail[i].x + jx, this.trail[i].y + jy);
      }
      ctx.stroke();

      /* Φωτεινή κεφαλή (μικρότερη) */
      const tip = this.trail[this.trail.length - 1];
      ctx.beginPath();
      ctx.arc(tip.x, tip.y, this.width * 0.8, 0, Math.PI * 2);
      ctx.fillStyle   = '#d0ffb0';
      ctx.shadowBlur  = 4;
      ctx.fill();

      ctx.restore();
    }
  }

  /* ════════════════════════════════════════════
     LIGHTNING BOLT — σύντομος κεραυνός
     ════════════════════════════════════════════ */
  class LightningBolt {
    constructor(x, y) {
      this.x    = x;
      this.y    = y;
      this.life = 1.0;
      this.decay = 0.14 + Math.random() * 0.1;   // εξαφανίζεται πολύ γρήγορα

      /* Κατεύθυνση */
      const angle  = Math.random() * Math.PI * 2;
      const length = 8 + Math.random() * 18;     // πολύ μικρότερος
      this.segments = this._buildSegments(x, y, angle, length, 1);
      this.color    = Math.random() < 0.5 ? '#89EA5F' : '#c8ff9e';
      this.width    = 0.3 + Math.random() * 0.4; // πιο λεπτός
    }

    _buildSegments(x, y, angle, length, forks) {
      const segs   = [];
      let cx = x, cy = y;
      const steps  = 6 + Math.floor(Math.random() * 4);
      const stepLen = length / steps;

      for (let i = 0; i < steps; i++) {
        const jitter = (Math.random() - 0.5) * 6;   // λιγότερο zigzag
        const nx = cx + Math.cos(angle) * stepLen + Math.cos(angle + Math.PI / 2) * jitter;
        const ny = cy + Math.sin(angle) * stepLen + Math.sin(angle + Math.PI / 2) * jitter;
        segs.push({ x1: cx, y1: cy, x2: nx, y2: ny });
        cx = nx; cy = ny;

        /* Διακλάδωση */
        if (forks > 0 && Math.random() < 0.25) {
          const forkAngle  = angle + (Math.random() - 0.5) * 1.2;
          const forkLength = length * 0.35;
          const sub = this._buildSegments(cx, cy, forkAngle, forkLength, 0);
          sub.forEach(s => { s.fork = true; segs.push(s); });
        }
      }
      return segs;
    }

    update() {
      this.life -= this.decay;
    }

    draw() {
      ctx.save();
      ctx.globalAlpha = Math.max(0, this.life) * 0.5;  // πιο διαφανής
      ctx.lineCap     = 'round';
      ctx.shadowColor = '#89EA5F';
      ctx.shadowBlur  = 4;

      this.segments.forEach(seg => {
        ctx.beginPath();
        ctx.moveTo(seg.x1, seg.y1);
        ctx.lineTo(seg.x2, seg.y2);
        ctx.strokeStyle = seg.fork ? '#5DC832' : this.color;
        ctx.lineWidth   = seg.fork ? this.width * 0.5 : this.width;
        ctx.stroke();
      });
      ctx.restore();
    }
  }

  /* ════════════════════════════════════════════
     AMBIENT GLOW — λεπτό glow γύρω από cursor
     ════════════════════════════════════════════ */
  let glowAlpha = 0;

  function drawCursorGlow() {
    const targetAlpha = isMoving ? 0.07 : 0;   // πιο αχνό glow
    glowAlpha += (targetAlpha - glowAlpha) * 0.1;
    if (glowAlpha < 0.003) return;

    const grad = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, 18);
    grad.addColorStop(0, `rgba(137,234,95,${glowAlpha})`);
    grad.addColorStop(1, 'rgba(137,234,95,0)');

    ctx.save();
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(mouseX, mouseY, 18, 0, Math.PI * 2);  // μικρότερη ακτίνα
    ctx.fill();
    ctx.restore();
  }

  /* ════════════════════════════════════════════
     RENDER LOOP
     ════════════════════════════════════════════ */
  let children = [];  /* buffer για fork-spawned particles */

  function animate() {
    /* Πλήρης καθαρισμός — το trail το κρατούν τα ίδια τα particles */
    ctx.clearRect(0, 0, W, H);

    /* Cursor glow */
    drawCursorGlow();

    /* Φίλτραρε νεκρά particles */
    particles = particles.filter(p => p.life > 0);

    /* Update & draw */
    children = [];
    particles.forEach(p => {
      if (p instanceof ElectricSpark) {
        p.update((x, y, vx, vy) => children.push(new ElectricSpark(x, y, vx, vy)));
      } else {
        p.update();
      }
      p.draw();
    });

    /* Πρόσθεσε fork-children */
    particles.push(...children);

    /* Όριο particles για απόδοση */
    if (particles.length > 60) {    // πολύ λιγότερα particles συνολικά
      particles.splice(0, particles.length - 60);
    }

    requestAnimationFrame(animate);
  }

  animate();

})();
