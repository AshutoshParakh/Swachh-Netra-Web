// Vehicle management routes for admin portal
const express = require('express');
const { db, COLLECTIONS } = require('../config/firebase');
const { getVehicles } = require('../config/firebase-web');
const { requirePermission } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/vehicles
 * Get all vehicles with pagination and filtering
 */
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      type,
      search
    } = req.query;

    console.log('🔥 PRODUCTION MODE: Fetching REAL VEHICLES from Firebase database');

    // Get real vehicles from Firebase using web API
    let vehicles = await getVehicles();

    // Apply filters
    if (status && status !== 'all') {
      vehicles = vehicles.filter(vehicle => vehicle.status === status);
    }

    if (type && type !== 'all') {
      vehicles = vehicles.filter(vehicle => vehicle.type === type);
    }

    // Apply search filter (client-side for simplicity)
    if (search) {
      const searchLower = search.toLowerCase();
      vehicles = vehicles.filter(vehicle =>
        vehicle.registrationNumber?.toLowerCase().includes(searchLower) ||
        vehicle.model?.toLowerCase().includes(searchLower) ||
        vehicle.make?.toLowerCase().includes(searchLower)
      );
    }

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedVehicles = vehicles.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: {
        vehicles: paginatedVehicles,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: vehicles.length,
          pages: Math.ceil(vehicles.length / limit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching vehicles:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vehicles'
    });
  }
});

/**
 * POST /api/vehicles
 * Create a new vehicle
 */
router.post('/', async (req, res) => {
  try {
    const {
      registrationNumber,
      make,
      model,
      year,
      type,
      capacity,
      fuelType,
      status = 'available'
    } = req.body;

    // Validate required fields
    if (!registrationNumber || !make || !model || !type) {
      return res.status(400).json({
        success: false,
        message: 'Registration number, make, model, and type are required'
      });
    }

    // Handle case where Firebase might not be available
    if (!db) {
      return res.status(503).json({
        success: false,
        message: 'Database not available. Please try again later.'
      });
    }

    try {
      // Check if registration number already exists
      const existingVehicle = await db.collection(COLLECTIONS.VEHICLES)
        .where('registrationNumber', '==', registrationNumber.toUpperCase())
        .get();

      if (!existingVehicle.empty) {
        return res.status(400).json({
          success: false,
          message: 'Vehicle with this registration number already exists'
        });
      }
    } catch (checkError) {
      console.log('Could not check for existing vehicles, proceeding with creation');
    }

    // Create vehicle document
    const vehicleData = {
      registrationNumber: registrationNumber.toUpperCase(),
      make,
      model,
      year: year ? parseInt(year) : null,
      type,
      capacity: capacity ? parseFloat(capacity) : null,
      fuelType,
      status,
      createdAt: new Date(),
      createdBy: req.user?.uid || 'demo-admin',
      updatedAt: new Date()
    };

    const docRef = await db.collection(COLLECTIONS.VEHICLES).add(vehicleData);

    res.status(201).json({
      success: true,
      message: 'Vehicle created successfully',
      data: {
        id: docRef.id,
        ...vehicleData
      }
    });

  } catch (error) {
    console.error('Error creating vehicle:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create vehicle. Please try again.'
    });
  }
});

/**
 * PUT /api/vehicles/:id
 * Update a vehicle
 */
router.put('/:id', requirePermission('canManageVehicles'), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    
    // Remove fields that shouldn't be updated
    delete updateData.id;
    delete updateData.createdAt;
    delete updateData.createdBy;
    
    // Add update metadata
    updateData.updatedAt = new Date();
    updateData.updatedBy = req.user.uid;

    // Check if vehicle exists
    const vehicleDoc = await db.collection(COLLECTIONS.VEHICLES).doc(id).get();
    
    if (!vehicleDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    // If updating registration number, check for duplicates
    if (updateData.registrationNumber) {
      const existingVehicle = await db.collection(COLLECTIONS.VEHICLES)
        .where('registrationNumber', '==', updateData.registrationNumber)
        .get();

      if (!existingVehicle.empty && existingVehicle.docs[0].id !== id) {
        return res.status(400).json({
          success: false,
          message: 'Vehicle with this registration number already exists'
        });
      }
    }

    await db.collection(COLLECTIONS.VEHICLES).doc(id).update(updateData);

    res.json({
      success: true,
      message: 'Vehicle updated successfully'
    });

  } catch (error) {
    console.error('Error updating vehicle:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update vehicle'
    });
  }
});

/**
 * DELETE /api/vehicles/:id
 * Delete a vehicle
 */
router.delete('/:id', requirePermission('canManageVehicles'), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if vehicle exists
    const vehicleDoc = await db.collection(COLLECTIONS.VEHICLES).doc(id).get();
    
    if (!vehicleDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    // Check if vehicle is assigned
    const assignments = await db.collection(COLLECTIONS.VEHICLE_ASSIGNMENTS)
      .where('vehicleId', '==', id)
      .where('status', '==', 'active')
      .get();

    if (!assignments.empty) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete vehicle with active assignments'
      });
    }

    await db.collection(COLLECTIONS.VEHICLES).doc(id).delete();

    res.json({
      success: true,
      message: 'Vehicle deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting vehicle:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete vehicle'
    });
  }
});

/**
 * GET /api/vehicles/:id/assignments
 * Get vehicle assignment history
 */
router.get('/:id/assignments', requirePermission('canManageVehicles'), async (req, res) => {
  try {
    const { id } = req.params;

    const snapshot = await db.collection(COLLECTIONS.VEHICLE_ASSIGNMENTS)
      .where('vehicleId', '==', id)
      .orderBy('assignedAt', 'desc')
      .get();

    const assignments = [];
    snapshot.forEach(doc => {
      assignments.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json({
      success: true,
      data: assignments
    });

  } catch (error) {
    console.error('Error fetching vehicle assignments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vehicle assignments'
    });
  }
});

/**
 * PUT /api/vehicles/:id/status
 * Update vehicle status
 */
router.put('/:id/status', requirePermission('canManageVehicles'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['available', 'assigned', 'maintenance', 'out_of_service'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    await db.collection(COLLECTIONS.VEHICLES).doc(id).update({
      status,
      updatedAt: new Date(),
      updatedBy: req.user.uid
    });

    res.json({
      success: true,
      message: 'Vehicle status updated successfully'
    });

  } catch (error) {
    console.error('Error updating vehicle status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update vehicle status'
    });
  }
});

/**
 * GET /api/vehicles/stats
 * Get vehicle statistics
 */
router.get('/stats', requirePermission('canManageVehicles'), async (req, res) => {
  try {
    const snapshot = await db.collection(COLLECTIONS.VEHICLES).get();

    const stats = {
      total: 0,
      available: 0,
      assigned: 0,
      maintenance: 0,
      out_of_service: 0,
      byType: {}
    };

    snapshot.forEach(doc => {
      const vehicle = doc.data();
      stats.total++;

      if (vehicle.status) {
        stats[vehicle.status] = (stats[vehicle.status] || 0) + 1;
      }

      if (vehicle.type) {
        stats.byType[vehicle.type] = (stats.byType[vehicle.type] || 0) + 1;
      }
    });

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error fetching vehicle stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vehicle statistics'
    });
  }
});

/**
 * GET /api/vehicles/available
 * Get available vehicles for assignment
 */
router.get('/available', requirePermission('canManageVehicles'), async (req, res) => {
  try {
    const snapshot = await db.collection(COLLECTIONS.VEHICLES)
      .where('status', '==', 'available')
      .get();

    const vehicles = [];
    snapshot.forEach(doc => {
      vehicles.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json({
      success: true,
      data: vehicles
    });

  } catch (error) {
    console.error('Error fetching available vehicles:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available vehicles'
    });
  }
});

module.exports = router;
