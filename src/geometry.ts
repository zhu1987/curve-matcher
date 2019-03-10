import { arrLast } from './utils';

export interface Point {
  x: number;
  y: number;
}

export type Curve = Point[];

export const subtract = (v1: Point, v2: Point): Point => ({
  x: v1.x - v2.x,
  y: v1.y - v2.y
});

const magnitude = (vector: Point) =>
  Math.sqrt(Math.pow(vector.x, 2) + Math.pow(vector.y, 2));

export const pointDistance = (point1: Point, point2: Point) =>
  magnitude(subtract(point1, point2));

export const curveLength = (points: Curve) => {
  let lastPoint = points[0];
  const pointsSansFirst = points.slice(1);
  return pointsSansFirst.reduce((acc, point) => {
    const dist = pointDistance(point, lastPoint);
    lastPoint = point;
    return acc + dist;
  }, 0);
};
/**
 * return a new point, p3, which is on the same line as p1 and p2, but <dist> away from p2
 * p1, p2, p3 will always lie on the line in that order (as long as dist is positive)
 * @param p1
 * @param p2
 * @param dist
 */
export const extendPointOnLine = (p1: Point, p2: Point, dist: number) => {
  const vect = subtract(p2, p1);
  const norm = dist / magnitude(vect);
  return { x: p2.x + norm * vect.x, y: p2.y + norm * vect.y };
};

export interface SubdivideCurveOpts {
  maxLen?: number;
}

/**
 * Break up long segments in the curve into smaller segments of len maxLen or smaller
 * @param curve
 * @param options
 */
export const subdivideCurve = (
  curve: Curve,
  { maxLen = 0.05 }: SubdivideCurveOpts = {}
): Curve => {
  const newCurve = curve.slice(0, 1);
  curve.slice(1).forEach(point => {
    const prevPoint = newCurve[newCurve.length - 1];
    const segLen = pointDistance(point, prevPoint);
    if (segLen > maxLen) {
      const numNewPoints = Math.ceil(segLen / maxLen);
      const newSegLen = segLen / numNewPoints;
      for (let i = 0; i < numNewPoints; i++) {
        newCurve.push(
          extendPointOnLine(point, prevPoint, -1 * newSegLen * (i + 1))
        );
      }
    } else {
      newCurve.push(point);
    }
  });
  return newCurve;
};

export interface RebalanceCurveOpts {
  numPoints?: number;
}

/**
 * Redraw the curve using `numPoints` points equally spaced along the length of the curve
 * This may result in a slightly different shape than the original if `numPoints` is low
 * @param curve
 * @param options
 */
export const rebalanceCurve = (
  curve: Curve,
  { numPoints = 50 }: RebalanceCurveOpts
): Curve => {
  const curveLen = curveLength(curve);
  const segmentLen = curveLen / (numPoints - 1);
  const outlinePoints = [curve[0]];
  const endPoint = arrLast(curve);
  const remainingCurvePoints = curve.slice(1);
  for (let i = 0; i < numPoints - 2; i++) {
    let lastPoint = arrLast(outlinePoints);
    let remainingDist = segmentLen;
    let outlinePointFound = false;
    while (!outlinePointFound) {
      const nextPointDist = pointDistance(lastPoint, remainingCurvePoints[0]);
      if (nextPointDist < remainingDist) {
        remainingDist -= nextPointDist;
        lastPoint = remainingCurvePoints.shift() as Point;
      } else {
        const nextPoint = extendPointOnLine(
          lastPoint,
          remainingCurvePoints[0],
          remainingDist - nextPointDist
        );
        outlinePoints.push(nextPoint);
        outlinePointFound = true;
      }
    }
  }
  outlinePoints.push(endPoint);
  return outlinePoints;
};

/**
 * Rotate the curve around the origin
 * @param curve
 * @param theta the angle to rotate by, in radians
 */
export const rotateCurve = (curve: Curve, theta: number): Curve => {
  return curve.map(point => ({
    x: Math.cos(-1 * theta) * point.x - Math.sin(-1 * theta) * point.y,
    y: Math.sin(-1 * theta) * point.x + Math.cos(-1 * theta) * point.y
  }));
};
