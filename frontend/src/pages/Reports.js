// Reports and Analytics page
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip
} from '@mui/material';
import {
  Download,
  Assessment,
  TrendingUp,
  PieChart,
  BarChart,
  DateRange
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const Reports = () => {
  const { getIdToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Report data
  const [dashboardStats, setDashboardStats] = useState(null);
  const [userReports, setUserReports] = useState(null);
  const [vehicleReports, setVehicleReports] = useState(null);
  const [assignmentReports, setAssignmentReports] = useState(null);

  // Filters
  const [filters, setFilters] = useState({
    reportType: 'dashboard',
    startDate: '',
    endDate: '',
    groupBy: 'month'
  });

  useEffect(() => {
    fetchReports();
  }, [filters.reportType]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const token = await getIdToken();

      switch (filters.reportType) {
        case 'dashboard':
          await fetchDashboardStats(token);
          break;
        case 'users':
          await fetchUserReports(token);
          break;
        case 'vehicles':
          await fetchVehicleReports(token);
          break;
        case 'assignments':
          await fetchAssignmentReports(token);
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      setError('Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardStats = async (token) => {
    const response = await fetch('/api/reports/dashboard', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    if (data.success) {
      setDashboardStats(data.data);
    }
  };

  const fetchUserReports = async (token) => {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    params.append('groupBy', filters.groupBy);

    const response = await fetch(`/api/reports/users?${params}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    if (data.success) {
      setUserReports(data.data);
    }
  };

  const fetchVehicleReports = async (token) => {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const response = await fetch(`/api/reports/vehicles?${params}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    if (data.success) {
      setVehicleReports(data.data);
    }
  };

  const fetchAssignmentReports = async (token) => {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const response = await fetch(`/api/reports/assignments?${params}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    if (data.success) {
      setAssignmentReports(data.data);
    }
  };

  const handleExport = async (format = 'json') => {
    try {
      const token = await getIdToken();
      const params = new URLSearchParams({
        type: filters.reportType,
        format,
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate })
      });

      const response = await fetch(`/api/reports/export?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filters.reportType}_report.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        setSuccess('Report exported successfully');
      } else {
        setError('Failed to export report');
      }
    } catch (error) {
      console.error('Error exporting report:', error);
      setError('Failed to export report');
    }
  };

  const StatCard = ({ title, value, subtitle, icon, color = 'primary' }) => (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="div" fontWeight="bold">
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="textSecondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              bgcolor: `${color}.light`,
              color: `${color}.main`,
              p: 2,
              borderRadius: 2
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  const DashboardReport = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Total Users"
          value={dashboardStats?.users?.total || 0}
          subtitle={`${dashboardStats?.users?.active || 0} active`}
          icon={<Assessment />}
          color="primary"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Pending Approvals"
          value={dashboardStats?.users?.pending || 0}
          subtitle="Awaiting review"
          icon={<TrendingUp />}
          color="warning"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Total Vehicles"
          value={dashboardStats?.vehicles?.total || 0}
          subtitle={`${dashboardStats?.vehicles?.available || 0} available`}
          icon={<BarChart />}
          color="success"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Active Assignments"
          value={dashboardStats?.assignments?.active || 0}
          subtitle={`${dashboardStats?.assignments?.total || 0} total`}
          icon={<PieChart />}
          color="info"
        />
      </Grid>

      {/* Recent Activities */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Recent Activities
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Admin</TableCell>
                    <TableCell>Action</TableCell>
                    <TableCell>Timestamp</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dashboardStats?.recentActivities?.slice(0, 10).map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell>{activity.adminEmail}</TableCell>
                      <TableCell>{activity.action}</TableCell>
                      <TableCell>
                        {new Date(activity.timestamp?.toDate?.() || activity.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={activity.statusCode < 400 ? 'Success' : 'Error'}
                          color={activity.statusCode < 400 ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const UserReport = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              User Statistics
            </Typography>
            <Box>
              <Typography variant="body2" color="textSecondary">
                Total Users: {userReports?.total || 0}
              </Typography>
              {userReports?.roleStats && Object.entries(userReports.roleStats).map(([role, count]) => (
                <Box key={role} display="flex" justifyContent="space-between" mt={1}>
                  <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                    {role.replace('_', ' ')}:
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {count}
                  </Typography>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Registration Trend
            </Typography>
            <Box>
              {userReports?.registrationTrend?.slice(-5).map((item) => (
                <Box key={item.period} display="flex" justifyContent="space-between" mt={1}>
                  <Typography variant="body2">{item.period}:</Typography>
                  <Typography variant="body2" fontWeight="bold">{item.count}</Typography>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const VehicleReport = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Vehicle Status
            </Typography>
            {vehicleReports?.statusStats && Object.entries(vehicleReports.statusStats).map(([status, count]) => (
              <Box key={status} display="flex" justifyContent="space-between" mt={1}>
                <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                  {status}:
                </Typography>
                <Typography variant="body2" fontWeight="bold">{count}</Typography>
              </Box>
            ))}
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Vehicle Types
            </Typography>
            {vehicleReports?.typeStats && Object.entries(vehicleReports.typeStats).map(([type, count]) => (
              <Box key={type} display="flex" justifyContent="space-between" mt={1}>
                <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                  {type}:
                </Typography>
                <Typography variant="body2" fontWeight="bold">{count}</Typography>
              </Box>
            ))}
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Top Utilized Vehicles
            </Typography>
            {vehicleReports?.utilization?.slice(0, 5).map((vehicle) => (
              <Box key={vehicle.vehicleId} mt={1}>
                <Typography variant="body2">{vehicle.registrationNumber}</Typography>
                <Typography variant="caption" color="textSecondary">
                  {vehicle.utilizationRate.toFixed(1)}% utilization
                </Typography>
              </Box>
            ))}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const AssignmentReport = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Assignment Performance
            </Typography>
            <Box>
              <Typography variant="body2" color="textSecondary">
                Total Assignments: {assignmentReports?.performanceMetrics?.totalAssignments || 0}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Completed: {assignmentReports?.performanceMetrics?.completedAssignments || 0}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Active: {assignmentReports?.performanceMetrics?.activeAssignments || 0}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Completion Rate: {assignmentReports?.performanceMetrics?.completionRate?.toFixed(1) || 0}%
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Avg Duration: {assignmentReports?.performanceMetrics?.averageAssignmentDuration?.toFixed(1) || 0} days
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Assignment Status
            </Typography>
            {assignmentReports?.statusStats && Object.entries(assignmentReports.statusStats).map(([key, count]) => (
              <Box key={key} display="flex" justifyContent="space-between" mt={1}>
                <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                  {key.replace('_', ' ')}:
                </Typography>
                <Typography variant="body2" fontWeight="bold">{count}</Typography>
              </Box>
            ))}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Reports & Analytics
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={() => handleExport('json')}
          >
            Export JSON
          </Button>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={() => handleExport('csv')}
          >
            Export CSV
          </Button>
        </Box>
      </Box>

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

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Report Type</InputLabel>
                <Select
                  value={filters.reportType}
                  onChange={(e) => setFilters({ ...filters, reportType: e.target.value })}
                  label="Report Type"
                >
                  <MenuItem value="dashboard">Dashboard Overview</MenuItem>
                  <MenuItem value="users">User Analytics</MenuItem>
                  <MenuItem value="vehicles">Vehicle Reports</MenuItem>
                  <MenuItem value="assignments">Assignment Reports</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {filters.reportType !== 'dashboard' && (
              <>
                <Grid item xs={12} sm={6} md={2}>
                  <TextField
                    fullWidth
                    label="Start Date"
                    type="date"
                    size="small"
                    value={filters.startDate}
                    onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <TextField
                    fullWidth
                    label="End Date"
                    type="date"
                    size="small"
                    value={filters.endDate}
                    onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </>
            )}

            {filters.reportType === 'users' && (
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Group By</InputLabel>
                  <Select
                    value={filters.groupBy}
                    onChange={(e) => setFilters({ ...filters, groupBy: e.target.value })}
                    label="Group By"
                  >
                    <MenuItem value="day">Day</MenuItem>
                    <MenuItem value="week">Week</MenuItem>
                    <MenuItem value="month">Month</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}

            <Grid item xs={12} sm={6} md={2}>
              <Button
                variant="contained"
                onClick={fetchReports}
                disabled={loading}
                startIcon={<DateRange />}
                fullWidth
              >
                Generate Report
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Report Content */}
      <Box>
        {filters.reportType === 'dashboard' && dashboardStats && <DashboardReport />}
        {filters.reportType === 'users' && userReports && <UserReport />}
        {filters.reportType === 'vehicles' && vehicleReports && <VehicleReport />}
        {filters.reportType === 'assignments' && assignmentReports && <AssignmentReport />}
      </Box>
    </Box>
  );
};

export default Reports;
