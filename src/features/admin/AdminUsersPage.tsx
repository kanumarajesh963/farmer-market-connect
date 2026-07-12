import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Avatar,
  Stack,
  Chip,
  Button,
  Menu,
  MenuItem,
  Skeleton,
  Alert,
  Grid,
  Card,
  CardContent,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import ShieldIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import { useAllUsers, usePromoteUser } from '../../api/hooks';
import { useAuthStore } from '../../store/authStore';
import { useT } from '../../i18n';
import type { User, UserRole } from '../../types';

const roleColor: Record<UserRole, 'default' | 'primary' | 'secondary' | 'warning'> = {
  farmer: 'primary',
  buyer: 'default',
  mediator: 'secondary',
  admin: 'warning',
};

const allRoles: UserRole[] = ['farmer', 'buyer', 'mediator', 'admin'];

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Paper elevation={0} sx={{ p: 2, borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="h5" sx={{ mt: 0.5 }}>{value}</Typography>
    </Paper>
  );
}

function formatWhen(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function AdminUsersPage() {
  const currentUser = useAuthStore((s) => s.user);
  const { data: users, isLoading } = useAllUsers(true);
  const promote = usePromoteUser();
  const t = useT();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [activeUser, setActiveUser] = useState<User | null>(null);

  const openMenu = (e: React.MouseEvent<Element>, user: User) => {
    setMenuAnchor(e.currentTarget as HTMLElement);
    setActiveUser(user);
  };

  const totalUsers = users?.length ?? 0;
  const everLoggedIn = users?.filter((u) => (u.loginCount ?? 0) > 0).length ?? 0;
  const farmerCount = users?.filter((u) => u.role === 'farmer').length ?? 0;
  const hasLoginData = users?.some((u) => u.loginCount != null || u.lastLoginAt != null) ?? false;

  const RoleMenu = (
    <Menu anchorEl={menuAnchor} open={!!menuAnchor} onClose={() => setMenuAnchor(null)}>
      {allRoles.map((r) => (
        <MenuItem
          key={r}
          disabled={activeUser?.role === r}
          onClick={() => {
            if (activeUser) promote.mutate({ id: activeUser.id, role: r });
            setMenuAnchor(null);
          }}
          sx={{ textTransform: 'capitalize' }}
        >
          {t('admin_make')} {r}
        </MenuItem>
      ))}
    </Menu>
  );

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', p: { xs: 2, sm: 3 } }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 0.5 }}>
        <ShieldIcon color="warning" />
        <Typography variant="h4">{t('admin_title')}</Typography>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {t('admin_subtitle')}
      </Typography>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatCard label={t('total_users')} value={totalUsers} />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatCard label={t('logged_in_users')} value={hasLoginData ? everLoggedIn : '—'} />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatCard label="Farmers" value={farmerCount} />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatCard label="Admins" value={users?.filter((u) => u.role === 'admin').length ?? 0} />
        </Grid>
      </Grid>

      {!hasLoginData && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Per-login analytics ("{t('last_active')}", "{t('login_count')}") will appear here once the backend starts
          returning <code>lastLoginAt</code> / <code>loginCount</code> on each user — the columns are already wired up
          on this page.
        </Alert>
      )}

      <Alert severity="info" sx={{ mb: 3 }}>
        Changes apply instantly: the affected person's app updates in realtime over their open connection.
        To promote someone who signed in as a farmer, find their row below and tap "{t('admin_change_role')}".
      </Alert>

      {isMobile ? (
        <Stack spacing={1.5}>
          {isLoading && Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} variant="rounded" height={92} animation="wave" />)}
          {users?.map((u) => (
            <Card key={u.id} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
              <CardContent sx={{ '&:last-child': { pb: 2 } }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Avatar sx={{ bgcolor: u.avatarColor, width: 36, height: 36, fontSize: 14 }}>{u.name[0]}</Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={700} noWrap>
                      {u.name}
                      {u.id === currentUser?.id && (
                        <Typography component="span" variant="caption" color="text.secondary"> (you)</Typography>
                      )}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">+91 {u.phone} · {u.location || '—'}</Typography>
                  </Box>
                  <Chip size="small" label={u.role} color={roleColor[u.role]} sx={{ textTransform: 'capitalize' }} />
                </Stack>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    {t('last_active')}: {formatWhen(u.lastLoginAt)} · {t('login_count')}: {u.loginCount ?? '—'}
                  </Typography>
                  <Button size="small" onClick={(e) => openMenu(e, u)} disabled={u.id === currentUser?.id}>
                    {t('admin_change_role')}
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          ))}
          {!isLoading && users?.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography color="text.secondary">No users yet.</Typography>
            </Box>
          )}
        </Stack>
      ) : (
        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>{t('last_active')}</TableCell>
                <TableCell>{t('login_count')}</TableCell>
                <TableCell align="right" />
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton animation="wave" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              {users?.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Avatar sx={{ bgcolor: u.avatarColor, width: 32, height: 32, fontSize: 13 }}>{u.name[0]}</Avatar>
                      <Typography variant="body2" fontWeight={600}>
                        {u.name}
                        {u.id === currentUser?.id && (
                          <Typography component="span" variant="caption" color="text.secondary"> (you)</Typography>
                        )}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>+91 {u.phone}</TableCell>
                  <TableCell>{u.location || '—'}</TableCell>
                  <TableCell>
                    <Chip size="small" label={u.role} color={roleColor[u.role]} sx={{ textTransform: 'capitalize' }} />
                  </TableCell>
                  <TableCell>{formatWhen(u.lastLoginAt)}</TableCell>
                  <TableCell>{u.loginCount ?? '—'}</TableCell>
                  <TableCell align="right">
                    <Button size="small" onClick={(e) => openMenu(e, u)} disabled={u.id === currentUser?.id}>
                      {t('admin_change_role')}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {!isLoading && users?.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography color="text.secondary">No users yet.</Typography>
            </Box>
          )}
        </Paper>
      )}

      {RoleMenu}
    </Box>
  );
}
