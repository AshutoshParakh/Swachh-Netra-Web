// Shared Firebase configuration for both frontend and backend
// This ensures consistency across the application
// Using EXACT same configuration as Swachh-Netra mobile app

const firebaseConfig = {
  apiKey: "AIzaSyDFIdrYsVPA-1S3UB-SQJUcu6H57f7jGqU",
  authDomain: "swachh-netra-3e12e.firebaseapp.com",
  projectId: "swachh-netra-3e12e",
  storageBucket: "swachh-netra-3e12e.firebasestorage.app",
  messagingSenderId: "697022376282",
  appId: "1:697022376282:web:9fb1df9dd06f2802072b63",
  measurementId: "G-HYRTCQH2P2"
};

// Collection names used across the application
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
  firebaseConfig,
  COLLECTIONS,
  USER_ROLES,
  ADMIN_PERMISSIONS
};
