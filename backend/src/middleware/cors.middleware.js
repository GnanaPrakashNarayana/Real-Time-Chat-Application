// backend/src/middleware/cors.middleware.js
export const corsMiddleware = (req, res, next) => {
  // Allow requests from both production and development environments
  const allowedOrigins = [
    'https://chatterpillar.netlify.app',
    'http://localhost:5173'
  ];
  
  const origin = req.headers.origin;
  
  // Check if the request origin is in our allowed list
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'false'); // Change to false for token auth
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
};