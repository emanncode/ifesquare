import { useEffect, useState } from "react";
import { useSpring } from "framer-motion";

export function AnimatedNumber({ value, format }: { value: number; format: (n: number) => string }) {
  const spring = useSpring(0, { stiffness: 90, damping: 20, mass: 1 });
  const [display, setDisplay] = useState(() => format(0));

  useEffect(() => { spring.set(value); }, [value, spring]);
  useEffect(() => spring.on("change", (v) => setDisplay(format(v))), [spring, format]);

  return <span>{display}</span>;
}
