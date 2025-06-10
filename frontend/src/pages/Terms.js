import { Container, Typography, Box, Paper } from '@mui/material';

const Terms = () => {
  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Terms of Service
        </Typography>
        <Typography variant="body1" paragraph>
          Last updated: {new Date().toLocaleDateString()}
        </Typography>

        <Box component="section" sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            1. Acceptance of Terms
          </Typography>
          <Typography variant="body1" paragraph>
            By accessing and using this application, you accept and agree to be bound by the terms and provision of this agreement.
          </Typography>
        </Box>

        <Box component="section" sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            2. Use License
          </Typography>
          <Typography variant="body1" paragraph>
            Permission is granted to temporarily use this application for personal, non-commercial transitory viewing only.
          </Typography>
        </Box>

        <Box component="section" sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            3. User Account
          </Typography>
          <Typography variant="body1" paragraph>
            You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.
          </Typography>
        </Box>

        <Box component="section" sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            4. Authentication
          </Typography>
          <Typography variant="body1" paragraph>
            Our application uses various authentication methods including email/password and OAuth providers. You agree to provide accurate information and maintain the security of your credentials.
          </Typography>
        </Box>

        <Box component="section" sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            5. Privacy
          </Typography>
          <Typography variant="body1" paragraph>
            Your use of this application is also governed by our Privacy Policy. Please review our Privacy Policy, which also governs the application and informs users of our data collection practices.
          </Typography>
        </Box>

        <Box component="section" sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            6. Disclaimer
          </Typography>
          <Typography variant="body1" paragraph>
            The materials on this application are provided on an 'as is' basis. We make no warranties, expressed or implied, and hereby disclaim and negate all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
          </Typography>
        </Box>

        <Box component="section" sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            7. Limitations
          </Typography>
          <Typography variant="body1" paragraph>
            In no event shall we or our suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on this application.
          </Typography>
        </Box>

        <Box component="section" sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            8. Revisions and Errata
          </Typography>
          <Typography variant="body1" paragraph>
            The materials appearing on this application could include technical, typographical, or photographic errors. We do not warrant that any of the materials on this application are accurate, complete or current.
          </Typography>
        </Box>

        <Box component="section" sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            9. Contact Information
          </Typography>
          <Typography variant="body1" paragraph>
            If you have any questions about these Terms, please contact us at support@mernauth.com.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default Terms; 