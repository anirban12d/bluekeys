import { useState, useEffect } from "react";
import { useStdout } from "ink";

export interface TerminalSize {
  columns: number;
  rows: number;
}

export function useTerminalSize(): TerminalSize {
  const { stdout } = useStdout();

  const getSize = (): TerminalSize => ({
    columns: stdout?.columns ?? 80,
    rows: stdout?.rows ?? 24,
  });

  const [size, setSize] = useState<TerminalSize>(getSize);

  useEffect(() => {
    if (!stdout) return;

    const onResize = () => {
      setSize({ columns: stdout.columns ?? 80, rows: stdout.rows ?? 24 });
    };

    stdout.on("resize", onResize);
    return () => {
      stdout.off("resize", onResize);
    };
  }, [stdout]);

  return size;
}
