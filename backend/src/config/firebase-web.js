// Firebase Web SDK configuration for accessing real data
const axios = require('axios');
require('dotenv').config();

// Firebase Web API configuration using your actual project
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || 'AIzaSyDFIdrYsVPA-1S3UB-SQJUcu6H57f7jGqU',
  authDomain: 'swachh-netra-3e12e.firebaseapp.com',
  projectId: 'swachh-netra-3e12e',
  storageBucket: 'swachh-netra-3e12e.firebasestorage.app',
  messagingSenderId: '697022376282',
  appId: '1:697022376282:web:9fb1df9dd06f2802072b63',
  measurementId: 'G-HYRTCQH2P2'
};

console.log('🔥 FIREBASE WEB SDK: Connecting to real Swachh-Netra database');
console.log('💡 Project ID:', firebaseConfig.projectId);

// Firestore REST API base URL
const FIRESTORE_BASE_URL = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents`;

// Helper function to make Firestore REST API calls
async function firestoreGet(collection, documentId = null) {
  try {
    const url = documentId 
      ? `${FIRESTORE_BASE_URL}/${collection}/${documentId}`
      : `${FIRESTORE_BASE_URL}/${collection}`;
    
    const response = await axios.get(url, {
      params: {
        key: firebaseConfig.apiKey
      }
    });
    
    return response.data;
  } catch (error) {
    console.error(`Error fetching from ${collection}:`, error.message);
    throw error;
  }
}

// Helper function to convert Firestore document to readable format
function convertFirestoreDoc(doc) {
  if (!doc.fields) return null;
  
  const converted = {};
  for (const [key, value] of Object.entries(doc.fields)) {
    if (value.stringValue !== undefined) {
      converted[key] = value.stringValue;
    } else if (value.integerValue !== undefined) {
      converted[key] = parseInt(value.integerValue);
    } else if (value.doubleValue !== undefined) {
      converted[key] = parseFloat(value.doubleValue);
    } else if (value.booleanValue !== undefined) {
      converted[key] = value.booleanValue;
    } else if (value.timestampValue !== undefined) {
      converted[key] = new Date(value.timestampValue);
    } else if (value.arrayValue !== undefined) {
      converted[key] = value.arrayValue.values || [];
    } else if (value.mapValue !== undefined) {
      converted[key] = convertFirestoreDoc({ fields: value.mapValue.fields });
    } else {
      converted[key] = value;
    }
  }
  
  return converted;
}

// Export functions to access real Firebase data
module.exports = {
  firebaseConfig,
  
  // Get all users from Firestore
  async getUsers() {
    try {
      console.log('🔥 Fetching REAL USERS from Firestore...');
      const response = await firestoreGet('users');
      
      if (response.documents) {
        const users = response.documents.map(doc => {
          const userData = convertFirestoreDoc(doc);
          return {
            id: doc.name.split('/').pop(),
            ...userData
          };
        });
        
        console.log(`✅ Found ${users.length} real users in database`);
        return users;
      } else {
        console.log('📝 No users found in database');
        return [];
      }
    } catch (error) {
      console.error('❌ Error fetching users:', error.message);
      return [];
    }
  },

  // Get all vehicles from Firestore
  async getVehicles() {
    try {
      console.log('🔥 Fetching REAL VEHICLES from Firestore...');
      const response = await firestoreGet('vehicles');
      
      if (response.documents) {
        const vehicles = response.documents.map(doc => {
          const vehicleData = convertFirestoreDoc(doc);
          return {
            id: doc.name.split('/').pop(),
            ...vehicleData
          };
        });
        
        console.log(`✅ Found ${vehicles.length} real vehicles in database`);
        return vehicles;
      } else {
        console.log('📝 No vehicles found in database');
        return [];
      }
    } catch (error) {
      console.error('❌ Error fetching vehicles:', error.message);
      return [];
    }
  },

  // Get approval requests
  async getApprovalRequests() {
    try {
      console.log('🔥 Fetching REAL APPROVAL REQUESTS from Firestore...');
      const response = await firestoreGet('approvalRequests');
      
      if (response.documents) {
        const requests = response.documents.map(doc => {
          const requestData = convertFirestoreDoc(doc);
          return {
            id: doc.name.split('/').pop(),
            ...requestData
          };
        });
        
        console.log(`✅ Found ${requests.length} real approval requests in database`);
        return requests.filter(req => req.status === 'pending');
      } else {
        console.log('📝 No approval requests found in database');
        return [];
      }
    } catch (error) {
      console.error('❌ Error fetching approval requests:', error.message);
      return [];
    }
  }
};
