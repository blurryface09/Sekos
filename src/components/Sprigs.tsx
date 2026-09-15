/**
 * Two line drawn stems anchored in opposite corners. Decorative only, so they
 * are hidden from screen readers and never intercept a click.
 */
export function Sprigs() {
  return (
    <>
      <svg
        className="sprig top-left"
        viewBox="0 0 200 260"
        fill="none"
        aria-hidden="true"
        focusable="false"
      >
        <g stroke="currentColor" strokeWidth="1.1" strokeLinecap="round">
          <path d="M34 -10 C 46 60, 62 120, 96 182 C 112 212, 130 238, 152 256" />
          <path d="M58 52 C 36 44, 22 28, 18 8" />
          <path d="M58 52 C 74 40, 82 22, 84 2" />
          <path d="M76 100 C 54 96, 40 82, 34 62" />
          <path d="M76 100 C 94 90, 104 72, 106 52" />
          <path d="M100 152 C 78 150, 62 138, 54 118" />
          <path d="M100 152 C 120 144, 132 126, 134 106" />
        </g>
        <g fill="currentColor" opacity="0.5">
          <ellipse cx="18" cy="8" rx="7" ry="11" transform="rotate(-28 18 8)" />
          <ellipse cx="84" cy="2" rx="7" ry="11" transform="rotate(22 84 2)" />
          <ellipse cx="34" cy="62" rx="6.5" ry="10" transform="rotate(-32 34 62)" />
          <ellipse cx="106" cy="52" rx="6.5" ry="10" transform="rotate(26 106 52)" />
          <ellipse cx="54" cy="118" rx="6" ry="9" transform="rotate(-30 54 118)" />
          <ellipse cx="134" cy="106" rx="6" ry="9" transform="rotate(28 134 106)" />
        </g>
      </svg>

      <svg
        className="sprig bottom-right"
        viewBox="0 0 220 280"
        fill="none"
        aria-hidden="true"
        focusable="false"
      >
        <g stroke="currentColor" strokeWidth="1.1" strokeLinecap="round">
          <path d="M196 290 C 180 220, 158 160, 118 104 C 96 72, 70 44, 42 24" />
          <path d="M166 214 C 188 212, 204 200, 212 180" />
          <path d="M166 214 C 150 198, 142 178, 142 156" />
          <path d="M136 150 C 158 146, 174 132, 180 112" />
          <path d="M136 150 C 118 136, 108 116, 106 94" />
          <path d="M96 84 C 116 78, 130 62, 134 42" />
        </g>
        {/* Five petals around a centre, the one bloom in the whole drawing. */}
        <g transform="translate(42 24)">
          <g stroke="currentColor" strokeWidth="1.1" fill="none">
            <ellipse cx="0" cy="-13" rx="8" ry="13" />
            <ellipse cx="12" cy="-4" rx="8" ry="13" transform="rotate(72 12 -4)" />
            <ellipse cx="8" cy="11" rx="8" ry="13" transform="rotate(144 8 11)" />
            <ellipse cx="-8" cy="11" rx="8" ry="13" transform="rotate(216 -8 11)" />
            <ellipse cx="-12" cy="-4" rx="8" ry="13" transform="rotate(288 -12 -4)" />
          </g>
          <circle cx="0" cy="0" r="4" fill="currentColor" opacity="0.6" />
        </g>
        <g fill="currentColor" opacity="0.5">
          <ellipse cx="212" cy="180" rx="7" ry="11" transform="rotate(34 212 180)" />
          <ellipse cx="142" cy="156" rx="6.5" ry="10" transform="rotate(-24 142 156)" />
          <ellipse cx="180" cy="112" rx="6.5" ry="10" transform="rotate(30 180 112)" />
          <ellipse cx="106" cy="94" rx="6" ry="9" transform="rotate(-26 106 94)" />
          <ellipse cx="134" cy="42" rx="6" ry="9" transform="rotate(28 134 42)" />
        </g>
      </svg>
    </>
  );
}
