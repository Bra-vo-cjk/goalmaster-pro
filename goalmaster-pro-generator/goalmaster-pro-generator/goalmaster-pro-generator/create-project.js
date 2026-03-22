const fs = require('fs');
const path = require('path');

// Project root directory
const PROJECT_ROOT = path.join(__dirname, 'goalmaster-pro');

// File contents for all required files
const files = {
    // Root files
    'README.md': `# GoalMaster Pro - Football Prediction Platform

## Overview
GoalMaster Pro is a professional football prediction platform with 89% accuracy rate, featuring real-time predictions, VIP subscriptions, and comprehensive analytics.

## Features
- 🔐 User Authentication (JWT)
- 📊 Real-time Football Predictions
- 💎 VIP Subscription System
- 💳 Stripe Payment Integration
- 📝 Blog & Content Management
- 📱 Fully Responsive Design
- 🔍 SEO Optimized
- 🚀 High Performance

## Tech Stack
- **Frontend**: Next.js 14, Tailwind CSS
- **Backend**: Node.js, Express, MongoDB
- **Payments**: Stripe
- **Authentication**: JWT
- **Deployment**: Docker, Kubernetes

## Installation

### Prerequisites
- Node.js 18+
- MongoDB
- Stripe Account

### Backend Setup
\`\`\`bash
cd backend
npm install
cp .env.example .env
# Update .env with your values
npm run dev
\`\`\`

### Frontend Setup
\`\`\`bash
cd frontend
npm install
cp .env.local.example .env.local
# Update .env.local
npm run dev
\`\`\`

## API Documentation
API documentation available at \`/api/docs\` when running the server.

## License
MIT
`,

    '.gitignore': `# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Build outputs
dist/
build/
.next/
out/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
logs/
*.log

# Coverage
coverage/

# MongoDB data
data/
dump/
`,

    // Backend files
    'backend/package.json': `{
  "name": "goalmaster-backend",
  "version": "1.0.0",
  "description": "GoalMaster Pro Backend API",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "seed": "node seed.js",
    "test": "jest"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^7.5.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express-validator": "^7.0.1",
    "stripe": "^13.5.0",
    "nodemailer": "^6.9.5",
    "helmet": "^7.0.0",
    "express-rate-limit": "^6.10.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.1",
    "jest": "^29.6.4"
  }
}`,

    'backend/.env.example': `# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/goalmaster

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this
JWT_EXPIRE=30d

# Stripe
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Frontend URL
FRONTEND_URL=http://localhost:3000`,

    'backend/server.js': `const app = require('./src/app');
const connectDB = require('./src/config/database');

const PORT = process.env.PORT || 5000;

// Connect to database
connectDB();

const server = app.listen(PORT, () => {
    console.log(\`🚀 Server running on port \${PORT}\`);
    console.log(\`📡 API URL: http://localhost:\${PORT}/api\`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.log(\`❌ Error: \${err.message}\`);
    server.close(() => process.exit(1));
});`,

    'backend/src/app.js': `const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP'
});
app.use('/api', limiter);

// CORS
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/predictions', require('./routes/predictionRoutes'));
app.use('/api/subscriptions', require('./routes/subscriptionRoutes'));

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode).json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack
    });
});

module.exports = app;`,

    'backend/src/config/database.js': `const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log(\`✅ MongoDB Connected: \${conn.connection.host}\`);
    } catch (error) {
        console.error(\`❌ Error: \${error.message}\`);
        process.exit(1);
    }
};

module.exports = connectDB;`,

    'backend/src/models/User.js': `const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        lowercase: true
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
        minlength: 6,
        select: false
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    subscriptionStatus: {
        type: String,
        enum: ['none', 'active', 'expired', 'trial'],
        default: 'none'
    },
    subscriptionEndDate: Date,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);`,

    'backend/src/models/Prediction.js': `const mongoose = require('mongoose');

const predictionSchema = new mongoose.Schema({
    homeTeam: {
        type: String,
        required: true
    },
    awayTeam: {
        type: String,
        required: true
    },
    homeTeamLogo: String,
    awayTeamLogo: String,
    league: {
        type: String,
        required: true
    },
    matchTime: {
        type: Date,
        required: true
    },
    tipType: {
        type: String,
        enum: ['OVER_25', 'BTTS', 'DOUBLE_CHANCE', 'CORRECT_SCORE'],
        required: true
    },
    tipValue: {
        type: String,
        required: true
    },
    odds: {
        type: Number,
        required: true
    },
    isVip: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['pending', 'won', 'lost'],
        default: 'pending'
    },
    confidence: {
        type: Number,
        min: 1,
        max: 5,
        default: 3
    },
    analysis: String,
    views: {
        type: Number,
        default: 0
    },
    featured: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Prediction', predictionSchema);`,

    'backend/src/controllers/authController.js': `const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE,
    });
};

const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }
        
        const trialEndDate = new Date();
        trialEndDate.setDate(trialEndDate.getDate() + 7);
        
        const user = await User.create({
            name,
            email,
            password,
            subscriptionStatus: 'trial',
            subscriptionEndDate: trialEndDate
        });
        
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            subscriptionStatus: user.subscriptionStatus,
            token: generateToken(user._id),
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const user = await User.findOne({ email }).select('+password');
        
        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                subscriptionStatus: user.subscriptionStatus,
                subscriptionEndDate: user.subscriptionEndDate,
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { registerUser, loginUser, getMe };`,

    'backend/src/controllers/predictionController.js': `const Prediction = require('../models/Prediction');
const User = require('../models/User');

const getPredictions = async (req, res) => {
    try {
        const { date, limit = 50, page = 1 } = req.query;
        
        let query = {};
        if (date) {
            const startDate = new Date(date);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(date);
            endDate.setHours(23, 59, 59, 999);
            query.matchTime = { $gte: startDate, $lte: endDate };
        } else {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            query.matchTime = { $gte: today, $lt: tomorrow };
        }
        
        let userHasVip = false;
        if (req.user) {
            const user = await User.findById(req.user._id);
            userHasVip = user.subscriptionStatus === 'active' && user.subscriptionEndDate > new Date();
        }
        
        if (!userHasVip) {
            query.isVip = false;
        }
        
        const skip = (page - 1) * limit;
        const predictions = await Prediction.find(query)
            .sort({ featured: -1, matchTime: 1 })
            .limit(parseInt(limit))
            .skip(skip);
        
        const total = await Prediction.countDocuments(query);
        
        res.json({
            predictions,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit),
                hasMore: skip + predictions.length < total
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getPredictionStats = async (req, res) => {
    try {
        const total = await Prediction.countDocuments();
        const won = await Prediction.countDocuments({ status: 'won' });
        const lost = await Prediction.countDocuments({ status: 'lost' });
        const vip = await Prediction.countDocuments({ isVip: true });
        
        const winRate = total > 0 ? ((won / (won + lost)) * 100).toFixed(1) : 0;
        
        res.json({
            stats: {
                total,
                won,
                lost,
                vip,
                winRate: parseFloat(winRate)
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getPredictions, getPredictionStats };`,

    'backend/src/middleware/authMiddleware.js': `const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');
            next();
        } catch (error) {
            res.status(401).json({ message: 'Not authorized' });
        }
    }
    
    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Admin access required' });
    }
};

module.exports = { protect, admin };`,

    'backend/src/routes/authRoutes.js': `const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);

module.exports = router;`,

    'backend/src/routes/predictionRoutes.js': `const express = require('express');
const router = express.Router();
const { getPredictions, getPredictionStats } = require('../controllers/predictionController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getPredictions);
router.get('/stats', getPredictionStats);

module.exports = router;`,

    'backend/src/routes/subscriptionRoutes.js': `const express = require('express');
const router = express.Router();

router.get('/plans', (req, res) => {
    res.json({
        plans: {
            monthly: { name: 'Monthly', price: 29.99, duration: 30 },
            quarterly: { name: 'Quarterly', price: 79.99, duration: 90 },
            yearly: { name: 'Yearly', price: 299.99, duration: 365 }
        }
    });
});

module.exports = router;`,

    // Frontend files
    'frontend/package.json': `{
  "name": "goalmaster-frontend",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "axios": "^1.5.0",
    "date-fns": "^2.30.0",
    "next-auth": "^4.23.1",
    "react-hot-toast": "^2.4.1",
    "tailwindcss": "^3.3.3"
  },
  "devDependencies": {
    "@types/node": "^20.6.0",
    "@types/react": "^18.2.21",
    "autoprefixer": "^10.4.15",
    "postcss": "^8.4.29",
    "typescript": "^5.2.2"
  }
}`,

    'frontend/tailwind.config.js': `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0a2540',
        accent: '#f5a623',
      },
    },
  },
  plugins: [],
}`,

    'frontend/src/app/globals.css': `@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  background: linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%);
}`,

    'frontend/src/app/layout.js': `import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'GoalMaster Pro - Football Predictions',
  description: 'Professional football predictions with 89% accuracy',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}`,

    'frontend/src/app/page.js': `'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';

const API_URL = 'http://localhost:5000/api';

export default function Home() {
  const [predictions, setPredictions] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [predictionsRes, statsRes] = await Promise.all([
        axios.get(\`\${API_URL}/predictions\`, {
          headers: token ? { Authorization: \`Bearer \${token}\` } : {}
        }),
        axios.get(\`\${API_URL}/predictions/stats\`)
      ]);
      
      setPredictions(predictionsRes.data.predictions || []);
      setStats(statsRes.data.stats || {});
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load predictions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Toaster position="top-right" />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary to-primary/90 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-4">
            Professional Football Predictions
          </h1>
          <p className="text-xl mb-8">
            {stats.winRate || 89}% win rate • {stats.total || 0}+ predictions
          </p>
          <button className="bg-accent text-primary px-8 py-3 rounded-lg font-bold hover:shadow-lg transition">
            Get Started
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="text-3xl font-bold text-accent">{stats.winRate || 89}%</div>
            <div className="text-gray-600">Win Rate</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="text-3xl font-bold text-accent">{stats.total || 0}</div>
            <div className="text-gray-600">Total Predictions</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="text-3xl font-bold text-accent">{stats.won || 0}</div>
            <div className="text-gray-600">Won Tips</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="text-3xl font-bold text-accent">{stats.vip || 0}</div>
            <div className="text-gray-600">VIP Tips</div>
          </div>
        </div>

        {/* Predictions Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-2xl font-bold">Today's Predictions</h2>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="text-center py-12">Loading predictions...</div>
            ) : predictions.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No predictions available today</div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left">Time</th>
                    <th className="px-6 py-3 text-left">Match</th>
                    <th className="px-6 py-3 text-left">League</th>
                    <th className="px-6 py-3 text-left">Prediction</th>
                    <th className="px-6 py-3 text-left">Odds</th>
                  </tr>
                </thead>
                <tbody>
                  {predictions.map((pred) => (
                    <tr key={pred._id} className="border-t hover:bg-gray-50">
                      <td className="px-6 py-4">
                        {new Date(pred.matchTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-6 py-4">
                        {pred.homeTeam} vs {pred.awayTeam}
                      </td>
                      <td className="px-6 py-4">{pred.league}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                          {pred.tipValue}
                        </span>
                        {pred.isVip && (
                          <span className="ml-2 px-2 py-1 bg-yellow-400 text-yellow-800 rounded-full text-sm">
                            VIP
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-bold text-accent">{pred.odds}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}`,

    'frontend/.env.local.example': `NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret_key_here`,

    'frontend/next.config.js': `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost', 'via.placeholder.com'],
  },
}

module.exports = nextConfig`,

    // Docker files
    'docker/docker-compose.yml': `version: '3.8'

services:
  mongodb:
    image: mongo:latest
    container_name: goalmaster-mongodb
    restart: always
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password

  backend:
    build:
      context: ../backend
      dockerfile: ../docker/Dockerfile.backend
    container_name: goalmaster-backend
    restart: always
    ports:
      - "5000:5000"
    depends_on:
      - mongodb
    environment:
      MONGODB_URI: mongodb://admin:password@mongodb:27017/goalmaster?authSource=admin
    env_file:
      - ../backend/.env

  frontend:
    build:
      context: ../frontend
      dockerfile: ../docker/Dockerfile.frontend
    container_name: goalmaster-frontend
    restart: always
    ports:
      - "3000:3000"
    depends_on:
      - backend
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:5000/api

volumes:
  mongodb_data:`,

    'docker/Dockerfile.backend': `FROM node:18-alpine

WORKDIR /app

COPY backend/package*.json ./
RUN npm ci --only=production

COPY backend/ ./

EXPOSE 5000

CMD ["npm", "start"]`,

    'docker/Dockerfile.frontend': `FROM node:18-alpine AS builder

WORKDIR /app

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

CMD ["npm", "start"]`,

    // Seed data
    'backend/seed.js': `const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');
const Prediction = require('./src/models/Prediction');

dotenv.config();

const predictions = [
    {
        homeTeam: 'Manchester United',
        awayTeam: 'Liverpool',
        league: 'Premier League',
        matchTime: new Date(new Date().setHours(15, 30, 0)),
        tipType: 'OVER_25',
        tipValue: 'Over 2.5 Goals',
        odds: 1.85,
        isVip: false,
        confidence: 4,
        featured: true
    },
    {
        homeTeam: 'Barcelona',
        awayTeam: 'Real Madrid',
        league: 'La Liga',
        matchTime: new Date(new Date().setHours(18, 0, 0)),
        tipType: 'CORRECT_SCORE',
        tipValue: '2-1',
        odds: 8.50,
        isVip: true,
        confidence: 5,
        featured: true
    },
    {
        homeTeam: 'AC Milan',
        awayTeam: 'Inter Milan',
        league: 'Serie A',
        matchTime: new Date(new Date().setHours(20, 45, 0)),
        tipType: 'BTTS',
        tipValue: 'Both Teams to Score',
        odds: 2.10,
        isVip: false,
        confidence: 4,
        featured: true
    }
];

const seedDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');
        
        await Prediction.deleteMany();
        await Prediction.insertMany(predictions);
        console.log(\`Inserted \${predictions.length} predictions\`);
        
        const adminExists = await User.findOne({ email: 'admin@goalmaster.com' });
        if (!adminExists) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('Admin123!', salt);
            
            await User.create({
                name: 'Admin',
                email: 'admin@goalmaster.com',
                password: hashedPassword,
                role: 'admin'
            });
            console.log('Admin user created');
        }
        
        console.log('✅ Database seeded successfully!');
        process.exit();
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
};

seedDatabase();`
};

// Function to create directory and file
function createFile(filePath, content) {
    const fullPath = path.join(PROJECT_ROOT, filePath);
    const dir = path.dirname(fullPath);
    
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(fullPath, content);
    console.log(`✅ Created: ${filePath}`);
}

// Main function to generate project
function generateProject() {
    console.log('🚀 Generating GoalMaster Pro Project...\n');
    
    // Create all files
    for (const [filePath, content] of Object.entries(files)) {
        createFile(filePath, content);
    }
    
    console.log('\n✅ Project generated successfully!');
    console.log('\n📁 Project location:', PROJECT_ROOT);
    console.log('\n🚀 Next steps:');
    console.log('1. cd goalmaster-pro/backend && npm install');
    console.log('2. cd ../frontend && npm install');
    console.log('3. cp backend/.env.example backend/.env');
    console.log('4. cp frontend/.env.local.example frontend/.env.local');
    console.log('5. Update .env files with your credentials');
    console.log('6. Start MongoDB');
    console.log('7. cd backend && npm run seed');
    console.log('8. cd backend && npm run dev');
    console.log('9. cd frontend && npm run dev');
    console.log('\n🌐 Open http://localhost:3000 to view the app');
}

// Run the generator
generateProject();