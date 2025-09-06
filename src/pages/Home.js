import React from 'react';
import {
  Container,
  Typography,
  Button,
  Box,
  Grid,
  Card,
  CardContent,
  useTheme,
  alpha
} from '@mui/material';
import {
  Report,
  Dashboard,
  Map,
  TrendingUp,
  Security,
  Speed
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Home() {
  const theme = useTheme();
  const { isAuthenticated } = useAuth();

  const features = [
    {
      icon: <Report sx={{ fontSize: 40 }} />,
      title: 'Smart Reporting',
      description: 'Upload images and let our AI detect and analyze waste automatically with precise volume calculations.'
    },
    {
      icon: <Map sx={{ fontSize: 40 }} />,
      title: 'Interactive Heatmap',
      description: 'Visualize waste distribution across the city with real-time heatmaps based on volume and priority.'
    },
    {
      icon: <Dashboard sx={{ fontSize: 40 }} />,
      title: 'Authority Dashboard',
      description: 'Comprehensive dashboard for authorities to manage, assign, and track waste cleanup operations.'
    },
    {
      icon: <TrendingUp sx={{ fontSize: 40 }} />,
      title: 'Analytics & Insights',
      description: 'Track trends, measure performance, and make data-driven decisions for better waste management.'
    },
    {
      icon: <Speed sx={{ fontSize: 40 }} />,
      title: 'Priority Management',
      description: 'Automatic prioritization based on waste volume and type ensures critical issues are addressed first.'
    },
    {
      icon: <Security sx={{ fontSize: 40 }} />,
      title: 'Secure & Reliable',
      description: 'Built with security in mind, ensuring citizen data and reports are protected and accessible.'
    }
  ];

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: 'white',
          py: { xs: 8, md: 12 },
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography
                variant="h2"
                component="h1"
                gutterBottom
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: '2.5rem', md: '3.5rem' },
                  lineHeight: 1.2
                }}
              >
                Smart Waste Management for Modern Cities
              </Typography>
              <Typography
                variant="h5"
                paragraph
                sx={{
                  opacity: 0.9,
                  fontWeight: 300,
                  mb: 4
                }}
              >
                Empowering citizens and authorities with AI-powered waste detection, 
                real-time reporting, and intelligent priority management.
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {isAuthenticated ? (
                  <Button
                    component={Link}
                    to="/dashboard"
                    variant="contained"
                    size="large"
                    sx={{
                      px: 4,
                      py: 1.5,
                      fontSize: '1.1rem',
                      backgroundColor: theme.palette.secondary.main,
                      '&:hover': {
                        backgroundColor: theme.palette.secondary.dark,
                      }
                    }}
                  >
                    Go to Dashboard
                  </Button>
                ) : (
                  <Button
                    component={Link}
                    to="/register"
                    variant="contained"
                    size="large"
                    sx={{
                      px: 4,
                      py: 1.5,
                      fontSize: '1.1rem',
                      backgroundColor: theme.palette.secondary.main,
                      '&:hover': {
                        backgroundColor: theme.palette.secondary.dark,
                      }
                    }}
                  >
                    Get Started
                  </Button>
                )}
                
                <Button
                  component={Link}
                  to="/heatmap"
                  variant="outlined"
                  size="large"
                  sx={{
                    px: 4,
                    py: 1.5,
                    fontSize: '1.1rem',
                    borderColor: 'white',
                    color: 'white',
                    '&:hover': {
                      borderColor: 'white',
                      backgroundColor: 'rgba(255,255,255,0.1)',
                    }
                  }}
                >
                  View Live Heatmap
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  textAlign: 'center',
                  position: 'relative'
                }}
              >
                <img
                  src="/logo.png"
                  alt="Waste Patrol"
                  style={{
                    maxWidth: '100%',
                    height: 'auto',
                    maxHeight: '400px',
                    filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.3))'
                  }}
                />
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
        <Typography
          variant="h3"
          component="h2"
          textAlign="center"
          gutterBottom
          sx={{ fontWeight: 600, mb: 2 }}
        >
          Powerful Features
        </Typography>
        <Typography
          variant="h6"
          textAlign="center"
          color="text.secondary"
          paragraph
          sx={{ mb: 6, maxWidth: '600px', mx: 'auto' }}
        >
          Our comprehensive platform combines AI technology with user-friendly interfaces 
          to revolutionize waste management in your city.
        </Typography>

        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} md={6} lg={4} key={index}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: theme.shadows[8]
                  }
                }}
              >
                <CardContent sx={{ flexGrow: 1, textAlign: 'center', p: 3 }}>
                  <Box
                    sx={{
                      color: theme.palette.primary.main,
                      mb: 2
                    }}
                  >
                    {feature.icon}
                  </Box>
                  <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 600 }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Call to Action Section */}
      <Box
        sx={{
          bgcolor: alpha(theme.palette.primary.main, 0.05),
          py: { xs: 6, md: 8 }
        }}
      >
        <Container maxWidth="md" sx={{ textAlign: 'center' }}>
          <Typography
            variant="h4"
            component="h2"
            gutterBottom
            sx={{ fontWeight: 600, mb: 2 }}
          >
            Ready to Transform Your City's Waste Management?
          </Typography>
          <Typography
            variant="h6"
            color="text.secondary"
            paragraph
            sx={{ mb: 4 }}
          >
            Join thousands of citizens and authorities already using Waste Patrol 
            to create cleaner, smarter cities.
          </Typography>
          {!isAuthenticated && (
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                component={Link}
                to="/register"
                variant="contained"
                size="large"
                sx={{ px: 4, py: 1.5 }}
              >
                Start Reporting Today
              </Button>
              <Button
                component={Link}
                to="/login"
                variant="outlined"
                size="large"
                sx={{ px: 4, py: 1.5 }}
              >
                Authority Login
              </Button>
            </Box>
          )}
        </Container>
      </Box>
    </Box>
  );
}

export default Home;
