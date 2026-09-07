import * as THREE from "https://esm.sh/three@0.160.0";

const MOBILE = typeof matchMedia !== "undefined" && matchMedia("(max-width: 700px)").matches;
const IS_SAFARI = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

const SEGX = 20;
const SEGY = 13;
const ITER = 5;
const DAMP = 0.935;
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

    // Запас захлёста за края экрана для Safari (overhang = 0.2)
    const extra = 0.2;
    const gathered = (aspect + extra) * 0.22;

    for (let y = 0; y <= SEGY; y++) {
      for (let x = 0; x <= SEGX; x++) {
        const t = x / SEGX;
        let wx;
        if (this.side < 0) {
          // Выдвигаем левый край ЗА видимую границу (-aspect - extra)
          wx = (-aspect - extra) + t * gathered;
        } else {
          // Выдвигаем правый край ЗА видимую границу (+aspect + extra)
          wx = (aspect + extra) - (1 - t) * gathered;
        }
        const wy = 1 - y * this.dy;
        this.pts.push({ x: wx, y: wy, z: 0, px: wx, py: wy, pz: 0, pin: y === 0 });
      }
    }

    // Геометрия делается чуть шире для запаса в Safari
    this.geo = new THREE.PlaneGeometry(aspect + extra, 2, SEGX, SEGY);
    if (this.mesh) {
      this.mesh.geometry.dispose();
      this.mesh.geometry = this.geo;
    } else {
      this.mat = new THREE.MeshLambertMaterial({
        map: texture,
        color: 0x8f8f8f,
        side: THREE.DoubleSide,
        transparent: false, // Отключаем прозрачность материала, чтобы Safari не срезал альфа-канал
      });
      this.mesh = new THREE.Mesh(this.geo, this.mat);
    }
  }

  idx(x, y) { return y * (SEGX + 1) + x; }

  setPins(p) {
    const a = this.aspect;
    const extra = 0.2; // Гарантированный заступ за границы
    const gathered = (a + extra) * 0.22;

    for (let x = 0; x <= SEGX; x++) {
      const t = x / SEGX;
      let closedX, openX;
      if (this.side < 0) {
        closedX = (-a - extra) + t * (a + extra);
        // Жесткая фиксация левого верхнего угла ГЛУБОКО за экраном
        openX = (-a - extra) + t * gathered;
      } else {
        closedX = t * (a + extra);
        // Жесткая фиксация правого верхнего угла ГЛУБОКО за экраном
        openX = (a + extra) - (1 - t) * gathered;
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
    const MAX_VEL = 0.035;

    for (let i = 0; i < pts.length; i++) {
      const pt = pts[i];
      if (pt.pin) continue;

      let vx = (pt.x - pt.px) * DAMP;
      let vy = (pt.y - pt.py) * DAMP;
      let vz = (pt.z - pt.pz) * DAMP;

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

      if (mouse && mouse.active) {
        const ddx = pt.x - mouse.x;
        const ddy = pt.y - mouse.y;
        const d = Math.hypot(ddx, ddy);
        const r = 0.11;

        if (d < r) {
          const fall = 1 - d / r;
          const f = fall * fall * mouse.force;
          const n = d || 0.0001;

          pt.x += (ddx / n) * f * 0.004;
          pt.y += (ddy / n) * f * 0.002;
          pt.z += f * 0.006;
        }
      }
    }

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
    const diff = (d - rest) / d * 0.48;
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

    // Настройки рендера под специфику Safari
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: false, 
      alpha: true,
      premultipliedAlpha: false, // Отключает баг с темным/срезанным краем в Safari WebGL
      powerPreference: "high-performance"
    });
    
    // В Safari держим DPR строго 1.25-1.5, чтобы избежать подёргивания сетки
    const maxDpr = IS_SAFARI ? 1.25 : (MOBILE ? 1.25 : 1.5);
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, maxDpr));
    
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
    const tex = new THREE.TextureLoader().load(src, () => {
      // Когда текстура загрузится в Safari, принудительно пересчитываем нормали
      if (this.left) this.left.sync(true);
      if (this.right) this.right.sync(true);
    });
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
      // a scroll swipe on iOS Safari also fires pointermove for the touch pointer, so
      // without this check every upward scroll registered as the user dragging a finger
      // across the cloth — that's what was reading as the curtain "flying apart" on scroll
      if (e.pointerType === "touch") return;
      const r = this.getBoundingClientRect();
      const nx = ((e.clientX - r.left) / r.width) * 2 - 1;
      const ny = 1 - ((e.clientY - r.top) / r.height) * 2;
      const mx = nx * this.aspect;
      // force scales with how far the pointer actually moved this frame, not with how many
      // pointermove events fired — a fixed per-event increment lets a burst of events (fast
      // swipe, high-polling-rate mouse) pump force to max almost instantly regardless of
      // whether anything actually moved
      const d = Math.hypot(mx - this.mouse.x, ny - this.mouse.y);
      this.mouse.x = mx;
      this.mouse.y = ny;
      this.mouse.active = true;
      this.mouse.force = Math.min(0.6, this.mouse.force + d * 3.5 + 0.25);
    };
    this.onLeave = () => { this.mouse.active = false; };
    window.addEventListener("resize", this.onResize);
    this.addEventListener("pointermove", this.onMove);
    this.addEventListener("pointerleave", this.onLeave);
    
    this.resize();

    // Прогрев симуляции
    for (let i = 0; i < 40; i++) {
      this.left.setPins(this.p);
      this.right.setPins(this.p);
      this.left.step({ active: false });
      this.right.step({ active: false });
    }
    this.left.sync(true);
    this.right.sync(true);

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
    
    // В Камере делаем небольшой заступ за пределы (-aspect - 0.2), чтобы Safari физически не мог подрезать край
    const extra = 0.2;
    this.camera.left = -this.aspect - extra;
    this.camera.right = this.aspect + extra;
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

    let d = (this.target - this.p) * 1.6 * dt;
    const MAX_STEP = 0.15 * dt;
    if (d > MAX_STEP) d = MAX_STEP;
    if (d < -MAX_STEP) d = -MAX_STEP;
    this.p += d;

    this.mouse.force *= 0.85;
    this.left.setPins(this.p);
    this.right.setPins(this.p);
    this.left.step(this.mouse);
    this.right.step(this.mouse);

    this._frame = (this._frame || 0) + 1;
    const updateNormals = this._frame % 2 === 0;
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
