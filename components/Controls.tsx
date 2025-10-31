import React, { useState } from 'react';
import { TransformationType } from '../types';

interface ControlsProps {
  onApply: (type: TransformationType, params: any) => void;
  onReset: () => void;
  isShapeComplete: boolean;
  isAnimating: boolean;
}

const Controls: React.FC<ControlsProps> = ({ onApply, onReset, isShapeComplete, isAnimating }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [type, setType] = useState<TransformationType>(TransformationType.Rotate);
  const [angle, setAngle] = useState(90);
  const [axis, setAxis] = useState<'x' | 'y'>('y');
  const [tx, setTx] = useState('2');
  const [ty, setTy] = useState('3');

  const handleApply = () => {
    let params;
    switch (type) {
      case TransformationType.Rotate:
        params = { angle };
        break;
      case TransformationType.Reflect:
        params = { axis };
        break;
      case TransformationType.Translate:
        params = { tx: parseFloat(tx) || 0, ty: parseFloat(ty) || 0 };
        break;
    }
    onApply(type, params);
  };
  
  const handleStep = (value: string, setter: (value: string) => void, step: number) => {
    const current = parseFloat(value) || 0;
    setter(String(current + step));
  };
  
  const handleNumericChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (value: string) => void) => {
    const newValue = e.target.value;
    if (newValue === '' || newValue === '-' || /^-?\d*\.?\d*$/.test(newValue)) {
      setter(newValue);
    }
  };

  const commonInputClass = "w-full bg-background border border-border rounded-md px-3 py-2 text-text-primary focus:ring-2 focus:ring-primary focus:border-primary transition duration-150";
  const commonButtonClass = "w-full py-2 px-4 rounded-md font-semibold transition duration-200";
  const disabledButtonClass = "bg-gray-600 text-gray-400 cursor-not-allowed";
  const enabledButtonClass = "bg-primary hover:bg-indigo-500 text-white";
  const stepperButtonClass = "px-3 py-2 bg-background border border-border text-text-secondary hover:bg-gray-700 disabled:opacity-50 transition-colors";

  return (
    <div className="bg-surface rounded-lg shadow-lg">
      <button 
        className="w-full flex justify-between items-center text-left px-6 py-4"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls="transformations-panel"
      >
        <h2 className="text-2xl font-bold text-text-primary">Transformations</h2>
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 text-text-secondary transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div 
        id="transformations-panel"
        className={`transition-all duration-500 ease-in-out overflow-hidden ${isOpen ? 'max-h-[500px]' : 'max-h-0'}`}
      >
        <div className="px-6 py-4">
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-2">
              {(Object.values(TransformationType)).map(t => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`px-3 py-2 text-sm rounded-md transition ${type === t ? 'bg-primary text-white font-semibold' : 'bg-background hover:bg-gray-700 text-text-secondary'}`}
                  disabled={isAnimating}
                >
                  {t}
                </button>
              ))}
            </div>

            {type === TransformationType.Rotate && (
              <div>
                <label htmlFor="angle" className="block text-sm font-medium text-text-secondary mb-2">Rotation Angle (°)</label>
                <select
                  id="angle"
                  value={angle}
                  onChange={e => setAngle(Number(e.target.value))}
                  className={commonInputClass}
                  disabled={isAnimating}
                >
                  <option value="90">90°</option>
                  <option value="-90">-90°</option>
                  <option value="180">180°</option>
                  <option value="-180">-180°</option>
                </select>
              </div>
            )}

            {type === TransformationType.Reflect && (
              <div className="space-y-2">
                <p className="block text-sm font-medium text-text-secondary">Reflect across</p>
                <div className="flex gap-4">
                  <label className="flex items-center space-x-2 text-text-primary cursor-pointer">
                    <input type="radio" name="axis" value="x" checked={axis === 'x'} onChange={() => setAxis('x')} className="form-radio text-primary bg-background border-border focus:ring-primary" disabled={isAnimating}/>
                    <span>X-axis</span>
                  </label>
                  <label className="flex items-center space-x-2 text-text-primary cursor-pointer">
                    <input type="radio" name="axis" value="y" checked={axis === 'y'} onChange={() => setAxis('y')} className="form-radio text-primary bg-background border-border focus:ring-primary" disabled={isAnimating}/>
                    <span>Y-axis</span>
                  </label>
                </div>
              </div>
            )}

            {type === TransformationType.Translate && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="tx" className="block text-sm font-medium text-text-secondary mb-2">Translate X (dx)</label>
                  <div className="flex">
                    <button type="button" onClick={() => handleStep(tx, setTx, -1)} disabled={isAnimating} className={`${stepperButtonClass} rounded-l-md`} aria-label="Decrement Translate X">-</button>
                    <input
                      id="tx"
                      type="text"
                      inputMode="decimal"
                      value={tx}
                      onChange={(e) => handleNumericChange(e, setTx)}
                      className="w-full bg-background border-y border-border text-center text-text-primary focus:ring-2 focus:ring-primary focus:border-primary transition duration-150 focus:z-10"
                      disabled={isAnimating}
                    />
                    <button type="button" onClick={() => handleStep(tx, setTx, 1)} disabled={isAnimating} className={`${stepperButtonClass} rounded-r-md`} aria-label="Increment Translate X">+</button>
                  </div>
                </div>
                <div>
                  <label htmlFor="ty" className="block text-sm font-medium text-text-secondary mb-2">Translate Y (dy)</label>
                  <div className="flex">
                    <button type="button" onClick={() => handleStep(ty, setTy, -1)} disabled={isAnimating} className={`${stepperButtonClass} rounded-l-md`} aria-label="Decrement Translate Y">-</button>
                    <input
                      id="ty"
                      type="text"
                      inputMode="decimal"
                      value={ty}
                      onChange={(e) => handleNumericChange(e, setTy)}
                      className="w-full bg-background border-y border-border text-center text-text-primary focus:ring-2 focus:ring-primary focus:border-primary transition duration-150 focus:z-10"
                      disabled={isAnimating}
                    />
                    <button type="button" onClick={() => handleStep(ty, setTy, 1)} disabled={isAnimating} className={`${stepperButtonClass} rounded-r-md`} aria-label="Increment Translate Y">+</button>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="space-y-3 mt-6">
            <button onClick={handleApply} disabled={!isShapeComplete || isAnimating} className={`${commonButtonClass} ${isShapeComplete && !isAnimating ? enabledButtonClass : disabledButtonClass}`}>
              Apply Transformation
            </button>
            <button onClick={onReset} disabled={isAnimating} className={`${commonButtonClass} bg-red-600 hover:bg-red-500 text-white ${isAnimating ? 'opacity-50 cursor-not-allowed' : ''}`}>
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Controls;