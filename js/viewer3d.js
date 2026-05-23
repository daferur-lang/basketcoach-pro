// ═══════════════════════════════════════════════════════════════
// BasketCoach 3D Viewer - Three.js + Xbot (Mixamo humano)
// ═══════════════════════════════════════════════════════════════
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// ─── Config por drill ─────────────────────────────────────────
// Cámaras: [posX, posY, posZ, lookAtX, lookAtY, lookAtZ]
// Las distancias Z son grandes (5-9m) para que se vea el jugador entero
// LookAt Y = 1.0 = altura central del torso (jugador ~1.8m)
const DRILL_CONFIGS = {
  'dribble-alt': { anim: 'idle',  cam: [3.5, 2.5, 6.0, 0, 1.0, 0], ball: 'dualDribble', label: 'DRIBBLE ALTERNADO' },
  'crossover':   { anim: 'idle',  cam: [0,   2.5, 6.5, 0, 1.0, 0], ball: 'crossover',   label: 'CROSSOVER FRONTAL' },
  'between-legs':{ anim: 'idle',  cam: [0,   2.0, 6.5, 0, 0.9, 0], ball: 'betweenLegs', label: 'ENTRE PIERNAS' },
  'hesitation':  { anim: 'multi', cam: [5.5, 3.5, 6.5, 0, 1.0, 0], ball: 'attached',    label: 'AVANCE · PAUSA · EXPLOSIÓN', moveCycle:'hesitation' },

  'pase-pecho':  { anim: 'idle',  cam: [4.5, 3.0, 6.5, 1.0, 1.2, 0], ball: 'chestPass', label: 'PASE DE PECHO', extras:['secondPlayer'] },
  'nolook':      { anim: 'idle',  cam: [4.5, 3.0, 6.5, 1.0, 1.2, 0], ball: 'noLook',    label: 'NO-LOOK PASS',  extras:['secondPlayer'] },

  'reconocer-bloqueo':{ anim:'multi', cam:[0, 9, 5, 0, 0, 0], ball:'attached', label:'PICK & ROLL', moveCycle:'pickRoll', extras:['blocker','defender'] },

  'posicion-def':{ anim:'idle', cam:[4.5, 2.8, 5.5, 0, 1.0, 0], ball:null, label:'POSICIÓN DEFENSIVA', moveCycle:'lateralSlide' },

  'layup-debil': { anim:'multi', cam:[5.5, 3.2, 6.5, 1.2, 1.4, 0], ball:'layup', label:'LAYUP', moveCycle:'layup', extras:['hoop'] },
  'floater':     { anim:'multi', cam:[5, 3.0, 6.5, 0.5, 1.4, 0], ball:'floater', label:'FLOATER', moveCycle:'floater', extras:['hoop','defenderTall'] },
  'gancho':      { anim:'idle',  cam:[5, 3.0, 6.5, 0.3, 1.4, 0], ball:'hook',  label:'GANCHO', moveCycle:'hook', extras:['hoop'] },
  'fadeaway':    { anim:'multi', cam:[5.5, 3.0, 6.5, 0, 1.4, 0], ball:'fadeaway', label:'FADEAWAY', moveCycle:'fadeaway', extras:['hoop','defender'] },
  'timing-rebote':{anim:'multi', cam:[5.5, 3.5, 6.5, 0, 1.8, 0], ball:'rebound', label:'REBOTE', moveCycle:'rebound', extras:['hoop'] },
  'tape':        { anim:'multi', cam:[5, 3.2, 6.5, 0, 1.8, 0], ball:'blocked', label:'TAPER', moveCycle:'tape', extras:['hoop','attacker'] },
};

let _viewer = null;
let _modelCache = null;

export class BasketballViewer {
  constructor(canvas) {
    this.canvas = canvas;
    this.raf = null;
    this.clock = new THREE.Clock();
    this.tElapsed = 0;
    this.extras = [];
    this.bones = {};
    this.boneRotOffsets = {};  // overrides procedurales

    this.renderer = new THREE.WebGLRenderer({
      canvas, antialias: true, alpha: true, powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;

    this.scene = new THREE.Scene();
    this.scene.background = null;
    this.scene.fog = new THREE.Fog(0x0a0a0a, 6, 16);

    const aspect = canvas.clientWidth / canvas.clientHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
    this.camera.position.set(4, 2.5, 6);
    this.camera.lookAt(0, 1, 0);
    this.camTarget = new THREE.Vector3(0, 1, 0);
    this.camTargetPos = new THREE.Vector3(3, 1.8, 4);
    this.camLookAt = new THREE.Vector3(0, 1, 0);
    this.camCurrentLook = new THREE.Vector3(0, 1, 0);

    this._setupLights();
    this._setupCourt();
    this._setupBall();

    this._onResize = () => {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      this.renderer.setSize(w, h, false);
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', this._onResize);
  }

  _setupLights() {
    // Ambient potente
    this.scene.add(new THREE.AmbientLight(0xffffff, 1.8));

    // Hemisphere light (cielo arriba, suelo abajo) para iluminación natural
    const hemi = new THREE.HemisphereLight(0xfff5e0, 0x222633, 1.2);
    hemi.position.set(0, 5, 0);
    this.scene.add(hemi);

    // Key light frontal-derecha (donde está la cámara)
    const key = new THREE.DirectionalLight(0xffffff, 3.5);
    key.position.set(4, 6, 6);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.near = 0.5;
    key.shadow.camera.far = 22;
    key.shadow.camera.left = -5; key.shadow.camera.right = 5;
    key.shadow.camera.top = 6; key.shadow.camera.bottom = -2;
    key.shadow.bias = -0.0005;
    this.scene.add(key);

    // Rim light (detrás) — naranja basketball para borde
    const rim = new THREE.DirectionalLight(0xff7733, 2.0);
    rim.position.set(-3, 3, -4);
    this.scene.add(rim);

    // Fill suave azulado izquierda
    const fill = new THREE.DirectionalLight(0x88aaff, 0.9);
    fill.position.set(-3, 2, 3);
    this.scene.add(fill);
  }

  _setupCourt() {
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.75, metalness: 0.05 });
    const floor = new THREE.Mesh(new THREE.CircleGeometry(8, 64), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // círculo central
    const ringMat = new THREE.LineBasicMaterial({ color: 0xff5500, transparent: true, opacity: 0.35 });
    const pts = [];
    for (let i = 0; i <= 64; i++) {
      const a = (i / 64) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * 2.0, 0.01, Math.sin(a) * 2.0));
    }
    this.scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), ringMat));

    const dot = new THREE.Mesh(new THREE.CircleGeometry(0.1, 16), new THREE.MeshBasicMaterial({ color: 0xff5500 }));
    dot.rotation.x = -Math.PI / 2;
    dot.position.y = 0.012;
    this.scene.add(dot);
  }

  _setupBall() {
    const ballMat = new THREE.MeshStandardMaterial({
      color: 0xff6b00, roughness: 0.55, metalness: 0.15,
      emissive: 0xff5500, emissiveIntensity: 0.15
    });
    // Balón real de basketball: ~24cm de diámetro → radio 0.12m
    // Pero en proporción visual queda mejor un pelín más pequeño (0.11)
    this.ball = new THREE.Mesh(new THREE.SphereGeometry(0.11, 32, 32), ballMat);
    this.ball.castShadow = true;
    this.ball.visible = false;
    this.scene.add(this.ball);

    this.ball2 = new THREE.Mesh(new THREE.SphereGeometry(0.11, 32, 32), ballMat.clone());
    this.ball2.castShadow = true;
    this.ball2.visible = false;
    this.scene.add(this.ball2);
  }

  _setupHoop() {
    if (this.hoopGroup) return;
    const g = new THREE.Group();
    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 3.2, 12),
      new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.5 })
    );
    post.position.set(3, 1.6, 0);
    post.castShadow = true;
    g.add(post);

    const board = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 0.85, 0.05),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.25, transparent: true, opacity: 0.92, side: THREE.DoubleSide })
    );
    board.position.set(2.7, 2.85, 0);
    board.castShadow = true;
    g.add(board);

    const square = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.3, 0.06),
      new THREE.MeshBasicMaterial({ color: 0xff5500, transparent: true, opacity: 0.6 })
    );
    square.position.set(2.71, 2.7, 0);
    g.add(square);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.22, 0.02, 12, 32),
      new THREE.MeshStandardMaterial({ color: 0xff5500, roughness: 0.3, metalness: 0.85, emissive: 0xff5500, emissiveIntensity: 0.4 })
    );
    ring.position.set(2.5, 2.5, 0);
    ring.rotation.x = Math.PI / 2;
    ring.castShadow = true;
    g.add(ring);

    // red
    const netMat = new THREE.LineBasicMaterial({ color: 0xff8c42, transparent: true, opacity: 0.55 });
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const x = Math.cos(a) * 0.22, z = Math.sin(a) * 0.22;
      const pts = [
        new THREE.Vector3(2.5 + x, 2.5, z),
        new THREE.Vector3(2.5 + x * 0.55, 2.25, z * 0.55)
      ];
      g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), netMat));
    }
    this.hoopGroup = g;
    this.scene.add(g);
  }

  _setupExtraPlayer(color, position, name, scale = 1.0) {
    // Stick figure simple (capsula como cuerpo)
    const g = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.18 * scale, 0.7 * scale, 4, 8),
      new THREE.MeshStandardMaterial({ color, roughness: 0.6 })
    );
    body.position.y = 0.7 * scale;
    body.castShadow = true;
    g.add(body);
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.15 * scale, 16, 16),
      new THREE.MeshStandardMaterial({ color, roughness: 0.6 })
    );
    head.position.y = 1.35 * scale;
    head.castShadow = true;
    g.add(head);
    g.position.copy(position);
    g.userData.name = name;
    this.scene.add(g);
    this.extras.push(g);
    return g;
  }

  _setupSecondPlayer() {
    // Otro modelo clonado para drills de pase
    if (!_modelCache || this.secondPlayer) return;
    const second = _modelCache.scene.clone(true);
    second.scale.setScalar(this.modelScale);
    second.position.set(2.0, 0, 0);
    second.rotation.y = -Math.PI / 2;
    second.traverse(n => { if (n.isMesh) { n.castShadow = true; n.receiveShadow = true; } });
    this.scene.add(second);
    this.extras.push(second);
    this.secondPlayer = second;
  }

  _clearExtras() {
    this.extras.forEach(e => this.scene.remove(e));
    this.extras = [];
    if (this.hoopGroup) { this.scene.remove(this.hoopGroup); this.hoopGroup = null; }
    this.secondPlayer = null;
  }

  async loadModel() {
    if (_modelCache) {
      this._installModel(_modelCache);
      return;
    }
    const loader = new GLTFLoader();
    const gltf = await loader.loadAsync('models/Xbot.glb');
    _modelCache = gltf;
    this._installModel(gltf);
  }

  _installModel(gltf) {
    this.model = gltf.scene;

    // Xbot de three.js viene en metros, escala 1.0 = altura natural (~1.8m)
    // Sin auto-bbox que a veces falla con skinned meshes
    this.modelScale = 1.0;
    this.model.scale.setScalar(this.modelScale);
    this.model.position.set(0, 0, 0);

    // DIAGNÓSTICO: medir altura real para ajustar cámara si hace falta
    requestAnimationFrame(() => {
      const bbox = new THREE.Box3().setFromObject(this.model);
      const size = new THREE.Vector3();
      bbox.getSize(size);
      this.modelHeight = size.y;
      // Si el modelo es demasiado grande (>3m) o pequeño (<0.5m), corrige
      if (size.y > 3) {
        this.modelScale = 1.8 / size.y;
        this.model.scale.setScalar(this.modelScale);
      } else if (size.y < 0.5 && size.y > 0) {
        this.modelScale = 1.8 / size.y;
        this.model.scale.setScalar(this.modelScale);
      }
    });

    this.model.traverse(node => {
      if (node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
        if (node.material) node.material.envMapIntensity = 0.7;
      }
      if (node.isBone) this.bones[node.name] = node;
    });

    this.scene.add(this.model);

    // animaciones
    this.mixer = new THREE.AnimationMixer(this.model);
    this.actions = {};
    gltf.animations.forEach(clip => {
      this.actions[clip.name] = this.mixer.clipAction(clip);
    });
    this._playAction('idle');

    this.modelReady = true;
    if (this.pendingDrill) {
      this.setDrill(this.pendingDrill);
      this.pendingDrill = null;
    }
  }

  _playAction(name, speed = 1.0, fade = 0.3) {
    if (!this.actions || !this.actions[name]) return;
    const next = this.actions[name];
    if (this.currentAction === next) {
      next.timeScale = speed;
      return;
    }
    if (this.currentAction) this.currentAction.fadeOut(fade);
    next.reset();
    next.timeScale = speed;
    next.fadeIn(fade).play();
    this.currentAction = next;
  }

  setDrill(drillId) {
    if (!this.modelReady) {
      this.pendingDrill = drillId;
      this.currentDrillId = drillId;
      return;
    }
    const cfg = DRILL_CONFIGS[drillId];
    if (!cfg) return;

    this._clearExtras();
    this.tElapsed = 0;
    this.drillCfg = cfg;
    this.currentDrillId = drillId;
    this.boneRotOffsets = {};

    // Cámara
    this.camTargetPos.set(cfg.cam[0], cfg.cam[1], cfg.cam[2]);
    this.camLookAt.set(cfg.cam[3], cfg.cam[4], cfg.cam[5]);

    // Animación
    if (cfg.anim !== 'multi') {
      this._playAction(cfg.anim || 'idle');
    }

    // Extras
    if (cfg.extras) {
      cfg.extras.forEach(e => {
        if (e === 'hoop') this._setupHoop();
        if (e === 'defender') this._setupExtraPlayer(0x444444, new THREE.Vector3(0.9, 0, -0.2), 'defender');
        if (e === 'defenderTall') this._setupExtraPlayer(0x444444, new THREE.Vector3(0.8, 0, 0), 'defenderTall', 1.15);
        if (e === 'attacker') this._setupExtraPlayer(0x707070, new THREE.Vector3(-0.6, 0, 0), 'attacker');
        if (e === 'blocker') this._setupExtraPlayer(0xff8c42, new THREE.Vector3(0.4, 0, -0.4), 'blocker');
        if (e === 'secondPlayer') this._setupSecondPlayer();
      });
    }

    // Ball visibility
    this.ball.visible = !!cfg.ball;
    this.ball2.visible = cfg.ball === 'dualDribble';
  }

  _updateModel(t) {
    if (!this.model || !this.drillCfg) return;
    const cfg = this.drillCfg;

    // Default position - mirando a cámara
    // Xbot por defecto mira hacia -Z; rotation PI lo gira para mirar +Z (cámara)
    if (!cfg.moveCycle) {
      this.model.position.set(0, 0, 0);
      this.model.rotation.y = Math.PI;
      return;
    }

    switch (cfg.moveCycle) {
      case 'hesitation': {
        const p = (t % 4) / 4;
        this.model.rotation.y = Math.PI / 2; // perfil
        if (p < 0.4) {
          this.model.position.set(-1.5 + (p / 0.4) * 1.5, 0, 0);
          this._playAction('walk');
        } else if (p < 0.55) {
          this.model.position.set(0, 0, 0);
          this._playAction('idle');
        } else if (p < 0.95) {
          const pp = (p - 0.55) / 0.4;
          this.model.position.set(pp * pp * 1.5, 0, 0);
          this._playAction('run', 1.3);
        } else {
          this.model.position.set(-1.5, 0, 0);
        }
        break;
      }
      case 'pickRoll': {
        const p = (t % 4) / 4;
        this.model.rotation.y = Math.PI / 2;
        if (p < 0.5) {
          this.model.position.set(-1.5 + p * 2, 0, 0.8);
          this._playAction('walk');
        } else {
          const pp = (p - 0.5) / 0.5;
          this.model.position.set(-0.5 + pp * 1.8, 0, 0.8 - pp * 0.6);
          this._playAction('run', 1.2);
        }
        break;
      }
      case 'lateralSlide': {
        const p = (t % 2.4) / 2.4;
        this.model.position.set(Math.sin(p * Math.PI * 2) * 0.7, 0, 0);
        this.model.rotation.y = Math.PI;
        this._playAction('idle');
        // postura defensiva: cuerpo más bajo (sneak_pose si está)
        if (this.actions.sneak_pose) this._playAction('sneak_pose');
        break;
      }
      case 'layup': {
        const p = (t % 3.2) / 3.2;
        this.model.rotation.y = Math.PI / 2 - 0.2;
        if (p < 0.5) {
          this.model.position.set(-1.7 + p * 4, 0, 0);
          this._playAction('run', 1.4);
        } else if (p < 0.7) {
          const pp = (p - 0.5) / 0.2;
          this.model.position.set(0.3 + pp * 0.5, Math.sin(pp * Math.PI) * 0.7, 0);
          this._playAction('run', 0.5); // jumpando
          // brazos animados desde _animateArms
        } else if (p < 0.95) {
          const pp = (p - 0.7) / 0.25;
          this.model.position.set(0.8 + pp * 0.2, Math.sin(((p - 0.5)/0.2) * Math.PI) * 0.7 * (1-pp), 0);
        } else {
          this.model.position.set(-1.7, 0, 0);
        }
        break;
      }
      case 'floater': {
        const p = (t % 2.8) / 2.8;
        this.model.rotation.y = Math.PI / 2 - 0.2;
        if (p < 0.3) {
          this.model.position.set(-0.8, 0, 0);
          this._playAction('idle');
        } else if (p < 0.65) {
          const pp = (p - 0.3) / 0.35;
          this.model.position.set(-0.8 + pp * 0.3, Math.sin(pp * Math.PI) * 0.4, 0);
        } else {
          this.model.position.set(-0.5, 0, 0);
          this._playAction('idle');
        }
        break;
      }
      case 'hook': {
        // brazo en arco continuo (hook shot)
        const p = (t % 2.4) / 2.4;
        this.model.position.set(0, 0, 0);
        this.model.rotation.y = Math.PI / 2;
        this._playAction('idle');
        // arco del brazo
        break;
      }
      case 'fadeaway': {
        const p = (t % 3.2) / 3.2;
        this.model.rotation.y = Math.PI / 2;
        if (p < 0.4) {
          this.model.position.set(0, 0, 0.3);
          this._playAction('idle');
        } else if (p < 0.7) {
          const pp = (p - 0.4) / 0.3;
          this.model.position.set(-pp * 0.4, Math.sin(pp * Math.PI) * 0.5, 0.3 - pp * 0.2);
        } else if (p < 0.95) {
          const pp = (p - 0.7) / 0.25;
          this.model.position.set(-0.4 + pp * 0.2, Math.sin(((p-0.4)/0.3) * Math.PI) * 0.5 * (1-pp), 0.1 + pp * 0.1);
        } else {
          this.model.position.set(0, 0, 0.3);
        }
        break;
      }
      case 'rebound': {
        const p = (t % 2.5) / 2.5;
        this.model.rotation.y = Math.PI / 2 - 0.1;
        this.model.position.set(0, 0, 0);
        if (p > 0.4 && p < 0.7) {
          const pp = (p - 0.4) / 0.3;
          this.model.position.y = Math.sin(pp * Math.PI) * 0.55;
          this._playAction('idle');
        } else {
          this._playAction('idle');
        }
        break;
      }
      case 'tape': {
        const p = (t % 2.6) / 2.6;
        this.model.rotation.y = Math.PI / 2;
        this.model.position.set(0.5, 0, 0);
        if (p > 0.3 && p < 0.6) {
          const pp = (p - 0.3) / 0.3;
          this.model.position.y = Math.sin(pp * Math.PI) * 0.6;
        } else {
          this._playAction('idle');
        }
        break;
      }
    }
  }

  // === Helper: obtener hueso por nombre (varios formatos) ===
  _bone(name) {
    return this.bones['mixamorig:' + name]
        || this.bones['mixamorig' + name]
        || this.bones[name]
        || null;
  }

  // === Posición world de la mano (para anclar balón) ===
  _handWorldPos(side, offsetY = -0.08, offsetX = 0, offsetZ = 0) {
    const hand = this._bone(side === 'right' ? 'RightHand' : 'LeftHand');
    if (!hand) return null;
    const p = new THREE.Vector3();
    hand.getWorldPosition(p);
    p.y += offsetY;
    p.x += offsetX;
    p.z += offsetZ;
    return p;
  }

  // === ANIMACIÓN PROCEDURAL DE BRAZOS por drill ===
  // Se aplica DESPUÉS del mixer.update() para sobrescribir el clip idle
  _animateArms(t) {
    if (!this.drillCfg || !this.modelReady) return;
    const cfg = this.drillCfg;
    const drillId = this.currentDrillId;

    // helpers compactos
    const setArm = (side, x, y, z) => {
      const b = this._bone(side + 'Arm');
      if (b) b.rotation.set(x, y, z);
    };
    const setForearm = (side, x, y, z) => {
      const b = this._bone(side + 'ForeArm');
      if (b) b.rotation.set(x, y, z);
    };

    switch (drillId) {
      // NOTA Mixamo rig: bone.rotation.z POSITIVO = brazo HACIA ABAJO (junto al cuerpo),
      // NEGATIVO = brazo HACIA ARRIBA (sobre la cabeza). Para LeftArm los signos están invertidos.
      case 'dribble-alt': {
        const cyc = 0.6;
        const pR = (t % cyc) / cyc;
        const pL = ((t + cyc/2) % cyc) / cyc;
        const pump = (p) => Math.sin(p * Math.PI);
        // Brazos hacia abajo bombeando
        setArm('Right', 0, 0, 1.35 - pump(pR) * 0.3);
        setForearm('Right', 0, 0, 0.4 + pump(pR) * 0.2);
        setArm('Left', 0, 0, -1.35 + pump(pL) * 0.3);
        setForearm('Left', 0, 0, -0.4 - pump(pL) * 0.2);
        break;
      }
      case 'crossover': {
        const cyc = 1.5;
        const p = (t % cyc) / cyc;
        const phase = Math.sin(p * Math.PI * 2);
        // Brazos hacia abajo controlando balón
        setArm('Right', 0, phase * 0.3, 1.25 - Math.abs(phase) * 0.15);
        setForearm('Right', 0, 0, 0.5);
        setArm('Left', 0, -phase * 0.3, -1.25 + Math.abs(phase) * 0.15);
        setForearm('Left', 0, 0, -0.5);
        break;
      }
      case 'between-legs': {
        const cyc = 1.8;
        const p = (t % cyc) / cyc;
        const wave = Math.sin(p * Math.PI * 2);
        // Brazos profundamente abajo entre las piernas
        setArm('Right', 0.3, wave * 0.2, 1.45);
        setForearm('Right', 0, 0, 0.9);
        setArm('Left', 0.3, -wave * 0.2, -1.45);
        setForearm('Left', 0, 0, -0.9);
        break;
      }
      case 'hesitation': {
        setArm('Right', 0, 0, 1.1);
        setForearm('Right', 0, 0, 0.7);
        setArm('Left', 0, 0, -1.1);
        setForearm('Left', 0, 0, -0.4);
        break;
      }
      case 'pase-pecho': {
        const cyc = 2.0;
        const p = (t % cyc) / cyc;
        const extend = p < 0.4 ? p / 0.4 : (p < 0.6 ? 1.0 : Math.max(0, 1 - (p - 0.6) / 0.4));
        // brazos al frente: rotation.x negativo levanta hacia frente (en Mixamo)
        setArm('Right', -extend * 1.5, 0, 0.7 - extend * 0.4);
        setForearm('Right', 0, 0, 0.5 - extend * 0.4);
        setArm('Left', -extend * 1.5, 0, -0.7 + extend * 0.4);
        setForearm('Left', 0, 0, -0.5 + extend * 0.4);
        break;
      }
      case 'nolook': {
        const cyc = 2.4;
        const p = (t % cyc) / cyc;
        const extend = p < 0.5 ? p / 0.5 : Math.max(0, 1 - (p - 0.5) / 0.4);
        setArm('Right', -extend * 1.2, -extend * 0.6, 0.8 - extend * 0.3);
        setForearm('Right', 0, 0, 0.5 - extend * 0.3);
        const head = this._bone('Head');
        if (head) head.rotation.y = -0.6;
        break;
      }
      case 'reconocer-bloqueo': {
        setArm('Right', 0, 0, 1.2);
        setForearm('Right', 0, 0, 0.6);
        setArm('Left', 0, 0, -1.0);
        break;
      }
      case 'posicion-def': {
        // Postura defensiva: brazos abiertos a media altura
        setArm('Right', 0, 0, 0.9);
        setArm('Left', 0, 0, -0.9);
        setForearm('Right', 0, 0, 0.3);
        setForearm('Left', 0, 0, -0.3);
        break;
      }
      case 'layup-debil': {
        // Brazo izquierdo (mano débil) sube al lanzar
        const cyc = 3.2;
        const p = (t % cyc) / cyc;
        if (p < 0.5) {
          // corriendo, brazo abajo
          setArm('Left', 0, 0, 1.1);
          setForearm('Left', 0, 0, -0.5);
        } else if (p < 0.85) {
          // saltando, brazo arriba
          const pp = (p - 0.5) / 0.35;
          setArm('Left', 0, 0, 1.4 + pp * 1.4); // sube
          setForearm('Left', 0, 0, -0.3 + pp * 0.2);
        }
        break;
      }
      case 'floater': {
        // Brazo derecho arriba con muñeca relajada
        const cyc = 2.8;
        const p = (t % cyc) / cyc;
        if (p < 0.3) {
          setArm('Right', 0, 0, -1.0);
        } else if (p < 0.65) {
          const pp = (p - 0.3) / 0.35;
          setArm('Right', -pp * 0.8, 0, -1.5 - pp * 1.0);
          setForearm('Right', 0, 0, 0.3 - pp * 0.2);
        }
        break;
      }
      case 'gancho': {
        // Brazo en arco: sube de abajo a arriba en círculo
        const cyc = 2.4;
        const p = (t % cyc) / cyc;
        const ang = p * Math.PI; // 0 → π
        // arm.z = -sin(ang) * 2 va de 0 (abajo) → -2 (arriba) → 0
        setArm('Right', 0, Math.cos(ang) * 0.4, -1.0 - Math.sin(ang) * 1.5);
        setForearm('Right', 0, 0, 0.3);
        break;
      }
      case 'fadeaway': {
        // Fadeaway: ambos brazos suben al lanzar
        const cyc = 3.2;
        const p = (t % cyc) / cyc;
        if (p < 0.4) {
          setArm('Right', 0, 0, -1.0);
        } else if (p < 0.7) {
          const pp = (p - 0.4) / 0.3;
          setArm('Right', -pp * 1.2, 0, -1.5 - pp * 1.2);
          setForearm('Right', 0, 0, 0.3 - pp * 0.2);
          setArm('Left', -pp * 0.6, 0, 1.0 + pp * 0.3);
        }
        break;
      }
      case 'timing-rebote': {
        // Ambos brazos arriba
        const cyc = 2.5;
        const p = (t % cyc) / cyc;
        const raise = (p > 0.4 && p < 0.7) ? Math.sin(((p - 0.4) / 0.3) * Math.PI) : 0;
        setArm('Right', 0, 0, -1.0 - raise * 1.5);
        setArm('Left', 0, 0, 1.0 + raise * 1.5);
        setForearm('Right', 0, 0, 0.2);
        setForearm('Left', 0, 0, -0.2);
        break;
      }
      case 'tape': {
        // Bloqueo: brazo derecho explota arriba
        const cyc = 2.6;
        const p = (t % cyc) / cyc;
        const raise = (p > 0.3 && p < 0.6) ? Math.sin(((p - 0.3) / 0.3) * Math.PI) : 0;
        setArm('Right', 0, 0, -1.0 - raise * 1.8);
        setForearm('Right', 0, 0, 0.2);
        break;
      }
    }
  }

  _updateBall(t) {
    if (!this.drillCfg || !this.drillCfg.ball) return;
    const type = this.drillCfg.ball;
    const mp = this.model ? this.model.position : new THREE.Vector3();

    switch (type) {
      case 'dualDribble': {
        // Cada balón rebota debajo de su mano correspondiente
        const cyc = 0.6;
        const pR = (t % cyc) / cyc;
        const pL = ((t + cyc/2) % cyc) / cyc;
        const bounceR = Math.abs(Math.sin(pR * Math.PI));
        const bounceL = Math.abs(Math.sin(pL * Math.PI));
        // Posición horizontal: bajo la mano (lee posición real)
        const handR = this._handWorldPos('right', 0);
        const handL = this._handWorldPos('left', 0);
        if (handR) {
          // Y oscila entre suelo (0.12) y altura de la mano
          const handY = handR.y;
          this.ball.position.set(handR.x, 0.12 + bounceR * (handY - 0.12), handR.z);
        } else {
          this.ball.position.set(-0.35, 0.12 + bounceR * 0.55, 0.35);
        }
        if (handL) {
          const handY = handL.y;
          this.ball2.position.set(handL.x, 0.12 + bounceL * (handY - 0.12), handL.z);
        } else {
          this.ball2.position.set(0.35, 0.12 + bounceL * 0.55, 0.35);
        }
        break;
      }
      case 'crossover': {
        // Balón cruza de una mano a la otra rebotando en el suelo
        const cyc = 1.5;
        const p = (t % cyc) / cyc;
        // Half 1: derecha→izquierda, half 2: izquierda→derecha
        const goingLeft = p < 0.5;
        const sub = goingLeft ? p * 2 : (p - 0.5) * 2;
        const fromHand = this._handWorldPos(goingLeft ? 'right' : 'left', 0);
        const toHand   = this._handWorldPos(goingLeft ? 'left' : 'right', 0);
        if (fromHand && toHand) {
          // Interpolación + rebote (parábola hacia abajo)
          const x = fromHand.x + (toHand.x - fromHand.x) * sub;
          const z = fromHand.z + (toHand.z - fromHand.z) * sub;
          // El balón baja al suelo en el centro del recorrido
          const bounce = 1 - Math.abs(Math.sin(sub * Math.PI)); // 0 en extremos, 1 en suelo
          const y = fromHand.y + (toHand.y - fromHand.y) * sub - bounce * (fromHand.y - 0.12);
          this.ball.position.set(x, Math.max(0.12, y), z);
        } else {
          this.ball.position.set(Math.sin(p * Math.PI * 2) * 0.5, 0.12 + Math.abs(Math.sin(((p*2)%1) * Math.PI)) * 0.45, 0.35);
        }
        break;
      }
      case 'betweenLegs': {
        const cyc = 1.8;
        const p = (t % cyc) / cyc;
        const ang = p * Math.PI * 2;
        this.ball.position.set(Math.sin(ang) * 0.25, 0.4 + Math.abs(Math.sin(ang * 2)) * 0.2, Math.cos(ang) * 0.18);
        break;
      }
      case 'chestPass': {
        const cyc = 2.0;
        const p = (t % cyc) / cyc;
        if (p < 0.5) {
          const pp = p / 0.5;
          this.ball.visible = true;
          this.ball.position.set(-0.5 + pp * 2.5, 1.3, 0);
        } else this.ball.visible = false;
        break;
      }
      case 'noLook': {
        const cyc = 2.4;
        const p = (t % cyc) / cyc;
        if (p < 0.6) {
          const pp = p / 0.6;
          this.ball.visible = true;
          this.ball.position.set(-0.5 + pp * 2.5, 1.2 + Math.sin(pp * Math.PI) * 0.3, 0.4 - pp * 0.5);
        } else this.ball.visible = false;
        break;
      }
      case 'attached': {
        // Pegada a la mano derecha real del jugador
        const hand = this._handWorldPos('right', 0.02);
        if (hand) {
          this.ball.position.copy(hand);
        } else {
          this.ball.position.set(mp.x + 0.3, mp.y + 0.7, mp.z + 0.15);
        }
        break;
      }
      case 'layup': {
        const cyc = 3.2;
        const p = (t % cyc) / cyc;
        if (p < 0.6) {
          this.ball.visible = true;
          this.ball.position.set(mp.x + 0.25, mp.y + 0.6 + Math.abs(Math.sin(t * 12)) * 0.1, mp.z);
        } else if (p < 0.92) {
          const pp = (p - 0.6) / 0.32;
          this.ball.visible = true;
          this.ball.position.set(0.8 + pp * 1.7, 1.6 + Math.sin(pp * Math.PI) * 0.6, 0);
        } else this.ball.visible = false;
        break;
      }
      case 'floater': {
        const cyc = 2.8;
        const p = (t % cyc) / cyc;
        if (p < 0.35) {
          this.ball.visible = true;
          this.ball.position.set(mp.x + 0.2, mp.y + 1.5, 0);
        } else if (p < 0.85) {
          const pp = (p - 0.35) / 0.5;
          this.ball.visible = true;
          // floater = parábola muy alta
          this.ball.position.set(-0.6 + pp * 3.1, 1.6 + Math.sin(pp * Math.PI) * 1.7, 0);
        } else this.ball.visible = false;
        break;
      }
      case 'hook': {
        const cyc = 2.4;
        const p = (t % cyc) / cyc;
        if (p < 0.5) {
          // pegada al brazo girando
          const ang = p * Math.PI;
          this.ball.visible = true;
          this.ball.position.set(Math.sin(ang) * 0.45, 1.3 + Math.cos(ang) * 0.5, 0);
        } else if (p < 0.9) {
          const pp = (p - 0.5) / 0.4;
          this.ball.visible = true;
          this.ball.position.set(0 + pp * 2.5, 1.85 + Math.sin(pp * Math.PI) * 0.7, 0);
        } else this.ball.visible = false;
        break;
      }
      case 'fadeaway': {
        const cyc = 3.2;
        const p = (t % cyc) / cyc;
        if (p < 0.7) {
          this.ball.visible = true;
          this.ball.position.set(mp.x + 0.15, mp.y + 1.4, mp.z);
        } else if (p < 0.95) {
          const pp = (p - 0.7) / 0.25;
          this.ball.visible = true;
          this.ball.position.set(mp.x + 0.15 + pp * 2.7, 1.7 + Math.sin(pp * Math.PI) * 0.5, 0);
        } else this.ball.visible = false;
        break;
      }
      case 'rebound': {
        const cyc = 2.5;
        const p = (t % cyc) / cyc;
        this.ball.visible = true;
        if (p < 0.4) {
          // sale del aro
          const pp = p / 0.4;
          this.ball.position.set(2.5 - pp * 1.5, 2.5 + Math.sin(pp * Math.PI) * 0.4, 0);
        } else if (p < 0.7) {
          const pp = (p - 0.4) / 0.3;
          this.ball.position.set(1.0 - pp * 1, 2.3 - pp * 0.85, 0);
        } else if (p < 0.95) {
          this.ball.position.set(0, 1.4 + Math.sin(((p-0.4)/0.3) * Math.PI * 0.3) * 0.1, 0);
        } else this.ball.visible = false;
        break;
      }
      case 'blocked': {
        const cyc = 2.6;
        const p = (t % cyc) / cyc;
        this.ball.visible = true;
        if (p < 0.3) {
          this.ball.position.set(-0.5, 1.4 + p * 0.5, 0);
        } else if (p < 0.45) {
          this.ball.position.set(-0.5, 1.7, 0);
        } else {
          const pp = (p - 0.45) / 0.55;
          this.ball.position.set(-0.5 + pp * 0.3, 1.7 - pp * 1.7, 0);
        }
        break;
      }
    }

    // Rotación del balón
    if (this.ball.visible) {
      this.ball.rotation.x = t * 5;
      this.ball.rotation.z = t * 3;
    }
    if (this.ball2.visible) {
      this.ball2.rotation.x = t * 5;
      this.ball2.rotation.z = -t * 3;
    }
  }

  _updateCamera(delta) {
    // Orbit suave para sensación cinematica
    const orbit = Math.sin(this.tElapsed * 0.13) * 0.25;
    const tgt = this.camTargetPos.clone();
    tgt.x += orbit;
    this.camera.position.lerp(tgt, Math.min(delta * 1.8, 1));
    this.camCurrentLook.lerp(this.camLookAt, Math.min(delta * 2.5, 1));
    this.camera.lookAt(this.camCurrentLook);
  }

  start() {
    if (this.raf) return;
    const animate = () => {
      const delta = Math.min(this.clock.getDelta(), 0.1);
      this.tElapsed += delta;
      // 1. Mixer aplica clip (idle, walk, run)
      if (this.mixer) this.mixer.update(delta);
      // 2. Update modelo (position, rotation, moveCycle)
      this._updateModel(this.tElapsed);
      // 3. Animación procedural de brazos ENCIMA del clip (sobrescribe)
      this._animateArms(this.tElapsed);
      // 4. Update balón (puede leer posición real de la mano gracias a updateMatrixWorld)
      this.model?.updateMatrixWorld(true);
      this._updateBall(this.tElapsed);
      // 5. Cámara
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
  if (_viewer) _viewer.setDrill(drillId);
}
