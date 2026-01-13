"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { transitionPresets } from "../lib/animation";

interface BackButtonProps {
  href?: string;
  label?: string;
}

export default function BackButton({
  href = "/",
  label = "Back to Home",
}: BackButtonProps) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
    >
      {/* Arrow */}
      <motion.span
        className="text-lg"
        whileHover={{ x: -4 }}
        transition={transitionPresets.snappy}
      >
        ←
      </motion.span>

      {/* Text */}
      <span className="hover:underline transition-opacity group-hover:opacity-90">
        {label}
      </span>
    </Link>
  );
}
