// Settings page
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  Grid,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import {
  Save,
  Backup,
  Security,
  Notifications,
  Settings as SettingsIcon,
  History,
  CloudDownload,
  Delete,
  Refresh
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const Settings = () => {
  const { getIdToken, userData, refreshUserData } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Profile settings
  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
    phone: ''
  });

  // System settings
  const [systemSettings, setSystemSettings] = useState({
    appName: '',
    maintenanceMode: false,
    allowRegistrations: true,
    sessionTimeout: 24
  });

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
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
  });

  // Audit logs
  const [auditLogs, setAuditLogs] = useState([]);
  const [backups, setBackups] = useState([]);
  const [systemStatus, setSystemStatus] = useState(null);

  // Dialog states
  const [backupDialog, setBackupDialog] = useState(false);

  useEffect(() => {
    if (userData) {
      setProfileData({
        fullName: userData.fullName || '',
        email: userData.email || '',
        phone: userData.phone || ''
      });
    }
    
    fetchSettings();
  }, [userData]);

  const fetchSettings = async () => {
    try {
      const token = await getIdToken();

      // Fetch system settings
      const systemResponse = await fetch('/api/settings/system', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (systemResponse.ok) {
        const systemData = await systemResponse.json();
        if (systemData.success) {
          setSystemSettings(systemData.data);
        }
      }

      // Fetch notification settings
      const notificationResponse = await fetch('/api/settings/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (notificationResponse.ok) {
        const notificationData = await notificationResponse.json();
        if (notificationData.success) {
          setNotificationSettings(notificationData.data);
        }
      }

      // Fetch audit logs
      const auditResponse = await fetch('/api/settings/audit-logs?limit=10', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (auditResponse.ok) {
        const auditData = await auditResponse.json();
        if (auditData.success) {
          setAuditLogs(auditData.data.logs);
        }
      }

      // Fetch backups
      const backupResponse = await fetch('/api/settings/backups', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (backupResponse.ok) {
        const backupData = await backupResponse.json();
        if (backupData.success) {
          setBackups(backupData.data);
        }
      }

      // Fetch system status
      const statusResponse = await fetch('/api/settings/system-status', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        if (statusData.success) {
          setSystemStatus(statusData.data);
        }
      }

    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setLoading(true);
      const token = await getIdToken();

      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess('Profile updated successfully');
        await refreshUserData();
      } else {
        setError(data.message);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSystemSettings = async () => {
    try {
      setLoading(true);
      const token = await getIdToken();

      const response = await fetch('/api/settings/system', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(systemSettings)
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess('System settings updated successfully');
      } else {
        setError(data.message);
      }
    } catch (error) {
      console.error('Error updating system settings:', error);
      setError('Failed to update system settings');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateNotifications = async () => {
    try {
      setLoading(true);
      const token = await getIdToken();

      const response = await fetch('/api/settings/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ notificationSettings })
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess('Notification settings updated successfully');
      } else {
        setError(data.message);
      }
    } catch (error) {
      console.error('Error updating notification settings:', error);
      setError('Failed to update notification settings');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    try {
      setLoading(true);
      const token = await getIdToken();

      const response = await fetch('/api/settings/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          collections: ['users', 'vehicles', 'assignments']
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess('Backup created successfully');
        setBackupDialog(false);
        fetchSettings(); // Refresh backup list
      } else {
        setError(data.message);
      }
    } catch (error) {
      console.error('Error creating backup:', error);
      setError('Failed to create backup');
    } finally {
      setLoading(false);
    }
  };

  const ProfileTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Profile Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Full Name"
                  value={profileData.fullName}
                  onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email"
                  value={profileData.email}
                  disabled
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  startIcon={<Save />}
                  onClick={handleUpdateProfile}
                  disabled={loading}
                >
                  Update Profile
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Account Security
            </Typography>
            <List>
              <ListItem>
                <ListItemText
                  primary="Two-Factor Authentication"
                  secondary="Add an extra layer of security"
                />
                <ListItemSecondaryAction>
                  <Chip label="Not Configured" color="warning" size="small" />
                </ListItemSecondaryAction>
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Password"
                  secondary="Last changed 30 days ago"
                />
                <ListItemSecondaryAction>
                  <Button size="small">Change</Button>
                </ListItemSecondaryAction>
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Login Sessions"
                  secondary="Manage active sessions"
                />
                <ListItemSecondaryAction>
                  <Button size="small">View</Button>
                </ListItemSecondaryAction>
              </ListItem>
            </List>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const SystemTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              System Configuration
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Application Name"
                  value={systemSettings.appName}
                  onChange={(e) => setSystemSettings({ ...systemSettings, appName: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={systemSettings.maintenanceMode}
                      onChange={(e) => setSystemSettings({ ...systemSettings, maintenanceMode: e.target.checked })}
                    />
                  }
                  label="Maintenance Mode"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={systemSettings.allowRegistrations}
                      onChange={(e) => setSystemSettings({ ...systemSettings, allowRegistrations: e.target.checked })}
                    />
                  }
                  label="Allow New Registrations"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Session Timeout (hours)"
                  type="number"
                  value={systemSettings.sessionTimeout}
                  onChange={(e) => setSystemSettings({ ...systemSettings, sessionTimeout: parseInt(e.target.value) })}
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  startIcon={<Save />}
                  onClick={handleUpdateSystemSettings}
                  disabled={loading}
                >
                  Update Settings
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              System Status
            </Typography>
            {systemStatus && (
              <List>
                {Object.entries(systemStatus.services).map(([service, status]) => (
                  <ListItem key={service}>
                    <ListItemText
                      primary={service.charAt(0).toUpperCase() + service.slice(1)}
                      secondary={`Status: ${status}`}
                    />
                    <ListItemSecondaryAction>
                      <Chip
                        label={status}
                        color={status === 'online' ? 'success' : 'error'}
                        size="small"
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={fetchSettings}
              fullWidth
              sx={{ mt: 2 }}
            >
              Refresh Status
            </Button>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const NotificationsTab = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Notification Preferences
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>
              Email Notifications
            </Typography>
            {Object.entries(notificationSettings.email).map(([key, value]) => (
              <FormControlLabel
                key={key}
                control={
                  <Switch
                    checked={value}
                    onChange={(e) => setNotificationSettings({
                      ...notificationSettings,
                      email: { ...notificationSettings.email, [key]: e.target.checked }
                    })}
                  />
                }
                label={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                sx={{ display: 'block', mb: 1 }}
              />
            ))}
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>
              Push Notifications
            </Typography>
            {Object.entries(notificationSettings.push).map(([key, value]) => (
              <FormControlLabel
                key={key}
                control={
                  <Switch
                    checked={value}
                    onChange={(e) => setNotificationSettings({
                      ...notificationSettings,
                      push: { ...notificationSettings.push, [key]: e.target.checked }
                    })}
                  />
                }
                label={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                sx={{ display: 'block', mb: 1 }}
              />
            ))}
          </Grid>
          <Grid item xs={12}>
            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={handleUpdateNotifications}
              disabled={loading}
            >
              Update Notifications
            </Button>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const BackupTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Create Backup
            </Typography>
            <Typography variant="body2" color="textSecondary" paragraph>
              Create a backup of your system data including users, vehicles, and assignments.
            </Typography>
            <Button
              variant="contained"
              startIcon={<Backup />}
              onClick={() => setBackupDialog(true)}
              disabled={loading}
            >
              Create Backup
            </Button>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Recent Backups
            </Typography>
            <List>
              {backups.slice(0, 5).map((backup) => (
                <ListItem key={backup.id}>
                  <ListItemText
                    primary={new Date(backup.timestamp?.toDate?.() || backup.timestamp).toLocaleString()}
                    secondary={`Size: ${(backup.size / 1024).toFixed(2)} KB`}
                  />
                  <ListItemSecondaryAction>
                    <Button size="small" startIcon={<CloudDownload />}>
                      Download
                    </Button>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const AuditTab = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Audit Logs
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Admin</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Timestamp</TableCell>
                <TableCell>IP Address</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {auditLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{log.adminEmail}</TableCell>
                  <TableCell>{log.action}</TableCell>
                  <TableCell>
                    {new Date(log.timestamp?.toDate?.() || log.timestamp).toLocaleString()}
                  </TableCell>
                  <TableCell>{log.ip || 'N/A'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      {/* Header */}
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Settings
      </Typography>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Tabs */}
      <Card>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Profile" icon={<Security />} iconPosition="start" />
          <Tab label="System" icon={<SettingsIcon />} iconPosition="start" />
          <Tab label="Notifications" icon={<Notifications />} iconPosition="start" />
          <Tab label="Backup" icon={<Backup />} iconPosition="start" />
          <Tab label="Audit Logs" icon={<History />} iconPosition="start" />
        </Tabs>

        <CardContent>
          {tabValue === 0 && <ProfileTab />}
          {tabValue === 1 && <SystemTab />}
          {tabValue === 2 && <NotificationsTab />}
          {tabValue === 3 && <BackupTab />}
          {tabValue === 4 && <AuditTab />}
        </CardContent>
      </Card>

      {/* Backup Confirmation Dialog */}
      <Dialog open={backupDialog} onClose={() => setBackupDialog(false)}>
        <DialogTitle>Create System Backup</DialogTitle>
        <DialogContent>
          <Typography>
            This will create a backup of all system data including users, vehicles, and assignments.
            The backup process may take a few minutes.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBackupDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateBackup} variant="contained" disabled={loading}>
            Create Backup
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Settings;
