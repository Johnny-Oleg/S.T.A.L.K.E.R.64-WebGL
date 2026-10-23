import * as THREE from 'three';
import { getTerrainHeight, TextureGen } from './engine';

// ============================================================
// NPC SYSTEM - Faction AI
// ============================================================
export type Faction = 'bandit' | 'mutant' | 'stalker';

export interface NPC {
  group: THREE.Group;
  position: THREE.Vector3;
  faction: Faction;
  health: number;
  maxHealth: number;
  speed: number;
  state: 'patrol' | 'combat' | 'dead';
  target: THREE.Vector3 | null;
  patrolTarget: THREE.Vector3;
  attackCooldown: number;
  walkCycle: number;
  healthBar: THREE.Mesh | null;
}

export function createNPCMesh(faction: Faction): THREE.Group {
  const group = new THREE.Group();

  if (faction === 'bandit') {
    // Dark trench coat, balaclava
    const bodyMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a, flatShading: true });
    const headMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a, flatShading: true });
    const skinMat = new THREE.MeshLambertMaterial({ color: 0x8a6a50, flatShading: true });

    // Legs
    const legGeo = new THREE.BoxGeometry(0.25, 0.8, 0.25);
    const leftLeg = new THREE.Mesh(legGeo, bodyMat);
    leftLeg.position.set(-0.15, 0.4, 0);
    leftLeg.name = 'leftLeg';
    group.add(leftLeg);
    const rightLeg = new THREE.Mesh(legGeo, bodyMat);
    rightLeg.position.set(0.15, 0.4, 0);
    rightLeg.name = 'rightLeg';
    group.add(rightLeg);

    // Torso (trench coat)
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.8, 0.35), bodyMat);
    torso.position.y = 1.2;
    torso.name = 'torso';
    group.add(torso);

    // Arms
    const armGeo = new THREE.BoxGeometry(0.2, 0.7, 0.2);
    const leftArm = new THREE.Mesh(armGeo, bodyMat);
    leftArm.position.set(-0.4, 1.1, 0);
    leftArm.name = 'leftArm';
    group.add(leftArm);
    const rightArm = new THREE.Mesh(armGeo, bodyMat);
    rightArm.position.set(0.4, 1.1, 0);
    rightArm.name = 'rightArm';
    group.add(rightArm);

    // Head (balaclava)
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.35), headMat);
    head.position.y = 1.8;
    group.add(head);

    // Eyes
    const eyeMat = new THREE.MeshLambertMaterial({ color: 0xffffff, flatShading: true });
    const eyeGeo = new THREE.BoxGeometry(0.08, 0.05, 0.05);
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.08, 1.82, 0.18);
    group.add(leftEye);
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.08, 1.82, 0.18);
    group.add(rightEye);

  } else if (faction === 'mutant') {
    // Blind dog / Snork - low quadruped
    const bodyMat = new THREE.MeshLambertMaterial({ color: 0x5a4a3a, flatShading: true });
    const darkMat = new THREE.MeshLambertMaterial({ color: 0x3a2a1a, flatShading: true });

    // Body (horizontal)
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 1.0), bodyMat);
    body.position.y = 0.5;
    body.name = 'torso';
    group.add(body);

    // Head
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.4), darkMat);
    head.position.set(0, 0.55, 0.6);
    group.add(head);

    // Legs (4)
    const legGeo = new THREE.BoxGeometry(0.12, 0.4, 0.12);
    [[-0.2, 0.2, 0.3], [0.2, 0.2, 0.3], [-0.2, 0.2, -0.3], [0.2, 0.2, -0.3]].forEach(([x, y, z], i) => {
      const leg = new THREE.Mesh(legGeo, darkMat);
      leg.position.set(x, y, z);
      leg.name = `leg${i}`;
      group.add(leg);
    });

  } else {
    // Friendly Stalker - sunrise suit, gas mask
    const suitMat = new THREE.MeshLambertMaterial({ color: 0x8a7a40, flatShading: true });
    const maskMat = new THREE.MeshLambertMaterial({ color: 0x3a3a3a, flatShading: true });
    const bootMat = new THREE.MeshLambertMaterial({ color: 0x2a2a1a, flatShading: true });

    // Legs
    const legGeo = new THREE.BoxGeometry(0.25, 0.8, 0.25);
    const leftLeg = new THREE.Mesh(legGeo, suitMat);
    leftLeg.position.set(-0.15, 0.4, 0);
    leftLeg.name = 'leftLeg';
    group.add(leftLeg);
    const rightLeg = new THREE.Mesh(legGeo, suitMat);
    rightLeg.position.set(0.15, 0.4, 0);
    rightLeg.name = 'rightLeg';
    group.add(rightLeg);

    // Torso
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.8, 0.35), suitMat);
    torso.position.y = 1.2;
    torso.name = 'torso';
    group.add(torso);

    // Arms
    const armGeo = new THREE.BoxGeometry(0.2, 0.7, 0.2);
    const leftArm = new THREE.Mesh(armGeo, suitMat);
    leftArm.position.set(-0.4, 1.1, 0);
    leftArm.name = 'leftArm';
    group.add(leftArm);
    const rightArm = new THREE.Mesh(armGeo, suitMat);
    rightArm.position.set(0.4, 1.1, 0);
    rightArm.name = 'rightArm';
    group.add(rightArm);

    // Head (gas mask)
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.35), maskMat);
    head.position.y = 1.8;
    group.add(head);

    // Gas mask filter
    const filter = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.15, 6), maskMat);
    filter.position.set(0, 1.72, 0.2);
    filter.rotation.x = Math.PI / 2;
    group.add(filter);

    // Boots
    const bootGeo = new THREE.BoxGeometry(0.28, 0.2, 0.35);
    const leftBoot = new THREE.Mesh(bootGeo, bootMat);
    leftBoot.position.set(-0.15, 0.1, 0.05);
    group.add(leftBoot);
    const rightBoot = new THREE.Mesh(bootGeo, bootMat);
    rightBoot.position.set(0.15, 0.1, 0.05);
    group.add(rightBoot);
  }

  return group;
}

export function createNPC(faction: Faction, position: THREE.Vector3): NPC {
  const group = createNPCMesh(faction);
  group.position.copy(position);
  group.position.y = getTerrainHeight(position.x, position.z);

  const health = faction === 'mutant' ? 60 : faction === 'bandit' ? 80 : 100;
  const speed = faction === 'mutant' ? 6 : faction === 'bandit' ? 3 : 3.5;

  return {
    group,
    position: position.clone(),
    faction,
    health,
    maxHealth: health,
    speed,
    state: 'patrol',
    target: null,
    patrolTarget: new THREE.Vector3(
      position.x + (Math.random() - 0.5) * 40,
      0,
      position.z + (Math.random() - 0.5) * 40
    ),
    attackCooldown: 0,
    walkCycle: Math.random() * Math.PI * 2,
    healthBar: null,
  };
}

export function updateNPC(npc: NPC, dt: number, playerPos: THREE.Vector3, allNPCs: NPC[]): { event: string | null, damage: number } {
  let event: string | null = null;
  let damage = 0;

  if (npc.state === 'dead') return { event: null, damage: 0 };

  npc.attackCooldown = Math.max(0, npc.attackCooldown - dt);

  // Find target based on faction
  let targetPos: THREE.Vector3 | null = null;
  let targetNPC: NPC | null = null;

  if (npc.faction === 'bandit') {
    // Hostile to player and stalkers
    const distToPlayer = npc.position.distanceTo(playerPos);
    if (distToPlayer < 35) {
      targetPos = playerPos.clone();
    }
    // Check for stalkers nearby
    for (const other of allNPCs) {
      if (other === npc || other.state === 'dead') continue;
      if (other.faction === 'stalker') {
        const dist = npc.position.distanceTo(other.position);
        if (dist < 25 && (!targetPos || dist < npc.position.distanceTo(targetPos))) {
          targetPos = other.position.clone();
          targetNPC = other;
        }
      }
    }
  } else if (npc.faction === 'mutant') {
    // Hostile to ALL
    const distToPlayer = npc.position.distanceTo(playerPos);
    if (distToPlayer < 30) {
      targetPos = playerPos.clone();
    }
    for (const other of allNPCs) {
      if (other === npc || other.state === 'dead') continue;
      const dist = npc.position.distanceTo(other.position);
      if (dist < 20 && (!targetPos || dist < npc.position.distanceTo(targetPos))) {
        targetPos = other.position.clone();
        targetNPC = other;
      }
    }
  } else if (npc.faction === 'stalker') {
    // Friendly - protect player, attack bandits and mutants
    for (const other of allNPCs) {
      if (other === npc || other.state === 'dead') continue;
      if (other.faction === 'bandit' || other.faction === 'mutant') {
        const dist = npc.position.distanceTo(other.position);
        if (dist < 40) {
          // Check if enemy is near player
          const distToPlayer = other.position.distanceTo(playerPos);
          if (distToPlayer < 40 && (!targetPos || dist < npc.position.distanceTo(targetPos))) {
            targetPos = other.position.clone();
            targetNPC = other;
            event = `Friendly Stalker engaged ${other.faction}`;
          }
        }
      }
    }
  }

  if (targetPos) {
    npc.state = 'combat';
    npc.target = targetPos;

    const dist = npc.position.distanceTo(targetPos);
    const dir = targetPos.clone().sub(npc.position).normalize();

    if (npc.faction === 'mutant') {
      // Melee - run towards target
      if (dist > 2) {
        npc.position.add(dir.multiplyScalar(npc.speed * dt));
      } else if (npc.attackCooldown <= 0) {
        // Attack
        const distToPlayer = npc.position.distanceTo(playerPos);
        if (distToPlayer < 2.5) {
          damage = 15;
        }
        if (targetNPC && dist < 2.5) {
          targetNPC.health -= 20;
          if (targetNPC.health <= 0) targetNPC.state = 'dead';
        }
        npc.attackCooldown = 1.0;
      }
    } else {
      // Ranged - keep distance
      if (dist < 10) {
        npc.position.add(dir.multiplyScalar(-npc.speed * 0.5 * dt));
      } else if (dist > 25) {
        npc.position.add(dir.multiplyScalar(npc.speed * dt));
      }

      if (dist < 35 && npc.attackCooldown <= 0) {
        // Shoot at target
        const accuracy = npc.faction === 'bandit' ? 0.7 : 0.85;
        if (Math.random() < accuracy) {
          const distToPlayer = npc.position.distanceTo(playerPos);
          if (distToPlayer < 35 && (targetPos === playerPos.clone() || distToPlayer < 5)) {
            damage = npc.faction === 'bandit' ? 8 : 5;
          }
        }
        npc.attackCooldown = npc.faction === 'bandit' ? 1.5 : 2.0;
      }
    }

    // Face target
    const angle = Math.atan2(dir.x, dir.z);
    npc.group.rotation.y = angle;
  } else {
    npc.state = 'patrol';
    // Patrol movement
    const dir = npc.patrolTarget.clone().sub(npc.position);
    dir.y = 0;
    const dist = dir.length();
    if (dist < 3) {
      npc.patrolTarget.set(
        npc.position.x + (Math.random() - 0.5) * 40,
        0,
        npc.position.z + (Math.random() - 0.5) * 40
      );
    } else {
      dir.normalize();
      npc.position.add(dir.multiplyScalar(npc.speed * 0.4 * dt));
      const angle = Math.atan2(dir.x, dir.z);
      npc.group.rotation.y = angle;
    }
  }

  // Update position
  npc.position.y = getTerrainHeight(npc.position.x, npc.position.z);
  npc.group.position.copy(npc.position);

  // Walk animation
  npc.walkCycle += dt * (npc.state === 'combat' ? 8 : 4);
  const swing = Math.sin(npc.walkCycle) * 0.3;
  npc.group.children.forEach(child => {
    if (child.name === 'leftLeg' || child.name === 'leg0' || child.name === 'leg2') {
      child.rotation.x = swing;
    }
    if (child.name === 'rightLeg' || child.name === 'leg1' || child.name === 'leg3') {
      child.rotation.x = -swing;
    }
    if (child.name === 'leftArm') child.rotation.x = -swing * 0.5;
    if (child.name === 'rightArm') child.rotation.x = swing * 0.5;
  });

  // Health bar
  if (npc.health < npc.maxHealth && npc.health > 0) {
    if (!npc.healthBar) {
      const hbGeo = new THREE.PlaneGeometry(0.8, 0.1);
      const hbMat = new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide });
      npc.healthBar = new THREE.Mesh(hbGeo, hbMat);
      npc.group.add(npc.healthBar);
    }
    npc.healthBar!.position.y = npc.faction === 'mutant' ? 1.2 : 2.2;
    npc.healthBar!.scale.x = npc.health / npc.maxHealth;
    npc.healthBar!.lookAt(npc.healthBar!.position.clone().add(new THREE.Vector3(0, 0, 1)));
  } else if (npc.healthBar) {
    npc.group.remove(npc.healthBar);
    npc.healthBar = null;
  }

  // Death
  if (npc.health <= 0) {
    npc.state = 'dead';
    npc.group.rotation.x = Math.PI / 2;
    npc.group.position.y -= 0.3;
  }

  return { event, damage };
}

// ============================================================
// WEAPON VIEWMODEL
// ============================================================
export interface Weapon {
  name: string;
  group: THREE.Group;
  magSize: number;
  currentMag: number;
  reserveAmmo: number;
  fireRate: number;
  damage: number;
  auto: boolean;
  reloadTime: number;
  bloom: number;
  recoil: number;
  lastFireTime: number;
  isReloading: boolean;
  reloadStartTime: number;
}

export function createWeaponViewmodel(type: 'pistol' | 'rifle'): Weapon {
  const group = new THREE.Group();

  if (type === 'pistol') {
    const metalMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a, flatShading: true });
    const gripMat = new THREE.MeshLambertMaterial({ color: 0x3a2a1a, flatShading: true });

    // Barrel
    const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.3), metalMat);
    barrel.position.set(0, 0, -0.15);
    group.add(barrel);

    // Slide
    const slide = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.25), metalMat);
    slide.position.set(0, 0.02, -0.05);
    group.add(slide);

    // Grip
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.12, 0.06), gripMat);
    grip.position.set(0, -0.06, 0.05);
    grip.rotation.x = 0.2;
    group.add(grip);

    // Trigger guard
    const guard = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.02, 0.06), metalMat);
    guard.position.set(0, -0.02, 0);
    group.add(guard);

    return {
      name: 'PMm Makarov',
      group,
      magSize: 8,
      currentMag: 8,
      reserveAmmo: 32,
      fireRate: 0.3,
      damage: 25,
      auto: false,
      reloadTime: 1.5,
      bloom: 0.01,
      recoil: 0.02,
      lastFireTime: 0,
      isReloading: false,
      reloadStartTime: 0,
    };
  } else {
    const metalMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a, flatShading: true });
    const woodMat = new THREE.MeshLambertMaterial({ map: TextureGen.wood(), flatShading: true });

    // Barrel
    const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.5), metalMat);
    barrel.position.set(0, 0.02, -0.3);
    group.add(barrel);

    // Receiver
    const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.3), metalMat);
    receiver.position.set(0, 0, -0.05);
    group.add(receiver);

    // Magazine
    const mag = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.15, 0.06), metalMat);
    mag.position.set(0, -0.1, -0.05);
    mag.rotation.x = 0.1;
    group.add(mag);

    // Stock
    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.06, 0.2), woodMat);
    stock.position.set(0, -0.01, 0.15);
    group.add(stock);

    // Handguard
    const handguard = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.06, 0.12), woodMat);
    handguard.position.set(0, -0.01, -0.2);
    group.add(handguard);

    // Gas tube
    const gasTube = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, 0.2), metalMat);
    gasTube.position.set(0, 0.05, -0.2);
    group.add(gasTube);

    return {
      name: 'AK-74',
      group,
      magSize: 30,
      currentMag: 30,
      reserveAmmo: 90,
      fireRate: 0.1,
      damage: 20,
      auto: true,
      reloadTime: 2.0,
      bloom: 0.03,
      recoil: 0.04,
      lastFireTime: 0,
      isReloading: false,
      reloadStartTime: 0,
    };
  }
}

// ============================================================
// LOOT / ITEMS
// ============================================================
export type ItemType = 'medkit' | 'antirad' | 'ammo9' | 'ammo545' | 'artifact' | 'armor';

export interface LootItem {
  mesh: THREE.Mesh;
  position: THREE.Vector3;
  type: ItemType;
  name: string;
  collected: boolean;
}

export function createLootMesh(type: ItemType): THREE.Mesh {
  let geo: THREE.BufferGeometry;
  let mat: THREE.MeshLambertMaterial;

  switch (type) {
    case 'medkit':
      geo = new THREE.BoxGeometry(0.3, 0.2, 0.2);
      mat = new THREE.MeshLambertMaterial({ color: 0xcc2222, flatShading: true });
      break;
    case 'antirad':
      geo = new THREE.CylinderGeometry(0.1, 0.1, 0.25, 6);
      mat = new THREE.MeshLambertMaterial({ color: 0x22cc44, flatShading: true });
      break;
    case 'ammo9':
      geo = new THREE.BoxGeometry(0.2, 0.1, 0.15);
      mat = new THREE.MeshLambertMaterial({ color: 0xccaa22, flatShading: true });
      break;
    case 'ammo545':
      geo = new THREE.BoxGeometry(0.25, 0.12, 0.15);
      mat = new THREE.MeshLambertMaterial({ color: 0x88aa22, flatShading: true });
      break;
    case 'artifact':
      geo = new THREE.IcosahedronGeometry(0.15, 0);
      mat = new THREE.MeshLambertMaterial({ color: 0x44ffaa, flatShading: true, emissive: 0x22aa55 });
      break;
    case 'armor':
      geo = new THREE.BoxGeometry(0.35, 0.3, 0.1);
      mat = new THREE.MeshLambertMaterial({ color: 0x555555, flatShading: true });
      break;
  }

  const mesh = new THREE.Mesh(geo!, mat!);
  return mesh;
}

export function createLoot(position: THREE.Vector3, type: ItemType): LootItem {
  const mesh = createLootMesh(type);
  position.y = getTerrainHeight(position.x, position.z) + 0.3;
  mesh.position.copy(position);

  const names: Record<ItemType, string> = {
    medkit: 'Medkit',
    antirad: 'Anti-Radiation',
    ammo9: '9x18mm Ammo',
    ammo545: '5.45x39mm Ammo',
    artifact: 'Artifact',
    armor: 'Body Armor',
  };

  return {
    mesh,
    position: position.clone(),
    type,
    name: names[type],
    collected: false,
  };
}
