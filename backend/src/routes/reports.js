// Reports and analytics routes for admin portal
const express = require('express');
const { db, COLLECTIONS } = require('../config/firebase');
const { requirePermission } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/reports/dashboard
 * Get dashboard statistics and metrics
 */
router.get('/dashboard', async (req, res) => {
  try {
    const stats = {
      users: { total: 0, active: 0, pending: 0 },
      vehicles: { total: 0, available: 0, assigned: 0, maintenance: 0 },
      assignments: { total: 0, active: 0, completed: 0 },
      recentActivities: []
    };

    // Check if Firebase is available
    if (!db) {
      return res.status(503).json({
        success: false,
        message: 'Database not available'
      });
    }

    console.log('🔥 PRODUCTION MODE: Fetching REAL DASHBOARD DATA from Firebase');

    try {
      // Get user statistics
      const usersSnapshot = await db.collection(COLLECTIONS.USERS).get();
      usersSnapshot.forEach(doc => {
        const user = doc.data();
        stats.users.total++;
        if (user.isActive) stats.users.active++;
      });

      // Get pending approvals
      const approvalsSnapshot = await db.collection(COLLECTIONS.APPROVAL_REQUESTS)
        .where('status', '==', 'pending').get();
      stats.users.pending = approvalsSnapshot.size;
    } catch (error) {
      console.log('Users collection not accessible, using defaults');
    }

    try {
      // Get vehicle statistics
      const vehiclesSnapshot = await db.collection(COLLECTIONS.VEHICLES).get();
      vehiclesSnapshot.forEach(doc => {
        const vehicle = doc.data();
        stats.vehicles.total++;
        if (vehicle.status) {
          stats.vehicles[vehicle.status] = (stats.vehicles[vehicle.status] || 0) + 1;
        }
      });
    } catch (error) {
      console.log('Vehicles collection not accessible, using defaults');
    }

    try {
      // Get assignment statistics
      const assignmentsSnapshot = await db.collection(COLLECTIONS.VEHICLE_ASSIGNMENTS).get();
      assignmentsSnapshot.forEach(doc => {
        const assignment = doc.data();
        stats.assignments.total++;
        if (assignment.status) {
          stats.assignments[assignment.status] = (stats.assignments[assignment.status] || 0) + 1;
        }
      });
    } catch (error) {
      console.log('Assignments collection not accessible, using defaults');
    }

    try {
      // Get recent activities (last 10) - try both collection names
      let activitiesSnapshot;
      try {
        activitiesSnapshot = await db.collection('auditLogs')
          .orderBy('timestamp', 'desc')
          .limit(10)
          .get();
      } catch (e) {
        // Try alternative collection name
        activitiesSnapshot = await db.collection('audit_logs')
          .orderBy('timestamp', 'desc')
          .limit(10)
          .get();
      }

      activitiesSnapshot.forEach(doc => {
        stats.recentActivities.push({
          id: doc.id,
          ...doc.data()
        });
      });
    } catch (error) {
      console.log('Audit logs not accessible, using defaults');
      stats.recentActivities = [
        {
          id: '1',
          adminEmail: req.user?.email || 'admin@swachhnetra.com',
          action: 'Dashboard accessed',
          timestamp: new Date(),
          statusCode: 200
        }
      ];
    }

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics'
    });
  }
});

/**
 * GET /api/reports/users
 * Get user analytics and reports
 */
router.get('/users', requirePermission('canViewAllReports'), async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'month' } = req.query;

    let query = db.collection(COLLECTIONS.USERS);

    // Apply date filters if provided
    if (startDate) {
      query = query.where('createdAt', '>=', new Date(startDate));
    }
    if (endDate) {
      query = query.where('createdAt', '<=', new Date(endDate));
    }

    const snapshot = await query.get();
    const users = [];
    const roleStats = {};
    const registrationTrend = {};

    snapshot.forEach(doc => {
      const user = doc.data();
      users.push({ id: doc.id, ...user });

      // Count by role
      roleStats[user.role] = (roleStats[user.role] || 0) + 1;

      // Group by time period for trend analysis
      const createdAt = user.createdAt?.toDate?.() || new Date(user.createdAt);
      let periodKey;
      
      if (groupBy === 'day') {
        periodKey = createdAt.toISOString().split('T')[0];
      } else if (groupBy === 'week') {
        const weekStart = new Date(createdAt);
        weekStart.setDate(createdAt.getDate() - createdAt.getDay());
        periodKey = weekStart.toISOString().split('T')[0];
      } else {
        periodKey = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}`;
      }

      registrationTrend[periodKey] = (registrationTrend[periodKey] || 0) + 1;
    });

    res.json({
      success: true,
      data: {
        total: users.length,
        users,
        roleStats,
        registrationTrend: Object.entries(registrationTrend).map(([period, count]) => ({
          period,
          count
        })).sort((a, b) => a.period.localeCompare(b.period))
      }
    });

  } catch (error) {
    console.error('Error fetching user reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user reports'
    });
  }
});

/**
 * GET /api/reports/vehicles
 * Get vehicle analytics and reports
 */
router.get('/vehicles', requirePermission('canViewAllReports'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let query = db.collection(COLLECTIONS.VEHICLES);

    if (startDate) {
      query = query.where('createdAt', '>=', new Date(startDate));
    }
    if (endDate) {
      query = query.where('createdAt', '<=', new Date(endDate));
    }

    const snapshot = await query.get();
    const vehicles = [];
    const statusStats = {};
    const typeStats = {};
    const utilizationData = {};

    snapshot.forEach(doc => {
      const vehicle = doc.data();
      vehicles.push({ id: doc.id, ...vehicle });

      // Count by status
      statusStats[vehicle.status] = (statusStats[vehicle.status] || 0) + 1;

      // Count by type
      typeStats[vehicle.type] = (typeStats[vehicle.type] || 0) + 1;
    });

    // Get assignment data for utilization analysis
    const assignmentsSnapshot = await db.collection(COLLECTIONS.VEHICLE_ASSIGNMENTS).get();
    const assignmentsByVehicle = {};

    assignmentsSnapshot.forEach(doc => {
      const assignment = doc.data();
      if (!assignmentsByVehicle[assignment.vehicleId]) {
        assignmentsByVehicle[assignment.vehicleId] = [];
      }
      assignmentsByVehicle[assignment.vehicleId].push(assignment);
    });

    // Calculate utilization
    vehicles.forEach(vehicle => {
      const assignments = assignmentsByVehicle[vehicle.id] || [];
      const activeAssignments = assignments.filter(a => a.status === 'active').length;
      const totalAssignments = assignments.length;
      
      utilizationData[vehicle.id] = {
        vehicleId: vehicle.id,
        registrationNumber: vehicle.registrationNumber,
        activeAssignments,
        totalAssignments,
        utilizationRate: totalAssignments > 0 ? (activeAssignments / totalAssignments) * 100 : 0
      };
    });

    res.json({
      success: true,
      data: {
        total: vehicles.length,
        vehicles,
        statusStats,
        typeStats,
        utilization: Object.values(utilizationData)
      }
    });

  } catch (error) {
    console.error('Error fetching vehicle reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vehicle reports'
    });
  }
});

/**
 * GET /api/reports/assignments
 * Get assignment analytics and reports
 */
router.get('/assignments', requirePermission('canViewAllReports'), async (req, res) => {
  try {
    const { startDate, endDate, type = 'all' } = req.query;

    const collections = [];
    if (type === 'all' || type === 'vehicle') {
      collections.push({ name: COLLECTIONS.VEHICLE_ASSIGNMENTS, type: 'vehicle' });
    }
    if (type === 'all' || type === 'feeder') {
      collections.push({ name: COLLECTIONS.FEEDER_POINT_ASSIGNMENTS, type: 'feeder' });
    }

    const results = {
      vehicleAssignments: [],
      feederPointAssignments: [],
      statusStats: {},
      performanceMetrics: {}
    };

    for (const collection of collections) {
      let query = db.collection(collection.name);

      if (startDate) {
        query = query.where('assignedAt', '>=', new Date(startDate));
      }
      if (endDate) {
        query = query.where('assignedAt', '<=', new Date(endDate));
      }

      const snapshot = await query.get();
      const assignments = [];

      snapshot.forEach(doc => {
        const assignment = doc.data();
        assignments.push({ id: doc.id, ...assignment });

        // Count by status
        const key = `${collection.type}_${assignment.status}`;
        results.statusStats[key] = (results.statusStats[key] || 0) + 1;
      });

      if (collection.type === 'vehicle') {
        results.vehicleAssignments = assignments;
      } else {
        results.feederPointAssignments = assignments;
      }
    }

    // Calculate performance metrics
    const allAssignments = [...results.vehicleAssignments, ...results.feederPointAssignments];
    const completedAssignments = allAssignments.filter(a => a.status === 'completed');
    const activeAssignments = allAssignments.filter(a => a.status === 'active');

    results.performanceMetrics = {
      totalAssignments: allAssignments.length,
      completedAssignments: completedAssignments.length,
      activeAssignments: activeAssignments.length,
      completionRate: allAssignments.length > 0 ? (completedAssignments.length / allAssignments.length) * 100 : 0,
      averageAssignmentDuration: calculateAverageAssignmentDuration(completedAssignments)
    };

    res.json({
      success: true,
      data: results
    });

  } catch (error) {
    console.error('Error fetching assignment reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assignment reports'
    });
  }
});

/**
 * GET /api/reports/export
 * Export reports in various formats
 */
router.get('/export', requirePermission('canGenerateReports'), async (req, res) => {
  try {
    const { type, format = 'json', startDate, endDate } = req.query;

    let data = {};

    switch (type) {
      case 'users':
        const usersSnapshot = await db.collection(COLLECTIONS.USERS).get();
        data.users = [];
        usersSnapshot.forEach(doc => {
          const user = doc.data();
          // Remove sensitive data
          const { password, ...safeUser } = user;
          data.users.push({ id: doc.id, ...safeUser });
        });
        break;

      case 'vehicles':
        const vehiclesSnapshot = await db.collection(COLLECTIONS.VEHICLES).get();
        data.vehicles = [];
        vehiclesSnapshot.forEach(doc => {
          data.vehicles.push({ id: doc.id, ...doc.data() });
        });
        break;

      case 'assignments':
        const assignmentsSnapshot = await db.collection(COLLECTIONS.VEHICLE_ASSIGNMENTS).get();
        data.assignments = [];
        assignmentsSnapshot.forEach(doc => {
          data.assignments.push({ id: doc.id, ...doc.data() });
        });
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid export type'
        });
    }

    // Set appropriate headers for download
    const filename = `${type}_report_${new Date().toISOString().split('T')[0]}.${format}`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      // Convert to CSV (simplified implementation)
      const csv = convertToCSV(data);
      res.send(csv);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.json({
        success: true,
        data,
        exportedAt: new Date().toISOString(),
        type,
        format
      });
    }

  } catch (error) {
    console.error('Error exporting reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export reports'
    });
  }
});

// Helper functions
function calculateAverageAssignmentDuration(assignments) {
  if (assignments.length === 0) return 0;

  const durations = assignments
    .filter(a => a.assignedAt && a.completedAt)
    .map(a => {
      const start = a.assignedAt.toDate ? a.assignedAt.toDate() : new Date(a.assignedAt);
      const end = a.completedAt.toDate ? a.completedAt.toDate() : new Date(a.completedAt);
      return (end - start) / (1000 * 60 * 60 * 24); // Duration in days
    });

  return durations.length > 0 ? durations.reduce((sum, duration) => sum + duration, 0) / durations.length : 0;
}

function convertToCSV(data) {
  // Simplified CSV conversion
  const items = Object.values(data)[0];
  if (!items || items.length === 0) return '';

  const headers = Object.keys(items[0]);
  const csvRows = [headers.join(',')];

  items.forEach(item => {
    const values = headers.map(header => {
      const value = item[header];
      return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
    });
    csvRows.push(values.join(','));
  });

  return csvRows.join('\n');
}

module.exports = router;
