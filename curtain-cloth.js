import * as THREE from "https://esm.sh/three@0.160.0";

const MOBILE = typeof matchMedia !== "undefined" && matchMedia("(max-width: 700px)").matches;
const SEGX = 20;
const SEGY = 13;
const ITER = 5; // Увеличено с 3 до 5 для лучшей стабильности связей
const DAMP = 0.91; // Усилено затухание (было 0.945) для предотвращения эффекта "желе"
const GRAVITY = 0.0014;
const FULLNESS = 1.9;

class Panel {
  constructor(side, aspect, texture) {
    this.side = side; // -1 left, +1 right
    this.build(aspect, texture);
  }
  build(aspect, texture) {
    this.aspect = aspect;
    this.dx = (aspect * FULLNESS) / SEGX;
    this.railDx = aspect / SEGX;
    this.dy = 2 / SEGY;
    this.pts = [];
    for (let y = 0; y <= SEGY; y++) {
      for (let x = 0; x <= SEGX; x++) {
        const wx = this.side < 0 ? -aspect + x * (aspect / SEGX) : x * (aspect / SEGX);
        const wy = 1 - y * this.dy;
        this.pts.push({ x: wx, y: wy, z: 0, px: wx, py: wy, pz: 0, pin: y === 0 });
      }
    }
    this.geo = new THREE.PlaneGeometry(aspect, 2, SEGX, SEGY);
    if (this.mesh) {
      this.mesh.geometry.dispose();
      this.mesh.geometry = this.geo;
    } else {
      this.mat = new THREE.MeshLambertMaterial({
        map: texture,
        color: 0x8f8f8f,
        side: THREE.DoubleSide,
      });
      this.mesh = new THREE.Mesh(this.geo, this.mat);
    }
  }
  idx(x, y) { return y * (SEGX + 1) + x; }

  setPins(p) {
    const a = this.aspect;
    const gathered = a * 0.13;
    for (let x = 0; x <= SEGX; x++) {
      const t = x / SEGX;
      let closedX, openX;
      if (this.side < 0) {
        closedX = -a + t * a;
        openX = -a - 0.05 + t * gathered;
      } else {
        closedX = t * a;
        openX = a + 0.05 - (1 - t) * gathered;
      }
      const pt = this.pts[this.idx(x, 0)];
      pt.x = openX + (closedX - openX) * p;
      pt.z = Math.sin(x * 1.15) * (0.055 + (1 - p) * 0.16);
      pt.y = 1;
      pt.px = pt.x; pt.py = pt.y; pt.pz = pt.z;
    }
  }

  step(mouse) {
    const pts = this.pts;
    const MAX_VEL = 0.035; // Жёсткое ограничение максимальной скорости точки за кадр

    for (let i = 0; i < pts.length; i++) {
      const pt = pts[i];
      if (pt.pin) continue;

      // 1. Вычисляем текущую скорость с затуханием DAMP
      let vx = (pt.x - pt.px) * DAMP;
      let vy = (pt.y - pt.py) * DAMP;
      let vz = (pt.z - pt.pz) * DAMP;

      // 2. Ограничиваем максимальную скорость (prevent blowout)
      const speed = Math.hypot(vx, vy, vz);
      if (speed > MAX_VEL) {
        const factor = MAX_VEL / speed;
        vx *= factor;
        vy *= factor;
        vz *= factor;
      }

      pt.px = pt.x; 
      pt.py = pt.y; 
      pt.pz = pt.z;

      pt.x += vx;
      pt.y += vy - GRAVITY;
      pt.z += vz;

      // 3. Плавная и естественная реакция на мышь (Hover)
      if (mouse.active) {
        const ddx = pt.x - mouse.x;
        const ddy = pt.y - mouse.y;
        const d = Math.hypot(ddx, ddy);
        const r = 0.18; // Слегка увеличен радиус мягкого взаимодействия

        if (d < r) {
          const fall = 1 - d / r;
          const f = fall * fall * mouse.force;
          const n = d || 0.0001;

          // Ослаблены и сбалансированы коэффициенты импульса
          pt.x += (ddx / n) * f * 0.004;
          pt.y += (ddy / n) * f * 0.002;
          pt.z += f * 0.006; // Уменьшен вылет вперед по Z
        }
      }
    }

    // 4. Релаксация связей (Constraint Solver)
    for (let k = 0; k < ITER; k++) {
      for (let y = 0; y <= SEGY; y++) {
        for (let x = 0; x <= SEGX; x++) {
          if (x < SEGX) this.constrain(this.idx(x, y), this.idx(x + 1, y), this.dx);
          if (y < SEGY) this.constrain(this.idx(x, y), this.idx(x, y + 1), this.dy);
        }
      }
    }
  }

  constrain(ia, ib, rest) {
    const a = this.pts[ia], b = this.pts[ib];
    const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z;
    const d = Math.sqrt(dx * dx + dy * dy + dz * dz) || 0.0001;
    const diff = (d - rest) / d * 0.48; // Небольшое ослабление коррекции для мягкости складок
    const ox = dx * diff, oy = dy * diff, oz = dz * diff;
    if (!a.pin) { a.x += ox; a.y += oy; a.z += oz; }
    if (!b.pin) { b.x -= ox; b.y -= oy; b.z -= oz; }
  }

  sync(updateNormals) {
    const pos = this.geo.attributes.position;
    for (let i = 0; i < this.pts.length; i++) {
      const pt = this.pts[i];
      pos.setXYZ(i, pt.x, pt.y, pt.z);
    }
    pos.needsUpdate = true;
    if (updateNormals) this.geo.computeVertexNormals();
  }
}

class CurtainCloth extends HTMLElement {
  connectedCallback() {
    if (this._init) return;
    this._init = true;
    this.style.display = "block";
    this.style.position = "absolute";
    this.style.inset = "0";

    this.renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, MOBILE ? 1.25 : 1.5));
    this.appendChild(this.renderer.domElement);
    Object.assign(this.renderer.domElement.style, {
      position: "absolute", inset: "0", width: "100%", height: "100%",
    });

    this.scene = new THREE.Scene();
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const key = new THREE.DirectionalLight(0xffffff, 1.05);
    key.position.set(-0.7, 0.6, 1.4);
    this.scene.add(key);
    const rim = new THREE.DirectionalLight(0xffd9f2, 0.35);
    rim.position.set(1.2, -0.3, 0.8);
    this.scene.add(rim);

    const src = this.getAttribute("texture") || "";
    const tex = new THREE.TextureLoader().load(src);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;

    this.mouse = { x: 0, y: 0, active: false, force: 0 };
    this.p = 0;
    this.aspect = 1;
    this.left = new Panel(-1, 1, tex);
    this.right = new Panel(1, 1, tex);
    this.scene.add(this.left.mesh, this.right.mesh);
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.01, 100);
    this.camera.position.z = 4;

    this.onResize = () => this.resize();
    this.onMove = (e) => {
      const r = this.getBoundingClientRect();
      const nx = ((e.clientX - r.left) / r.width) * 2 - 1;
      const ny = 1 - ((e.clientY - r.top) / r.height) * 2;
      const mx = nx * this.aspect;
      this.mouse.x = mx; 
      this.mouse.y = ny;
      this.mouse.active = true;
      
      // Сглажено накопление силы мыши (было d * 3.5 + 0.25)
      this.mouse.force = Math.min(0.6, this.mouse.force + 0.12);
    };
    this.onLeave = () => { this.mouse.active = false; };
    window.addEventListener("resize", this.onResize);
    this.addEventListener("pointermove", this.onMove);
    this.addEventListener("pointerleave", this.onLeave);
    this.resize();

    this.tick = this.tick.bind(this);
    this.raf = requestAnimationFrame(this.tick);
  }
  disconnectedCallback() {
    cancelAnimationFrame(this.raf);
    window.removeEventListener("resize", this.onResize);
  }
  resize() {
    const w = this.clientWidth || innerWidth;
    const h = this.clientHeight || innerHeight;
    this.aspect = w / h;
    this.renderer.setSize(w, h, false);
    this.camera.left = -this.aspect;
    this.camera.right = this.aspect;
    this.camera.top = 1;
    this.camera.bottom = -1;
    this.camera.updateProjectionMatrix();
    const tex = this.left.mat.map;
    this.left.build(this.aspect, tex);
    this.right.build(this.aspect, tex);
    this.left.setPins(this.p);
    this.right.setPins(this.p);
  }
  set progress(v) { this.target = Math.max(0, Math.min(1, v)); }
  get progress() { return this.p; }

  tick() {
    if (this.target === undefined) this.target = 0;
    const now = performance.now();
    const dt = Math.min(0.05, (now - (this._last || now)) / 1000);
    this._last = now;

    const r = this.getBoundingClientRect();
    if (r.bottom <= 0 || r.top >= innerHeight) { this.raf = requestAnimationFrame(this.tick); return; }

    let d = (this.target - this.p) * 1.6 * dt; // Чуть более плавная подтяжка progress (1.6 вместо 1.9)
    const MAX_STEP = 0.15 * dt; // Мягче максимальный шаг смещения шторы
    if (d > MAX_STEP) d = MAX_STEP;
    if (d < -MAX_STEP) d = -MAX_STEP;
    this.p += d;

    this.mouse.force *= 0.85; // Быстрое затухание силы мыши
    this.left.setPins(this.p);
    this.right.setPins(this.p);
    this.left.step(this.mouse);
    this.right.step(this.mouse);
    
    this._frame = (this._frame || 0) + 1;
    const updateNormals = this._frame % 2 === 0; // Нормали обновляются чаще (каждый 2-й кадр) для гладкости теней
    this.left.sync(updateNormals);
    this.right.sync(updateNormals);
    this.renderer.render(this.scene, this.camera);
    this.raf = requestAnimationFrame(this.tick);
  }
}

if (!customElements.get("curtain-cloth")) {
  customElements.define("curtain-cloth", CurtainCloth);
}

export function mountCurtain(container, textureUrl) {
  const el = document.createElement("curtain-cloth");
  el.setAttribute("texture", textureUrl);
  el.style.position = "absolute";
  el.style.inset = "0";
  container.appendChild(el);
  return el;
}
