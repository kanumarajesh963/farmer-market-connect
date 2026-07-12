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
} from '@mui/material';
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
      sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}
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
          <Typography variant="h4">Your farm dashboard</Typography>
          <Typography variant="body2" color="text.secondary">
            Track listings, buyer interest and status in one place
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/post-crop')}>
          Post a crop
        </Button>
      </Stack>

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard label="Active listings" value={availableCount} delay={0} />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard label="Total buyer interest" value={totalInterest} delay={0.08} />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard label="This month's listings" value={listings?.length ?? 0} delay={0.16} />
        </Grid>
      </Grid>

      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Crop</TableCell>
              <TableCell>Quantity</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Interest</TableCell>
              <TableCell>Status</TableCell>
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
                sx={{ cursor: 'pointer' }}
              >
                <TableCell>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Avatar src={l.imageUrl} variant="rounded" sx={{ width: 40, height: 40 }} />
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
                  <MoreVertIcon fontSize="small" sx={{ cursor: 'pointer' }} onClick={(e) => openMenu(e, l)} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {!isLoading && listings?.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography color="text.secondary">No listings yet — post your first crop to get started.</Typography>
          </Box>
        )}
      </Paper>

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
            Mark as {s}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}
