import { useEffect, useRef } from 'react';
import { animate, motion, useMotionValue, useTransform } from 'framer-motion';
import Box from '@mui/material/Box';

export default function PriceTicker({ value, unit }: { value: number; unit: string }) {
  const motionVal = useMotionValue(0);
  const rounded = useTransform(motionVal, (v) => Math.round(v));
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const controls = animate(motionVal, value, { duration: 0.9, ease: 'easeOut' });
    return () => controls.stop();
  }, [value, motionVal]);

  useEffect(() => {
    return rounded.on('change', (v) => {
      if (ref.current) ref.current.textContent = `₹${v}`;
    });
  }, [rounded]);

  return (
    <Box
      component={motion.span}
      sx={{
        fontFamily: '"JetBrains Mono", monospace',
        fontWeight: 700,
        fontSize: 20,
        color: 'primary.main',
      }}
    >
      <span ref={ref}>₹0</span>
      <Box component="span" sx={{ fontSize: 12, fontWeight: 500, color: 'text.secondary', ml: 0.5 }}>
        /{unit}
      </Box>
    </Box>
  );
}
