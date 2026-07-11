import { motion } from 'framer-motion';
import { useTheme } from '@mui/material/styles';
import type { ListingStatus } from '../../types';

const config: Record<ListingStatus, { label: string; color: string; rotate: number }> = {
  available: { label: 'AVAILABLE', color: '#2E5E3E', rotate: -6 },
  reserved: { label: 'RESERVED', color: '#C4871F', rotate: -4 },
  sold: { label: 'SOLD', color: '#C1442E', rotate: -8 },
};

export default function StatusStamp({ status }: { status: ListingStatus }) {
  const theme = useTheme();
  const c = config[status];
  const inkColor = theme.palette.mode === 'dark' ? c.color : c.color;

  return (
    <motion.div
      initial={{ scale: 1.6, opacity: 0, rotate: c.rotate }}
      animate={{ scale: 1, opacity: 1, rotate: c.rotate }}
      transition={{ type: 'spring', stiffness: 260, damping: 14 }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4px 12px',
        border: `2px solid ${inkColor}`,
        borderRadius: 6,
        color: inkColor,
        fontFamily: '"JetBrains Mono", monospace',
        fontWeight: 700,
        fontSize: 11,
        letterSpacing: '0.14em',
        transform: `rotate(${c.rotate}deg)`,
        background:
          theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.6)',
        boxShadow: `0 0 0 1px ${inkColor}22 inset`,
        userSelect: 'none',
        whiteSpace: 'nowrap',
      }}
    >
      {c.label}
    </motion.div>
  );
}
