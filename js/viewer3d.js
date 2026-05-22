// ═══════════════════════════════════════════════════════════════
// BasketCoach 3D Viewer - Three.js + RobotExpressive
// ═══════════════════════════════════════════════════════════════
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// ─── Config por drill ─────────────────────────────────────────
const DRILL_CONFIGS = {
  // MANEJO
  'dribble-alt': {
    anim: 'Idle', animSpeed: 0.8,
    cam: { pos: [2.2, 1.5, 3.0], target: [0, 1, 0] },
    ball: { type: 'dualDribble' },
    label: 'DRIBBLE ALTERNADO'
  },
  'crossover': {
    anim: 'Idle', animSpeed: 1.0,
    cam: { pos: [0, 1.6, 3.5], target: [0, 1, 0] },
    ball: { type: 'crossover' },
    label: 'CROSSOVER FRONTAL'
  },
  'between-legs': {
    anim: 'Idle', animSpeed: 1.0,
    cam: { pos: [0, 0.6, 3.8], target: [0, 0.7, 0] },
    ball: { type: 'betweenLegs' },
    label: 'ENTRE PIERNAS'
  },
  'hesitation': {
    anim: 'cycleHesitation', // procedural multi
    cam: { pos: [4, 2.5, 5], target: [0, 1, 0] },
    ball: { type: 'attached' },
    label: 'AVANCE · PAUSA · EXPLOSIÓN',
    moveCycle: 'hesitation'
  },
  // PASE
  'pase-pecho': {
    anim: 'Punch', animSpeed: 1.0,
    cam: { pos: [3.5, 2, 4], target: [0, 1.2, 0] },
    ball: { type: 'chestPass' },
    label: 'PASE DE PECHO',
    twoPlayer: true
  },
  'nolook': {
    anim: 'Punch', animSpeed: 0.9,
    cam: { pos: [3.5, 2, 4], target: [0, 1.2, 0] },
    ball: { type: 'noLook' },
    label: 'NO-LOOK PASS',
    twoPlayer: true
  },
  // PICK & ROLL
  'reconocer-bloqueo': {
    anim: 'Walking', animSpeed: 1.0,
    cam: { pos: [0, 6, 5], target: [0, 0, 0] },  // top-down
    ball: { type: 'attached' },
    label: 'PICK & ROLL · USAR EL BLOQUEO',
    moveCycle: 'pickRoll',
    extras: ['blocker', 'defender']
  },
  // DEFENSA
  'posicion-def': {
    anim: 'Idle', animSpeed: 0.6,
    cam: { pos: [3, 2, 3.5], target: [0, 1, 0] },
    ball: null,
    label: 'POSICIÓN DEFENSIVA · DESPLAZAMIENTO',
    moveCycle: 'lateralSlide'
  },
  // FINALIZACIÓN
  'layup-debil': {
    anim: 'Running', animSpeed: 1.4,
    cam: { pos: [5, 2.5, 5], target: [1, 1.5, 0] },
    ball: { type: 'layup' },
    label: 'LAYUP · CARRERA + SALTO',
    moveCycle: 'layup',
    extras: ['hoop']
  },
  'floater': {
    anim: 'Jump', animSpeed: 1.0,
    cam: { pos: [4, 2, 4.5], target: [0, 1.5, 0] },
    ball: { type: 'floater' },
    label: 'FLOATER · PARÁBOLA ALTA',
    moveCycle: 'floater',
    extras: ['hoop', 'defenderTall']
  },
  'gancho': {
    anim: 'Punch', animSpeed: 1.0,
    cam: { pos: [3.5, 1.8, 4], target: [0, 1.5, 0] },
    ball: { type: 'hook' },
    label: 'GANCHO · ARCO ALTO',
    extras: ['hoop']
  },
  'fadeaway': {
    anim: 'Jump', animSpeed: 0.9,
    cam: { pos: [4.5, 2, 4.5], target: [0, 1.5, 0] },
    ball: { type: 'fadeaway' },
    label: 'FADEAWAY · SUSPENSIÓN ATRÁS',
    moveCycle: 'fadeaway',
    extras: ['hoop', 'defender']
  },
  'timing-rebote': {
    anim: 'Jump', animSpeed: 1.2,
    cam: { pos: [4, 2.5, 5], target: [0, 2, 0] },
    ball: { type: 'rebound' },
    label: 'REBOTE · TIMING + 2 MANOS',
    extras: ['hoop']
  },
  'tape': {
    anim: 'Jump', animSpeed: 1.0,
    cam: { pos: [4, 2.5, 4.5], target: [0, 2, 0] },
    ball: { type: 'blocked' },
    label: 'TAPER · VERTICAL · TIMING',
    extras: ['hoop', 'attacker']
  },
};

const ANIMATION_FALLBACKS = {
  // si un nombre canónico no existe en el GLB, usa el más cercano
  Walking: ['Walking', 'Walk', 'walk'],
  Running: ['Running', 'Run', 'run'],
  Idle: ['Idle', 'idle'],
  Jump: ['Jump', 'WalkJump'],
  Punch: ['Punch'],
};

function resolveAnimName(actions, name) {
  const candidates = ANIMATION_FALLBACKS[name] || [name];
  for (const c of candidates) if (actions[c]) return c;
  return Object.keys(actions)[0];
}

// ─── VIEWER ───────────────────────────────────────────────────
let _viewer = null;
let _modelCache = null;

export class BasketballViewer {
  constructor(canvas) {
    this.canvas = canvas;
    this.raf = null;
    this.clock = new THREE.Clock();
    this.tElapsed = 0;
    this.currentDrillId = null;
    this.extras = [];

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas, antialias: true, alpha: true, powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = null;
    this.scene.fog = new THREE.Fog(0x0a0a0a, 8, 18);

    // Camera
    const aspect = canvas.clientWidth / canvas.clientHeight;
    this.camera = new THREE.PerspectiveCamera(40, aspect, 0.1, 50);
    this.camera.position.set(3, 1.8, 4);
    this.camera.lookAt(0, 1, 0);
    this.camTarget = new THREE.Vector3(0, 1, 0);
    this.camTargetPos = new THREE.Vector3(3, 1.8, 4);

    this._setupLights();
    this._setupCourt();
    this._setupBall();

    // Resize observer
    this._onResize = () => {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      this.renderer.setSize(w, h, false);
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', this._onResize);
  }

  _setupLights() {
    const ambient = new THREE.AmbientLight(0x404050, 1.2);
    this.scene.add(ambient);

    // Key light (orange basketball court vibe)
    const key = new THREE.DirectionalLight(0xfff3e0, 2.4);
    key.position.set(3, 6, 4);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.near = 0.5;
    key.shadow.camera.far = 20;
    key.shadow.camera.left = -4;
    key.shadow.camera.right = 4;
    key.shadow.camera.top = 5;
    key.shadow.camera.bottom = -2;
    key.shadow.bias = -0.0005;
    this.scene.add(key);

    // Rim accent (naranja basketball)
    const rim = new THREE.DirectionalLight(0xff5500, 1.5);
    rim.position.set(-4, 3, -3);
    this.scene.add(rim);

    // Fill suave
    const fill = new THREE.DirectionalLight(0x6080ff, 0.4);
    fill.position.set(-2, 2, 3);
    this.scene.add(fill);
  }

  _setupCourt() {
    // Suelo
    const floorGeo = new THREE.CircleGeometry(8, 64);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.7,
      metalness: 0.1,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Líneas de cancha (círculo decorativo + tiro libre)
    const ringMat = new THREE.LineBasicMaterial({ color: 0xff5500, transparent: true, opacity: 0.4 });
    const ringPts = [];
    for (let i = 0; i <= 64; i++) {
      const a = (i / 64) * Math.PI * 2;
      ringPts.push(new THREE.Vector3(Math.cos(a) * 2.5, 0.01, Math.sin(a) * 2.5));
    }
    const ring = new THREE.Line(new THREE.BufferGeometry().setFromPoints(ringPts), ringMat);
    this.scene.add(ring);

    // Punto central
    const centerDot = new THREE.Mesh(
      new THREE.CircleGeometry(0.12, 16),
      new THREE.MeshBasicMaterial({ color: 0xff5500 })
    );
    centerDot.rotation.x = -Math.PI / 2;
    centerDot.position.y = 0.011;
    this.scene.add(centerDot);
  }

  _setupBall() {
    const ballMat = new THREE.MeshStandardMaterial({
      color: 0xff6b00, roughness: 0.55, metalness: 0.15,
      emissive: 0xff5500, emissiveIntensity: 0.1
    });
    this.ball = new THREE.Mesh(new THREE.SphereGeometry(0.13, 24, 24), ballMat);
    this.ball.castShadow = true;
    this.ball.visible = false;
    this.scene.add(this.ball);

    // Segundo balón (para dribble alternado)
    this.ball2 = new THREE.Mesh(new THREE.SphereGeometry(0.13, 24, 24), ballMat.clone());
    this.ball2.castShadow = true;
    this.ball2.visible = false;
    this.scene.add(this.ball2);
  }

  _setupHoop() {
    if (this.hoopGroup) return;
    const g = new THREE.Group();
    // Poste
    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 3.2, 12),
      new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.6 })
    );
    post.position.set(3, 1.6, 0);
    post.castShadow = true;
    g.add(post);
    // Tablero
    const board = new THREE.Mesh(
      new THREE.BoxGeometry(1.3, 0.8, 0.05),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3, transparent: true, opacity: 0.85 })
    );
    board.position.set(2.7, 2.8, 0);
    board.castShadow = true;
    g.add(board);
    // Cuadrado del tablero
    const square = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.3, 0.06),
      new THREE.MeshBasicMaterial({ color: 0xff5500, transparent: true, opacity: 0.7 })
    );
    square.position.set(2.71, 2.65, 0);
    g.add(square);
    // Aro
    const ringGeo = new THREE.TorusGeometry(0.22, 0.018, 12, 32);
    const ring = new THREE.Mesh(
      ringGeo,
      new THREE.MeshStandardMaterial({ color: 0xff5500, roughness: 0.3, metalness: 0.8, emissive: 0xff5500, emissiveIntensity: 0.3 })
    );
    ring.position.set(2.5, 2.45, 0);
    ring.rotation.x = Math.PI / 2;
    ring.castShadow = true;
    g.add(ring);
    // Red simulada (líneas)
    const netMat = new THREE.LineBasicMaterial({ color: 0xff8c42, transparent: true, opacity: 0.5 });
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const x = Math.cos(a) * 0.22, z = Math.sin(a) * 0.22;
      const pts = [
        new THREE.Vector3(2.5 + x, 2.45, z),
        new THREE.Vector3(2.5 + x * 0.6, 2.2, z * 0.6)
      ];
      g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), netMat));
    }
    this.hoopGroup = g;
    this.scene.add(g);
  }

  _setupExtraPlayer(color, position, name) {
    const geo = new THREE.CapsuleGeometry(0.25, 0.9, 4, 8);
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.6 });
    const player = new THREE.Mesh(geo, mat);
    player.position.copy(position);
    player.castShadow = true;
    player.userData.name = name;
    this.scene.add(player);
    this.extras.push(player);
    return player;
  }

  _clearExtras() {
    this.extras.forEach(e => this.scene.remove(e));
    this.extras = [];
    if (this.hoopGroup) { this.scene.remove(this.hoopGroup); this.hoopGroup = null; }
    if (this.secondPlayer) { this.scene.remove(this.secondPlayer); this.secondPlayer = null; }
  }

  async loadModel() {
    if (_modelCache) {
      this._installModel(_modelCache);
      return;
    }
    const loader = new GLTFLoader();
    const gltf = await loader.loadAsync('models/RobotExpressive.glb');
    _modelCache = gltf;
    this._installModel(gltf);
  }

  _installModel(gltf) {
    this.model = THREE.SkeletonUtils ? THREE.SkeletonUtils.clone(gltf.scene) : gltf.scene.clone(true);
    // SkeletonUtils no está en el módulo principal — usamos clone simple
    this.model = gltf.scene;

    this.model.traverse(node => {
      if (node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
        if (node.material) {
          node.material.envMapIntensity = 0.8;
        }
      }
    });
    this.model.scale.setScalar(0.42);
    this.model.position.y = 0;
    this.scene.add(this.model);

    // Animaciones
    this.mixer = new THREE.AnimationMixer(this.model);
    this.actions = {};
    gltf.animations.forEach(clip => {
      this.actions[clip.name] = this.mixer.clipAction(clip);
    });
    this._playAnim('Idle');

    this.modelReady = true;
    if (this.pendingDrill) {
      this.setDrill(this.pendingDrill);
      this.pendingDrill = null;
    }
  }

  _playAnim(name, speed = 1.0) {
    if (!this.actions) return;
    const resolved = resolveAnimName(this.actions, name);
    if (!resolved || !this.actions[resolved]) return;
    if (this.currentAction === this.actions[resolved]) {
      this.actions[resolved].timeScale = speed;
      return;
    }
    if (this.currentAction) this.currentAction.fadeOut(0.3);
    const next = this.actions[resolved];
    next.reset();
    next.timeScale = speed;
    next.fadeIn(0.3).play();
    this.currentAction = next;
  }

  setDrill(drillId) {
    this.currentDrillId = drillId;
    if (!this.modelReady) {
      this.pendingDrill = drillId;
      return;
    }
    const cfg = DRILL_CONFIGS[drillId];
    if (!cfg) return;

    this._clearExtras();
    this.tElapsed = 0;
    this.drillCfg = cfg;

    // Animación principal
    this._playAnim(cfg.anim || 'Idle', cfg.animSpeed || 1.0);

    // Cámara objetivo
    if (cfg.cam) {
      this.camTargetPos.set(...cfg.cam.pos);
      this.camTarget.set(...cfg.cam.target);
    }

    // Extras
    if (cfg.extras) {
      cfg.extras.forEach(e => {
        if (e === 'hoop') this._setupHoop();
        if (e === 'defender') this._setupExtraPlayer(0x555555, new THREE.Vector3(0.9, 0.7, -0.2), 'defender');
        if (e === 'defenderTall') this._setupExtraPlayer(0x555555, new THREE.Vector3(0.8, 0.95, 0), 'defenderTall');
        if (e === 'attacker') this._setupExtraPlayer(0xfafafa, new THREE.Vector3(-0.6, 0.7, 0), 'attacker');
        if (e === 'blocker') this._setupExtraPlayer(0xff8c42, new THREE.Vector3(0.4, 0.7, -0.4), 'blocker');
      });
    }

    // Ball visibility
    this.ball.visible = !!cfg.ball;
    this.ball2.visible = cfg.ball && cfg.ball.type === 'dualDribble';
  }

  _updateBall(t) {
    if (!this.drillCfg || !this.drillCfg.ball) return;
    const type = this.drillCfg.ball.type;
    const cycle = 1.4; // seconds
    const p = (t % cycle) / cycle;

    switch (type) {
      case 'dualDribble': {
        const bounceA = Math.abs(Math.sin(p * Math.PI));
        const bounceB = Math.abs(Math.sin((p + 0.5) * Math.PI));
        this.ball.position.set(-0.3, 0.13 + bounceA * 0.55, 0.4);
        this.ball2.position.set(0.3, 0.13 + bounceB * 0.55, 0.4);
        break;
      }
      case 'crossover': {
        const x = Math.sin(p * Math.PI * 2) * 0.5;
        const sub = (p * 2) % 1;
        const bounce = Math.abs(Math.sin(sub * Math.PI));
        this.ball.position.set(x, 0.13 + bounce * 0.45, 0.4);
        break;
      }
      case 'betweenLegs': {
        // figura 8 entre piernas
        const ang = p * Math.PI * 2;
        this.ball.position.set(Math.sin(ang) * 0.25, 0.4 + Math.abs(Math.sin(ang * 2)) * 0.2, Math.cos(ang) * 0.15);
        break;
      }
      case 'chestPass': {
        // de jugador 1 (-1) a jugador 2 (+1)
        const pp = (t % 2) / 2;
        const x = pp < 0.5 ? -0.5 + pp * 3 : 1.0;
        this.ball.position.set(x, 1.2, 0.3);
        this.ball.visible = pp < 0.6;
        break;
      }
      case 'noLook': {
        const pp = (t % 2.4) / 2.4;
        const x = -0.5 + pp * 1.5;
        const arc = Math.sin(pp * Math.PI) * 0.4;
        this.ball.position.set(x, 1.2 + arc, 0.5 - pp * 0.6);
        this.ball.visible = pp < 0.7;
        break;
      }
      case 'layup': {
        // Sincronizado con moveCycle layup
        const cyc = (t % 3.0) / 3.0;
        if (cyc < 0.6) {
          // siguiendo al jugador
          const pp = cyc / 0.6;
          this.ball.position.set(-1.5 + pp * 3, 0.6 + Math.sin(pp * 30) * 0.05, 0);
        } else if (cyc < 0.85) {
          // arc al aro
          const pp = (cyc - 0.6) / 0.25;
          this.ball.position.set(1.5 + pp * 1.0, 1.5 + Math.sin(pp * Math.PI) * 0.8, 0);
        } else {
          this.ball.visible = false;
        }
        if (cyc < 0.85) this.ball.visible = true;
        break;
      }
      case 'floater': {
        const cyc = (t % 2.8) / 2.8;
        if (cyc < 0.3) {
          this.ball.position.set(-0.8, 1.3, 0);
        } else if (cyc < 0.75) {
          const pp = (cyc - 0.3) / 0.45;
          // parábola ALTA (floater = arco alto)
          this.ball.position.set(-0.8 + pp * 3.3, 1.3 + Math.sin(pp * Math.PI) * 1.8, 0);
        } else {
          this.ball.visible = false;
        }
        if (cyc < 0.75) this.ball.visible = true;
        break;
      }
      case 'hook': {
        const cyc = (t % 2.4) / 2.4;
        if (cyc < 0.5) {
          // brazo girando con balón (simulado: gira en círculo alrededor del cuerpo)
          const ang = cyc * Math.PI * 2;
          this.ball.position.set(Math.sin(ang) * 0.4, 1.3 + Math.cos(ang) * 0.4, 0);
        } else if (cyc < 0.85) {
          const pp = (cyc - 0.5) / 0.35;
          this.ball.position.set(-0.4 + pp * 2.9, 1.7 + Math.sin(pp * Math.PI) * 1.0, 0);
        } else {
          this.ball.visible = false;
        }
        if (cyc < 0.85) this.ball.visible = true;
        break;
      }
      case 'fadeaway': {
        const cyc = (t % 3.2) / 3.2;
        if (cyc < 0.4) {
          this.ball.position.set(0, 1.3, 0.3);
        } else if (cyc < 0.7) {
          const pp = (cyc - 0.4) / 0.3;
          this.ball.position.set(-pp * 0.4, 1.3 + pp * 0.4, 0.3);
        } else if (cyc < 0.95) {
          const pp = (cyc - 0.7) / 0.25;
          this.ball.position.set(-0.4 + pp * 2.9, 1.7 + Math.sin(pp * Math.PI) * 0.5, 0);
        } else {
          this.ball.visible = false;
        }
        if (cyc < 0.95) this.ball.visible = true;
        break;
      }
      case 'rebound': {
        const cyc = (t % 2.4) / 2.4;
        if (cyc < 0.4) {
          // balón sale del aro
          const pp = cyc / 0.4;
          this.ball.position.set(2.5 - pp * 1.5, 2.45 + Math.sin(pp * Math.PI) * 0.3, 0);
        } else if (cyc < 0.75) {
          const pp = (cyc - 0.4) / 0.35;
          this.ball.position.set(1 - pp * 1, 2.3 - pp * 0.8, 0);
        } else if (cyc < 0.9) {
          this.ball.position.set(0, 1.6, 0);
        } else {
          this.ball.visible = false;
        }
        if (cyc < 0.9) this.ball.visible = true;
        break;
      }
      case 'blocked': {
        const cyc = (t % 2.6) / 2.6;
        if (cyc < 0.3) {
          this.ball.position.set(-0.6, 1.4 + cyc * 0.5, 0);
        } else if (cyc < 0.45) {
          const pp = (cyc - 0.3) / 0.15;
          this.ball.position.set(-0.6 + pp * 0.3, 1.55 + pp * 0.3, 0);
        } else {
          // tras taper, cae
          const pp = (cyc - 0.45) / 0.55;
          this.ball.position.set(-0.3, 1.85 - pp * 1.85, 0);
        }
        this.ball.visible = true;
        break;
      }
      case 'attached': {
        // balón pegado al modelo
        if (this.model) {
          this.ball.position.copy(this.model.position);
          this.ball.position.y += 0.7;
          this.ball.position.x += 0.3;
        }
        break;
      }
    }

    // Rotación del balón (siempre)
    if (this.ball.visible) {
      this.ball.rotation.x = t * 5;
      this.ball.rotation.z = t * 3;
    }
    if (this.ball2.visible) {
      this.ball2.rotation.x = t * 5;
      this.ball2.rotation.z = -t * 3;
    }
  }

  _updateModelMovement(t) {
    if (!this.model || !this.drillCfg) return;
    const move = this.drillCfg.moveCycle;
    if (!move) {
      this.model.position.x = 0;
      this.model.position.z = 0;
      this.model.rotation.y = Math.PI; // mirando a cámara
      return;
    }

    switch (move) {
      case 'hesitation': {
        const cyc = (t % 4) / 4;
        if (cyc < 0.4) {
          // avance
          this.model.position.x = -1.5 + (cyc / 0.4) * 1.5;
          this._playAnim('Walking', 1.0);
        } else if (cyc < 0.55) {
          // pausa
          this.model.position.x = 0;
          this._playAnim('Idle', 1.0);
        } else if (cyc < 0.95) {
          // explosión
          const pp = (cyc - 0.55) / 0.4;
          this.model.position.x = pp * pp * 1.5;
          this._playAnim('Running', 1.4);
        } else {
          this.model.position.x = -1.5;
        }
        this.model.rotation.y = Math.PI / 2; // perfil
        break;
      }
      case 'pickRoll': {
        const cyc = (t % 4) / 4;
        if (cyc < 0.5) {
          this.model.position.x = -1.5 + cyc * 2;
          this.model.position.z = 0.8;
          this._playAnim('Walking', 1.0);
        } else {
          const pp = (cyc - 0.5) / 0.5;
          this.model.position.x = -0.5 + pp * 1.8;
          this.model.position.z = 0.8 - pp * 0.5;
          this._playAnim('Running', 1.2);
        }
        this.model.rotation.y = Math.PI / 2;
        break;
      }
      case 'lateralSlide': {
        const cyc = (t % 2.4) / 2.4;
        this.model.position.x = Math.sin(cyc * Math.PI * 2) * 0.8;
        this.model.rotation.y = Math.PI;
        this._playAnim('Idle', 0.6);
        break;
      }
      case 'layup': {
        const cyc = (t % 3.0) / 3.0;
        if (cyc < 0.5) {
          // carrera
          this.model.position.x = -1.5 + cyc * 4;
          this.model.position.y = 0;
          this._playAnim('Running', 1.4);
        } else if (cyc < 0.7) {
          // salto
          const pp = (cyc - 0.5) / 0.2;
          this.model.position.x = 0.5 + pp * 0.6;
          this.model.position.y = Math.sin(pp * Math.PI) * 0.5;
          this._playAnim('Jump', 1.0);
        } else if (cyc < 0.95) {
          const pp = (cyc - 0.7) / 0.25;
          this.model.position.x = 1.1 + pp * 0.3;
          this.model.position.y = Math.sin(((cyc - 0.5) / 0.2) * Math.PI) * 0.5 * (1 - pp);
          this._playAnim('Idle', 1.0);
        } else {
          this.model.position.set(-1.5, 0, 0);
        }
        this.model.rotation.y = Math.PI / 2;
        break;
      }
      case 'floater': {
        const cyc = (t % 2.8) / 2.8;
        if (cyc < 0.3) {
          this.model.position.set(-0.8, 0, 0);
          this._playAnim('Idle', 1.0);
        } else if (cyc < 0.6) {
          const pp = (cyc - 0.3) / 0.3;
          this.model.position.x = -0.8 + pp * 0.2;
          this.model.position.y = Math.sin(pp * Math.PI) * 0.3;
          this._playAnim('Jump', 1.0);
        } else {
          this.model.position.set(-0.6, 0, 0);
          this._playAnim('Idle', 1.0);
        }
        this.model.rotation.y = Math.PI / 2;
        break;
      }
      case 'fadeaway': {
        const cyc = (t % 3.2) / 3.2;
        if (cyc < 0.4) {
          this.model.position.set(0, 0, 0.3);
          this._playAnim('Idle', 1.0);
        } else if (cyc < 0.7) {
          const pp = (cyc - 0.4) / 0.3;
          this.model.position.x = -pp * 0.4;
          this.model.position.y = Math.sin(pp * Math.PI) * 0.4;
          this.model.position.z = 0.3 - pp * 0.2;
          this._playAnim('Jump', 1.0);
        } else if (cyc < 0.9) {
          const pp = (cyc - 0.7) / 0.2;
          this.model.position.x = -0.4 + pp * 0.2;
          this.model.position.y = 0;
          this._playAnim('Idle', 1.0);
        }
        this.model.rotation.y = Math.PI / 2;
        break;
      }
    }
  }

  _updateCamera(delta) {
    // smooth lerp hacia targets
    this.camera.position.lerp(this.camTargetPos, Math.min(delta * 2, 1));
    const currentTarget = new THREE.Vector3();
    this.camera.getWorldDirection(currentTarget);
    const want = new THREE.Vector3().subVectors(this.camTarget, this.camera.position).normalize();
    // suaviza el look-at:
    this.camera.lookAt(this.camTarget);

    // Auto-orbit suave para drama
    if (this.drillCfg && !this.drillCfg.moveCycle) {
      const orbitOffset = Math.sin(this.tElapsed * 0.15) * 0.3;
      const targetWithOrbit = this.camTargetPos.clone();
      targetWithOrbit.x += orbitOffset;
      this.camera.position.lerp(targetWithOrbit, Math.min(delta * 2, 1));
      this.camera.lookAt(this.camTarget);
    }
  }

  start() {
    if (this.raf) return;
    const animate = () => {
      const delta = this.clock.getDelta();
      this.tElapsed += delta;
      if (this.mixer) this.mixer.update(delta);
      this._updateBall(this.tElapsed);
      this._updateModelMovement(this.tElapsed);
      this._updateCamera(delta);
      this.renderer.render(this.scene, this.camera);
      this.raf = requestAnimationFrame(animate);
    };
    this.raf = requestAnimationFrame(animate);
  }

  stop() {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = null;
  }

  destroy() {
    this.stop();
    window.removeEventListener('resize', this._onResize);
    this.renderer.dispose();
    this.scene.traverse(obj => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
        else obj.material.dispose();
      }
    });
  }
}

// ─── API pública ──────────────────────────────────────────────
export async function mount3DViewer(canvas, drillId) {
  if (_viewer) _viewer.destroy();
  _viewer = new BasketballViewer(canvas);
  await _viewer.loadModel();
  _viewer.setDrill(drillId);
  _viewer.start();
  return _viewer;
}

export function stop3DViewer() {
  if (_viewer) {
    _viewer.stop();
    _viewer.destroy();
    _viewer = null;
  }
}

export function changeDrill(drillId) {
  if (_viewer) {
    _viewer.setDrill(drillId);
  }
}
