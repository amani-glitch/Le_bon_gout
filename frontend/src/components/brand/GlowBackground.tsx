/** Fixed, low-opacity ambient glows that give the dark theme depth. */
export function GlowBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="absolute -right-40 -top-40 h-[480px] w-[480px] rounded-full opacity-60"
        style={{
          background: "radial-gradient(circle, rgba(240,184,82,0.10), transparent 70%)",
          filter: "blur(40px)",
        }}
      />
      <div
        className="absolute -bottom-48 -left-40 h-[520px] w-[520px] rounded-full opacity-50"
        style={{
          background: "radial-gradient(circle, rgba(30,42,107,0.22), transparent 70%)",
          filter: "blur(50px)",
        }}
      />
    </div>
  );
}
