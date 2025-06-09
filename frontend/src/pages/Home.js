import { Box, Container, Typography, Button } from '@mui/material';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 8, textAlign: 'center' }}>
        <Typography variant="h2" component="h1" gutterBottom>
          Welcome to Our App
        </Typography>
        <Typography variant="h5" component="h2" gutterBottom>
          A secure authentication system with multiple login options
        </Typography>
        <Box sx={{ mt: 4 }}>
          <Button
            component={Link}
            to="/login"
            variant="contained"
            color="primary"
            size="large"
            sx={{ mr: 2 }}
          >
            Login
          </Button>
          <Button
            component={Link}
            to="/register"
            variant="outlined"
            color="primary"
            size="large"
          >
            Register
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default Home; 