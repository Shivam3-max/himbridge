/** Himbridge mark: two pillars, the saffron peak and the bridge arch. */
export function LogoMark({ className = 'brand-mark', size }: { className?: string; size?: number }) {
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true" width={size} height={size}>
      <rect width="64" height="64" rx="14" fill="#0b2a5b" />
      <path d="M13 13.5 Q13 12 14.5 12 H20.5 Q22 12 22 13.5 V52 H13 Z" fill="#fff" />
      <path d="M42 13.5 Q42 12 43.5 12 H49.5 Q51 12 51 13.5 V52 H42 Z" fill="#fff" />
      <path d="M22 35 L32 16 L42 35 Z" fill="#f08a00" />
      <path d="M32 16 L27.3 24.9 L29.8 23.4 L32 25.4 L34.3 23.4 L36.7 24.9 Z" fill="#fff" />
      <rect x="13" y="35" width="38" height="5.5" fill="#fff" />
      <path d="M22 52 Q32 42.5 42 52" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}
