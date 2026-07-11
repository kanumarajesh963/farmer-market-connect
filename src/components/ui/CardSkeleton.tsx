import { Card, Skeleton, CardContent, Stack } from '@mui/material';

export default function CardSkeleton() {
  return (
    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', height: '100%' }}>
      <Skeleton variant="rectangular" height={150} animation="wave" />
      <CardContent>
        <Skeleton width="60%" height={28} animation="wave" />
        <Skeleton width="40%" height={24} animation="wave" sx={{ mt: 1 }} />
        <Stack spacing={0.5} sx={{ mt: 1.5 }}>
          <Skeleton width="80%" animation="wave" />
          <Skeleton width="70%" animation="wave" />
          <Skeleton width="50%" animation="wave" />
        </Stack>
      </CardContent>
    </Card>
  );
}
