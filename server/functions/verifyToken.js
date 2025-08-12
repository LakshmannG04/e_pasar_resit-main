require('dotenv').config();
const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.JWT_SECRET_KEY;

function verifyToken(token) {
  return new Promise((resolve, reject) => {
    if (!token || typeof token !== 'string') {
      return reject('No token provided');
    }
    const parts = token.trim().split(' ');
    const raw = parts.length === 2 && /^Bearer$/i.test(parts[0]) ? parts[1] : parts[0];

    jwt.verify(raw, SECRET_KEY, (err, decoded) => {
      if (err) return reject(err);
      resolve(decoded);
    });
  });
}

module.exports = { verifyToken };
