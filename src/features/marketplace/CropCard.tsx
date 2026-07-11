import { motion } from 'framer-motion';
import { Card, CardMedia, CardContent, Typography, Stack, Chip, Box } from '@mui/material';
import PlaceIcon from '@mui/icons-material/PlaceOutlined';
import EventIcon from '@mui/icons-material/EventOutlined';
import PeopleIcon from '@mui/icons-material/PeopleAltOutlined';
import StatusStamp from '../../components/ui/StatusStamp';
import PriceTicker from '../../components/ui/PriceTicker';
import type { CropListing } from '../../types';

export default function CropCard({ listing, onOpen }: { listing: CropListing; onOpen: (id: string) => void }) {
  const harvest = new Date(listing.harvestDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

  return (
    <Card
      component={motion.div}
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6, boxShadow: '0 16px 32px rgba(0,0,0,0.12)' }}
      transition={{ duration: 0.35 }}
      onClick={() => onOpen(listing.id)}
      sx={{ cursor: 'pointer', border: '1px solid', borderColor: 'divider', height: '100%', display: 'flex', flexDirection: 'column' }}
      elevation={0}
    >
      <Box sx={{ position: 'relative' }}>
        <CardMedia component="img" height="150" image={listing.imageUrl} alt={listing.cropName} />
        <Box sx={{ position: 'absolute', top: 10, right: 10 }}>
          <StatusStamp status={listing.status} />
        </Box>
      </Box>
      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Typography variant="subtitle1" fontWeight={700} sx={{ fontFamily: '"Fraunces", serif' }}>
            {listing.cropName}
          </Typography>
          <Chip label={listing.category} size="small" variant="outlined" />
        </Stack>
        <PriceTicker value={listing.pricePerUnit} unit={listing.unit} />
        <Stack spacing={0.6} sx={{ mt: 0.5 }}>
          <Stack direction="row" spacing={0.6} alignItems="center" color="text.secondary">
            <PlaceIcon sx={{ fontSize: 16 }} />
            <Typography variant="caption">{listing.location}</Typography>
          </Stack>
          <Stack direction="row" spacing={0.6} alignItems="center" color="text.secondary">
            <EventIcon sx={{ fontSize: 16 }} />
            <Typography variant="caption">Harvested {harvest} · {listing.quantity} {listing.unit}</Typography>
          </Stack>
          <Stack direction="row" spacing={0.6} alignItems="center" color="text.secondary">
            <PeopleIcon sx={{ fontSize: 16 }} />
            <Typography variant="caption">{listing.interestedCount} buyers interested</Typography>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
