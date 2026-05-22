// ═══════════════════════════════════════════════════════════════
// BasketCoach 3D Viewer - Three.js + Xbot (Mixamo humano)
// ═══════════════════════════════════════════════════════════════
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// ─── Config por drill ─────────────────────────────────────────
const DRILL_CONFIGS = {
  'dribble-alt': { anim: 'idle',  cam: [2.2, 1.6, 2.8, 0, 1.0, 0], ball: 'dualDribble', label: 'DRIBBLE ALTERNADO' },
  'crossover':   { anim: 'idle',  cam: [0,   1.6, 3.4, 0, 1.0, 0], ball: 'crossover',   label: 'CROSSOVER FRONTAL' },
  'between-legs':{ anim: 'idle',  cam: [0,   0.8, 3.6, 0, 0.7, 0], ball: 'betweenLegs', label: 'ENTRE PIERNAS' },
  'hesitation':  { anim: 'multi', cam: [4,   2.5, 4.5, 0, 1.0, 0], ball: 'attached',    label: 'AVANCE · PAUSA · EXPLOSIÓN', moveCycle:'hesitation' },

  'pase-pecho':  { anim: 'idle',  cam: [3.5, 2.0, 3.5, 0.5, 1.2, 0], ball: 'chestPass', label: 'PASE DE PECHO', extras:['secondPlayer'] },
  'nolook':      { anim: 'idle',  cam: [3.5, 2.0, 3.5, 0.5, 1.2, 0], ball: 'noLook',    label: 'NO-LOOK PASS',  extras:['secondPlayer'] },

  'reconocer-bloqueo':{ anim:'multi', cam:[0, 6.5, 3.5, 0, 0, 0], ball:'attached', label:'PICK & ROLL', moveCycle:'pickRoll', extras:['blocker','defender'] },

  'posicion-def':{ anim:'idle', cam:[3, 2, 3, 0, 1, 0], ball:null, label:'POSICIÓN DEFENSIVA', moveCycle:'lateralSlide' },

  'layup-debil': { anim:'multi', cam:[4, 2.5, 4.5, 1, 1.3, 0], ball:'layup', label:'LAYUP', moveCycle:'layup', extras:['hoop'] },
  'floater':     { anim:'multi', cam:[3.5, 2, 4, 0.3, 1.4, 0], ball:'floater', label:'FLOATER', moveCycle:'floater', extras:['hoop','defenderTall'] },
  'gancho':      { anim:'idle',  cam:[3.5, 1.8, 3.8, 0, 1.4, 0], ball:'hook',  label:'GANCHO', moveCycle:'hook', extras:['hoop'] },
  'fadeaway':    { anim:'multi', cam:[4, 2, 4.2, 0, 1.4, 0], ball:'fadeaway', label:'FADEAWAY', moveCycle:'fadeaway', extras:['hoop','defender'] },
  'timing-rebote':{anim:'multi', cam:[4, 2.5, 4.5, 0, 2, 0], ball:'rebound', label:'REBOTE', moveCycle:'rebound', extras:['hoop'] },
  'tape':        { anim:'multi', cam:[3.5, 2.5, 4, 0, 2, 0], ball:'blocked', label:'TAPER', moveCycle:'tape', extras:['hoop','attacker'] },
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
    this.camera = new THREE.PerspectiveCamera(38, aspect, 0.1, 50);
    this.camera.position.set(3, 1.8, 4);
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
    this.scene.add(new THREE.AmbientLight(0x303040, 1.4));

    const key = new THREE.DirectionalLight(0xfff3e0, 2.2);
    key.position.set(3, 6, 4);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.near = 0.5;
    key.shadow.camera.far = 18;
    key.shadow.camera.left = -4; key.shadow.camera.right = 4;
    key.shadow.camera.top = 5; key.shadow.camera.bottom = -2;
    key.shadow.bias = -0.0005;
    this.scene.add(key);

    const rim = new THREE.DirectionalLight(0xff5500, 1.3);
    rim.position.set(-4, 3, -3);
    this.scene.add(rim);

    const fill = new THREE.DirectionalLight(0x6080ff, 0.4);
    fill.position.set(-2, 2, 3);
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
    this.ball = new THREE.Mesh(new THREE.SphereGeometry(0.12, 24, 24), ballMat);
    this.ball.castShadow = true;
    this.ball.visible = false;
    this.scene.add(this.ball);

    this.ball2 = new THREE.Mesh(new THREE.SphereGeometry(0.12, 24, 24), ballMat.clone());
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

    // ESCALA: Mixamo viene en unidades raras, normalizar a ~1.7m de altura
    const bbox = new THREE.Box3().setFromObject(this.model);
    const size = new THREE.Vector3();
    bbox.getSize(size);
    this.modelScale = 1.7 / Math.max(size.y, 0.001);
    this.model.scale.setScalar(this.modelScale);
    this.model.position.set(0, 0, 0);

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
      return;
    }
    const cfg = DRILL_CONFIGS[drillId];
    if (!cfg) return;

    this._clearExtras();
    this.tElapsed = 0;
    this.drillCfg = cfg;
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

    // Default position
    if (!cfg.moveCycle) {
      this.model.position.set(0, 0, 0);
      this.model.rotation.y = Math.PI; // mirando a cámara
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
          this._raiseRightArm(pp); // brazo arriba al lanzar
        } else if (p < 0.95) {
          const pp = (p - 0.7) / 0.25;
          this.model.position.set(0.8 + pp * 0.2, Math.sin(((p - 0.5)/0.2) * Math.PI) * 0.7 * (1-pp), 0);
          this._raiseRightArm(1 - pp);
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
          this._raiseRightArm(pp * 1.2);
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
        this._hookArm(p);
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
          this._raiseRightArm(pp);
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
          this._raiseBothArms(pp);
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
          this._raiseRightArm(pp);
        } else {
          this._playAction('idle');
        }
        break;
      }
    }
  }

  // === Helpers procedurales para brazos (sin animación pre-hecha) ===
  _raiseRightArm(amount) {
    const arm = this.bones['mixamorigRightArm'] || this.bones['RightArm'] || this.bones['mixamorig:RightArm'];
    const forearm = this.bones['mixamorigRightForeArm'] || this.bones['RightForeArm'] || this.bones['mixamorig:RightForeArm'];
    if (arm) arm.rotation.z = -amount * Math.PI * 0.55;
    if (forearm) forearm.rotation.y = -amount * 0.6;
  }
  _raiseLeftArm(amount) {
    const arm = this.bones['mixamorigLeftArm'] || this.bones['LeftArm'] || this.bones['mixamorig:LeftArm'];
    if (arm) arm.rotation.z = amount * Math.PI * 0.55;
  }
  _raiseBothArms(amount) {
    this._raiseRightArm(amount);
    this._raiseLeftArm(amount);
  }
  _hookArm(p) {
    // gira el brazo derecho en arco de hook
    const arm = this.bones['mixamorigRightArm'] || this.bones['RightArm'] || this.bones['mixamorig:RightArm'];
    if (arm) {
      // 0 → -π : abajo a arriba en círculo
      arm.rotation.z = -Math.sin(p * Math.PI) * 1.0 - 0.3;
      arm.rotation.y = Math.cos(p * Math.PI) * 0.4;
    }
  }
  _resetArms() {
    ['mixamorigRightArm','mixamorigLeftArm','mixamorigRightForeArm','mixamorigLeftForeArm',
     'RightArm','LeftArm','RightForeArm','LeftForeArm',
     'mixamorig:RightArm','mixamorig:LeftArm'].forEach(n => {
      if (this.bones[n]) this.bones[n].rotation.set(0,0,0);
    });
  }

  _updateBall(t) {
    if (!this.drillCfg || !this.drillCfg.ball) return;
    const type = this.drillCfg.ball;
    const mp = this.model ? this.model.position : new THREE.Vector3();

    switch (type) {
      case 'dualDribble': {
        const cyc = 0.6;
        const pA = Math.abs(Math.sin(((t % cyc) / cyc) * Math.PI));
        const pB = Math.abs(Math.sin((((t + cyc/2) % cyc) / cyc) * Math.PI));
        this.ball.position.set(-0.35, 0.12 + pA * 0.55, 0.35);
        this.ball2.position.set(0.35, 0.12 + pB * 0.55, 0.35);
        break;
      }
      case 'crossover': {
        const cyc = 1.5;
        const p = (t % cyc) / cyc;
        const x = Math.sin(p * Math.PI * 2) * 0.5;
        const sub = (p * 2) % 1;
        const bounce = Math.abs(Math.sin(sub * Math.PI));
        this.ball.position.set(x, 0.12 + bounce * 0.45, 0.35);
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
        // pegada al jugador
        this.ball.position.set(mp.x + 0.3, mp.y + 0.7, mp.z + 0.15);
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
      // reset bones rotation antes de procedural updates
      if (this.modelReady) this._resetArms();
      if (this.mixer) this.mixer.update(delta);
      this._updateModel(this.tElapsed);
      this._updateBall(this.tElapsed);
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
