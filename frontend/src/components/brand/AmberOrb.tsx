import { motion } from "framer-motion";

import { cn } from "@/lib/cn";

/** The signature floating amber glow. */
export function AmberOrb({ className, size = 320 }: { className?: string; size?: number }) {
  return (
    <motion.div
      aria-hidden
      className={cn("pointer-events-none absolute", className)}
      style={{ width: size, height: size }}
      animate={{ y: [0, -12, 0], scale: [1, 1.04, 1] }}
      transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
    >
      <div
        className="h-full w-full rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(240,184,82,0.55), rgba(240,184,82,0) 70%)",
          filter: "blur(40px)",
        }}
      />
    </motion.div>
  );
}
