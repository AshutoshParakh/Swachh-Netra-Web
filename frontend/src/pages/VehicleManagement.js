// Vehicle Management page
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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Tooltip,
  Grid,
  CircularProgress
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Search,
  Refresh,
  DirectionsCar,
  Build,
  Assignment,
  Warning
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import VehicleDialog from '../components/VehicleDialog';

const VehicleManagement = () => {
  const { getIdToken } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Filters and pagination
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    type: 'all'
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Dialog states
  const [vehicleDialog, setVehicleDialog] = useState({ open: false, vehicle: null });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, vehicle: null });

  // Remove unused form state - now handled by VehicleDialog

  useEffect(() => {
    fetchVehicles();
  }, [filters, page, rowsPerPage]);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: page + 1,
        limit: rowsPerPage,
        ...filters
      };

      const response = await apiService.vehicles.getAll(params);

      if (response.data.success) {
        setVehicles(response.data.data.vehicles || []);
      } else {
        setError(response.data.message || 'Failed to fetch vehicles');
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      setError('Failed to fetch vehicles. Please try again.');

      // Set empty array as fallback
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveVehicle = async (vehicleData) => {
    try {
      setLoading(true);
      setError(null);

      const isEdit = vehicleDialog.vehicle !== null;
      let response;

      if (isEdit) {
        response = await apiService.vehicles.update(vehicleDialog.vehicle.id, vehicleData);
      } else {
        response = await apiService.vehicles.create(vehicleData);
      }

      if (response.data.success) {
        setSuccess(response.data.message);
        setVehicleDialog({ open: false, vehicle: null });
        fetchVehicles();
      } else {
        setError(response.data.message);
      }
    } catch (error) {
      console.error('Error saving vehicle:', error);
      setError('Failed to save vehicle. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVehicle = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiService.vehicles.delete(deleteDialog.vehicle.id);

      if (response.data.success) {
        setSuccess(response.data.message);
        setDeleteDialog({ open: false, vehicle: null });
        fetchVehicles();
      } else {
        setError(response.data.message);
      }
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      setError('Failed to delete vehicle. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (vehicleId, newStatus) => {
    try {
      setError(null);

      const response = await apiService.vehicles.updateStatus(vehicleId, newStatus);

      if (response.data.success) {
        setSuccess(response.data.message);
        fetchVehicles();
      } else {
        setError(response.data.message);
      }
    } catch (error) {
      console.error('Error updating vehicle status:', error);
      setError('Failed to update vehicle status. Please try again.');
    }
  };

  const openEditDialog = (vehicle) => {
    setVehicleDialog({ open: true, vehicle });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available':
        return 'success';
      case 'assigned':
        return 'primary';
      case 'maintenance':
        return 'warning';
      case 'out_of_service':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'available':
        return 'Available';
      case 'assigned':
        return 'Assigned';
      case 'maintenance':
        return 'Maintenance';
      case 'out_of_service':
        return 'Out of Service';
      default:
        return status;
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'truck':
        return '🚛';
      case 'van':
        return '🚐';
      case 'car':
        return '🚗';
      default:
        return '🚗';
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Vehicle Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setVehicleDialog({ open: true, vehicle: null })}
        >
          Add Vehicle
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

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" gap={2} flexWrap="wrap">
            <TextField
              placeholder="Search vehicles..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
              }}
              size="small"
              sx={{ minWidth: 250 }}
            />
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                label="Status"
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="available">Available</MenuItem>
                <MenuItem value="assigned">Assigned</MenuItem>
                <MenuItem value="maintenance">Maintenance</MenuItem>
                <MenuItem value="out_of_service">Out of Service</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Type</InputLabel>
              <Select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                label="Type"
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="truck">Truck</MenuItem>
                <MenuItem value="van">Van</MenuItem>
                <MenuItem value="car">Car</MenuItem>
              </Select>
            </FormControl>
            <IconButton onClick={fetchVehicles}>
              <Refresh />
            </IconButton>
          </Box>
        </CardContent>
      </Card>

      {/* Vehicles Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Vehicle</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Capacity</TableCell>
                <TableCell>Fuel Type</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <CircularProgress />
                    <Typography variant="body2" sx={{ mt: 2 }}>
                      Loading vehicles...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : vehicles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="textSecondary">
                      No vehicles found. Click "Add Vehicle" to get started.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                vehicles.map((vehicle) => (
                <TableRow key={vehicle.id}>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Typography variant="h6">
                        {getTypeIcon(vehicle.type)}
                      </Typography>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {vehicle.registrationNumber}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {vehicle.make} {vehicle.model} {vehicle.year}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                      {vehicle.type}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusLabel(vehicle.status)}
                      color={getStatusColor(vehicle.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {vehicle.capacity ? `${vehicle.capacity} tons` : 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                      {vehicle.fuelType || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={1}>
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => openEditDialog(vehicle)}
                        >
                          <Edit />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Maintenance">
                        <IconButton
                          size="small"
                          onClick={() => handleStatusChange(vehicle.id, 'maintenance')}
                          color="warning"
                        >
                          <Build />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          onClick={() => setDeleteDialog({ open: true, vehicle })}
                          color="error"
                        >
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={vehicles.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(event, newPage) => setPage(newPage)}
            onRowsPerPageChange={(event) => {
              setRowsPerPage(parseInt(event.target.value, 10));
              setPage(0);
            }}
          />
        </TableContainer>
      </Card>

      {/* Vehicle Dialog */}
      <VehicleDialog
        open={vehicleDialog.open}
        onClose={() => setVehicleDialog({ open: false, vehicle: null })}
        vehicle={vehicleDialog.vehicle}
        onSave={handleSaveVehicle}
        loading={loading}
        error={error}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, vehicle: null })}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete vehicle "{deleteDialog.vehicle?.registrationNumber}"?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, vehicle: null })}>
            Cancel
          </Button>
          <Button onClick={handleDeleteVehicle} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VehicleManagement;
