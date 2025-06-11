import React from 'react';
import { Container, Typography, Box, Paper } from '@mui/material';

const About = () => {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom align="center">
          About hMERN.app
        </Typography>
        
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            Our Mission
          </Typography>
          <Typography variant="body1" paragraph>
            hMERN.app is a modern, full-stack web application boilerplate that combines the power of the MERN stack 
            (MongoDB, Express.js, React, Node.js) with best practices and modern development tools. Our goal is 
            to provide developers with a solid foundation for building scalable and maintainable web applications.
          </Typography>
        </Box>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            Key Features
          </Typography>
          <Typography variant="body1" component="div">
            <ul>
              <li>Modern React with Material-UI for beautiful, responsive interfaces</li>
              <li>Secure authentication system with Passport.js</li>
              <li>RESTful API architecture</li>
              <li>MongoDB integration with Mongoose</li>
              <li>Environment-based configuration</li>
              <li>Production-ready deployment setup</li>
            </ul>
          </Typography>
        </Box>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            Technology Stack
          </Typography>
          <Typography variant="body1" paragraph>
            Built with modern technologies and best practices, hMERN.app provides a robust foundation for your next 
            web application. We use the latest versions of React, Node.js, Express, and MongoDB, combined with 
            Material-UI for a polished user interface.
          </Typography>
        </Box>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            Get Started
          </Typography>
          <Typography variant="body1" paragraph>
            Ready to start building your next web application? Clone our repository, follow the setup instructions, 
            and begin developing your ideas with hMERN.app today.
          </Typography>
        </Box>
    </Container>
  );
};

export default About; 