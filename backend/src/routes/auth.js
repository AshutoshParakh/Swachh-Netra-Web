// Authentication routes for admin portal
const express = require('express');
const { auth, db, USER_ROLES } = require('../config/firebase');
const { authenticateAdmin } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/auth/verify
 * Verify admin token and get user data
 */
router.post('/verify', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token is required'
      });
    }

    // Verify the Firebase ID token
    const decodedToken = await auth.verifyIdToken(token);
    const uid = decodedToken.uid;

    // Get user data from Firestore
    const userDoc = await db.collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({
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

    // Return user data (excluding sensitive information)
    const { password, ...safeUserData } = userData;
    
    res.json({
      success: true,
      message: 'Token verified successfully',
      data: {
        uid,
        ...safeUserData
      }
    });

  } catch (error) {
    console.error('Token verification error:', error);
    
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

    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
});

/**
 * GET /api/auth/profile
 * Get current admin profile
 */
router.get('/profile', authenticateAdmin, async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found'
      });
    }

    const userData = userDoc.data();
    const { password, ...safeUserData } = userData;

    res.json({
      success: true,
      data: {
        uid: req.user.uid,
        ...safeUserData
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile'
    });
  }
});

/**
 * PUT /api/auth/profile
 * Update admin profile
 */
router.put('/profile', authenticateAdmin, async (req, res) => {
  try {
    const { fullName, phone } = req.body;
    const updateData = {};

    if (fullName) updateData.fullName = fullName;
    if (phone) updateData.phone = phone;
    updateData.updatedAt = new Date();

    await db.collection('users').doc(req.user.uid).update(updateData);

    res.json({
      success: true,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
});

/**
 * POST /api/auth/change-password
 * Change admin password (handled by Firebase Auth on frontend)
 */
router.post('/change-password', authenticateAdmin, async (req, res) => {
  try {
    // This endpoint is mainly for logging purposes
    // Actual password change is handled by Firebase Auth on the frontend
    
    res.json({
      success: true,
      message: 'Password change request logged. Use Firebase Auth to change password.'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process password change request'
    });
  }
});

module.exports = router;
