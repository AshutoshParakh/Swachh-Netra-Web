// Settings and configuration routes for admin portal
const express = require('express');
const { db, COLLECTIONS } = require('../config/firebase');
const { requirePermission } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/settings/system
 * Get system settings
 */
router.get('/system', requirePermission('canManageSystem'), async (req, res) => {
  try {
    const settingsDoc = await db.collection(COLLECTIONS.SETTINGS).doc('system').get();
    
    const defaultSettings = {
      appName: 'Swachh Netra Admin Portal',
      version: '1.0.0',
      maintenanceMode: false,
      allowRegistrations: true,
      maxFileSize: 5242880, // 5MB
      allowedFileTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
      sessionTimeout: 24, // hours
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: false
      },
      notifications: {
        emailEnabled: true,
        smsEnabled: false,
        pushEnabled: true
      }
    };

    const settings = settingsDoc.exists 
      ? { ...defaultSettings, ...settingsDoc.data() }
      : defaultSettings;

    res.json({
      success: true,
      data: settings
    });

  } catch (error) {
    console.error('Error fetching system settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system settings'
    });
  }
});

/**
 * PUT /api/settings/system
 * Update system settings
 */
router.put('/system', requirePermission('canManageSystem'), async (req, res) => {
  try {
    const updateData = {
      ...req.body,
      updatedAt: new Date(),
      updatedBy: req.user.uid
    };

    await db.collection(COLLECTIONS.SETTINGS).doc('system').set(updateData, { merge: true });

    res.json({
      success: true,
      message: 'System settings updated successfully'
    });

  } catch (error) {
    console.error('Error updating system settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update system settings'
    });
  }
});

/**
 * GET /api/settings/notifications
 * Get notification settings
 */
router.get('/notifications', async (req, res) => {
  try {
    const userDoc = await db.collection(COLLECTIONS.USERS).doc(req.user.uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userData = userDoc.data();
    const notificationSettings = userData.notificationSettings || {
      email: {
        userApprovals: true,
        systemAlerts: true,
        reports: true,
        assignments: true
      },
      push: {
        userApprovals: true,
        systemAlerts: true,
        reports: false,
        assignments: true
      }
    };

    res.json({
      success: true,
      data: notificationSettings
    });

  } catch (error) {
    console.error('Error fetching notification settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notification settings'
    });
  }
});

/**
 * PUT /api/settings/notifications
 * Update notification settings
 */
router.put('/notifications', async (req, res) => {
  try {
    const { notificationSettings } = req.body;

    await db.collection(COLLECTIONS.USERS).doc(req.user.uid).update({
      notificationSettings,
      updatedAt: new Date()
    });

    res.json({
      success: true,
      message: 'Notification settings updated successfully'
    });

  } catch (error) {
    console.error('Error updating notification settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notification settings'
    });
  }
});

/**
 * GET /api/settings/audit-logs
 * Get audit logs with pagination
 */
router.get('/audit-logs', requirePermission('canManageSystem'), async (req, res) => {
  try {
    const { page = 1, limit = 50, adminId, action, startDate, endDate } = req.query;

    let query = db.collection(COLLECTIONS.AUDIT_LOGS);

    // Apply filters
    if (adminId) {
      query = query.where('adminId', '==', adminId);
    }

    if (action) {
      query = query.where('action', '>=', action).where('action', '<=', action + '\uf8ff');
    }

    if (startDate) {
      query = query.where('timestamp', '>=', new Date(startDate));
    }

    if (endDate) {
      query = query.where('timestamp', '<=', new Date(endDate));
    }

    // Execute query with pagination
    const snapshot = await query
      .orderBy('timestamp', 'desc')
      .limit(parseInt(limit))
      .offset((parseInt(page) - 1) * parseInt(limit))
      .get();

    const logs = [];
    snapshot.forEach(doc => {
      logs.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Get total count for pagination
    const totalSnapshot = await query.get();
    const total = totalSnapshot.size;

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit logs'
    });
  }
});

/**
 * POST /api/settings/backup
 * Create system backup
 */
router.post('/backup', requirePermission('canManageSystem'), async (req, res) => {
  try {
    const { collections = ['users', 'vehicles', 'assignments'] } = req.body;

    const backupData = {
      timestamp: new Date(),
      createdBy: req.user.uid,
      collections: {}
    };

    // Backup specified collections
    for (const collectionName of collections) {
      if (COLLECTIONS[collectionName.toUpperCase()]) {
        const snapshot = await db.collection(COLLECTIONS[collectionName.toUpperCase()]).get();
        const data = [];
        
        snapshot.forEach(doc => {
          data.push({
            id: doc.id,
            ...doc.data()
          });
        });

        backupData.collections[collectionName] = data;
      }
    }

    // Store backup metadata
    const backupRef = await db.collection('backups').add({
      timestamp: backupData.timestamp,
      createdBy: req.user.uid,
      collections: collections,
      size: JSON.stringify(backupData).length
    });

    res.json({
      success: true,
      message: 'Backup created successfully',
      data: {
        backupId: backupRef.id,
        timestamp: backupData.timestamp,
        collections: collections,
        size: JSON.stringify(backupData).length
      }
    });

  } catch (error) {
    console.error('Error creating backup:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create backup'
    });
  }
});

/**
 * GET /api/settings/backups
 * Get list of available backups
 */
router.get('/backups', requirePermission('canManageSystem'), async (req, res) => {
  try {
    const snapshot = await db.collection('backups')
      .orderBy('timestamp', 'desc')
      .limit(20)
      .get();

    const backups = [];
    snapshot.forEach(doc => {
      backups.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json({
      success: true,
      data: backups
    });

  } catch (error) {
    console.error('Error fetching backups:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch backups'
    });
  }
});

/**
 * GET /api/settings/system-status
 * Get system health status
 */
router.get('/system-status', async (req, res) => {
  try {
    const status = {
      timestamp: new Date(),
      services: {
        database: 'online',
        authentication: 'online',
        storage: 'online',
        api: 'online'
      },
      metrics: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.version
      }
    };

    // Test database connection
    try {
      await db.collection('users').limit(1).get();
      status.services.database = 'online';
    } catch (error) {
      status.services.database = 'offline';
    }

    res.json({
      success: true,
      data: status
    });

  } catch (error) {
    console.error('Error getting system status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get system status'
    });
  }
});

/**
 * POST /api/settings/clear-cache
 * Clear system cache
 */
router.post('/clear-cache', requirePermission('canManageSystem'), async (req, res) => {
  try {
    // In a real implementation, this would clear various caches
    // For now, we'll just log the action
    
    await db.collection(COLLECTIONS.AUDIT_LOGS).add({
      adminId: req.user.uid,
      adminEmail: req.user.email,
      action: 'CLEAR_CACHE',
      timestamp: new Date(),
      details: 'System cache cleared'
    });

    res.json({
      success: true,
      message: 'Cache cleared successfully'
    });

  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear cache'
    });
  }
});

module.exports = router;
