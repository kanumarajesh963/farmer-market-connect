import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Avatar,
  Stack,
  Chip,
  Button,
  Menu,
  MenuItem,
  Skeleton,
  Alert,
} from '@mui/material';
import ShieldIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import { useAllUsers, usePromoteUser } from '../../api/hooks';
import { useAuthStore } from '../../store/authStore';
import type { User, UserRole } from '../../types';

const roleColor: Record<UserRole, 'default' | 'primary' | 'secondary' | 'warning'> = {
  farmer: 'primary',
  buyer: 'default',
  mediator: 'secondary',
  admin: 'warning',
};

const allRoles: UserRole[] = ['farmer', 'buyer', 'mediator', 'admin'];

export default function AdminUsersPage() {
  const currentUser = useAuthStore((s) => s.user);
  const { data: users, isLoading } = useAllUsers(true);
  const promote = usePromoteUser();
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [activeUser, setActiveUser] = useState<User | null>(null);

  const openMenu = (e: React.MouseEvent<Element>, user: User) => {
    setMenuAnchor(e.currentTarget as HTMLElement);
    setActiveUser(user);
  };

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', p: { xs: 2, sm: 3 } }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 0.5 }}>
        <ShieldIcon color="warning" />
        <Typography variant="h4">User & role management</Typography>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Only admins can see this page. Promote a farmer, buyer or trader to admin — or step someone back down.
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        Changes apply instantly: the affected person's app updates in realtime over their open connection.
      </Alert>

      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Role</TableCell>
              <TableCell align="right" />
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton animation="wave" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            {users?.map((u) => (
              <TableRow key={u.id}>
                <TableCell>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Avatar sx={{ bgcolor: u.avatarColor, width: 32, height: 32, fontSize: 13 }}>{u.name[0]}</Avatar>
                    <Typography variant="body2" fontWeight={600}>
                      {u.name}
                      {u.id === currentUser?.id && (
                        <Typography component="span" variant="caption" color="text.secondary"> (you)</Typography>
                      )}
                    </Typography>
                  </Stack>
                </TableCell>
                <TableCell>+91 {u.phone}</TableCell>
                <TableCell>{u.location || '—'}</TableCell>
                <TableCell>
                  <Chip size="small" label={u.role} color={roleColor[u.role]} sx={{ textTransform: 'capitalize' }} />
                </TableCell>
                <TableCell align="right">
                  <Button size="small" onClick={(e) => openMenu(e, u)} disabled={u.id === currentUser?.id}>
                    Change role
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {!isLoading && users?.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography color="text.secondary">No users yet.</Typography>
          </Box>
        )}
      </Paper>

      <Menu anchorEl={menuAnchor} open={!!menuAnchor} onClose={() => setMenuAnchor(null)}>
        {allRoles.map((r) => (
          <MenuItem
            key={r}
            disabled={activeUser?.role === r}
            onClick={() => {
              if (activeUser) promote.mutate({ id: activeUser.id, role: r });
              setMenuAnchor(null);
            }}
            sx={{ textTransform: 'capitalize' }}
          >
            Make {r}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}
