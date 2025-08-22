// Backend Firebase Admin configuration
const admin = require('firebase-admin');
require('dotenv').config();

// PRODUCTION MODE: Enable Firebase with real data from your Swachh-Netra project
console.log('🔥 PRODUCTION MODE: Connecting to Firebase with REAL DATA');
console.log('💡 Using project: swachh-netra-3e12e');
console.log('💡 Fetching actual data from your Firebase database');

// Initialize Firebase Admin SDK with your project
let app;

try {
  // Initialize with your actual Firebase project using client SDK approach
  const firebaseConfig = {
    projectId: 'swachh-netra-3e12e',
    // For admin SDK, we'll use the client config approach
    credential: admin.credential.applicationDefault(),
  };

  app = admin.initializeApp(firebaseConfig);
  console.log('✅ Firebase Admin initialized successfully with project: swachh-netra-3e12e');
} catch (error) {
  console.error('❌ Error initializing Firebase Admin:', error);
  console.log('💡 Trying alternative initialization method...');

  try {
    // Alternative: Initialize without explicit credentials (uses environment)
    app = admin.initializeApp({
      projectId: 'swachh-netra-3e12e'
    });
    console.log('✅ Firebase Admin initialized with alternative method');
  } catch (altError) {
    console.error('❌ Alternative initialization also failed:', altError);
    console.log('💡 Falling back to demo mode');
    app = null;
  }
}

// Export Firebase services
let db, auth, storage;

try {
  if (app) {
    db = admin.firestore();
    auth = admin.auth();
    storage = admin.storage();
    console.log('✅ Firebase services initialized - ready to fetch REAL DATA');
  } else {
    db = null;
    auth = null;
    storage = null;
    console.log('⚠️ Firebase services not available - using demo mode');
  }
} catch (error) {
  console.log('⚠️ Firebase services initialization failed - using demo mode');
  db = null;
  auth = null;
  storage = null;
}

// Original Firebase initialization (commented out for demo)
/*
// Validate required environment variables
const requiredEnvVars = ['FIREBASE_PROJECT_ID'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
}

// Initialize Firebase Admin SDK
let app;

try {
  // Initialize with the same project ID as Swachh-Netra
  const firebaseConfig = {
    projectId: process.env.FIREBASE_PROJECT_ID || 'swachh-netra-3e12e',
    // For admin SDK, we can use default credentials or application default credentials
  };

  app = admin.initializeApp(firebaseConfig);
  console.log('✅ Firebase Admin initialized successfully with project:', firebaseConfig.projectId);
} catch (error) {
  console.error('❌ Error initializing Firebase Admin:', error);
  console.log('💡 Using same Firebase project as Swachh-Netra app');
  console.log('💡 Project ID: swachh-netra-3e12e');

  // Continue with limited functionality
  console.log('⚠️ Some features may be limited without full Firebase connection');
}

// Export Firebase services
let db, auth, storage;

try {
  if (app) {
    db = admin.firestore();
    auth = admin.auth();
    storage = admin.storage();
  }
} catch (error) {
  console.log('⚠️ Firebase services not available in demo mode');
}
*/

// Collection names (same as frontend)
const COLLECTIONS = {
  USERS: 'users',
  APPROVAL_REQUESTS: 'approvalRequests',
  VEHICLES: 'vehicles',
  VEHICLE_ASSIGNMENTS: 'vehicleAssignments',
  FEEDER_POINTS: 'feederPoints',
  FEEDER_POINT_ASSIGNMENTS: 'feederPointAssignments',
  CONTRACTORS: 'contractors',
  DRIVERS: 'drivers',
  REPORTS: 'reports',
  NOTIFICATIONS: 'notifications',
  AUDIT_LOGS: 'auditLogs',
  SETTINGS: 'settings'
};

// User roles
const USER_ROLES = {
  ADMIN: 'admin',
  TRANSPORT_CONTRACTOR: 'transport_contractor',
  SWACHH_HR: 'swachh_hr',
  DRIVER: 'driver'
};

// Admin permissions
const ADMIN_PERMISSIONS = {
  MANAGE_USERS: 'canManageUsers',
  VIEW_ALL_REPORTS: 'canViewAllReports',
  ASSIGN_TASKS: 'canAssignTasks',
  GENERATE_REPORTS: 'canGenerateReports',
  MANAGE_SYSTEM: 'canManageSystem',
  APPROVE_REQUESTS: 'canApproveRequests',
  MANAGE_FEEDER_POINTS: 'canManageFeederPoints',
  MANAGE_VEHICLES: 'canManageVehicles',
  MANAGE_ASSIGNMENTS: 'canManageAssignments'
};

module.exports = {
  admin,
  db,
  auth,
  storage,
  COLLECTIONS,
  USER_ROLES,
  ADMIN_PERMISSIONS
};
