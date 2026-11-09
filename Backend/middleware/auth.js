const { auth } = require('../services/firebase');

async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = await auth.verifyIdToken(token, true);

    const isGoogle = decoded.firebase?.sign_in_provider === 'google.com';
    if (!decoded.email_verified && !isGoogle) {
      return res.status(403).json({ error: 'Please verify your email address first.' });
    }

    req.user = decoded;
    req.userId = decoded.uid;
    next();
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = { verifyToken };