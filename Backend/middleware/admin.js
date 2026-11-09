function requireAdmin(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    const isAdmin = req.user.admin === true || req.user.role === 'admin';
    if (!isAdmin) {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
}

module.exports = { requireAdmin };