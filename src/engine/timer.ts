export interface GameTimer {
  start(): void;
  stop(): void;
}

export function createTimer(onTick: () => void): GameTimer {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let expected = 0;

  function schedule() {
    const now = performance.now();
    const delay = Math.max(0, expected - now);
    timeoutId = setTimeout(tick, delay);
  }

  function tick() {
    onTick();
    expected += 1000;
    schedule();
  }

  return {
    start() {
      expected = performance.now() + 1000;
      schedule();
    },
    stop() {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    },
  };
}
