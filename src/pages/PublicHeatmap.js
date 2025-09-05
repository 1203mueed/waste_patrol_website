import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Paper, Container, Chip, Grid, Card, CardContent, ImageList, ImageListItem } from '@mui/material';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'leaflet.heat';
import axios from 'axios';

// Custom hook for heatmap layer
const HeatmapLayer = ({ points }) => {
  const map = useMap();

  useEffect(() => {
    if (points && points.length > 0) {
      const heatLayer = L.heatLayer(points, {
        radius: 25,
        blur: 15,
        maxZoom: 17,
        max: 1.0,
        minOpacity: 0.4,
        gradient: {
          0.0: '#4CAF50',
          0.2: '#8BC34A', 
          0.4: '#CDDC39',
          0.6: '#FFC107',
          0.8: '#FF9800',
          1.0: '#F44336'
        }
      }).addTo(map);

      return () => {
        map.removeLayer(heatLayer);
      };
    }
  }, [map, points]);

  return null;
};

const PublicHeatmap = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imageLoading, setImageLoading] = useState({});

  // Fetch all reports
  const fetchPublicReports = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching reports from API...');
      const response = await axios.get('http://localhost:5000/api/reports/public');
      const newReports = response.data;
      
      console.log('📊 API returned:', newReports.length, 'reports');
      setReports(newReports);
    } catch (error) {
      console.error('Error fetching public reports:', error);
      // Use mock data for demo
      setReports([
        {
          _id: '1',
          reportId: 'WR-1756541026270-ABC123',
          location: { coordinates: [90.4066, 23.7937] },
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
          location: { coordinates: [90.4066, 23.7937] },
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
          location: { coordinates: [90.4066, 23.7937] },
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
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchPublicReports();
  }, [fetchPublicReports]);

  // Convert reports to heatmap points
  const heatmapPoints = reports
    .filter(report => report.wasteDetection?.totalWasteArea > 0)
    .map(report => [
      report.location.coordinates[1], // lat
      report.location.coordinates[0], // lng
      Math.min(report.wasteDetection?.estimatedVolume || 0.1, 5) / 5 // intensity (0-1)
    ]);


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
      <Typography variant="h4" gutterBottom color="primary" sx={{ mb: 3 }}>
        🗺️ Public Heatmap
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 2, height: '500px' }}>
            <MapContainer
              center={[23.7937, 90.4066]}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
            >
              {/* CartoDB Positron - Clean, minimal style */}
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              />
              <HeatmapLayer points={heatmapPoints} />
            </MapContainer>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          {/* Heatmap Legend */}
          <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>🎨 Intensity Scale</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ 
                  width: 20, 
                  height: 20, 
                  background: 'linear-gradient(90deg, #4CAF50, #8BC34A)',
                  borderRadius: 1
                }} />
                <Typography variant="body2" sx={{ fontWeight: 500 }}>Low Impact</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ 
                  width: 20, 
                  height: 20, 
                  background: 'linear-gradient(90deg, #CDDC39, #FFC107)',
                  borderRadius: 1
                }} />
                <Typography variant="body2" sx={{ fontWeight: 500 }}>Medium Impact</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ 
                  width: 20, 
                  height: 20, 
                  background: 'linear-gradient(90deg, #FF9800, #F44336)',
                  borderRadius: 1
                }} />
                <Typography variant="body2" sx={{ fontWeight: 500 }}>High Impact</Typography>
              </Box>
            </Box>
          </Paper>

          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>📊 Statistics</Typography>
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
                  No reports yet. Be the first to report!
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
                    
                    {/* Images Section */}
                    {(report.originalImage || report.processedImage) && (
                      <Box sx={{ mb: 1.5 }}>
                        <ImageList sx={{ width: '100%', height: 'auto', maxHeight: 120 }} cols={2} rowHeight={60}>
                          {report.originalImage && (
                            <ImageListItem>
                              <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
                                <img
                                  src={`/uploads/waste-images/${report.originalImage.filename}`}
                                  alt="Original"
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
                            </ImageListItem>
                          )}
                          {report.processedImage && (
                            <ImageListItem>
                              <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
                                <img
                                  src={`http://localhost:8000/processed/${report.processedImage.filename}`}
                                  alt="Processed"
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
                            </ImageListItem>
                          )}
                        </ImageList>
                      </Box>
                    )}
                    
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
