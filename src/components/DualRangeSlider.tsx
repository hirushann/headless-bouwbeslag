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
  step = 0.01,
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
    (val: number) => {
      if (max === min) return 0;
      return Number((((val - min) / (max - min)) * 100).toFixed(4));
    },
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
      range.current.style.width = `${Math.max(0, maxPercent - minPercent)}%`;
    }
  }, [minVal, getPercent]);

  useEffect(() => {
    const minPercent = getPercent(minValRef.current);
    const maxPercent = getPercent(maxVal);

    if (range.current) {
      range.current.style.left = `${minPercent}%`;
      range.current.style.width = `${Math.max(0, maxPercent - minPercent)}%`;
    }
  }, [maxVal, getPercent]);

  // Dynamically bring the thumb closest to the respective edge to the top,
  // preventing a state where one thumb completely covers the other at boundaries.
  const isMinThumbOnTop = minVal > min + (max - min) / 2;

  return (
    <div className="flex flex-col w-full">
      <div className="flex justify-between text-sm font-medium text-gray-700 mb-4 px-1">
        <span>{minVal.toFixed(2)}</span>
        <span>{maxVal.toFixed(2)}</span>
      </div>
      <div className="relative w-full h-6 flex items-center">
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
          className="pointer-events-none absolute w-full h-full m-0 p-0 outline-none"
          style={{ 
            WebkitAppearance: "none", 
            appearance: "none", 
            background: "transparent",
            zIndex: isMinThumbOnTop ? 40 : 30 
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
          className="pointer-events-none absolute w-full h-full m-0 p-0 outline-none"
          style={{ 
            WebkitAppearance: "none", 
            appearance: "none", 
            background: "transparent",
            zIndex: isMinThumbOnTop ? 30 : 40 
          }}
        />

        {/* Track accurately aligned with the path of the thumb centers */}
        <div className="absolute left-[9px] right-[9px] h-1.5 pointer-events-none">
          <div className="absolute w-full h-full bg-gray-200 rounded-full z-10" />
          <div
            ref={range}
            className="absolute h-full bg-[#0066FF] rounded-full z-20"
          />
        </div>

        <style dangerouslySetInnerHTML={{__html: `
          input[type="range"]::-webkit-slider-runnable-track {
            width: 100%;
            height: 100%;
            background: transparent;
            border: none;
          }
          input[type="range"]::-moz-range-track {
            width: 100%;
            height: 100%;
            background: transparent;
            border: none;
          }
          input[type="range"]::-webkit-slider-thumb {
            pointer-events: all;
            width: 18px;
            height: 18px;
            -webkit-appearance: none;
            background-color: white;
            border: 2px solid #0066FF;
            border-radius: 50%;
            cursor: pointer;
            position: relative;
            z-index: 50;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          input[type="range"]::-moz-range-thumb {
            pointer-events: all;
            width: 18px;
            height: 18px;
            background-color: white;
            border: 2px solid #0066FF;
            border-radius: 50%;
            cursor: pointer;
            position: relative;
            z-index: 50;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
        `}} />
      </div>
    </div>
  );
}
