const jwt = require('jsonwebtoken');

const generateToken = (userId) => {
  const secret = process.env.JWT_SECRET || 'syncspace-premium-key-2026';
  return jwt.sign({ id: userId }, secret, {
    expiresIn: '30d'
  });
};

module.exports = generateToken;
