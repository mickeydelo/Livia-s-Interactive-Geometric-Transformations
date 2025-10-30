
import { Point } from '../types';

export const translate = (points: Point[], tx: number, ty: number): Point[] => {
  return points.map(p => ({
    x: p.x + tx,
    y: p.y + ty,
  }));
};

export const rotate = (points: Point[], angleDegrees: number): Point[] => {
  const angleRad = angleDegrees * (Math.PI / 180);
  const cosA = Math.cos(angleRad);
  const sinA = Math.sin(angleRad);
  return points.map(p => ({
    x: p.x * cosA - p.y * sinA,
    y: p.x * sinA + p.y * cosA,
  }));
};

export const reflect = (points: Point[], axis: 'x' | 'y'): Point[] => {
  return points.map(p => {
    if (axis === 'x') {
      return { x: p.x, y: -p.y };
    } else { // axis === 'y'
      return { x: -p.x, y: p.y };
    }
  });
};
