# hMERN

## A MERN-Stack Application Boilerplate

hMERN is a full-stack, web application, boilerplate, built with MERN stack (MongoDB, Express.js, React.js, Node.js), featuring secure authentication with passport.js, modern UI with Material UI, and optimized for Heroku deployments.

## 👨‍💻 Features

- **Full Stack MERN Architecture**

  - MongoDB for database
  - Express.js for backend API
  - React.js for frontend
  - Node.js for server

- **Authentication & Security**

  - Passport.js for authentication
  - Multiple OAuth providers (Google, GitHub, Facebook, Instagram)
  - Session-based authentication with MongoDB store
  - Secure cookie handling
  - Helmet.js for HTTP headers security
  - Rate limiting to prevent abuse
  - CORS configuration
  - Request size limits
  - Secure MongoDB connection

- **Advanced Plugin System**

  - **Firewall Protection Plugin**

    - IP blocking and rate limiting
    - Geo-blocking by country/region
    - Suspicious request detection
    - Real-time threat monitoring

  - **Web Performance Optimization Plugin**

    - **File Optimization**

      - CSS/JS minification and concatenation (modular, preserves plugin structure)
      - Image optimization and WebP conversion (processes `frontend/public/assets/upload`)
      - GZIP/Brotli compression with configurable levels
      - Unused CSS removal and comment preservation options

    - **Advanced Caching Layers**

      - Database query caching with Redis (pre-configured: redis-10904.c246.us-east-1-4.ec2.redns.redis-cloud.com:10904)
      - Fragment and object caching for dynamic content
      - Static file caching with Cloudflare R2 integration (credentials stored in database)
      - Browser caching with HTTP headers, ETag, and Last-Modified support

    - **Performance Features**

      - Lazy loading for images and iframes with configurable thresholds
      - Critical CSS injection with automatic extraction
      - Resource preloading (DNS prefetch, preconnect, fonts, critical images)
      - Performance monitoring and real-time metrics collection

    - **Processing & Analytics**
      - Background processing queue for optimization tasks
      - Real-time performance metrics and dashboard
      - File size reduction tracking and bandwidth savings
      - Cache hit/miss ratio monitoring and response time analytics

  - **Licensing Plugin**
    - License validation and management
    - Feature access control
    - Secure license verification

- **Modern Development**
  - ES6+ JavaScript
  - React Hooks
  - Modern React practices
  - Modern design with Material UI
  - Responsive design

## 📋 Prerequisites

- Node.js (v18.x or later)

  ```bash
  node --version
  ```

- npm (v10.x or later)

  ```bash
  npm --version
  ```

- git (v2.x or later)

  ```bash
  git --version
  ```

- OAuth credentials for desired providers
  - Google
  - Github
  - Facebook
  - MonogDB

## 🛠️ Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/ralphdp/hmern.git
   cd hmern
   ```

2. Install backend dependencies:

   ```bash
   npm install
   ```

3. Install frontend dependencies:

   ```bash
   cd frontend
   npm install
   ```

4. Install backend dependencies:

   ```bash
   cd backend
   npm install
   ```

   **Note:** The backend now includes additional dependencies for web performance optimization:

   - `redis` (v4.6.0) - For database query caching and session management
   - `sharp` (v0.33.0) - For advanced image processing, optimization, and WebP conversion

   **Important:** Add the Redis endpoint to your `.env` file:

   ```
   REDIS_PUBLIC_ENDPOINT=redis-10904.c246.us-east-1-4.ec2.redns.redis-cloud.com:10904
   ```

   This Redis instance is shared across the core application and all plugins for optimal performance.

5. Create environment files:

   Backend (.env):

   ```
   NODE_ENV=development
   LICENSE_SERVER_URL=https://hmern.com
   HMERN_LICENSE_KEY=7c6f5421-cb8d36e6-522c4fde-b26f2ddb
   PORT_FRONTEND=3000
   PORT_BACKEND=5050
   FRONTEND_URL=your_frontend_url
   MONGODB_URI=your_mongodb_uri
   SESSION_SECRET=your_session_secret
   REDIS_PUBLIC_ENDPOINT=redis-10904.c246.us-east-1-4.ec2.redns.redis-cloud.com:10904
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GITHUB_CLIENT_ID=your_github_client_id
   GITHUB_CLIENT_SECRET=your_github_client_secret
   FACEBOOK_APP_ID=your_facebook_app_id
   FACEBOOK_APP_SECRET=your_facebook_app_secret
   EMAIL_HOST=smtp.example.com
   EMAIL_PORT=587
   EMAIL_USER=your_email_user
   EMAIL_PASSWORD=your_email_password
   EMAIL_FROM="email@example.com"
   ```

   Frontend (.env):

   ```
   REACT_APP_NODE_ENV=development
   REACT_APP_PORT_BACKEND=5050
   REACT_APP_BACKEND_URL=http://localhost:5050
   ```

## ⚙️ Configuring Authentication

Confiure which authentication options to use. On "backend/config/auth.config.js" set the "enabled" options to "true" accoridngly, for the authentication options you wish to use.

```bash
module.exports = {
  providers: {
    google: {
      enabled: true,
      strategy: 'passport-google-oauth20',
      scope: ['profile', 'email']
    },
    github: {
      enabled: true,
      strategy: 'passport-github2',
      scope: ['user:email']
    },
    facebook: {
      enabled: false,
      strategy: 'passport-facebook',
      scope: []
    }
  }
};
```

## 🏃‍♂️‍➡️ Running the Application

### Development Mode

1. Start the backend server:

   ```bash
   npm run dev
   ```

2. In a new terminal, start the frontend:
   ```bash
   cd ../
   cd frontend
   npm start
   ```

The application will be available at:

- Frontend: http://localhost:3000
- Backend API: http://localhost:5050

## 🚀 Deployment

### Heroku Deployment

1. Install Heroku CLI:

   ```bash
   brew install heroku/brew/heroku
   ```

2. Login to Heroku:

   ```bash
   heroku login
   ```

3. Create a Heroku app:

   ```bash
   heroku create
   ```

4. Set environment variables:

   ```bash
   heroku config:set NODE_ENV=production /
                     MONGODB_URI=your_mongodb_uri /
                     FRONTEND_URL=https://your-app.herokuapp.com /
                     REACT_APP_NODE_ENV=production /
                     REACT_APP_FRONTEND_URL=https://your-app.herokuapp.com /
                     REACT_APP_BACKEND_URL=https://your-app.herokuapp.com /
                     SESSION_SECRET=your_session_secret /
                     REDIS_PUBLIC_ENDPOINT=redis-10904.c246.us-east-1-4.ec2.redns.redis-cloud.com:10904 /
                     GOOGLE_CLIENT_ID=your_google_client_id /
                     GOOGLE_CLIENT_SECRET=your_google_client_secret /
                     GITHUB_CLIENT_ID=your_github_client_id /
                     GITHUB_CLIENT_SECRET=your_github_client_secret /
                     FACEBOOK_APP_ID=your_facebook_app_id /
                     FACEBOOK_APP_SECRET=your_facebook_app_secret /
                     EMAIL_HOST=smtp.example.com /
                     EMAIL_PORT=587 /
                     EMAIL_USER=your_email_user /
                     EMAIL_PASSWORD=your_email_password /
                     EMAIL_FROM=your_email_from
   ```

5. Deploy to Heroku:
   ```bash
   git add . && git commit -m "Initial Commit" && git push heroku master
   ```

### Errors

If you are getting errors on deployment you can view the heroku logs via the terminal:

```bash
git add . && git commit -m "Initial Commit" && git push heroku master
```

You can also view the build logs through the Heroku service panel.
heroku.com

## 🔄 Github

- Add the origin repositiory where you would like to save your scripts.

  ```bash
  git remote add origin https://github.com/user/repo.git
  ```

- Commit and push the scripts.

  ```bash
  git commit -m "Initial Commit" && git push -u origin master
  ```

- You may need to force the commit to your repository after pushing to Heroku, if the initial commit script doesnt work.
  ```bash
  git commit --allow-empty -m "Force Initial Commit" && git push -u origin master
  ```

## ⬆️ Publish Updates

### Publish Heroku Updates

- After making changes to your files you may commit and push changes to Heroku.
  ```bash
  git add . && git commit -m "New Changes" && git push heroku master
  ```

### Publish Github Updates

- After making changes to your files you may commit and push changes to Heroku then Github.
  ```bash
  git commit --allow-empty -m "Force New Changes" && git push -u origin master
  ```

## 📁 Project Structure

```
hmern/
├── frontend/                           # React frontend application
│   ├── public/                         # Static files
│   │   ├── images/                     # Image assets
│   │   │   ├── logo-claude.png         # Claude logo
│   │   │   ├── logo-cursor.png         # Cursor logo
│   │   │   └── logo-windsurf.png       # Windsurf logo
│   │   ├── favicon.ico                 # Site favicon
│   │   ├── index.html                  # HTML template
│   │   ├── logo192.png                 # PWA logo 192px
│   │   ├── logo512.png                 # PWA logo 512px
│   │   ├── manifest.json               # PWA manifest
│   │   └── robots.txt                  # Search engine robots file
│   ├── src/
│   │   ├── components/                 # Reusable components
│   │   │   ├── AnimatedLogo.js         # Animated Logo
│   │   │   ├── Footer.js               # Site Footer
│   │   │   ├── Header.js               # Navigation header
│   │   │   ├── Layout.js               # Main layout wrapper
│   │   │   ├── LicenseIndicator.js     # License status indicator
│   │   │   ├── Login.js                # Login Components
│   │   │   ├── PasswordInput.js        # Password Input Component
│   │   │   ├── PrivateRoute.js         # Private route wrapper
│   │   │   └── ScrollToTop.js          # Scroll to top component
│   │   ├── contexts/                   # React context providers
│   │   │   ├── AuthContext.js          # Authentication context
│   │   │   └── PluginContext.js        # Plugin management context
│   │   ├── pages/                      # Page components
│   │   │   ├── About.js                # About page
│   │   │   ├── Admin.js                # Admin dashboard
│   │   │   ├── AdminFirewall.js        # Firewall admin page
│   │   │   ├── AdminPlugins.js         # Plugin management page
│   │   │   ├── AdminWebPerformance.js  # Web performance admin page
│   │   │   ├── Contact.js              # Contact page
│   │   │   ├── Cookies.js              # Cookies page
│   │   │   ├── Dashboard.js            # Dashboard page
│   │   │   ├── ForgotPassword.js       # Forgot password page
│   │   │   ├── Home.js                 # Landing page
│   │   │   ├── Login.js                # Login page
│   │   │   ├── NotFound.js             # Not found page
│   │   │   ├── Privacy.js              # Privacy page
│   │   │   ├── Register.js             # Registration page
│   │   │   ├── ResendVerification.js   # Resend verification page
│   │   │   ├── ResetPassword.js        # Reset password page
│   │   │   ├── SwitchTest.js           # Switch testing page
│   │   │   ├── Terms.js                # Terms page
│   │   │   ├── Verify.js               # Verify account page
│   │   │   └── VerifyEmail.js          # Verify email address form page
│   │   ├── plugins/                    # Frontend plugin components
│   │   │   ├── firewall/               # Firewall plugin frontend
│   │   │   │   ├── components/         # Firewall components
│   │   │   │   ├── constants/          # Firewall constants
│   │   │   │   ├── FirewallAdmin.jsx   # Main firewall admin component
│   │   │   │   ├── index.js            # Plugin export
│   │   │   │   └── ...                 # Other firewall files
│   │   │   ├── licensing/              # Licensing plugin frontend
│   │   │   │   ├── LicenseIndicator.jsx # License status component
│   │   │   │   ├── index.js            # Plugin export
│   │   │   │   └── README.md           # Plugin documentation
│   │   │   └── web-performance-optimization/ # Web performance plugin
│   │   │       ├── components/         # Performance components
│   │   │       │   ├── WebPerformanceOverview.jsx
│   │   │       │   └── WebPerformanceSettings.jsx
│   │   │       ├── WebPerformanceAdmin.jsx # Main admin component
│   │   │       └── index.js            # Plugin export
│   │   ├── services/                   # API services
│   │   │   ├── auth.js                 # Authentication service
│   │   │   └── license.js              # License service
│   │   ├── utils/                      # Utility functions
│   │   │   └── config.js               # Utility configuration
│   │   ├── App.js                      # Main application component
│   │   ├── App.test.js                 # App component tests
│   │   ├── index.js                    # Application entry point
│   │   ├── index.css                   # Global styles
│   │   ├── logo.svg                    # React logo
│   │   ├── reportWebVitals.js          # Performance monitoring
│   │   ├── setupTests.js               # Test configuration
│   │   └── theme.js                    # Material-UI theme configuration
│   ├── package.json                    # Frontend dependencies
│   └── package-lock.json               # Frontend package lock file
│
├── backend/                            # Express.js backend application
│   ├── config/                         # Configuration files
│   │   ├── auth.config.js              # Configure authentication methods
│   │   ├── db.js                       # Database configuration
│   │   └── passport.js                 # Passport.js configuration
│   ├── middleware/                     # Custom middleware
│   │   └── errorMiddleware.js          # Error handling middleware
│   ├── models/                         # Mongoose models
│   │   ├── Token.js                    # Token model
│   │   └── User.js                     # User model
│   ├── plugins/                        # Plugin system
│   │   ├── firewall/                   # Firewall plugin
│   │   │   ├── index.js                # Plugin entry point
│   │   │   ├── middleware.js           # Firewall middleware
│   │   │   ├── models.js               # Firewall data models
│   │   │   ├── routes.js               # Firewall API routes
│   │   │   └── threat-intelligence.js  # Threat intelligence
│   │   ├── licensing/                  # Licensing plugin
│   │   │   ├── index.js                # Plugin entry point
│   │   │   ├── middleware.js           # License validation middleware
│   │   │   └── routes.js               # License API routes
│   │   └── web-performance-optimization/ # Web performance plugin
│   │       ├── index.js                # Plugin entry point
│   │       ├── middleware.js           # Performance middleware
│   │       ├── models.js               # Performance data models
│   │       └── routes.js               # Performance API routes
│   ├── routes/                         # API routes
│   │   ├── auth.js                     # Authentication routes
│   │   ├── contact.js                  # Contact form routes
│   │   └── plugins.js                  # Plugin management routes
│   ├── services/                       # Business logic services
│   │   └── emailService.js             # Email service
│   ├── .env.example                            # Environment variables
│   ├── server.js                       # Application entry point
│   ├── package.json                    # Backend dependencies
│   └── package-lock.json               # Backend package lock file
│
├── .gitignore                          # Git ignore file
├── package.json                        # Root package.json
├── package-lock.json                   # Root package lock file
├── Procfile                            # Heroku deployment configuration
└── README.md                           # Project documentation
```

## 🔌 API Endpoints

### Web Performance Optimization API

The web performance plugin provides comprehensive REST API endpoints for managing optimization settings, monitoring performance, and processing files:

**Settings Management:**

- `GET /api/web-performance/settings` - Retrieve current performance settings
- `PUT /api/web-performance/settings` - Update performance configuration
- `GET /api/web-performance/health` - Plugin health check and feature list

**Performance Monitoring:**

- `GET /api/web-performance/stats` - Real-time performance statistics and metrics
- `GET /api/web-performance/metrics` - Historical performance data with time range filtering
- `POST /api/web-performance/optimize` - Add files to optimization queue

**Processing Queue:**

- `GET /api/web-performance/queue` - View processing queue status and statistics
- `DELETE /api/web-performance/queue/completed` - Clear completed/failed queue items

**Testing & Validation:**

- `POST /api/web-performance/test-redis` - Test Redis connection with provided credentials
- `POST /api/web-performance/test-r2` - Test Cloudflare R2 connection and configuration

**Feature Categories:**

- **File Optimization:** CSS/JS minification, image optimization, WebP conversion, compression
- **Caching:** Redis database caching, fragment caching, R2 static file caching, browser caching
- **Performance:** Lazy loading, critical CSS, preloading, performance monitoring

### Firewall API

- `GET /api/firewall/stats` - Firewall statistics and metrics
- `GET /api/firewall/rules` - Retrieve firewall rules
- `POST /api/firewall/rules` - Add new firewall rule
- `PUT /api/firewall/rules/:id` - Update existing rule
- `DELETE /api/firewall/rules/:id` - Delete firewall rule
- `GET /api/firewall/logs` - Access firewall logs
- `GET /api/firewall/settings` - Retrieve firewall settings
- `PUT /api/firewall/settings` - Update firewall configuration

### Plugin Management API

- `GET /api/plugins` - List all available plugins and their status
- `POST /api/plugins/:pluginName/toggle` - Enable/disable specific plugin
- `GET /api/plugins/:pluginName/status` - Get individual plugin status

## 🔐 Authentication

### Passport.js Configuration

The application uses Passport.js for authentication with the following features:

- **Session-based Authentication**

  - MongoDB session store
  - Secure cookie handling
  - Session persistence across requests

- **OAuth Providers**

  - Google OAuth 2.0
  - GitHub OAuth
  - Facebook OAuth

- **User Model**
  - Stores user information
  - Links OAuth provider IDs
  - Manages user avatars

### Setting Up OAuth

1. **Google OAuth**

   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Navigate to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Configure the OAuth consent screen:
     - User Type: External
     - App Name: Your application name
     - User support email: Your email
     - Developer contact information: Your email
     - Authorized domains: Add your domain
   - Create OAuth 2.0 Client ID:
     - Application type: Web application
     - Name: Your application name
     - Authorized JavaScript origins:
       - For development: `http://localhost:3000`
       - For production: `https://your-app.herokuapp.com`
     - Authorized redirect URIs:
       - For development: `http://localhost:3000/api/auth/google/callback`
       - For production: `https://your-app.herokuapp.com/api/auth/google/callback`
   - Note down your Client ID and Client Secret
   - Add the following environment variables to your `.env` file:
     ```
     GOOGLE_CLIENT_ID=your_client_id
     GOOGLE_CLIENT_SECRET=your_client_secret
     GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
     ```
   - For production, update `GOOGLE_CALLBACK_URL` to your production URL

2. **GitHub OAuth**

   - Go to [GitHub Developer Settings](https://github.com/settings/developers)
   - Click "New OAuth App"
   - Fill in the application details:
     - Application name: Your application name
     - Homepage URL:
       - For development: `http://localhost:3000`
       - For production: `https://your-app.herokuapp.com`
     - Application description: Brief description of your app
     - Authorization callback URL:
       - For development: `http://localhost:3000/api/auth/github/callback`
       - For production: `https://your-app.herokuapp.com/api/auth/github/callback`
   - Click "Register application"
   - Note down your Client ID
   - Generate a new Client Secret
   - Add the following environment variables to your `.env` file:
     ```
     GITHUB_CLIENT_ID=your_client_id
     GITHUB_CLIENT_SECRET=your_client_secret
     GITHUB_CALLBACK_URL=http://localhost:3000/api/auth/github/callback
     ```

3. **Facebook OAuth**
   - Go to [Facebook Developers](https://developers.facebook.com/)
   - Click "Create App" or select your existing app
   - Choose "Consumer" as the app type
   - Fill in your app details:
     - App Name: Your application name
     - App Contact Email: Your email
     - Business Account: Optional
   - In the app dashboard:
     - Go to "Settings" > "Basic"
     - Note down your App ID and App Secret
     - Add your app domain (e.g., `localhost` for development)
   - Configure OAuth settings:
     - Go to "Facebook Login" > "Settings"
     - Add OAuth Redirect URIs:
       - For development: `http://localhost:3000/api/auth/facebook/callback`
       - For production: `https://your-app.herokuapp.comapi/auth/facebook/callback`
     - Set "Client OAuth Login" to Yes
     - Set "Web OAuth Login" to Yes
     - Set "Enforce HTTPS" to Yes for production
   - Add the following environment variables to your `.env` file:
     ```
     FACEBOOK_APP_ID=your_app_id
     FACEBOOK_APP_SECRET=your_app_secret
     FACEBOOK_CALLBACK_URL=http://localhost:3000/api/auth/facebook/callback
     ```
   - For production, update `FACEBOOK_CALLBACK_URL` to your production URL

## 🛠️ API Endpoints

### Authentication Endpoints (`/api/auth/`)

#### Provider Management

- `GET /api/auth/providers` - Get available authentication providers

#### User Management

- `GET /api/auth/user` - Get current user information
- `GET /api/auth/status` - Check authentication status
- `GET /api/auth/logout` - Logout user

#### Email Verification

- `GET /api/auth/verify-email/:token` - Verify email address

#### Password Management

- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password/:token` - Reset password

#### Authentication

- `POST /api/auth/login` - Local login
- `GET /api/auth/google/callback` - Google OAuth callback
- `GET /api/auth/avatar/:provider/:id` - Get user avatar

### Contact Endpoints (`/api/contact/`)

- `POST /api/contact` - Send contact form message

### Licensing Endpoints (`/api/license/`)

The application includes a comprehensive licensing system that validates licenses against a remote license server.

#### License Management

- `GET /api/license/test` - Test endpoint to verify the licensing plugin is loaded
- `GET /api/license/health` - Health check for the licensing plugin configuration
- `GET /api/license/info` - Get public information about the configured license key
- `GET /api/license/status` - Check license validation status (used by frontend indicator)
- `GET /api/license/debug` - Debug endpoint for manual license validation testing

### Firewall Endpoints (`/api/firewall/`)

The firewall plugin provides comprehensive security protection with IP blocking, rate limiting, and threat detection.

#### Firewall Management (Admin Only)

- `GET /api/firewall/test` - Test firewall plugin functionality
- `GET /api/firewall/health` - Firewall health check
- `GET /api/firewall/stats` - Dashboard statistics and metrics
- `GET /api/firewall/settings` - Get firewall settings
- `PUT /api/firewall/settings` - Update firewall settings
- `GET /api/firewall/rules` - Get firewall rules
- `POST /api/firewall/rules` - Create new firewall rule
- `GET /api/firewall/blocked-ips` - Get blocked IP addresses
- `GET /api/firewall/logs` - View firewall logs

### Web Performance Endpoints (`/api/web-performance/`)

The web performance optimization plugin provides advanced caching, compression, and optimization features.

#### Performance Management (Admin Only)

- `GET /api/web-performance/test` - Test web performance plugin functionality
- `GET /api/web-performance/health` - Performance plugin health check
- `GET /api/web-performance/stats` - Dashboard statistics and optimization metrics
- `GET /api/web-performance/settings` - Get performance optimization settings
- `PUT /api/web-performance/settings` - Update performance optimization settings

#### Performance Features

- **File Optimization**: CSS/JS minification, image optimization, WebP conversion
- **Caching Layers**: Database query caching (Redis), static file caching (Cloudflare R2), browser caching
- **Performance Features**: Lazy loading, critical CSS, preloading, performance monitoring

#### License Validation

The licensing system validates licenses by:

- Checking the license key against the remote license server (hmern.com)
- Validating the domain matches the registered license
- Ensuring the license status is active
- Supporting lifetime licenses (no expiry date)

#### Environment Variables Required

```
LICENSE_SERVER_URL=https://hmern.com
HMERN_LICENSE_KEY=your_license_key_here
FRONTEND_URL=https://your-app.herokuapp.com
```

#### License Server Communication

The licensing plugin communicates with the license server using:

- **Endpoint**: `POST /api/license/validate` on the license server
- **Payload**: `{ license_key: "key", domain: "domain.com" }`
- **Response**: License validation status and details

#### Frontend Integration

The licensing system includes:

- **LicenseIndicator Component**: Visual indicator showing license status
- **License Service**: Frontend service for checking license status
- **Automatic Validation**: License checks on protected routes

#### Protected Routes

Routes can be protected using the `validateLicense` middleware:

```javascript
app.use("/api/premium-feature", validateLicense, premiumRouter);
```

### OAuth Callback URLs

- Facebook: `/api/auth/facebook/callback`
- GitHub: `/api/auth/github/callback`
- Google: `/api/auth/google/callback`

### Security Features

- Rate limiting: 100 requests per 15 minutes per IP
- CORS enabled with specific origin configuration
- Session-based authentication
- Security headers including:
  - X-Content-Type-Options
  - X-Frame-Options
  - X-XSS-Protection
  - Referrer-Policy
  - Strict-Transport-Security
  - Permissions-Policy

### Error Handling

All endpoints use a centralized error handling middleware with specific error types:

- ValidationError (400)
- CastError (400)
- Duplicate field errors (400)
- General server errors (500)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Authors

- Rafael De Paz / rdepaz.com

## 🙏 Acknowledgments

- MERN Stack community
- Heroku for hosting
- MongoDB Atlas for database hosting
- Cursor for AI pair coding
