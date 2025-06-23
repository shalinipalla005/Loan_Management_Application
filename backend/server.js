const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database and sync models
async function initializeDatabase() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.');
    
    // Sync all models
    // Note: In production, you might want to use migrations instead
    await sequelize.sync({ alter: true });
    console.log('Database models synchronized.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}

// Routes setup (to be added by team)
// app.use('/api/members', require('./routes/memberRoutes'));
// app.use('/api/loans', require('./routes/loanRoutes'));
// app.use('/api/societies', require('./routes/societyRoutes'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  await initializeDatabase();
});

module.exports = app;
