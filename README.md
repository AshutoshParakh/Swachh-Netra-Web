# Swachh Netra Web Portal

A professional admin web portal for the Swachh Netra Waste Management System. This portal provides comprehensive administrative functionality with a modern, responsive interface.

## Features

### 🔐 Admin Authentication
- Secure admin-only access
- Firebase Authentication integration
- Role-based permissions

### 👥 User Management
- User approval system
- Role management (Admin, Contractor, Driver, Swachh HR)
- User status controls
- Comprehensive user listing

### 🚛 Vehicle Management
- Vehicle CRUD operations
- Vehicle assignment to contractors/drivers
- Fleet tracking and monitoring
- Vehicle status management

### 📋 Assignment Management
- Feeder point assignments
- Vehicle assignments
- Route management
- Task allocation

### 📊 Reports & Analytics
- Comprehensive reporting system
- Data visualization with charts
- Export capabilities
- Real-time analytics

### ⚙️ Settings & Configuration
- Admin settings panel
- System configuration
- Profile management
- Notification settings

## Tech Stack

### Frontend
- **React.js** - Modern UI framework
- **Material-UI** - Professional component library
- **React Router** - Navigation
- **Chart.js** - Data visualization
- **Axios** - HTTP client

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Firebase Admin SDK** - Database operations
- **CORS** - Cross-origin resource sharing

### Database
- **Firebase Firestore** - NoSQL database
- **Firebase Authentication** - User authentication
- **Firebase Storage** - File storage

## Project Structure

```
swachh-netra-webportal/
├── frontend/                 # React.js frontend
│   ├── public/
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   ├── utils/           # Utility functions
│   │   ├── contexts/        # React contexts
│   │   └── styles/          # CSS styles
│   └── package.json
├── backend/                  # Node.js backend
│   ├── src/
│   │   ├── routes/          # API routes
│   │   ├── middleware/      # Express middleware
│   │   ├── services/        # Business logic
│   │   └── utils/           # Utility functions
│   └── package.json
├── shared/                   # Shared configurations
│   └── firebase-config.js
└── README.md
```

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd swachh-netra-webportal
   ```

2. **Install all dependencies**
   ```bash
   npm run install-all
   ```

3. **Set up environment variables**
   - Copy `.env.example` to `.env` in both frontend and backend directories
   - Fill in your Firebase configuration

4. **Start development servers**
   ```bash
   npm run dev
   ```

## Environment Variables

### Frontend (.env)
```
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-auth-domain
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-storage-bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
REACT_APP_API_URL=http://localhost:5000/api
```

### Backend (.env)
```
PORT=5000
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email
NODE_ENV=development
```

## Usage

1. **Access the portal**: Navigate to `http://localhost:3000`
2. **Admin Login**: Use admin credentials to access the portal
3. **Dashboard**: View system overview and statistics
4. **Manage Users**: Approve users, assign roles, manage permissions
5. **Vehicle Management**: Add, edit, assign vehicles
6. **Reports**: Generate and export reports

## Security Features

- Admin-only authentication
- Role-based access control
- Secure API endpoints
- Input validation and sanitization
- CORS protection

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details
