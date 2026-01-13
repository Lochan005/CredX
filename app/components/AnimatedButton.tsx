"use client";

import { motion, AnimatePresence } from "framer-motion";
import { transitionPresets } from "@/app/lib/animation";

interface AnimatedButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "outline";
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
  icon?: React.ReactNode;
  type?: "button" | "submit";
}

export default function AnimatedButton({
  children,
  onClick,
  variant = "primary",
  isLoading = false,
  disabled = false,
  className = "",
  icon,
  type = "button",
}: AnimatedButtonProps) {
  const isInteractive = !disabled && !isLoading;

  const variantStyles = {
    primary: "bg-green-600 hover:bg-green-500 text-white",
    secondary: "bg-gray-700 hover:bg-gray-600 text-white",
    outline:
      "border-2 border-green-600 bg-transparent text-green-600 hover:bg-green-600/10",
  };

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      whileHover={isInteractive ? { scale: 1.02, filter: "brightness(1.1)" } : undefined}
      whileTap={isInteractive ? { scale: 0.97 } : undefined}
      transition={transitionPresets.quick}
      className={`
        px-6 py-3 rounded-lg font-semibold
        w-full sm:w-auto
        transition-all duration-200 ease-in-out
        flex items-center justify-center gap-2
        ${variantStyles[variant]}
        ${disabled || isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        ${className}
      `}
    >
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2"
          >
            <motion.div
              className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
            />
            <span>Loading...</span>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2"
          >
            {icon && <span>{icon}</span>}
            <span>{children}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
