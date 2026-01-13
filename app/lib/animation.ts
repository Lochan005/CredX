import { Transition, Variants } from "framer-motion";

// Transition presets
export const transitionPresets: Record<string, Transition> = {
  snappy: { type: "spring", stiffness: 400, damping: 30 },
  smooth: { type: "spring", stiffness: 100, damping: 20 },
  bounce: { type: "spring", stiffness: 300, damping: 10 },
  gentle: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] },
  quick: { duration: 0.2, ease: "easeOut" },
  number: { type: "spring", stiffness: 75, damping: 15 },
};

// Variant presets
export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

export const slideInLeft: Variants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
};

// Stagger container variants
export const staggerContainer: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

// Hover/tap variants
export const cardHover: Variants = {
  whileHover: { scale: 1.02, y: -4 },
  whileTap: { scale: 0.98 },
};

export const buttonTap: Variants = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.97 },
};

// TypeScript types
export type TransitionPreset = keyof typeof transitionPresets;
export type VariantPreset = typeof fadeInUp | typeof fadeIn | typeof scaleIn | typeof slideInLeft;
export type StaggerVariant = typeof staggerContainer | typeof staggerItem;
export type InteractionVariant = typeof cardHover | typeof buttonTap;
