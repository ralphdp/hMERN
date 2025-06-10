import { Container, Typography, Box, Paper } from '@mui/material';

const Cookies = () => {
  return (
    <Container maxWidth="md" sx={{ my: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Cookie Policy
        </Typography>
        <Typography variant="body1" paragraph>
          Last updated: {new Date().toLocaleDateString()}
        </Typography>

        <Box component="section" sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            1. What Are Cookies
          </Typography>
          <Typography variant="body1" paragraph>
            Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and provide a better user experience.
          </Typography>
        </Box>

        <Box component="section" sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            2. How We Use Cookies
          </Typography>
          <Typography variant="body1" paragraph>
            We use cookies for the following purposes:
          </Typography>
          <Box component="ul" sx={{ pl: 4 }}>
            <Typography component="li" variant="body1" paragraph>
              Essential cookies: Required for the website to function properly
            </Typography>
            <Typography component="li" variant="body1" paragraph>
              Authentication cookies: To keep you signed in
            </Typography>
            <Typography component="li" variant="body1" paragraph>
              Preference cookies: To remember your settings
            </Typography>
            <Typography component="li" variant="body1" paragraph>
              Analytics cookies: To understand how you use our website
            </Typography>
          </Box>
        </Box>

        <Box component="section" sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            3. Types of Cookies We Use
          </Typography>
          <Box component="ul" sx={{ pl: 4 }}>
            <Typography component="li" variant="body1" paragraph>
              Session Cookies: Temporary cookies that expire when you close your browser
            </Typography>
            <Typography component="li" variant="body1" paragraph>
              Persistent Cookies: Remain on your device for a set period of time
            </Typography>
            <Typography component="li" variant="body1" paragraph>
              First-party Cookies: Set by our website
            </Typography>
            <Typography component="li" variant="body1" paragraph>
              Third-party Cookies: Set by our service providers
            </Typography>
          </Box>
        </Box>

        <Box component="section" sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            4. Managing Cookies
          </Typography>
          <Typography variant="body1" paragraph>
            You can control and/or delete cookies as you wish. You can delete all cookies that are already on your computer and you can set most browsers to prevent them from being placed. However, if you do this, you may have to manually adjust some preferences every time you visit our site and some services and functionalities may not work.
          </Typography>
        </Box>

        <Box component="section" sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            5. Specific Cookies We Use
          </Typography>
          <Box component="ul" sx={{ pl: 4 }}>
            <Typography component="li" variant="body1" paragraph>
              Authentication: Used to maintain your session and keep you logged in
            </Typography>
            <Typography component="li" variant="body1" paragraph>
              Security: Help us detect and prevent security threats
            </Typography>
            <Typography component="li" variant="body1" paragraph>
              Preferences: Remember your language and theme preferences
            </Typography>
            <Typography component="li" variant="body1" paragraph>
              Analytics: Help us understand how visitors interact with our website
            </Typography>
          </Box>
        </Box>

        <Box component="section" sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            6. Third-Party Cookies
          </Typography>
          <Typography variant="body1" paragraph>
            Some cookies are placed by third-party services that appear on our pages. We use these cookies to:
          </Typography>
          <Box component="ul" sx={{ pl: 4 }}>
            <Typography component="li" variant="body1" paragraph>
              Enable OAuth authentication (Google, GitHub, Facebook)
            </Typography>
            <Typography component="li" variant="body1" paragraph>
              Analyze website usage
            </Typography>
            <Typography component="li" variant="body1" paragraph>
              Improve our services
            </Typography>
          </Box>
        </Box>

        <Box component="section" sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            7. Changes to This Policy
          </Typography>
          <Typography variant="body1" paragraph>
            We may update this cookie policy from time to time. We will notify you of any changes by posting the new cookie policy on this page and updating the "Last updated" date.
          </Typography>
        </Box>

        <Box component="section" sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            8. Contact Us
          </Typography>
          <Typography variant="body1" paragraph>
            If you have any questions about this Cookie Policy, please contact us at support@mernauth.com.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default Cookies; 