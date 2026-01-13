"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";

interface ComparisonTableProps {
  data: Array<{
    label: string;
    before: string | number;
    after: string | number;
    highlight?: boolean;
  }>;
  beforeLabel?: string;
  afterLabel?: string;
  className?: string;
}

const rowVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
};

const containerVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

export default function ComparisonTable({
  data,
  beforeLabel = "Without Prepayment",
  afterLabel = "With Prepayment",
  className = "",
}: ComparisonTableProps) {
  const [highlightedRows, setHighlightedRows] = useState<Set<number>>(new Set());

  // Trigger pulse animation for highlighted rows after they appear
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    
    data.forEach((row, index) => {
      if (row.highlight) {
        const timer = setTimeout(() => {
          setHighlightedRows((prev) => new Set(prev).add(index));
          // Remove highlight after animation
          setTimeout(() => {
            setHighlightedRows((prev) => {
              const newSet = new Set(prev);
              newSet.delete(index);
              return newSet;
            });
          }, 600);
        }, 500 + index * 100); // After row appears + stagger
        timers.push(timer);
      }
    });

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [data]);

  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      className={`bg-gray-800 rounded-xl overflow-hidden ${className}`}
    >
      <table className="w-full">
        {/* Header */}
        <thead>
          <motion.tr
            variants={rowVariants}
            className="bg-gray-700/50 border-b border-gray-700"
          >
            <th className="py-4 px-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Metric
            </th>
            <th className="py-4 px-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {beforeLabel}
            </th>
            <th className="py-4 px-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {afterLabel}
            </th>
          </motion.tr>
        </thead>

        {/* Body */}
        <tbody>
          {data.map((row, index) => (
            <motion.tr
              key={index}
              variants={rowVariants}
              className={`border-b border-gray-700 ${
                row.highlight ? "bg-gray-700/30" : ""
              }`}
              animate={
                highlightedRows.has(index)
                  ? {
                      backgroundColor: [
                        "rgba(55, 65, 81, 0.3)",
                        "rgba(34, 197, 94, 0.2)",
                        "rgba(55, 65, 81, 0.3)",
                      ],
                      transition: {
                        duration: 0.6,
                        times: [0, 0.5, 1],
                      },
                    }
                  : {}
              }
            >
              <td className="py-4 px-4 text-gray-300 font-medium">
                {row.label}
              </td>
              <td className="py-4 px-4 text-gray-300">
                {typeof row.before === "number"
                  ? `₹${row.before.toLocaleString("en-IN")}`
                  : row.before}
              </td>
              <td className="py-4 px-4 text-green-500 font-semibold">
                {typeof row.after === "number"
                  ? `₹${row.after.toLocaleString("en-IN")}`
                  : row.after}
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </motion.div>
  );
}
