import * as THREE from 'three';
import { getTerrainHeight, TextureGen } from './engine';

// ============================================================
// NPC SYSTEM - Faction AI (Enhanced Models)
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
    // Dark trench coat, balaclava - more detailed
    const coatMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a, flatShading: true });
    const pantsMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a, flatShading: true });
    const headMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a, flatShading: true });
    const skinMat = new THREE.MeshLambertMaterial({ color: 0x8a6a50, flatShading: true });
    const bootMat = new THREE.MeshLambertMaterial({ color: 0x222222, flatShading: true });

    // Legs with boots
    const legGeo = new THREE.BoxGeometry(0.22, 0.5, 0.22);
    const leftLeg = new THREE.Mesh(legGeo, pantsMat);
    leftLeg.position.set(-0.12, 0.55, 0);
    leftLeg.name = 'leftLeg';
    group.add(leftLeg);
    const rightLeg = new THREE.Mesh(legGeo, pantsMat);
    rightLeg.position.set(0.12, 0.55, 0);
    rightLeg.name = 'rightLeg';
    group.add(rightLeg);

    // Boots
    const bootGeo = new THREE.BoxGeometry(0.25, 0.25, 0.3);
    const leftBoot = new THREE.Mesh(bootGeo, bootMat);
    leftBoot.position.set(-0.12, 0.12, 0.03);
    group.add(leftBoot);
    const rightBoot = new THREE.Mesh(bootGeo, bootMat);
    rightBoot.position.set(0.12, 0.12, 0.03);
    group.add(rightBoot);

    // Torso (trench coat) - longer
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.7, 0.32), coatMat);
    torso.position.y = 1.15;
    torso.name = 'torso';
    group.add(torso);

    // Coat lower part
    const coatLower = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.4, 0.35), coatMat);
    coatLower.position.y = 0.7;
    group.add(coatLower);

    // Collar
    const collar = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.15, 0.25), coatMat);
    collar.position.y = 1.55;
    group.add(collar);

    // Arms
    const armGeo = new THREE.BoxGeometry(0.18, 0.6, 0.18);
    const leftArm = new THREE.Mesh(armGeo, coatMat);
    leftArm.position.set(-0.37, 1.1, 0);
    leftArm.name = 'leftArm';
    group.add(leftArm);
    const rightArm = new THREE.Mesh(armGeo, coatMat);
    rightArm.position.set(0.37, 1.1, 0);
    rightArm.name = 'rightArm';
    group.add(rightArm);

    // Hands
    const handGeo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
    const leftHand = new THREE.Mesh(handGeo, skinMat);
    leftHand.position.set(-0.37, 0.75, 0);
    group.add(leftHand);
    const rightHand = new THREE.Mesh(handGeo, skinMat);
    rightHand.position.set(0.37, 0.75, 0);
    group.add(rightHand);

    // Head (balaclava) - rounder
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), headMat);
    head.position.y = 1.75;
    group.add(head);

    // Eye slit
    const eyeSlit = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.04, 0.05), skinMat);
    eyeSlit.position.set(0, 1.77, 0.16);
    group.add(eyeSlit);

    // Eyes
    const eyeMat = new THREE.MeshLambertMaterial({ color: 0xffffff, flatShading: true });
    const eyeGeo = new THREE.SphereGeometry(0.02, 4, 4);
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.06, 1.77, 0.18);
    group.add(leftEye);
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.06, 1.77, 0.18);
    group.add(rightEye);

    // Weapon in hand (simple pistol shape)
    const gunMat = new THREE.MeshLambertMaterial({ color: 0x333333, flatShading: true });
    const gun = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.2), gunMat);
    gun.position.set(0.37, 0.8, 0.1);
    group.add(gun);

  } else if (faction === 'mutant') {
    // Blind dog - more detailed quadruped
    const bodyMat = new THREE.MeshLambertMaterial({ color: 0x5a4a3a, flatShading: true });
    const darkMat = new THREE.MeshLambertMaterial({ color: 0x3a2a1a, flatShading: true });
    const noseMat = new THREE.MeshLambertMaterial({ color: 0x222222, flatShading: true });

    // Body (horizontal) - more segments
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.35, 0.9), bodyMat);
    body.position.y = 0.5;
    body.name = 'torso';
    group.add(body);

    // Chest (slightly larger)
    const chest = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.4), bodyMat);
    chest.position.set(0, 0.52, 0.2);
    group.add(chest);

    // Haunches
    const haunch = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.38, 0.35), bodyMat);
    haunch.position.set(0, 0.48, -0.3);
    group.add(haunch);

    // Head - more detailed
    const headBase = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 0.3), darkMat);
    headBase.position.set(0, 0.6, 0.55);
    group.add(headBase);

    // Snout
    const snout = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.12, 0.2), darkMat);
    snout.position.set(0, 0.55, 0.75);
    group.add(snout);

    // Nose
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), noseMat);
    nose.position.set(0, 0.57, 0.85);
    group.add(nose);

    // Ears
    const earGeo = new THREE.ConeGeometry(0.05, 0.12, 4);
    const leftEar = new THREE.Mesh(earGeo, darkMat);
    leftEar.position.set(-0.1, 0.78, 0.5);
    leftEar.rotation.z = 0.3;
    group.add(leftEar);
    const rightEar = new THREE.Mesh(earGeo, darkMat);
    rightEar.position.set(0.1, 0.78, 0.5);
    rightEar.rotation.z = -0.3;
    group.add(rightEar);

    // Eyes (glowing)
    const eyeMat = new THREE.MeshLambertMaterial({ color: 0xff4400, emissive: 0x441100, flatShading: true });
    const eyeGeo = new THREE.SphereGeometry(0.025, 4, 4);
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.08, 0.65, 0.65);
    group.add(leftEye);
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.08, 0.65, 0.65);
    group.add(rightEye);

    // Legs (4) - with joints
    const legGeo = new THREE.BoxGeometry(0.1, 0.35, 0.1);
    const pawGeo = new THREE.BoxGeometry(0.1, 0.08, 0.14);
    [[-0.18, 0.25, 0.3], [0.18, 0.25, 0.3], [-0.18, 0.25, -0.3], [0.18, 0.25, -0.3]].forEach(([x, y, z], i) => {
      const leg = new THREE.Mesh(legGeo, darkMat);
      leg.position.set(x, y, z);
      leg.name = `leg${i}`;
      group.add(leg);
      
      const paw = new THREE.Mesh(pawGeo, noseMat);
      paw.position.set(x, 0.04, z + 0.02);
      group.add(paw);
    });

    // Tail
    const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.04, 0.3, 5), darkMat);
    tail.position.set(0, 0.6, -0.5);
    tail.rotation.x = -0.5;
    tail.name = 'tail';
    group.add(tail);

    // Teeth (visible when mouth open)
    const teethMat = new THREE.MeshLambertMaterial({ color: 0xeeeeee, flatShading: true });
    const teeth = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.02, 0.04), teethMat);
    teeth.position.set(0, 0.5, 0.85);
    group.add(teeth);

  } else {
    // Friendly Stalker - sunrise suit, gas mask - more detailed
    const suitMat = new THREE.MeshLambertMaterial({ color: 0x8a7a40, flatShading: true });
    const suitDarkMat = new THREE.MeshLambertMaterial({ color: 0x6a5a30, flatShading: true });
    const maskMat = new THREE.MeshLambertMaterial({ color: 0x3a3a3a, flatShading: true });
    const bootMat = new THREE.MeshLambertMaterial({ color: 0x2a2a1a, flatShading: true });
    const goggleMat = new THREE.MeshLambertMaterial({ color: 0x88aacc, transparent: true, opacity: 0.6, flatShading: true });

    // Legs
    const legGeo = new THREE.BoxGeometry(0.22, 0.5, 0.22);
    const leftLeg = new THREE.Mesh(legGeo, suitMat);
    leftLeg.position.set(-0.12, 0.55, 0);
    leftLeg.name = 'leftLeg';
    group.add(leftLeg);
    const rightLeg = new THREE.Mesh(legGeo, suitMat);
    rightLeg.position.set(0.12, 0.55, 0);
    rightLeg.name = 'rightLeg';
    group.add(rightLeg);

    // Boots
    const bootGeo = new THREE.BoxGeometry(0.25, 0.25, 0.32);
    const leftBoot = new THREE.Mesh(bootGeo, bootMat);
    leftBoot.position.set(-0.12, 0.12, 0.03);
    group.add(leftBoot);
    const rightBoot = new THREE.Mesh(bootGeo, bootMat);
    rightBoot.position.set(0.12, 0.12, 0.03);
    group.add(rightBoot);

    // Torso
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.65, 0.32), suitMat);
    torso.position.y = 1.15;
    torso.name = 'torso';
    group.add(torso);

    // Belt
    const belt = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.08, 0.33), suitDarkMat);
    belt.position.y = 0.85;
    group.add(belt);

    // Shoulder pads
    const shoulderGeo = new THREE.BoxGeometry(0.15, 0.1, 0.2);
    const leftShoulder = new THREE.Mesh(shoulderGeo, suitDarkMat);
    leftShoulder.position.set(-0.35, 1.45, 0);
    group.add(leftShoulder);
    const rightShoulder = new THREE.Mesh(shoulderGeo, suitDarkMat);
    rightShoulder.position.set(0.35, 1.45, 0);
    group.add(rightShoulder);

    // Arms
    const armGeo = new THREE.BoxGeometry(0.18, 0.55, 0.18);
    const leftArm = new THREE.Mesh(armGeo, suitMat);
    leftArm.position.set(-0.37, 1.1, 0);
    leftArm.name = 'leftArm';
    group.add(leftArm);
    const rightArm = new THREE.Mesh(armGeo, suitMat);
    rightArm.position.set(0.37, 1.1, 0);
    rightArm.name = 'rightArm';
    group.add(rightArm);

    // Gloves
    const gloveMat = new THREE.MeshLambertMaterial({ color: 0x444422, flatShading: true });
    const gloveGeo = new THREE.BoxGeometry(0.14, 0.12, 0.14);
    const leftGlove = new THREE.Mesh(gloveGeo, gloveMat);
    leftGlove.position.set(-0.37, 0.78, 0);
    group.add(leftGlove);
    const rightGlove = new THREE.Mesh(gloveGeo, gloveMat);
    rightGlove.position.set(0.37, 0.78, 0);
    group.add(rightGlove);

    // Head (gas mask) - rounder
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), maskMat);
    head.position.y = 1.72;
    group.add(head);

    // Gas mask front piece
    const maskFront = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.15, 0.1), maskMat);
    maskFront.position.set(0, 1.68, 0.15);
    group.add(maskFront);

    // Gas mask filter (cylindrical)
    const filter = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.12, 8), maskMat);
    filter.position.set(0.12, 1.65, 0.15);
    filter.rotation.x = Math.PI / 2;
    group.add(filter);
    const filter2 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.12, 8), maskMat);
    filter2.position.set(-0.12, 1.65, 0.15);
    filter2.rotation.x = Math.PI / 2;
    group.add(filter2);

    // Goggles
    const goggleGeo = new THREE.SphereGeometry(0.06, 6, 6);
    const leftGoggle = new THREE.Mesh(goggleGeo, goggleMat);
    leftGoggle.position.set(-0.08, 1.76, 0.16);
    leftGoggle.scale.z = 0.5;
    group.add(leftGoggle);
    const rightGoggle = new THREE.Mesh(goggleGeo, goggleMat);
    rightGoggle.position.set(0.08, 1.76, 0.16);
    rightGoggle.scale.z = 0.5;
    group.add(rightGoggle);

    // Hood
    const hood = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), suitMat);
    hood.position.y = 1.75;
    hood.scale.set(1, 0.8, 1);
    group.add(hood);

    // Weapon (AK-style)
    const gunMat = new THREE.MeshLambertMaterial({ color: 0x333333, flatShading: true });
    const gunBody = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.35), gunMat);
    gunBody.position.set(0.37, 0.85, 0.15);
    group.add(gunBody);
    const gunMag = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.1, 0.04), gunMat);
    gunMag.position.set(0.37, 0.78, 0.08);
    group.add(gunMag);
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

  let targetPos: THREE.Vector3 | null = null;
  let targetNPC: NPC | null = null;

  if (npc.faction === 'bandit') {
    const distToPlayer = npc.position.distanceTo(playerPos);
    if (distToPlayer < 35) {
      targetPos = playerPos.clone();
    }
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
    for (const other of allNPCs) {
      if (other === npc || other.state === 'dead') continue;
      if (other.faction === 'bandit' || other.faction === 'mutant') {
        const dist = npc.position.distanceTo(other.position);
        if (dist < 40) {
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
      if (dist > 2) {
        npc.position.add(dir.multiplyScalar(npc.speed * dt));
      } else if (npc.attackCooldown <= 0) {
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
      if (dist < 10) {
        npc.position.add(dir.multiplyScalar(-npc.speed * 0.5 * dt));
      } else if (dist > 25) {
        npc.position.add(dir.multiplyScalar(npc.speed * dt));
      }

      if (dist < 35 && npc.attackCooldown <= 0) {
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

    const angle = Math.atan2(dir.x, dir.z);
    npc.group.rotation.y = angle;
  } else {
    npc.state = 'patrol';
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
    if (child.name === 'tail') child.rotation.z = Math.sin(npc.walkCycle * 2) * 0.3;
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

  if (npc.health <= 0) {
    npc.state = 'dead';
    npc.group.rotation.x = Math.PI / 2;
    npc.group.position.y -= 0.3;
  }

  return { event, damage };
}

// ============================================================
// WEAPON VIEWMODEL (Enhanced)
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
    const metalLight = new THREE.MeshLambertMaterial({ color: 0x444444, flatShading: true });
    const gripMat = new THREE.MeshLambertMaterial({ color: 0x3a2a1a, flatShading: true });

    // Barrel
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.2, 8), metalMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.02, -0.22);
    group.add(barrel);

    // Barrel shroud
    const shroud = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.15), metalMat);
    shroud.position.set(0, 0.01, -0.15);
    group.add(shroud);

    // Slide
    const slide = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.06, 0.2), metalLight);
    slide.position.set(0, 0.03, -0.05);
    group.add(slide);

    // Slide serrations
    for (let i = 0; i < 4; i++) {
      const serration = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.005, 0.003), metalMat);
      serration.position.set(0, 0.06, 0.02 - i * 0.015);
      group.add(serration);
    }

    // Frame/receiver
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.035, 0.15), metalMat);
    frame.position.set(0, -0.005, -0.02);
    group.add(frame);

    // Grip
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.1, 0.05), gripMat);
    grip.position.set(0, -0.05, 0.04);
    grip.rotation.x = 0.2;
    group.add(grip);

    // Grip texture lines
    for (let i = 0; i < 5; i++) {
      const line = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.002, 0.002), metalMat);
      line.position.set(0, -0.02 - i * 0.015, 0.065);
      group.add(line);
    }

    // Trigger guard
    const guard = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.005, 0.05), metalMat);
    guard.position.set(0, -0.02, 0.01);
    group.add(guard);

    // Trigger
    const trigger = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.02, 0.008), metalMat);
    trigger.position.set(0, -0.025, 0.01);
    group.add(trigger);

    // Front sight
    const frontSight = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.015, 0.008), metalMat);
    frontSight.position.set(0, 0.07, -0.18);
    group.add(frontSight);

    // Rear sight
    const rearSight = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.012, 0.008), metalMat);
    rearSight.position.set(0, 0.065, 0.04);
    group.add(rearSight);

    // Hammer
    const hammer = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.02, 0.015), metalMat);
    hammer.position.set(0, 0.05, 0.06);
    group.add(hammer);

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
    const metalLight = new THREE.MeshLambertMaterial({ color: 0x444444, flatShading: true });
    const woodMat = new THREE.MeshLambertMaterial({ map: TextureGen.wood(), flatShading: true });

    // Barrel
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.35, 8), metalMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.025, -0.35);
    group.add(barrel);

    // Front sight base
    const fsBase = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.02, 0.03), metalMat);
    fsBase.position.set(0, 0.04, -0.5);
    group.add(fsBase);
    const frontSight = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.015, 0.006), metalMat);
    frontSight.position.set(0, 0.055, -0.5);
    group.add(frontSight);

    // Gas tube
    const gasTube = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.2, 6), metalMat);
    gasTube.rotation.x = Math.PI / 2;
    gasTube.position.set(0, 0.05, -0.25);
    group.add(gasTube);

    // Handguard (wood)
    const handguard = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.05, 0.15), woodMat);
    handguard.position.set(0, 0.01, -0.22);
    group.add(handguard);

    // Handguard lower
    const handguardLower = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 0.12), woodMat);
    handguardLower.position.set(0, -0.02, -0.22);
    group.add(handguardLower);

    // Receiver
    const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.06, 0.22), metalMat);
    receiver.position.set(0, 0.01, -0.05);
    group.add(receiver);

    // Dust cover
    const dustCover = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.02, 0.18), metalLight);
    dustCover.position.set(0, 0.05, -0.05);
    group.add(dustCover);

    // Rear sight
    const rearSight = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.015, 0.01), metalMat);
    rearSight.position.set(0, 0.065, 0.02);
    group.add(rearSight);

    // Magazine
    const mag = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.14, 0.05), metalMat);
    mag.position.set(0, -0.08, -0.05);
    mag.rotation.x = 0.1;
    group.add(mag);

    // Magazine curve detail
    const magCurve = new THREE.Mesh(new THREE.BoxGeometry(0.037, 0.04, 0.052), metalLight);
    magCurve.position.set(0, -0.04, -0.05);
    group.add(magCurve);

    // Trigger guard
    const tGuard = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.005, 0.04), metalMat);
    tGuard.position.set(0, -0.02, 0.0);
    group.add(tGuard);

    // Trigger
    const trigger = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.018, 0.006), metalMat);
    trigger.position.set(0, -0.025, 0.0);
    group.add(trigger);

    // Pistol grip (wood)
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.08, 0.04), woodMat);
    grip.position.set(0, -0.04, 0.06);
    grip.rotation.x = 0.3;
    group.add(grip);

    // Stock (wood)
    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.05, 0.2), woodMat);
    stock.position.set(0, 0.0, 0.18);
    group.add(stock);

    // Stock butt
    const butt = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.06, 0.02), woodMat);
    butt.position.set(0, 0.0, 0.28);
    group.add(butt);

    // Selector switch
    const selector = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.02, 0.008), metalLight);
    selector.position.set(0.028, 0.02, 0.02);
    group.add(selector);

    // Charging handle
    const chargeHandle = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.01, 0.02), metalMat);
    chargeHandle.position.set(0.03, 0.04, -0.02);
    group.add(chargeHandle);

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
  mesh: THREE.Group;
  position: THREE.Vector3;
  type: ItemType;
  name: string;
  collected: boolean;
}

export function createLootMesh(type: ItemType): THREE.Group {
  const group = new THREE.Group();

  switch (type) {
    case 'medkit': {
      const boxMat = new THREE.MeshLambertMaterial({ color: 0xcc2222, flatShading: true });
      const crossMat = new THREE.MeshLambertMaterial({ color: 0xffffff, flatShading: true });
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.15, 0.15), boxMat);
      group.add(box);
      // Cross
      const crossH = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.03, 0.01), crossMat);
      crossH.position.z = 0.08;
      group.add(crossH);
      const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.1, 0.01), crossMat);
      crossV.position.z = 0.08;
      group.add(crossV);
      break;
    }
    case 'antirad': {
      const bottleMat = new THREE.MeshLambertMaterial({ color: 0x22cc44, flatShading: true });
      const capMat = new THREE.MeshLambertMaterial({ color: 0x444444, flatShading: true });
      const bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.2, 8), bottleMat);
      group.add(bottle);
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.04, 8), capMat);
      cap.position.y = 0.12;
      group.add(cap);
      // Label
      const labelMat = new THREE.MeshLambertMaterial({ color: 0xffff00, flatShading: true });
      const label = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.01), labelMat);
      label.position.set(0, 0, 0.07);
      group.add(label);
      break;
    }
    case 'ammo9': {
      const boxMat = new THREE.MeshLambertMaterial({ color: 0xccaa22, flatShading: true });
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 0.12), boxMat);
      group.add(box);
      // Bullet details
      const bulletMat = new THREE.MeshLambertMaterial({ color: 0xddbb33, flatShading: true });
      for (let i = 0; i < 3; i++) {
        const bullet = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.04, 6), bulletMat);
        bullet.position.set(-0.05 + i * 0.05, 0.05, 0);
        group.add(bullet);
      }
      break;
    }
    case 'ammo545': {
      const boxMat = new THREE.MeshLambertMaterial({ color: 0x88aa22, flatShading: true });
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.1, 0.14), boxMat);
      group.add(box);
      // Bullet details
      const bulletMat = new THREE.MeshLambertMaterial({ color: 0x99bb33, flatShading: true });
      for (let i = 0; i < 4; i++) {
        const bullet = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.05, 6), bulletMat);
        bullet.position.set(-0.06 + i * 0.04, 0.06, 0);
        group.add(bullet);
      }
      break;
    }
    case 'artifact': {
      const artMat = new THREE.MeshLambertMaterial({ color: 0x44ffaa, flatShading: true, emissive: 0x22aa55 });
      const art = new THREE.Mesh(new THREE.IcosahedronGeometry(0.12, 1), artMat);
      group.add(art);
      // Glow ring
      const ringMat = new THREE.MeshLambertMaterial({ color: 0x88ffcc, transparent: true, opacity: 0.5, emissive: 0x44ff88 });
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.02, 8, 16), ringMat);
      ring.rotation.x = Math.PI / 2;
      group.add(ring);
      break;
    }
    case 'armor': {
      const armorMat = new THREE.MeshLambertMaterial({ color: 0x555555, flatShading: true });
      const plate = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.25, 0.05), armorMat);
      group.add(plate);
      // Plate details
      const detailMat = new THREE.MeshLambertMaterial({ color: 0x444444, flatShading: true });
      const detail1 = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.02, 0.06), detailMat);
      detail1.position.y = 0.08;
      group.add(detail1);
      const detail2 = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.02, 0.06), detailMat);
      detail2.position.y = -0.08;
      group.add(detail2);
      break;
    }
  }

  return group;
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
