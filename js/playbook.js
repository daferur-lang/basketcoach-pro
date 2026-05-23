// ═══════════════════════════════════════════════════════════════
// BasketCoach Playbook - Jugadas Tacticas de Equipo
// Canvas 2D vista aerea (top-down) con keyframes interpolados
// ═══════════════════════════════════════════════════════════════

// ── CATALOGO DE JUGADAS ──────────────────────────────────────
// Coordenadas: media cancha. 0-100 X (ancho), 0-50 Y (largo)
// Aro en (50, 5). Linea 3pt arco hasta y~22, mid-court y=50
export const PLAYS = [
  // ═══ OFENSIVAS ═══
  {
    id: 'pick-roll',
    name: 'Pick & Roll Basico',
    category: 'ofensiva',
    difficulty: 1,
    duration: 6,
    description: 'La jugada mas usada en NBA. Bloqueo directo del 5 al 1.',
    keyframes: [
      { t: 0, players: [
        { id: 1, x: 50, y: 28 }, { id: 2, x: 12, y: 18 }, { id: 3, x: 88, y: 18 },
        { id: 4, x: 25, y: 10 }, { id: 5, x: 65, y: 22 },
      ], ball: { player: 1 }, label: 'Posicion inicial' },
      { t: 2, players: [
        { id: 1, x: 48, y: 27 }, { id: 2, x: 12, y: 18 }, { id: 3, x: 88, y: 18 },
        { id: 4, x: 25, y: 10 }, { id: 5, x: 52, y: 22 },
      ], ball: { player: 1 }, label: '5 sube a bloquear' },
      { t: 4, players: [
        { id: 1, x: 62, y: 18 }, { id: 2, x: 12, y: 18 }, { id: 3, x: 88, y: 18 },
        { id: 4, x: 25, y: 10 }, { id: 5, x: 55, y: 14 },
      ], ball: { player: 1 }, label: 'Base usa bloqueo, 5 rolla' },
      { t: 6, players: [
        { id: 1, x: 62, y: 18 }, { id: 2, x: 12, y: 18 }, { id: 3, x: 88, y: 18 },
        { id: 4, x: 25, y: 10 }, { id: 5, x: 50, y: 7 },
      ], ball: { player: 5 }, label: 'Pase al 5 y canasta' },
    ],
    steps: [
      { t: 'Setup', d: 'Base con balon en el centro. Pivot (5) en posicion media baja.' },
      { t: 'Bloqueo', d: 'El 5 sube a poner bloqueo lateral al defensor del base.' },
      { t: 'Uso', d: 'Base ataca a traves del bloqueo. 5 hace roll inmediato al aro.' },
      { t: 'Lectura', d: 'Si ayuda viene → pase al 5. Si no → finalizacion del base.' },
    ],
    tips: [
      'El roll del 5 debe ser inmediato tras el contacto del bloqueo',
      'Base "frota hombro con hombro" del bloqueador',
      'Esquinas (2 y 3) spaced para evitar ayudas',
    ]
  },
  {
    id: 'horns',
    name: 'Horns',
    category: 'ofensiva',
    difficulty: 2,
    duration: 7,
    description: 'Dos bigs en los elbows. Multiples opciones desde la misma formacion.',
    keyframes: [
      { t: 0, players: [
        { id: 1, x: 50, y: 35 }, { id: 2, x: 10, y: 10 }, { id: 3, x: 90, y: 10 },
        { id: 4, x: 35, y: 22 }, { id: 5, x: 65, y: 22 },
      ], ball: { player: 1 }, label: 'Formacion Horns: 4 y 5 en elbows' },
      { t: 2, players: [
        { id: 1, x: 50, y: 28 }, { id: 2, x: 10, y: 10 }, { id: 3, x: 90, y: 10 },
        { id: 4, x: 40, y: 24 }, { id: 5, x: 60, y: 24 },
      ], ball: { player: 1 }, label: '1 avanza, 4 y 5 preparan doble bloqueo' },
      { t: 4, players: [
        { id: 1, x: 35, y: 18 }, { id: 2, x: 10, y: 10 }, { id: 3, x: 90, y: 10 },
        { id: 4, x: 45, y: 18 }, { id: 5, x: 55, y: 18 },
      ], ball: { player: 1 }, label: '1 toma uno de los bloqueos' },
      { t: 6, players: [
        { id: 1, x: 30, y: 14 }, { id: 2, x: 10, y: 10 }, { id: 3, x: 90, y: 10 },
        { id: 4, x: 55, y: 10 }, { id: 5, x: 60, y: 22 },
      ], ball: { player: 1 }, label: '4 rolla al aro, 5 pop exterior' },
      { t: 7, players: [
        { id: 1, x: 30, y: 14 }, { id: 2, x: 10, y: 10 }, { id: 3, x: 90, y: 10 },
        { id: 4, x: 50, y: 7 }, { id: 5, x: 60, y: 22 },
      ], ball: { player: 4 }, label: 'Opcion: pase al 4 al aro' },
    ],
    steps: [
      { t: 'Formacion', d: '4 y 5 en los elbows, 2 y 3 en corners, 1 trayendo balon.' },
      { t: 'Doble pick', d: 'Los dos bigs preparan bloqueo simultaneo al base.' },
      { t: 'Eleccion', d: 'Base elige un bloqueo. El otro big hace pop, este rolla.' },
      { t: 'Opciones', d: 'Penetracion, pase al roll, pase al pop, kick a corner.' },
    ],
    tips: [
      'La belleza es la AMBIGUEDAD: defensa no sabe a cual ir',
      'Los corners NO se mueven hasta el ultimo segundo',
      'Si el base se ve cubierto, pase al pop y replantear',
    ]
  },
  {
    id: 'floppy',
    name: 'Floppy Action',
    category: 'ofensiva',
    difficulty: 2,
    duration: 6.5,
    description: 'El tirador (2) corre bajo el aro y elige por que lado salir.',
    keyframes: [
      { t: 0, players: [
        { id: 1, x: 50, y: 35 }, { id: 2, x: 50, y: 7 }, { id: 3, x: 88, y: 18 },
        { id: 4, x: 18, y: 8 }, { id: 5, x: 82, y: 8 },
      ], ball: { player: 1 }, label: 'Posicion inicial: 2 bajo el aro' },
      { t: 2, players: [
        { id: 1, x: 50, y: 30 }, { id: 2, x: 35, y: 9 }, { id: 3, x: 88, y: 18 },
        { id: 4, x: 18, y: 8 }, { id: 5, x: 82, y: 8 },
      ], ball: { player: 1 }, label: '2 sale por izquierda usando bloqueo del 4' },
      { t: 4, players: [
        { id: 1, x: 50, y: 30 }, { id: 2, x: 12, y: 18 }, { id: 3, x: 88, y: 18 },
        { id: 4, x: 18, y: 12 }, { id: 5, x: 82, y: 8 },
      ], ball: { player: 1 }, label: '2 llega al wing libre' },
      { t: 6.5, players: [
        { id: 1, x: 50, y: 30 }, { id: 2, x: 12, y: 18 }, { id: 3, x: 88, y: 18 },
        { id: 4, x: 18, y: 12 }, { id: 5, x: 82, y: 8 },
      ], ball: { player: 2 }, label: 'Recepcion y tiro' },
    ],
    steps: [
      { t: 'Inicio', d: '2 (tirador) parado bajo el aro entre los dos bigs (4 y 5).' },
      { t: 'Lectura', d: '2 elige por que lado salir (donde el defensor este peor situado).' },
      { t: 'Bloqueo', d: 'El big de ese lado le pone bloqueo. 2 sube al wing.' },
      { t: 'Tiro', d: '1 le entrega el balon en triple para tiro abierto.' },
    ],
    tips: [
      '2 debe leer la postura del defensor antes de elegir lado',
      'El bloqueo debe ser legal: pies asentados antes del contacto',
      'Si el defensor sigue, el big puede slip al aro',
    ]
  },
  {
    id: 'blob-box',
    name: 'BLOB Box (Saque de fondo)',
    category: 'ofensiva',
    difficulty: 1,
    duration: 5,
    description: 'Saque de fondo en formacion de caja. Multiples opciones de tiro.',
    keyframes: [
      { t: 0, players: [
        { id: 1, x: 50, y: 2 }, { id: 2, x: 30, y: 14 }, { id: 3, x: 70, y: 14 },
        { id: 4, x: 30, y: 7 }, { id: 5, x: 70, y: 7 },
      ], ball: { player: 1, outOfBounds: true }, label: 'Caja: 1 saca' },
      { t: 2, players: [
        { id: 1, x: 50, y: 2 }, { id: 2, x: 25, y: 18 }, { id: 3, x: 75, y: 18 },
        { id: 4, x: 40, y: 10 }, { id: 5, x: 60, y: 10 },
      ], ball: { player: 1, outOfBounds: true }, label: 'Cruces de bloqueo de los bigs' },
      { t: 4, players: [
        { id: 1, x: 50, y: 2 }, { id: 2, x: 15, y: 18 }, { id: 3, x: 50, y: 12 },
        { id: 4, x: 35, y: 6 }, { id: 5, x: 65, y: 6 },
      ], ball: { player: 1, outOfBounds: true }, label: '3 corta al area' },
      { t: 5, players: [
        { id: 1, x: 50, y: 8 }, { id: 2, x: 15, y: 18 }, { id: 3, x: 50, y: 8 },
        { id: 4, x: 35, y: 6 }, { id: 5, x: 65, y: 6 },
      ], ball: { player: 3 }, label: 'Pase al 3 para bandeja' },
    ],
    steps: [
      { t: 'Formacion', d: 'Cuatro jugadores en caja, 1 saca de fondo.' },
      { t: 'Doble bloqueo', d: 'Los bigs (4 y 5) se cruzan formando doble pick.' },
      { t: 'Corte', d: 'El 3 corta al area entre los bloqueos.' },
      { t: 'Pase y canasta', d: '1 pasa al 3 libre para bandeja sencilla.' },
    ],
    tips: [
      'El 1 tiene 5 segundos: lectura rapida',
      'Si el corte esta cubierto, segunda opcion es el 2 abriendo a triple',
      'Bigs deben aguantar el bloqueo aunque no llegue el pase',
    ]
  },

  // ═══ DEFENSIVAS ═══
  {
    id: 'zone-2-3',
    name: 'Zona 2-3',
    category: 'defensiva',
    difficulty: 2,
    duration: 8,
    description: 'Defensa zonal clasica. 2 defensores arriba, 3 abajo protegiendo el aro.',
    keyframes: [
      { t: 0, players: [
        { id: 1, x: 35, y: 22 }, { id: 2, x: 65, y: 22 },
        { id: 3, x: 18, y: 12 }, { id: 4, x: 50, y: 7 }, { id: 5, x: 82, y: 12 },
      ], ball: { x: 50, y: 38 }, label: 'Formacion 2-3 base' },
      { t: 3, players: [
        { id: 1, x: 28, y: 20 }, { id: 2, x: 60, y: 24 },
        { id: 3, x: 12, y: 14 }, { id: 4, x: 45, y: 8 }, { id: 5, x: 78, y: 12 },
      ], ball: { x: 25, y: 28 }, label: 'Rotacion a la izquierda' },
      { t: 6, players: [
        { id: 1, x: 25, y: 18 }, { id: 2, x: 55, y: 22 },
        { id: 3, x: 15, y: 18 }, { id: 4, x: 50, y: 7 }, { id: 5, x: 75, y: 12 },
      ], ball: { x: 12, y: 18 }, label: 'Esquina: 3 cierra, 1 baja' },
      { t: 8, players: [
        { id: 1, x: 35, y: 22 }, { id: 2, x: 65, y: 22 },
        { id: 3, x: 18, y: 12 }, { id: 4, x: 50, y: 7 }, { id: 5, x: 82, y: 12 },
      ], ball: { x: 50, y: 38 }, label: 'Volver a posicion base' },
    ],
    steps: [
      { t: 'Posicion base', d: '1 y 2 arriba en la linea de tiros libres. 3, 4 y 5 abajo formando triangulo.' },
      { t: 'Balon arriba', d: 'El defensor mas cercano presiona. El otro top guarda el pase.' },
      { t: 'Balon en wing', d: 'El defensor abajo de ese lado sube. El top de ese lado baja.' },
      { t: 'Balon en corner', d: '4 (centro) ayuda al rebote. 5 cierra esquina.' },
    ],
    tips: [
      'NUNCA dos defensores en el mismo punto de la zona',
      'El balon es el rey: todos los ojos en el balon',
      'Recuperar a posicion base tras cada pase exterior',
    ]
  },
  {
    id: 'press-1-2-1-1',
    name: 'Presion 1-2-1-1',
    category: 'defensiva',
    difficulty: 3,
    duration: 6,
    description: 'Presion a toda cancha tipo diamante. Forzar el cambio de mano y trampear.',
    keyframes: [
      { t: 0, players: [
        { id: 1, x: 50, y: 45 }, { id: 2, x: 25, y: 35 }, { id: 3, x: 75, y: 35 },
        { id: 4, x: 50, y: 25 }, { id: 5, x: 50, y: 10 },
      ], ball: { x: 50, y: 48, outOfBounds: true }, label: 'Diamante: 1 sobre saque' },
      { t: 2, players: [
        { id: 1, x: 35, y: 40 }, { id: 2, x: 25, y: 35 }, { id: 3, x: 75, y: 35 },
        { id: 4, x: 50, y: 25 }, { id: 5, x: 50, y: 10 },
      ], ball: { x: 30, y: 42 }, label: '1 fuerza a un lado' },
      { t: 4, players: [
        { id: 1, x: 30, y: 38 }, { id: 2, x: 20, y: 35 }, { id: 3, x: 75, y: 35 },
        { id: 4, x: 50, y: 25 }, { id: 5, x: 50, y: 10 },
      ], ball: { x: 22, y: 36 }, label: 'Trampa en esquina con 1 y 2' },
      { t: 6, players: [
        { id: 1, x: 30, y: 38 }, { id: 2, x: 22, y: 35 }, { id: 3, x: 60, y: 30 },
        { id: 4, x: 45, y: 22 }, { id: 5, x: 50, y: 10 },
      ], ball: { x: 22, y: 36 }, label: 'Linea de pase interceptada' },
    ],
    steps: [
      { t: 'Formacion', d: '1 presiona al sacador. 2 y 3 cierran lineas laterales. 4 protege medio campo. 5 ultimo defensor.' },
      { t: 'Forzar lado', d: '1 obliga al sacador a pasar a un lado concreto (debil del rival).' },
      { t: 'Trampa', d: 'En cuanto cruza la linea, 1 y 2 (o 3) cierran. Sin escapatoria.' },
      { t: 'Robo o falta', d: 'Cortar lineas de pase. Si pasa, el siguiente defensor cierra.' },
    ],
    tips: [
      'Manos arriba SIEMPRE para cortar lineas de pase',
      'Si fuerzas y pasa el balon largo, perdiste: defensa de transicion',
      'Comunicacion verbal CONSTANTE: "left", "right", "trap"',
    ]
  },

  // ═══ ATO (After Time Out / fin de partido) ═══
  {
    id: 'hammer',
    name: 'Hammer (ATO)',
    category: 'ato',
    difficulty: 2,
    duration: 6,
    description: 'Jugada de Spurs: drive a un lado mientras se bloquea al tirador del lado opuesto.',
    keyframes: [
      { t: 0, players: [
        { id: 1, x: 50, y: 30 }, { id: 2, x: 12, y: 12 }, { id: 3, x: 88, y: 12 },
        { id: 4, x: 30, y: 8 }, { id: 5, x: 70, y: 8 },
      ], ball: { player: 1 }, label: 'Posicion abierta' },
      { t: 2, players: [
        { id: 1, x: 30, y: 20 }, { id: 2, x: 12, y: 12 }, { id: 3, x: 88, y: 12 },
        { id: 4, x: 35, y: 10 }, { id: 5, x: 70, y: 8 },
      ], ball: { player: 1 }, label: '1 atrae defensa con drive izquierdo' },
      { t: 4, players: [
        { id: 1, x: 25, y: 12 }, { id: 2, x: 12, y: 12 }, { id: 3, x: 88, y: 12 },
        { id: 4, x: 35, y: 10 }, { id: 5, x: 80, y: 10 },
      ], ball: { player: 1 }, label: '5 cruza a poner bloqueo al 3' },
      { t: 6, players: [
        { id: 1, x: 25, y: 12 }, { id: 2, x: 12, y: 12 }, { id: 3, x: 88, y: 14 },
        { id: 4, x: 35, y: 10 }, { id: 5, x: 78, y: 12 },
      ], ball: { player: 3 }, label: 'Skip pass al 3 para triple' },
    ],
    steps: [
      { t: 'Setup', d: '1 trae balon. 3 (tirador) en corner contrario. 5 cerca del aro.' },
      { t: 'Drive', d: '1 dribla agresivo hacia un lado, fija la defensa.' },
      { t: 'Hammer', d: 'El 5 cruza la pista y bloquea al defensor del 3 ("hammer screen").' },
      { t: 'Skip & shoot', d: '1 lanza skip pass cross-court al 3 totalmente abierto.' },
    ],
    tips: [
      'El bloqueo del 5 es por DETRAS del defensor del 3',
      'El skip pass debe ir alto y rapido para que no lo intercepten',
      'Funciona porque la defensa se centra en el drive del 1',
    ]
  },
  {
    id: 'iverson',
    name: 'Iverson Cut',
    category: 'ato',
    difficulty: 1,
    duration: 5,
    description: 'El base cruza por encima de doble bloqueo en los elbows.',
    keyframes: [
      { t: 0, players: [
        { id: 1, x: 20, y: 30 }, { id: 2, x: 12, y: 12 }, { id: 3, x: 88, y: 12 },
        { id: 4, x: 40, y: 22 }, { id: 5, x: 60, y: 22 },
      ], ball: { player: 1 }, label: '1 en wing izquierdo' },
      { t: 2.5, players: [
        { id: 1, x: 50, y: 22 }, { id: 2, x: 12, y: 12 }, { id: 3, x: 88, y: 12 },
        { id: 4, x: 42, y: 22 }, { id: 5, x: 58, y: 22 },
      ], ball: { player: 1 }, label: '1 cruza por encima usando 4 y 5' },
      { t: 5, players: [
        { id: 1, x: 75, y: 22 }, { id: 2, x: 12, y: 12 }, { id: 3, x: 88, y: 12 },
        { id: 4, x: 42, y: 22 }, { id: 5, x: 58, y: 22 },
      ], ball: { player: 1 }, label: '1 llega al wing derecho libre' },
    ],
    steps: [
      { t: 'Posicion', d: '1 con balon en wing izquierdo. 4 y 5 en los elbows (doble bloqueo).' },
      { t: 'Iverson cut', d: '1 cruza por encima de la linea de tiros libres usando ambos bloqueos.' },
      { t: 'Ventaja', d: 'Llega al wing derecho con ventaja. Si el defensor lucha → puerta atras.' },
    ],
    tips: [
      'El 1 debe cambiar de ritmo y direccion al cruzar',
      'Los bloqueadores deben separarse lo justo para que pase',
      'Si la defensa hace switch, isolation con el big con MISS-MATCH',
    ]
  },
];

// ═══════════════════════════════════════════════════════════════
// ── VIEWER CANVAS 2D ────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════
const COURT_BG = '#1a1a1a';
const COURT_LINE = 'rgba(255,255,255,.25)';
const COURT_PAINT = 'rgba(255,85,0,.06)';
const COLOR_PLAYER = '#fafafa';
const COLOR_PLAYER_TXT = '#0a0a0a';
const COLOR_BALL = '#FF6B00';
const COLOR_TRAIL = 'rgba(255,85,0,.35)';

let _viewer = null;

export class PlayViewer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.play = null;
    this.t = 0;
    this.playing = false;
    this.lastTime = 0;
    this.raf = null;

    this._resize();
    this._onResize = () => this._resize();
    window.addEventListener('resize', this._onResize);

    this._renderEmpty();
  }

  _resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this._w = w; this._h = h;
    if (this.play) this._render();
  }

  load(play) {
    this.play = play;
    this.duration = play.duration;
    this.t = 0;
    this._render();
  }

  start() {
    this.playing = true;
    this.lastTime = performance.now();
    this._tick();
  }
  pause() {
    this.playing = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = null;
  }
  restart() {
    this.t = 0;
    this._render();
  }
  toggle() {
    if (this.playing) this.pause();
    else this.start();
  }

  _tick() {
    if (!this.playing) return;
    const now = performance.now();
    const delta = (now - this.lastTime) / 1000;
    this.lastTime = now;
    this.t += delta;
    if (this.t >= this.duration + 1) {
      // Pausa al final
      this.t = 0;
    }
    this._render();
    this.raf = requestAnimationFrame(() => this._tick());
  }

  // ── Coordenadas: cancha 0-100 X, 0-50 Y → canvas pixels ──
  _toCanvas(courtX, courtY) {
    // Margin
    const margin = 12;
    const W = this._w - margin * 2;
    const H = this._h - margin * 2;
    return {
      x: margin + (courtX / 100) * W,
      y: margin + ((50 - courtY) / 50) * H,
    };
  }

  _renderEmpty() {
    this.ctx.fillStyle = COURT_BG;
    this.ctx.fillRect(0, 0, this._w, this._h);
    this._drawCourt();
  }

  _drawCourt() {
    const { ctx } = this;
    const m = 12;
    const W = this._w - m * 2;
    const H = this._h - m * 2;

    // Background pista
    ctx.fillStyle = COURT_BG;
    ctx.fillRect(0, 0, this._w, this._h);

    ctx.strokeStyle = COURT_LINE;
    ctx.lineWidth = 1.2;

    // Borde
    ctx.strokeRect(m, m, W, H);

    // Linea de medio campo (arriba del canvas porque Y=50 es mid)
    ctx.beginPath();
    ctx.moveTo(m, m);
    ctx.lineTo(m + W, m);
    ctx.stroke();

    // Aro: (50, 5) → canvas
    const hoop = this._toCanvas(50, 5);
    ctx.strokeStyle = '#FF5500';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(hoop.x, hoop.y, 6, 0, Math.PI * 2);
    ctx.stroke();

    // Tablero (linea horizontal pequeña pegada al fondo)
    const boardTop = this._toCanvas(40, 3);
    const boardBot = this._toCanvas(60, 3);
    ctx.strokeStyle = 'rgba(255,255,255,.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(boardTop.x, boardTop.y);
    ctx.lineTo(boardBot.x, boardBot.y);
    ctx.stroke();

    // Raqueta (key)
    ctx.strokeStyle = COURT_LINE;
    ctx.lineWidth = 1.2;
    ctx.fillStyle = COURT_PAINT;
    const keyTL = this._toCanvas(35, 16);
    const keyBR = this._toCanvas(65, 4);
    ctx.fillRect(keyTL.x, keyTL.y, keyBR.x - keyTL.x, keyBR.y - keyTL.y);
    ctx.strokeRect(keyTL.x, keyTL.y, keyBR.x - keyTL.x, keyBR.y - keyTL.y);

    // Circulo de tiros libres
    const ftCenter = this._toCanvas(50, 16);
    const ftEdge = this._toCanvas(50, 22);
    const ftR = Math.abs(ftCenter.y - ftEdge.y);
    ctx.beginPath();
    ctx.arc(ftCenter.x, ftCenter.y, ftR, 0, Math.PI * 2);
    ctx.stroke();

    // Linea de 3 puntos (arco)
    ctx.beginPath();
    const arcStart = this._toCanvas(8, 5);   // corner izq
    const arcCenter = this._toCanvas(50, 5); // bajo el aro
    const arcRadius = Math.abs(arcCenter.x - arcStart.x); // aprox
    // Arco desde corner-i a corner-d pasando por arriba
    ctx.arc(arcCenter.x, arcCenter.y, arcRadius, Math.PI, 0, false);
    // Lineas verticales a la baseline
    ctx.moveTo(arcStart.x, arcStart.y);
    const arcStartBaseline = this._toCanvas(8, 0);
    ctx.lineTo(arcStartBaseline.x, arcStartBaseline.y);
    const arcEnd = this._toCanvas(92, 5);
    const arcEndBaseline = this._toCanvas(92, 0);
    ctx.moveTo(arcEnd.x, arcEnd.y);
    ctx.lineTo(arcEndBaseline.x, arcEndBaseline.y);
    ctx.stroke();
  }

  // Interpolar entre keyframes
  _interpolate() {
    const kf = this.play.keyframes;
    if (this.t <= kf[0].t) return kf[0];
    if (this.t >= kf[kf.length - 1].t) return kf[kf.length - 1];

    for (let i = 0; i < kf.length - 1; i++) {
      const a = kf[i], b = kf[i + 1];
      if (this.t >= a.t && this.t <= b.t) {
        const ratio = (this.t - a.t) / (b.t - a.t);
        const players = a.players.map((pa, idx) => {
          const pb = b.players.find(p => p.id === pa.id) || pa;
          return {
            id: pa.id,
            x: pa.x + (pb.x - pa.x) * ratio,
            y: pa.y + (pb.y - pa.y) * ratio,
          };
        });
        // Ball: si está con player, se calcula despues; si es coordenada, interpolar
        let ball;
        if (a.ball.player !== undefined && b.ball.player !== undefined) {
          ball = ratio < 0.5 ? a.ball : b.ball;
        } else if (a.ball.x !== undefined && b.ball.x !== undefined) {
          ball = {
            x: a.ball.x + (b.ball.x - a.ball.x) * ratio,
            y: a.ball.y + (b.ball.y - a.ball.y) * ratio,
            outOfBounds: a.ball.outOfBounds,
          };
        } else {
          ball = a.ball;
        }
        return { players, ball, label: ratio < 0.7 ? a.label : b.label };
      }
    }
    return kf[0];
  }

  _drawPlayer(p) {
    const { ctx } = this;
    const pos = this._toCanvas(p.x, p.y);
    // sombra
    ctx.fillStyle = 'rgba(0,0,0,.5)';
    ctx.beginPath();
    ctx.arc(pos.x + 1, pos.y + 1.5, 11, 0, Math.PI * 2);
    ctx.fill();
    // jugador
    ctx.fillStyle = COLOR_PLAYER;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 11, 0, Math.PI * 2);
    ctx.fill();
    // numero
    ctx.fillStyle = COLOR_PLAYER_TXT;
    ctx.font = '700 12px Inter Tight, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(p.id), pos.x, pos.y);
  }

  _drawBall(ball, players) {
    const { ctx } = this;
    let bx, by;
    if (ball.player !== undefined) {
      const owner = players.find(p => p.id === ball.player);
      if (!owner) return;
      const pos = this._toCanvas(owner.x, owner.y);
      bx = pos.x + 9; by = pos.y + 9;
    } else if (ball.x !== undefined) {
      const pos = this._toCanvas(ball.x, ball.y);
      bx = pos.x; by = pos.y;
    } else return;
    // sombra naranja brillo
    ctx.shadowColor = 'rgba(255,85,0,.6)';
    ctx.shadowBlur = 8;
    ctx.fillStyle = COLOR_BALL;
    ctx.beginPath();
    ctx.arc(bx, by, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  _drawTrails(currentPlayers) {
    const { ctx } = this;
    const kf = this.play.keyframes;
    // Para cada jugador, dibuja una linea suave que une su trayectoria desde t=0 hasta this.t
    ctx.strokeStyle = COLOR_TRAIL;
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    ctx.setLineDash([3, 3]);
    currentPlayers.forEach(p => {
      const pos = this._toCanvas(p.x, p.y);
      // posicion en t=0
      const start = kf[0].players.find(x => x.id === p.id);
      if (!start) return;
      const startPos = this._toCanvas(start.x, start.y);
      // path: linea simple del inicio al actual (visual mínimo, no exacto pero claro)
      ctx.beginPath();
      ctx.moveTo(startPos.x, startPos.y);
      // Pasar por puntos intermedios de keyframes
      for (const k of kf) {
        if (k.t > this.t) break;
        const pp = k.players.find(x => x.id === p.id);
        if (pp) {
          const pos2 = this._toCanvas(pp.x, pp.y);
          ctx.lineTo(pos2.x, pos2.y);
        }
      }
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    });
    ctx.setLineDash([]);
  }

  _drawLabel(label) {
    const { ctx } = this;
    if (!label) return;
    ctx.fillStyle = 'rgba(255,255,255,.5)';
    ctx.font = '600 10px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(label.toUpperCase(), this._w / 2, this._h - 6);
  }

  _drawProgressBar() {
    const { ctx } = this;
    const pct = Math.min(this.t / this.duration, 1);
    const barW = this._w - 24;
    const barX = 12;
    const barY = this._h - 18;
    ctx.fillStyle = 'rgba(255,255,255,.1)';
    ctx.fillRect(barX, barY, barW, 2);
    ctx.fillStyle = '#FF5500';
    ctx.fillRect(barX, barY, barW * pct, 2);
  }

  _render() {
    if (!this.play) { this._renderEmpty(); return; }
    this._drawCourt();
    const state = this._interpolate();
    this._drawTrails(state.players);
    state.players.forEach(p => this._drawPlayer(p));
    this._drawBall(state.ball, state.players);
    this._drawLabel(state.label);
    this._drawProgressBar();
  }

  destroy() {
    this.pause();
    window.removeEventListener('resize', this._onResize);
  }
}

// API
export function mountPlayViewer(canvas, play) {
  if (_viewer) _viewer.destroy();
  _viewer = new PlayViewer(canvas);
  _viewer.load(play);
  _viewer.start();
  return _viewer;
}

export function stopPlayViewer() {
  if (_viewer) {
    _viewer.destroy();
    _viewer = null;
  }
}

export function toggleViewer() {
  if (_viewer) _viewer.toggle();
}

export function restartViewer() {
  if (_viewer) {
    _viewer.restart();
    _viewer.start();
  }
}

export function getViewerState() {
  return _viewer ? { playing: _viewer.playing } : null;
}
