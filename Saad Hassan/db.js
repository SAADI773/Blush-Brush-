const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(__dirname, 'salon.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // Foreign keys constraint enable
  db.run('PRAGMA foreign_keys = ON');

  // 1. Create Users Table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 2. Create Appointments Table
  db.run(`
    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      client_name TEXT NOT NULL,
      client_phone TEXT NOT NULL,
      service TEXT NOT NULL,
      appointment_date TEXT NOT NULL,
      appointment_time TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Pending',
      remarks TEXT,
      admin_message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // 3. Seed Default Admin & Sample Users
  const adminEmail = 'admin@blushandbrush.com';
  db.get(`SELECT id FROM users WHERE email = ?`, [adminEmail], (err, row) => {
    if (err) return console.error('Error checking admin user:', err);
    if (!row) {
      const hashedAdminPassword = bcrypt.hashSync('admin123', 10);
      db.run(
        `INSERT INTO users (name, email, phone, password, role) VALUES (?, ?, ?, ?, ?)`,
        ['Blush Admin', adminEmail, '+92 300 1234567', hashedAdminPassword, 'admin'],
        function (err) {
          if (err) console.error('Error seeding admin:', err);
          else console.log('✅ Default Admin seeded: admin@blushandbrush.com / admin123');
        }
      );
    }
  });

  const sampleUserEmail = 'sarah@gmail.com';
  db.get(`SELECT id FROM users WHERE email = ?`, [sampleUserEmail], (err, row) => {
    if (err) return console.error('Error checking sample user:', err);
    if (!row) {
      const hashedUserPassword = bcrypt.hashSync('user123', 10);
      db.run(
        `INSERT INTO users (name, email, phone, password, role) VALUES (?, ?, ?, ?, ?)`,
        ['Sarah Johnson', sampleUserEmail, '+92 300 9876543', hashedUserPassword, 'user'],
        function (err) {
          if (err) return console.error('Error seeding sample user:', err);
          const userId = this.lastID;
          console.log('✅ Sample User seeded: sarah@gmail.com / user123');

          // Seed Sample Appointments for Sarah
          const sampleAppointments = [
            {
              client_name: 'Sarah Johnson',
              client_phone: '+92 300 9876543',
              service: 'Haircut & Styling',
              appointment_date: '2026-09-05',
              appointment_time: '10:00',
              status: 'Upcoming',
              remarks: 'Prefers layered haircut style',
              admin_message: 'Confirmed! Stylist Eiman is assigned to your appointment.'
            },
            {
              client_name: 'Sarah Johnson',
              client_phone: '+92 300 9876543',
              service: 'Facial Treatment',
              appointment_date: '2026-09-10',
              appointment_time: '14:30',
              status: 'Pending',
              remarks: 'Organic skin glow facial requested',
              admin_message: ''
            }
          ];

          sampleAppointments.forEach(app => {
            db.run(
              `INSERT INTO appointments (user_id, client_name, client_phone, service, appointment_date, appointment_time, status, remarks, admin_message) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                userId,
                app.client_name,
                app.client_phone,
                app.service,
                app.appointment_date,
                app.appointment_time,
                app.status,
                app.remarks,
                app.admin_message
              ]
            );
          });
        }
      );
    }
  });
});

module.exports = db;
