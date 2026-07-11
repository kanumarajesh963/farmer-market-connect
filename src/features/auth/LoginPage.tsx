import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Box,
  Paper,
  Stack,
  Typography,
  TextField,
  Button,
  ToggleButtonGroup,
  ToggleButton,
  CircularProgress,
  InputAdornment,
} from '@mui/material';
import SproutIcon from '@mui/icons-material/Grass';
import PhoneIcon from '@mui/icons-material/Phone';
import LockIcon from '@mui/icons-material/LockOutlined';
import { useNavigate } from 'react-router-dom';
import { useRequestOtp, useVerifyOtp } from '../../api/hooks';
import { useAuthStore } from '../../store/authStore';
import type { UserRole } from '../../types';
import { toast } from 'sonner';

const phoneSchema = z.object({
  phone: z
    .string()
    .min(10, 'Enter a valid 10-digit mobile number')
    .max(10, 'Enter a valid 10-digit mobile number')
    .regex(/^[6-9]\d{9}$/, 'Enter a valid Indian mobile number'),
  role: z.enum(['farmer', 'buyer', 'mediator', 'admin']),
});

const otpSchema = z.object({
  otp: z.string().length(4, 'Enter the 4-digit code'),
});

type PhoneForm = z.infer<typeof phoneSchema>;
type OtpForm = z.infer<typeof otpSchema>;

const roles: { value: UserRole; label: string }[] = [
  { value: 'farmer', label: 'Farmer' },
  { value: 'buyer', label: 'Buyer' },
  { value: 'mediator', label: 'Trader' },
  { value: 'admin', label: 'Admin' },
];

export default function LoginPage() {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  const requestOtp = useRequestOtp();
  const verifyOtp = useVerifyOtp();

  const phoneForm = useForm<PhoneForm>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: '', role: 'farmer' },
    mode: 'onTouched',
  });

  const otpForm = useForm<OtpForm>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: '' },
  });

  const onSendOtp = phoneForm.handleSubmit(async (data) => {
    try {
      await requestOtp.mutateAsync(data.phone);
      setPhone(data.phone);
      setStep('otp');
      toast.success(`OTP sent to +91 ${data.phone}`);
    } catch {
      toast.error('Could not send OTP. Try again.');
    }
  });

  const onVerify = otpForm.handleSubmit(async (data) => {
    try {
      const res = await verifyOtp.mutateAsync({ phone, otp: data.otp });
      const role = phoneForm.getValues('role');
      login(
        {
          id: 'current-farmer',
          name: role === 'farmer' ? 'Ramesh Patil' : 'Guest User',
          role,
          phone,
          location: 'Nashik, MH',
          avatarColor: '#2E5E3E',
        },
        res.token
      );
      toast.success('Welcome back!');
      navigate(role === 'farmer' ? '/dashboard' : '/marketplace');
    } catch (e) {
      otpForm.setError('otp', { message: e instanceof Error ? e.message : 'Invalid OTP' });
    }
  });

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        display: 'grid',
        placeItems: 'center',
        background: (t) =>
          t.palette.mode === 'dark'
            ? 'radial-gradient(circle at 20% 20%, #1a2b20 0%, #0F1712 60%)'
            : 'radial-gradient(circle at 20% 20%, #EAF0E5 0%, #F6F7F2 60%)',
        p: 2,
      }}
    >
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: 'easeOut' }}>
        <Paper elevation={0} sx={{ width: 400, maxWidth: '92vw', p: 4, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
          <Stack spacing={0.5} alignItems="center" sx={{ mb: 3 }}>
            <Box
              sx={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                bgcolor: 'primary.main',
                display: 'grid',
                placeItems: 'center',
                color: 'primary.contrastText',
                mb: 1,
              }}
            >
              <SproutIcon />
            </Box>
            <Typography variant="h5" fontWeight={700}>
              Farmer Market Connect
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {step === 'phone' ? 'Sign in with your mobile number' : `Enter the code sent to +91 ${phone}`}
            </Typography>
          </Stack>

          <AnimatePresence mode="wait">
            {step === 'phone' ? (
              <motion.form
                key="phone"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.25 }}
                onSubmit={onSendOtp}
                noValidate
              >
                <Stack spacing={2.5}>
                  <Controller
                    name="role"
                    control={phoneForm.control}
                    render={({ field }) => (
                      <ToggleButtonGroup
                        {...field}
                        exclusive
                        fullWidth
                        size="small"
                        onChange={(_, v) => v && field.onChange(v)}
                      >
                        {roles.map((r) => (
                          <ToggleButton key={r.value} value={r.value}>
                            {r.label}
                          </ToggleButton>
                        ))}
                      </ToggleButtonGroup>
                    )}
                  />
                  <Controller
                    name="phone"
                    control={phoneForm.control}
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        label="Mobile number"
                        placeholder="98765 43210"
                        fullWidth
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message ?? ' '}
                        inputProps={{ inputMode: 'numeric', maxLength: 10 }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <PhoneIcon fontSize="small" sx={{ mr: -0.5 }} />
                              +91
                            </InputAdornment>
                          ),
                        }}
                        onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ''))}
                      />
                    )}
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={requestOtp.isPending}
                    sx={{ py: 1.4 }}
                  >
                    {requestOtp.isPending ? <CircularProgress size={22} color="inherit" /> : 'Send OTP'}
                  </Button>
                  <Typography variant="caption" color="text.secondary" align="center">
                    New here? Signing in creates your account automatically.
                  </Typography>
                </Stack>
              </motion.form>
            ) : (
              <motion.form
                key="otp"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.25 }}
                onSubmit={onVerify}
                noValidate
              >
                <Stack spacing={2.5}>
                  <Controller
                    name="otp"
                    control={otpForm.control}
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        label="4-digit OTP"
                        placeholder="1234"
                        fullWidth
                        autoFocus
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message ?? 'Demo code: 1234'}
                        inputProps={{ inputMode: 'numeric', maxLength: 4, style: { letterSpacing: '0.5em', fontSize: 22, textAlign: 'center' } }}
                        InputProps={{ startAdornment: <InputAdornment position="start"><LockIcon fontSize="small" /></InputAdornment> }}
                        onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ''))}
                      />
                    )}
                  />
                  <Button type="submit" variant="contained" size="large" disabled={verifyOtp.isPending} sx={{ py: 1.4 }}>
                    {verifyOtp.isPending ? <CircularProgress size={22} color="inherit" /> : 'Verify & Continue'}
                  </Button>
                  <Button variant="text" onClick={() => setStep('phone')} sx={{ alignSelf: 'center' }}>
                    Change number
                  </Button>
                </Stack>
              </motion.form>
            )}
          </AnimatePresence>
        </Paper>
      </motion.div>
    </Box>
  );
}
