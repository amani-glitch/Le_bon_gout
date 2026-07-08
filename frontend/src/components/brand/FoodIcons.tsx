import type { SVGProps } from "react";

/**
 * Hand-built, theme-agnostic SVG food illustrations used to give the marketing
 * surfaces a warm pizzeria character without shipping any external image
 * assets. Each renders on a 64×64 viewBox and accepts standard SVG props so it
 * can be sized/positioned by the caller.
 */
type IconProps = SVGProps<SVGSVGElement>;

/** A full pizza seen top-down — the hero centerpiece. */
export function WholePizza(props: IconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      {/* crust */}
      <circle cx="32" cy="32" r="30" fill="#E0A23B" />
      <circle cx="32" cy="32" r="30" stroke="#B97B22" strokeWidth="1.5" />
      {/* baked rim highlights */}
      <circle cx="32" cy="32" r="26" fill="#EBB24B" />
      {/* cheese */}
      <circle cx="32" cy="32" r="24" fill="#F6D77E" />
      <circle cx="32" cy="32" r="24" fill="url(#pizzaSheen)" />
      {/* pepperoni */}
      {[
        [22, 20],
        [42, 22],
        [32, 34],
        [20, 40],
        [44, 42],
        [30, 50],
        [50, 32],
      ].map(([cx, cy], i) => (
        <g key={i}>
          <circle cx={cx} cy={cy} r="3.6" fill="#C5402B" />
          <circle cx={cx} cy={cy} r="3.6" fill="#A8331F" opacity="0.35" />
          <circle cx={cx - 1} cy={cy - 1} r="0.9" fill="#E26A4F" />
        </g>
      ))}
      {/* basil */}
      {[
        [38, 38],
        [26, 28],
        [46, 50],
      ].map(([cx, cy], i) => (
        <path
          key={i}
          d={`M${cx} ${cy} q3 -4 6 0 q-3 4 -6 0 z`}
          fill="#3E9D52"
        />
      ))}
      {/* slice lines */}
      <g stroke="#D9A23E" strokeWidth="0.8" opacity="0.5">
        <line x1="32" y1="8" x2="32" y2="56" />
        <line x1="8" y1="32" x2="56" y2="32" />
        <line x1="15" y1="15" x2="49" y2="49" />
        <line x1="49" y1="15" x2="15" y2="49" />
      </g>
      <defs>
        <radialGradient id="pizzaSheen" cx="0.35" cy="0.3" r="0.8">
          <stop offset="0%" stopColor="#FFF0C2" stopOpacity="0.7" />
          <stop offset="60%" stopColor="#F6D77E" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  );
}

/** A single triangular slice. */
export function PizzaSlice(props: IconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M32 6 L56 50 Q32 60 8 50 Z" fill="#F6D77E" />
      <path d="M8 50 Q32 60 56 50 L53 44 Q32 53 11 44 Z" fill="#E0A23B" />
      <path d="M32 6 L56 50 Q32 60 8 50 Z" stroke="#C98A1F" strokeWidth="1.4" />
      <circle cx="32" cy="30" r="3.4" fill="#C5402B" />
      <circle cx="22" cy="42" r="3.2" fill="#C5402B" />
      <circle cx="42" cy="43" r="3.2" fill="#C5402B" />
      <circle cx="31" cy="20" r="2.4" fill="#C5402B" />
      <path d="M38 34 q3 -4 6 0 q-3 4 -6 0 z" fill="#3E9D52" />
      <path d="M20 30 q3 -4 6 0 q-3 4 -6 0 z" fill="#3E9D52" />
    </svg>
  );
}

/** Tomato with a leafy top. */
export function Tomato(props: IconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <circle cx="32" cy="36" r="24" fill="#D8402C" />
      <circle cx="24" cy="28" r="7" fill="#F2705B" opacity="0.7" />
      <path
        d="M32 14 l-6 -6 m6 6 l6 -6 m-6 6 l0 -8 m0 8 q-7 -2 -10 2 q5 4 10 1 q5 3 10 -1 q-3 -4 -10 -2z"
        stroke="#3E9D52"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="#46B05D"
      />
    </svg>
  );
}

/** Basil leaf sprig. */
export function Basil(props: IconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M32 56 Q14 40 20 14 Q44 22 44 44 Q44 52 32 56 Z" fill="#3E9D52" />
      <path d="M32 56 Q14 40 20 14" stroke="#2C7A3D" strokeWidth="2" fill="none" />
      <path d="M26 26 L33 32 M24 36 L31 40 M30 18 L34 24" stroke="#2C7A3D" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

/** A pepperoni round. */
export function Pepperoni(props: IconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <circle cx="32" cy="32" r="26" fill="#C5402B" />
      <circle cx="32" cy="32" r="26" stroke="#9E2E1D" strokeWidth="2" />
      {[
        [22, 24],
        [42, 26],
        [28, 40],
        [44, 42],
        [32, 30],
      ].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="3" fill="#E27A63" opacity="0.8" />
      ))}
    </svg>
  );
}

/** A cheese wedge with holes. */
export function Cheese(props: IconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M6 44 L52 20 Q58 26 58 44 Z" fill="#F4C752" />
      <path d="M6 44 L52 20 Q58 26 58 44 Z" stroke="#D6A52F" strokeWidth="1.6" />
      <path d="M6 44 L52 20 L52 28 Q30 34 6 44 Z" fill="#FBDD86" />
      <circle cx="24" cy="40" r="3" fill="#E6B63E" />
      <circle cx="40" cy="36" r="2.4" fill="#E6B63E" />
      <circle cx="48" cy="40" r="2" fill="#E6B63E" />
    </svg>
  );
}

/** A chili pepper for a spicy accent. */
export function Chili(props: IconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M16 14 q8 2 8 10 q14 2 20 18 q4 12 -8 18 q-10 4 -16 -6 q10 4 14 -4 q4 -10 -6 -18 q-10 -8 -12 -18z"
        fill="#D8402C"
      />
      <path d="M16 14 q-2 -6 4 -8 q6 2 4 8 q-4 -2 -8 0z" fill="#3E9D52" />
    </svg>
  );
}
