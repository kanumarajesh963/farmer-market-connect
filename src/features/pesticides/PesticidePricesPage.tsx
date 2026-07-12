import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  Grid,
  Paper,
  Stack,
  Chip,
  InputAdornment,
  Skeleton,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ScienceIcon from '@mui/icons-material/ScienceOutlined';
import { motion } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { usePesticidePrices } from '../../api/hooks';
import PriceTicker from '../../components/ui/PriceTicker';
import { useAuthStore } from '../../store/authStore';
import { getSocket } from '../../lib/socket';
import { useT } from '../../i18n';
import type { CropCategory, PesticidePrice } from '../../types';

const crops: (CropCategory | 'All')[] = ['All', 'Vegetables', 'Fruits', 'Grains', 'Pulses', 'Spices', 'Oilseeds'];

export default function PesticidePricesPage() {
  const [crop, setCrop] = useState<CropCategory | 'All'>('All');
  const [search, setSearch] = useState('');
  const { data, isLoading } = usePesticidePrices(crop);
  const token = useAuthStore((s) => s.token);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const t = useT();

  // Realtime: the server nudges a few prices every few seconds to simulate a
  // live market feed. We merge each update straight into the cached list so
  // the numbers tick in front of you without a refetch.
  useEffect(() => {
    const socket = getSocket(token);
    const onUpdate = (updated: PesticidePrice) => {
      qc.setQueriesData({ queryKey: ['pesticides'] }, (old: unknown) => {
        const list = old as PesticidePrice[] | undefined;
        if (!list) return old;
        return list.map((p) => (p.id === updated.id ? updated : p));
      });
    };
    socket.on('pesticide:update', onUpdate);
    return () => {
      socket.off('pesticide:update', onUpdate);
    };
  }, [token, qc]);

  const filtered = useMemo(() => {
    if (!data) return [];
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter((p) => p.name.toLowerCase().includes(q));
  }, [data, search]);

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', p: { xs: 2, sm: 3 } }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 0.5 }}>
        <ScienceIcon color="primary" />
        <Typography variant="h4">{t('pesticides_title')}</Typography>
      </Stack>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 3 }}>
        <Box
          component={motion.span}
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ repeat: Infinity, duration: 1.8 }}
          sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main', display: 'inline-block' }}
        />
        <Typography variant="body2" color="text.secondary">
          {t('pesticides_live')}
        </Typography>
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 3 }}>
        <TextField
          select
          label={t('category')}
          value={crop}
          onChange={(e) => setCrop(e.target.value as CropCategory | 'All')}
          sx={{ minWidth: 180 }}
          size="small"
        >
          {crops.map((c) => (
            <MenuItem key={c} value={c}>
              {c}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          fullWidth
          size="small"
          placeholder={t('pesticide_search_placeholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
        />
      </Stack>

      <Grid container spacing={2.5}>
        {isLoading &&
          Array.from({ length: 4 }).map((_, i) => (
            <Grid key={i} size={{ xs: 12, sm: 6 }}>
              <Skeleton variant="rounded" height={110} />
            </Grid>
          ))}
        {filtered.map((p) => (
          <Grid key={p.id} size={{ xs: 12, sm: 6 }}>
            <Paper
              component={motion.div}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(`/pesticides/${p.id}`)}
              elevation={0}
              sx={{ p: 2.5, borderRadius: 1, border: '1px solid', borderColor: 'divider', cursor: 'pointer' }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography variant="subtitle1" fontWeight={700}>
                    {p.name}
                  </Typography>
                  <Stack direction="row" spacing={0.5} sx={{ mt: 0.5, flexWrap: 'wrap' }} gap={0.5}>
                    <Chip size="small" label={p.cropCategory} variant="outlined" />
                    {p.applicableCrops.slice(0, 3).map((c) => (
                      <Chip key={c} size="small" label={c} />
                    ))}
                  </Stack>
                  <Typography variant="caption" color="primary.main" sx={{ display: 'block', mt: 1 }}>
                    {t('view_details')} →
                  </Typography>
                </Box>
                <PriceTicker value={p.pricePerUnit} unit={p.unit} />
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {!isLoading && filtered.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6">No pesticides found</Typography>
          <Typography variant="body2" color="text.secondary">
            Try a different crop or clear your search.
          </Typography>
        </Box>
      )}
    </Box>
  );
}
