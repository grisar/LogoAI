const jwt = require('jsonwebtoken');

/**
 * JWT authentication middleware
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    console.log('Authentication failed: No token provided');
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.log('Authentication failed: Invalid or expired token', {
        error: err.message,
        tokenPreview: token.substring(0, 30) + '...'
      });
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    
    console.log('Authentication successful:', {
      userId: user.id,
      email: user.email
    });
    
    req.user = user;
    next();
  });
}

/**
 * Generate JWT token
 */
function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

module.exports = {
  authenticateToken,
  generateToken,
};