import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { AudioSystem, getTerrainHeight, createTerrain, createWorldProps } from './game/engine';
import { NPC, createNPC, updateNPC, Weapon, createWeaponViewmodel, LootItem, createLoot, ItemType } from './game/entities';

interface InventoryItem {
  type: ItemType;
  name: string;
  gridX: number;
  gridY: number;
}

interface HUDState {
  health: number;
  radiation: number;
  currentWeapon: number;
  weaponName: string;
  currentMag: number;
  magSize: number;
  reserveAmmo: number;
  inventory: InventoryItem[];
  armorSlot: InventoryItem | null;
  artifactSlots: (InventoryItem | null)[];
  log: string[];
  isDead: boolean;
  prompt: string;
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [started, setStarted] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const showInventoryRef = useRef(false);
  const [hud, setHud] = useState<HUDState>({
    health: 100,
    radiation: 0,
    currentWeapon: 0,
    weaponName: 'PMm Makarov',
    currentMag: 8,
    magSize: 8,
    reserveAmmo: 32,
    inventory: [],
    armorSlot: null,
    artifactSlots: [null, null],
    log: ['Welcome to the Zone, Stalker...'],
    isDead: false,
    prompt: '',
  });

  // Game data refs (mutable game state)
  const gameDataRef = useRef<{
    health: number;
    radiation: number;
    currentWeaponIdx: number;
    weapons: Weapon[];
    inventory: InventoryItem[];
    armorSlot: InventoryItem | null;
    artifactSlots: (InventoryItem | null)[];
    log: string[];
    isDead: boolean;
    npcs: NPC[];
    lootItems: LootItem[];
    playerPos: THREE.Vector3;
    yaw: number;
    pitch: number;
    isCrouching: boolean;
    isSprinting: boolean;
    isMouseDown: boolean;
    cameraHeight: number;
    weaponBob: number;
    weaponRecoil: number;
    geigerTimer: number;
    audio: AudioSystem | null;
    scene: THREE.Scene | null;
    anomalies: any[];
  }>({
    health: 100,
    radiation: 0,
    currentWeaponIdx: 0,
    weapons: [],
    inventory: [],
    armorSlot: null,
    artifactSlots: [null, null],
    log: ['Welcome to the Zone, Stalker...'],
    isDead: false,
    npcs: [],
    lootItems: [],
    playerPos: new THREE.Vector3(0, 1.7, 0),
    yaw: 0,
    pitch: 0,
    isCrouching: false,
    isSprinting: false,
    isMouseDown: false,
    cameraHeight: 1.7,
    weaponBob: 0,
    weaponRecoil: 0,
    geigerTimer: 0,
    audio: null,
    scene: null,
    anomalies: [],
  });

  const startGame = useCallback(() => {
    setStarted(true);
  }, []);

  useEffect(() => {
    showInventoryRef.current = showInventory;
  }, [showInventory]);

  useEffect(() => {
    if (!started || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const gd = gameDataRef.current;

    // ============================================================
    // THREE.JS SETUP
    // ============================================================
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x4a5240);
    scene.fog = new THREE.Fog(0x4a5240, 15, 85);
    gd.scene = scene;

    const camera = new THREE.PerspectiveCamera(75, 320 / 240, 0.1, 100);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
    renderer.setSize(320, 240, false);
    renderer.setPixelRatio(1);

    const ambientLight = new THREE.AmbientLight(0x606050, 0.6);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffe8c0, 0.8);
    dirLight.position.set(30, 50, 20);
    scene.add(dirLight);

    const audio = new AudioSystem();
    audio.init();
    gd.audio = audio;

    // ============================================================
    // WORLD
    // ============================================================
    createTerrain(scene);
    const { anomalies } = createWorldProps(scene);
    gd.anomalies = anomalies;

    const muzzleFlash = new THREE.PointLight(0xffaa44, 0, 8);
    scene.add(muzzleFlash);

    // ============================================================
    // WEAPONS
    // ============================================================
    const weapons = [createWeaponViewmodel('pistol'), createWeaponViewmodel('rifle')];
    gd.weapons = weapons;
    gd.currentWeaponIdx = 0;

    const weaponScene = new THREE.Scene();
    const weaponCamera = new THREE.PerspectiveCamera(60, 320 / 240, 0.01, 10);
    weaponScene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const wDirLight = new THREE.DirectionalLight(0xffffff, 0.5);
    wDirLight.position.set(1, 2, 1);
    weaponScene.add(wDirLight);

    weapons.forEach(w => {
      w.group.position.set(0.15, -0.12, -0.3);
      weaponScene.add(w.group);
    });

    // ============================================================
    // NPCs
    // ============================================================
    const npcs: NPC[] = [];
    const banditSpawns = [
      new THREE.Vector3(22, 0, -28), new THREE.Vector3(-23, 0, 12),
      new THREE.Vector3(32, 0, 52), new THREE.Vector3(-18, 0, -58),
      new THREE.Vector3(17, 0, 82), new THREE.Vector3(8, 0, 0),
      new THREE.Vector3(-10, 0, -40),
    ];
    banditSpawns.forEach(pos => { const n = createNPC('bandit', pos); npcs.push(n); scene.add(n.group); });

    const mutantSpawns = [
      new THREE.Vector3(40, 0, -60), new THREE.Vector3(42, 0, -58),
      new THREE.Vector3(-40, 0, 60), new THREE.Vector3(-38, 0, 62),
      new THREE.Vector3(50, 0, 20), new THREE.Vector3(-50, 0, -30),
    ];
    mutantSpawns.forEach(pos => { const n = createNPC('mutant', pos); npcs.push(n); scene.add(n.group); });

    const stalkerSpawns = [
      new THREE.Vector3(-30, 0, -20), new THREE.Vector3(35, 0, 30), new THREE.Vector3(-10, 0, 70),
    ];
    stalkerSpawns.forEach(pos => { const n = createNPC('stalker', pos); npcs.push(n); scene.add(n.group); });

    gd.npcs = npcs;

    // ============================================================
    // LOOT
    // ============================================================
    const lootItems: LootItem[] = [];
    const lootSpots: { pos: THREE.Vector3; type: ItemType }[] = [
      { pos: new THREE.Vector3(20, 0, -30), type: 'ammo545' },
      { pos: new THREE.Vector3(-25, 0, 10), type: 'medkit' },
      { pos: new THREE.Vector3(30, 0, 50), type: 'ammo9' },
      { pos: new THREE.Vector3(-20, 0, -60), type: 'antirad' },
      { pos: new THREE.Vector3(15, 0, 80), type: 'armor' },
      { pos: new THREE.Vector3(5, 0, -20), type: 'ammo545' },
      { pos: new THREE.Vector3(-8, 0, 30), type: 'medkit' },
      { pos: new THREE.Vector3(25, 0, -45), type: 'artifact' },
      { pos: new THREE.Vector3(-30, 0, 40), type: 'artifact' },
      { pos: new THREE.Vector3(40, 0, 90), type: 'artifact' },
    ];
    lootSpots.forEach(l => {
      const item = createLoot(l.pos, l.type);
      lootItems.push(item);
      scene.add(item.mesh);
    });
    gd.lootItems = lootItems;

    // ============================================================
    // INPUT
    // ============================================================
    const keys: Record<string, boolean> = {};
    let isLocked = false;

    const onKeyDown = (e: KeyboardEvent) => {
      keys[e.code] = true;
      if (gd.isDead) return;
      if (e.code === 'Digit1') gd.currentWeaponIdx = 0;
      if (e.code === 'Digit2') gd.currentWeaponIdx = 1;
      if (e.code === 'KeyC' || e.code === 'ControlLeft') { e.preventDefault(); gd.isCrouching = !gd.isCrouching; }
      if (e.code === 'KeyR') startReload();
      if (e.code === 'KeyI' || e.code === 'Tab') { e.preventDefault(); toggleInventory(); }
      if (e.code === 'KeyE' || e.code === 'KeyF') tryPickup();
    };
    const onKeyUp = (e: KeyboardEvent) => { keys[e.code] = false; };
    const onMouseDown = (e: MouseEvent) => { if (e.button === 0) gd.isMouseDown = true; };
    const onMouseUp = (e: MouseEvent) => { if (e.button === 0) gd.isMouseDown = false; };
    const onMouseMove = (e: MouseEvent) => {
      if (!isLocked || showInventoryRef.current) return;
      gd.yaw -= e.movementX * 0.002;
      gd.pitch -= e.movementY * 0.002;
      gd.pitch = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, gd.pitch));
    };
    const onPointerLockChange = () => { isLocked = document.pointerLockElement === canvas; };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('pointerlockchange', onPointerLockChange);

    const onCanvasClick = () => {
      if (!isLocked && !showInventoryRef.current && !gd.isDead) {
        canvas.requestPointerLock();
      }
    };
    canvas.addEventListener('click', onCanvasClick);

    // ============================================================
    // GAME FUNCTIONS
    // ============================================================
    function addLog(msg: string) {
      gd.log = [...gd.log.slice(-6), msg];
    }

    function startReload() {
      const w = weapons[gd.currentWeaponIdx];
      if (w.isReloading || w.currentMag === w.magSize || w.reserveAmmo <= 0) return;
      w.isReloading = true;
      w.reloadStartTime = performance.now() / 1000;
      audio.playReload();
      addLog(`Reloading ${w.name}...`);
    }

    function finishReload() {
      const w = weapons[gd.currentWeaponIdx];
      const needed = w.magSize - w.currentMag;
      const available = Math.min(needed, w.reserveAmmo);
      w.currentMag += available;
      w.reserveAmmo -= available;
      w.isReloading = false;
      addLog(`${w.name} reloaded (${w.currentMag}/${w.magSize})`);
    }

    function fireWeapon() {
      const w = weapons[gd.currentWeaponIdx];
      const now = performance.now() / 1000;
      if (w.isReloading) return;
      if (now - w.lastFireTime < w.fireRate) return;
      if (w.currentMag <= 0) { addLog('Click! Empty magazine.'); w.lastFireTime = now; return; }

      w.currentMag--;
      w.lastFireTime = now;
      gd.weaponRecoil = 0.05;
      muzzleFlash.intensity = 3;
      muzzleFlash.position.copy(camera.position);
      const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
      muzzleFlash.position.add(fwd.multiplyScalar(1));
      audio.playGunshot(gd.currentWeaponIdx === 0);
      gd.pitch += w.recoil * (0.8 + Math.random() * 0.4);
      gd.yaw += (Math.random() - 0.5) * w.recoil * 0.5;

      // Raycast
      const raycaster = new THREE.Raycaster();
      const spreadX = (Math.random() - 0.5) * w.bloom;
      const spreadY = (Math.random() - 0.5) * w.bloom;
      const shootDir = new THREE.Vector3(spreadX, spreadY, -1).applyQuaternion(camera.quaternion).normalize();
      raycaster.set(camera.position, shootDir);
      raycaster.far = 100;

      const npcGroups = npcs.filter(n => n.state !== 'dead').map(n => n.group);
      const intersects = raycaster.intersectObjects(npcGroups, true);

      if (intersects.length > 0) {
        const hitObj = intersects[0].object;
        for (const npc of npcs) {
          if (npc.state === 'dead') continue;
          let parent: THREE.Object3D | null = hitObj;
          while (parent) {
            if (parent === npc.group) {
              npc.health -= w.damage;
              audio.playHit();
              if (npc.health <= 0) {
                addLog(`${npc.faction} eliminated!`);
                const dropType: ItemType = Math.random() > 0.5 ? 'ammo545' : 'medkit';
                const loot = createLoot(npc.position.clone(), dropType);
                lootItems.push(loot);
                scene.add(loot.mesh);
              }
              createHitSpark(intersects[0].point);
              return;
            }
            parent = parent.parent;
          }
        }
      }
      // Hit ground
      const ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const hitPoint = new THREE.Vector3();
      if (raycaster.ray.intersectPlane(ground, hitPoint)) {
        createHitSpark(hitPoint);
      }
    }

    function createHitSpark(pos: THREE.Vector3) {
      const sparkGeo = new THREE.SphereGeometry(0.15, 4, 4);
      const sparkMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
      const spark = new THREE.Mesh(sparkGeo, sparkMat);
      spark.position.copy(pos);
      scene.add(spark);
      setTimeout(() => scene.remove(spark), 100);
    }

    function tryPickup() {
      const playerGround = new THREE.Vector3(gd.playerPos.x, 0, gd.playerPos.z);
      for (const item of lootItems) {
        if (item.collected) continue;
        const dist = playerGround.distanceTo(new THREE.Vector3(item.position.x, 0, item.position.z));
        if (dist < 3) {
          item.collected = true;
          scene.remove(item.mesh);
          audio.playPickup();
          addLog(`Picked up ${item.name}`);

          if (item.type === 'ammo9') {
            weapons[0].reserveAmmo += 16;
          } else if (item.type === 'ammo545') {
            weapons[1].reserveAmmo += 30;
          } else {
            const gridItem: InventoryItem = { type: item.type, name: item.name, gridX: 0, gridY: 0 };
            let placed = false;
            for (let y = 0; y < 4 && !placed; y++) {
              for (let x = 0; x < 6 && !placed; x++) {
                if (!gd.inventory.find(i => i.gridX === x && i.gridY === y)) {
                  gridItem.gridX = x;
                  gridItem.gridY = y;
                  placed = true;
                }
              }
            }
            if (placed) gd.inventory.push(gridItem);
          }
          break;
        }
      }
    }

    function toggleInventory() {
      setShowInventory(prev => {
        const next = !prev;
        showInventoryRef.current = next;
        if (next) {
          document.exitPointerLock();
        } else {
          canvas.requestPointerLock();
        }
        return next;
      });
    }

    // ============================================================
    // GAME LOOP
    // ============================================================
    let lastTime = performance.now();
    let animFrameId: number;
    let hudUpdateTimer = 0;
    let semiAutoFired = false;
    let gpCrouchLast = false;
    let gpReloadLast = false;
    let gpWepLast = false;

    function gameLoop() {
      animFrameId = requestAnimationFrame(gameLoop);
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      if (gd.isDead) {
        renderer.autoClear = false;
        renderer.clear();
        renderer.render(scene, camera);
        return;
      }

      if (showInventoryRef.current) {
        renderer.autoClear = false;
        renderer.clear();
        renderer.render(scene, camera);
        return;
      }

      // ---- GAMEPAD ----
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      let gpMoveX = 0, gpMoveY = 0, gpLookX = 0, gpLookY = 0;
      let gpFire = false, gpSprint = false;
      for (const gp of gamepads) {
        if (!gp) continue;
        // Left stick = move
        if (Math.abs(gp.axes[0]) > 0.15) gpMoveX = gp.axes[0];
        if (Math.abs(gp.axes[1]) > 0.15) gpMoveY = gp.axes[1];
        // Right stick = look
        if (Math.abs(gp.axes[2]) > 0.15) gpLookX = gp.axes[2];
        if (Math.abs(gp.axes[3]) > 0.15) gpLookY = gp.axes[3];
        // Right trigger = fire
        if (gp.buttons[7] && gp.buttons[7].value > 0.5) gpFire = true;
        // Left trigger = sprint
        if (gp.buttons[6] && gp.buttons[6].value > 0.5) gpSprint = true;
        // A button = crouch toggle
        if (gp.buttons[0] && gp.buttons[0].pressed) {
          if (!gpCrouchLast) { gd.isCrouching = !gd.isCrouching; }
          gpCrouchLast = true;
        } else { gpCrouchLast = false; }
        // B button = reload
        if (gp.buttons[1] && gp.buttons[1].pressed && !gpReloadLast) { startReload(); gpReloadLast = true; }
        if (!(gp.buttons[1] && gp.buttons[1].pressed)) gpReloadLast = false;
        // X/Y = weapon switch
        if (gp.buttons[2] && gp.buttons[2].pressed && !gpWepLast) { gd.currentWeaponIdx = 0; gpWepLast = true; }
        if (gp.buttons[3] && gp.buttons[3].pressed && !gpWepLast) { gd.currentWeaponIdx = 1; gpWepLast = true; }
        if (!(gp.buttons[2]?.pressed || gp.buttons[3]?.pressed)) gpWepLast = false;
        break; // Use first gamepad
      }

      // Gamepad look
      if (gpLookX !== 0 || gpLookY !== 0) {
        gd.yaw -= gpLookX * 2.5 * dt;
        gd.pitch -= gpLookY * 2.0 * dt;
        gd.pitch = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, gd.pitch));
      }

      // ---- MOVEMENT ----
      gd.isSprinting = keys['ShiftLeft'] || keys['ShiftRight'] || gpSprint;
      const targetHeight = gd.isCrouching ? 0.9 : 1.7;
      gd.cameraHeight += (targetHeight - gd.cameraHeight) * dt * 8;

      const moveSpeed = gd.isCrouching ? 3.5 : gd.isSprinting ? 10 : 6;
      const forward = new THREE.Vector3(-Math.sin(gd.yaw), 0, -Math.cos(gd.yaw));
      const right = new THREE.Vector3(Math.cos(gd.yaw), 0, -Math.sin(gd.yaw));
      const moveDir = new THREE.Vector3();
      if (keys['KeyW']) moveDir.add(forward);
      if (keys['KeyS']) moveDir.sub(forward);
      if (keys['KeyA']) moveDir.sub(right);
      if (keys['KeyD']) moveDir.add(right);
      // Gamepad movement
      if (gpMoveX !== 0 || gpMoveY !== 0) {
        moveDir.add(right.clone().multiplyScalar(gpMoveX));
        moveDir.add(forward.clone().multiplyScalar(-gpMoveY));
      }

      if (moveDir.length() > 0) {
        moveDir.normalize();
        gd.playerPos.x += moveDir.x * moveSpeed * dt;
        gd.playerPos.z += moveDir.z * moveSpeed * dt;
        gd.weaponBob += dt * (gd.isSprinting ? 12 : 8);
      }

      gd.playerPos.x = Math.max(-140, Math.min(140, gd.playerPos.x));
      gd.playerPos.z = Math.max(-140, Math.min(140, gd.playerPos.z));

      const terrainY = getTerrainHeight(gd.playerPos.x, gd.playerPos.z);
      gd.playerPos.y = terrainY + gd.cameraHeight;

      camera.position.copy(gd.playerPos);
      camera.rotation.order = 'YXZ';
      camera.rotation.y = gd.yaw;
      camera.rotation.x = gd.pitch;

      // ---- FIRING ----
      const w = weapons[gd.currentWeaponIdx];
      const firing = (gd.isMouseDown && isLocked) || gpFire;
      if (firing) {
        if (w.auto) {
          fireWeapon();
        } else {
          if (!semiAutoFired) {
            fireWeapon();
            semiAutoFired = true;
          }
        }
      } else {
        semiAutoFired = false;
      }

      if (w.isReloading) {
        const elapsed = performance.now() / 1000 - w.reloadStartTime;
        if (elapsed >= w.reloadTime) finishReload();
      }

      // ---- WEAPON VIEWMODEL ----
      weapons.forEach((wp, i) => { wp.group.visible = i === gd.currentWeaponIdx; });
      const bobX = Math.sin(gd.weaponBob) * 0.005 * (gd.isSprinting ? 2 : 1);
      const bobY = Math.abs(Math.cos(gd.weaponBob)) * 0.005 * (gd.isSprinting ? 2 : 1);
      const baseX = 0.15, baseY = -0.12, baseZ = -0.3;
      w.group.position.set(baseX + bobX, baseY + bobY, baseZ);

      if (w.isReloading) {
        const elapsed = performance.now() / 1000 - w.reloadStartTime;
        const t = elapsed / w.reloadTime;
        w.group.rotation.x = Math.sin(t * Math.PI) * 0.5;
        w.group.position.y = baseY - Math.sin(t * Math.PI) * 0.1;
      } else {
        w.group.rotation.x *= 0.9;
      }

      muzzleFlash.intensity *= 0.8;

      // ---- RADIATION ----
      let inAnomaly = false;
      for (const anomaly of anomalies) {
        const dist = new THREE.Vector2(gd.playerPos.x - anomaly.position.x, gd.playerPos.z - anomaly.position.z).length();
        if (dist < anomaly.radius) { inAnomaly = true; break; }
      }
      if (inAnomaly) {
        gd.radiation = Math.min(100, gd.radiation + dt * 10);
        gd.geigerTimer += dt;
        if (gd.geigerTimer > 0.1 + Math.random() * 0.2) { audio.playGeiger(); gd.geigerTimer = 0; }
      }
      if (gd.radiation > 50) gd.health = Math.max(0, gd.health - dt * 3);

      // Artifact effects
      const hasArtifact = gd.artifactSlots[0] !== null || gd.artifactSlots[1] !== null;
      if (hasArtifact) {
        gd.health = Math.min(100, gd.health + dt * 2);
        gd.radiation = Math.max(0, gd.radiation - dt * 3);
      }

      // ---- NPC UPDATE ----
      for (const npc of npcs) {
        const result = updateNPC(npc, dt, gd.playerPos, npcs);
        if (result.event) addLog(result.event);
        if (result.damage > 0) {
          gd.health = Math.max(0, gd.health - result.damage);
          audio.playDamage();
        }
      }

      if (gd.health <= 0 && !gd.isDead) {
        gd.isDead = true;
        addLog('You have died in the Zone...');
      }

      // ---- PROMPT ----
      let promptText = '';
      const playerGround = new THREE.Vector2(gd.playerPos.x, gd.playerPos.z);
      for (const item of lootItems) {
        if (item.collected) continue;
        const dist = playerGround.distanceTo(new THREE.Vector2(item.position.x, item.position.z));
        if (dist < 3) { promptText = `[E] Pick up ${item.name}`; break; }
      }

      // ---- ANOMALY PARTICLES ----
      for (const anomaly of anomalies) {
        const positions = anomaly.particles.geometry.attributes.position;
        for (let i = 0; i < positions.count; i++) {
          let y = positions.getY(i);
          y += dt * 0.5;
          if (y > 3) y = 0;
          positions.setY(i, y);
          const x = positions.getX(i) + Math.sin(now * 0.001 + i) * dt * 0.3;
          const z = positions.getZ(i) + Math.cos(now * 0.001 + i) * dt * 0.3;
          positions.setX(i, x);
          positions.setZ(i, z);
        }
        positions.needsUpdate = true;
      }

      // ---- LOOT FLOAT ----
      for (const item of lootItems) {
        if (!item.collected) {
          item.mesh.rotation.y += dt * 2;
          item.mesh.position.y = item.position.y + Math.sin(now * 0.003) * 0.1;
        }
      }

      // ---- RENDER ----
      renderer.autoClear = false;
      renderer.clear();
      renderer.render(scene, camera);
      renderer.clearDepth();
      renderer.render(weaponScene, weaponCamera);

      // ---- UPDATE HUD (throttled) ----
      hudUpdateTimer += dt;
      if (hudUpdateTimer > 0.1) {
        hudUpdateTimer = 0;
        setHud({
          health: gd.health,
          radiation: gd.radiation,
          currentWeapon: gd.currentWeaponIdx,
          weaponName: w.name,
          currentMag: w.currentMag,
          magSize: w.magSize,
          reserveAmmo: w.reserveAmmo,
          inventory: [...gd.inventory],
          armorSlot: gd.armorSlot,
          artifactSlots: [...gd.artifactSlots],
          log: [...gd.log],
          isDead: gd.isDead,
          prompt: promptText,
        });
      }
    }

    gameLoop();

    return () => {
      cancelAnimationFrame(animFrameId);
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('pointerlockchange', onPointerLockChange);
      canvas.removeEventListener('click', onCanvasClick);
      renderer.dispose();
    };
  }, [started]);

  // ============================================================
  // USE ITEM
  // ============================================================
  const useItem = useCallback((item: InventoryItem) => {
    const gd = gameDataRef.current;
    const idx = gd.inventory.findIndex(i => i.gridX === item.gridX && i.gridY === item.gridY);
    if (idx === -1) return;

    switch (item.type) {
      case 'medkit':
        gd.health = Math.min(100, gd.health + 50);
        gd.inventory.splice(idx, 1);
        gd.audio?.playPickup();
        break;
      case 'antirad':
        gd.radiation = Math.max(0, gd.radiation - 50);
        gd.inventory.splice(idx, 1);
        gd.audio?.playPickup();
        break;
      case 'armor': {
        const old = gd.armorSlot;
        gd.armorSlot = item;
        gd.inventory.splice(idx, 1);
        if (old) gd.inventory.push({ ...old, gridX: item.gridX, gridY: item.gridY });
        break;
      }
      case 'artifact': {
        const emptySlot = gd.artifactSlots[0] === null ? 0 : gd.artifactSlots[1] === null ? 1 : -1;
        if (emptySlot >= 0) {
          gd.artifactSlots[emptySlot] = item;
          gd.inventory.splice(idx, 1);
        }
        break;
      }
    }
    // Force HUD update
    setHud(prev => ({
      ...prev,
      health: gd.health,
      radiation: gd.radiation,
      inventory: [...gd.inventory],
      armorSlot: gd.armorSlot,
      artifactSlots: [...gd.artifactSlots],
    }));
  }, []);

  // ============================================================
  // START SCREEN
  // ============================================================
  if (!started) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-black font-mono select-none">
        <div className="relative">
          <h1 className="text-5xl mb-2 text-yellow-500 tracking-widest" style={{ textShadow: '0 0 20px #aa8800, 0 0 40px #664400' }}>
            S.T.A.L.K.E.R. 64
          </h1>
          <p className="text-center text-green-600 text-sm tracking-wider mb-8">— THE CORDON —</p>
        </div>
        <div className="text-gray-500 text-xs text-center space-y-1 mb-8 border border-gray-800 p-4 bg-gray-900/50">
          <p className="text-green-500 mb-2">▸ CONTROLS ◂</p>
          <p>WASD - Move | Mouse - Look | Shift - Sprint</p>
          <p>C - Toggle Crouch | 1/2 - Switch Weapons</p>
          <p>LMB - Fire | R - Reload | E - Pick Up</p>
          <p>I / Tab - Inventory PDA</p>
          <p className="text-gray-600 mt-2">Click the game to capture mouse</p>
        </div>
        <button
          onClick={startGame}
          className="px-10 py-3 bg-green-900/80 border-2 border-green-600 text-green-300 hover:bg-green-800 hover:border-green-400 transition-all text-lg tracking-wider"
          style={{ textShadow: '0 0 5px #44ff44' }}
        >
          ▶ ENTER THE ZONE
        </button>
        <p className="text-gray-700 text-xs mt-6">N64-style procedural FPS • No external assets</p>
      </div>
    );
  }

  // ============================================================
  // GAME HUD
  // ============================================================
  return (
    <div className="w-full h-full relative overflow-hidden bg-black select-none">
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ imageRendering: 'pixelated' }}
      />

      {/* HUD */}
      {!hud.isDead && !showInventory && (
        <>
          {/* Crosshair */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative w-8 h-8">
              <div className="absolute top-0 left-1/2 w-[2px] h-2.5 bg-green-400/80 -translate-x-1/2"></div>
              <div className="absolute bottom-0 left-1/2 w-[2px] h-2.5 bg-green-400/80 -translate-x-1/2"></div>
              <div className="absolute left-0 top-1/2 w-2.5 h-[2px] bg-green-400/80 -translate-y-1/2"></div>
              <div className="absolute right-0 top-1/2 w-2.5 h-[2px] bg-green-400/80 -translate-y-1/2"></div>
              <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-green-300/50 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
            </div>
          </div>

          {/* Health & Radiation */}
          <div className="absolute bottom-4 left-4 pointer-events-none">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-red-500 text-[10px] font-mono w-7 font-bold">HP</span>
              <div className="w-36 h-3.5 bg-black/80 border border-red-900">
                <div
                  className="h-full transition-all duration-200"
                  style={{ width: `${hud.health}%`, background: hud.health > 30 ? '#cc2222' : '#ff0000' }}
                ></div>
              </div>
              <span className="text-red-400 text-[10px] font-mono w-8">{Math.round(hud.health)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-yellow-500 text-[10px] font-mono w-7 font-bold">RAD</span>
              <div className="w-36 h-3.5 bg-black/80 border border-yellow-900">
                <div
                  className="h-full transition-all duration-200"
                  style={{ width: `${hud.radiation}%`, background: hud.radiation > 50 ? '#aaaa00' : '#888800' }}
                ></div>
              </div>
              <span className="text-yellow-400 text-[10px] font-mono w-8">{Math.round(hud.radiation)}</span>
            </div>
          </div>

          {/* Weapon Info */}
          <div className="absolute bottom-4 right-4 text-right pointer-events-none">
            <div className="text-green-500 text-[10px] font-mono tracking-wider">{hud.weaponName}</div>
            <div className="text-green-300 text-xl font-mono font-bold leading-tight">
              {hud.currentMag}<span className="text-green-600 text-sm">/{hud.magSize}</span>
            </div>
            <div className="text-green-600 text-[10px] font-mono">Reserve: {hud.reserveAmmo}</div>
          </div>

          {/* Event Log */}
          <div className="absolute top-4 left-4 pointer-events-none max-w-[250px]">
            {hud.log.slice(-4).map((msg, i) => (
              <div key={i} className="text-yellow-200/70 text-[10px] font-mono mb-0.5 leading-tight">
                › {msg}
              </div>
            ))}
          </div>

          {/* Weapon Slots */}
          <div className="absolute top-4 right-4 pointer-events-none">
            <div className={`text-[10px] font-mono px-2 py-0.5 mb-0.5 ${hud.currentWeapon === 0 ? 'text-green-300 bg-green-900/60 border border-green-700' : 'text-gray-600'}`}>
              [1] PMm Makarov
            </div>
            <div className={`text-[10px] font-mono px-2 py-0.5 ${hud.currentWeapon === 1 ? 'text-green-300 bg-green-900/60 border border-green-700' : 'text-gray-600'}`}>
              [2] AK-74
            </div>
          </div>

          {/* Pickup Prompt */}
          {hud.prompt && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-10 pointer-events-none">
              <div className="text-yellow-300 text-xs font-mono bg-black/70 px-3 py-1.5 border border-yellow-800/50">
                {hud.prompt}
              </div>
            </div>
          )}
        </>
      )}

      {/* Death Screen */}
      {hud.isDead && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-950/80 pointer-events-none">
          <h2 className="text-5xl text-red-300 font-mono mb-4" style={{ textShadow: '0 0 20px #ff0000' }}>YOU DIED</h2>
          <p className="text-red-400/80 font-mono text-sm">The Zone claims another Stalker...</p>
          <p className="text-red-600 font-mono text-xs mt-6">Refresh page to restart</p>
        </div>
      )}

      {/* Inventory */}
      {showInventory && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-50">
          <div className="w-[640px] max-w-[95vw] bg-gray-950 border-2 border-green-800 p-5 font-mono">
            <h2 className="text-green-400 text-lg mb-4 text-center border-b border-green-900 pb-2 tracking-widest">
              ◈ PDA — INVENTORY ◈
            </h2>

            <div className="flex gap-5 flex-wrap">
              {/* Equipment */}
              <div className="flex-1 min-w-[220px]">
                <h3 className="text-green-600 text-xs mb-2 tracking-wider">▸ EQUIPMENT</h3>
                <div className="space-y-2">
                  <div className="border border-gray-800 p-2 bg-gray-900/50">
                    <div className="text-gray-600 text-[10px]">WEAPON SLOT 1</div>
                    <div className="text-green-400 text-xs">PMm Makarov (9x18mm)</div>
                  </div>
                  <div className="border border-gray-800 p-2 bg-gray-900/50">
                    <div className="text-gray-600 text-[10px]">WEAPON SLOT 2</div>
                    <div className="text-green-400 text-xs">AK-74 (5.45x39mm)</div>
                  </div>
                  <div className="border border-gray-800 p-2 bg-gray-900/50">
                    <div className="text-gray-600 text-[10px]">ARMOR</div>
                    <div className="text-green-400 text-xs">
                      {hud.armorSlot ? `▸ ${hud.armorSlot.name}` : '— Empty —'}
                    </div>
                  </div>
                  <div className="border border-gray-800 p-2 bg-gray-900/50">
                    <div className="text-gray-600 text-[10px]">ARTIFACT BELT</div>
                    <div className="flex gap-2 mt-1">
                      <div className="border border-purple-900 bg-purple-950/30 p-1.5 flex-1 text-center text-[10px] text-purple-300">
                        {hud.artifactSlots[0]?.name || '—'}
                      </div>
                      <div className="border border-purple-900 bg-purple-950/30 p-1.5 flex-1 text-center text-[10px] text-purple-300">
                        {hud.artifactSlots[1]?.name || '—'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-3 border-t border-green-900 pt-2">
                  <div className="text-gray-500 text-[10px] space-y-0.5">
                    <div>Health: <span className="text-red-400">{Math.round(hud.health)}%</span></div>
                    <div>Radiation: <span className="text-yellow-400">{Math.round(hud.radiation)}%</span></div>
                    <div>9x18mm: <span className="text-yellow-300">{hud.reserveAmmo}</span> | 5.45mm: <span className="text-yellow-300">{hud.reserveAmmo}</span></div>
                  </div>
                </div>
              </div>

              {/* Grid */}
              <div className="flex-1 min-w-[220px]">
                <h3 className="text-green-600 text-xs mb-2 tracking-wider">▸ BACKPACK (6×4)</h3>
                <div className="grid grid-cols-6 gap-1">
                  {Array.from({ length: 24 }).map((_, idx) => {
                    const x = idx % 6;
                    const y = Math.floor(idx / 6);
                    const item = hud.inventory.find(i => i.gridX === x && i.gridY === y);
                    return (
                      <div
                        key={idx}
                        className={`w-11 h-11 border flex items-center justify-center cursor-pointer text-sm transition-colors
                          ${item
                            ? 'border-green-700 bg-green-950/60 hover:bg-green-900/60 hover:border-green-500'
                            : 'border-gray-800 bg-gray-900/20'
                          }`}
                        onClick={() => item && useItem(item)}
                        title={item ? `Use: ${item.name}` : ''}
                      >
                        {item && (
                          <span className={`text-lg ${
                            item.type === 'medkit' ? 'text-red-400' :
                            item.type === 'antirad' ? 'text-green-400' :
                            item.type === 'ammo9' ? 'text-yellow-400' :
                            item.type === 'ammo545' ? 'text-yellow-300' :
                            item.type === 'artifact' ? 'text-purple-300' :
                            'text-gray-300'
                          }`}>
                            {item.type === 'medkit' ? '✚' :
                             item.type === 'antirad' ? '☢' :
                             item.type === 'ammo9' ? '9' :
                             item.type === 'ammo545' ? '5' :
                             item.type === 'artifact' ? '◆' : '▣'}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
                <p className="text-gray-600 text-[10px] mt-2">Click items to use/equip them</p>
              </div>
            </div>

            <div className="mt-4 text-center">
              <button
                onClick={() => {
                  setShowInventory(false);
                  showInventoryRef.current = false;
                  canvasRef.current?.requestPointerLock();
                }}
                className="px-6 py-1.5 bg-green-900/80 border border-green-600 text-green-300 hover:bg-green-800 text-xs tracking-wider"
              >
                CLOSE [I/TAB]
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
