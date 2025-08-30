import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  IconButton,
  Tooltip,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField
} from '@mui/material';
import {
  Dashboard,
  Report,
  CheckCircle,
  Schedule,
  Warning,
  TrendingUp,
  Visibility,
  Assignment,
  LocationOn,
  FilterList,
  Refresh
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

function AuthorityDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
    urgent: 0
  });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    search: ''
  });

  const calculateStatsFromReports = useCallback(async () => {
    try {
      console.log('Calculating stats from reports...');
      const response = await axios.get('/api/reports');
      const allReports = response.data.reports;
      
      const stats = {
        total: allReports.length,
        pending: allReports.filter(r => r.status === 'pending').length,
        inProgress: allReports.filter(r => r.status === 'in_progress').length,
        resolved: allReports.filter(r => r.status === 'resolved').length,
        urgent: allReports.filter(r => r.priority === 'urgent').length
      };
      
      setStats(stats);
      console.log('Stats calculated from reports:', stats);
    } catch (error) {
      console.error('Error calculating stats from reports:', error);
      toast.error('Failed to calculate dashboard stats');
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Define these functions inline to avoid dependency issues
      const fetchReports = async () => {
        try {
          const params = new URLSearchParams();
          if (filters.status !== 'all') params.append('status', filters.status);
          if (filters.priority !== 'all') params.append('priority', filters.priority);
          params.append('limit', '20');

          const response = await axios.get(`/api/reports?${params}`);
          let filteredReports = response.data.reports;

          // Client-side search filter
          if (filters.search) {
            filteredReports = filteredReports.filter(report =>
              report.reportId.toLowerCase().includes(filters.search.toLowerCase()) ||
              report.location.address.toLowerCase().includes(filters.search.toLowerCase()) ||
              report.citizenId?.name?.toLowerCase().includes(filters.search.toLowerCase())
            );
          }

          setReports(filteredReports);
        } catch (error) {
          console.error('Error fetching reports:', error);
          throw error;
        }
      };

      const fetchStats = async () => {
        try {
          console.log('Fetching dashboard stats...');
          console.log('Current user:', user);
          console.log('User role:', user?.role);
          console.log('Axios default headers:', axios.defaults.headers.common);
          
          // Check if user has authority role
          if (!user || user.role !== 'authority') {
            console.log('User is not an authority, using fallback stats calculation');
            await calculateStatsFromReports();
            return;
          }
          
          console.log('Attempting to call /api/dashboard/stats...');
          const response = await axios.get('/api/dashboard/stats');
          console.log('Dashboard stats response:', response.data);
          
          if (response.data.success && response.data.data.overview) {
            const overview = response.data.data.overview;
            // Map backend field names to frontend state names
            const mappedStats = {
              total: overview.totalReports || 0,
              pending: overview.pendingReports || 0,
              inProgress: overview.inProgressReports || 0,
              resolved: overview.resolvedReports || 0,
              urgent: 0 // This will be calculated from reports
            };
            
            setStats(mappedStats);
            console.log('Stats mapped and set from dashboard endpoint:', mappedStats);
          } else {
            console.log('Dashboard endpoint returned invalid data, using fallback');
            // Fallback to basic stats calculation
            await calculateStatsFromReports();
          }
        } catch (error) {
          console.error('Error fetching stats:', error);
          console.error('Error response:', error.response);
          console.error('Error status:', error.response?.status);
          console.error('Error data:', error.response?.data);
          
          if (error.response?.status === 403) {
            console.log('Access denied - user may not have authority role');
            toast.error('Access denied. Authority role required.');
          } else if (error.response?.status === 401) {
            console.log('Unauthorized - token may be invalid');
            toast.error('Authentication required. Please login again.');
          }
          // Fallback to basic stats calculation
          await calculateStatsFromReports();
        }
      };

      await Promise.all([fetchReports(), fetchStats()]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [filters, user, calculateStatsFromReports]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAssignReport = async (reportId) => {
    try {
      // For now, assign to current user (authority)
      await axios.put(`/api/reports/${reportId}/assign`, {
        assignedTo: user.userId
      });
      toast.success('Report assigned successfully');
      fetchData();
    } catch (error) {
      console.error('Error assigning report:', error);
      toast.error('Failed to assign report');
    }
  };

  const handleStartProgress = async (reportId) => {
    try {
      await axios.put(`/api/reports/${reportId}/status`, {
        status: 'in_progress'
      });
      toast.success('Report status updated to In Progress');
      fetchData();
    } catch (error) {
      console.error('Error updating report status:', error);
      toast.error('Failed to update report status');
    }
  };

  const handleResolveReport = async (reportId) => {
    try {
      const resolutionNotes = prompt('Please enter resolution notes (minimum 10 characters):');
      if (!resolutionNotes || resolutionNotes.length < 10) {
        toast.error('Resolution notes must be at least 10 characters long');
        return;
      }

      await axios.put(`/api/reports/${reportId}/resolve`, {
        resolutionNotes
      });
      toast.success('Report resolved successfully');
      fetchData();
    } catch (error) {
      console.error('Error resolving report:', error);
      toast.error('Failed to resolve report');
    }
  };



  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'in_progress': return 'info';
      case 'resolved': return 'success';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'low': return 'success';
      case 'medium': return 'warning';
      case 'high': return 'error';
      case 'urgent': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Schedule />;
      case 'in_progress': return <TrendingUp />;
      case 'resolved': return <CheckCircle />;
      case 'rejected': return <Warning />;
      default: return <Report />;
    }
  };

  // Check if user has authority role
  if (!user || user.role !== 'authority') {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Warning sx={{ fontSize: 64, color: 'warning.main', mb: 2 }} />
          <Typography variant="h5" color="warning.main" gutterBottom>
            Access Restricted
          </Typography>
          <Typography variant="body1" color="text.secondary">
            You need authority privileges to access this dashboard.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Current role: {user?.role || 'Not logged in'}
          </Typography>
        </Box>
      </Container>
    );
  }

  if (loading && reports.length === 0) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <LinearProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
            Authority Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage waste reports and monitor city cleanliness
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={fetchData}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.200' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'primary.main', mx: 'auto', mb: 2, width: 48, height: 48 }}>
                <Dashboard sx={{ fontSize: 24 }} />
              </Avatar>
              <Typography variant="h4" component="div" sx={{ fontWeight: 700, color: 'primary.main' }}>
                {stats.total || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Reports
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ bgcolor: 'warning.50', border: '1px solid', borderColor: 'warning.200' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'warning.main', mx: 'auto', mb: 2, width: 48, height: 48 }}>
                <Schedule sx={{ fontSize: 24 }} />
              </Avatar>
              <Typography variant="h4" component="div" sx={{ fontWeight: 700, color: 'warning.main' }}>
                {stats.pending || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pending
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ bgcolor: 'info.50', border: '1px solid', borderColor: 'info.200' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'info.main', mx: 'auto', mb: 2, width: 48, height: 48 }}>
                <TrendingUp sx={{ fontSize: 24 }} />
              </Avatar>
              <Typography variant="h4" component="div" sx={{ fontWeight: 700, color: 'info.main' }}>
                {stats.inProgress || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                In Progress
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ bgcolor: 'success.50', border: '1px solid', borderColor: 'success.200' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'success.main', mx: 'auto', mb: 2, width: 48, height: 48 }}>
                <CheckCircle sx={{ fontSize: 24 }} />
              </Avatar>
              <Typography variant="h4" component="div" sx={{ fontWeight: 700, color: 'success.main' }}>
                {stats.resolved || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Resolved
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ bgcolor: 'error.50', border: '1px solid', borderColor: 'error.200' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'error.main', mx: 'auto', mb: 2, width: 48, height: 48 }}>
                <Warning sx={{ fontSize: 24 }} />
              </Avatar>
              <Typography variant="h4" component="div" sx={{ fontWeight: 700, color: 'error.main' }}>
                {stats.urgent || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Urgent
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters and Reports */}
      <Card>
        <CardContent>
          {/* Filters */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <FilterList sx={{ mr: 1 }} />
              Filters & Reports
            </Typography>
            
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search reports..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filters.status}
                    label="Status"
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                  >
                    <MenuItem value="all">All Status</MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="in_progress">In Progress</MenuItem>
                    <MenuItem value="resolved">Resolved</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={filters.priority}
                    label="Priority"
                    onChange={(e) => handleFilterChange('priority', e.target.value)}
                  >
                    <MenuItem value="all">All Priorities</MenuItem>
                    <MenuItem value="urgent">Urgent</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="low">Low</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>

          {/* Reports Table */}
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Report ID</TableCell>
                  <TableCell>Citizen</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Volume (m³)</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report._id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {getStatusIcon(report.status)}
                        <Typography variant="body2" sx={{ ml: 1, fontWeight: 500 }}>
                          {report.reportId}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {report.citizenId?.name || 'Unknown'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {report.citizenId?.email}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <LocationOn sx={{ fontSize: 16, color: 'grey.500', mr: 1 }} />
                        <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                          {report.location.address}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={report.status.replace('_', ' ').toUpperCase()}
                        color={getStatusColor(report.status)}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={report.priority.toUpperCase()}
                        color={getPriorityColor(report.priority)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {report.wasteDetection?.estimatedVolume?.toFixed(2) || '0.00'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {format(new Date(report.createdAt), 'MMM dd, yyyy')}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/reports/${report._id}`)}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        {report.status === 'pending' && (
                          <Tooltip title="Assign to Me">
                            <IconButton
                              size="small"
                              onClick={() => handleAssignReport(report._id)}
                            >
                              <Assignment />
                            </IconButton>
                          </Tooltip>
                        )}
                        {report.status === 'pending' && (
                          <Tooltip title="Start Progress">
                            <IconButton
                              size="small"
                              color="info"
                              onClick={() => handleStartProgress(report._id)}
                            >
                              <TrendingUp />
                            </IconButton>
                          </Tooltip>
                        )}
                        {(report.status === 'pending' || report.status === 'in_progress') && (
                          <Tooltip title="Resolve Report">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => handleResolveReport(report._id)}
                            >
                              <CheckCircle />
                            </IconButton>
                          </Tooltip>
                        )}

                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {reports.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Report sx={{ fontSize: 64, color: 'grey.300', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No reports found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {filters.status !== 'all' || filters.priority !== 'all' || filters.search
                  ? 'Try adjusting your filters to see more reports.'
                  : 'No waste reports have been submitted yet.'}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Container>
  );
}

export default AuthorityDashboard;
