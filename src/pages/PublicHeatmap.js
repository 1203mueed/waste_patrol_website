import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Paper, Container, Chip, Grid, Card, CardContent, ImageList, ImageListItem, Button, IconButton, Tooltip } from '@mui/material';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { AutoMode, Timer } from '@mui/icons-material';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';

const PublicHeatmap = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imageLoading, setImageLoading] = useState({});
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds default
  const [lastChange, setLastChange] = useState(null);

  // Fetch all reports - simple and reliable
  const fetchPublicReports = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching reports from API...');
      const response = await axios.get('http://localhost:5000/api/reports/public');
      const newReports = response.data;
      
      console.log('📊 API returned:', newReports.length, 'reports');
      
      // Get current reports count for comparison
      setReports(prevReports => {
        console.log('📊 Previous state had:', prevReports.length, 'reports');
        
        // Simple change detection - just log if count changes
        if (prevReports.length > 0 && newReports.length !== prevReports.length) {
          const change = newReports.length - prevReports.length;
          if (change > 0) {
            console.log(`🆕 ${change} new report(s) added!`);
          } else {
            console.log(`🗑️ ${Math.abs(change)} report(s) removed!`);
          }
          setLastChange(new Date());
        }
        
        return newReports;
      });
      
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching public reports:', error);
      // Use mock data for demo
      setReports([
        {
          _id: '1',
          reportId: 'WR-1756541026270-ABC123',
          location: { coordinates: [23.7937, 90.4066] }, // Dhaka coordinates
          wasteDetection: {
            totalWasteArea: 15000,
            estimatedVolume: 1.5,
            wasteTypes: ['plastic', 'paper'],
            severityLevel: 'medium'
          },
          status: 'pending',
          priority: 'medium',
          createdAt: new Date().toISOString(),
          originalImage: {
            filename: 'wasteImage-1756541026270-84891506.jpg'
          },
          processedImage: {
            filename: 'processed_wasteImage-1756541026270-84891506.jpg'
          }
        },
        {
          _id: '2',
          reportId: 'WR-1756541117563-DEF456',
          location: { coordinates: [23.7937, 90.4066] },
          wasteDetection: {
            totalWasteArea: 30000,
            estimatedVolume: 3.0,
            wasteTypes: ['organic', 'plastic'],
            severityLevel: 'high'
          },
          status: 'pending',
          priority: 'high',
          createdAt: new Date().toISOString(),
          originalImage: {
            filename: 'wasteImage-1756541117563-132291603.jpg'
          },
          processedImage: {
            filename: 'processed_wasteImage-1756541117563-132291603.jpg'
          }
        },
        {
          _id: '3',
          reportId: 'WR-1756542603496-GHI789',
          location: { coordinates: [23.7937, 90.4066] },
          wasteDetection: {
            totalWasteArea: 0,
            estimatedVolume: 0.0,
            wasteTypes: [],
            severityLevel: 'low'
          },
          status: 'pending',
          priority: 'low',
          createdAt: new Date().toISOString(),
          originalImage: {
            filename: 'wasteImage-1756542603496-833079703.jpg'
          }
        }
      ]);
      setLastUpdate(new Date());
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchPublicReports();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchPublicReports]);

  // Initial fetch
  useEffect(() => {
    fetchPublicReports();
  }, [fetchPublicReports]);

  // Refresh when tab becomes visible (catches changes made in other tabs/windows)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && autoRefresh) {
        console.log('🔄 Tab became visible, refreshing data...');
        fetchPublicReports();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [fetchPublicReports, autoRefresh]);

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'low': return '#4caf50';
      case 'medium': return '#ff9800';
      case 'high': return '#f44336';
      case 'critical': return '#d32f2f';
      default: return '#9e9e9e';
    }
  };

  const getVolumeColor = (volume) => {
    if (volume === 0) return '#607d8b';    // Blue-grey for no waste detected (more visible)
    if (volume < 1) return '#4caf50';      // Green for low volume
    if (volume < 3) return '#ff9800';      // Orange for medium volume
    if (volume < 5) return '#ff5722';      // Red-orange for high volume
    return '#d32f2f';                      // Dark red for critical volume
  };

  const getMarkerSize = (volume) => {
    // Prevent overlapping by using smaller, more reasonable sizes
    if (volume === 0) return 8;            // Larger size for no waste detected (more visible)
    const baseSize = Math.max(8, Math.min(24, volume * 2));
    return baseSize;
  };

  const handleImageLoad = (reportId, imageType) => {
    setImageLoading(prev => ({
      ...prev,
      [`${reportId}-${imageType}`]: false
    }));
  };

  const handleImageError = (reportId, imageType) => {
    setImageLoading(prev => ({
      ...prev,
      [`${reportId}-${imageType}`]: false
    }));
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>Loading heatmap...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <style>
        {`
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
          }
        `}
      </style>
      <Typography variant="h4" gutterBottom color="primary" sx={{ mb: 3 }}>
        🗺️ Waste Patrol - Public Heatmap
      </Typography>
      
      {/* Real-time Control Panel */}
      <Paper elevation={2} sx={{ p: 2, mb: 3, bgcolor: 'background.default' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AutoMode color="primary" />
              Real-time Updates
            </Typography>
            <Chip 
              label={autoRefresh ? 'ON' : 'OFF'} 
              color={autoRefresh ? 'success' : 'default'}
              size="small"
              variant="outlined"
            />
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Timer sx={{ fontSize: 20, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                {refreshInterval / 1000}s
              </Typography>
            </Box>
            

            
            <Button
              variant={autoRefresh ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setAutoRefresh(!autoRefresh)}
              color={autoRefresh ? 'primary' : 'default'}
            >
              {autoRefresh ? 'Stop Auto-refresh' : 'Start Auto-refresh'}
            </Button>
          </Box>
        </Box>
        
        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </Typography>
          {lastChange && (
            <Typography variant="body2" color="text.secondary">
              • Last change: {lastChange.toLocaleTimeString()}
            </Typography>
          )}
          <Typography variant="body2" color="text.secondary">
            • Reports: {reports.length}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Auto-refresh: {autoRefresh ? 'Every ' + (refreshInterval / 1000) + 's' : 'Disabled'}
          </Typography>
          {loading && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ 
                width: 8, 
                height: 8, 
                borderRadius: '50%', 
                bgcolor: 'primary.main',
                animation: 'pulse 1.5s ease-in-out infinite'
              }} />
              <Typography variant="body2" color="primary.main" sx={{ fontWeight: 500 }}>
                Updating...
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 2, height: '500px' }}>
            <MapContainer
              center={[23.7937, 90.4066]}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              {reports.map((report) => (
                <CircleMarker
                  key={report._id}
                  center={[report.location.coordinates[1], report.location.coordinates[0]]}
                  radius={getMarkerSize(report.wasteDetection?.estimatedVolume || 0)}
                  fillColor={getVolumeColor(report.wasteDetection?.estimatedVolume || 0)}
                  color={getSeverityColor(report.wasteDetection?.severityLevel || 'low')}
                  weight={report.wasteDetection?.totalWasteArea > 0 ? 3 : 2}
                  opacity={0.9}
                  fillOpacity={report.wasteDetection?.totalWasteArea > 0 ? 0.8 : 0.6}
                  eventHandlers={{
                    click: () => {
                      // Set initial loading state for images
                      if (report.originalImage) {
                        setImageLoading(prev => ({ ...prev, [`${report._id}-original`]: true }));
                      }
                      if (report.processedImage) {
                        setImageLoading(prev => ({ ...prev, [`${report._id}-processed`]: true }));
                      }
                    }
                  }}
                >
                  <Popup>
                    <Box sx={{ minWidth: 300, p: 1 }}>
                      <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 600 }}>
                        🗑️ Waste Report
                      </Typography>
                      
                      <Box sx={{ mb: 1.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                          Report ID: {report.reportId || 'N/A'}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                          {report.wasteDetection?.totalWasteArea > 0 
                            ? `Volume: ${report.wasteDetection?.estimatedVolume?.toFixed(2) || '0.00'} m³`
                            : 'No garbage detected'
                          }
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                          {report.wasteDetection?.totalWasteArea > 0 
                            ? `Severity: ${report.wasteDetection?.severityLevel || 'low'}`
                            : 'Status: No waste detected'
                          }
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                          Priority: {report.priority || 'low'}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                          Status: {report.status.replace('_', ' ')}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          Reported: {new Date(report.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                      
                      {/* Images Section */}
                      {(report.originalImage || report.processedImage) && (
                        <Box sx={{ mb: 1.5 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                            📸 Images
                          </Typography>
                          <ImageList sx={{ width: '100%', height: 'auto', maxHeight: 200 }} cols={2} rowHeight={100}>
                            {report.originalImage && (
                              <ImageListItem>
                                <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
                                  <img
                                    src={`/uploads/waste-images/${report.originalImage.filename}`}
                                    alt="Original waste image"
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      objectFit: 'cover',
                                      borderRadius: 4,
                                      display: imageLoading[`${report._id}-original`] === false ? 'block' : 'none'
                                    }}
                                    onLoad={() => handleImageLoad(report._id, 'original')}
                                    onError={() => handleImageError(report._id, 'original')}
                                  />
                                  {imageLoading[`${report._id}-original`] !== false && (
                                    <Box sx={{ 
                                      display: 'flex', 
                                      alignItems: 'center', 
                                      justifyContent: 'center', 
                                      height: '100%',
                                      bgcolor: 'grey.100',
                                      borderRadius: 4
                                    }}>
                                      <Typography variant="caption" color="text.secondary">
                                        Loading...
                                      </Typography>
                                    </Box>
                                  )}
                                </Box>
                                <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 0.5 }}>
                                  Original
                                </Typography>
                              </ImageListItem>
                            )}
                            {report.processedImage && (
                              <ImageListItem>
                                <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
                                  <img
                                    src={`http://localhost:8000/processed/${report.processedImage.filename}`}
                                    alt="AI processed image"
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      objectFit: 'cover',
                                      borderRadius: 4,
                                      display: imageLoading[`${report._id}-processed`] === false ? 'block' : 'none'
                                    }}
                                    onLoad={() => handleImageLoad(report._id, 'processed')}
                                    onError={() => handleImageError(report._id, 'processed')}
                                  />
                                  {imageLoading[`${report._id}-processed`] !== false && (
                                    <Box sx={{ 
                                      display: 'flex', 
                                      alignItems: 'center', 
                                      justifyContent: 'center', 
                                      height: '100%',
                                      bgcolor: 'grey.100',
                                      borderRadius: 4
                                    }}>
                                      <Typography variant="caption" color="text.secondary">
                                        Loading...
                                      </Typography>
                                    </Box>
                                  )}
                                </Box>
                                <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 0.5 }}>
                                  AI Processed
                                </Typography>
                              </ImageListItem>
                            )}
                          </ImageList>
                        </Box>
                      )}
                      
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Chip 
                          label={report.wasteDetection?.totalWasteArea > 0 ? (report.wasteDetection?.severityLevel || 'low') : 'No waste'} 
                          color={report.wasteDetection?.totalWasteArea > 0 
                            ? (report.wasteDetection?.severityLevel === 'high' || report.wasteDetection?.severityLevel === 'critical' ? 'error' : report.wasteDetection?.severityLevel === 'medium' ? 'warning' : 'success')
                            : 'default'
                          }
                          size="small"
                          sx={{ fontWeight: 500 }}
                        />
                        <Chip 
                          label={report.priority || 'low'} 
                          color={report.priority === 'urgent' ? 'error' : report.priority === 'high' ? 'warning' : report.priority === 'medium' ? 'info' : 'success'}
                          size="small"
                          variant="outlined"
                        />
                        <Chip 
                          label={report.status} 
                          color={report.status === 'pending' ? 'warning' : report.status === 'in_progress' ? 'info' : 'success'}
                          size="small" 
                          variant="outlined"
                        />
                      </Box>
                    </Box>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          {/* Map Legend */}
          <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>🎨 Map Legend</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: '#607d8b', border: '2px solid #455a64' }} />
                <Typography variant="body2" sx={{ fontWeight: 500 }}>No Waste Detected</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: '#4caf50', border: '2px solid #2e7d32' }} />
                <Typography variant="body2" sx={{ fontWeight: 500 }}>Low Volume (&lt;1 m³)</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: '#ff9800', border: '2px solid #e65100' }} />
                <Typography variant="body2" sx={{ fontWeight: 500 }}>Medium Volume (1-3 m³)</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: '#ff5722', border: '2px solid #d84315' }} />
                <Typography variant="body2" sx={{ fontWeight: 500 }}>High Volume (3-5 m³)</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: '#d32f2f', border: '2px solid #b71c1c' }} />
                <Typography variant="body2" sx={{ fontWeight: 500 }}>Critical Volume (&gt;5 m³)</Typography>
              </Box>
            </Box>
          </Paper>

          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>📊 Live Statistics</Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">Total Reports</Typography>
              <Typography variant="h4" color="primary" sx={{ fontWeight: 600 }}>{reports.length}</Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">Waste Detected</Typography>
              <Typography variant="h6" color="success.main" sx={{ fontWeight: 600 }}>
                {reports.filter(r => r.wasteDetection?.totalWasteArea > 0).length}
              </Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">High Priority</Typography>
              <Typography variant="h6" color="error" sx={{ fontWeight: 600 }}>
                {reports.filter(r => r.wasteDetection?.severityLevel === 'high' || r.wasteDetection?.severityLevel === 'critical').length}
              </Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">Total Volume</Typography>
              <Typography variant="h6" color="primary" sx={{ fontWeight: 600 }}>
                {reports.reduce((sum, r) => sum + (r.wasteDetection?.totalWasteArea > 0 ? (r.wasteDetection?.estimatedVolume || 0) : 0), 0).toFixed(2)} m³
              </Typography>
            </Box>
          </Paper>
          
          <Paper elevation={3} sx={{ p: 2, mt: 2 }}>
            <Typography variant="h6" gutterBottom>🔍 Recent Reports</Typography>
            {reports.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  No reports yet. Be the first to report waste!
                </Typography>
              </Box>
            ) : (
              reports.slice(0, 5).map((report) => (
                <Card key={report._id} sx={{ mb: 1, '&:hover': { boxShadow: 3 } }}>
                  <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {report.wasteDetection?.totalWasteArea > 0 
                          ? `${report.wasteDetection?.estimatedVolume?.toFixed(2) || '0.00'} m³`
                          : 'No waste detected'
                        }
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                      <Chip 
                        label={report.wasteDetection?.totalWasteArea > 0 ? (report.wasteDetection?.severityLevel || 'low') : 'No waste'} 
                        color={report.wasteDetection?.totalWasteArea > 0 
                          ? (report.wasteDetection?.severityLevel === 'high' || report.wasteDetection?.severityLevel === 'critical' ? 'error' : report.wasteDetection?.severityLevel === 'medium' ? 'warning' : 'success')
                          : 'default'
                        }
                        size="small" 
                        sx={{ fontWeight: 500 }}
                      />
                      <Chip 
                        label={report.status} 
                        color={report.status === 'pending' ? 'warning' : report.status === 'in_progress' ? 'info' : 'success'}
                        size="small" 
                        variant="outlined"
                      />
                    </Box>
                  </CardContent>
                </Card>
              ))
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default PublicHeatmap;
