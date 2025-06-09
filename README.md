# MERN Stack Application

A full-stack web application built with the MERN stack (MongoDB, Express.js, React.js, Node.js) featuring secure authentication, modern UI, and Heroku deployment.

## 🚀 Features

- **Full Stack MERN Architecture**
  - MongoDB for database
  - Express.js for backend API
  - React.js for frontend
  - Node.js for server

- **Security Features**
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
   FRONTEND_URL=heroku_url
   MONGODB_URI=your_mongodb_uri
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

### Production Mode (If needed. Not necessary with Heroku as it builds the app before uploading and saving.)

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
   heroku config:set FRONTEND_URL=https://your-app-name.herokuapp.com
   ```

3. Deploy to Heroku:
   ```bash
   git push heroku master
   ```

## 📁 Project Structure

```
hmern/
├── backend/                     # Backend server code
│   ├── server.js               # Main server file with Express configuration
│   └── package.json            # Backend dependencies
│
├── frontend/                    # React frontend code
│   ├── public/                 # Static files
│   │   ├── index.html         # Main HTML file
│   │   ├── favicon.ico        # Favicon
│   │   ├── manifest.json      # Web app manifest
│   │   └── robots.txt         # Robots file
│   │
│   ├── src/                   # React source code
│   │   ├── App.js            # Main React component
│   │   ├── App.css           # Styles for App component
│   │   ├── App.test.js       # Tests for App component
│   │   ├── index.js          # React entry point
│   │   ├── index.css         # Global styles
│   │   ├── logo.svg          # React logo
│   │   ├── reportWebVitals.js # Performance measurement
│   │   └── setupTests.js     # Test configuration
│   │
│   ├── package.json          # Frontend dependencies
│   └── .gitignore           # Frontend git ignore rules
│
├── package.json               # Root package.json for project management
├── package-lock.json         # Dependency lock file
├── Procfile                  # Heroku deployment configuration
├── .gitignore               # Root git ignore rules
└── README.md                # Project documentation
```

### Key Files and Their Purposes

#### Backend
- `server.js`: Main server file containing:
  - Express server configuration
  - MongoDB connection setup
  - Security middleware (Helmet, Rate Limiting)
  - CORS configuration
  - API routes
  - Static file serving for production

#### Frontend
- `src/App.js`: Main React component handling:
  - API communication
  - State management
  - UI rendering
- `src/index.js`: Application entry point with:
  - React DOM rendering
  - Strict mode configuration
  - Performance monitoring setup
- `public/index.html`: Main HTML template with:
  - Meta tags
  - Root div for React
  - Web app manifest link
- `src/reportWebVitals.js`: Performance monitoring utility
- `src/setupTests.js`: Jest testing configuration

#### Configuration Files
- `package.json`: Project dependencies and scripts
- `Procfile`: Heroku deployment instructions
- `.gitignore`: Git ignore rules for both frontend and backend
- `frontend/package.json`: Frontend-specific dependencies and scripts

## 🔒 Security Features

- **Helmet.js**: Sets various HTTP headers for security
- **Rate Limiting**: Prevents brute force attacks
- **CORS**: Configures Cross-Origin Resource Sharing
- **Request Size Limits**: Prevents large payload attacks
- **MongoDB Security**: Secure connection with timeouts

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

- Rafael De Paz

## 🙏 Acknowledgments

- MERN Stack community
- Heroku for hosting
- MongoDB Atlas for database hosting 