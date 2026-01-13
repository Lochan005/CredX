"use client";

import { motion } from "framer-motion";
import { transitionPresets } from "../lib/animation";

interface ToggleOption {
  value: string;
  label: string;
}

interface AnimatedToggleProps {
  options: ToggleOption[];
  selected: string;
  onChange: (value: string) => void;
  className?: string;
}

export default function AnimatedToggle({
  options,
  selected,
  onChange,
  className = "",
}: AnimatedToggleProps) {
  const selectedIndex = options.findIndex((opt) => opt.value === selected);
  const indicatorWidth = 100 / options.length;

  return (
    <div
      className={`relative flex bg-gray-800 rounded-lg p-1 ${className}`}
    >
      {/* Sliding indicator */}
      <motion.div
        layoutId="toggle-indicator"
        className="absolute bg-green-600 rounded-md h-full"
        style={{
          width: `${indicatorWidth}%`,
          left: `${selectedIndex * indicatorWidth}%`,
        }}
        transition={transitionPresets.snappy}
      />

      {/* Options */}
      {options.map((option) => (
        <motion.button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`
            flex-1 px-4 py-2 text-center cursor-pointer z-10 relative
            transition-colors duration-200
            ${
              selected === option.value
                ? "text-white font-semibold"
                : "text-gray-400"
            }
          `}
          whileTap={{ scale: 0.97 }}
          transition={transitionPresets.quick}
        >
          {option.label}
        </motion.button>
      ))}
    </div>
  );
}
