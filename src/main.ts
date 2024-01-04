import './main.css';
import { Group, Matrix4, Vector2, Vector3 } from 'three';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import {
  camera,
  clock,
  renderer,
  scene,
} from './viewport';

const triangle = new Line2(new LineGeometry(), new LineMaterial({ color: 0x0000ff, linewidth: 4, alphaToCoverage: true }));
scene.add(triangle);

const segment = new Group();
scene.add(segment);
for (let i = 0; i < 2; i++) {
  const line = new Line2(new LineGeometry(), new LineMaterial({ color: i === 0 ? 0x00ff00 : 0xff0000, linewidth: 6, alphaToCoverage: true }));
  line.geometry.setPositions([
    -0.25, 0, 0,
    0.25, 0, 0,
  ]);
  segment.add(line);
}

let points: Vector3[] = [];

const animation = {
  phase: 0,
  point: 0,
  pointA: new Vector3(),
  pointB: new Vector3(),
  origin: new Vector3(),
  direction: new Vector3(),
  rotation: 0,
  rotationOrigin: new Matrix4(),
  step: 0,
};
const step = new Vector3();
const generate = () => {
  points = [];
  for (let i = 0; i < 3; i++) {
    const a = Math.PI * (2 / 3) * i + Math.PI * (2 / 3) * (Math.random() * 0.7 + 0.3);
    points.push(new Vector3(Math.cos(a), Math.sin(a), 0));
  }
  (triangle.geometry as LineGeometry).setPositions(points.reduce<number[]>((line, p, i) => {
    line.push(p.x, p.y, p.z);
    if (i === 2) {
      line.push(points[0].x, points[0].y, points[0].z);
    }
    return line;
  }, []));

  animation.point = 1;
  animation.phase = animation.step = 0;
  animation.pointA.copy(points[animation.point]);
  animation.pointB.copy(points[(animation.point + 1) % 3]);
  animation.direction.subVectors(animation.pointB, animation.pointA);
  const length = animation.direction.length();
  animation.origin.copy(animation.pointA).addScaledVector(animation.direction, 0.25 / length);
  segment.position.copy(animation.origin);
  segment.rotation.z = Math.atan2(animation.direction.y, animation.direction.x);
  animation.direction.multiplyScalar((length - 0.5) / length);
};
generate();

const regenerate = document.createElement('button');
regenerate.id = 'regenerate';
regenerate.addEventListener('click', generate);
regenerate.innerText = 'regenerate';
document.body.appendChild(regenerate);

const matA = new Matrix4();
const matB = new Matrix4();
const axis = new Vector3(0, 0, 1);
const rotate = (angle: number, pivot: Vector3) => {
  matA.makeTranslation(pivot.clone().negate());
  matA.premultiply(matB.makeRotationAxis(axis, angle));
  matA.premultiply(matB.makeTranslation(pivot));
  return matA;
};

const aux = new Vector3();
const resolution = new Vector2();
renderer.setAnimationLoop(() => {
  const delta = Math.min(clock.getDelta(), 0.2);
  renderer.getSize(resolution);
  ([triangle, segment.children[0], segment.children[1]] as Line2[]).forEach((line) => (
    line.material.resolution.set(resolution.x, resolution.y)
  ));
  ([segment.children[0], segment.children[1]] as Line2[]).forEach((line, i) => (
    line.position.set(0, 6 / resolution.y * (i === 0 ? 1 : -1), 0)
  ));

  animation.step = Math.min(animation.step + delta, 1);
  switch (animation.phase) {
    case 0:
      segment.position.addVectors(animation.origin, step.copy(animation.direction).multiplyScalar(animation.step));
      if (animation.step === 1) {
        animation.phase = 1;
        animation.step = 0;
        animation.point = (animation.point + 1) % 3;
        animation.pointA.copy(points[animation.point]);
        animation.pointB.copy(points[(animation.point + 1) % 3]);
        aux.copy(animation.direction);
        animation.direction.subVectors(animation.pointB, animation.pointA);
        animation.rotationOrigin.copy(segment.matrix);
        animation.rotation = aux.angleTo(animation.direction) - Math.PI;
        const length = animation.direction.length();
        animation.origin.copy(animation.pointA).addScaledVector(animation.direction, 0.25 / length);
        animation.direction.multiplyScalar((length - 0.5) / length);
      }
      break;
    case 1:
      animation.rotationOrigin.decompose(segment.position, segment.quaternion, segment.scale);
      segment.applyMatrix4(rotate(animation.rotation * animation.step, animation.pointA));
      if (animation.step === 1) {
        animation.phase = 0;
        animation.step = 0;
      }
      break;
  }
  renderer.render(scene, camera);
});
