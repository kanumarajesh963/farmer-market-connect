import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from './Navbar';
import BottomNav from './BottomNav';
import Box from '@mui/material/Box';

export default function AppLayout() {
  const location = useLocation();
  return (
    <Box sx={{ minHeight: '100dvh', bgcolor: 'background.default' }}>
      <Navbar />
      <Box sx={{ pb: { xs: 8, md: 0 } }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </Box>
      <BottomNav />
    </Box>
  );
}
