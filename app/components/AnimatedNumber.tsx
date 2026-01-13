"use client";

import { motion, useSpring, useTransform } from "framer-motion";
import { useEffect, useState } from "react";

interface AnimatedNumberProps {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
}

function formatIndianNumber(num: number): string {
  const rounded = Math.round(num);
  
  // Handle negative numbers
  const isNegative = rounded < 0;
  const absNum = Math.abs(rounded);
  const numStr = absNum.toString();
  
  // Apply Indian numbering system: XX,XX,XXX
  // Last 3 digits, then groups of 2
  if (numStr.length > 3) {
    const lastThree = numStr.slice(-3);
    const remaining = numStr.slice(0, -3);
    const formattedRemaining = remaining.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
    return (isNegative ? "-" : "") + formattedRemaining + "," + lastThree;
  }
  
  return (isNegative ? "-" : "") + numStr;
}

export default function AnimatedNumber({
  value,
  prefix = "₹",
  suffix,
  duration = 1.5,
  className = "text-3xl font-bold",
}: AnimatedNumberProps) {
  const spring = useSpring(0, {
    stiffness: 75,
    damping: 15,
    mass: 0.8,
  });

  const formattedValue = useTransform(spring, (latest) => {
    return formatIndianNumber(latest);
  });

  const [displayValue, setDisplayValue] = useState(() => formatIndianNumber(0));

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  useEffect(() => {
    const unsubscribe = formattedValue.on("change", (latest) => {
      setDisplayValue(latest);
    });
    // Set initial value
    setDisplayValue(formatIndianNumber(spring.get()));
    return unsubscribe;
  }, [formattedValue, spring]);

  return (
    <span className={`tabular-nums ${className}`}>
      {prefix}
      {displayValue}
      {suffix && <span>{suffix}</span>}
    </span>
  );
}
