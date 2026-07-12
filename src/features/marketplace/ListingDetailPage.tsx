import { useParams, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Stack,
  Avatar,
  Button,
  TextField,
  Divider,
  Skeleton,
  Chip,
  Alert,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBackIosNew';
import PlaceIcon from '@mui/icons-material/PlaceOutlined';
import { useListing, useInterests, useCreateInterest } from '../../api/hooks';
import StatusStamp from '../../components/ui/StatusStamp';
import PriceTicker from '../../components/ui/PriceTicker';
import ImageGallery from '../../components/ui/ImageGallery';
import { useAuthStore } from '../../store/authStore';
import { useT } from '../../i18n';

const interestSchema = z.object({
  message: z.string().min(5, 'Say a little about what you need'),
});
type InterestForm = z.infer<typeof interestSchema>;

export default function ListingDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { data: listing, isLoading } = useListing(id);
  const { data: interests } = useInterests(id);
  const { user } = useAuthStore();
  const canExpressInterest = user?.role === 'buyer' || user?.role === 'mediator';
  const createInterest = useCreateInterest(id);
  const t = useT();

  const { control, handleSubmit, reset } = useForm<InterestForm>({
    resolver: zodResolver(interestSchema),
    defaultValues: { message: '' },
  });

  const onSubmit = handleSubmit(async (data) => {
    await createInterest.mutateAsync(data.message);
    reset();
  });

  if (isLoading || !listing) {
    return (
      <Box sx={{ maxWidth: 1000, mx: 'auto', p: 3 }}>
        <Skeleton height={340} sx={{ borderRadius: 1 }} />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', p: { xs: 2, sm: 3 } }}>
      <Button startIcon={<ArrowBackIcon sx={{ fontSize: 14 }} />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>
        {t('back_to_marketplace')}
      </Button>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper
            component={motion.div}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            elevation={0}
            sx={{ borderRadius: 1, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}
          >
            <Box sx={{ position: 'relative' }}>
              <ImageGallery images={listing.images} alt={listing.cropName} height={320} />
              <Box sx={{ position: 'absolute', top: 14, right: 14, pointerEvents: 'none' }}>
                <StatusStamp status={listing.status} />
              </Box>
            </Box>
            <Box sx={{ p: 3 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Typography variant="h4">{listing.cropName}</Typography>
                <Chip label={listing.category} />
              </Stack>
              <Box sx={{ my: 1.5 }}>
                <PriceTicker value={listing.pricePerUnit} unit={listing.unit} />
              </Box>
              <Typography variant="body2" color="text.secondary">
                {listing.description}
              </Typography>
              {listing.sellReason && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  <Typography component="span" variant="body2" color="text.secondary">{t('why_selling')}: </Typography>
                  {listing.sellReason}
                </Typography>
              )}
              <Divider sx={{ my: 2 }} />
              <Grid container spacing={2}>
                <Grid size={6}>
                  <Typography variant="caption" color="text.secondary">{t('quantity')}</Typography>
                  <Typography variant="body1" fontWeight={600}>{listing.quantity} {listing.unit}</Typography>
                </Grid>
                <Grid size={6}>
                  <Typography variant="caption" color="text.secondary">{t('location')}</Typography>
                  <Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap">
                    <Typography variant="body1" fontWeight={600}>{listing.location}</Typography>
                    {listing.locationUrl && (
                      <Button
                        size="small"
                        href={listing.locationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        startIcon={<PlaceIcon sx={{ fontSize: 14 }} />}
                        sx={{ minWidth: 0, py: 0 }}
                      >
                        {t('get_directions')}
                      </Button>
                    )}
                  </Stack>
                </Grid>
                <Grid size={6}>
                  <Typography variant="caption" color="text.secondary">{t('harvest_date')}</Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {new Date(listing.harvestDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </Typography>
                </Grid>
                <Grid size={6}>
                  <Typography variant="caption" color="text.secondary">{t('farmer')}</Typography>
                  <Typography variant="body1" fontWeight={600}>{listing.farmerName}</Typography>
                </Grid>
              </Grid>
            </Box>
          </Paper>

          <Paper component="form" onSubmit={onSubmit} elevation={0} sx={{ mt: 3, p: 3, borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle1" sx={{ mb: 1.5 }}>
              {t('express_interest')}
            </Typography>
            {canExpressInterest ? (
              <>
                <Controller
                  name="message"
                  control={control}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      fullWidth
                      multiline
                      minRows={2}
                      placeholder="I'm interested in 200kg — can you share the quality grade?"
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                    />
                  )}
                />
                <Button type="submit" variant="contained" sx={{ mt: 1.5 }} disabled={createInterest.isPending}>
                  {createInterest.isPending ? 'Sending…' : t('send_to_farmer')}
                </Button>
              </>
            ) : (
              <Alert severity="info">
                {user?.role === 'farmer' || user?.role === 'admin'
                  ? 'Only buyers and traders can express interest in a listing.'
                  : 'Sign in as a buyer or trader to express interest.'}
              </Alert>
            )}
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              {t('interested_buyers')} ({interests?.length ?? 0})
            </Typography>
            <Stack spacing={2}>
              {interests?.map((i) => (
                <Stack key={i.id} direction="row" spacing={1.5} alignItems="flex-start">
                  <Avatar sx={{ bgcolor: 'secondary.main', width: 36, height: 36, fontSize: 14 }}>{i.buyerName[0]}</Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" fontWeight={600}>{i.buyerName}</Typography>
                      <Chip
                        size="small"
                        label={i.status}
                        color={i.status === 'accepted' ? 'success' : i.status === 'rejected' ? 'error' : 'default'}
                        variant={i.status === 'pending' ? 'outlined' : 'filled'}
                      />
                    </Stack>
                    <Typography variant="caption" color="text.secondary">{i.buyerRole}</Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>{i.message}</Typography>
                  </Box>
                </Stack>
              ))}
              {interests?.length === 0 && (
                <Typography variant="body2" color="text.secondary">No buyers yet — be the first to reach out.</Typography>
              )}
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
