"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";

interface TooltipProps {
  children: React.ReactNode;
  content: string | React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  delay?: number;
}

export default function Tooltip({
  children,
  content,
  position = "top",
  delay = 300,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Position-based offsets and classes
  const getPositionClasses = () => {
    switch (position) {
      case "top":
        return {
          container: "bottom-full mb-2 left-1/2 -translate-x-1/2",
          arrow: "top-full left-1/2 -translate-x-1/2 border-t-gray-900",
          arrowStyle: {
            borderTopColor: "#111827",
            borderTopWidth: "6px",
            borderLeft: "6px solid transparent",
            borderRight: "6px solid transparent",
          },
          initialY: -10,
        };
      case "bottom":
        return {
          container: "top-full mt-2 left-1/2 -translate-x-1/2",
          arrow: "bottom-full left-1/2 -translate-x-1/2 border-b-gray-900",
          arrowStyle: {
            borderBottomColor: "#111827",
            borderBottomWidth: "6px",
            borderLeft: "6px solid transparent",
            borderRight: "6px solid transparent",
          },
          initialY: 10,
        };
      case "left":
        return {
          container: "right-full mr-2 top-1/2 -translate-y-1/2",
          arrow: "left-full top-1/2 -translate-y-1/2 border-l-gray-900",
          arrowStyle: {
            borderLeftColor: "#111827",
            borderLeftWidth: "6px",
            borderTop: "6px solid transparent",
            borderBottom: "6px solid transparent",
          },
          initialY: 0,
          initialX: -10,
        };
      case "right":
        return {
          container: "left-full ml-2 top-1/2 -translate-y-1/2",
          arrow: "right-full top-1/2 -translate-y-1/2 border-r-gray-900",
          arrowStyle: {
            borderRightColor: "#111827",
            borderRightWidth: "6px",
            borderTop: "6px solid transparent",
            borderBottom: "6px solid transparent",
          },
          initialY: 0,
          initialX: 10,
        };
    }
  };

  const positionConfig = getPositionClasses();

  // Animation variants
  const tooltipVariants = {
    initial: {
      opacity: 0,
      scale: 0.95,
      y: positionConfig.initialY || 0,
      x: positionConfig.initialX || 0,
    },
    animate: {
      opacity: 1,
      scale: 1,
      y: 0,
      x: 0,
    },
    exit: {
      opacity: 0,
      scale: 0.95,
    },
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            className={`absolute ${positionConfig.container} z-50`}
            variants={tooltipVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.15 }}
          >
            {/* Tooltip content */}
            <div className="bg-gray-900 text-white text-sm px-3 py-2 rounded-lg shadow-lg max-w-[200px] whitespace-normal">
              {content}
            </div>

            {/* Arrow */}
            <div
              className={`absolute ${positionConfig.arrow} w-0 h-0`}
              style={positionConfig.arrowStyle}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
