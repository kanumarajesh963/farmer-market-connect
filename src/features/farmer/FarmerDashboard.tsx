import { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Stack,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Avatar,
  Menu,
  MenuItem,
  Button,
  Skeleton,
  Chip,
  Card,
  CardContent,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AddIcon from '@mui/icons-material/Add';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useMyListings, useUpdateListingStatus, qk } from '../../api/hooks';
import StatusStamp from '../../components/ui/StatusStamp';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { getSocket } from '../../lib/socket';
import { useT } from '../../i18n';
import type { CropListing, ListingStatus, BuyerInterest } from '../../types';

const statOptions: ListingStatus[] = ['available', 'reserved', 'sold'];

function StatCard({ label, value, delay }: { label: string; value: string | number; delay: number }) {
  return (
    <Paper
      component={motion.div}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      elevation={0}
      sx={{ p: 2.5, borderRadius: 1, border: '1px solid', borderColor: 'divider' }}
    >
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h4" sx={{ mt: 0.5 }}>
        {value}
      </Typography>
    </Paper>
  );
}

export default function FarmerDashboard() {
  const { user, token } = useAuthStore();
  const { data: listings, isLoading } = useMyListings(!!user);
  const updateStatus = useUpdateListingStatus();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const t = useT();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [activeListing, setActiveListing] = useState<CropListing | null>(null);

  // Realtime: get notified the instant a buyer expresses interest in one of
  // this farmer's crops, without refreshing the page.
  useEffect(() => {
    if (!user) return;
    const socket = getSocket(token);
    const onInterest = (interest: BuyerInterest) => {
      toast.info(`${interest.buyerName} is interested: “${interest.message.slice(0, 60)}”`);
      qc.invalidateQueries({ queryKey: qk.myListings });
    };
    socket.on('interest:new', onInterest);
    return () => {
      socket.off('interest:new', onInterest);
    };
  }, [user, token, qc]);

  const openMenu = (e: React.MouseEvent<Element>, listing: CropListing) => {
    setMenuAnchor(e.currentTarget as HTMLElement);
    setActiveListing(listing);
  };

  const totalInterest = listings?.reduce((s, l) => s + l.interestedCount, 0) ?? 0;
  const availableCount = listings?.filter((l) => l.status === 'available').length ?? 0;

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto', p: { xs: 2, sm: 3 } }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h4">{t('dashboard_title')}</Typography>
          <Typography variant="body2" color="text.secondary">
            {t('dashboard_subtitle')}
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/post-crop')}>
          {t('post_a_crop')}
        </Button>
      </Stack>

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard label={t('active_listings')} value={availableCount} delay={0} />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard label={t('total_interest')} value={totalInterest} delay={0.08} />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard label={t('listings_count')} value={listings?.length ?? 0} delay={0.16} />
        </Grid>
      </Grid>

      {isMobile ? (
        <Stack spacing={1.5}>
          {isLoading &&
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} variant="rounded" height={92} animation="wave" />)}
          {listings?.map((l) => (
            <Card
              key={l.id}
              component={motion.div}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(`/listing/${l.id}`)}
              elevation={0}
              sx={{ border: '1px solid', borderColor: 'divider', cursor: 'pointer' }}
            >
              <CardContent sx={{ display: 'flex', gap: 1.5, alignItems: 'center', '&:last-child': { pb: 2 } }}>
                <Avatar src={l.images[0]} variant="rounded" sx={{ width: 52, height: 52, flexShrink: 0 }} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Typography variant="body2" fontWeight={700} noWrap>
                      {l.cropName}
                    </Typography>
                    <MoreVertIcon
                      fontSize="small"
                      sx={{ cursor: 'pointer', flexShrink: 0, ml: 1 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        openMenu(e, l);
                      }}
                    />
                  </Stack>
                  <Typography variant="caption" color="text.secondary" noWrap display="block">
                    {l.quantity} {l.unit} · ₹{l.pricePerUnit}/{l.unit} · {l.location}
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.75 }}>
                    <StatusStamp status={l.status} />
                    <Chip size="small" label={`${l.interestedCount} buyers`} color={l.interestedCount > 0 ? 'primary' : 'default'} variant={l.interestedCount > 0 ? 'filled' : 'outlined'} />
                  </Stack>
                </Box>
              </CardContent>
            </Card>
          ))}
          {!isLoading && listings?.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography color="text.secondary">{t('no_listings_yet')}</Typography>
            </Box>
          )}
        </Stack>
      ) : (
        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t('crop')}</TableCell>
                <TableCell>{t('quantity')}</TableCell>
                <TableCell>{t('price')}</TableCell>
                <TableCell>{t('interest')}</TableCell>
                <TableCell>{t('status')}</TableCell>
                <TableCell align="right" />
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading &&
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton animation="wave" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              {listings?.map((l) => (
                <TableRow
                  key={l.id}
                  component={motion.tr}
                  whileHover={{ backgroundColor: 'rgba(46,94,62,0.04)' }}
                  onClick={() => navigate(`/listing/${l.id}`)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Avatar src={l.images[0]} variant="rounded" sx={{ width: 40, height: 40 }} />
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {l.cropName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {l.location}
                        </Typography>
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    {l.quantity} {l.unit}
                  </TableCell>
                  <TableCell>₹{l.pricePerUnit}/{l.unit}</TableCell>
                  <TableCell>
                    <Chip size="small" label={`${l.interestedCount} buyers`} color={l.interestedCount > 0 ? 'primary' : 'default'} variant={l.interestedCount > 0 ? 'filled' : 'outlined'} />
                  </TableCell>
                  <TableCell>
                    <StatusStamp status={l.status} />
                  </TableCell>
                  <TableCell align="right">
                    <MoreVertIcon
                      fontSize="small"
                      sx={{ cursor: 'pointer' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        openMenu(e, l);
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {!isLoading && listings?.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography color="text.secondary">{t('no_listings_yet')}</Typography>
            </Box>
          )}
        </Paper>
      )}

      <Menu anchorEl={menuAnchor} open={!!menuAnchor} onClose={() => setMenuAnchor(null)}>
        {statOptions.map((s) => (
          <MenuItem
            key={s}
            disabled={activeListing?.status === s}
            onClick={() => {
              if (activeListing) updateStatus.mutate({ id: activeListing.id, status: s });
              setMenuAnchor(null);
            }}
          >
            {t('mark_as')} {s}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}
