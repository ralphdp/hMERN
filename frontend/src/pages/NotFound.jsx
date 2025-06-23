import React from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

const NotFound = () => {
  return (
    <Container maxWidth="md">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 'calc(100vh - 64px - 307px)', // Account for header and footer
          textAlign: 'center',
          py: 4
        }}
      >
        <Typography 
          variant="h1" 
          component="h1" 
          gutterBottom
          sx={{ 
            fontSize: { xs: '3rem', md: '5rem' },
            fontWeight: 'bold',
            color: 'text.primary'
          }}
        >
          404
        </Typography>
        <Typography 
          variant="h4" 
          component="h2" 
          gutterBottom
          sx={{ 
            mb: 4,
            color: 'text.secondary'
          }}
        >
          Page Not Found
        </Typography>
        <Typography 
          variant="body1" 
          sx={{ 
            mb: 4,
            maxWidth: '600px',
            color: 'text.secondary'
          }}
        >
          The page you are looking for might have been removed, had its name changed,
          or is temporarily unavailable.
        </Typography>
        <Button
          component={RouterLink}
          to="/"
          variant="contained"
          size="large"
          sx={{
            px: 4,
            py: 1.5,
            borderRadius: 2,
            textTransform: 'none',
            fontSize: '1.1rem'
          }}
        >
          Back to Home
        </Button>
      </Box>
    </Container>
  );
};

export default NotFound; 