# hMERN

## A MERN-Stack Application Boilerplate

hMERN is a full-stack, web application, boilerplate, built with MERN stack (MongoDB, Express.js, React.js, Node.js), featuring secure authentication with passport.js, modern UI with Material UI, advanced plugin system with comprehensive security and performance optimization, and optimized for Heroku deployments.

## 👨‍💻 Features

- **Full Stack MERN Architecture**

  - MongoDB for database with advanced indexing
  - Express.js for backend API with middleware architecture
  - React.js for frontend with modern hooks and context
  - Node.js for server with plugin system support

- **Authentication & Security**

  - Passport.js for authentication with session management
  - Multiple OAuth providers (Google, GitHub, Facebook, Instagram)
  - Session-based authentication with MongoDB store
  - Secure cookie handling with encryption
  - Helmet.js for HTTP headers security
  - Rate limiting to prevent abuse (100 requests/15 min)
  - CORS configuration with origin validation
  - Request size limits and security headers
  - Secure MongoDB connection with validation

- **Advanced Plugin System**

  - **Firewall Protection Plugin**

    - **Core Security Features**:

      - IP blocking with CIDR subnet support (e.g., 192.168.1.0/24)
      - Enhanced rate limiting with progressive delays (configurable)
      - Geo-blocking by country/region (195+ countries supported)
      - Suspicious request detection with ReDoS protection
      - Trusted proxy support for accurate IP detection

    - **Threat Intelligence Integration**:

      - Multiple providers: AbuseIPDB, VirusTotal, Spamhaus, Emerging Threats
      - Automatic threat feed imports (free & paid tiers)
      - Real-time IP reputation checks with smart caching
      - API usage monitoring and rate limit management

    - **Advanced Analytics & Monitoring**:

      - Real-time request monitoring with live dashboards
      - Traffic trends analysis (24h/7d/30d) with interactive charts
      - Top blocked countries and IPs analytics
      - Rule effectiveness metrics and performance tracking
      - Geographic traffic analysis with detailed breakdowns

    - **Email Reporting System**:

      - Scheduled reports (daily, weekly, monthly) with automation
      - Preview reports for immediate testing
      - Multiple recipient support with customizable content
      - Executive summaries with actionable insights
      - Comprehensive metrics including threat analysis

    - **Performance Optimizations**:
      - Rule caching system for 90% faster lookups
      - Smart cache invalidation with automatic refresh
      - Concurrent protection against database overload
      - Background processing for threat intelligence

  - **Web Performance Optimization Plugin**

    - **Advanced File Optimization**:

      - CSS/JS minification and concatenation (modular, preserves plugin structure)
      - Image optimization with quality controls (JPEG/PNG/WebP: 80% default)
      - WebP conversion with fallback support
      - Unused CSS removal with configurable preservation options
      - GZIP/Brotli compression with configurable levels (default: level 6)
      - Comment preservation options for debugging

    - **Multi-Layer Caching Architecture**:

      - Database query caching with Redis (pre-configured: redis-10904.c246.us-east-1-4.ec2.redns.redis-cloud.com:10904)
      - Fragment and object caching for dynamic content
      - Static file caching with Cloudflare R2 integration (credentials stored in database)
      - Browser caching with HTTP headers, ETag, and Last-Modified support
      - Smart cache invalidation based on content changes
      - Configurable TTL settings for different content types

    - **Performance Monitoring & Analytics**:

      - Core Web Vitals tracking (LCP, FID, CLS, TTI, FCP, Speed Index)
      - Real-time performance metrics collection and analysis
      - User experience monitoring (RUM) with geographic breakdowns
      - Performance trends with historical data analysis
      - Device and network performance tracking

    - **Processing & Queue Management**:

      - Background processing queue for optimization tasks
      - Task priority system with status tracking
      - Real-time queue monitoring with statistics
      - Batch processing capabilities for efficiency
      - Failed task retry mechanisms

    - **Email Reporting System**:

      - Scheduled performance reports with customizable frequency
      - Executive summaries with performance recommendations
      - Visual charts and sparklines in email reports
      - Multiple recipients with role-based content
      - Performance regression alerts and notifications

    - **Resource Optimization Features**:
      - Lazy loading for images and iframes with configurable thresholds
      - Critical CSS injection with automatic extraction (14KB threshold)
      - Resource preloading (DNS prefetch, preconnect, fonts, critical images)
      - Performance budgets and monitoring with alerts

  - **Licensing Plugin**:

    - **License Validation & Management**:

      - Remote license validation against hmern.com license server
      - Domain-specific license validation with security
      - Development mode bypasses for local testing
      - License status visual indicators with real-time updates
      - Automatic license renewal checking

    - **API & Integration**:

      - Comprehensive REST API for license management
      - Debug endpoints for troubleshooting license issues
      - Detailed logging and error handling
      - Integration with other plugins for feature access control
      - Health checks and configuration validation

    - **Security & Compliance**:
      - Secure license key handling and storage
      - HTTPS-only communication with license server
      - Domain validation to prevent unauthorized usage
      - Timeout and retry mechanisms for reliability

- **Modern Development Features**
  - ES6+ JavaScript with async/await patterns
  - React Hooks with custom hook architecture
  - Modern React practices with context providers
  - Material-UI with custom theming and dark mode support
  - Responsive design with mobile-first approach
  - Progressive Web App (PWA) capabilities

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

- MongoDB (Local or Atlas)
- Redis (For performance optimization caching)
- OAuth credentials for desired providers (Google, GitHub, Facebook)

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

   **Note:** The backend now includes additional dependencies for advanced features:

   - `redis` (v4.6.0) - For database query caching, session management, and performance optimization
   - `sharp` (v0.33.0) - For advanced image processing, optimization, and WebP conversion
   - `geoip-lite` - For geo-location services and country-based blocking
   - `axios` - For threat intelligence API integration and license validation

   **Important:** Add the Redis endpoint to your `.env` file:

   ```
   REDIS_PUBLIC_ENDPOINT=redis-10904.c246.us-east-1-4.ec2.redns.redis-cloud.com:10904
   ```

   This Redis instance is shared across the core application and all plugins for optimal performance and caching.

5. Create environment files:

   Backend (.env):

   ```
   NODE_ENV=development

   # License Configuration
   LICENSE_SERVER_URL=https://hmern.com
   HMERN_LICENSE_KEY=7c6f5421-cb8d36e6-522c4fde-b26f2ddb

   # Server Configuration
   PORT_FRONTEND=3000
   PORT_BACKEND=5050
   FRONTEND_URL=your_frontend_url

   # Database Configuration
   MONGODB_URI=your_mongodb_uri
   SESSION_SECRET=your_session_secret

   # Performance Optimization
   REDIS_PUBLIC_ENDPOINT=redis-10904.c246.us-east-1-4.ec2.redns.redis-cloud.com:10904

   # OAuth Configuration
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GITHUB_CLIENT_ID=your_github_client_id
   GITHUB_CLIENT_SECRET=your_github_client_secret
   FACEBOOK_APP_ID=your_facebook_app_id
   FACEBOOK_APP_SECRET=your_facebook_app_secret

   # Email Configuration
   EMAIL_HOST=smtp.example.com
   EMAIL_PORT=587
   EMAIL_USER=your_email_user
   EMAIL_PASSWORD=your_email_password
   EMAIL_FROM="email@example.com"

   # Optional - Threat Intelligence APIs
   ABUSEIPDB_API_KEY=your_abuseipdb_key
   VIRUSTOTAL_API_KEY=your_virustotal_key
   ```

   Frontend (.env):

   ```
   REACT_APP_NODE_ENV=development
   REACT_APP_PORT_BACKEND=5050
   REACT_APP_BACKEND_URL=http://localhost:5050
   ```

## ⚙️ Configuring Authentication

Configure which authentication options to use. In "backend/config/auth.config.js" set the "enabled" options to "true" accordingly, for the authentication options you wish to use.

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

### Admin Panel Access

Access the admin panels at:

- **Main Admin Dashboard**: http://localhost:3000/admin
- **Firewall Admin**: http://localhost:3000/admin/firewall
- **Web Performance Admin**: http://localhost:3000/admin/web-performance
- **Plugin Management**: http://localhost:3000/admin/plugins

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
   heroku config:set NODE_ENV=production \
                     MONGODB_URI=your_mongodb_uri \
                     FRONTEND_URL=https://your-app.herokuapp.com \
                     REACT_APP_NODE_ENV=production \
                     REACT_APP_FRONTEND_URL=https://your-app.herokuapp.com \
                     REACT_APP_BACKEND_URL=https://your-app.herokuapp.com \
                     SESSION_SECRET=your_session_secret \
                     LICENSE_SERVER_URL=https://hmern.com \
                     HMERN_LICENSE_KEY=your_license_key \
                     REDIS_PUBLIC_ENDPOINT=redis-10904.c246.us-east-1-4.ec2.redns.redis-cloud.com:10904 \
                     GOOGLE_CLIENT_ID=your_google_client_id \
                     GOOGLE_CLIENT_SECRET=your_google_client_secret \
                     GITHUB_CLIENT_ID=your_github_client_id \
                     GITHUB_CLIENT_SECRET=your_github_client_secret \
                     FACEBOOK_APP_ID=your_facebook_app_id \
                     FACEBOOK_APP_SECRET=your_facebook_app_secret \
                     EMAIL_HOST=smtp.example.com \
                     EMAIL_PORT=587 \
                     EMAIL_USER=your_email_user \
                     EMAIL_PASSWORD=your_email_password \
                     EMAIL_FROM=your_email_from \
                     ABUSEIPDB_API_KEY=your_abuseipdb_key \
                     VIRUSTOTAL_API_KEY=your_virustotal_key
   ```

5. Deploy to Heroku:
   ```bash
   git add . && git commit -m "Initial Commit" && git push heroku master
   ```

### Errors

If you are getting errors on deployment you can view the heroku logs via the terminal:

```bash
heroku logs --tail
```

You can also view the build logs through the Heroku service panel.
heroku.com

## 🔄 Github

- Add the origin repository where you would like to save your scripts.

  ```bash
  git remote add origin https://github.com/user/repo.git
  ```

- Commit and push the scripts.

  ```bash
  git commit -m "Initial Commit" && git push -u origin master
  ```

- You may need to force the commit to your repository after pushing to Heroku, if the initial commit script doesn't work.
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
│   │   │   ├── AnimatedLogo.jsx        # Animated Logo
│   │   │   ├── Footer.jsx              # Site Footer
│   │   │   ├── Header.jsx              # Navigation header
│   │   │   ├── Layout.jsx              # Main layout wrapper
│   │   │   ├── LicenseIndicator.jsx    # License status indicator
│   │   │   ├── Login.jsx               # Login Components
│   │   │   ├── PasswordInput.jsx       # Password Input Component
│   │   │   ├── PrivateRoute.jsx        # Private route wrapper
│   │   │   └── ScrollToTop.jsx         # Scroll to top component
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
│   │   ├── App.jsx                      # Main application component
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
- `GET /api/web-performance/analytics` - Analytics data with time ranges (24h/7d/30d)
- `POST /api/web-performance/analytics/record` - Record performance data

**Core Web Vitals & User Experience:**

- `GET /api/web-performance/metrics/core-web-vitals` - Core Web Vitals data (LCP, FID, CLS)
- `GET /api/web-performance/metrics/user-experience` - User experience metrics
- `GET /api/web-performance/metrics/performance-summary` - Performance summary with trends

**Processing Queue:**

- `POST /api/web-performance/optimize` - Add files to optimization queue
- `GET /api/web-performance/queue` - View processing queue status and statistics
- `DELETE /api/web-performance/queue/completed` - Clear completed/failed queue items

**Testing & Validation:**

- `POST /api/web-performance/test-redis` - Test Redis connection with provided credentials
- `POST /api/web-performance/test-r2` - Test Cloudflare R2 connection and configuration
- `GET /api/web-performance/validate-config` - Validate configuration settings

**Email Reports:**

- `GET /api/web-performance/reports/schedule` - Get current report schedule
- `PUT /api/web-performance/reports/schedule` - Update report schedule configuration
- `POST /api/web-performance/reports/preview` - Send preview report immediately

**Metrics Integration:**

- `GET /api/web-performance/metrics-integration` - Get metrics integration status
- `PUT /api/web-performance/metrics-integration` - Enable/disable detailed metrics collection

**Feature Categories:**

- **File Optimization:** CSS/JS minification, image optimization, WebP conversion, compression
- **Caching:** Redis database caching, fragment caching, R2 static file caching, browser caching
- **Performance:** Lazy loading, critical CSS, preloading, performance monitoring

### Firewall API

The firewall plugin provides comprehensive security protection with advanced threat intelligence and monitoring:

**Basic Health & Testing:**

- `GET /api/firewall/test` - Test firewall plugin functionality
- `GET /api/firewall/health` - Health check with feature list
- `GET /api/firewall/ping` - Connectivity test with session info

**Dashboard & Analytics:**

- `GET /api/firewall/stats` - Dashboard statistics and comprehensive metrics
- `GET /api/firewall/traffic-trends` - Traffic trends data for charts (24h/7d/30d)

**Rule Management (Admin Only):**

- `GET /api/firewall/rules` - List and filter firewall rules with pagination
- `POST /api/firewall/rules` - Create new firewall rule
- `PUT /api/firewall/rules/:id` - Update existing rule
- `DELETE /api/firewall/rules/:id` - Delete firewall rule
- `POST /api/firewall/rules/batch` - Batch operations on multiple rules

**IP Management:**

- `GET /api/firewall/blocked-ips` - List blocked IPs (legacy, now uses rules)
- `POST /api/firewall/blocked-ips` - Block IP manually with reason
- `DELETE /api/firewall/blocked-ips/:id` - Unblock IP address

**Logs & Monitoring:**

- `GET /api/firewall/logs` - View firewall logs with filtering and search
- `DELETE /api/firewall/logs` - Clear old logs
- `GET /api/firewall/logs/export` - Export logs in various formats

**Settings & Configuration:**

- `GET /api/firewall/settings` - Get current firewall settings
- `PUT /api/firewall/settings` - Update firewall configuration
- `POST /api/firewall/settings/reset` - Reset to default settings

**Threat Intelligence:**

- `GET /api/firewall/threat-intel/stats` - API usage statistics and quotas
- `POST /api/firewall/threat-intel/import` - Import threat feeds from multiple sources
- `GET /api/firewall/threat-intel/check/:ip` - Check IP reputation manually

**Email Reports:**

- `POST /api/firewall/reports/preview` - Send preview report with current status
- `GET /api/firewall/reports/schedule` - Get current report schedule
- `PUT /api/firewall/reports/schedule` - Update report schedule and recipients

**Testing & Debug:**

- `GET /api/firewall/test-bypass` - Test localhost bypass functionality
- `GET /api/firewall/test-rate-limit` - Test rate limiting effectiveness
- `POST /api/firewall/test-rule` - Test rule effectiveness with simulated attacks

### Licensing API

The licensing system validates licenses against the remote hmern.com license server:

**Basic Status & Health:**

- `GET /api/license/test` - Simple test endpoint to verify plugin is loaded
- `GET /api/license/health` - Health check with configuration status
- `GET /api/license/status` - Frontend license status check (main endpoint for indicator)

**License Information & Management:**

- `GET /api/license/info` - Get public license information and details
- `GET /api/license/debug` - Comprehensive debug endpoint with detailed logging

**Key Features:**

- **Development Mode Support**: Automatic bypasses for localhost development
- **Domain Validation**: Strict domain matching for security
- **Offline Mode**: Graceful handling when license server is unreachable
- **Detailed Logging**: Comprehensive logging for troubleshooting
- **Error Handling**: Robust error handling with fallback mechanisms

### Plugin Management API

- `GET /api/plugins` - List all available plugins and their status
- `POST /api/plugins/:pluginName/toggle` - Enable/disable specific plugin
- `GET /api/plugins/:pluginName/status` - Get individual plugin status

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

### OAuth Callback URLs

- Facebook: `/api/auth/facebook/callback`
- GitHub: `/api/auth/github/callback`
- Google: `/api/auth/google/callback`

### Security Features

- Rate limiting: 100 requests per 15 minutes per IP
- CORS enabled with specific origin configuration
- Session-based authentication with MongoDB store
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
