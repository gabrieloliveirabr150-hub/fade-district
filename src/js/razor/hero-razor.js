// The 3D razor in the homepage hero: scene, lighting, animation, cleanup.
// Loaded on demand by main.js, so Three.js is only downloaded on pages
// that actually have a razor stage.

import * as THREE from 'three';
import { createRazor, disposeRazor } from './razor-model.js';

// ---- Composition and motion settings (tweak these to change the feel) ----
const TILT = { x: 0.32, z: 0.62 }; // fixed diagonal pose, like a product shot
const BASE_YAW = -0.12; // resting rotation around the vertical axis
const SWING = 0.34; // how far it slowly turns left and right (radians)
const FLOAT = 0.22; // how far it floats up and down
const POINTER_STRENGTH = { x: 0.3, y: 0.15 }; // mouse influence (kept subtle)
const FRAMING = 0.86; // < 1 = razor fills more of the frame

// ---------------------------------------------------------------- Lighting
// Polished metal shows what it reflects. Instead of a photo of a room, we
// build a dark "virtual studio" with glowing panels (softboxes), then
// convert it into an environment map that every material reflects.
function createStudioEnvironment(renderer) {
  const studio = new THREE.Scene();
  studio.background = new THREE.Color(0x040405);

  // The camera looks along -z, so panels with a positive z are "behind the
  // camera": that is what the face of the blade reflects.
  const panels = [
    // [width, height, color, brightness, position]
    [9, 6, 0xffffff, 2.4, [-4, 4, 9]], // main softbox, front upper left
    [1.6, 14, 0xffffff, 4.5, [6, 0, 8]], // crisp vertical strip, front right
    [14, 4, 0xffffff, 2.2, [0, 9, 0]], // softbox above
    [1.4, 12, 0xffffff, 3, [-8, 1, -2]], // rim strip, back left
    [1.4, 12, 0xffd9a0, 3, [8, -1, -2]], // warm champagne strip, back right
    [10, 1.2, 0xffffff, 1, [0, -7, 4]], // thin fill from below
  ];

  const disposables = [];
  for (const [w, h, color, brightness, position] of panels) {
    const geometry = new THREE.PlaneGeometry(w, h);
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(color).multiplyScalar(brightness),
      side: THREE.DoubleSide,
    });
    const panel = new THREE.Mesh(geometry, material);
    panel.position.set(...position);
    panel.lookAt(0, 0, 0);
    studio.add(panel);
    disposables.push(geometry, material);
  }

  const pmrem = new THREE.PMREMGenerator(renderer);
  const target = pmrem.fromScene(studio, 0.035);
  pmrem.dispose();
  disposables.forEach((item) => item.dispose());
  return target;
}

// ---------------------------------------------------------------- Main
// container: the empty <div id="razor-canvas"> in the hero.
// Returns a cleanup function that removes the scene and frees GPU memory.
export function initHeroRazor(container) {
  const stage = container.closest('.hero__stage');
  const showFallback = () => stage?.classList.add('is-static');

  // 1. Renderer: creating it throws an error if WebGL is unavailable
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  } catch {
    showFallback();
    return () => {};
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // sharp but not too heavy
  renderer.setClearColor(0x000000, 0); // transparent: the CSS glow shows behind
  renderer.toneMapping = THREE.ACESFilmicToneMapping; // cinematic contrast
  renderer.toneMappingExposure = 1.05;
  container.appendChild(renderer.domElement);

  // 2. Scene, camera, environment and lights
  const scene = new THREE.Scene();
  const environment = createStudioEnvironment(renderer);
  scene.environment = environment.texture;

  // A narrow field of view (like a telephoto lens) flattens perspective,
  // which is how product photography is usually shot
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 200);

  const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
  keyLight.position.set(-4, 6, 8);
  const rimLight = new THREE.DirectionalLight(0xe9cf98, 2.2); // champagne rim
  rimLight.position.set(6, 2, -6);
  scene.add(keyLight, rimLight);

  // 3. The razor, inside two groups:
  //    motion (animated) → tilt (fixed diagonal pose) → model
  const { model, radius } = createRazor();
  const tilt = new THREE.Group();
  tilt.rotation.set(TILT.x, 0, TILT.z);
  tilt.add(model);
  const motion = new THREE.Group();
  motion.add(tilt);
  scene.add(motion);

  // 4. Fit the canvas and camera to the container size
  function resize() {
    const width = container.clientWidth;
    const height = container.clientHeight;
    if (!width || !height) return;

    renderer.setSize(width, height, false);
    camera.aspect = width / height;

    // Move the camera back until the razor's bounding sphere fits
    const verticalFov = THREE.MathUtils.degToRad(camera.fov);
    const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * camera.aspect);
    const fitFov = Math.min(verticalFov, horizontalFov);
    camera.position.set(0, 0, (radius * FRAMING) / Math.tan(fitFov / 2));
    camera.updateProjectionMatrix();

    if (!isRunning) renderFrame(0);
  }

  // 5. Pointer interaction (desktop with a mouse only)
  const pointer = { x: 0, y: 0 }; // where the mouse is, from -1 to 1
  const smoothed = { x: 0, y: 0 }; // follows the pointer gently

  function onPointerMove(event) {
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = (event.clientY / window.innerHeight) * 2 - 1;
  }

  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  if (finePointer.matches) {
    window.addEventListener('pointermove', onPointerMove, { passive: true });
  }

  // 6. Animation
  let elapsed = 0; // seconds of animation so far
  let lastTime = 0;

  // Places the razor for a given time step and draws one frame
  function renderFrame(deltaSeconds) {
    elapsed += deltaSeconds;

    // Smoothly move towards the pointer. Using the time step makes the
    // easing feel the same on 60 Hz and 120 Hz screens.
    const ease = 1 - Math.exp(-deltaSeconds * 2.5);
    smoothed.x += (pointer.x - smoothed.x) * ease;
    smoothed.y += (pointer.y - smoothed.y) * ease;

    // Slow sine waves with different speeds give an organic, non-repeating feel
    motion.rotation.y =
      BASE_YAW + Math.sin(elapsed * 0.3) * SWING + smoothed.x * POINTER_STRENGTH.x;
    motion.rotation.x = Math.sin(elapsed * 0.21) * 0.06 + smoothed.y * POINTER_STRENGTH.y;
    motion.position.y = Math.sin(elapsed * 0.55) * FLOAT;

    // Slowly turn the studio lights so highlights glide along the blade
    scene.environmentRotation.y = elapsed * 0.07;

    renderer.render(scene, camera);
  }

  function animate(time) {
    const delta = lastTime ? Math.min((time - lastTime) / 1000, 0.05) : 0;
    lastTime = time;
    renderFrame(delta);
  }

  // 7. Only animate when it makes sense
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let isVisible = true;
  let isRunning = false;

  function updateLoop() {
    const shouldRun = isVisible && !reducedMotion.matches;
    if (shouldRun && !isRunning) {
      lastTime = 0;
      renderer.setAnimationLoop(animate); // like requestAnimationFrame, every frame
      isRunning = true;
    } else if (!shouldRun && isRunning) {
      renderer.setAnimationLoop(null); // stop drawing frames
      isRunning = false;
    }
    // With reduced motion, show a still, well-lit pose instead
    if (reducedMotion.matches) {
      pointer.x = pointer.y = smoothed.x = smoothed.y = 0;
      renderFrame(0);
    }
  }

  // Pause when the hero is scrolled out of view (browsers already pause
  // animation frames in background tabs, so that case is handled for us)
  const visibilityObserver = new IntersectionObserver(([entry]) => {
    isVisible = entry.isIntersecting;
    updateLoop();
  });
  visibilityObserver.observe(container);

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  reducedMotion.addEventListener('change', updateLoop);

  resize();
  updateLoop();
  container.classList.add('is-ready'); // CSS fades the canvas in

  // 8. Cleanup: stop everything and free GPU memory
  function dispose() {
    renderer.setAnimationLoop(null);
    isRunning = false;
    visibilityObserver.disconnect();
    resizeObserver.disconnect();
    reducedMotion.removeEventListener('change', updateLoop);
    window.removeEventListener('pointermove', onPointerMove);
    renderer.domElement.removeEventListener('webglcontextlost', onContextLost);

    disposeRazor(model);
    environment.dispose();
    renderer.dispose();
    renderer.domElement.remove();
    container.classList.remove('is-ready');
  }

  // If the graphics card resets (rare, e.g. a driver crash), switch to the image
  function onContextLost(event) {
    event.preventDefault();
    dispose();
    showFallback();
  }
  renderer.domElement.addEventListener('webglcontextlost', onContextLost);

  return dispose;
}
