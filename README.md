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
   INSTAGRAM_CLIENT_ID=your_instagram_client_id
   INSTAGRAM_CLIENT_SECRET=your_instagram_client_secret
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
   heroku config:set REACT_APP_FRONTEND_URL=https://guarded-stream-39785-6ec8b37e5aa8.herokuapp.com
   heroku config:set REACT_APP_BACKEND_URL=https://guarded-stream-39785-6ec8b37e5aa8.herokuapp.com
   heroku config:set SESSION_SECRET=your_session_secret
   heroku config:set GOOGLE_CLIENT_ID=your_google_client_id
   heroku config:set GOOGLE_CLIENT_SECRET=your_google_client_secret
   # Add other OAuth provider credentials as needed
   ```

3. Deploy to Heroku:
   ```bash
   git push heroku master
   ```

## 📁 Project Structure

```
hmern/
├── backend/                    # Backend server code
│   ├── config/                 # Configuration files
│   │   ├── auth.config.js      # Authentication configuration
│   │   └── passport.js         # Passport.js configuration
│   ├── models/                 # Database models
│   │   └── User.js             # User model
│   ├── routes/                 # API routes
│   │   └── auth.js             # Authentication routes
│   ├── server.js               # Main server file
│   └── package.json            # Backend dependencies
│
├── frontend/                   # React frontend code
│   ├── public/                 # Static files
│   │   ├── index.html          # Main HTML file
│   │   ├── favicon.ico         # Favicon
│   │   ├── manifest.json       # Web app manifest
│   │   └── robots.txt          # Robots file
│   │
│   ├── src/                    # React source code
│   │   ├── App.js              # Main React component
│   │   ├── App.css             # Styles for App component
│   │   ├── App.test.js         # Tests for App component
│   │   ├── index.js            # React entry point
│   │   ├── index.css           # Global styles
│   │   ├── logo.svg            # React logo
│   │   ├── reportWebVitals.js  # Performance measurement
│   │   ├── setupTests.js       # Test configuration
│   │   ├── components/         # React components
│   │   │   └── Login.js        # Login component
│   │   └── theme.js            # Material-UI theme
│   │
│   ├── package.json            # Frontend dependencies
│   └── .gitignore              # Frontend git ignore rules
│
├── package.json                # Root package.json
├── Procfile                    # Heroku deployment configuration
├── .gitignore                  # Root git ignore rules
└── README.md                   # Project documentation
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
   - Go to Google Cloud Console
   - Create a new project
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add authorized redirect URIs:
     - Development: `http://localhost:5050/api/auth/google/callback`
     - Production: `https://your-app.herokuapp.com/api/auth/google/callback`

2. **GitHub OAuth**
   - Go to GitHub Developer Settings
   - Create a new OAuth App
   - Add authorized redirect URIs:
     - Development: `http://localhost:5050/api/auth/github/callback`
     - Production: `https://your-app.herokuapp.com/api/auth/github/callback`

3. **Facebook OAuth**
   - Go to Facebook Developers
   - Create a new app
   - Add Facebook Login product
   - Configure OAuth settings
   - Add authorized redirect URIs

4. **Instagram OAuth**
   - Go to Instagram Basic Display
   - Create a new app
   - Configure OAuth settings
   - Add authorized redirect URIs

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