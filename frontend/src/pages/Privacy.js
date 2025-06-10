import { Container, Typography, Box, Paper } from '@mui/material';

const Privacy = () => {
  return (
    <Container maxWidth="md" sx={{ my: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Privacy Policy
        </Typography>
        <Typography variant="body1" paragraph>
          Last updated: {new Date().toLocaleDateString()}
        </Typography>

        <Box component="section" sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            1. Information We Collect
          </Typography>
          <Typography variant="body1" paragraph>
            We collect information that you provide directly to us, including:
          </Typography>
          <Box component="ul" sx={{ pl: 4 }}>
            <Typography component="li" variant="body1" paragraph>
              Name and email address when you register
            </Typography>
            <Typography component="li" variant="body1" paragraph>
              Profile information from OAuth providers (Google, GitHub, Facebook)
            </Typography>
            <Typography component="li" variant="body1" paragraph>
              Authentication data and session information
            </Typography>
          </Box>
        </Box>

        <Box component="section" sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            2. How We Use Your Information
          </Typography>
          <Typography variant="body1" paragraph>
            We use the information we collect to:
          </Typography>
          <Box component="ul" sx={{ pl: 4 }}>
            <Typography component="li" variant="body1" paragraph>
              Provide, maintain, and improve our services
            </Typography>
            <Typography component="li" variant="body1" paragraph>
              Process and complete transactions
            </Typography>
            <Typography component="li" variant="body1" paragraph>
              Send you technical notices and support messages
            </Typography>
            <Typography component="li" variant="body1" paragraph>
              Communicate with you about products, services, and events
            </Typography>
          </Box>
        </Box>

        <Box component="section" sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            3. Information Sharing
          </Typography>
          <Typography variant="body1" paragraph>
            We do not share your personal information with third parties except as described in this policy. We may share your information with:
          </Typography>
          <Box component="ul" sx={{ pl: 4 }}>
            <Typography component="li" variant="body1" paragraph>
              Service providers who perform services on our behalf
            </Typography>
            <Typography component="li" variant="body1" paragraph>
              OAuth providers you choose to authenticate with
            </Typography>
            <Typography component="li" variant="body1" paragraph>
              Law enforcement when required by law
            </Typography>
          </Box>
        </Box>

        <Box component="section" sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            4. Data Security
          </Typography>
          <Typography variant="body1" paragraph>
            We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
          </Typography>
        </Box>

        <Box component="section" sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            5. Your Rights
          </Typography>
          <Typography variant="body1" paragraph>
            You have the right to:
          </Typography>
          <Box component="ul" sx={{ pl: 4 }}>
            <Typography component="li" variant="body1" paragraph>
              Access your personal information
            </Typography>
            <Typography component="li" variant="body1" paragraph>
              Correct inaccurate information
            </Typography>
            <Typography component="li" variant="body1" paragraph>
              Request deletion of your information
            </Typography>
            <Typography component="li" variant="body1" paragraph>
              Object to processing of your information
            </Typography>
          </Box>
        </Box>

        <Box component="section" sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            6. Cookies
          </Typography>
          <Typography variant="body1" paragraph>
            We use cookies and similar tracking technologies to track activity on our application and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
          </Typography>
        </Box>

        <Box component="section" sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            7. Changes to This Policy
          </Typography>
          <Typography variant="body1" paragraph>
            We may update this privacy policy from time to time. We will notify you of any changes by posting the new privacy policy on this page and updating the "Last updated" date.
          </Typography>
        </Box>

        <Box component="section" sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            8. Contact Us
          </Typography>
          <Typography variant="body1" paragraph>
            If you have any questions about this Privacy Policy, please contact us at support@mernauth.com.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default Privacy; 