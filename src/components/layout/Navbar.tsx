import { useState } from 'react';
import { AppBar, Toolbar, Typography, Stack, IconButton, Avatar, Chip, Box, Menu, MenuItem, Divider, ListItemIcon } from '@mui/material';
import DarkModeIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeIcon from '@mui/icons-material/LightModeOutlined';
import SproutIcon from '@mui/icons-material/Grass';
import PersonIcon from '@mui/icons-material/PersonOutline';
import LogoutIcon from '@mui/icons-material/LogoutOutlined';
import TranslateIcon from '@mui/icons-material/TranslateOutlined';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUiStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { useT, useLangStore, languageNames, supportedLanguages } from '../../i18n';
import type { UserRole } from '../../types';

const navLinks: { to: string; labelKey: 'nav_marketplace' | 'nav_dashboard' | 'nav_post_crop' | 'nav_pesticides' | 'nav_admin'; roles?: UserRole[] }[] = [
  { to: '/marketplace', labelKey: 'nav_marketplace' },
  { to: '/dashboard', labelKey: 'nav_dashboard', roles: ['farmer', 'admin'] },
  { to: '/post-crop', labelKey: 'nav_post_crop', roles: ['farmer', 'admin'] },
  { to: '/pesticides', labelKey: 'nav_pesticides' },
  { to: '/admin', labelKey: 'nav_admin', roles: ['admin'] },
];

export default function Navbar() {
  const { mode, toggleMode } = useUiStore();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const t = useT();
  const lang = useLangStore((s) => s.lang);
  const setLang = useLangStore((s) => s.setLang);

  const [profileAnchor, setProfileAnchor] = useState<null | HTMLElement>(null);
  const [langAnchor, setLangAnchor] = useState<null | HTMLElement>(null);

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
          <Typography variant="subtitle1" fontWeight={700} sx={{ fontFamily: '"Fraunces", serif', display: { xs: 'none', sm: 'block' } }}>
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
                borderRadius: 1,
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 600,
                whiteSpace: 'nowrap',
                color: location.pathname === link.to ? 'primary.main' : 'text.secondary',
                bgcolor: location.pathname === link.to ? 'action.selected' : 'transparent',
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              {t(link.labelKey)}
            </Box>
          ))}
        </Stack>

        <Stack direction="row" spacing={0.5} alignItems="center">
          {user && <Chip size="small" label={user.role} sx={{ textTransform: 'capitalize', display: { xs: 'none', sm: 'flex' } }} />}

          <IconButton onClick={(e) => setLangAnchor(e.currentTarget)} size="small" aria-label={t('nav_language')}>
            <TranslateIcon fontSize="small" />
          </IconButton>
          <Menu anchorEl={langAnchor} open={!!langAnchor} onClose={() => setLangAnchor(null)}>
            {supportedLanguages.map((code) => (
              <MenuItem
                key={code}
                selected={code === lang}
                onClick={() => {
                  setLang(code);
                  setLangAnchor(null);
                }}
              >
                {languageNames[code]}
              </MenuItem>
            ))}
          </Menu>

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
            <>
              <Avatar
                sx={{ width: 32, height: 32, bgcolor: user.avatarColor, fontSize: 14, cursor: 'pointer' }}
                onClick={(e) => setProfileAnchor(e.currentTarget)}
              >
                {user.name[0]}
              </Avatar>
              <Menu anchorEl={profileAnchor} open={!!profileAnchor} onClose={() => setProfileAnchor(null)}>
                <Box sx={{ px: 2, py: 1, minWidth: 180 }}>
                  <Typography variant="body2" fontWeight={700} noWrap>{user.name}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>{user.role}</Typography>
                </Box>
                <Divider />
                <MenuItem
                  onClick={() => {
                    setProfileAnchor(null);
                    navigate('/profile');
                  }}
                >
                  <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
                  {t('nav_view_profile')}
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    setProfileAnchor(null);
                    logout();
                    navigate('/login');
                  }}
                >
                  <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
                  {t('nav_logout')}
                </MenuItem>
              </Menu>
            </>
          )}
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
