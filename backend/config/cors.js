const allowedOrigins = () => {
  if (process.env.NODE_ENV === 'production') {
    const configured = process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(',').map(s => s.trim()).filter(Boolean)
      : [];
    return configured;
  }
  // development
  return [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ];
};

const corsOptions = {
  origin: (origin, callback) => {
    // allow requests without an Origin header (e.g., curl, health check, server‑to‑server)
    if (!origin) return callback(null, true);

    const allowed = allowedOrigins();
    if (allowed.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
};

module.exports = corsOptions;