import { Box, Container, Typography, Button, Grid, Paper, Card, CardContent } from '@mui/material';
import { Link } from 'react-router-dom';
import SecurityIcon from '@mui/icons-material/Security';
import CodeIcon from '@mui/icons-material/Code';
import SpeedIcon from '@mui/icons-material/Speed';
import CloudIcon from '@mui/icons-material/Cloud';

const FeatureCard = ({ icon, title, description }) => (
  <Card 
    sx={{ 
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      transition: 'transform 0.2s, box-shadow 0.2s',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: 6
      },
      bgcolor: 'background.paper',
      color: 'text.primary'
    }}
  >
    <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
      <Box sx={{ 
        fontSize: '2.5rem', 
        mb: 2,
        color: 'primary.main'
      }}>
        {icon}
      </Box>
      <Typography 
        variant="h6" 
        component="h3" 
        gutterBottom
        sx={{ 
          fontWeight: 'bold',
          color: 'text.primary'
        }}
      >
        {title}
      </Typography>
      <Typography 
        variant="body2" 
        color="text.secondary"
        sx={{ 
          color: 'text.secondary'
        }}
      >
        {description}
      </Typography>
    </CardContent>
  </Card>
);

const Home = () => {
  return (
    <Box
      sx={{
        pb: 4,
      }}
    >
      {/* Hero Section */}
      <Box 
        sx={{ 
          width: '100%',
          background: 'linear-gradient(135deg, #1976d2 0%, #2196f3 100%)',
          color: 'white',
          py: { xs: 8, md: 12 },
          mb: 8
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              variant="h2"
              component="h1"
              gutterBottom
              sx={{
                fontWeight: 'bold',
                textShadow: '2px 2px 4px rgba(0,0,0,0.2)',
              }}
            >
              hMERN
            </Typography>
            <Typography
              variant="h5"
              component="h2"
              gutterBottom
              sx={{
                mb: 4,
                opacity: 0.9,
              }}
            >
              A straight forward MERN Stack boilerplate using Passport.js for authentication, and Heroku for deployment.
            </Typography>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg">
        {/* Features Section */}
        <Grid container spacing={4} sx={{ mb: 8 }}>
          <Grid item xs={12} sm={6} lg={3}>
            <FeatureCard
              icon={<SecurityIcon sx={{ fontSize: 40 }} />}
              title="Secure Authentication"
              description="Multiple OAuth providers (Google, GitHub, Facebook) with secure session management and email verification."
            />
          </Grid>
          <Grid item xs={12} sm={6} lg={3}>
            <FeatureCard
              icon={<CodeIcon sx={{ fontSize: 40 }} />}
              title="Modern Stack"
              description="Built with MERN stack (MongoDB, Express.js, React.js, Node.js) using modern development practices."
            />
          </Grid>
          <Grid item xs={12} sm={6} lg={3}>
            <FeatureCard
              icon={<SpeedIcon sx={{ fontSize: 40 }} />}
              title="Performance"
              description="Optimized for speed with efficient database queries, caching, and responsive design."
            />
          </Grid>
          <Grid item xs={12} sm={6} lg={3}>
            <FeatureCard
              icon={<CloudIcon sx={{ fontSize: 40 }} />}
              title="Cloud Ready"
              description="Ready for deployment with Heroku integration and environment configuration."
            />
          </Grid>
        </Grid>

        {/* AI Assistant Section */}
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Typography
            variant="h4"
            component="h2"
            gutterBottom
            sx={{
              fontWeight: 'bold',
              mb: 2
            }}
          >
            AI Assistant Ready
          </Typography>
          <Typography
            variant="h6"
            component="h3"
            gutterBottom
            sx={{
              opacity: 0.9,
              color: 'text.secondary',
              mb: { xs: 2, sm: 4 }
            }}
          >
            Seamlessly integrated with leading AI assistants for enhanced development experience
          </Typography>
          <Grid 
            container 
            spacing={{ xs: 2, sm: 4 }} 
            justifyContent="center"
          >
            <Grid item xs={12} sm={4}>
              <Box
                sx={{
                  height: { xs: '150px', sm: '200px' },
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Box
                  component="img"
                  src="/images/logo-claude.png"
                  alt="Claude AI"
                  sx={{
                    height: 'auto',
                    maxWidth: '200px',
                    maxHeight: '150px',
                    filter: (theme) => theme.palette.mode === 'dark' ? 'invert(1)' : 'brightness(0.9)',
                    transition: 'transform 0.2s, filter 0.2s',
                    '&:hover': {
                      transform: 'scale(1.05)'
                    }
                  }}
                />
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box
                sx={{
                  height: { xs: '150px', sm: '200px' },
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Box
                  component="img"
                  src="/images/logo-cursor.png"
                  alt="Cursor AI"
                  sx={{
                    height: 'auto',
                    maxWidth: '200px',
                    maxHeight: '150px',
                    filter: (theme) => theme.palette.mode === 'dark' ? 'invert(1)' : 'brightness(0.9)',
                    transition: 'transform 0.2s, filter 0.2s',
                    '&:hover': {
                      transform: 'scale(1.05)'
                    }
                  }}
                />
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box
                sx={{
                  height: { xs: '150px', sm: '200px' },
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Box
                  component="img"
                  src="/images/logo-windsurf.png"
                  alt="Windsurf AI"
                  sx={{
                    height: 'auto',
                    maxWidth: '200px',
                    maxHeight: '150px',
                    filter: (theme) => theme.palette.mode === 'dark' ? 'invert(1)' : 'brightness(0.9)',
                    transition: 'transform 0.2s, filter 0.2s',
                    '&:hover': {
                      transform: 'scale(1.05)'
                    }
                  }}
                />
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* Contact CTA Section */}
        <Box 
          sx={{ 
            width: '100%',
            bgcolor: 'white',
            borderRadius: 2,
            py: { xs: 6, md: 8 },
            mt: 8,

          }}
        >
          <Container maxWidth="lg">
            <Box sx={{ textAlign: 'center' }}>
              <Typography
                variant="h5"
                component="h2"
                gutterBottom
                sx={{
                  fontWeight: 'bold',
                  mb: 2
                }}
              >
                Contact Us!
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  mb: 4,
                  color: 'text.secondary',
                  maxWidth: '600px',
                  mx: 'auto'
                }}
              >
                Have questions or need assistance? Our team is here to help you get the most out of hMERN.
              </Typography>
              <Button
                component={Link}
                to="/contact"
                variant="contained"
                size="large"
                sx={{
                  px: 4,
                  py: 1.5,
                  fontSize: '1.1rem',
                  borderRadius: 2,
                  textTransform: 'none',
                  boxShadow: 2,
                  '&:hover': {
                    boxShadow: 4
                  }
                }}
              >
                Contact Us
              </Button>
            </Box>
          </Container>
        </Box>
      </Container>
    </Box>
  );
};

export default Home; 