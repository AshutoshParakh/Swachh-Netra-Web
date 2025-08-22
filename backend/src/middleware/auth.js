// Authentication middleware for admin portal
const { auth, db, USER_ROLES } = require('../config/firebase');

/**
 * Middleware to verify Firebase ID token and ensure admin access
 */
const authenticateAdmin = async (req, res, next) => {
  // TEMPORARY: Skip authentication for testing until Firebase credentials are set up
  console.log('🔓 TEMPORARY MODE: Bypassing authentication for testing');

  req.user = {
    uid: 'temp-admin-123',
    email: 'admin@swachhnetra.com',
    role: 'admin',
    permissions: {
      canManageUsers: true,
      canManageVehicles: true,
      canManageAssignments: true,
      canViewAllReports: true,
      canManageSettings: true,
      canApproveRequests: true,
      canManageFeederPoints: true,
      canGenerateReports: true,
      canManageSystem: true
    },
    fullName: 'Temporary Admin'
  };

  next();

  // ORIGINAL CODE (commented out for demo)
  /*
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided or invalid format'
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify the Firebase ID token
    const decodedToken = await auth.verifyIdToken(token);
    const uid = decodedToken.uid;

    // Get user data from Firestore
    const userDoc = await db.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    const userData = userDoc.data();

    // Check if user is admin
    if (userData.role !== USER_ROLES.ADMIN) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    // Check if user is active
    if (!userData.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Add user data to request object
    req.user = {
      uid,
      email: userData.email,
      role: userData.role,
      permissions: userData.permissions || {},
      fullName: userData.fullName
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);

    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }

    if (error.code === 'auth/id-token-revoked') {
      return res.status(401).json({
        success: false,
        message: 'Token revoked'
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
  */
};

/**
 * Middleware to check specific admin permissions
 */
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!req.user.permissions[permission]) {
      return res.status(403).json({
        success: false,
        message: `Permission denied. Required permission: ${permission}`
      });
    }

    next();
  };
};

/**
 * Middleware to log admin actions for audit trail
 */
const logAdminAction = async (req, res, next) => {
  try {
    const originalSend = res.send;
    
    res.send = function(data) {
      // Log the action after response is sent
      setImmediate(async () => {
        try {
          if (req.user && res.statusCode < 400 && db) {
            await db.collection('auditLogs').add({
              adminId: req.user.uid,
              adminEmail: req.user.email,
              action: `${req.method} ${req.originalUrl}`,
              timestamp: new Date(),
              ip: req.ip,
              userAgent: req.get('User-Agent'),
              body: req.method !== 'GET' ? req.body : null,
              statusCode: res.statusCode
            });
          }
        } catch (error) {
          console.log('Audit logging skipped - collection may not exist yet');
        }
      });

      originalSend.call(this, data);
    };

    next();
  } catch (error) {
    console.error('Error in logAdminAction middleware:', error);
    next();
  }
};

module.exports = {
  authenticateAdmin,
  requirePermission,
  logAdminAction
};
