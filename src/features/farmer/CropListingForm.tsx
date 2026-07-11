import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Box,
  Paper,
  Stack,
  Stepper,
  Step,
  StepLabel,
  Typography,
  TextField,
  MenuItem,
  Button,
  ToggleButtonGroup,
  ToggleButton,
  InputAdornment,
  Chip,
  Avatar,
} from '@mui/material';
import UploadIcon from '@mui/icons-material/CloudUploadOutlined';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useNavigate } from 'react-router-dom';
import { useCreateListing } from '../../api/hooks';
import type { CropCategory, QuantityUnit } from '../../types';

const categories: CropCategory[] = ['Vegetables', 'Fruits', 'Grains', 'Pulses', 'Spices', 'Oilseeds'];
const sampleImages = [
  'https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?w=400&q=80',
  'https://images.unsplash.com/photo-1518843875459-f738682238a6?w=400&q=80',
  'https://images.unsplash.com/photo-1592841200221-a6898f307baa?w=400&q=80',
];

const schema = z.object({
  cropName: z.string().min(2, 'Enter the crop name'),
  category: z.enum(['Vegetables', 'Fruits', 'Grains', 'Pulses', 'Spices', 'Oilseeds'] as const),
  quantity: z.coerce.number().positive('Quantity must be greater than 0'),
  unit: z.enum(['kg', 'ton']),
  pricePerUnit: z.coerce.number().positive('Enter an expected price'),
  harvestDate: z.date({ message: 'Select the harvest date' }),
  location: z.string().min(2, 'Enter your location'),
  description: z.string().max(300).optional(),
  imageUrl: z.string().min(1, 'Pick a sample photo'),
});

type FormValues = z.infer<typeof schema>;

const steps = ['Crop details', 'Quantity & price', 'Photo & review'];

export default function CropListingForm() {
  const [activeStep, setActiveStep] = useState(0);
  const navigate = useNavigate();
  const createListing = useCreateListing();

  const {
    control,
    handleSubmit,
    trigger,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema) as never,
    mode: 'onTouched',
    defaultValues: {
      cropName: '',
      category: 'Vegetables',
      quantity: undefined,
      unit: 'kg',
      pricePerUnit: undefined,
      harvestDate: undefined,
      location: '',
      description: '',
      imageUrl: '',
    },
  });

  const fieldsByStep: (keyof FormValues)[][] = [
    ['cropName', 'category', 'location'],
    ['quantity', 'unit', 'pricePerUnit', 'harvestDate'],
    ['imageUrl'],
  ];

  const next = async () => {
    const valid = await trigger(fieldsByStep[activeStep]);
    if (valid) setActiveStep((s) => s + 1);
  };
  const back = () => setActiveStep((s) => s - 1);

  const onSubmit = handleSubmit(async (data) => {
    await createListing.mutateAsync({
      cropName: data.cropName,
      category: data.category,
      quantity: data.quantity,
      unit: data.unit as QuantityUnit,
      pricePerUnit: data.pricePerUnit,
      harvestDate: data.harvestDate.toISOString(),
      location: data.location,
      status: 'available',
      imageUrl: data.imageUrl,
      description: data.description,
    });
    navigate('/dashboard');
  });

  const values = watch();

  return (
    <Box sx={{ maxWidth: 640, mx: 'auto', p: { xs: 2, sm: 3 } }}>
      <Typography variant="h4" sx={{ mb: 0.5 }}>
        Post a new crop
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Reach buyers, traders and wholesalers directly. Takes under a minute.
      </Typography>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Paper component="form" onSubmit={onSubmit} elevation={0} sx={{ p: { xs: 2.5, sm: 4 }, borderRadius: 4, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        <AnimatePresence mode="wait" custom={activeStep}>
          {activeStep === 0 && (
            <motion.div key="step0" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.28 }}>
              <Stack spacing={2.5}>
                <Controller
                  name="cropName"
                  control={control}
                  render={({ field, fieldState }) => (
                    <TextField {...field} label="Crop name" placeholder="e.g. Alphonso Mangoes" fullWidth error={!!fieldState.error} helperText={fieldState.error?.message ?? ' '} />
                  )}
                />
                <Controller
                  name="category"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} select label="Category" fullWidth>
                      {categories.map((c) => (
                        <MenuItem key={c} value={c}>
                          {c}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
                <Controller
                  name="location"
                  control={control}
                  render={({ field, fieldState }) => (
                    <TextField {...field} label="Location" placeholder="e.g. Nashik, Maharashtra" fullWidth error={!!fieldState.error} helperText={fieldState.error?.message ?? ' '} />
                  )}
                />
              </Stack>
            </motion.div>
          )}

          {activeStep === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.28 }}>
              <Stack spacing={2.5}>
                <Stack direction="row" spacing={2}>
                  <Controller
                    name="quantity"
                    control={control}
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        value={field.value ?? ''}
                        label="Quantity"
                        type="number"
                        fullWidth
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message ?? ' '}
                      />
                    )}
                  />
                  <Controller
                    name="unit"
                    control={control}
                    render={({ field }) => (
                      <ToggleButtonGroup {...field} exclusive onChange={(_, v) => v && field.onChange(v)} sx={{ height: 56 }}>
                        <ToggleButton value="kg">KG</ToggleButton>
                        <ToggleButton value="ton">Ton</ToggleButton>
                      </ToggleButtonGroup>
                    )}
                  />
                </Stack>
                <Controller
                  name="pricePerUnit"
                  control={control}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      value={field.value ?? ''}
                      label="Expected price"
                      type="number"
                      fullWidth
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message ?? ' '}
                      InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment>, endAdornment: <InputAdornment position="end">/{values.unit}</InputAdornment> }}
                    />
                  )}
                />
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <Controller
                    name="harvestDate"
                    control={control}
                    render={({ field, fieldState }) => (
                      <DatePicker
                        label="Harvest date"
                        value={field.value ?? null}
                        onChange={field.onChange}
                        slotProps={{ textField: { fullWidth: true, error: !!fieldState.error, helperText: fieldState.error?.message ?? ' ' } }}
                      />
                    )}
                  />
                </LocalizationProvider>
              </Stack>
            </motion.div>
          )}

          {activeStep === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.28 }}>
              <Stack spacing={2.5}>
                <Controller
                  name="imageUrl"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Box>
                      <Typography variant="body2" sx={{ mb: 1 }} color={fieldState.error ? 'error' : 'text.secondary'}>
                        <UploadIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                        Choose a sample photo (demo — uploads connect to Cloudinary in production)
                      </Typography>
                      <Stack direction="row" spacing={1.5}>
                        {sampleImages.map((img) => (
                          <Box
                            key={img}
                            component={motion.div}
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => field.onChange(img)}
                            sx={{
                              width: 88,
                              height: 88,
                              borderRadius: 3,
                              overflow: 'hidden',
                              cursor: 'pointer',
                              border: field.value === img ? '3px solid' : '1px solid',
                              borderColor: field.value === img ? 'primary.main' : 'divider',
                            }}
                          >
                            <Avatar src={img} variant="square" sx={{ width: '100%', height: '100%' }} />
                          </Box>
                        ))}
                      </Stack>
                    </Box>
                  )}
                />
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => <TextField {...field} label="Notes for buyers (optional)" multiline minRows={2} fullWidth />}
                />

                <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, bgcolor: 'action.hover' }}>
                  <Typography variant="caption" color="text.secondary">
                    Preview
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5, flexWrap: 'wrap' }}>
                    <Chip label={values.cropName || 'Crop name'} size="small" />
                    <Chip label={values.category} size="small" variant="outlined" />
                    <Chip label={`${values.quantity ?? '—'} ${values.unit}`} size="small" variant="outlined" />
                    <Chip label={`₹${values.pricePerUnit ?? '—'}/${values.unit}`} size="small" color="primary" />
                  </Stack>
                </Paper>
              </Stack>
            </motion.div>
          )}
        </AnimatePresence>

        <Stack direction="row" justifyContent="space-between" sx={{ mt: 4 }}>
          <Button onClick={back} disabled={activeStep === 0}>
            Back
          </Button>
          {activeStep < steps.length - 1 ? (
            <Button variant="contained" onClick={next}>
              Continue
            </Button>
          ) : (
            <Button variant="contained" type="submit" disabled={createListing.isPending}>
              {createListing.isPending ? 'Publishing…' : 'Publish listing'}
            </Button>
          )}
        </Stack>
        {Object.keys(errors).length > 0 && activeStep === steps.length - 1 && (
          <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
            Please complete all required fields before publishing.
          </Typography>
        )}
      </Paper>
    </Box>
  );
}
