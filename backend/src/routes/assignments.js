// Assignment management routes for admin portal
const express = require('express');
const { db, COLLECTIONS } = require('../config/firebase');
const { requirePermission } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/assignments/vehicles
 * Get all vehicle assignments
 */
router.get('/vehicles', requirePermission('canManageAssignments'), async (req, res) => {
  try {
    const { status = 'all', assignmentType = 'all' } = req.query;

    let query = db.collection(COLLECTIONS.VEHICLE_ASSIGNMENTS);

    if (status !== 'all') {
      query = query.where('status', '==', status);
    }

    if (assignmentType !== 'all') {
      query = query.where('assignmentType', '==', assignmentType);
    }

    const snapshot = await query.orderBy('assignedAt', 'desc').get();
    const assignments = [];

    for (const doc of snapshot.docs) {
      const assignmentData = doc.data();
      
      // Get vehicle details
      const vehicleDoc = await db.collection(COLLECTIONS.VEHICLES).doc(assignmentData.vehicleId).get();
      const vehicleData = vehicleDoc.exists ? vehicleDoc.data() : null;

      // Get assignee details
      const assigneeDoc = await db.collection(COLLECTIONS.USERS).doc(assignmentData.assignedTo).get();
      const assigneeData = assigneeDoc.exists ? assigneeDoc.data() : null;

      assignments.push({
        id: doc.id,
        ...assignmentData,
        vehicle: vehicleData,
        assignee: assigneeData ? {
          id: assignmentData.assignedTo,
          fullName: assigneeData.fullName,
          email: assigneeData.email,
          role: assigneeData.role
        } : null
      });
    }

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
 * POST /api/assignments/vehicles
 * Create a new vehicle assignment
 */
router.post('/vehicles', requirePermission('canManageAssignments'), async (req, res) => {
  try {
    const {
      vehicleId,
      assignedTo,
      assignmentType,
      startDate,
      endDate,
      notes
    } = req.body;

    // Validate required fields
    if (!vehicleId || !assignedTo || !assignmentType) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle ID, assignee, and assignment type are required'
      });
    }

    // Check if vehicle exists and is available
    const vehicleDoc = await db.collection(COLLECTIONS.VEHICLES).doc(vehicleId).get();
    if (!vehicleDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    const vehicleData = vehicleDoc.data();
    if (vehicleData.status !== 'available') {
      return res.status(400).json({
        success: false,
        message: 'Vehicle is not available for assignment'
      });
    }

    // Check if assignee exists
    const assigneeDoc = await db.collection(COLLECTIONS.USERS).doc(assignedTo).get();
    if (!assigneeDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Assignee not found'
      });
    }

    // Create assignment
    const assignmentData = {
      vehicleId,
      assignedTo,
      assignmentType,
      assignedBy: req.user.uid,
      assignedAt: new Date(),
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : null,
      status: 'active',
      notes: notes || '',
      createdAt: new Date()
    };

    const docRef = await db.collection(COLLECTIONS.VEHICLE_ASSIGNMENTS).add(assignmentData);

    // Update vehicle status to assigned
    await db.collection(COLLECTIONS.VEHICLES).doc(vehicleId).update({
      status: 'assigned',
      updatedAt: new Date(),
      updatedBy: req.user.uid
    });

    res.status(201).json({
      success: true,
      message: 'Vehicle assignment created successfully',
      data: {
        id: docRef.id,
        ...assignmentData
      }
    });

  } catch (error) {
    console.error('Error creating vehicle assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create vehicle assignment'
    });
  }
});

/**
 * PUT /api/assignments/vehicles/:id/status
 * Update vehicle assignment status
 */
router.put('/vehicles/:id/status', requirePermission('canManageAssignments'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['active', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    // Get assignment
    const assignmentDoc = await db.collection(COLLECTIONS.VEHICLE_ASSIGNMENTS).doc(id).get();
    if (!assignmentDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    const assignmentData = assignmentDoc.data();

    // Update assignment status
    await db.collection(COLLECTIONS.VEHICLE_ASSIGNMENTS).doc(id).update({
      status,
      updatedAt: new Date(),
      updatedBy: req.user.uid,
      ...(status === 'completed' && { completedAt: new Date() }),
      ...(status === 'cancelled' && { cancelledAt: new Date() })
    });

    // If assignment is completed or cancelled, make vehicle available
    if (status === 'completed' || status === 'cancelled') {
      await db.collection(COLLECTIONS.VEHICLES).doc(assignmentData.vehicleId).update({
        status: 'available',
        updatedAt: new Date(),
        updatedBy: req.user.uid
      });
    }

    res.json({
      success: true,
      message: 'Assignment status updated successfully'
    });

  } catch (error) {
    console.error('Error updating assignment status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update assignment status'
    });
  }
});

/**
 * GET /api/assignments/feeder-points
 * Get all feeder point assignments
 */
router.get('/feeder-points', requirePermission('canManageAssignments'), async (req, res) => {
  try {
    const { status = 'all' } = req.query;

    let query = db.collection(COLLECTIONS.FEEDER_POINT_ASSIGNMENTS);

    if (status !== 'all') {
      query = query.where('status', '==', status);
    }

    const snapshot = await query.orderBy('assignedAt', 'desc').get();
    const assignments = [];

    for (const doc of snapshot.docs) {
      const assignmentData = doc.data();
      
      // Get feeder point details
      const feederPointDoc = await db.collection(COLLECTIONS.FEEDER_POINTS).doc(assignmentData.feederPointId).get();
      const feederPointData = feederPointDoc.exists ? feederPointDoc.data() : null;

      // Get assignee details
      const assigneeDoc = await db.collection(COLLECTIONS.USERS).doc(assignmentData.assignedTo).get();
      const assigneeData = assigneeDoc.exists ? assigneeDoc.data() : null;

      assignments.push({
        id: doc.id,
        ...assignmentData,
        feederPoint: feederPointData,
        assignee: assigneeData ? {
          id: assignmentData.assignedTo,
          fullName: assigneeData.fullName,
          email: assigneeData.email,
          role: assigneeData.role
        } : null
      });
    }

    res.json({
      success: true,
      data: assignments
    });

  } catch (error) {
    console.error('Error fetching feeder point assignments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feeder point assignments'
    });
  }
});

/**
 * POST /api/assignments/feeder-points
 * Create a new feeder point assignment
 */
router.post('/feeder-points', requirePermission('canManageAssignments'), async (req, res) => {
  try {
    const {
      feederPointId,
      assignedTo,
      startDate,
      endDate,
      notes
    } = req.body;

    // Validate required fields
    if (!feederPointId || !assignedTo) {
      return res.status(400).json({
        success: false,
        message: 'Feeder point ID and assignee are required'
      });
    }

    // Check if feeder point exists
    const feederPointDoc = await db.collection(COLLECTIONS.FEEDER_POINTS).doc(feederPointId).get();
    if (!feederPointDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Feeder point not found'
      });
    }

    // Check if assignee exists
    const assigneeDoc = await db.collection(COLLECTIONS.USERS).doc(assignedTo).get();
    if (!assigneeDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Assignee not found'
      });
    }

    // Create assignment
    const assignmentData = {
      feederPointId,
      assignedTo,
      assignedBy: req.user.uid,
      assignedAt: new Date(),
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : null,
      status: 'active',
      notes: notes || '',
      createdAt: new Date()
    };

    const docRef = await db.collection(COLLECTIONS.FEEDER_POINT_ASSIGNMENTS).add(assignmentData);

    res.status(201).json({
      success: true,
      message: 'Feeder point assignment created successfully',
      data: {
        id: docRef.id,
        ...assignmentData
      }
    });

  } catch (error) {
    console.error('Error creating feeder point assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create feeder point assignment'
    });
  }
});

/**
 * GET /api/assignments/stats
 * Get assignment statistics
 */
router.get('/stats', requirePermission('canManageAssignments'), async (req, res) => {
  try {
    // Get vehicle assignment stats
    const vehicleAssignmentsSnapshot = await db.collection(COLLECTIONS.VEHICLE_ASSIGNMENTS).get();
    const feederPointAssignmentsSnapshot = await db.collection(COLLECTIONS.FEEDER_POINT_ASSIGNMENTS).get();

    const stats = {
      vehicleAssignments: {
        total: 0,
        active: 0,
        completed: 0,
        cancelled: 0
      },
      feederPointAssignments: {
        total: 0,
        active: 0,
        completed: 0,
        cancelled: 0
      }
    };

    vehicleAssignmentsSnapshot.forEach(doc => {
      const assignment = doc.data();
      stats.vehicleAssignments.total++;
      if (assignment.status) {
        stats.vehicleAssignments[assignment.status] = (stats.vehicleAssignments[assignment.status] || 0) + 1;
      }
    });

    feederPointAssignmentsSnapshot.forEach(doc => {
      const assignment = doc.data();
      stats.feederPointAssignments.total++;
      if (assignment.status) {
        stats.feederPointAssignments[assignment.status] = (stats.feederPointAssignments[assignment.status] || 0) + 1;
      }
    });

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error fetching assignment stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assignment statistics'
    });
  }
});

module.exports = router;
