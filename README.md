# MERN Stack Application

A full-stack web application built with the MERN stack (MongoDB, Express.js, React.js, Node.js) featuring secure authentication, modern UI, and Heroku deployment.

## 🚀 Features

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

- **Modern Development**
  - ES6+ JavaScript
  - React Hooks
  - Modern React practices
  - Responsive design

## 📋 Prerequisites

- Node.js (v18.x or later)
- npm (v10.x or later)
- MongoDB (local or Atlas)
- OAuth credentials for desired providers

## 🛠️ Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
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

4. Create environment files:

   Backend (.env):
   ```
   NODE_ENV=development
   PORT_FRONTEND=3000
   PORT_BACKEND=5050
   FRONTEND_URL=your_frontend_url
   MONGODB_URI=your_mongodb_uri
   SESSION_SECRET=your_session_secret
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GITHUB_CLIENT_ID=your_github_client_id
   GITHUB_CLIENT_SECRET=your_github_client_secret
   FACEBOOK_APP_ID=your_facebook_app_id
   FACEBOOK_APP_SECRET=your_facebook_app_secret
   ```

   Frontend (.env):
   ```
   REACT_APP_NODE_ENV=development
   REACT_APP_PORT_BACKEND=5050
   REACT_APP_BACKEND_URL=http://localhost:5050
   ```

## 🚀 Running the Application

### Development Mode

1. Start the backend server:
   ```bash
   npm run dev
   ```

2. In a new terminal, start the frontend:
   ```bash
   cd frontend
   npm start
   ```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5050

### Production Mode

1. Build the frontend:
   ```bash
   cd frontend
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

## 🚀 Deployment

### Heroku Deployment

1. Create a Heroku app:
   ```bash
   heroku create
   ```

2. Set environment variables:
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set MONGODB_URI=your_mongodb_uri
   heroku config:set FRONTEND_URL=https://your-app.herokuapp.com
   heroku config:set REACT_APP_NODE_ENV=production
   heroku config:set REACT_APP_FRONTEND_URL=https://your-app.herokuapp.com
   heroku config:set REACT_APP_BACKEND_URL=https://your-app.herokuapp.com
   heroku config:set SESSION_SECRET=your_session_secret
   heroku config:set GOOGLE_CLIENT_ID=your_google_client_id
   heroku config:set GOOGLE_CLIENT_SECRET=your_google_client_secret
   heroku config:set GITHUB_CLIENT_ID=github_client_id
   heroku config:set GITHUB_CLIENT_SECRET=github_client_secret
   heroku config:set FACEBOOK_APP_ID=facebook_app_id
   heroku config:set FACEBOOK_APP_SECRET=facebook_app_secret
   heroku config:set EMAIL_HOST=smtp.gmail.com
   heroku config:set EMAIL_PORT=587
   heroku config:set EMAIL_USER=ralphdp21@gmail.com
   heroku config:set EMAIL_PASSWORD=cfwevsawdtvhbunj
   heroku config:set EMAIL_FROM=ralphdp21@gmail.com
   # Add other OAuth provider credentials as needed
   ```

3. Deploy to Heroku:
   ```bash
   git push heroku master
   ```

## 📁 Project Structure

```
hmern/
├── backend/                        # Backend server
│   ├── config/                     # Configuration files
│   │   ├── auth.config.js          # Authentication configuration
│   │   └── passport.js             # Passport.js configuration
│   ├── models/                     # Database models
│   │   ├── Token.js                # Token model for email verification
│   │   └── User.js                 # User model
│   ├── routes/                     # API routes
│   │   └── auth.js                 # Authentication routes
│   ├── services/                   # Business logic
│   │   └── emailService.js         # Email service for verification
│   ├── package.json                # Backend dependencies
│   └── server.js                   # Express server setup
│
├── frontend/                       # React frontend
│   ├── public/                     # Static files
│   ├── src/                        # Source files
│   │   ├── components/             # Reusable components
│   │   │   ├── Login.js            # Login component
│   │   │   ├── PasswordInput.js    # Password input component
│   │   │   └── PrivateRoute.js     # Protected route component
│   │   ├── contexts/               # React contexts
│   │   │   └── AuthContext.js      # Authentication context
│   │   ├── pages/                  # Page components
│   │   │   ├── Dashboard.js        # Dashboard page
│   │   │   ├── ForgotPassword.js   # Forgot password page
│   │   │   ├── Home.js             # Home page
│   │   │   ├── Login.js            # Login page
│   │   │   ├── Register.js         # Registration page
│   │   │   ├── ResetPassword.js    # Reset password page
│   │   │   └── VerifyEmail.js      # Email verification page
│   │   ├── App.js                  # Main App component
│   │   ├── index.js                # Entry point
│   │   └── theme.js                # Material-UI theme
│   └── package.json                # Frontend dependencies
│
├── .gitignore                      # Git ignore file
├── package.json                    # Root package.json
├── Procfile                        # Heroku deployment configuration
└── README.md                       # Project documentation
```

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
  - Instagram OAuth

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
       - For production: `https://your-domain.com`
     - Authorized redirect URIs:
       - For development: `http://localhost:3000/api/auth/google/callback`
       - For production: `https://your-domain.com/api/auth/google/callback`
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
       - For production: `https://your-domain.com`
     - Application description: Brief description of your app
     - Authorization callback URL:
       - For development: `http://localhost:3000/api/auth/github/callback`
       - For production: `https://your-domain.com/api/auth/github/callback`
   - Click "Register application"
   - Note down your Client ID
   - Generate a new Client Secret
   - Add the following environment variables to your `.env` file:
     ```
     GITHUB_CLIENT_ID=your_client_id
     GITHUB_CLIENT_SECRET=your_client_secret
     GITHUB_CALLBACK_URL=http://localhost:3000/api/auth/github/callback
     ```
   - For production, update `GITHUB_CALLBACK_URL` to your production URL

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
       - For production: `https://your-domain.com/api/auth/facebook/callback`
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

### Security Considerations

- All OAuth credentials are stored in environment variables
- Session secrets are unique and secure
- HTTPS is enforced in production
- Rate limiting is implemented
- CORS is properly configured
- Secure cookie settings are used
- MongoDB connection is secured

## 🛠️ API Endpoints

- `GET /api/test`: Test endpoint to verify backend functionality

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