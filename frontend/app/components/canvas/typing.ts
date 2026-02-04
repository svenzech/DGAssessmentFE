export type TypewriterOptions = {
  speedMs?: number;
  enabled?: boolean;
};

export function typewriter(
  fullText: string,
  onTick: (val: string) => void,
  options: TypewriterOptions = {},
) {
  const speed = Math.max(10, options.speedMs ?? 18);
  const enabled = options.enabled !== false;

  if (!enabled) {
    onTick(fullText);
    return () => {};
  }

  let idx = 0;
  let cancelled = false;

  const timer = setInterval(() => {
    if (cancelled) return;
    idx += 1;
    const next = fullText.slice(0, idx);
    onTick(next);
    if (idx >= fullText.length) {
      clearInterval(timer);
    }
  }, speed);

  return () => {
    cancelled = true;
    clearInterval(timer);
  };
}
