// Script to create an admin user for testing
const admin = require('firebase-admin');
require('dotenv').config();

// Initialize Firebase Admin
const firebaseConfig = {
  projectId: 'swachh-netra-3e12e',
};

admin.initializeApp(firebaseConfig);
const auth = admin.auth();
const db = admin.firestore();

async function createAdminUser() {
  try {
    console.log('🔥 Creating admin user for Swachh Netra Web Portal...');

    const adminEmail = 'admin@swachhnetra.com';
    const adminPassword = 'admin123456';

    // Create user in Firebase Auth
    let userRecord;
    try {
      userRecord = await auth.createUser({
        email: adminEmail,
        password: adminPassword,
        displayName: 'Admin User',
        emailVerified: true,
      });
      console.log('✅ Created Firebase Auth user:', userRecord.uid);
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        console.log('📧 User already exists in Auth, getting user record...');
        userRecord = await auth.getUserByEmail(adminEmail);
      } else {
        throw error;
      }
    }

    // Create user document in Firestore
    const userData = {
      uid: userRecord.uid,
      email: adminEmail,
      fullName: 'Admin User',
      role: 'admin',
      isActive: true,
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
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastLogin: null,
      phone: '+91 9999999999',
      department: 'Administration',
      designation: 'System Administrator'
    };

    await db.collection('users').doc(userRecord.uid).set(userData);
    console.log('✅ Created Firestore user document');

    console.log('\n🎉 Admin user created successfully!');
    console.log('📧 Email:', adminEmail);
    console.log('🔑 Password:', adminPassword);
    console.log('🆔 UID:', userRecord.uid);
    console.log('\n🌐 You can now login to the web portal at: http://localhost:3000');

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    process.exit(0);
  }
}

createAdminUser();
