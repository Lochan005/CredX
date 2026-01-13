"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { transitionPresets } from "@/app/lib/animation";

interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  href?: string;
  delay?: number;
  disableHover?: boolean;
}

export default function AnimatedCard({
  children,
  className = "",
  onClick,
  href,
  delay = 0,
  disableHover = false,
}: AnimatedCardProps) {
  const cardContent = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={disableHover ? undefined : { scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{
        ...transitionPresets.snappy,
        delay: delay,
      }}
      onClick={onClick}
      className={`rounded-xl p-6 bg-gray-800 ${
        !disableHover ? "hover:shadow-[0_0_20px_rgba(34,197,94,0.3)]" : ""
      } transition-[box-shadow] duration-200 ease-in-out ${className}`}
    >
      {children}
    </motion.div>
  );

  if (href) {
    return <Link href={href}>{cardContent}</Link>;
  }

  return cardContent;
}
