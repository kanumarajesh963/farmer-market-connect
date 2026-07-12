import { Box, Paper, Typography, Stack, Avatar, Chip, Grid, Divider, List, ListItem, ListItemAvatar, ListItemText } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useMyListings } from '../../api/hooks';
import StatusStamp from '../../components/ui/StatusStamp';
import { useT } from '../../i18n';

function formatWhen(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function ProfilePage() {
  const { user, loginHistory } = useAuthStore();
  const navigate = useNavigate();
  const t = useT();
  const isFarmer = user?.role === 'farmer' || user?.role === 'admin';
  const { data: listings, isLoading } = useMyListings(!!user && isFarmer);
  const record = user ? loginHistory[user.id] : undefined;

  if (!user) return null;

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: { xs: 2, sm: 3 } }}>
      <Typography variant="h4" sx={{ mb: 3 }}>{t('profile_title')}</Typography>

      <Paper elevation={0} sx={{ p: 3, borderRadius: 1, border: '1px solid', borderColor: 'divider', mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar sx={{ width: 64, height: 64, bgcolor: user.avatarColor, fontSize: 26 }}>{user.name[0]}</Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h6">{user.name}</Typography>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5, flexWrap: 'wrap' }} gap={0.5}>
              <Chip size="small" label={user.role} sx={{ textTransform: 'capitalize' }} color="primary" />
              <Typography variant="body2" color="text.secondary">+91 {user.phone}</Typography>
              {user.location && <Typography variant="body2" color="text.secondary">· {user.location}</Typography>}
            </Stack>
          </Box>
        </Stack>

        <Divider sx={{ my: 2.5 }} />

        <Grid container spacing={2}>
          <Grid size={{ xs: 6, sm: 4 }}>
            <Typography variant="caption" color="text.secondary">{t('member_since')}</Typography>
            <Typography variant="body2" fontWeight={600}>{formatWhen(record?.firstSeenAt)}</Typography>
          </Grid>
          <Grid size={{ xs: 6, sm: 4 }}>
            <Typography variant="caption" color="text.secondary">{t('last_active')}</Typography>
            <Typography variant="body2" fontWeight={600}>{formatWhen(record?.lastSeenAt)}</Typography>
          </Grid>
          <Grid size={{ xs: 6, sm: 4 }}>
            <Typography variant="caption" color="text.secondary">{t('login_count')} (this device)</Typography>
            <Typography variant="body2" fontWeight={600}>{record?.sessionCount ?? 1}</Typography>
          </Grid>
        </Grid>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
          These sign-in numbers are tracked on this device/browser. Cross-device login history needs the backend to
          record it — see the note on the Admin page.
        </Typography>
      </Paper>

      {isFarmer && (
        <Paper elevation={0} sx={{ p: 3, borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>{t('your_crops')}</Typography>
          {isLoading && <Typography variant="body2" color="text.secondary">Loading…</Typography>}
          <List disablePadding>
            {listings?.map((l) => (
              <ListItem
                key={l.id}
                onClick={() => navigate(`/listing/${l.id}`)}
                sx={{ cursor: 'pointer', borderRadius: 1, '&:hover': { bgcolor: 'action.hover' }, px: 1 }}
              >
                <ListItemAvatar>
                  <Avatar src={l.images[0]} variant="rounded" />
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="body2" fontWeight={700}>{l.cropName}</Typography>
                      <StatusStamp status={l.status} />
                    </Stack>
                  }
                  secondary={
                    <>
                      {l.quantity} {l.unit} · posted {formatWhen(l.postedAt)}
                      {l.sellReason && (
                        <>
                          <br />
                          {t('why_selling')}: {l.sellReason}
                        </>
                      )}
                    </>
                  }
                />
              </ListItem>
            ))}
          </List>
          {!isLoading && listings?.length === 0 && (
            <Typography variant="body2" color="text.secondary">{t('no_crops_posted')}</Typography>
          )}
        </Paper>
      )}
    </Box>
  );
}
