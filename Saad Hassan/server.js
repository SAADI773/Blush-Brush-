const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'blush_and_brush_secret_key_2026';

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));
// Also serve assets/images from Eiman/ and irsa/ if needed
app.use('/Eiman', express.static(path.join(__dirname, 'Eiman')));
app.use('/irsa', express.static(path.join(__dirname, 'irsa')));

// Auth Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required. Please login.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired session token.' });
    }
    req.user = user;
    next();
  });
}

// Require Admin Middleware
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin privilege required.' });
  }
  next();
}

// ==========================================
// AUTH ROUTES
// ==========================================

// 1. SIGNUP
app.post('/api/auth/signup', (req, res) => {
  const { name, email, phone, password, role } = req.body;

  if (!name || !email || !phone || !password) {
    return res.status(400).json({ error: 'Please provide all required fields (name, email, phone, password).' });
  }

  const userRole = role === 'admin' ? 'admin' : 'user';
  const hashedPassword = bcrypt.hashSync(password, 10);

  const query = `INSERT INTO users (name, email, phone, password, role) VALUES (?, ?, ?, ?, ?)`;
  db.run(query, [name.trim(), email.trim().toLowerCase(), phone.trim(), hashedPassword, userRole], function (err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: 'An account with this email already exists.' });
      }
      return res.status(500).json({ error: 'Database error during registration.' });
    }

    const userId = this.lastID;
    const userPayload = { id: userId, name: name.trim(), email: email.trim().toLowerCase(), phone: phone.trim(), role: userRole };
    const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'Account created successfully!',
      token,
      user: userPayload
    });
  });
});

// 2. LOGIN
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const query = `SELECT * FROM users WHERE email = ?`;
  db.get(query, [email.trim().toLowerCase()], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error during login.' });
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const validPassword = bcrypt.compareSync(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const userPayload = { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role };
    const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Login successful!',
      token,
      user: userPayload
    });
  });
});

// 3. GET CURRENT USER (ME)
app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// ==========================================
// APPOINTMENT ROUTES
// ==========================================

// 1. GET APPOINTMENTS (Admin gets all, User gets theirs)
app.get('/api/appointments', authenticateToken, (req, res) => {
  if (req.user.role === 'admin') {
    const query = `
      SELECT a.*, u.email as user_email 
      FROM appointments a 
      LEFT JOIN users u ON a.user_id = u.id 
      ORDER BY a.id DESC
    `;
    db.all(query, [], (err, rows) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch appointments.' });
      res.json({ appointments: rows });
    });
  } else {
    const query = `SELECT * FROM appointments WHERE user_id = ? ORDER BY id DESC`;
    db.all(query, [req.user.id], (err, rows) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch your appointments.' });
      res.json({ appointments: rows });
    });
  }
});

// 2. CREATE APPOINTMENT (User or Admin)
app.post('/api/appointments', authenticateToken, (req, res) => {
  const { client_name, client_phone, service, appointment_date, appointment_time, remarks, status } = req.body;

  if (!client_name || !client_phone || !service || !appointment_date || !appointment_time) {
    return res.status(400).json({ error: 'Please provide all required appointment fields.' });
  }

  const initialStatus = req.user.role === 'admin' && status ? status : 'Pending';
  const query = `
    INSERT INTO appointments (user_id, client_name, client_phone, service, appointment_date, appointment_time, status, remarks, admin_message)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(
    query,
    [
      req.user.id,
      client_name.trim(),
      client_phone.trim(),
      service.trim(),
      appointment_date,
      appointment_time,
      initialStatus,
      remarks ? remarks.trim() : '',
      ''
    ],
    function (err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to create appointment.' });
      }

      db.get(`SELECT * FROM appointments WHERE id = ?`, [this.lastID], (err, newAppointment) => {
        res.status(201).json({
          message: 'Appointment booked successfully!',
          appointment: newAppointment
        });
      });
    }
  );
});

// 3. UPDATE APPOINTMENT STATUS (Admin only)
app.patch('/api/appointments/:id/status', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['Pending', 'Upcoming', 'Accepted', 'Completed', 'Cancelled', 'Rejected'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status provided.' });
  }

  // Normalize status naming: "Accepted" -> "Upcoming", "Rejected" -> "Cancelled"
  let dbStatus = status;
  if (status === 'Accepted') dbStatus = 'Upcoming';
  if (status === 'Rejected') dbStatus = 'Cancelled';

  const query = `UPDATE appointments SET status = ? WHERE id = ?`;
  db.run(query, [dbStatus, id], function (err) {
    if (err) return res.status(500).json({ error: 'Failed to update appointment status.' });
    if (this.changes === 0) return res.status(404).json({ error: 'Appointment not found.' });

    db.get(`SELECT * FROM appointments WHERE id = ?`, [id], (err, updated) => {
      res.json({ message: `Status updated to ${dbStatus}`, appointment: updated });
    });
  });
});

// 4. SEND CUSTOM ADMIN MESSAGE / NOTE TO CLIENT (Admin only)
app.patch('/api/appointments/:id/message', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  const { admin_message } = req.body;

  const query = `UPDATE appointments SET admin_message = ? WHERE id = ?`;
  db.run(query, [admin_message ? admin_message.trim() : '', id], function (err) {
    if (err) return res.status(500).json({ error: 'Failed to update admin message.' });
    if (this.changes === 0) return res.status(404).json({ error: 'Appointment not found.' });

    db.get(`SELECT * FROM appointments WHERE id = ?`, [id], (err, updated) => {
      res.json({ message: 'Custom message sent to client successfully!', appointment: updated });
    });
  });
});

// 5. DELETE APPOINTMENT (Admin or Owner)
app.delete('/api/appointments/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  db.get(`SELECT * FROM appointments WHERE id = ?`, [id], (err, appt) => {
    if (err) return res.status(500).json({ error: 'Database error.' });
    if (!appt) return res.status(404).json({ error: 'Appointment not found.' });

    if (req.user.role !== 'admin' && appt.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to delete this appointment.' });
    }

    db.run(`DELETE FROM appointments WHERE id = ?`, [id], function (err) {
      if (err) return res.status(500).json({ error: 'Failed to delete appointment.' });
      res.json({ message: 'Appointment cancelled/deleted successfully.' });
    });
  });
});

// Fallback to index.html for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`Blush & Brush Server running at http://localhost:${PORT}`);
});
