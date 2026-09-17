﻿const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');

dotenv.config();

const authRoutes = require('./routes/auth');
const syncRoutes = require('./routes/sync');
const rankingRoutes = require('./routes/ranking');
const friendsRoutes = require('./routes/friends');
const userRoutes = require('./routes/user');
const uploadRoutes = require('./routes/upload');
const chatRoutes = require('./routes/chat');

const app = express();

// ============================================
// TRUST PROXY (required on Render & similar hosts)
// ============================================
app.set('trust proxy', 1);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ============================================
// CORS
// ============================================
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5500',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:5500',
    'https://ani-pulse.netlify.app',
    'https://anipulse-63jv.onrender.com'
];

if (process.env.FRONTEND_URL) {
    process.env.FRONTEND_URL
        .split(',')
        .map((u) => u.trim().replace(/\/$/, ''))
        .filter(Boolean)
        .forEach((u) => {
            if (!allowedOrigins.includes(u)) allowedOrigins.push(u);
        });
}

app.use(
    cors({
        origin: (origin, cb) => {
            if (!origin) return cb(null, true);
            if (allowedOrigins.includes(origin)) return cb(null, true);
            console.log('❌ CORS blocked:', origin);
            cb(new Error('Not allowed by CORS'));
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
        allowedHeaders: [
            'Content-Type',
            'Authorization',
            'X-Requested-With',
            'Accept'
        ],
        exposedHeaders: ['Content-Range', 'X-Content-Range'],
        maxAge: 86400
    })
);
app.options('*', cors());

// ============================================
// RATE LIMITING
// ============================================
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) =>
        req.path === '/api/firebase-config' ||
        req.path === '/api/sync/status' ||
        req.path === '/api/health'
});
app.use('/api/', limiter);

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// ============================================
// FIREBASE CLIENT CONFIG
// ============================================
app.get('/api/firebase-config', (req, res) => {
    res.json({
        apiKey: process.env.FIREBASE_API_KEY,
        authDomain:
            process.env.FIREBASE_AUTH_DOMAIN ||
            `${process.env.FIREBASE_PROJECT_ID}.firebaseapp.com`,
        projectId: process.env.FIREBASE_PROJECT_ID,
        storageBucket:
            process.env.FIREBASE_STORAGE_BUCKET ||
            `${process.env.FIREBASE_PROJECT_ID}.appspot.com`,
        messagingSenderId: process.env.FIREBASE_SENDER_ID,
        appId: process.env.FIREBASE_APP_ID
    });
});

// ============================================
// API ROUTES
// ============================================
app.use('/api/auth', authRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/ranking', rankingRoutes);
app.use('/api/friends', friendsRoutes);
app.use('/api/user', userRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/chat', chatRoutes);

app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// ============================================
// 404 — JSON only (frontend is on Netlify)
// ============================================
app.use((req, res) => {
    res.status(404).json({ error: 'Not found', path: req.originalUrl });
});

// ============================================
// ERROR HANDLER
// ============================================
app.use((err, req, res, next) => {
    console.error('❌ Error:', err.message);
    if (err.message === 'Not allowed by CORS') {
        return res
            .status(403)
            .json({ error: 'CORS blocked: Origin not allowed' });
    }
    res.status(500).json({
        error: 'Internal server error',
        message:
            process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// ============================================
// START
// ============================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
});