export interface Point {
  x: number;
  y: number;
}

export enum TransformationType {
  Rotate = 'Rotate',
  Reflect = 'Reflect',
  Translate = 'Translate',
}

export interface TransformationLogEntry {
  id: number;
  type: TransformationType;
  params: any;
  originalPoints: Point[];
  transformedPoints: Point[];
  description: string;
  math: string[];
}
