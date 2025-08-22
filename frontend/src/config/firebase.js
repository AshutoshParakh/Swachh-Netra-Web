// Frontend Firebase configuration
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Validate environment variables
const requiredEnvVars = [
  'REACT_APP_FIREBASE_API_KEY',
  'REACT_APP_FIREBASE_AUTH_DOMAIN',
  'REACT_APP_FIREBASE_PROJECT_ID',
  'REACT_APP_FIREBASE_STORAGE_BUCKET',
  'REACT_APP_FIREBASE_MESSAGING_SENDER_ID',
  'REACT_APP_FIREBASE_APP_ID'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Collection names
export const COLLECTIONS = {
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
export const USER_ROLES = {
  ADMIN: 'admin',
  TRANSPORT_CONTRACTOR: 'transport_contractor',
  SWACHH_HR: 'swachh_hr',
  DRIVER: 'driver'
};

// Admin permissions
export const ADMIN_PERMISSIONS = {
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

export default app;
