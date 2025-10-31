import React, { useState, useCallback, useRef } from 'react';
import { Point, TransformationType, TransformationLogEntry } from './types';
import MathGrid from './components/MathGrid';
import Controls from './components/Controls';
import TransformationLog from './components/TransformationLog';
import * as geometry from './services/geometry';

const formatNumber = (num: number) => Number(num.toFixed(2)).toString();

const applyTransform = (pointsToTransform: Point[], type: TransformationType, params: any): Point[] => {
  switch (type) {
    case TransformationType.Rotate:
      return geometry.rotate(pointsToTransform, params.angle);
    case TransformationType.Reflect:
      return geometry.reflect(pointsToTransform, params.axis);
    case TransformationType.Translate:
      return geometry.translate(pointsToTransform, params.tx, params.ty);
    default:
      return pointsToTransform;
  }
};

const generateMath = (sourcePoints: Point[], type: TransformationType, params: any): string[] => {
  switch (type) {
    case TransformationType.Rotate:
      const { angle } = params;
      const rad = angle * (Math.PI / 180);
      const cosA = formatNumber(Math.cos(rad));
      const sinA = formatNumber(Math.sin(rad));
      return sourcePoints.map(p =>
`[x'] = [${cosA}  -${sinA}] [${formatNumber(p.x)}]
[y']   [${sinA}   ${cosA}] [${formatNumber(p.y)}]
x' = ${formatNumber(p.x)}*${cosA} - ${formatNumber(p.y)}*${sinA}
y' = ${formatNumber(p.x)}*${sinA} + ${formatNumber(p.y)}*${cosA}`
      );
    case TransformationType.Reflect:
      const { axis } = params;
      return sourcePoints.map(p =>
        axis === 'x'
          ? `(x', y') = (x, -y) = (${formatNumber(p.x)}, -${formatNumber(p.y)})`
          : `(x', y') = (-x, y) = (-${formatNumber(p.x)}, ${formatNumber(p.y)})`
      );
    case TransformationType.Translate:
      const { tx, ty } = params;
      return sourcePoints.map(p =>
`(x', y') = (x + dx, y + dy)
(x', y') = (${formatNumber(p.x)} + ${formatNumber(tx)}, ${formatNumber(p.y)} + ${formatNumber(ty)})`
      );
    default:
      return [];
  }
};


function App() {
  const [points, setPoints] = useState<Point[]>([]);
  const [transformedPoints, setTransformedPoints] = useState<Point[] | null>(null);
  const [history, setHistory] = useState<TransformationLogEntry[]>([]);
  const [highlightedPointIndex, setHighlightedPointIndex] = useState<number | null>(null);
  const [animation, setAnimation] = useState<{ from: Point[]; to: Point[]; key: number } | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const gridContainerRef = useRef<HTMLDivElement>(null);
  
  const handleHighlightPoint = useCallback((index: number) => {
    setHighlightedPointIndex(prevIndex => (prevIndex === index ? null : index));
    gridContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const handleGridClick = useCallback((point: Point) => {
    setHighlightedPointIndex(null);
    setPoints(prevPoints => {
      if (prevPoints.length >= 4) {
        setTransformedPoints(null);
        setHistory([]);
        return [point];
      }
      
      const newPoints = [...prevPoints, point];

      if (newPoints.length === 4) {
        // Reorder points to form a simple quadrilateral
        const centroid = newPoints.reduce(
          (acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }),
          { x: 0, y: 0 }
        );
        centroid.x /= 4;
        centroid.y /= 4;

        return newPoints.sort((a, b) => {
          const angleA = Math.atan2(a.y - centroid.y, a.x - centroid.x);
          const angleB = Math.atan2(b.y - centroid.y, b.x - centroid.x);
          return angleA - angleB;
        });
      }

      return newPoints;
    });
  }, []);

  const handlePointsDrag = useCallback((newPoints: Point[]) => {
    setPoints(newPoints);
    if (history.length > 0) {
      const lastLogEntry = history[0];
      const { type, params } = lastLogEntry;
      const newTransformedPoints = applyTransform(newPoints, type, params);
      setTransformedPoints(newTransformedPoints.map(p => ({ x: parseFloat(p.x.toFixed(2)), y: parseFloat(p.y.toFixed(2)) })));
    }
  }, [history]);

  const handleDragEnd = useCallback((finalPoints: Point[]) => {
    if (history.length > 0) {
      const lastLogEntry = history[0];
      const { type, params } = lastLogEntry;
      
      const newTransformedPoints = applyTransform(finalPoints, type, params);
      // This is slightly redundant as it's set in onDrag, but ensures the final state is accurate
      setTransformedPoints(newTransformedPoints.map(p => ({ x: parseFloat(p.x.toFixed(2)), y: parseFloat(p.y.toFixed(2)) })));

      const newMath = generateMath(finalPoints, type, params);
      const updatedLogEntry: TransformationLogEntry = {
        ...lastLogEntry,
        originalPoints: finalPoints,
        transformedPoints: newTransformedPoints,
        math: newMath,
      };

      setHistory(prevHistory => [updatedLogEntry, ...prevHistory.slice(1)]);
    }
  }, [history]);

  const handleReset = useCallback(() => {
    setPoints([]);
    setTransformedPoints(null);
    setHistory([]);
    setHighlightedPointIndex(null);
  }, []);

  const handleApplyTransform = useCallback((type: TransformationType, params: any) => {
    if (isAnimating) return;
    const sourcePoints = transformedPoints || points;
    if (sourcePoints.length !== 4) return;

    setIsAnimating(true);
    setHighlightedPointIndex(null);
    const newPoints = applyTransform(sourcePoints, type, params);
    
    setAnimation({
      from: sourcePoints,
      to: newPoints.map(p => ({ x: parseFloat(p.x.toFixed(2)), y: parseFloat(p.y.toFixed(2)) })),
      key: Date.now(),
    });

    setTimeout(() => {
      let description = '';
      switch (type) {
        case TransformationType.Rotate:
          description = `Rotated by ${params.angle}° counter-clockwise around the origin (0,0).`;
          break;
        case TransformationType.Reflect:
          description = `Reflected across the ${params.axis}-axis.`;
          break;
        case TransformationType.Translate:
          description = `Translated by vector (${params.tx}, ${params.ty}).`;
          break;
      }
      
      if(transformedPoints) {
        setPoints(transformedPoints);
      }
      
      const finalTransformedPoints = newPoints.map(p => ({ x: parseFloat(p.x.toFixed(2)), y: parseFloat(p.y.toFixed(2)) }));
      setTransformedPoints(finalTransformedPoints);

      const math = generateMath(sourcePoints, type, params);
      const logEntry: TransformationLogEntry = {
        id: Date.now(),
        type,
        params,
        originalPoints: sourcePoints,
        transformedPoints: newPoints,
        description,
        math,
      };
      setHistory(prev => [logEntry, ...prev].slice(0, 2));

      setAnimation(null);
      setIsAnimating(false);
    }, 750); // Must match animation duration in MathGrid

  }, [points, transformedPoints, isAnimating]);
  
  const instruction = points.length < 4 
    ? `Click on the grid to add ${4 - points.length} more point(s).`
    : 'Shape complete. You can now apply a transformation or drag the shape.';
  
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-background text-text-primary p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
            Livia's Interactive Geometric Transformations
          </h1>
          <p className="mt-2 text-text-secondary">{instruction}</p>
        </header>
        <main className="lg:grid lg:grid-cols-3 lg:gap-8">
          <div 
            className="lg:col-span-2 sticky top-0 lg:static z-10 bg-background mb-8 lg:mb-0" 
            ref={gridContainerRef}
          >
            <div className="w-full max-w-sm mx-auto lg:max-w-none">
              <MathGrid
                points={points}
                transformedPoints={transformedPoints}
                onGridClick={handleGridClick}
                onPointsDrag={handlePointsDrag}
                onDragEnd={handleDragEnd}
                highlightedPointIndex={highlightedPointIndex}
                animation={animation}
              />
            </div>
          </div>
          <div className="lg:col-span-1">
            <div className="flex flex-col gap-4 lg:sticky lg:top-8 lg:max-h-[calc(100vh-4rem)]">
              <Controls 
                onApply={handleApplyTransform} 
                onReset={handleReset} 
                isShapeComplete={points.length === 4}
                isAnimating={isAnimating}
              />
              <TransformationLog 
                history={history} 
                onHighlight={handleHighlightPoint}
                highlightedPointIndex={highlightedPointIndex}
              />
            </div>
          </div>
        </main>
        <footer className="text-center text-text-secondary text-sm mt-8">
          ©DeLorenzo - {currentYear}
        </footer>
      </div>
    </div>
  );
}

export default App;
