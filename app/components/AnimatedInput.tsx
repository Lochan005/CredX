"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { transitionPresets } from "../lib/animation";

interface AnimatedInputProps {
  label: string;
  value: number | string;
  onChange: (value: number | string) => void;
  type?: "number" | "text";
  prefix?: string;
  suffix?: string;
  min?: number;
  max?: number;
  error?: string;
  helpText?: string;
  className?: string;
}

export default function AnimatedInput({
  label,
  value,
  onChange,
  type = "number",
  prefix,
  suffix,
  min,
  max,
  error,
  helpText,
  className = "",
}: AnimatedInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(false);

  useEffect(() => {
    setHasValue(value !== "" && value !== 0);
  }, [value]);

  const isFloating = isFocused || hasValue;

  // Format number for display (Indian locale)
  const formatValue = (val: number | string): string => {
    if (type === "number") {
      const num = typeof val === "string" ? parseFloat(val) : val;
      if (isNaN(num) || num === 0) return "";
      return num.toLocaleString("en-IN");
    }
    return String(val);
  };

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;

    if (type === "number") {
      // Remove all non-numeric characters except decimal point
      const cleaned = inputValue.replace(/[^0-9.]/g, "");
      const num = cleaned === "" ? 0 : parseFloat(cleaned);
      onChange(isNaN(num) ? 0 : num);
    } else {
      onChange(inputValue);
    }
  };

  // Generate help text with min/max info
  const displayHelpText = helpText || (min !== undefined && max !== undefined
    ? `Min: ${prefix || ""}${min.toLocaleString("en-IN")}${suffix ? ` ${suffix}` : ""} - Max: ${prefix || ""}${max.toLocaleString("en-IN")}${suffix ? ` ${suffix}` : ""}`
    : min !== undefined
    ? `Min: ${prefix || ""}${min.toLocaleString("en-IN")}${suffix ? ` ${suffix}` : ""}`
    : max !== undefined
    ? `Max: ${prefix || ""}${max.toLocaleString("en-IN")}${suffix ? ` ${suffix}` : ""}`
    : "");

  // Shake animation variant
  const shakeVariants = {
    shake: {
      x: [-10, 10, -10, 10, -5, 5, 0],
    },
    normal: {
      x: 0,
    },
  };

  // Error message variants
  const errorVariants = {
    initial: { opacity: 0, y: -10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -5 },
  };

  // Help text variants
  const helpTextVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  };

  return (
    <div className={`relative mb-4 ${className}`}>
      {/* Label */}
      <motion.label
        htmlFor={label.toLowerCase().replace(/\s+/g, "-")}
        className="block text-sm text-gray-400 mb-1 pointer-events-none"
        animate={{
          y: isFloating ? -4 : 0,
          fontSize: isFloating ? "0.75rem" : "0.875rem",
          color: error ? "#ef4444" : isFocused ? "#22c55e" : "#9ca3af",
        }}
        transition={transitionPresets.quick}
      >
        {label}
      </motion.label>

      {/* Input container */}
      <motion.div
        className="relative"
        animate={error ? "shake" : "normal"}
        variants={shakeVariants}
        transition={error ? { duration: 0.4, ease: "easeInOut" } : transitionPresets.quick}
      >
        {/* Input wrapper */}
        <div className="relative">
          {/* Prefix */}
          {prefix && (
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg select-none z-10">
              {prefix}
            </span>
          )}

          {/* Input */}
          <motion.input
            type={type === "number" ? "text" : "text"}
            inputMode={type === "number" ? "numeric" : "text"}
            id={label.toLowerCase().replace(/\s+/g, "-")}
            value={type === "number" ? formatValue(value) : value}
            onChange={handleChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={`
              w-full bg-gray-800 border rounded-lg px-4 py-3
              text-white text-lg font-medium
              focus:outline-none transition-colors duration-200
              ${prefix ? "pl-10" : ""}
              ${suffix ? "pr-10" : ""}
              ${
                error
                  ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                  : isFocused
                  ? "border-green-500 focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                  : "border-gray-600"
              }
            `}
            animate={{
              boxShadow: isFocused && !error
                ? "0 0 0 3px rgba(34, 197, 94, 0.1)"
                : "0 0 0 0px rgba(34, 197, 94, 0)",
            }}
            transition={transitionPresets.quick}
          />

          {/* Suffix */}
          {suffix && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg select-none z-10">
              {suffix}
            </span>
          )}
        </div>
      </motion.div>

      {/* Help text */}
      <AnimatePresence mode="wait">
        {!error && displayHelpText && (
          <motion.p
            key="help"
            variants={helpTextVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={transitionPresets.quick}
            className="mt-1 text-xs text-gray-500"
          >
            {displayHelpText}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Error message */}
      <AnimatePresence mode="wait">
        {error && (
          <motion.p
            key="error"
            variants={errorVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={transitionPresets.quick}
            className="mt-1 text-sm text-red-500 flex items-center gap-1"
          >
            <span>⚠️</span>
            <span>{error}</span>
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
