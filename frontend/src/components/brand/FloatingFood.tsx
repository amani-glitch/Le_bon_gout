import { motion, useReducedMotion } from "framer-motion";
import type { ComponentType, SVGProps } from "react";

import { Basil, Cheese, Chili, Pepperoni, PizzaSlice, Tomato } from "./FoodIcons";

type Floatie = {
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  className: string;
  size: number;
  /** vertical drift in px */
  drift: number;
  /** seconds for one float cycle */
  duration: number;
  /** gentle rotation amplitude in degrees */
  spin: number;
  delay: number;
};

const FLOATIES: Floatie[] = [
  { Icon: PizzaSlice, className: "left-2 top-4 md:-left-6", size: 46, drift: 16, duration: 7, spin: 8, delay: 0 },
  { Icon: Tomato, className: "right-6 top-2 md:right-2", size: 38, drift: 14, duration: 6.2, spin: 10, delay: 0.6 },
  { Icon: Basil, className: "right-4 bottom-10 md:-right-4", size: 40, drift: 18, duration: 8, spin: 12, delay: 1.1 },
  { Icon: Pepperoni, className: "left-6 bottom-6 md:left-0", size: 30, drift: 12, duration: 6.8, spin: 14, delay: 0.3 },
  { Icon: Cheese, className: "left-1/2 -top-2", size: 34, drift: 13, duration: 7.6, spin: 9, delay: 1.4 },
  { Icon: Chili, className: "right-1/3 bottom-0", size: 28, drift: 11, duration: 6.5, spin: 16, delay: 0.9 },
];

/**
 * Ambient food garnish that drifts around a focal element (e.g. the Botler
 * mascot). Decorative only; hidden from assistive tech and stilled when the
 * user prefers reduced motion.
 */
export function FloatingFood({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  return (
    <div aria-hidden className={"pointer-events-none absolute inset-0 " + (className ?? "")}>
      {FLOATIES.map(({ Icon, className: pos, size, drift, duration, spin, delay }, i) => (
        <motion.div
          key={i}
          className={"absolute drop-shadow-[0_8px_20px_rgba(0,0,0,0.35)] " + pos}
          style={{ width: size, height: size }}
          animate={
            reduce
              ? undefined
              : { y: [0, -drift, 0], rotate: [-spin, spin, -spin] }
          }
          transition={{ duration, repeat: Infinity, ease: "easeInOut", delay }}
        >
          <Icon width={size} height={size} />
        </motion.div>
      ))}
    </div>
  );
}
