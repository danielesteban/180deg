import {
  Clock,
  OrthographicCamera,
  Scene,
  WebGLRenderer,
} from 'three';

export const camera = new OrthographicCamera();
export const clock = new Clock();
export const renderer = new WebGLRenderer({ alpha: true, antialias: true });
export const scene = new Scene();

renderer.setPixelRatio(window.devicePixelRatio || 1);

const viewport = document.createElement('div');
viewport.id = 'viewport';
viewport.appendChild(renderer.domElement);
document.body.appendChild(viewport);

const resize = () => {
  const { innerWidth: width, innerHeight: height } = window;
  renderer.setSize(width, height);
  const aspect = width / height;
  camera.left = -aspect;
  camera.right = aspect;
  camera.bottom = -1;
  camera.top = 1;
  camera.zoom = 0.8;
  camera.near = -1;
  camera.far = 1;
  camera.updateProjectionMatrix();  
};
resize();

document.addEventListener('contextmenu', (e) => e.preventDefault());
document.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
window.addEventListener('resize', resize);
document.addEventListener('visibilitychange', () => (
  document.visibilityState === 'visible' && clock.start()
));
