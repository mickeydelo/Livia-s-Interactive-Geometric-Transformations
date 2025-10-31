import React, { useRef, useCallback, useState, useEffect } from 'react';
import { Point } from '../types';

interface MathGridProps {
  points: Point[];
  transformedPoints: Point[] | null;
  onGridClick: (point: Point) => void;
  onPointsDrag: (points: Point[]) => void;
  onDragEnd: (points: Point[]) => void;
  gridSize?: number;
  highlightedPointIndex: number | null;
  animation: { from: Point[]; to: Point[]; key: number } | null;
}

type DragInfo = {
  type: 'point' | 'shape';
  index: number; // -1 for shape
  startPos: Point;
  initialPoints: Point[];
  touchStartPos?: { clientX: number, clientY: number };
  isDragging?: boolean;
};

const formatNumber = (num: number) => Number(num.toFixed(2)).toString();

const MathGrid: React.FC<MathGridProps> = ({ points, transformedPoints, onGridClick, onPointsDrag, onDragEnd, gridSize = 20, highlightedPointIndex, animation }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragInfo, setDragInfo] = useState<DragInfo | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  const dragInfoRef = useRef<DragInfo | null>(null);
  const latestDraggedPointsRef = useRef<Point[] | null>(null);
  const animateRef = useRef<SVGAnimateElement>(null);
  const unit = 1; 
  const halfGrid = gridSize / 2;

  useEffect(() => {
    if (animation && animateRef.current) {
      animateRef.current.beginElement();
    }
  }, [animation]);

  const getCoordsFromEvent = useCallback((e: React.MouseEvent | MouseEvent | React.TouchEvent | TouchEvent): Point | null => {
    if (!svgRef.current) return null;

    let clientX, clientY;
    if ('touches' in e) { // For TouchEvent and React.TouchEvent
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else { // For MouseEvent and React.MouseEvent
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    const svgX = clientX - rect.left;
    const svgY = clientY - rect.top;

    const viewBox = svg.viewBox.baseVal;
    const ratioX = svgX / rect.width;
    const ratioY = svgY / rect.height;

    const mappedX = viewBox.x + ratioX * viewBox.width;
    const mappedY = viewBox.y + (1 - ratioY) * viewBox.height;

    return { x: mappedX, y: mappedY };
  }, []);

  const handleGridBackgroundClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (dragInfo || animation) return;
    const coords = getCoordsFromEvent(e);
    if(coords) {
      onGridClick({
        x: Math.round(coords.x),
        y: Math.round(coords.y),
      });
    }
  }, [onGridClick, getCoordsFromEvent, dragInfo, animation]);

  const handleDragEnd = useCallback(() => {
    window.removeEventListener('mousemove', handleDragMove);
    window.removeEventListener('mouseup', handleDragEnd);
    window.removeEventListener('touchmove', handleDragMove);
    window.removeEventListener('touchend', handleDragEnd);
    
    setIsMoving(false);
    if (latestDraggedPointsRef.current && dragInfoRef.current?.isDragging) {
        onDragEnd(latestDraggedPointsRef.current);
    }
    latestDraggedPointsRef.current = null;
    dragInfoRef.current = null;
    setTimeout(() => setDragInfo(null), 0);
  }, [onDragEnd]);

  const handleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    const currentDragInfo = dragInfoRef.current;
    if (!currentDragInfo) return;

    // For touch events, detect scroll vs. drag on first significant move
    if (e instanceof TouchEvent && !currentDragInfo.isDragging && currentDragInfo.touchStartPos) {
      const touch = e.touches[0];
      const dx = Math.abs(touch.clientX - currentDragInfo.touchStartPos.clientX);
      const dy = Math.abs(touch.clientY - currentDragInfo.touchStartPos.clientY);
      const threshold = 5; // pixels to move before we decide

      if (dx > threshold || dy > threshold) {
        if (dy > dx) {
          // It's a scroll gesture. Abort the drag to allow page scrolling.
          handleDragEnd();
          return;
        } else {
          // It's a drag gesture. Mark it as dragging.
          currentDragInfo.isDragging = true;
          setIsMoving(true);
        }
      } else {
        // Not enough movement to decide, wait for the next event.
        return;
      }
    }
    
    // For mouse events, any move starts a drag.
    if (e instanceof MouseEvent && !currentDragInfo.isDragging) {
        currentDragInfo.isDragging = true;
        setIsMoving(true);
    }

    // If we've reached here, it's a confirmed drag, so prevent default actions.
    if (e.cancelable) {
      e.preventDefault();
    }

    const currentPos = getCoordsFromEvent(e);
    if (!currentPos) return;

    const dx = currentPos.x - currentDragInfo.startPos.x;
    const dy = currentPos.y - currentDragInfo.startPos.y;

    let newPoints: Point[];

    if (currentDragInfo.type === 'point') {
      newPoints = currentDragInfo.initialPoints.map((p, i) => {
        if (i === currentDragInfo.index) {
          return {
            x: Math.round(p.x + dx),
            y: Math.round(p.y + dy),
          };
        }
        return p;
      });
    } else { // 'shape'
      newPoints = currentDragInfo.initialPoints.map(p => ({
        x: Math.round(p.x + dx),
        y: Math.round(p.y + dy),
      }));
    }
    onPointsDrag(newPoints);
    latestDraggedPointsRef.current = newPoints;
  }, [onPointsDrag, getCoordsFromEvent, handleDragEnd]);
  
  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent, type: 'point' | 'shape', index = -1) => {
    if (animation) return;
    e.stopPropagation();
    
    if (window.navigator.vibrate) {
      window.navigator.vibrate(50);
    }
    setIsMoving(false);

    const startPos = getCoordsFromEvent(e);
    if (!startPos) return;
    
    const newDragInfo: DragInfo = {
      type,
      index,
      startPos,
      initialPoints: points,
      isDragging: false,
    };
    
    if ('touches' in e.nativeEvent) {
      newDragInfo.touchStartPos = {
        clientX: e.nativeEvent.touches[0].clientX,
        clientY: e.nativeEvent.touches[0].clientY,
      };
    }
    
    setDragInfo(newDragInfo);
    dragInfoRef.current = newDragInfo;
    latestDraggedPointsRef.current = points;
    
    window.addEventListener('mousemove', handleDragMove);
    window.addEventListener('mouseup', handleDragEnd);
    window.addEventListener('touchmove', handleDragMove, { passive: false });
    window.addEventListener('touchend', handleDragEnd);
  }, [getCoordsFromEvent, points, handleDragMove, handleDragEnd, animation]);


  const getLabelProps = (point: Point, shapePoints: Point[], isShapeComplete: boolean, gridHalfSize: number) => {
    const offset = 0.6;
    const edgeMargin = 1.5;

    if (!isShapeComplete) {
      return {
        x: point.x + offset,
        y: -point.y,
        textAnchor: 'start' as const,
        dominantBaseline: 'middle' as const,
      };
    }

    const centroid = shapePoints.reduce(
      (acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }),
      { x: 0, y: 0 }
    );
    centroid.x /= shapePoints.length;
    centroid.y /= shapePoints.length;

    const dx = point.x - centroid.x;
    const dy = point.y - centroid.y;
    
    let x = point.x;
    let y = -point.y;
    let textAnchor: 'start' | 'middle' | 'end' = 'middle';
    let dominantBaseline: 'middle' | 'hanging' | 'alphabetic' = 'middle';

    if (point.x > gridHalfSize - edgeMargin) {
      textAnchor = 'end';
      x -= offset;
    } else if (point.x < -gridHalfSize + edgeMargin) {
      textAnchor = 'start';
      x += offset;
    } else if (point.y > gridHalfSize - edgeMargin) {
      dominantBaseline = 'hanging';
      y += offset;
    } else if (point.y < -gridHalfSize + edgeMargin) {
      dominantBaseline = 'alphabetic';
      y -= offset;
    } 
    else if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0) {
        textAnchor = 'start';
        x += offset;
      } else {
        textAnchor = 'end';
        x -= offset;
      }
    } else {
      if (dy > 0) {
        dominantBaseline = 'alphabetic';
        y -= offset;
      } else {
        dominantBaseline = 'hanging';
        y += offset;
      }
    }
    
    return { x, y, textAnchor, dominantBaseline };
  };

  const renderGridLines = () => {
    const lines = [];
    for (let i = -halfGrid; i <= halfGrid; i++) {
      if (i === 0) continue;
      lines.push(
        <line
          key={`v-${i}`}
          x1={i * unit} y1={-halfGrid * unit}
          x2={i * unit} y2={halfGrid * unit}
          stroke="#374151" strokeWidth="0.05"
        />
      );
      lines.push(
        <line
          key={`h-${i}`}
          x1={-halfGrid * unit} y1={i * unit}
          x2={halfGrid * unit} y2={i * unit}
          stroke="#374151" strokeWidth="0.05"
        />
      );
    }
    return lines;
  };
  
  const pointsToString = (pts: Point[]) => pts.map(p => `${formatNumber(p.x)},${formatNumber(p.y)}`).join(' ');

  const renderHighlight = (p: Point, color: string) => (
    <circle
      cx={p.x}
      cy={p.y}
      r="0.4"
      fill="none"
      stroke={color}
      strokeWidth="0.2"
      style={{ pointerEvents: 'none' }}
    >
      <animate
        attributeName="r"
        from="0.4"
        to="0.8"
        dur="1.2s"
        begin="0s"
        repeatCount="indefinite"
        calcMode="spline"
        keyTimes="0; 1"
        keySplines="0.165, 0.84, 0.44, 1"
      />
      <animate
        attributeName="stroke-opacity"
        from="1"
        to="0"
        dur="1.2s"
        begin="0s"
        repeatCount="indefinite"
        calcMode="spline"
        keyTimes="0; 1"
        keySplines="0.165, 0.84, 0.44, 1"
      />
    </circle>
  );

  return (
    <div 
      className="w-full aspect-square bg-background rounded-lg flex justify-center items-center"
      style={{ boxShadow: '0 10px 15px -2px rgba(0, 0, 0, 0.57), 0 5px 7px -4px rgba(0, 0, 0, 0.1)' }}
    >
      <svg
        ref={svgRef}
        className={`w-full h-full touch-none ${dragInfo ? 'cursor-grabbing' : 'cursor-crosshair'}`}
        viewBox={`${-halfGrid} ${-halfGrid} ${gridSize} ${gridSize}`}
        onClick={handleGridBackgroundClick}
        style={{ transform: 'scale(1, -1)' }}
      >
        <defs>
          <filter id="drop-shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0.05" dy="-0.05" stdDeviation="0.05" floodColor="#000000" floodOpacity="0.7"/>
          </filter>
        </defs>

        <rect x={-halfGrid} y={-halfGrid} width={gridSize} height={gridSize} fill="#111827" />
        {renderGridLines()}
        <line x1={-halfGrid * unit} y1="0" x2={halfGrid * unit} y2="0" stroke="#9ca3af" strokeWidth="0.1" />
        <line x1="0" y1={-halfGrid * unit} x2="0" y2={halfGrid * unit} stroke="#9ca3af" strokeWidth="0.1" />

        {transformedPoints && transformedPoints.length === 4 && (
          <polygon
            points={pointsToString(transformedPoints)}
            fill="rgba(16, 185, 129, 0.4)"
            stroke="#10b981"
            strokeWidth="0.1"
          />
        )}

        {points.length === 4 && (
          <polygon
            points={pointsToString(points)}
            fill="rgba(79, 70, 229, 0.4)"
            stroke="#4f46e5"
            strokeWidth="0.1"
            onMouseDown={(e) => handleDragStart(e, 'shape')}
            onTouchStart={(e) => handleDragStart(e, 'shape')}
            style={{ cursor: dragInfo ? 'grabbing' : 'grab' }}
          />
        )}
        
        {animation && (
          <polygon
            key={animation.key}
            points={pointsToString(animation.from)}
            fill="rgba(255, 255, 255, 0.2)"
            stroke="#a5b4fc"
            strokeWidth="0.15"
            strokeDasharray="0.3 0.3"
            style={{ pointerEvents: 'none' }}
          >
            <animate
              ref={animateRef}
              attributeName="points"
              from={pointsToString(animation.from)}
              to={pointsToString(animation.to)}
              dur="0.75s"
              begin="indefinite"
              fill="freeze"
              calcMode="spline"
              keyTimes="0; 1"
              keySplines="0.4, 0, 0.2, 1"
            />
          </polygon>
        )}

        {points.map((p, i) => {
          const isBeingDragged = dragInfo?.type === 'point' && dragInfo.index === i;
          const pointStyle: React.CSSProperties = {
            transition: isMoving ? 'opacity 0.15s ease-out' : 'transform 0.15s ease-out, opacity 0.15s ease-out',
          };

          return (
            <g
              key={`point-orig-group-${i}`}
              style={pointStyle}
              transform={`translate(${p.x} ${p.y}) scale(${isBeingDragged ? 1.5 : 1})`}
              opacity={isBeingDragged ? 0.75 : 1}
            >
              {i === highlightedPointIndex && renderHighlight({ x: 0, y: 0 }, '#a5b4fc')}
              <circle
                cx="0"
                cy="0"
                r="0.4"
                fill="#4f46e5"
                style={{ pointerEvents: 'none' }}
              />
              <circle
                cx="0"
                cy="0"
                r="1.2"
                fill="transparent"
                onMouseDown={(e) => handleDragStart(e, 'point', i)}
                onTouchStart={(e) => handleDragStart(e, 'point', i)}
                style={{ cursor: dragInfo ? 'grabbing' : 'grab' }}
              />
            </g>
          );
        })}
        {transformedPoints?.map((p, i) => (
          <g key={`point-trans-group-${i}`}>
            {i === highlightedPointIndex && renderHighlight(p, '#6ee7b7')}
            <circle key={`point-trans-${i}`} cx={p.x} cy={p.y} r="0.2" fill="#10b981" />
          </g>
        ))}

        {/* Labels */}
        {points.map((p, i) => {
          const { x, y, textAnchor, dominantBaseline } = getLabelProps(p, points, points.length === 4, halfGrid);
          return (
            <text
              key={`label-orig-${i}`}
              x={x}
              y={y}
              fontSize="0.65"
              fill="#a5b4fc"
              style={{ transform: 'scale(1, -1)', pointerEvents: 'none' }}
              filter="url(#drop-shadow)"
              textAnchor={textAnchor}
              dominantBaseline={dominantBaseline}
            >
              ({formatNumber(p.x)}, {formatNumber(p.y)})
            </text>
          );
        })}
        {transformedPoints?.map((p, i) => {
          const { x, y, textAnchor, dominantBaseline } = getLabelProps(p, transformedPoints, transformedPoints.length === 4, halfGrid);
          return (
            <text
              key={`label-trans-${i}`}
              x={x}
              y={y}
              fontSize="0.65"
              fill="#6ee7b7"
              style={{ transform: 'scale(1, -1)', pointerEvents: 'none' }}
              filter="url(#drop-shadow)"
              textAnchor={textAnchor}
              dominantBaseline={dominantBaseline}
            >
              ({formatNumber(p.x)}, {formatNumber(p.y)})
            </text>
          );
        })}
      </svg>
    </div>
  );
};

export default MathGrid;