// User Management page
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Tooltip
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Block,
  CheckCircle,
  Cancel,
  Search,
  Refresh,
  PersonAdd
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const UserManagement = () => {
  const { getIdToken } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [users, setUsers] = useState([]);
  const [approvalRequests, setApprovalRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Filters and pagination
  const [filters, setFilters] = useState({
    search: '',
    role: 'all',
    status: 'all'
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Dialog states
  const [editDialog, setEditDialog] = useState({ open: false, user: null });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, user: null });

  useEffect(() => {
    fetchUsers();
    fetchApprovalRequests();
  }, [filters, page, rowsPerPage]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = await getIdToken();
      
      const params = new URLSearchParams({
        page: page + 1,
        limit: rowsPerPage,
        ...filters
      });

      const response = await fetch(`/api/users?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setUsers(data.data.users);
      } else {
        setError(data.message);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchApprovalRequests = async () => {
    try {
      const token = await getIdToken();
      
      const response = await fetch('/api/users/approval-requests', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setApprovalRequests(data.data);
      }
    } catch (error) {
      console.error('Error fetching approval requests:', error);
    }
  };

  const handleApproveRequest = async (requestId, approved) => {
    try {
      const token = await getIdToken();
      
      const response = await fetch(`/api/users/approve-request/${requestId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ approved })
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess(data.message);
        fetchApprovalRequests();
        fetchUsers();
      } else {
        setError(data.message);
      }
    } catch (error) {
      console.error('Error processing approval:', error);
      setError('Failed to process approval');
    }
  };

  const handleStatusChange = async (userId, isActive) => {
    try {
      const token = await getIdToken();
      
      const response = await fetch(`/api/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isActive })
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess(data.message);
        fetchUsers();
      } else {
        setError(data.message);
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      setError('Failed to update user status');
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'error';
      case 'transport_contractor':
        return 'primary';
      case 'swachh_hr':
        return 'secondary';
      case 'driver':
        return 'success';
      default:
        return 'default';
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin':
        return 'Admin';
      case 'transport_contractor':
        return 'Contractor';
      case 'swachh_hr':
        return 'Swachh HR';
      case 'driver':
        return 'Driver';
      default:
        return role;
    }
  };

  const UsersTable = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>User</TableCell>
            <TableCell>Role</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Created</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar>
                    {user.fullName?.charAt(0) || 'U'}
                  </Avatar>
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      {user.fullName}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {user.email}
                    </Typography>
                  </Box>
                </Box>
              </TableCell>
              <TableCell>
                <Chip
                  label={getRoleLabel(user.role)}
                  color={getRoleColor(user.role)}
                  size="small"
                />
              </TableCell>
              <TableCell>
                <Chip
                  label={user.isActive ? 'Active' : 'Inactive'}
                  color={user.isActive ? 'success' : 'default'}
                  size="small"
                />
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {new Date(user.createdAt?.toDate?.() || user.createdAt).toLocaleDateString()}
                </Typography>
              </TableCell>
              <TableCell>
                <Box display="flex" gap={1}>
                  <Tooltip title={user.isActive ? 'Deactivate' : 'Activate'}>
                    <IconButton
                      size="small"
                      onClick={() => handleStatusChange(user.id, !user.isActive)}
                      color={user.isActive ? 'error' : 'success'}
                    >
                      {user.isActive ? <Block /> : <CheckCircle />}
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit">
                    <IconButton
                      size="small"
                      onClick={() => setEditDialog({ open: true, user })}
                    >
                      <Edit />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton
                      size="small"
                      onClick={() => setDeleteDialog({ open: true, user })}
                      color="error"
                    >
                      <Delete />
                    </IconButton>
                  </Tooltip>
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={users.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={(event, newPage) => setPage(newPage)}
        onRowsPerPageChange={(event) => {
          setRowsPerPage(parseInt(event.target.value, 10));
          setPage(0);
        }}
      />
    </TableContainer>
  );

  const ApprovalRequestsTable = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>User</TableCell>
            <TableCell>Role</TableCell>
            <TableCell>Requested</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {approvalRequests.map((request) => (
            <TableRow key={request.id}>
              <TableCell>
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar>
                    {request.fullName?.charAt(0) || 'U'}
                  </Avatar>
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      {request.fullName}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {request.email}
                    </Typography>
                  </Box>
                </Box>
              </TableCell>
              <TableCell>
                <Chip
                  label={getRoleLabel(request.role)}
                  color={getRoleColor(request.role)}
                  size="small"
                />
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {new Date(request.createdAt?.toDate?.() || request.createdAt).toLocaleDateString()}
                </Typography>
              </TableCell>
              <TableCell>
                <Box display="flex" gap={1}>
                  <Button
                    size="small"
                    variant="contained"
                    color="success"
                    startIcon={<CheckCircle />}
                    onClick={() => handleApproveRequest(request.id, true)}
                  >
                    Approve
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    startIcon={<Cancel />}
                    onClick={() => handleApproveRequest(request.id, false)}
                  >
                    Reject
                  </Button>
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          User Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<PersonAdd />}
          onClick={() => setEditDialog({ open: true, user: null })}
        >
          Add User
        </Button>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Tabs */}
      <Card>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label={`All Users (${users.length})`} />
          <Tab label={`Pending Approvals (${approvalRequests.length})`} />
        </Tabs>

        <CardContent>
          {tabValue === 0 && (
            <>
              {/* Filters */}
              <Box display="flex" gap={2} mb={3} flexWrap="wrap">
                <TextField
                  placeholder="Search users..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  InputProps={{
                    startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                  size="small"
                  sx={{ minWidth: 250 }}
                />
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={filters.role}
                    onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                    label="Role"
                  >
                    <MenuItem value="all">All Roles</MenuItem>
                    <MenuItem value="admin">Admin</MenuItem>
                    <MenuItem value="transport_contractor">Contractor</MenuItem>
                    <MenuItem value="swachh_hr">Swachh HR</MenuItem>
                    <MenuItem value="driver">Driver</MenuItem>
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    label="Status"
                  >
                    <MenuItem value="all">All Status</MenuItem>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                  </Select>
                </FormControl>
                <IconButton onClick={fetchUsers}>
                  <Refresh />
                </IconButton>
              </Box>

              <UsersTable />
            </>
          )}

          {tabValue === 1 && <ApprovalRequestsTable />}
        </CardContent>
      </Card>
    </Box>
  );
};

export default UserManagement;
