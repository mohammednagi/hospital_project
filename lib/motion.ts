import { Transition } from "motion/react";
import { useEffect, useState } from "react";

/**
 * Shared Apple-grade motion configuration for SmartGov Hospital.
 * Calibrated for physical response, interruptibility, and full accessibility.
 */

// Critically damped spring for standard UI interactions (dialogs, sheets, menus)
export const springDefault: Transition = {
  type: "spring",
  bounce: 0,
  duration: 0.35,
};

// Momentum spring for tactile velocity handoff (bottom sheets, toasts, gestures)
export const springMomentum: Transition = {
  type: "spring",
  bounce: 0.18,
  duration: 0.42,
};

// Fallback linear transition for reduced motion preference (150ms cross-fade)
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

/**
 * Invert directional X coordinates for RTL mirroring
 */
export function getRtlX(offset: number, isRtl: boolean): number {
  return isRtl ? -offset : offset;
}

export const fadeInVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export const modalVariants = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.96 },
};

// Apple Maps-style bottom sheet with draggable feel and snap points
export const sheetVariants = {
  initial: { opacity: 0, y: "100%" },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: "100%" },
};

// Card swipe-to-reveal variants for destructive or quick actions
export const swipeCardVariants = {
  idle: { x: 0 },
  revealed: (isRtl: boolean) => ({ x: isRtl ? 88 : -88 }),
};
