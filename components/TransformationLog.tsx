import React from 'react';
import { TransformationLogEntry, Point } from '../types';

interface TransformationLogProps {
  history: TransformationLogEntry[];
  onHighlight: (index: number) => void;
  highlightedPointIndex: number | null;
}

const formatNumber = (num: number) => Number(num.toFixed(2)).toString();

const TransformationLog: React.FC<TransformationLogProps> = ({ history, onHighlight, highlightedPointIndex }) => {
  const formatPoint = (p: Point) => `(${formatNumber(p.x)}, ${formatNumber(p.y)})`;

  return (
    <div className="bg-surface px-6 py-4 pt-0 rounded-lg shadow-lg lg:flex lg:flex-col lg:flex-1 lg:min-h-0">
      <h2 className="text-2xl font-bold text-text-primary pt-4 pb-4">History</h2>
      {history.length === 0 ? (
        <p className="text-text-secondary text-center py-8">No transformations applied yet.</p>
      ) : (
        <div className="space-y-6 lg:overflow-y-auto lg:pr-2 lg:flex-1">
          {history.map(entry => (
            <div key={entry.id} className="bg-background p-4 rounded-md border border-border">
              <h3 className="font-semibold text-lg text-primary mb-2">{entry.type}</h3>
              <p className="text-sm text-text-secondary mb-3">{entry.description}</p>
              <div className="text-sm space-y-2">
                {entry.math.map((m, i) => (
                  <div 
                    key={i} 
                    className={`bg-gray-800 p-3 rounded font-mono text-xs text-green-300 cursor-pointer transition-colors duration-200 hover:bg-gray-700 ${highlightedPointIndex === i ? 'ring-2 ring-primary' : ''}`}
                    onClick={() => onHighlight(i)}
                  >
                    <p className='text-gray-400 mb-1'>Point {i+1}: {formatPoint(entry.originalPoints[i])} → {formatPoint(entry.transformedPoints[i])}</p>
                    <pre>{m}</pre>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TransformationLog;