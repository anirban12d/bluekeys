import React, { useState, useEffect } from "react";
import { Text } from "ink";
import type { CaretStyle } from "../../engine/types.js";

interface CursorProps {
  blink: boolean;
  style?: CaretStyle;
  caretColor?: string;
}

const CARET_CHARS: Record<Exclude<CaretStyle, "off">, string> = {
  default: "|",
  block: "\u2588",
  outline: "\u25AF",
  underline: "_",
};

export const Cursor: React.FC<CursorProps> = ({
  blink,
  style = "default",
  caretColor = "yellow",
}) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!blink) {
      setVisible(true);
      return;
    }
    const id = setInterval(() => setVisible((v) => !v), 530);
    return () => clearInterval(id);
  }, [blink]);

  if (style === "off") return null;
  if (!visible) return <Text> </Text>;

  const char = CARET_CHARS[style];

  if (style === "block") {
    return <Text color={caretColor} inverse>{" "}</Text>;
  }

  return <Text color={caretColor}>{char}</Text>;
};
