import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Grid,
  Avatar,
  Divider,
  Button,
  TextField,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
  LinearProgress,
  Alert
} from '@mui/material';
import {
  LocationOn,
  Person,
  Schedule,
  CheckCircle,
  Comment,
  Send,
  Image as ImageIcon,
  Analytics,
  Delete
} from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

function ReportDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const fetchReport = useCallback(async () => {
    try {
      const response = await axios.get(`/api/reports/${id}`);
      setReport(response.data.report);
    } catch (error) {
      console.error('Error fetching report:', error);
      toast.error('Failed to load report details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setSubmittingComment(true);
    try {
      await axios.post(`/api/reports/${id}/comments`, { message: comment });
      toast.success('Comment added successfully');
      setComment('');
      fetchReport();
    } catch (error) {
      console.error('Error adding comment:', error);
      const errorMessage = error.response?.data?.message || 'Failed to add comment';
      toast.error(errorMessage);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteReport = async () => {
    if (!window.confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
      return;
    }

    try {
      await axios.delete(`/api/reports/${id}`);
      toast.success('Report deleted successfully');
      // Redirect to dashboard after deletion
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Error deleting report:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete report';
      toast.error(errorMessage);
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

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <LinearProgress />
      </Container>
    );
  }

  if (!report) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          Report not found or you don't have permission to view it.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
          Report Details
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {report.reportId}
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Main Report Information */}
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
                             <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                 <Box>
                   <Typography variant="h6" gutterBottom>
                     Waste Report Information
                   </Typography>
                   <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center' }}>
                     <Chip
                       label={report.status.replace('_', ' ').toUpperCase()}
                       color={getStatusColor(report.status)}
                       variant="outlined"
                     />
                     <Chip
                       label={`${report.priority.toUpperCase()} PRIORITY`}
                       color={getPriorityColor(report.priority)}
                     />
                     {/* Delete button - only show for pending reports owned by current user (citizens only) */}
                     {(() => {
                       console.log('🔍 Delete button debug:', {
                         reportStatus: report.status,
                         reportCitizenId: report.citizen?._id,
                         userId: user?.userId,
                         userRole: user?.role,
                         shouldShow: report.status === 'pending' && report.citizen?._id === user?.userId && user?.role === 'citizen'
                       });
                       return report.status === 'pending' && report.citizen?._id === user?.userId && user?.role === 'citizen';
                     })() && (
                       <Button
                         variant="outlined"
                         color="error"
                         size="small"
                         startIcon={<Delete />}
                         onClick={handleDeleteReport}
                         sx={{ ml: 1 }}
                       >
                         Delete Report
                       </Button>
                     )}
                   </Box>
                 </Box>
                 <Typography variant="body2" color="text.secondary">
                   {format(new Date(report.createdAt), 'PPP')}
                 </Typography>
               </Box>

              {/* Location Information */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <LocationOn sx={{ mr: 1, color: 'primary.main' }} />
                  Location
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {report.location.address}
                </Typography>
                {report.location.landmark && (
                  <Typography variant="body2" color="text.secondary">
                    Landmark: {report.location.landmark}
                  </Typography>
                )}
                <Typography variant="caption" color="text.secondary">
                  Coordinates: {(() => {
                    const lat = report.location.coordinates[1];
                    const lng = report.location.coordinates[0];
                    const numLat = typeof lat === 'number' ? lat : parseFloat(lat) || 0;
                    const numLng = typeof lng === 'number' ? lng : parseFloat(lng) || 0;
                    return `${numLat.toFixed(6)}, ${numLng.toFixed(6)}`;
                  })()}
                </Typography>
              </Box>

              {/* Citizen Information */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <Person sx={{ mr: 1, color: 'primary.main' }} />
                  Reported By
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    {report.citizen?.name?.charAt(0)?.toUpperCase() || 'A'}
                  </Avatar>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {report.citizen?.name || 'Anonymous'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {report.citizen?.email || 'No email provided'}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* AI Detection Results */}
              {report.wasteDetection && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <Analytics sx={{ mr: 1, color: 'primary.main' }} />
                    AI Detection Results
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6} sm={4}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h6" color="primary.main">
                          {(() => {
                            const volume = report.wasteDetection.estimatedVolume;
                            const numVolume = typeof volume === 'number' ? volume : parseFloat(volume) || 0;
                            return numVolume.toFixed(2);
                          })()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Volume (m³)
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6} sm={4}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h6" color="warning.main">
                          {report.wasteDetection.totalWasteArea?.toLocaleString() || '0'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Waste Area (pixels)
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6} sm={4}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Chip
                          label={report.wasteDetection.severityLevel?.toUpperCase() || 'UNKNOWN'}
                          color={getStatusColor(report.wasteDetection.severityLevel)}
                          size="small"
                        />
                        <Typography variant="caption" color="text.secondary" display="block">
                          Severity Level
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>

                  {report.wasteDetection.totalWasteArea > 0 ? (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" gutterBottom>
                        Waste Detection Summary:
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Chip
                          label={`Volume: ${(() => {
                            const volume = report.wasteDetection.estimatedVolume;
                            const numVolume = typeof volume === 'number' ? volume : parseFloat(volume) || 0;
                            return numVolume.toFixed(2);
                          })()} m³`}
                          size="small"
                          variant="outlined"
                          color="primary"
                        />
                        <Chip
                          label={`Severity: ${report.wasteDetection.severityLevel || 'low'}`}
                          size="small"
                          variant="outlined"
                          color={report.wasteDetection.severityLevel === 'high' || report.wasteDetection.severityLevel === 'critical' ? 'error' : report.wasteDetection.severityLevel === 'medium' ? 'warning' : 'success'}
                        />
                      </Box>
                    </Box>
                  ) : (
                    <Box sx={{ mt: 2 }}>
                      <Alert severity="info" sx={{ mt: 2 }}>
                        <Typography variant="body2">
                          Our system couldn't detect any garbage from the image. However, we will take account your report. We will manually analyze your complaint and take appropriate action. Thank you for reporting. Have a good day!
                        </Typography>
                      </Alert>
                    </Box>
                  )}
                </Box>
              )}

              {/* Images */}
              <Box>
                <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <ImageIcon sx={{ mr: 1, color: 'primary.main' }} />
                  Images
                </Typography>
                <Grid container spacing={2}>
                  {report.originalImage && (
                    <Grid item xs={12} sm={6}>
                      <Paper sx={{ p: 1 }}>
                        <img
                          src={`/uploads/waste-images/${report.originalImage.filename}`}
                          alt="Original waste"
                          style={{
                            width: '100%',
                            height: 200,
                            objectFit: 'cover',
                            borderRadius: 4
                          }}
                        />
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                          Original Image
                        </Typography>
                      </Paper>
                    </Grid>
                  )}
                  {report.processedImage && (
                    <Grid item xs={12} sm={6}>
                      <Paper sx={{ p: 1 }}>
                        <img
                          src={`http://localhost:8000/processed/${report.processedImage.filename}`}
                          alt="AI processed waste"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            borderRadius: 4
                          }}
                        />
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                          AI Processed Image
                        </Typography>
                      </Paper>
                    </Grid>
                  )}
                </Grid>
              </Box>
            </CardContent>
          </Card>

          {/* Comments Section */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Comments & Updates
              </Typography>
              
              {/* Add Comment Form */}
              <Box component="form" onSubmit={handleAddComment} sx={{ mb: 3 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="Add a comment or update..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  sx={{ mb: 2 }}
                  error={comment.length > 1000}
                  helperText={comment.length > 1000 ? `Comment too long (${comment.length}/1000 characters)` : `${comment.length}/1000 characters`}
                />
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<Send />}
                  disabled={submittingComment || !comment.trim() || comment.length > 1000}
                >
                  {submittingComment ? 'Adding Comment...' : 'Add Comment'}
                </Button>
              </Box>

              <Divider sx={{ mb: 2 }} />

              {/* Comments List */}
              <List>
                {report.comments && report.comments.length > 0 ? (
                  report.comments.map((comment, index) => (
                    <ListItem key={index} alignItems="flex-start" sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          <Comment />
                        </Avatar>
                      </ListItemAvatar>
                                             <ListItemText
                         primary={
                           <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                             <Typography variant="subtitle2" component="span">
                               {typeof comment.user === 'object' ? comment.user?.name : 'User'}
                             </Typography>
                             <Typography variant="caption" color="text.secondary" component="span">
                               {format(new Date(comment.timestamp), 'PPp')}
                             </Typography>
                           </Box>
                         }
                         secondary={
                           <Typography variant="body2" component="span" sx={{ mt: 1 }}>
                             {comment.message}
                           </Typography>
                         }
                       />
                    </ListItem>
                  ))
                ) : (
                                     <ListItem sx={{ px: 0 }}>
                     <ListItemText
                       primary="No comments yet"
                       secondary="Be the first to add a comment or update"
                       primaryTypographyProps={{ component: 'span' }}
                       secondaryTypographyProps={{ component: 'span' }}
                     />
                   </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Status Timeline */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Status Timeline
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                      <Schedule sx={{ fontSize: 16 }} />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Report Created"
                    secondary={format(new Date(report.createdAt), 'PPp')}
                  />
                </ListItem>
                
                {report.assignedTo && (
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'info.main', width: 32, height: 32 }}>
                        <Person sx={{ fontSize: 16 }} />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={`Assigned to ${report.assignedTo.name}`}
                      secondary="In Progress"
                    />
                  </ListItem>
                )}
                
                {report.status === 'resolved' && report.resolution && (
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'success.main', width: 32, height: 32 }}>
                        <CheckCircle sx={{ fontSize: 16 }} />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary="Resolved"
                      secondary={format(new Date(report.resolution.resolvedAt), 'PPp')}
                    />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>

          {/* Resolution Details */}
          {report.status === 'resolved' && report.resolution && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Resolution Details
                </Typography>
                <Typography variant="body2" paragraph>
                  <strong>Resolved by:</strong> {report.resolution.resolvedBy?.name}
                </Typography>
                <Typography variant="body2" paragraph>
                  <strong>Resolution Notes:</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {report.resolution.resolutionNotes}
                </Typography>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Container>
  );
}

export default ReportDetails;
