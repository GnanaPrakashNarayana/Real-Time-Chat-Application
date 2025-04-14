// backend/src/middleware/cors.middleware.js
export const corsMiddleware = (req, res, next) => {
  // Define allowed origins
  const allowedOrigins = [
    'https://chatterpillar.netlify.app',
    'http://localhost:5173'
  ];
  
  const origin = req.headers.origin;
  
  // Check if origin is allowed
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    // For development/debugging - remove in production
    console.log(`Rejected origin: ${origin}`);
  }
  
  // Essential CORS headers
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'false');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
};