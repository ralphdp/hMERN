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
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        minHeight: 'calc(100vh - 64px - 307px)', // Subtract header (64px) and footer (200px) heights
        py: 4,
        position: 'relative'
      }}
    >
      <Container maxWidth="lg">
        {/* Hero Section */}
        <Box sx={{ textAlign: 'center', mb: 8 }}>
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

        {/* Features Section */}
        <Grid container spacing={4}>
          <Grid item xs={12} md={6} lg={3}>
            <FeatureCard
              icon={<SecurityIcon sx={{ fontSize: 40 }} />}
              title="Secure Authentication"
              description="Multiple OAuth providers (Google, GitHub, Facebook) with secure session management and email verification."
            />
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <FeatureCard
              icon={<CodeIcon sx={{ fontSize: 40 }} />}
              title="Modern Stack"
              description="Built with MERN stack (MongoDB, Express.js, React.js, Node.js) using modern development practices."
            />
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <FeatureCard
              icon={<SpeedIcon sx={{ fontSize: 40 }} />}
              title="Performance"
              description="Optimized for speed with efficient database queries, caching, and responsive design."
            />
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <FeatureCard
              icon={<CloudIcon sx={{ fontSize: 40 }} />}
              title="Cloud Ready"
              description="Ready for deployment with Heroku integration and environment configuration."
            />
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Home; 