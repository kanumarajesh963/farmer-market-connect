import { AppBar, Toolbar, Typography, Stack, IconButton, Avatar, Chip, Box } from '@mui/material';
import DarkModeIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeIcon from '@mui/icons-material/LightModeOutlined';
import SproutIcon from '@mui/icons-material/Grass';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUiStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import type { UserRole } from '../../types';

const navLinks: { to: string; label: string; roles?: UserRole[] }[] = [
  { to: '/marketplace', label: 'Marketplace' },
  { to: '/dashboard', label: 'Dashboard', roles: ['farmer', 'admin'] },
  { to: '/post-crop', label: 'Post crop', roles: ['farmer', 'admin'] },
  { to: '/pesticides', label: 'Pesticide prices' },
  { to: '/admin', label: 'Admin', roles: ['admin'] },
];

export default function Navbar() {
  const { mode, toggleMode } = useUiStore();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const visibleLinks = navLinks.filter((link) => !link.roles || (user && link.roles.includes(user.role)));

  return (
    <AppBar
      position="sticky"
      elevation={0}
      color="transparent"
      sx={{ backdropFilter: 'blur(10px)', borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}
    >
      <Toolbar sx={{ maxWidth: 1200, width: '100%', mx: 'auto' }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ flexGrow: 1, cursor: 'pointer' }} onClick={() => navigate('/marketplace')}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
            <SproutIcon sx={{ fontSize: 18 }} />
          </Avatar>
          <Typography variant="subtitle1" fontWeight={700} sx={{ fontFamily: '"Fraunces", serif' }}>
            Farmer Market Connect
          </Typography>
        </Stack>

        <Stack direction="row" spacing={0.5} sx={{ mr: 2, display: { xs: 'none', md: 'flex' } }}>
          {visibleLinks.map((link) => (
            <Box
              key={link.to}
              onClick={() => navigate(link.to)}
              sx={{
                px: 1.5,
                py: 0.8,
                borderRadius: 2,
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 600,
                whiteSpace: 'nowrap',
                color: location.pathname === link.to ? 'primary.main' : 'text.secondary',
                bgcolor: location.pathname === link.to ? 'action.selected' : 'transparent',
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              {link.label}
            </Box>
          ))}
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center">
          {user && <Chip size="small" label={user.role} sx={{ textTransform: 'capitalize' }} />}
          <IconButton onClick={toggleMode} size="small">
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={mode}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{ display: 'flex' }}
              >
                {mode === 'light' ? <DarkModeIcon fontSize="small" /> : <LightModeIcon fontSize="small" />}
              </motion.span>
            </AnimatePresence>
          </IconButton>
          {user && (
            <Avatar
              sx={{ width: 32, height: 32, bgcolor: user.avatarColor, fontSize: 14, cursor: 'pointer' }}
              onClick={() => {
                logout();
                navigate('/login');
              }}
              title="Sign out"
            >
              {user.name[0]}
            </Avatar>
          )}
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
