// Vehicle Add/Edit Dialog Component
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  CircularProgress
} from '@mui/material';

const VehicleDialog = ({ 
  open, 
  onClose, 
  vehicle = null, 
  onSave,
  loading = false,
  error = null 
}) => {
  const [formData, setFormData] = useState({
    registrationNumber: '',
    make: '',
    model: '',
    year: '',
    type: '',
    capacity: '',
    fuelType: '',
    status: 'available'
  });

  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (vehicle) {
      // Edit mode - populate form with vehicle data
      setFormData({
        registrationNumber: vehicle.registrationNumber || '',
        make: vehicle.make || '',
        model: vehicle.model || '',
        year: vehicle.year || '',
        type: vehicle.type || '',
        capacity: vehicle.capacity || '',
        fuelType: vehicle.fuelType || '',
        status: vehicle.status || 'available'
      });
    } else {
      // Add mode - reset form
      setFormData({
        registrationNumber: '',
        make: '',
        model: '',
        year: '',
        type: '',
        capacity: '',
        fuelType: '',
        status: 'available'
      });
    }
    setFormErrors({});
  }, [vehicle, open]);

  const validateForm = () => {
    const errors = {};

    if (!formData.registrationNumber.trim()) {
      errors.registrationNumber = 'Registration number is required';
    }

    if (!formData.make.trim()) {
      errors.make = 'Make is required';
    }

    if (!formData.model.trim()) {
      errors.model = 'Model is required';
    }

    if (!formData.type) {
      errors.type = 'Vehicle type is required';
    }

    if (formData.year && (formData.year < 1900 || formData.year > new Date().getFullYear() + 1)) {
      errors.year = 'Please enter a valid year';
    }

    if (formData.capacity && formData.capacity <= 0) {
      errors.capacity = 'Capacity must be greater than 0';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSave(formData);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error for this field when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      disableEscapeKeyDown={loading}
    >
      <DialogTitle>
        {vehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Registration Number"
              value={formData.registrationNumber}
              onChange={(e) => handleChange('registrationNumber', e.target.value.toUpperCase())}
              error={!!formErrors.registrationNumber}
              helperText={formErrors.registrationNumber}
              required
              disabled={loading}
              placeholder="e.g., MH01AB1234"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required error={!!formErrors.type}>
              <InputLabel>Vehicle Type</InputLabel>
              <Select
                value={formData.type}
                onChange={(e) => handleChange('type', e.target.value)}
                label="Vehicle Type"
                disabled={loading}
              >
                <MenuItem value="truck">Truck</MenuItem>
                <MenuItem value="van">Van</MenuItem>
                <MenuItem value="car">Car</MenuItem>
                <MenuItem value="auto">Auto Rickshaw</MenuItem>
                <MenuItem value="bike">Motorcycle</MenuItem>
              </Select>
              {formErrors.type && (
                <Alert severity="error" sx={{ mt: 1 }}>
                  {formErrors.type}
                </Alert>
              )}
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Make"
              value={formData.make}
              onChange={(e) => handleChange('make', e.target.value)}
              error={!!formErrors.make}
              helperText={formErrors.make}
              required
              disabled={loading}
              placeholder="e.g., Tata, Mahindra, Maruti"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Model"
              value={formData.model}
              onChange={(e) => handleChange('model', e.target.value)}
              error={!!formErrors.model}
              helperText={formErrors.model}
              required
              disabled={loading}
              placeholder="e.g., Ace, Bolero, Swift"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Year"
              type="number"
              value={formData.year}
              onChange={(e) => handleChange('year', parseInt(e.target.value) || '')}
              error={!!formErrors.year}
              helperText={formErrors.year}
              disabled={loading}
              inputProps={{ min: 1900, max: new Date().getFullYear() + 1 }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Capacity (tons)"
              type="number"
              value={formData.capacity}
              onChange={(e) => handleChange('capacity', parseFloat(e.target.value) || '')}
              error={!!formErrors.capacity}
              helperText={formErrors.capacity}
              disabled={loading}
              inputProps={{ min: 0, step: 0.1 }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Fuel Type</InputLabel>
              <Select
                value={formData.fuelType}
                onChange={(e) => handleChange('fuelType', e.target.value)}
                label="Fuel Type"
                disabled={loading}
              >
                <MenuItem value="petrol">Petrol</MenuItem>
                <MenuItem value="diesel">Diesel</MenuItem>
                <MenuItem value="cng">CNG</MenuItem>
                <MenuItem value="electric">Electric</MenuItem>
                <MenuItem value="hybrid">Hybrid</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                label="Status"
                disabled={loading}
              >
                <MenuItem value="available">Available</MenuItem>
                <MenuItem value="assigned">Assigned</MenuItem>
                <MenuItem value="maintenance">Maintenance</MenuItem>
                <MenuItem value="out_of_service">Out of Service</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button 
          onClick={onClose} 
          disabled={loading}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Saving...' : (vehicle ? 'Update Vehicle' : 'Add Vehicle')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default VehicleDialog;
