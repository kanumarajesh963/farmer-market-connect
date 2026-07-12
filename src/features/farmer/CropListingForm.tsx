import { useRef, useState } from 'react';
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

// Sample photo keywords per category so the picker always shows images that
// actually match what's being listed, instead of 3 fixed unrelated photos.
const categoryKeywords: Record<CropCategory, string[]> = {
  Vegetables: ['vegetables', 'fresh-vegetables', 'farm-vegetables'],
  Fruits: ['fruits', 'fresh-fruits', 'orchard'],
  Grains: ['grains', 'wheat-field', 'rice-paddy'],
  Pulses: ['lentils', 'pulses', 'legumes'],
  Spices: ['spices', 'indian-spices', 'chilli'],
  Oilseeds: ['peanut', 'sunflower', 'oilseeds'],
};
const sampleImagesFor = (category: CropCategory) =>
  categoryKeywords[category].map((kw) => `https://loremflickr.com/400/400/${kw}?lock=${kw.length + category.length}`);

const MAX_UPLOAD_BYTES = 6 * 1024 * 1024; // 6MB raw file limit before we even try to read it

// Reads a photo straight from the farmer's device (camera roll or camera),
// downsizes it in the browser so the payload stays reasonable, and returns a
// data URL that's ready to submit — no third-party storage account needed.
function readImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Please choose an image file (JPG, PNG, WEBP).'));
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      reject(new Error('That photo is too large — please choose one under 6MB.'));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read that photo. Try another one.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Could not read that photo. Try another one.'));
      img.onload = () => {
        const maxDim = 1000;
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

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
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

      <Paper component="form" onSubmit={onSubmit} elevation={0} sx={{ p: { xs: 2.5, sm: 4 }, borderRadius: 1, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
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
                  render={({ field, fieldState }) => {
                    const isUploaded = field.value?.startsWith('data:');
                    const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
                      const file = e.target.files?.[0];
                      e.target.value = ''; // allow re-selecting the same file later
                      if (!file) return;
                      setUploadError(null);
                      setUploading(true);
                      try {
                        const dataUrl = await readImageFile(file);
                        field.onChange(dataUrl);
                      } catch (err) {
                        setUploadError(err instanceof Error ? err.message : 'Could not use that photo.');
                      } finally {
                        setUploading(false);
                      }
                    };

                    return (
                      <Box>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          capture="environment"
                          hidden
                          onChange={onPickFile}
                        />
                        <Typography variant="body2" sx={{ mb: 1 }} color={fieldState.error ? 'error' : 'text.secondary'}>
                          Add a photo of your crop
                        </Typography>

                        <Stack direction="row" spacing={2} alignItems="flex-start" sx={{ mb: 2, flexWrap: 'wrap' }}>
                          <Box
                            component={motion.div}
                            whileHover={{ scale: 1.02 }}
                            onClick={() => fileInputRef.current?.click()}
                            sx={{
                              width: 96,
                              height: 96,
                              borderRadius: 1,
                              overflow: 'hidden',
                              cursor: 'pointer',
                              border: isUploaded ? '3px solid' : '1px dashed',
                              borderColor: isUploaded ? 'primary.main' : 'divider',
                              display: 'grid',
                              placeItems: 'center',
                              bgcolor: 'action.hover',
                              flexShrink: 0,
                            }}
                          >
                            {isUploaded ? (
                              <Avatar src={field.value} variant="square" sx={{ width: '100%', height: '100%' }} />
                            ) : (
                              <Stack alignItems="center" spacing={0.5}>
                                <UploadIcon color="action" />
                                <Typography variant="caption" color="text.secondary">
                                  {uploading ? 'Reading…' : 'Upload'}
                                </Typography>
                              </Stack>
                            )}
                          </Box>
                          <Stack spacing={0.5} justifyContent="center">
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<UploadIcon fontSize="small" />}
                              onClick={() => fileInputRef.current?.click()}
                              disabled={uploading}
                            >
                              {isUploaded ? 'Replace photo' : 'Take or choose a photo'}
                            </Button>
                            <Typography variant="caption" color="text.secondary">
                              From your camera or gallery, up to 6MB.
                            </Typography>
                            {uploadError && (
                              <Typography variant="caption" color="error">
                                {uploadError}
                              </Typography>
                            )}
                          </Stack>
                        </Stack>

                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                          Or pick a placeholder instead:
                        </Typography>
                        <Stack direction="row" spacing={1.5}>
                          {sampleImagesFor(values.category).map((img) => (
                            <Box
                              key={img}
                              component={motion.div}
                              whileHover={{ scale: 1.04 }}
                              whileTap={{ scale: 0.97 }}
                              onClick={() => field.onChange(img)}
                              sx={{
                                width: 72,
                                height: 72,
                                borderRadius: 1,
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
                    );
                  }}
                />
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => <TextField {...field} label="Notes for buyers (optional)" multiline minRows={2} fullWidth />}
                />

                <Paper variant="outlined" sx={{ p: 2, borderRadius: 1, bgcolor: 'action.hover' }}>
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
