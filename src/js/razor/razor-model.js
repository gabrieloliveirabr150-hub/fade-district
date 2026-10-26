// Builds the straight razor 3D model with Three.js.
// Units are centimetres, based on a real 7/8" straight razor.
// The razor is drawn "open": blade on the right, handle on the left.

import * as THREE from 'three';

// ---------------------------------------------------------------- Dimensions
const BLADE = {
  length: 7.4, // from the heel to the rounded tip
  height: 2.2, // from the cutting edge to the spine
  spineHalf: 0.27, // half thickness at the spine (the back of the blade)
  edgeHalf: 0.006, // half thickness at the cutting edge
};

const SHANK_HALF = 0.22; // half thickness of the steel between blade and pivot
const PIVOT = new THREE.Vector2(-2.15, BLADE.height - 0.52);

const HANDLE = {
  length: 10, // distance between the pivot pin and the end pin
  gap: 0.62, // space between the two scales, where the blade folds in
  thickness: 0.14, // thickness of each scale (before rounding)
  bevel: 0.06, // rounded edges of the scales
  openAngle: Math.PI + 0.22, // handle points left, slightly down
};

// ---------------------------------------------------------------- Materials

// Draws fine horizontal streaks on a hidden canvas. Used as a roughness map,
// it makes the steel look brushed instead of perfectly smooth.
function createBrushedTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = 'rgb(70, 70, 70)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < 3000; i++) {
    const shade = Math.round(40 + Math.random() * 70);
    ctx.fillStyle = `rgba(${shade}, ${shade}, ${shade}, 0.6)`;
    const x = Math.random() * canvas.width - 200;
    const y = Math.random() * canvas.height;
    ctx.fillRect(x, y, 200 + Math.random() * 600, 1);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

function createMaterials() {
  return {
    // metalness 1 = pure metal: its look comes from what it reflects
    steel: new THREE.MeshPhysicalMaterial({
      color: 0xe2e5e9,
      metalness: 1,
      roughness: 1.25, // multiplied by the brushed texture values (≈ 0.25–0.5)
      roughnessMap: createBrushedTexture(),
      anisotropy: 0.6, // stretches highlights, like real brushed metal
    }),
    // Mirror finish for the honed edge bevel
    polished: new THREE.MeshPhysicalMaterial({
      color: 0xf2f4f7,
      metalness: 1,
      roughness: 0.08,
    }),
    gold: new THREE.MeshPhysicalMaterial({
      color: 0xd6b877,
      metalness: 1,
      roughness: 0.28,
    }),
    // Black horn / ebony handle with a glossy lacquer layer (clearcoat)
    ebony: new THREE.MeshPhysicalMaterial({
      color: 0x161618,
      metalness: 0,
      roughness: 0.38,
      clearcoat: 1,
      clearcoatRoughness: 0.1,
    }),
  };
}

// ---------------------------------------------------------- Geometry helpers

// Creates a surface from a grid of points.
// pointAt(u, v) receives two numbers between 0 and 1 and returns a 3D point.
// flip reverses the triangle order so the surface faces the other way.
function gridGeometry(nu, nv, pointAt, flip = false) {
  const positions = [];
  const uvs = [];
  const indices = [];

  for (let i = 0; i <= nu; i++) {
    for (let j = 0; j <= nv; j++) {
      const point = pointAt(i / nu, j / nv);
      positions.push(point.x, point.y, point.z);
      uvs.push(i / nu, j / nv);
    }
  }

  for (let i = 0; i < nu; i++) {
    for (let j = 0; j < nv; j++) {
      const a = i * (nv + 1) + j;
      const b = a + nv + 1;
      const c = b + 1;
      const d = a + 1;
      if (flip) indices.push(a, d, b, b, d, c);
      else indices.push(a, b, d, b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

// ---------------------------------------------------------------- The blade

const TOE_RADIUS = BLADE.height / 2;
const TOE_START = BLADE.length - TOE_RADIUS;

// Height of the cutting edge and the spine at position x along the blade
function bladeOutline(x) {
  if (x <= TOE_START) {
    // Slight curve of the edge, called the "smile"
    const smile = -0.06 * Math.sin((Math.PI * x) / TOE_START);
    return { edge: smile, spine: BLADE.height };
  }
  // Rounded tip: edge and spine meet along a half circle
  const dx = x - TOE_START;
  const s = Math.sqrt(Math.max(TOE_RADIUS ** 2 - dx ** 2, 0));
  return { edge: TOE_RADIUS - s, spine: TOE_RADIUS + s };
}

// Cross-section of the blade, from the edge (v = 0) to the spine (v = 1):
//   0 → BEVEL_TOP        flat, mirror-polished honing bevel
//   BEVEL_TOP → SPINE_V  concave "hollow grind" (thin, then thickening fast)
//   SPINE_V → 1          flat band of the spine
const BEVEL_TOP = 0.07;
const SPINE_V = 0.88;
const SHOULDER_HALF = 0.035; // half thickness where the bevel meets the hollow

function bladeHalfThickness(x, v) {
  let half;
  if (v <= BEVEL_TOP) {
    half = THREE.MathUtils.lerp(BLADE.edgeHalf, SHOULDER_HALF, v / BEVEL_TOP);
  } else if (v < SPINE_V) {
    const t = ((v - BEVEL_TOP) / (SPINE_V - BEVEL_TOP)) ** 2.2;
    half = THREE.MathUtils.lerp(SHOULDER_HALF, BLADE.spineHalf, t);
  } else {
    half = BLADE.spineHalf;
  }
  // The blade gets slightly thinner towards the tip
  const taper = 1 - 0.3 * THREE.MathUtils.smoothstep(x, TOE_START - 2, BLADE.length);
  return half * taper;
}

// More points near the tip, where the outline curves sharply
const bladeX = (u) => BLADE.length * Math.sin((u * Math.PI) / 2);

function createBlade(material, polishedMaterial) {
  const blade = new THREE.Group();

  // One side of the blade (side = 1 front, -1 back), covering the band
  // between heights vFrom and vTo of the cross-section
  const face = (side, vFrom, vTo, rows) =>
    gridGeometry(
      96,
      rows,
      (u, t) => {
        const x = bladeX(u);
        const v = THREE.MathUtils.lerp(vFrom, vTo, t);
        const { edge, spine } = bladeOutline(x);
        return new THREE.Vector3(x, edge + (spine - edge) * v, side * bladeHalfThickness(x, v));
      },
      side < 0,
    );

  // Polished bevel along the cutting edge, on both sides
  for (const side of [1, -1]) {
    blade.add(new THREE.Mesh(face(side, 0, BEVEL_TOP, 2), polishedMaterial));
  }

  const front = face(1, BEVEL_TOP, 1, 32);
  const back = face(-1, BEVEL_TOP, 1, 32);

  // Spine: the thick back of the blade, slightly rounded
  const spine = gridGeometry(96, 8, (u, w) => {
    const x = bladeX(u);
    const half = bladeHalfThickness(x, 1);
    const y = bladeOutline(x).spine + 0.04 * Math.sin(Math.PI * w);
    return new THREE.Vector3(x, y, THREE.MathUtils.lerp(half, -half, w));
  });

  // Cutting edge: a very thin strip along the bottom
  const edge = gridGeometry(96, 1, (u, w) => {
    const x = bladeX(u);
    const half = bladeHalfThickness(x, 0);
    return new THREE.Vector3(x, bladeOutline(x).edge, THREE.MathUtils.lerp(half, -half, w));
  }, true);

  // Heel: closes the blade where it meets the shank
  const heel = gridGeometry(32, 1, (v, w) => {
    const { edge: e, spine: s } = bladeOutline(0);
    const half = bladeHalfThickness(0, v);
    return new THREE.Vector3(0, e + (s - e) * v, THREE.MathUtils.lerp(half, -half, w));
  });

  for (const geometry of [front, back, spine, edge, heel]) {
    blade.add(new THREE.Mesh(geometry, material));
  }
  return blade;
}

// ------------------------------------------------------- Shank and tang
// The solid steel part between the blade and the pivot, including the
// rounded "tail" that sits between the scales.
function createShank(material) {
  const H = BLADE.height;
  const shape = new THREE.Shape();
  shape.moveTo(0, H);
  shape.lineTo(-2.2, H);
  shape.quadraticCurveTo(-2.85, H, -2.85, H - 0.52);
  shape.quadraticCurveTo(-2.85, H - 1.05, -2.2, H - 1.05);
  shape.lineTo(-1.1, H - 1.05);
  shape.quadraticCurveTo(-0.25, H - 1.05, 0, 0.55);
  shape.closePath();

  const bevel = 0.03;
  const depth = SHANK_HALF * 2 - bevel * 2;
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 3,
    curveSegments: 24,
  });
  geometry.translate(0, 0, -depth / 2);
  return new THREE.Mesh(geometry, material);
}

// ---------------------------------------------------------------- The handle

// Half width of a scale at distance x from the pivot: slim near the pivot,
// fuller in the middle, slightly narrower at the end.
const scaleHalfWidth = (x) =>
  0.68 + 0.26 * Math.sin((Math.PI * x) / HANDLE.length) - 0.06 * (x / HANDLE.length);

function createScaleShape() {
  const L = HANDLE.length;
  const points = [];
  const steps = 48;

  // Rounded end around the pivot (left half circle)
  const r0 = scaleHalfWidth(0);
  for (let i = 0; i <= 16; i++) {
    const angle = Math.PI / 2 + (Math.PI * i) / 16;
    points.push(new THREE.Vector2(Math.cos(angle) * r0, Math.sin(angle) * r0));
  }
  // Bottom edge, from the pivot to the end
  for (let i = 1; i < steps; i++) {
    const x = (L * i) / steps;
    points.push(new THREE.Vector2(x, -scaleHalfWidth(x)));
  }
  // Rounded far end (right half circle)
  const r1 = scaleHalfWidth(L);
  for (let i = 0; i <= 16; i++) {
    const angle = -Math.PI / 2 + (Math.PI * i) / 16;
    points.push(new THREE.Vector2(L + Math.cos(angle) * r1, Math.sin(angle) * r1));
  }
  // Top edge, back to the pivot
  for (let i = steps - 1; i > 0; i--) {
    const x = (L * i) / steps;
    points.push(new THREE.Vector2(x, scaleHalfWidth(x)));
  }

  return new THREE.Shape(points);
}

// A gold domed pin cap, facing +z (side = 1) or -z (side = -1)
function createPinCap(radius, side, material) {
  const cap = new THREE.Group();

  const dome = new THREE.SphereGeometry(radius, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2);
  dome.rotateX((side * Math.PI) / 2);
  dome.scale(1, 1, 0.4);
  cap.add(new THREE.Mesh(dome, material));

  // Thin washer under the dome
  const washer = new THREE.CylinderGeometry(radius * 1.3, radius * 1.3, 0.03, 40);
  washer.rotateX(Math.PI / 2);
  cap.add(new THREE.Mesh(washer, material));

  return cap;
}

function createHandle(materials) {
  const handle = new THREE.Group();
  const scaleGeometry = new THREE.ExtrudeGeometry(createScaleShape(), {
    depth: HANDLE.thickness,
    bevelEnabled: true,
    bevelThickness: HANDLE.bevel,
    bevelSize: HANDLE.bevel,
    bevelSegments: 6,
  });

  // z position of the outer surface of each scale
  const inner = HANDLE.gap / 2 + HANDLE.bevel;
  const outer = inner + HANDLE.thickness + HANDLE.bevel;

  const frontScale = new THREE.Mesh(scaleGeometry, materials.ebony);
  frontScale.position.z = inner;
  const backScale = new THREE.Mesh(scaleGeometry, materials.ebony);
  backScale.position.z = -inner - HANDLE.thickness;
  handle.add(frontScale, backScale);

  // Pivot pin through both scales and the tang
  const pin = new THREE.CylinderGeometry(0.1, 0.1, outer * 2, 24);
  pin.rotateX(Math.PI / 2);
  handle.add(new THREE.Mesh(pin, materials.gold));

  // Wedge: the spacer between the scales at the far end
  const wedge = new THREE.CylinderGeometry(0.55, 0.55, HANDLE.gap + 0.02, 40);
  wedge.rotateX(Math.PI / 2);
  const wedgeMesh = new THREE.Mesh(wedge, materials.ebony);
  wedgeMesh.position.x = HANDLE.length - 0.1;
  handle.add(wedgeMesh);

  // Gold caps on both sides of the pivot and the end pin
  for (const side of [1, -1]) {
    const pivotCap = createPinCap(0.24, side, materials.gold);
    pivotCap.position.z = side * outer;
    handle.add(pivotCap);

    const endCap = createPinCap(0.17, side, materials.gold);
    endCap.position.set(HANDLE.length - 0.1, 0, side * outer);
    handle.add(endCap);
  }

  // Move the handle to the pivot and swing it open
  handle.position.set(PIVOT.x, PIVOT.y, 0);
  handle.rotation.z = HANDLE.openAngle;
  return handle;
}

// ---------------------------------------------------------------- Public API

// Returns the razor, centred on (0, 0, 0), and its bounding sphere radius
// (used to place the camera so the razor always fits in the frame).
export function createRazor() {
  const materials = createMaterials();

  const razor = new THREE.Group();
  razor.add(createBlade(materials.steel, materials.polished));
  razor.add(createShank(materials.steel));
  razor.add(createHandle(materials));

  // Centre the model so it rotates around its middle
  razor.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(razor);
  const center = box.getCenter(new THREE.Vector3());
  razor.position.sub(center);

  const model = new THREE.Group();
  model.add(razor);
  const radius = box.getBoundingSphere(new THREE.Sphere()).radius;
  return { model, radius };
}

// Frees the GPU memory used by the model's geometries, materials and textures
export function disposeRazor(model) {
  const materials = new Set();
  model.traverse((object) => {
    if (object.isMesh) {
      object.geometry.dispose();
      materials.add(object.material);
    }
  });
  for (const material of materials) {
    material.roughnessMap?.dispose();
    material.dispose();
  }
}
