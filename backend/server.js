const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const fileUpload = require('express-fileupload');
require('dotenv').config();

const app = express();

// Middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000000
});
app.use(limiter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
});

app.use(fileUpload({
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
}));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/decks', require('./routes/decks'));
app.use('/api/cards', require('./routes/cards'));
app.use('/api/reviews', require('./routes/reviews')); 
app.use('/api/tags', require('./routes/tags'));       
app.use('/api/test', require('./routes/test'));



// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl 
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('🚨 Error caught by global handler:', {
    message: error.message,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Если заголовки уже отправлены, делегируем стандартному обработчику
  if (res.headersSent) {
    return next(error);
  }

  // Production vs Development error response
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  const errorResponse = {
    error: 'Internal server error',
    ...(isDevelopment && {
      details: error.message,
      stack: error.stack
    })
  };

  res.status(500).json(errorResponse);
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log('📚 Available routes:');
  console.log('   /api/auth/* - Authentication');
  console.log('   /api/decks/* - Decks management');
  console.log('   /api/cards/* - Cards management');
  console.log('   /api/reviews/* - Spaced repetition system');
  console.log('   /api/tags/* - Tags management');
});