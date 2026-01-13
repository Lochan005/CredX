"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import AnimatedNumber from "./AnimatedNumber";
import { fadeIn } from "../lib/animation";

const ConfettiExplosion = dynamic(
  () => import("react-confetti-explosion").then((mod) => mod.default),
  { ssr: false }
);

interface SavingsHighlightProps {
  value: number;
  label?: string;
  showConfetti?: boolean;
}

export default function SavingsHighlight({
  value,
  label = "INTEREST SAVED",
  showConfetti = true,
}: SavingsHighlightProps) {
  const [animationComplete, setAnimationComplete] = useState(false);
  const [showConfettiExplosion, setShowConfettiExplosion] = useState(false);
  const [shouldPulse, setShouldPulse] = useState(false);

  // Estimate animation completion (AnimatedNumber uses spring with ~1.5s)
  useEffect(() => {
    setAnimationComplete(false);
    setShowConfettiExplosion(false);
    setShouldPulse(false);
    
    const timer = setTimeout(() => {
      setAnimationComplete(true);
      setShouldPulse(true);
    }, 1800); // Slightly longer than animation duration
    
    return () => clearTimeout(timer);
  }, [value]);

  // Trigger confetti after pulse completes if value > 100000
  useEffect(() => {
    if (shouldPulse && showConfetti && value > 100000) {
      const timer = setTimeout(() => {
        setShowConfettiExplosion(true);
      }, 600); // After pulse completes
      return () => clearTimeout(timer);
    }
  }, [shouldPulse, showConfetti, value]);

  return (
    <motion.div
      className="text-center py-8 relative"
      {...fadeIn}
    >
      {/* Number container with pulse */}
      <motion.div
        animate={
          shouldPulse
            ? {
                scale: [1, 1.05, 1],
              }
            : { scale: 1 }
        }
        transition={
          shouldPulse
            ? {
                duration: 0.5,
                times: [0, 0.5, 1],
              }
            : {}
        }
      >
        {/* Label */}
        <p className="text-sm text-gray-400 uppercase tracking-wider mb-2">
          {label}
        </p>

        {/* Number with glow */}
        <div className="relative inline-block glow-green rounded-lg px-6 py-3">
          <AnimatedNumber
            value={value}
            className="text-4xl md:text-5xl font-bold text-green-500"
          />
        </div>
      </motion.div>

      {/* Confetti Explosion */}
      {showConfettiExplosion && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <ConfettiExplosion
            force={0.8}
            duration={3000}
            particleCount={250}
            width={1600}
          />
        </div>
      )}
    </motion.div>
  );
}
