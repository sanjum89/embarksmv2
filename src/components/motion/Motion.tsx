import { ReactNode, useEffect, useState, Children, isValidElement, cloneElement } from "react";
import { motion, AnimatePresence, useReducedMotion as useFramerReducedMotion } from "framer-motion";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { cn } from "@/lib/utils";

/**
 * Canonical motion primitives. All page entrance / list stagger animations
 * should go through these so timing stays consistent across the product.
 */

export const MOTION = {
  DURATION: 0.35,
  PAGE_DURATION: 0.3,
  STAGGER: 0.06,
  RISE: 12,
  PAGE_RISE: 8,
  EASE: [0.22, 1, 0.36, 1] as [number, number, number, number],
};

/** Returns true if animations should be suppressed (a11y toggle OR OS pref). */
export function useReducedMotion(): boolean {
  const osPref = useFramerReducedMotion();
  const { reduceMotion } = useAccessibility();
  return Boolean(reduceMotion || osPref);
}

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
  /** Optional key to force re-mount (e.g., pathname). */
  transitionKey?: string;
}

export function PageTransition({ children, className, transitionKey }: PageTransitionProps) {
  const reduce = useReducedMotion();
  if (reduce) {
    return <div className={cn("h-full", className)}>{children}</div>;
  }
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={transitionKey}
        initial={{ opacity: 0, y: MOTION.PAGE_RISE }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -MOTION.PAGE_RISE / 2 }}
        transition={{ duration: MOTION.PAGE_DURATION, ease: MOTION.EASE }}
        className={cn("h-full", className)}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

interface SectionRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function SectionReveal({ children, className, delay = 0 }: SectionRevealProps) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      initial={{ opacity: 0, y: MOTION.PAGE_RISE }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: MOTION.PAGE_DURATION, ease: MOTION.EASE, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface StaggerListProps {
  children: ReactNode;
  className?: string;
  as?: "div" | "ul" | "ol";
}

export function StaggerList({ children, className, as = "div" }: StaggerListProps) {
  const reduce = useReducedMotion();
  const Tag = as as any;
  if (reduce) return <Tag className={className}>{children}</Tag>;

  // Auto-index children so consumers don't have to pass `index` on each item.
  let i = 0;
  const enhanced = Children.map(children, (child) => {
    if (isValidElement(child) && (child.type as any) === StaggerItem) {
      const props = child.props as { index?: number };
      const withIndex = cloneElement(child, { index: props.index ?? i });
      i += 1;
      return withIndex;
    }
    return child;
  });

  return (
    <AnimatePresence initial>
      <Tag className={className}>{enhanced}</Tag>
    </AnimatePresence>
  );
}

interface StaggerItemProps {
  children: ReactNode;
  className?: string;
  index?: number;
  /** Set true for grid items so motion.div doesn't break grid auto-rows. */
  inline?: boolean;
}

export function StaggerItem({ children, className, index = 0, inline = false }: StaggerItemProps) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  const Comp: any = inline ? motion.span : motion.div;
  return (
    <Comp
      initial={{ opacity: 0, y: MOTION.RISE }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{
        delay: index * MOTION.STAGGER,
        duration: MOTION.DURATION,
        ease: MOTION.EASE,
      }}
      className={className}
    >
      {children}
    </Comp>
  );
}
