import { useParams, useNavigate } from 'react-router-dom';
import { Box, Paper, Typography, Stack, Chip, Button, Divider, Skeleton, Alert } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBackIosNew';
import ScienceIcon from '@mui/icons-material/ScienceOutlined';
import { motion } from 'framer-motion';
import { usePesticidePrices } from '../../api/hooks';
import PriceTicker from '../../components/ui/PriceTicker';
import { useT } from '../../i18n';

const FALLBACK_IMAGE =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="260"><rect width="100%" height="100%" fill="#e8ece7"/><text x="50%" y="50%" font-family="sans-serif" font-size="16" fill="#8a978f" text-anchor="middle">No product photo</text></svg>`
  );

export default function PesticideDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const t = useT();
  const { data, isLoading } = usePesticidePrices('All');
  const item = data?.find((p) => p.id === id);

  if (isLoading) {
    return (
      <Box sx={{ maxWidth: 760, mx: 'auto', p: 3 }}>
        <Skeleton height={280} sx={{ borderRadius: 1 }} />
      </Box>
    );
  }

  if (!item) {
    return (
      <Box sx={{ maxWidth: 760, mx: 'auto', p: 3, textAlign: 'center' }}>
        <Typography variant="h6">Pesticide not found</Typography>
        <Button sx={{ mt: 2 }} onClick={() => navigate('/pesticides')}>{t('back')}</Button>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 760, mx: 'auto', p: { xs: 2, sm: 3 } }}>
      <Button startIcon={<ArrowBackIcon sx={{ fontSize: 14 }} />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>
        {t('back')}
      </Button>

      <Paper
        component={motion.div}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        elevation={0}
        sx={{ borderRadius: 1, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}
      >
        <Box component="img" src={item.imageUrl || FALLBACK_IMAGE} alt={item.name} sx={{ width: '100%', height: 220, objectFit: 'cover' }} />
        <Box sx={{ p: 3 }}>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 0.5 }}>
            <ScienceIcon color="primary" />
            <Typography variant="h4">{item.name}</Typography>
          </Stack>
          <Stack direction="row" spacing={0.75} sx={{ mt: 1, flexWrap: 'wrap' }} gap={0.75}>
            <Chip size="small" label={item.cropCategory} variant="outlined" />
            {item.applicableCrops.map((c) => (
              <Chip key={c} size="small" label={c} />
            ))}
          </Stack>

          <Box sx={{ my: 2 }}>
            <PriceTicker value={item.pricePerUnit} unit={item.unit} />
          </Box>

          <Divider sx={{ my: 2 }} />

          <Stack spacing={2}>
            {item.manufacturer && (
              <Box>
                <Typography variant="caption" color="text.secondary">{t('manufacturer')}</Typography>
                <Typography variant="body2" fontWeight={600}>{item.manufacturer}</Typography>
              </Box>
            )}
            {item.activeIngredient && (
              <Box>
                <Typography variant="caption" color="text.secondary">{t('active_ingredient')}</Typography>
                <Typography variant="body2" fontWeight={600}>{item.activeIngredient}</Typography>
              </Box>
            )}
            {item.dosage && (
              <Box>
                <Typography variant="caption" color="text.secondary">{t('dosage')}</Typography>
                <Typography variant="body2" fontWeight={600}>{item.dosage}</Typography>
              </Box>
            )}
            <Box>
              <Typography variant="caption" color="text.secondary">{t('usage_notes')}</Typography>
              <Typography variant="body2">
                {item.usageNotes ??
                  'Follow the product label for exact dosage, mixing ratio and spray interval for your crop stage — this listing does not yet include product-specific usage instructions.'}
              </Typography>
            </Box>
            <Alert severity="warning" sx={{ mt: 1 }}>
              <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>{t('safety_notes')}</Typography>
              {item.safetyNotes ?? (
                <Typography variant="body2">
                  Wear gloves, a mask and full-sleeve clothing while spraying. Keep off skin and out of eyes, don't
                  spray into the wind, wash hands and equipment thoroughly afterwards, and observe the pre-harvest
                  interval printed on the label before consuming or selling the crop.
                </Typography>
              )}
            </Alert>
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
}
