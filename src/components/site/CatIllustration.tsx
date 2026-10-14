/** Line-drawn placeholder shown when a cat has no photos yet. */
export function CatIllustration({ seed, className = "" }: { seed: string; className?: string }) {
  const variant = [...seed].reduce((n, ch) => n + ch.charCodeAt(0), 0) % 3;
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.4,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      {variant === 0 && (
        <g {...common}>
          {/* sitting */}
          <path d="M23 31 L21.5 19 L27.5 24.5 Q32 23 36.5 24.5 L42.5 19 L41 31" />
          <path d="M23 31 Q17 44 21 54 L43 54 Q47 44 41 31" />
          <path d="M43 53 Q52 52 50 41" />
          <path d="M27.5 31 q1.2 1 2.4 0 M34 31 q1.2 1 2.4 0" />
          <path d="M31 35 l1 0.8 l1 -0.8" />
          <path d="M29 54 L29 49 M35 54 L35 49" />
        </g>
      )}
      {variant === 1 && (
        <g {...common}>
          {/* lying down */}
          <path d="M10 47 Q9 39 20 38 L39 38" />
          <path d="M10 47 L52 47 Q54 41 52 37" />
          <path d="M39 38 L39.5 30 L43.5 33.5 Q46 32.8 48.5 33.5 L52.5 30 L53 37" />
          <path d="M42.5 38.5 q1 0.8 2 0 M48 38.5 q1 0.8 2 0" />
          <path d="M10 44 Q5 44 6 40" />
        </g>
      )}
      {variant === 2 && (
        <g {...common}>
          {/* face */}
          <circle cx="32" cy="35" r="14" />
          <path d="M20.5 27 L20 16 L28 22" />
          <path d="M43.5 27 L44 16 L36 22" />
          <path d="M26 33 q1.5 1.2 3 0 M35 33 q1.5 1.2 3 0" />
          <path d="M31 38 l1 0.8 l1 -0.8" />
          <path d="M15 37 L24 38 M15 41 L24 40 M49 37 L40 38 M49 41 L40 40" />
        </g>
      )}
    </svg>
  );
}
