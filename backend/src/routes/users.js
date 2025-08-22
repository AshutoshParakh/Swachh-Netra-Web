// User management routes for admin portal
const express = require('express');
const { db, auth, COLLECTIONS, USER_ROLES } = require('../config/firebase');
const { requirePermission } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/users
 * Get all users with pagination and filtering
 */
router.get('/', requirePermission('canManageUsers'), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      role,
      status,
      search
    } = req.query;

    // PRODUCTION MODE: Use real Firebase data
    if (!db) {
      return res.status(503).json({
        success: false,
        message: 'Database not available'
      });
    }

    console.log('🔥 PRODUCTION MODE: Fetching real users data from Firebase');

    let query = db.collection(COLLECTIONS.USERS);

    // Apply filters
    if (role && role !== 'all') {
      query = query.where('role', '==', role);
    }

    if (status && status !== 'all') {
      if (status === 'active') {
        query = query.where('isActive', '==', true);
      } else if (status === 'inactive') {
        query = query.where('isActive', '==', false);
      }
    }

    // Execute query
    const snapshot = await query.orderBy('createdAt', 'desc').get();
    let users = [];

    snapshot.forEach(doc => {
      const userData = doc.data();
      // Remove sensitive data
      const { password, ...safeUserData } = userData;
      users.push({
        id: doc.id,
        ...safeUserData
      });
    });

    // Apply search filter (client-side for simplicity)
    if (search) {
      const searchLower = search.toLowerCase();
      users = users.filter(user => 
        user.fullName?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower) ||
        user.phone?.includes(search)
      );
    }

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedUsers = users.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: {
        users: paginatedUsers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: users.length,
          pages: Math.ceil(users.length / limit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
});

/**
 * GET /api/users/approval-requests
 * Get pending approval requests
 */
router.get('/approval-requests', requirePermission('canApproveRequests'), async (req, res) => {
  try {
    // PRODUCTION MODE: Use real Firebase data
    if (!db) {
      return res.status(503).json({
        success: false,
        message: 'Database not available'
      });
    }

    console.log('🔥 PRODUCTION MODE: Fetching real approval requests from Firebase');

    const snapshot = await db.collection(COLLECTIONS.APPROVAL_REQUESTS)
      .where('status', '==', 'pending')
      .orderBy('createdAt', 'desc')
      .get();

    const requests = [];
    snapshot.forEach(doc => {
      requests.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json({
      success: true,
      data: requests
    });

  } catch (error) {
    console.error('Error fetching approval requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch approval requests'
    });
  }
});

/**
 * POST /api/users/approve-request/:id
 * Approve a user registration request
 */
router.post('/approve-request/:id', requirePermission('canApproveRequests'), async (req, res) => {
  try {
    const { id } = req.params;
    const { approved } = req.body;

    // Get the approval request
    const requestDoc = await db.collection(COLLECTIONS.APPROVAL_REQUESTS).doc(id).get();
    
    if (!requestDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Approval request not found'
      });
    }

    const requestData = requestDoc.data();

    if (approved) {
      // Create user account in Firebase Auth
      const userRecord = await auth.createUser({
        email: requestData.email,
        password: requestData.password,
        displayName: requestData.fullName
      });

      // Create user document in Firestore
      const userData = {
        uid: userRecord.uid,
        fullName: requestData.fullName,
        email: requestData.email,
        phone: requestData.phone,
        role: requestData.role,
        isActive: true,
        createdAt: new Date(),
        approvedAt: new Date(),
        approvedBy: req.user.uid,
        permissions: getRolePermissions(requestData.role)
      };

      await db.collection(COLLECTIONS.USERS).doc(userRecord.uid).set(userData);

      // Update approval request status
      await db.collection(COLLECTIONS.APPROVAL_REQUESTS).doc(id).update({
        status: 'approved',
        approvedAt: new Date(),
        approvedBy: req.user.uid
      });

      res.json({
        success: true,
        message: 'User approved and account created successfully',
        data: { userId: userRecord.uid }
      });
    } else {
      // Reject the request
      await db.collection(COLLECTIONS.APPROVAL_REQUESTS).doc(id).update({
        status: 'rejected',
        rejectedAt: new Date(),
        rejectedBy: req.user.uid
      });

      res.json({
        success: true,
        message: 'User request rejected'
      });
    }

  } catch (error) {
    console.error('Error processing approval request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process approval request'
    });
  }
});

/**
 * PUT /api/users/:id/status
 * Update user status (active/inactive)
 */
router.put('/:id/status', requirePermission('canManageUsers'), async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    // Update user status in Firestore
    await db.collection(COLLECTIONS.USERS).doc(id).update({
      isActive,
      updatedAt: new Date(),
      updatedBy: req.user.uid
    });

    // If deactivating, also disable in Firebase Auth
    if (!isActive) {
      await auth.updateUser(id, { disabled: true });
    } else {
      await auth.updateUser(id, { disabled: false });
    }

    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`
    });

  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status'
    });
  }
});

/**
 * PUT /api/users/:id/role
 * Update user role
 */
router.put('/:id/role', requirePermission('canManageUsers'), async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!Object.values(USER_ROLES).includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role'
      });
    }

    // Update user role and permissions
    await db.collection(COLLECTIONS.USERS).doc(id).update({
      role,
      permissions: getRolePermissions(role),
      updatedAt: new Date(),
      updatedBy: req.user.uid
    });

    res.json({
      success: true,
      message: 'User role updated successfully'
    });

  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user role'
    });
  }
});

/**
 * DELETE /api/users/:id
 * Delete user account
 */
router.delete('/:id', requirePermission('canManageUsers'), async (req, res) => {
  try {
    const { id } = req.params;

    // Delete from Firebase Auth
    await auth.deleteUser(id);

    // Delete from Firestore
    await db.collection(COLLECTIONS.USERS).doc(id).delete();

    res.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user'
    });
  }
});

// Helper function to get role permissions
function getRolePermissions(role) {
  switch (role) {
    case USER_ROLES.ADMIN:
      return {
        canManageUsers: true,
        canViewAllReports: true,
        canAssignTasks: true,
        canGenerateReports: true,
        canManageSystem: true,
        canApproveRequests: true,
        canManageFeederPoints: true,
        canManageVehicles: true,
        canManageAssignments: true
      };
    case USER_ROLES.TRANSPORT_CONTRACTOR:
      return {
        canManageDrivers: true,
        canViewDriverReports: true,
        canAssignRoutes: true,
        canManageVehicles: true,
        canApproveDrivers: true
      };
    case USER_ROLES.SWACHH_HR:
      return {
        canManageWorkers: true,
        canViewReports: true,
        canAssignTasks: true,
        canGenerateReports: true
      };
    case USER_ROLES.DRIVER:
    default:
      return {
        canSubmitReports: true,
        canViewAssignedRoutes: true,
        canUpdateStatus: true
      };
  }
}

module.exports = router;
