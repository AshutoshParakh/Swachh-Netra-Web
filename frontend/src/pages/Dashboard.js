// Admin Dashboard page
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  IconButton,
  Button,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Paper,
  CircularProgress
} from '@mui/material';
import {
  People,
  DirectionsCar,
  Assignment,
  TrendingUp,
  Warning,
  CheckCircle,
  Schedule,
  MoreVert,
  Refresh,
  Assessment
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';

const Dashboard = () => {
  const { userData, getIdToken } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingApprovals: 0,
    totalVehicles: 0,
    activeAssignments: 0,
    loading: true
  });

  const [recentActivities, setRecentActivities] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setStats(prev => ({ ...prev, loading: true }));
      setError(null);

      // Fetch real dashboard data from API
      const response = await apiService.reports.getDashboard();

      if (response.data.success) {
        const data = response.data.data;
        setStats({
          totalUsers: data.users.total || 0,
          pendingApprovals: data.users.pending || 0,
          totalVehicles: data.vehicles.total || 0,
          activeAssignments: data.assignments.active || 0,
          loading: false
        });

        setRecentActivities(data.recentActivities || []);
      } else {
        throw new Error('Failed to fetch dashboard data');
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data');
      setStats(prev => ({ ...prev, loading: false }));

      // Fallback to demo data if API fails
      setStats({
        totalUsers: 0,
        pendingApprovals: 0,
        totalVehicles: 0,
        activeAssignments: 0,
        loading: false
      });
    }
  };

  const StatCard = ({ title, value, icon, color, subtitle, progress }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="div" fontWeight="bold">
              {stats.loading ? '-' : value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="textSecondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Avatar
            sx={{
              bgcolor: `${color}.light`,
              color: `${color}.main`,
              width: 56,
              height: 56
            }}
          >
            {icon}
          </Avatar>
        </Box>
        {progress !== undefined && (
          <Box mt={2}>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 8,
                borderRadius: 4,
                bgcolor: 'grey.200',
                '& .MuiLinearProgress-bar': {
                  bgcolor: `${color}.main`,
                  borderRadius: 4
                }
              }}
            />
            <Typography variant="caption" color="textSecondary" sx={{ mt: 1 }}>
              {progress}% of capacity
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  const getActivityIcon = (type) => {
    switch (type) {
      case 'user_approval':
        return <CheckCircle color="success" />;
      case 'vehicle_assignment':
        return <Assignment color="primary" />;
      case 'system_alert':
        return <Warning color="warning" />;
      default:
        return <Schedule color="action" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
        return 'success';
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'primary';
    }
  };

  return (
    <Box>
      {/* Welcome Header */}
      <Box mb={4}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Welcome back, {userData?.fullName || 'Admin'}!
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Here's what's happening with your waste management system today.
        </Typography>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            icon={<People />}
            color="primary"
            subtitle="Registered users"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Approvals"
            value={stats.pendingApprovals}
            icon={<Schedule />}
            color="warning"
            subtitle="Awaiting review"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Vehicles"
            value={stats.totalVehicles}
            icon={<DirectionsCar />}
            color="success"
            subtitle="Fleet size"
            progress={75}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Assignments"
            value={stats.activeAssignments}
            icon={<Assignment />}
            color="info"
            subtitle="Current tasks"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Recent Activities */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="h6" fontWeight="bold">
                  Recent Activities
                </Typography>
                <IconButton onClick={fetchDashboardData} size="small">
                  <Refresh />
                </IconButton>
              </Box>
              <List>
                {recentActivities.map((activity, index) => (
                  <React.Fragment key={activity.id}>
                    <ListItem alignItems="flex-start">
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'transparent' }}>
                          {getActivityIcon(activity.type)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="body1">
                              {activity.message}
                            </Typography>
                            <Chip
                              label={activity.status}
                              size="small"
                              color={getStatusColor(activity.status)}
                              variant="outlined"
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="textSecondary">
                              {activity.user}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {activity.time}
                            </Typography>
                          </Box>
                        }
                      />
                      <IconButton size="small">
                        <MoreVert />
                      </IconButton>
                    </ListItem>
                    {index < recentActivities.length - 1 && <Divider variant="inset" component="li" />}
                  </React.Fragment>
                ))}
              </List>
              {recentActivities.length === 0 && (
                <Typography variant="body2" color="textSecondary" textAlign="center" py={4}>
                  No recent activities
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Quick Actions
              </Typography>
              <Box display="flex" flexDirection="column" gap={2}>
                <Button
                  variant="outlined"
                  startIcon={<People />}
                  fullWidth
                  sx={{ justifyContent: 'flex-start' }}
                  onClick={() => navigate('/users')}
                >
                  Approve Users ({stats.pendingApprovals})
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<DirectionsCar />}
                  fullWidth
                  sx={{ justifyContent: 'flex-start' }}
                  onClick={() => navigate('/vehicles')}
                >
                  Manage Vehicles
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Assignment />}
                  fullWidth
                  sx={{ justifyContent: 'flex-start' }}
                  onClick={() => navigate('/assignments')}
                >
                  Create Assignment
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Assessment />}
                  fullWidth
                  sx={{ justifyContent: 'flex-start' }}
                  onClick={() => navigate('/reports')}
                >
                  View Reports
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                System Status
              </Typography>
              <Box display="flex" flexDirection="column" gap={2}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Typography variant="body2">Database</Typography>
                  <Chip label="Online" color="success" size="small" />
                </Box>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Typography variant="body2">Firebase Auth</Typography>
                  <Chip label="Online" color="success" size="small" />
                </Box>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Typography variant="body2">Storage</Typography>
                  <Chip label="Online" color="success" size="small" />
                </Box>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Typography variant="body2">API Server</Typography>
                  <Chip label="Online" color="success" size="small" />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
