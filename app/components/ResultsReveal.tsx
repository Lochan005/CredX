"use client";

import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "../lib/animation";
import { ReactNode, Children } from "react";

interface ResultsRevealProps {
  children: ReactNode;
  className?: string;
}

export default function ResultsReveal({
  children,
  className = "",
}: ResultsRevealProps) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className={className}
    >
      {Children.map(children, (child, index) => (
        <motion.div key={index} variants={staggerItem}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}
