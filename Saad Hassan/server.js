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
app.use('/Eiman', express.static(path.join(__dirname, '..', 'Eiman')));
app.use('/irsa', express.static(path.join(__dirname, '..', 'irsa')));

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

// Require Admin Middleware (admin or superadmin)
function requireAdmin(req, res, next) {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'superadmin')) {
    return res.status(403).json({ error: 'Admin or Super Admin privilege required.' });
  }
  next();
}

// Require Super Admin Middleware
function requireSuperAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'superadmin') {
    return res.status(403).json({ error: 'Super Admin privilege required.' });
  }
  next();
}

// ==========================================
// 1. AUTH & PROFILE ROUTES
// ==========================================

// SIGNUP
app.post('/api/auth/signup', (req, res) => {
  const { name, email, phone, password, role } = req.body;

  if (!name || !email || !phone || !password) {
    return res.status(400).json({ error: 'Please fill in all required registration fields.' });
  }

  const userRole = (role === 'admin' || role === 'superadmin') ? role : 'user';
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

// LOGIN
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const query = `SELECT * FROM users WHERE email = ?`;
  db.get(query, [email.trim().toLowerCase()], (err, user) => {
    if (err || !user) {
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

// GET ME
app.get('/api/auth/me', authenticateToken, (req, res) => {
  db.get(`SELECT id, name, email, phone, role, created_at FROM users WHERE id = ?`, [req.user.id], (err, user) => {
    if (err || !user) return res.status(404).json({ error: 'User not found.' });
    res.json({ user });
  });
});

// UPDATE PROFILE (Name, Phone)
app.patch('/api/users/profile', authenticateToken, (req, res) => {
  const { name, phone } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ error: 'Name and phone number are required.' });
  }

  db.run(`UPDATE users SET name = ?, phone = ? WHERE id = ?`, [name.trim(), phone.trim(), req.user.id], function (err) {
    if (err) return res.status(500).json({ error: 'Failed to update profile.' });
    
    db.get(`SELECT id, name, email, phone, role FROM users WHERE id = ?`, [req.user.id], (err, updatedUser) => {
      const token = jwt.sign(updatedUser, JWT_SECRET, { expiresIn: '7d' });
      res.json({ message: 'Profile updated successfully!', user: updatedUser, token });
    });
  });
});

// UPDATE PASSWORD
app.patch('/api/users/password', authenticateToken, (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current password and new password are required.' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
  }

  db.get(`SELECT password FROM users WHERE id = ?`, [req.user.id], (err, user) => {
    if (err || !user) return res.status(404).json({ error: 'User not found.' });

    const isMatch = bcrypt.compareSync(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Incorrect current password.' });
    }

    const hashedNewPassword = bcrypt.hashSync(newPassword, 10);
    db.run(`UPDATE users SET password = ? WHERE id = ?`, [hashedNewPassword, req.user.id], function (err) {
      if (err) return res.status(500).json({ error: 'Failed to update password.' });
      res.json({ message: 'Password updated successfully!' });
    });
  });
});


// ==========================================
// 2. APPOINTMENT ROUTES
// ==========================================

// GET APPOINTMENTS
app.get('/api/appointments', authenticateToken, (req, res) => {
  if (req.user.role === 'admin' || req.user.role === 'superadmin') {
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

// CREATE APPOINTMENT
app.post('/api/appointments', authenticateToken, (req, res) => {
  const { client_name, client_phone, service, appointment_date, appointment_time, remarks, status } = req.body;

  if (!client_name || !client_phone || !service || !appointment_date || !appointment_time) {
    return res.status(400).json({ error: 'Please fill in all required appointment fields.' });
  }

  const initialStatus = (req.user.role === 'admin' || req.user.role === 'superadmin') && status ? status : 'Pending';
  const query = `
    INSERT INTO appointments (user_id, client_name, client_phone, service, appointment_date, appointment_time, status, remarks, admin_message)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(
    query,
    [req.user.id, client_name.trim(), client_phone.trim(), service.trim(), appointment_date, appointment_time, initialStatus, remarks ? remarks.trim() : '', ''],
    function (err) {
      if (err) return res.status(500).json({ error: 'Failed to create appointment.' });

      db.get(`SELECT * FROM appointments WHERE id = ?`, [this.lastID], (err, newAppointment) => {
        res.status(201).json({ message: 'Appointment booked successfully!', appointment: newAppointment });
      });
    }
  );
});

// UPDATE STATUS (Admin/Superadmin)
app.patch('/api/appointments/:id/status', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['Pending', 'Upcoming', 'Accepted', 'Completed', 'Cancelled', 'Rejected'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status provided.' });
  }

  let dbStatus = status;
  if (status === 'Accepted') dbStatus = 'Upcoming';
  if (status === 'Rejected') dbStatus = 'Cancelled';

  db.run(`UPDATE appointments SET status = ? WHERE id = ?`, [dbStatus, id], function (err) {
    if (err) return res.status(500).json({ error: 'Failed to update status.' });
    db.get(`SELECT * FROM appointments WHERE id = ?`, [id], (err, updated) => {
      res.json({ message: `Status updated to ${dbStatus}`, appointment: updated });
    });
  });
});

// UPDATE ADMIN MESSAGE (Admin/Superadmin)
app.patch('/api/appointments/:id/message', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  const { admin_message } = req.body;

  db.run(`UPDATE appointments SET admin_message = ? WHERE id = ?`, [admin_message ? admin_message.trim() : '', id], function (err) {
    if (err) return res.status(500).json({ error: 'Failed to update message.' });
    db.get(`SELECT * FROM appointments WHERE id = ?`, [id], (err, updated) => {
      res.json({ message: 'Note sent to client successfully!', appointment: updated });
    });
  });
});

// DELETE APPOINTMENT
app.delete('/api/appointments/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  db.get(`SELECT * FROM appointments WHERE id = ?`, [id], (err, appt) => {
    if (err || !appt) return res.status(404).json({ error: 'Appointment not found.' });

    if (req.user.role !== 'admin' && req.user.role !== 'superadmin' && appt.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to delete this appointment.' });
    }

    db.run(`DELETE FROM appointments WHERE id = ?`, [id], function (err) {
      if (err) return res.status(500).json({ error: 'Failed to delete appointment.' });
      res.json({ message: 'Appointment deleted successfully.' });
    });
  });
});


// ==========================================
// 3. SALON SERVICES ROUTES
// ==========================================

app.get('/api/services', (req, res) => {
  db.all(`SELECT * FROM services ORDER BY category, name`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch services.' });
    res.json({ services: rows });
  });
});

app.post('/api/services', authenticateToken, requireAdmin, (req, res) => {
  const { name, category, price, duration, description } = req.body;
  if (!name || !category || !price || !duration) {
    return res.status(400).json({ error: 'Service name, category, price, and duration are required.' });
  }

  db.run(
    `INSERT INTO services (name, category, price, duration, description) VALUES (?, ?, ?, ?, ?)`,
    [name.trim(), category.trim(), parseFloat(price), duration.trim(), description ? description.trim() : ''],
    function (err) {
      if (err) return res.status(500).json({ error: 'Failed to add service.' });
      db.get(`SELECT * FROM services WHERE id = ?`, [this.lastID], (err, newService) => {
        res.status(201).json({ message: 'Service added successfully!', service: newService });
      });
    }
  );
});

app.delete('/api/services/:id', authenticateToken, requireAdmin, (req, res) => {
  db.run(`DELETE FROM services WHERE id = ?`, [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: 'Failed to delete service.' });
    res.json({ message: 'Service deleted successfully.' });
  });
});


// ==========================================
// 4. ANNOUNCEMENTS ROUTES
// ==========================================

app.get('/api/announcements', (req, res) => {
  db.all(`SELECT * FROM announcements ORDER BY id DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch announcements.' });
    res.json({ announcements: rows });
  });
});

app.post('/api/announcements', authenticateToken, requireAdmin, (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required for announcement.' });
  }

  const dateToday = new Date().toISOString().split('T')[0];
  db.run(
    `INSERT INTO announcements (title, content, date) VALUES (?, ?, ?)`,
    [title.trim(), content.trim(), dateToday],
    function (err) {
      if (err) return res.status(500).json({ error: 'Failed to publish announcement.' });
      db.get(`SELECT * FROM announcements WHERE id = ?`, [this.lastID], (err, item) => {
        res.status(201).json({ message: 'Announcement published successfully!', announcement: item });
      });
    }
  );
});

app.delete('/api/announcements/:id', authenticateToken, requireAdmin, (req, res) => {
  db.run(`DELETE FROM announcements WHERE id = ?`, [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: 'Failed to delete announcement.' });
    res.json({ message: 'Announcement deleted.' });
  });
});


// ==========================================
// 5. SUPER ADMIN SUITE ROUTES
// ==========================================

// USER MANAGEMENT (List all users)
app.get('/api/superadmin/users', authenticateToken, requireSuperAdmin, (req, res) => {
  db.all(`SELECT id, name, email, phone, role, created_at FROM users ORDER BY id DESC`, [], (err, users) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch users.' });
    res.json({ users });
  });
});

// CHANGE USER ROLE
app.patch('/api/superadmin/users/:id/role', authenticateToken, requireSuperAdmin, (req, res) => {
  const { role } = req.body;
  const validRoles = ['user', 'admin', 'superadmin'];
  if (!role || !validRoles.includes(role)) {
    return res.status(400).json({ error: 'Invalid role specified.' });
  }

  db.run(`UPDATE users SET role = ? WHERE id = ?`, [role, req.params.id], function (err) {
    if (err) return res.status(500).json({ error: 'Failed to update user role.' });
    res.json({ message: `User role updated to ${role}.` });
  });
});

// FORCE RESET PASSWORD (Superadmin)
app.patch('/api/superadmin/users/:id/reset-password', authenticateToken, requireSuperAdmin, (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters.' });
  }

  const hashedPassword = bcrypt.hashSync(newPassword, 10);
  db.run(`UPDATE users SET password = ? WHERE id = ?`, [hashedPassword, req.params.id], function (err) {
    if (err) return res.status(500).json({ error: 'Failed to reset password.' });
    res.json({ message: 'User password reset successfully!' });
  });
});

// DELETE USER ACCOUNT (Superadmin)
app.delete('/api/superadmin/users/:id', authenticateToken, requireSuperAdmin, (req, res) => {
  if (parseInt(req.params.id) === req.user.id) {
    return res.status(400).json({ error: 'Superadmin cannot delete their own account.' });
  }

  db.run(`DELETE FROM users WHERE id = ?`, [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: 'Failed to delete user.' });
    res.json({ message: 'User account deleted successfully.' });
  });
});

// PRODUCT MANAGEMENT (Get, Add, Edit, Delete)
app.get('/api/products', (req, res) => {
  db.all(`SELECT * FROM products ORDER BY id DESC`, [], (err, products) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch products.' });
    res.json({ products });
  });
});

app.post('/api/products', authenticateToken, requireSuperAdmin, (req, res) => {
  const { name, category, price, stock, description } = req.body;
  if (!name || !category || price === undefined || stock === undefined) {
    return res.status(400).json({ error: 'Product name, category, price, and stock are required.' });
  }

  db.run(
    `INSERT INTO products (name, category, price, stock, description) VALUES (?, ?, ?, ?, ?)`,
    [name.trim(), category.trim(), parseFloat(price), parseInt(stock), description ? description.trim() : ''],
    function (err) {
      if (err) return res.status(500).json({ error: 'Failed to create product.' });
      db.get(`SELECT * FROM products WHERE id = ?`, [this.lastID], (err, product) => {
        res.status(201).json({ message: 'Product added to inventory!', product });
      });
    }
  );
});

app.put('/api/products/:id', authenticateToken, requireSuperAdmin, (req, res) => {
  const { name, category, price, stock, description } = req.body;

  db.run(
    `UPDATE products SET name = ?, category = ?, price = ?, stock = ?, description = ? WHERE id = ?`,
    [name.trim(), category.trim(), parseFloat(price), parseInt(stock), description ? description.trim() : '', req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: 'Failed to update product.' });
      res.json({ message: 'Product updated successfully!' });
    }
  );
});

app.delete('/api/products/:id', authenticateToken, requireSuperAdmin, (req, res) => {
  db.run(`DELETE FROM products WHERE id = ?`, [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: 'Failed to delete product.' });
    res.json({ message: 'Product removed from inventory.' });
  });
});


// Fallback route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Blush & Brush Server running at http://localhost:${PORT}`);
});
