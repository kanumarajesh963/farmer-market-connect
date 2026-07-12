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
import { categoryPlaceholder } from '../../lib/placeholderImage';
import type { CropCategory, QuantityUnit } from '../../types';

const categories: CropCategory[] = ['Vegetables', 'Fruits', 'Grains', 'Pulses', 'Spices', 'Oilseeds'];

const MAX_IMAGES = 8;
const MAX_UPLOAD_BYTES = 6 * 1024 * 1024; // 6MB raw file limit before we even try to read it

// Suggests a stand-in photo keyed off the crop name/category, used only until
// the farmer uploads a real picture. This used to call loremflickr.com with
// the crop name as a search keyword, which pulls a random tagged photo from
// all of Flickr — unpredictable, occasionally unrelated, and occasionally
// outright inappropriate. Generating the placeholder locally guarantees it's
// always safe and always on-topic.
function suggestedImageFor(cropName: string, category: CropCategory): string {
  return categoryPlaceholder(cropName, category);
}

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
  locationUrl: z.string().url('Enter a valid link (e.g. a Google Maps link)').optional().or(z.literal('')),
  description: z.string().max(300).optional(),
  sellReason: z.string().max(200).optional(),
  images: z.array(z.string()).min(1, 'Add at least one photo'),
});

type FormValues = z.infer<typeof schema>;

const steps = ['Crop details', 'Quantity & price', 'Photo & review'];

export default function CropListingForm() {
  const [activeStep, setActiveStep] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [urlDraft, setUrlDraft] = useState('');
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
      locationUrl: '',
      description: '',
      sellReason: '',
      images: [],
    },
  });

  const fieldsByStep: (keyof FormValues)[][] = [
    ['cropName', 'category', 'location', 'locationUrl'],
    ['quantity', 'unit', 'pricePerUnit', 'harvestDate'],
    ['images'],
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
      locationUrl: data.locationUrl || undefined,
      status: 'available',
      images: data.images,
      description: data.description,
      sellReason: data.sellReason || undefined,
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
                <Controller
                  name="locationUrl"
                  control={control}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      label="Farm location link (optional)"
                      placeholder="Paste a Google Maps link so buyers can get directions"
                      fullWidth
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message ?? ' '}
                    />
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
                  name="images"
                  control={control}
                  render={({ field, fieldState }) => {
                    const images = field.value ?? [];

                    const addImages = (urls: string[]) => {
                      const room = MAX_IMAGES - images.length;
                      if (room <= 0) {
                        setUploadError(`You can add up to ${MAX_IMAGES} photos.`);
                        return;
                      }
                      field.onChange([...images, ...urls.slice(0, room)]);
                    };

                    const removeImage = (idx: number) => {
                      field.onChange(images.filter((_, i) => i !== idx));
                    };

                    // Bulk upload: every file picked at once is read and
                    // appended, so a farmer can select their whole batch of
                    // photos in one go instead of one at a time.
                    const onPickFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
                      const files = Array.from(e.target.files ?? []);
                      e.target.value = ''; // allow re-selecting the same files later
                      if (files.length === 0) return;
                      setUploadError(null);
                      setUploading(true);
                      try {
                        const room = MAX_IMAGES - images.length;
                        const toRead = files.slice(0, room);
                        if (files.length > toRead.length) {
                          setUploadError(`Only added ${toRead.length} of ${files.length} photos — limit is ${MAX_IMAGES}.`);
                        }
                        const dataUrls = await Promise.all(toRead.map(readImageFile));
                        addImages(dataUrls);
                      } catch (err) {
                        setUploadError(err instanceof Error ? err.message : 'Could not use one of those photos.');
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
                          multiple
                          hidden
                          onChange={onPickFiles}
                        />
                        <Typography variant="body2" sx={{ mb: 1 }} color={fieldState.error ? 'error' : 'text.secondary'}>
                          Add photos of your crop ({images.length}/{MAX_IMAGES})
                        </Typography>

                        {images.length > 0 && (
                          <Stack direction="row" spacing={1.5} sx={{ mb: 2, overflowX: 'auto', pb: 0.5 }}>
                            {images.map((img, idx) => (
                              <Box
                                key={idx}
                                component={motion.div}
                                initial={{ opacity: 0, scale: 0.85 }}
                                animate={{ opacity: 1, scale: 1 }}
                                sx={{
                                  position: 'relative',
                                  width: 84,
                                  height: 84,
                                  borderRadius: 1,
                                  overflow: 'hidden',
                                  flexShrink: 0,
                                  border: idx === 0 ? '3px solid' : '1px solid',
                                  borderColor: idx === 0 ? 'primary.main' : 'divider',
                                }}
                              >
                                <Avatar src={img} variant="square" sx={{ width: '100%', height: '100%' }} />
                                {idx === 0 && (
                                  <Chip
                                    label="Cover"
                                    size="small"
                                    sx={{ position: 'absolute', bottom: 2, left: 2, height: 18, fontSize: 10, bgcolor: 'primary.main', color: 'primary.contrastText' }}
                                  />
                                )}
                                <Box
                                  onClick={() => removeImage(idx)}
                                  sx={{
                                    position: 'absolute',
                                    top: 2,
                                    right: 2,
                                    width: 20,
                                    height: 20,
                                    borderRadius: '50%',
                                    bgcolor: 'rgba(0,0,0,0.6)',
                                    color: '#fff',
                                    display: 'grid',
                                    placeItems: 'center',
                                    fontSize: 13,
                                    cursor: 'pointer',
                                    lineHeight: 1,
                                  }}
                                >
                                  ✕
                                </Box>
                              </Box>
                            ))}
                          </Stack>
                        )}

                        <Stack direction="row" spacing={1.5} sx={{ mb: 2, flexWrap: 'wrap' }} useFlexGap>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<UploadIcon fontSize="small" />}
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading || images.length >= MAX_IMAGES}
                          >
                            {uploading ? 'Reading…' : 'Upload photos'}
                          </Button>
                          <Button
                            size="small"
                            variant="text"
                            onClick={() => addImages([suggestedImageFor(values.cropName, values.category)])}
                            disabled={images.length >= MAX_IMAGES}
                          >
                            Suggest a photo for {values.cropName || 'this crop'}
                          </Button>
                        </Stack>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                          Select several at once from your camera or gallery, up to 6MB each.
                        </Typography>

                        <TextField
                          fullWidth
                          size="small"
                          label="Or paste a photo link"
                          placeholder="https://…"
                          value={urlDraft}
                          onChange={(e) => setUrlDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && urlDraft.trim()) {
                              e.preventDefault();
                              addImages([urlDraft.trim()]);
                              setUrlDraft('');
                            }
                          }}
                          helperText="Press Enter to add the link as a photo"
                          sx={{ mb: 1 }}
                        />
                        <Button
                          size="small"
                          variant="outlined"
                          disabled={!urlDraft.trim() || images.length >= MAX_IMAGES}
                          onClick={() => {
                            addImages([urlDraft.trim()]);
                            setUrlDraft('');
                          }}
                        >
                          Add photo link
                        </Button>

                        {(uploadError || fieldState.error) && (
                          <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>
                            {uploadError ?? fieldState.error?.message}
                          </Typography>
                        )}
                      </Box>
                    );
                  }}
                />
                <Controller
                  name="sellReason"
                  control={control}
                  render={({ field }) => <TextField {...field} label="Why are you selling? (optional)" placeholder="e.g. surplus after home use, end of season" fullWidth />}
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
