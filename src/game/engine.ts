import * as THREE from 'three';

// ============================================================
// AUDIO SYSTEM
// ============================================================
export class AudioSystem {
  private ctx: AudioContext | null = null;

  init() {
    this.ctx = new AudioContext();
  }

  private ensureCtx() {
    if (!this.ctx) this.init();
    if (this.ctx?.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  playGunshot(pistol: boolean) {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const noise = ctx.createBufferSource();
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.15, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.02));
    noise.buffer = buf;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(pistol ? 0.4 : 0.6, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    noise.connect(noiseGain).connect(ctx.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(pistol ? 150 : 100, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.1);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
    noise.start(now);
    noise.stop(now + 0.15);
  }

  playGeiger() {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = 2000 + Math.random() * 3000;
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.03);
  }

  playHit() {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.05);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.06);
  }

  playReload() {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = 300 + i * 200;
      gain.gain.setValueAtTime(0.08, now + i * 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.3 + 0.1);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + i * 0.3);
      osc.stop(now + i * 0.3 + 0.12);
    }
  }

  playPickup() {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.linearRampToValueAtTime(800, now + 0.1);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  playDamage() {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const noise = ctx.createBufferSource();
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.3;
    noise.buffer = buf;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    noise.connect(gain).connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.2);
  }
}

// ============================================================
// TEXTURE GENERATOR
// ============================================================
export class TextureGen {
  static create(size: number, fn: (x: number, y: number) => [number, number, number]): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    const img = ctx.createImageData(size, size);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const [r, g, b] = fn(x, y);
        const i = (y * size + x) * 4;
        img.data[i] = r;
        img.data[i + 1] = g;
        img.data[i + 2] = b;
        img.data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    const tex = new THREE.CanvasTexture(canvas);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  static noise(x: number, y: number, seed: number = 0): number {
    const n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
    return n - Math.floor(n);
  }

  static concrete(): THREE.CanvasTexture {
    return this.create(32, (x, y) => {
      const n = this.noise(x, y, 1) * 30;
      const base = 100 + n;
      return [base, base - 5, base - 10];
    });
  }

  static rust(): THREE.CanvasTexture {
    return this.create(32, (x, y) => {
      const n = this.noise(x, y, 2) * 40;
      return [120 + n, 60 + n * 0.5, 30 + n * 0.3];
    });
  }

  static mud(): THREE.CanvasTexture {
    return this.create(32, (x, y) => {
      const n = this.noise(x, y, 3) * 25;
      return [80 + n, 65 + n, 40 + n * 0.5];
    });
  }

  static grass(): THREE.CanvasTexture {
    return this.create(32, (x, y) => {
      const n = this.noise(x, y, 4) * 30;
      return [50 + n, 70 + n, 30 + n * 0.5];
    });
  }

  static wood(): THREE.CanvasTexture {
    return this.create(32, (x, y) => {
      const grain = Math.sin(y * 0.5 + this.noise(x, y, 5) * 5) * 15;
      return [100 + grain, 70 + grain * 0.7, 40 + grain * 0.3];
    });
  }

  static brick(): THREE.CanvasTexture {
    return this.create(64, (x, y) => {
      const brickH = 8, brickW = 16;
      const row = Math.floor(y / brickH);
      const offset = (row % 2) * (brickW / 2);
      const bx = (x + offset) % brickW;
      const by = y % brickH;
      if (bx < 1 || by < 1) return [60, 60, 55];
      const n = this.noise(x, y, 6) * 20;
      return [140 + n, 60 + n * 0.5, 50 + n * 0.3];
    });
  }

  static camo(): THREE.CanvasTexture {
    return this.create(32, (x, y) => {
      const n1 = this.noise(x * 0.3, y * 0.3, 7);
      const n2 = this.noise(x * 0.5, y * 0.5, 8);
      if (n1 > 0.6) return [40, 50, 30];
      if (n2 > 0.5) return [70, 60, 35];
      return [55, 65, 40];
    });
  }

  static road(): THREE.CanvasTexture {
    return this.create(64, (x, y) => {
      const n = this.noise(x, y, 9) * 20;
      const crack = this.noise(x * 2, y * 0.5, 10) > 0.85 ? -30 : 0;
      return [70 + n + crack, 68 + n + crack, 60 + n + crack];
    });
  }
}

// ============================================================
// TERRAIN SYSTEM
// ============================================================
export function getTerrainHeight(x: number, z: number): number {
  let h = 0;
  h += Math.sin(x * 0.02) * Math.cos(z * 0.015) * 4;
  h += Math.sin(x * 0.05 + 1.3) * Math.cos(z * 0.04 + 0.7) * 2;
  h += Math.sin(x * 0.1 + 3.1) * Math.cos(z * 0.08 + 2.1) * 0.8;
  const roadX = Math.sin(z * 0.02) * 15;
  const distToRoad = Math.abs(x - roadX);
  if (distToRoad < 5) {
    h *= distToRoad / 5;
  }
  return h;
}

export function createTerrain(scene: THREE.Scene): THREE.Mesh {
  const size = 300;
  const segments = 100;
  const geo = new THREE.PlaneGeometry(size, size, segments, segments);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const h = getTerrainHeight(x, z);
    pos.setY(i, h);

    const roadX = Math.sin(z * 0.02) * 15;
    const distToRoad = Math.abs(x - roadX);

    let r: number, g: number, b: number;
    if (distToRoad < 4) {
      const n = TextureGen.noise(x * 0.5, z * 0.5, 20) * 15;
      r = (70 + n) / 255; g = (65 + n) / 255; b = (55 + n) / 255;
    } else if (h > 3) {
      const n = TextureGen.noise(x * 0.3, z * 0.3, 21) * 20;
      r = (45 + n) / 255; g = (55 + n) / 255; b = (30 + n) / 255;
    } else {
      const n = TextureGen.noise(x * 0.2, z * 0.2, 22) * 25;
      const mudFactor = TextureGen.noise(x * 0.1, z * 0.1, 23);
      r = (55 + n * mudFactor + 20 * (1 - mudFactor)) / 255;
      g = (65 + n * mudFactor + 10 * (1 - mudFactor)) / 255;
      b = (35 + n * mudFactor * 0.5) / 255;
    }
    colors[i * 3] = r;
    colors[i * 3 + 1] = g;
    colors[i * 3 + 2] = b;
  }

  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();

  const mat = new THREE.MeshLambertMaterial({
    vertexColors: true,
    flatShading: true,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

// ============================================================
// COLLISION SYSTEM - Wall segments for proper doorway entry
// ============================================================
export interface CollisionBox {
  min: THREE.Vector3;
  max: THREE.Vector3;
}

export function checkCollision(pos: THREE.Vector3, radius: number, boxes: CollisionBox[]): THREE.Vector3 {
  const newPos = pos.clone();
  
  for (const box of boxes) {
    const closestPoint = new THREE.Vector3(
      Math.max(box.min.x, Math.min(newPos.x, box.max.x)),
      newPos.y, // Only check XZ collision
      Math.max(box.min.z, Math.min(newPos.z, box.max.z))
    );
    
    const dx = newPos.x - closestPoint.x;
    const dz = newPos.z - closestPoint.z;
    const distance = Math.sqrt(dx * dx + dz * dz);
    
    if (distance < radius && distance > 0.001) {
      const pushDir = new THREE.Vector3(dx, 0, dz).normalize();
      const pushDistance = radius - distance;
      newPos.x += pushDir.x * pushDistance;
      newPos.z += pushDir.z * pushDistance;
    }
  }
  
  return newPos;
}

// ============================================================
// WORLD PROPS
// ============================================================
export interface WorldProp {
  mesh: THREE.Group;
  position: THREE.Vector3;
  type: string;
}

export interface AnomalyZone {
  position: THREE.Vector3;
  radius: number;
  particles: THREE.Points;
}

export function createWorldProps(scene: THREE.Scene): { props: WorldProp[], anomalies: AnomalyZone[], collisionBoxes: CollisionBox[] } {
  const props: WorldProp[] = [];
  const anomalies: AnomalyZone[] = [];
  const collisionBoxes: CollisionBox[] = [];

  // Village Houses - with proper wall collision (doorway open)
  const housePositions = [
    new THREE.Vector3(20, 0, -30),
    new THREE.Vector3(-25, 0, 10),
    new THREE.Vector3(30, 0, 50),
    new THREE.Vector3(-20, 0, -60),
    new THREE.Vector3(15, 0, 80),
  ];

  housePositions.forEach((pos, idx) => {
    const house = createHouse(idx);
    pos.y = getTerrainHeight(pos.x, pos.z);
    house.position.copy(pos);
    scene.add(house);
    
    const w = 6 + idx;
    const d = 5 + (idx % 2) * 2;
    const wallThick = 0.5;
    const doorWidth = 1.4;
    const h = 3.5;
    
    // Back wall - full solid
    collisionBoxes.push({
      min: new THREE.Vector3(pos.x - w/2, pos.y, pos.z - d/2 - wallThick/2),
      max: new THREE.Vector3(pos.x + w/2, pos.y + h, pos.z - d/2 + wallThick/2)
    });
    
    // Left wall - full solid
    collisionBoxes.push({
      min: new THREE.Vector3(pos.x - w/2 - wallThick/2, pos.y, pos.z - d/2),
      max: new THREE.Vector3(pos.x - w/2 + wallThick/2, pos.y + h, pos.z + d/2)
    });
    
    // Right wall - full solid
    collisionBoxes.push({
      min: new THREE.Vector3(pos.x + w/2 - wallThick/2, pos.y, pos.z - d/2),
      max: new THREE.Vector3(pos.x + w/2 + wallThick/2, pos.y + h, pos.z + d/2)
    });
    
    // Front wall - TWO pieces with door gap in middle
    const frontLeftWidth = (w - doorWidth) / 2;
    // Left piece of front wall
    collisionBoxes.push({
      min: new THREE.Vector3(pos.x - w/2, pos.y, pos.z + d/2 - wallThick/2),
      max: new THREE.Vector3(pos.x - w/2 + frontLeftWidth, pos.y + h, pos.z + d/2 + wallThick/2)
    });
    // Right piece of front wall
    collisionBoxes.push({
      min: new THREE.Vector3(pos.x + w/2 - frontLeftWidth, pos.y, pos.z + d/2 - wallThick/2),
      max: new THREE.Vector3(pos.x + w/2, pos.y + h, pos.z + d/2 + wallThick/2)
    });
    
    props.push({ mesh: house, position: pos.clone(), type: 'house' });
  });

  // Vehicles
  const vehiclePositions = [
    { pos: new THREE.Vector3(5, 0, -20), type: 'uaz' },
    { pos: new THREE.Vector3(-8, 0, 30), type: 'zil' },
    { pos: new THREE.Vector3(12, 0, 70), type: 'uaz' },
    { pos: new THREE.Vector3(-5, 0, -80), type: 'zil' },
  ];

  vehiclePositions.forEach(v => {
    const vehicle = v.type === 'uaz' ? createUAZ() : createZIL();
    v.pos.y = getTerrainHeight(v.pos.x, v.pos.z);
    vehicle.position.copy(v.pos);
    vehicle.rotation.y = Math.random() * Math.PI * 2;
    scene.add(vehicle);
    
    const collisionBox: CollisionBox = v.type === 'uaz' ? {
      min: new THREE.Vector3(v.pos.x - 1.5, v.pos.y, v.pos.z - 2.5),
      max: new THREE.Vector3(v.pos.x + 1.5, v.pos.y + 2, v.pos.z + 2.5)
    } : {
      min: new THREE.Vector3(v.pos.x - 1.8, v.pos.y, v.pos.z - 3.5),
      max: new THREE.Vector3(v.pos.x + 1.8, v.pos.y + 2.5, v.pos.z + 3.5)
    };
    collisionBoxes.push(collisionBox);
    
    props.push({ mesh: vehicle, position: v.pos.clone(), type: v.type });
  });

  // Anomaly Zones
  const anomalyPositions = [
    new THREE.Vector3(25, 0, -45),
    new THREE.Vector3(-30, 0, 40),
    new THREE.Vector3(40, 0, 90),
    new THREE.Vector3(-15, 0, -100),
  ];

  anomalyPositions.forEach(pos => {
    pos.y = getTerrainHeight(pos.x, pos.z) + 1;
    const anomaly = createAnomaly(pos);
    scene.add(anomaly.particles);
    anomalies.push({ position: pos.clone(), radius: 8, particles: anomaly.particles });
  });

  // Trees
  for (let i = 0; i < 40; i++) {
    const x = (Math.random() - 0.5) * 250;
    const z = (Math.random() - 0.5) * 250;
    const roadX = Math.sin(z * 0.02) * 15;
    if (Math.abs(x - roadX) < 6) continue;
    const tree = createDeadTree();
    tree.position.set(x, getTerrainHeight(x, z), z);
    scene.add(tree);
    
    collisionBoxes.push({
      min: new THREE.Vector3(x - 0.3, getTerrainHeight(x, z), z - 0.3),
      max: new THREE.Vector3(x + 0.3, getTerrainHeight(x, z) + 4, z + 0.3)
    });
  }

  // Rocks
  for (let i = 0; i < 30; i++) {
    const x = (Math.random() - 0.5) * 250;
    const z = (Math.random() - 0.5) * 250;
    const roadX = Math.sin(z * 0.02) * 15;
    if (Math.abs(x - roadX) < 6) continue;
    const rock = createRock();
    const y = getTerrainHeight(x, z);
    rock.position.set(x, y, z);
    scene.add(rock);
    
    const size = 0.5 + Math.random() * 1.5;
    collisionBoxes.push({
      min: new THREE.Vector3(x - size, y, z - size),
      max: new THREE.Vector3(x + size, y + size, z + size)
    });
  }

  return { props, anomalies, collisionBoxes };
}

function createHouse(variant: number): THREE.Group {
  const group = new THREE.Group();
  const w = 6 + variant;
  const h = 3;
  const d = 5 + (variant % 2) * 2;

  const wallTex = variant % 2 === 0 ? TextureGen.brick() : TextureGen.wood();
  const wallMat = new THREE.MeshLambertMaterial({ map: wallTex, flatShading: true });

  const wallThickness = 0.3;
  // Back wall
  const back = new THREE.Mesh(new THREE.BoxGeometry(w, h, wallThickness), wallMat);
  back.position.set(0, h / 2, -d / 2);
  group.add(back);
  // Left wall
  const left = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, h, d), wallMat);
  left.position.set(-w / 2, h / 2, 0);
  group.add(left);
  // Right wall
  const right = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, h, d), wallMat);
  right.position.set(w / 2, h / 2, 0);
  group.add(right);
  // Front wall (with door gap)
  const doorWidth = 1.4;
  const frontSideWidth = (w - doorWidth) / 2;
  const frontLeft = new THREE.Mesh(new THREE.BoxGeometry(frontSideWidth, h, wallThickness), wallMat);
  frontLeft.position.set(-w / 2 + frontSideWidth / 2, h / 2, d / 2);
  group.add(frontLeft);
  const frontRight = new THREE.Mesh(new THREE.BoxGeometry(frontSideWidth, h, wallThickness), wallMat);
  frontRight.position.set(w / 2 - frontSideWidth / 2, h / 2, d / 2);
  group.add(frontRight);
  const frontTop = new THREE.Mesh(new THREE.BoxGeometry(doorWidth, h - 2.2, wallThickness), wallMat);
  frontTop.position.set(0, h - (h - 2.2) / 2, d / 2);
  group.add(frontTop);

  // Floor
  const floorMat = new THREE.MeshLambertMaterial({ map: TextureGen.concrete(), flatShading: true });
  const floor = new THREE.Mesh(new THREE.BoxGeometry(w - 0.5, 0.2, d - 0.5), floorMat);
  floor.position.set(0, 0.1, 0);
  group.add(floor);

  // Roof
  const roofMat = new THREE.MeshLambertMaterial({ map: TextureGen.rust(), flatShading: true });
  const roofGeo = new THREE.BoxGeometry(w + 1, 0.2, d + 1);
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.position.set(0, h + 0.5, 0);
  roof.rotation.z = 0.15;
  group.add(roof);
  
  const ridge = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, d + 1), roofMat);
  ridge.position.set(0, h + 0.8, 0);
  group.add(ridge);

  // Windows
  const windowMat = new THREE.MeshLambertMaterial({ color: 0x88aacc, flatShading: true });
  const windowFrame = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 0.1), windowMat);
  windowFrame.position.set(-w / 4, h / 2 + 0.5, d / 2 + 0.15);
  group.add(windowFrame);
  
  const windowFrame2 = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 0.1), windowMat);
  windowFrame2.position.set(w / 4, h / 2 + 0.5, d / 2 + 0.15);
  group.add(windowFrame2);

  return group;
}

function createUAZ(): THREE.Group {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshLambertMaterial({ color: 0x4a5a3a, flatShading: true });
  const rustMat = new THREE.MeshLambertMaterial({ map: TextureGen.rust(), flatShading: true });
  const glassMat = new THREE.MeshLambertMaterial({ color: 0x88aacc, transparent: true, opacity: 0.5, flatShading: true });

  const bodyMain = new THREE.Mesh(new THREE.BoxGeometry(2, 1, 4), bodyMat);
  bodyMain.position.y = 1;
  group.add(bodyMain);

  const hood = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.3, 1.5), bodyMat);
  hood.position.set(0, 1.3, -1.2);
  group.add(hood);

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.8, 2), bodyMat);
  cabin.position.set(0, 1.8, -0.5);
  group.add(cabin);

  const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.6, 0.05), glassMat);
  windshield.position.set(0, 1.9, 0.5);
  group.add(windshield);

  const rear = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.6, 1), bodyMat);
  rear.position.set(0, 1.6, 1.5);
  group.add(rear);

  const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 12);
  const wheelMat = new THREE.MeshLambertMaterial({ color: 0x222222, flatShading: true });
  const hubGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.32, 8);
  const hubMat = new THREE.MeshLambertMaterial({ color: 0x666666, flatShading: true });
  
  [[-0.9, 0.4, 1.2], [0.9, 0.4, 1.2], [-0.9, 0.4, -1.2], [0.9, 0.4, -1.2]].forEach(([x, y, z]) => {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.position.set(x, y, z);
    wheel.rotation.z = Math.PI / 2;
    group.add(wheel);
    const hub = new THREE.Mesh(hubGeo, hubMat);
    hub.position.set(x, y, z);
    hub.rotation.z = Math.PI / 2;
    group.add(hub);
  });

  const lightGeo = new THREE.SphereGeometry(0.15, 8, 8);
  const lightMat = new THREE.MeshLambertMaterial({ color: 0xffffcc, emissive: 0x444400 });
  const lightL = new THREE.Mesh(lightGeo, lightMat);
  lightL.position.set(-0.6, 1.2, -2);
  group.add(lightL);
  const lightR = new THREE.Mesh(lightGeo, lightMat);
  lightR.position.set(0.6, 1.2, -2);
  group.add(lightR);

  const rustPatch = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.1), rustMat);
  rustPatch.position.set(0.8, 1.2, 2.01);
  group.add(rustPatch);

  return group;
}

function createZIL(): THREE.Group {
  const group = new THREE.Group();
  const cabMat = new THREE.MeshLambertMaterial({ color: 0x3a5a8a, flatShading: true });
  const woodMat = new THREE.MeshLambertMaterial({ map: TextureGen.wood(), flatShading: true });
  const glassMat = new THREE.MeshLambertMaterial({ color: 0x88aacc, transparent: true, opacity: 0.5, flatShading: true });

  const cabMain = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1.5, 2), cabMat);
  cabMain.position.set(0, 1.5, -2);
  group.add(cabMain);

  const cabRoof = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.3, 1.8), cabMat);
  cabRoof.position.set(0, 2.4, -2);
  group.add(cabRoof);

  const windshield = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.8, 0.05), glassMat);
  windshield.position.set(0, 1.8, -1);
  group.add(windshield);

  const hood = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.8, 1), cabMat);
  hood.position.set(0, 1.2, -3);
  group.add(hood);

  const bed = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.3, 4), woodMat);
  bed.position.set(0, 0.8, 1.5);
  group.add(bed);

  for (let i = 0; i < 4; i++) {
    const plank = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.8, 0.9), woodMat);
    plank.position.set(-1.2, 1.2, -0.5 + i * 1);
    group.add(plank);
    const plankR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.8, 0.9), woodMat);
    plankR.position.set(1.2, 1.2, -0.5 + i * 1);
    group.add(plankR);
  }
  
  const sideB = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1, 0.15), woodMat);
  sideB.position.set(0, 1.3, 3.5);
  group.add(sideB);

  const wheelGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.35, 12);
  const wheelMat = new THREE.MeshLambertMaterial({ color: 0x222222, flatShading: true });
  
  [[-1.1, 0.5, -2], [1.1, 0.5, -2], [-1.1, 0.5, 1], [1.1, 0.5, 1], [-1.1, 0.5, 2.5], [1.1, 0.5, 2.5]].forEach(([x, y, z]) => {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.position.set(x, y, z);
    wheel.rotation.z = Math.PI / 2;
    group.add(wheel);
  });

  return group;
}

function createDeadTree(): THREE.Group {
  const group = new THREE.Group();
  const trunkMat = new THREE.MeshLambertMaterial({ color: 0x3a2a1a, flatShading: true });
  
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.3, 4, 8), trunkMat);
  trunk.position.y = 2;
  group.add(trunk);

  for (let i = 0; i < 5; i++) {
    const branch = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.08, 1.5 + Math.random() * 0.5, 6),
      trunkMat
    );
    const angle = (i / 5) * Math.PI * 2;
    const height = 2.5 + i * 0.4;
    branch.position.set(Math.sin(angle) * 0.5, height, Math.cos(angle) * 0.5);
    branch.rotation.z = (Math.random() - 0.5) * 1.2;
    branch.rotation.x = (Math.random() - 0.5) * 0.5;
    group.add(branch);
  }
  
  return group;
}

function createRock(): THREE.Group {
  const group = new THREE.Group();
  const rockMat = new THREE.MeshLambertMaterial({ color: 0x666666, flatShading: true });
  
  const size = 0.5 + Math.random() * 1.5;
  const rockGeo = new THREE.DodecahedronGeometry(size, 0);
  const rock = new THREE.Mesh(rockGeo, rockMat);
  rock.position.y = size * 0.5;
  rock.scale.set(1, 0.6, 1);
  group.add(rock);
  
  return group;
}

function createAnomaly(pos: THREE.Vector3): { particles: THREE.Points } {
  const count = 80;
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = Math.random() * 5;
    positions[i * 3] = Math.cos(angle) * r;
    positions[i * 3 + 1] = Math.random() * 3;
    positions[i * 3 + 2] = Math.sin(angle) * r;
    colors[i * 3] = 0.2 + Math.random() * 0.3;
    colors[i * 3 + 1] = 0.8 + Math.random() * 0.2;
    colors[i * 3 + 2] = 0.1 + Math.random() * 0.2;
  }

  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.PointsMaterial({
    size: 0.4,
    vertexColors: true,
    transparent: true,
    opacity: 0.7,
    blending: THREE.AdditiveBlending,
  });

  const particles = new THREE.Points(geo, mat);
  particles.position.copy(pos);
  return { particles };
}
