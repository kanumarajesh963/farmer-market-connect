import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Grid,
  Stack,
  TextField,
  MenuItem,
  InputAdornment,
  Typography,
  Slider,
  Paper,
  Chip,
  Drawer,
  IconButton,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import TuneIcon from '@mui/icons-material/TuneRounded';
import { motion, AnimatePresence } from 'framer-motion';
import { useListingsInfinite } from '../../api/hooks';
import CropCard from './CropCard';
import CardSkeleton from '../../components/ui/CardSkeleton';
import type { CropCategory } from '../../types';
import { useNavigate } from 'react-router-dom';

const categories: (CropCategory | 'All')[] = ['All', 'Vegetables', 'Fruits', 'Grains', 'Pulses', 'Spices', 'Oilseeds'];

export default function MarketplacePage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<CropCategory | 'All'>('All');
  const [priceRange, setPriceRange] = useState<number[]>([0, 100]);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filters = useMemo(
    () => ({
      search: search || undefined,
      category,
      minPrice: priceRange[0],
      maxPrice: priceRange[1],
    }),
    [search, category, priceRange]
  );

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useListingsInfinite(filters);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage();
      },
      { rootMargin: '200px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const listings = data?.pages.flatMap((p) => p.items) ?? [];
  const total = data?.pages[0]?.total ?? 0;

  const FiltersPanel = (
    <Stack spacing={3} sx={{ p: filtersOpen && isMobile ? 3 : 0 }}>
      <TextField
        select
        label="Category"
        value={category}
        onChange={(e) => setCategory(e.target.value as CropCategory | 'All')}
        fullWidth
        size="small"
      >
        {categories.map((c) => (
          <MenuItem key={c} value={c}>
            {c}
          </MenuItem>
        ))}
      </TextField>
      <Box>
        <Typography variant="body2" gutterBottom color="text.secondary">
          Price range (₹/unit)
        </Typography>
        <Slider
          value={priceRange}
          onChange={(_, v) => setPriceRange(v as number[])}
          valueLabelDisplay="auto"
          min={0}
          max={100}
          sx={{ color: 'primary.main' }}
        />
      </Box>
    </Stack>
  );

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 2, sm: 3 } }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-end" sx={{ mb: 2 }} flexWrap="wrap" gap={1}>
        <Box>
          <Typography variant="h4">Marketplace</Typography>
          <Typography variant="body2" color="text.secondary">
            {total} fresh listings from farmers near you · live updates
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center">
          <Box
            component={motion.span}
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ repeat: Infinity, duration: 1.8 }}
            sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main', display: 'inline-block' }}
          />
          <Typography variant="caption" color="text.secondary">
            Realtime sync active
          </Typography>
        </Stack>
      </Stack>

      <Stack direction="row" spacing={1.5} sx={{ mb: 2 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search crops or locations…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
        />
        {isMobile && (
          <IconButton onClick={() => setFiltersOpen(true)} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <TuneIcon />
          </IconButton>
        )}
      </Stack>

      <Grid container spacing={3}>
        {!isMobile && (
          <Grid size={{ sm: 3 }}>
            <Paper elevation={0} sx={{ p: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 3, position: 'sticky', top: 16 }}>
              <Typography variant="subtitle2" sx={{ mb: 2 }}>
                Filters
              </Typography>
              {FiltersPanel}
            </Paper>
          </Grid>
        )}

        <Grid size={{ xs: 12, sm: 9 }}>
          {category !== 'All' && (
            <Chip label={category} onDelete={() => setCategory('All')} size="small" sx={{ mb: 2 }} />
          )}
          <Grid container spacing={2.5}>
            <AnimatePresence>
              {isLoading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <Grid key={`sk-${i}`} size={{ xs: 12, sm: 6, md: 4 }}>
                    <CardSkeleton />
                  </Grid>
                ))}
              {listings.map((l) => (
                <Grid key={l.id} size={{ xs: 12, sm: 6, md: 4 }}>
                  <CropCard listing={l} onOpen={(id) => navigate(`/listing/${id}`)} />
                </Grid>
              ))}
            </AnimatePresence>
          </Grid>

          {!isLoading && listings.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6">No crops match these filters</Typography>
              <Typography variant="body2" color="text.secondary">
                Try widening the price range or clearing search.
              </Typography>
            </Box>
          )}

          <Box ref={sentinelRef} sx={{ height: 40 }} />
          {isFetchingNextPage && (
            <Grid container spacing={2.5}>
              {Array.from({ length: 3 }).map((_, i) => (
                <Grid key={`skn-${i}`} size={{ xs: 12, sm: 6, md: 4 }}>
                  <CardSkeleton />
                </Grid>
              ))}
            </Grid>
          )}
        </Grid>
      </Grid>

      <Drawer anchor="bottom" open={filtersOpen} onClose={() => setFiltersOpen(false)}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 3, pt: 2 }}>
          <Typography variant="subtitle1">Filters</Typography>
          <IconButton onClick={() => setFiltersOpen(false)}>✕</IconButton>
        </Stack>
        {FiltersPanel}
      </Drawer>
    </Box>
  );
}
