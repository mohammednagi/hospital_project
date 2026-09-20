import { Transition } from "motion/react";
import { useEffect, useState } from "react";

/**
 * Shared motion configuration for SmartGov Hospital.
 * All animations MUST use these presets to allow clean visual redesign passes.
 */

// Critically damped spring for standard UI interactions (dialogs, sheets, menus)
export const springDefault: Transition = {
  type: "spring",
  bounce: 0,
  duration: 0.35,
};

// Momentum spring for playful or expressive highlights (drawers, success toasts)
export const springMomentum: Transition = {
  type: "spring",
  bounce: 0.2,
  duration: 0.4,
};

// Fallback linear transition for reduced motion preference
export const reducedMotionTransition: Transition = {
  duration: 0.15,
  ease: "linear",
};

/**
 * Hook to detect if user has requested reduced motion.
 * When enabled, components swap physical spring animations to a 150ms opacity fade.
 */
export function useReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReduced(mediaQuery.matches);

    const listener = (event: MediaQueryListEvent) => {
      setPrefersReduced(event.matches);
    };

    mediaQuery.addEventListener("change", listener);
    return () => mediaQuery.removeEventListener("change", listener);
  }, []);

  return prefersReduced;
}

/**
 * Helper to retrieve the active transition based on reduced motion setting.
 */
export function getTransition(
  preset: "default" | "momentum" = "default",
  isReduced = false
): Transition {
  if (isReduced) return reducedMotionTransition;
  return preset === "momentum" ? springMomentum : springDefault;
}

export const fadeInVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export const modalVariants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

export const sheetVariants = {
  initial: { opacity: 0, y: "100%" },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: "100%" },
};
