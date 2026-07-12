import { Paper, BottomNavigation, BottomNavigationAction } from '@mui/material';
import StoreIcon from '@mui/icons-material/StorefrontOutlined';
import DashboardIcon from '@mui/icons-material/SpaceDashboardOutlined';
import AddCircleIcon from '@mui/icons-material/AddCircleOutline';
import ScienceIcon from '@mui/icons-material/ScienceOutlined';
import ShieldIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useT } from '../../i18n';

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const t = useT();

  const items = [
    { to: '/marketplace', label: t('nav_marketplace'), icon: <StoreIcon /> },
    ...(user?.role === 'farmer' || user?.role === 'admin'
      ? [
          { to: '/dashboard', label: t('nav_dashboard'), icon: <DashboardIcon /> },
          { to: '/post-crop', label: t('nav_post_crop'), icon: <AddCircleIcon /> },
        ]
      : []),
    { to: '/pesticides', label: t('nav_pesticides'), icon: <ScienceIcon /> },
    ...(user?.role === 'admin' ? [{ to: '/admin', label: t('nav_admin'), icon: <ShieldIcon /> }] : []),
  ];

  const activeIndex = Math.max(
    0,
    items.findIndex((i) => location.pathname.startsWith(i.to))
  );

  return (
    <Paper
      elevation={0}
      sx={{
        display: { xs: 'block', md: 'none' },
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1200,
        borderTop: '1px solid',
        borderColor: 'divider',
        pb: 'env(safe-area-inset-bottom)',
      }}
    >
      <BottomNavigation
        showLabels
        value={activeIndex}
        onChange={(_, idx) => navigate(items[idx].to)}
        sx={{ height: 62 }}
      >
        {items.map((item) => (
          <BottomNavigationAction key={item.to} label={item.label} icon={item.icon} sx={{ minWidth: 0, fontSize: 10 }} />
        ))}
      </BottomNavigation>
    </Paper>
  );
}
