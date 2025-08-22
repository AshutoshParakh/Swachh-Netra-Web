// Assignment Management page
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Grid,
  Avatar,
  Tooltip
} from '@mui/material';
import {
  Add,
  Edit,
  CheckCircle,
  Cancel,
  Assignment as AssignmentIcon,
  DirectionsCar,
  LocationOn,
  Person
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const AssignmentManagement = () => {
  const { getIdToken } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [vehicleAssignments, setVehicleAssignments] = useState([]);
  const [feederPointAssignments, setFeederPointAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Dialog states
  const [assignmentDialog, setAssignmentDialog] = useState({ 
    open: false, 
    type: 'vehicle', 
    assignment: null 
  });

  // Form state
  const [formData, setFormData] = useState({
    vehicleId: '',
    feederPointId: '',
    assignedTo: '',
    assignmentType: 'admin_to_contractor',
    startDate: '',
    endDate: '',
    notes: ''
  });

  // Available options
  const [vehicles, setVehicles] = useState([]);
  const [users, setUsers] = useState([]);
  const [feederPoints, setFeederPoints] = useState([]);

  useEffect(() => {
    fetchAssignments();
    fetchOptions();
  }, []);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const token = await getIdToken();

      // Fetch vehicle assignments
      const vehicleResponse = await fetch('/api/assignments/vehicles', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const vehicleData = await vehicleResponse.json();
      if (vehicleData.success) {
        setVehicleAssignments(vehicleData.data);
      }

      // Fetch feeder point assignments
      const feederResponse = await fetch('/api/assignments/feeder-points', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const feederData = await feederResponse.json();
      if (feederData.success) {
        setFeederPointAssignments(feederData.data);
      }

    } catch (error) {
      console.error('Error fetching assignments:', error);
      setError('Failed to fetch assignments');
    } finally {
      setLoading(false);
    }
  };

  const fetchOptions = async () => {
    try {
      const token = await getIdToken();

      // Fetch available vehicles
      const vehicleResponse = await fetch('/api/vehicles?status=available', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const vehicleData = await vehicleResponse.json();
      if (vehicleData.success) {
        setVehicles(vehicleData.data.vehicles);
      }

      // Fetch users (contractors and drivers)
      const userResponse = await fetch('/api/users?role=transport_contractor', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const userData = await userResponse.json();
      if (userData.success) {
        setUsers(userData.data.users);
      }

      // Note: Feeder points would be fetched from a feeder points API
      // For now, using mock data
      setFeederPoints([
        { id: '1', name: 'Central Market', location: 'Downtown' },
        { id: '2', name: 'Residential Area A', location: 'North Zone' },
        { id: '3', name: 'Industrial Zone', location: 'East Zone' }
      ]);

    } catch (error) {
      console.error('Error fetching options:', error);
    }
  };

  const handleCreateAssignment = async () => {
    try {
      const token = await getIdToken();
      const endpoint = assignmentDialog.type === 'vehicle' 
        ? '/api/assignments/vehicles'
        : '/api/assignments/feeder-points';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess(data.message);
        setAssignmentDialog({ open: false, type: 'vehicle', assignment: null });
        resetForm();
        fetchAssignments();
      } else {
        setError(data.message);
      }
    } catch (error) {
      console.error('Error creating assignment:', error);
      setError('Failed to create assignment');
    }
  };

  const handleStatusChange = async (assignmentId, status, type) => {
    try {
      const token = await getIdToken();
      const endpoint = type === 'vehicle'
        ? `/api/assignments/vehicles/${assignmentId}/status`
        : `/api/assignments/feeder-points/${assignmentId}/status`;

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess(data.message);
        fetchAssignments();
      } else {
        setError(data.message);
      }
    } catch (error) {
      console.error('Error updating assignment status:', error);
      setError('Failed to update assignment status');
    }
  };

  const resetForm = () => {
    setFormData({
      vehicleId: '',
      feederPointId: '',
      assignedTo: '',
      assignmentType: 'admin_to_contractor',
      startDate: '',
      endDate: '',
      notes: ''
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'completed':
        return 'primary';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const VehicleAssignmentsTable = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Vehicle</TableCell>
            <TableCell>Assigned To</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Start Date</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {vehicleAssignments.map((assignment) => (
            <TableRow key={assignment.id}>
              <TableCell>
                <Box display="flex" alignItems="center" gap={2}>
                  <DirectionsCar color="primary" />
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      {assignment.vehicle?.registrationNumber || 'N/A'}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {assignment.vehicle?.make} {assignment.vehicle?.model}
                    </Typography>
                  </Box>
                </Box>
              </TableCell>
              <TableCell>
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar sx={{ width: 32, height: 32 }}>
                    {assignment.assignee?.fullName?.charAt(0) || 'U'}
                  </Avatar>
                  <Box>
                    <Typography variant="body2">
                      {assignment.assignee?.fullName || 'Unknown'}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {assignment.assignee?.role}
                    </Typography>
                  </Box>
                </Box>
              </TableCell>
              <TableCell>
                <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                  {assignment.assignmentType?.replace('_', ' to ')}
                </Typography>
              </TableCell>
              <TableCell>
                <Chip
                  label={assignment.status}
                  color={getStatusColor(assignment.status)}
                  size="small"
                  sx={{ textTransform: 'capitalize' }}
                />
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {new Date(assignment.startDate?.toDate?.() || assignment.startDate).toLocaleDateString()}
                </Typography>
              </TableCell>
              <TableCell>
                <Box display="flex" gap={1}>
                  {assignment.status === 'active' && (
                    <>
                      <Tooltip title="Complete">
                        <IconButton
                          size="small"
                          onClick={() => handleStatusChange(assignment.id, 'completed', 'vehicle')}
                          color="success"
                        >
                          <CheckCircle />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Cancel">
                        <IconButton
                          size="small"
                          onClick={() => handleStatusChange(assignment.id, 'cancelled', 'vehicle')}
                          color="error"
                        >
                          <Cancel />
                        </IconButton>
                      </Tooltip>
                    </>
                  )}
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const FeederPointAssignmentsTable = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Feeder Point</TableCell>
            <TableCell>Assigned To</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Start Date</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {feederPointAssignments.map((assignment) => (
            <TableRow key={assignment.id}>
              <TableCell>
                <Box display="flex" alignItems="center" gap={2}>
                  <LocationOn color="primary" />
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      {assignment.feederPoint?.name || 'N/A'}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {assignment.feederPoint?.location}
                    </Typography>
                  </Box>
                </Box>
              </TableCell>
              <TableCell>
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar sx={{ width: 32, height: 32 }}>
                    {assignment.assignee?.fullName?.charAt(0) || 'U'}
                  </Avatar>
                  <Box>
                    <Typography variant="body2">
                      {assignment.assignee?.fullName || 'Unknown'}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {assignment.assignee?.role}
                    </Typography>
                  </Box>
                </Box>
              </TableCell>
              <TableCell>
                <Chip
                  label={assignment.status}
                  color={getStatusColor(assignment.status)}
                  size="small"
                  sx={{ textTransform: 'capitalize' }}
                />
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {new Date(assignment.startDate?.toDate?.() || assignment.startDate).toLocaleDateString()}
                </Typography>
              </TableCell>
              <TableCell>
                <Box display="flex" gap={1}>
                  {assignment.status === 'active' && (
                    <>
                      <Tooltip title="Complete">
                        <IconButton
                          size="small"
                          onClick={() => handleStatusChange(assignment.id, 'completed', 'feeder')}
                          color="success"
                        >
                          <CheckCircle />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Cancel">
                        <IconButton
                          size="small"
                          onClick={() => handleStatusChange(assignment.id, 'cancelled', 'feeder')}
                          color="error"
                        >
                          <Cancel />
                        </IconButton>
                      </Tooltip>
                    </>
                  )}
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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Assignment Management
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => {
              resetForm();
              setAssignmentDialog({ open: true, type: 'vehicle', assignment: null });
            }}
          >
            Assign Vehicle
          </Button>
          <Button
            variant="outlined"
            startIcon={<Add />}
            onClick={() => {
              resetForm();
              setAssignmentDialog({ open: true, type: 'feeder', assignment: null });
            }}
          >
            Assign Feeder Point
          </Button>
        </Box>
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
          <Tab 
            label={`Vehicle Assignments (${vehicleAssignments.length})`}
            icon={<DirectionsCar />}
            iconPosition="start"
          />
          <Tab 
            label={`Feeder Point Assignments (${feederPointAssignments.length})`}
            icon={<LocationOn />}
            iconPosition="start"
          />
        </Tabs>

        <CardContent>
          {tabValue === 0 && <VehicleAssignmentsTable />}
          {tabValue === 1 && <FeederPointAssignmentsTable />}
        </CardContent>
      </Card>

      {/* Assignment Dialog */}
      <Dialog
        open={assignmentDialog.open}
        onClose={() => setAssignmentDialog({ open: false, type: 'vehicle', assignment: null })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {assignmentDialog.type === 'vehicle' ? 'Assign Vehicle' : 'Assign Feeder Point'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {assignmentDialog.type === 'vehicle' ? (
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Vehicle</InputLabel>
                  <Select
                    value={formData.vehicleId}
                    onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                    label="Vehicle"
                  >
                    {vehicles.map((vehicle) => (
                      <MenuItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.registrationNumber} - {vehicle.make} {vehicle.model}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            ) : (
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Feeder Point</InputLabel>
                  <Select
                    value={formData.feederPointId}
                    onChange={(e) => setFormData({ ...formData, feederPointId: e.target.value })}
                    label="Feeder Point"
                  >
                    {feederPoints.map((point) => (
                      <MenuItem key={point.id} value={point.id}>
                        {point.name} - {point.location}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}

            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Assign To</InputLabel>
                <Select
                  value={formData.assignedTo}
                  onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                  label="Assign To"
                >
                  {users.map((user) => (
                    <MenuItem key={user.id} value={user.id}>
                      {user.fullName} - {user.role}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {assignmentDialog.type === 'vehicle' && (
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Assignment Type</InputLabel>
                  <Select
                    value={formData.assignmentType}
                    onChange={(e) => setFormData({ ...formData, assignmentType: e.target.value })}
                    label="Assignment Type"
                  >
                    <MenuItem value="admin_to_contractor">Admin to Contractor</MenuItem>
                    <MenuItem value="contractor_to_driver">Contractor to Driver</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="End Date"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignmentDialog({ open: false, type: 'vehicle', assignment: null })}>
            Cancel
          </Button>
          <Button onClick={handleCreateAssignment} variant="contained">
            Create Assignment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AssignmentManagement;
