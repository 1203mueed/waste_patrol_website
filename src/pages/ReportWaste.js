import React, { useState, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Chip,
  LinearProgress
} from '@mui/material';
import {
  CloudUpload,
  LocationOn,
  Send,
  CheckCircle
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function LocationMarker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  return position === null ? null : (
    <Marker position={position} />
  );
}

function ReportWaste() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    address: '',
    landmark: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [position, setPosition] = useState([23.8103, 90.4125]); // Default to Dhaka
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingStage, setProcessingStage] = useState('');

  // Function to compress image
  const compressImage = (file, maxSizeMB = 10) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions (maintain aspect ratio)
        let { width, height } = img;
        const maxDimension = 1920; // Max width or height
        
        if (width > height && width > maxDimension) {
          height = (height * maxDimension) / width;
          width = maxDimension;
        } else if (height > maxDimension) {
          width = (width * maxDimension) / height;
          height = maxDimension;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        // Try different quality levels until file size is acceptable
        let quality = 0.8;
        const tryCompress = () => {
          canvas.toBlob((blob) => {
            const sizeMB = blob.size / (1024 * 1024);
            
            if (sizeMB <= maxSizeMB || quality <= 0.1) {
              // Create new file with compressed data
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } else {
              quality -= 0.1;
              tryCompress();
            }
          }, 'image/jpeg', quality);
        };
        
        tryCompress();
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      
      // Check if file needs compression
      const fileSizeMB = file.size / (1024 * 1024);
      
      if (fileSizeMB > 10) {
        toast(`Compressing image from ${fileSizeMB.toFixed(2)}MB...`, {
          icon: 'ℹ️',
          duration: 3000
        });
        try {
          const compressedFile = await compressImage(file, 10);
          const compressedSizeMB = compressedFile.size / (1024 * 1024);
          toast.success(`Image compressed to ${compressedSizeMB.toFixed(2)}MB`);
          setSelectedFile(compressedFile);
        } catch (error) {
          console.error('Compression error:', error);
          toast.error('Failed to compress image. Please try a smaller image.');
        }
      } else {
        setSelectedFile(file);
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png']
    },
    multiple: false
    // Removed maxSize restriction - we handle compression ourselves
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setPosition([latitude, longitude]);
          toast.success('Location detected successfully!');
        },
        (error) => {
          console.error('Error getting location:', error);
          toast.error('Could not get your location. Please select manually on the map.');
        }
      );
    } else {
      toast.error('Geolocation is not supported by this browser.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedFile) {
      toast.error('Please select an image to upload');
      return;
    }

    if (!formData.address.trim()) {
      toast.error('Please provide an address');
      return;
    }

    setLoading(true);
    setUploadProgress(0);
    setProcessingStage('Uploading image...');

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('wasteImage', selectedFile);
      formDataToSend.append('latitude', position[0].toString());
      formDataToSend.append('longitude', position[1].toString());
      formDataToSend.append('address', formData.address);
      formDataToSend.append('landmark', formData.landmark);

      const response = await axios.post('/api/reports', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
          
          if (progress === 100) {
            setProcessingStage('Processing image with AI...');
          }
        }
      });

      if (response.data.success) {
        toast.success('Waste report submitted successfully!');
        console.log('📊 Report creation response:', response.data);
        const reportId = response.data.report.id || response.data.report._id;
        console.log('📊 Extracted report ID:', reportId);
        if (reportId) {
          navigate(`/reports/${reportId}`);
        } else {
          console.error('No report ID in response:', response.data);
          toast.error('Report created but could not navigate to details');
          navigate('/dashboard');
        }
      }
    } catch (error) {
      console.error('Report submission error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to submit report';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setUploadProgress(0);
      setProcessingStage('');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600, mb: 4 }}>
        Report Waste Issue
      </Typography>

      <form onSubmit={handleSubmit}>
        <Grid container spacing={4}>
          {/* Image Upload Section */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Upload Waste Image
                </Typography>
                
                <Box
                  {...getRootProps()}
                  sx={{
                    border: '2px dashed',
                    borderColor: isDragActive ? 'primary.main' : 'grey.300',
                    borderRadius: 2,
                    p: 4,
                    textAlign: 'center',
                    cursor: 'pointer',
                    bgcolor: isDragActive ? 'primary.50' : 'grey.50',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: 'primary.50'
                    }
                  }}
                >
                  <input {...getInputProps()} />
                  <CloudUpload sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
                  
                  {selectedFile ? (
                    <Box>
                      <Typography variant="body1" color="success.main" gutterBottom>
                        <CheckCircle sx={{ mr: 1, verticalAlign: 'middle' }} />
                        File selected: {selectedFile.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </Typography>
                    </Box>
                  ) : (
                    <Box>
                      <Typography variant="body1" gutterBottom>
                        {isDragActive
                          ? 'Drop the image here...'
                          : 'Drag & drop a waste image here, or click to select'
                        }
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Supports: JPEG, PNG (Large images will be automatically compressed)
                      </Typography>
                    </Box>
                  )}
                </Box>

                {selectedFile && (
                  <Box sx={{ mt: 2 }}>
                    <img
                      src={URL.createObjectURL(selectedFile)}
                      alt="Preview"
                      style={{
                        width: '100%',
                        maxHeight: 200,
                        objectFit: 'cover',
                        borderRadius: 8
                      }}
                    />
                  </Box>
                )}

                {loading && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {processingStage}
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={uploadProgress} 
                      sx={{ mb: 1 }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      {uploadProgress}% complete
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Location and Details Section */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Location & Details
                </Typography>
                
                <TextField
                  fullWidth
                  label="Address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                  margin="normal"
                  placeholder="Enter the waste location address"
                />
                
                <TextField
                  fullWidth
                  label="Landmark (Optional)"
                  name="landmark"
                  value={formData.landmark}
                  onChange={handleInputChange}
                  margin="normal"
                  placeholder="Nearby landmark or reference point"
                />

                <Box sx={{ mt: 2, mb: 2 }}>
                  <Button
                    variant="outlined"
                    startIcon={<LocationOn />}
                    onClick={getCurrentLocation}
                    fullWidth
                  >
                    Use My Current Location
                  </Button>
                </Box>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Click on the map to select exact location:
                </Typography>
                
                <Box sx={{ height: 200, border: 1, borderColor: 'grey.300', borderRadius: 1 }}>
                  <MapContainer
                    center={position}
                    zoom={13}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    />
                    <LocationMarker position={position} setPosition={setPosition} />
                  </MapContainer>
                </Box>

                <Box sx={{ mt: 2 }}>
                  <Chip
                    icon={<LocationOn />}
                    label={`Lat: ${(position[0] || 0).toFixed(6)}, Lng: ${(position[1] || 0).toFixed(6)}`}
                    variant="outlined"
                    size="small"
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Submit Button */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Send />}
                disabled={loading}
                sx={{ px: 4, py: 1.5 }}
              >
                {loading ? 'Processing Report...' : 'Submit Report'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Container>
  );
}

export default ReportWaste;
