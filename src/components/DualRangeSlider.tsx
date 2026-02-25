"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";

interface DualRangeSliderProps {
  min: number;
  max: number;
  step?: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
}

export default function DualRangeSlider({
  min,
  max,
  step = 1,
  value,
  onChange,
}: DualRangeSliderProps) {
  const [minVal, setMinVal] = useState(value[0]);
  const [maxVal, setMaxVal] = useState(value[1]);
  const minValRef = useRef(value[0]);
  const maxValRef = useRef(value[1]);
  const range = useRef<HTMLDivElement>(null);

  // Convert to percentage
  const getPercent = useCallback(
    (val: number) => Math.round(((val - min) / (max - min)) * 100),
    [min, max]
  );

  useEffect(() => {
    setMinVal(value[0]);
    setMaxVal(value[1]);
    minValRef.current = value[0];
    maxValRef.current = value[1];
  }, [value]);

  useEffect(() => {
    const minPercent = getPercent(minVal);
    const maxPercent = getPercent(maxValRef.current);

    if (range.current) {
      range.current.style.left = `${minPercent}%`;
      range.current.style.width = `${maxPercent - minPercent}%`;
    }
  }, [minVal, getPercent]);

  useEffect(() => {
    const minPercent = getPercent(minValRef.current);
    const maxPercent = getPercent(maxVal);

    if (range.current) {
      range.current.style.width = `${maxPercent - minPercent}%`;
    }
  }, [maxVal, getPercent]);

  return (
    <div className="flex flex-col w-full">
      <div className="flex justify-between text-xs text-gray-500 mb-4 px-1">
        <span>{minVal.toFixed(2)}</span>
        <span>{maxVal.toFixed(2)}</span>
      </div>
      <div className="relative w-full h-4 flex items-center">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={minVal}
          onChange={(event) => {
            const value = Math.min(Number(event.target.value), maxVal - step);
            setMinVal(value);
            minValRef.current = value;
          }}
          onMouseUp={() => onChange([minVal, maxVal])}
          onTouchEnd={() => onChange([minVal, maxVal])}
          className="pointer-events-none absolute w-full h-0 outline-none z-30"
          style={{ 
            WebkitAppearance: "none", 
            appearance: "none", 
            zIndex: minVal > max - 100 ? 5 : 3 
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={maxVal}
          onChange={(event) => {
            const value = Math.max(Number(event.target.value), minVal + step);
            setMaxVal(value);
            maxValRef.current = value;
          }}
          onMouseUp={() => onChange([minVal, maxVal])}
          onTouchEnd={() => onChange([minVal, maxVal])}
          className="pointer-events-none absolute w-full h-0 outline-none z-40"
          style={{ WebkitAppearance: "none", appearance: "none" }}
        />

        <div className="relative w-full h-1">
          <div className="absolute w-full h-1 bg-gray-200 rounded-md z-10" />
          <div
            ref={range}
            className="absolute h-1 bg-[#0066FF] rounded-md z-20"
          />
        </div>

        <style dangerouslySetInnerHTML={{__html: `
          input[type="range"]::-webkit-slider-thumb {
            pointer-events: all;
            width: 16px;
            height: 16px;
            -webkit-appearance: none;
            background-color: white;
            border: 2px solid #0066FF;
            border-radius: 50%;
            box-shadow: 0 1px 3px rgba(0,0,0,0.3);
            cursor: pointer;
            position: relative;
            z-index: 50;
          }
          input[type="range"]::-moz-range-thumb {
            pointer-events: all;
            width: 16px;
            height: 16px;
            background-color: white;
            border: 2px solid #0066FF;
            border-radius: 50%;
            box-shadow: 0 1px 3px rgba(0,0,0,0.3);
            cursor: pointer;
            position: relative;
             z-index: 50;
          }
        `}} />
      </div>
    </div>
  );
}
