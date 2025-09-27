require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize, ElectionState } = require('./models');
const authRoutes = require('./routes/auth');
const candidateRoutes = require('./routes/candidate');
const voteRoutes = require('./routes/vote');
const comelecRoutes = require('./routes/comelec');
const adminRoutes = require('./routes/admin');
const path = require('path');
const electionRoutes = require("./routes/election");
const studentRoutes = require("./routes/student");
const ensureVotingOpen = require('./routes/ensureVotingOpen');
const app = express();

// Enable CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// Serve candidate documents
app.use(
  '/uploads/candidate-docs',
  express.static(path.join(__dirname, 'uploads/candidate-docs'))
);

// Parse JSON
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/vote', voteRoutes);
app.use('/api/comelec', comelecRoutes);
app.use('/api/admin', adminRoutes);
app.use("/api", electionRoutes);
app.use("/api", studentRoutes);

// Health check
app.get('/', (req, res) => res.send('Server is running 🚀'));

// List API routes
app.get('/api/routes', (req, res) => {
  const routes = [
    { path: "/api/auth/register", methods: ["POST"], middlewares: ["anonymous"] },
    { path: "/api/auth/register-admin", methods: ["POST"], middlewares: ["auth (admin only)"] },
    { path: "/api/auth/register-comelec", methods: ["POST"], middlewares: ["auth (admin only)"] },
    { path: "/api/auth/totp/setup", methods: ["POST"], middlewares: ["auth"] },
    { path: "/api/auth/totp/verify", methods: ["POST"], middlewares: ["auth"] },
    { path: "/api/auth/login", methods: ["POST"], middlewares: ["anonymous"] },

    { path: "/api/candidates", methods: ["GET", "POST"], middlewares: ["auth (admin for POST)"] },
    { path: "/api/vote/cast", methods: ["POST"], middlewares: ["auth"] },

    { path: "/api/comelec/progress", methods: ["GET"], middlewares: ["auth (comelec only)"] },
    { path: "/api/comelec/final-report", methods: ["GET"], middlewares: ["auth (comelec only)"] },

    { path: "/api/admin/toggle-voting", methods: ["GET","POST"], middlewares: ["auth (admin only)"] },
    { path: "/api/admin/pending-users", methods: ["GET"], middlewares: ["auth (admin only)"] },
    { path: "/api/admin/approve-user/:id", methods: ["POST"], middlewares: ["auth (admin only)"] },
    { path: "/api/admin/candidates", methods: ["GET","POST"], middlewares: ["auth (admin only)"] },
    { path: "/api/admin/candidates/:id", methods: ["PUT","DELETE"], middlewares: ["auth (admin only)"] },
    { path: "/api/admin/logs", methods: ["GET"], middlewares: ["auth (admin only)"] },
    { path: "/api/admin/generate-report", methods: ["POST"], middlewares: ["auth (admin only)"] },
  ];
  res.json(routes);
});

// Initialize DB and start server
async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('Database synced ✅');

    // Ensure ElectionState row exists
    await ElectionState.findOrCreate({
      where: { id: 1 },
      defaults: { votingOpen: false }, // ✅ matches your model column
    });

    app.listen(4000, () => console.log('Server started on port 4000 🚀'));
  } catch (err) {
    console.error('Failed to start server:', err);
  }
}

startServer();
