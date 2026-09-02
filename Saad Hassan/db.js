const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(__dirname, 'salon.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // Enable Foreign Keys
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

  // 3. Create Services Table
  db.run(`
    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price REAL NOT NULL,
      duration TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 4. Create Announcements Table
  db.run(`
    CREATE TABLE IF NOT EXISTS announcements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      date TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 5. Create Products Table
  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price REAL NOT NULL,
      stock INTEGER NOT NULL DEFAULT 0,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // ==========================================
  // SEED DEFAULT ACCOUNTS & INITIAL DATA
  // ==========================================

  // A. Super Admin Account
  const superAdminEmail = 'superadmin@blushandbrush.com';
  db.get(`SELECT id FROM users WHERE email = ?`, [superAdminEmail], (err, row) => {
    if (!row) {
      const hashedPass = bcrypt.hashSync('super123', 10);
      db.run(
        `INSERT INTO users (name, email, phone, password, role) VALUES (?, ?, ?, ?, ?)`,
        ['Super Admin Owner', superAdminEmail, '+92 300 0000000', hashedPass, 'superadmin'],
        () => console.log('🛡️ Default Super Admin seeded: superadmin@blushandbrush.com / super123')
      );
    }
  });

  // B. Admin Account
  const adminEmail = 'admin@blushandbrush.com';
  db.get(`SELECT id FROM users WHERE email = ?`, [adminEmail], (err, row) => {
    if (!row) {
      const hashedPass = bcrypt.hashSync('admin123', 10);
      db.run(
        `INSERT INTO users (name, email, phone, password, role) VALUES (?, ?, ?, ?, ?)`,
        ['Salon Manager Admin', adminEmail, '+92 300 1234567', hashedPass, 'admin'],
        () => console.log('👑 Default Admin seeded: admin@blushandbrush.com / admin123')
      );
    }
  });

  // C. Sample Client Account & Appointments
  const clientEmail = 'sarah@gmail.com';
  db.get(`SELECT id FROM users WHERE email = ?`, [clientEmail], (err, row) => {
    if (!row) {
      const hashedPass = bcrypt.hashSync('user123', 10);
      db.run(
        `INSERT INTO users (name, email, phone, password, role) VALUES (?, ?, ?, ?, ?)`,
        ['Sarah Johnson', clientEmail, '+92 300 9876543', hashedPass, 'user'],
        function () {
          const userId = this.lastID;
          console.log('💄 Sample Client seeded: sarah@gmail.com / user123');

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
              admin_message: 'Please arrive 10 minutes prior for consultation.'
            }
          ];

          sampleAppointments.forEach(app => {
            db.run(
              `INSERT INTO appointments (user_id, client_name, client_phone, service, appointment_date, appointment_time, status, remarks, admin_message) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [userId, app.client_name, app.client_phone, app.service, app.appointment_date, app.appointment_time, app.status, app.remarks, app.admin_message]
            );
          });
        }
      );
    }
  });

  // D. Seed Default Services
  db.get(`SELECT COUNT(*) as count FROM services`, [], (err, row) => {
    if (row && row.count === 0) {
      const defaultServices = [
        { name: 'Haircut & Styling', category: 'Hair', price: 3500, duration: '45 mins', description: 'Precision styling, layer cuts & blow dry' },
        { name: 'Hair Coloring', category: 'Hair', price: 8500, duration: '120 mins', description: 'Full balayage, highlights & gloss treatment' },
        { name: 'Facial Treatment', category: 'Skin', price: 5000, duration: '60 mins', description: 'Deep pore cleansing, hydra-facial & glow mask' },
        { name: 'Manicure & Pedicure', category: 'Nails', price: 4000, duration: '60 mins', description: 'Nail shaping, cuticle care & spa polish' },
        { name: 'Spa & Massage', category: 'Body', price: 7500, duration: '90 mins', description: 'Aromatherapy body massage & hot stone treatment' },
        { name: 'HD Makeup Session', category: 'Makeup', price: 12000, duration: '90 mins', description: 'HD bridal & party glam makeover' }
      ];
      defaultServices.forEach(s => {
        db.run(
          `INSERT INTO services (name, category, price, duration, description) VALUES (?, ?, ?, ?, ?)`,
          [s.name, s.category, s.price, s.duration, s.description]
        );
      });
      console.log('✨ Default Salon Services seeded');
    }
  });

  // E. Seed Default Announcements
  db.get(`SELECT COUNT(*) as count FROM announcements`, [], (err, row) => {
    if (row && row.count === 0) {
      db.run(
        `INSERT INTO announcements (title, content, date) VALUES (?, ?, ?)`,
        ['🎉 Grand Festive Season Discount!', 'Get 25% off on all Spa & Facial Packages this weekend. Book your slot now!', '2026-09-02']
      );
      console.log('📢 Default Announcement seeded');
    }
  });

  // F. Seed Default Products
  db.get(`SELECT COUNT(*) as count FROM products`, [], (err, row) => {
    if (row && row.count === 0) {
      const defaultProducts = [
        { name: 'Organic Glow Face Serum', category: 'Skin Care', price: 2800, stock: 35, description: 'Vitamin C infused hydrating skin radiance serum' },
        { name: 'Keratin Hair Repair Mask', category: 'Hair Care', price: 3200, stock: 20, description: 'Deep conditioning treatment for damaged hair' },
        { name: 'Rosewater Hydra Mist', category: 'Skin Care', price: 1500, stock: 50, description: 'Pure organic rosewater facial toner' }
      ];
      defaultProducts.forEach(p => {
        db.run(
          `INSERT INTO products (name, category, price, stock, description) VALUES (?, ?, ?, ?, ?)`,
          [p.name, p.category, p.price, p.stock, p.description]
        );
      });
      console.log('🛍️ Default Products seeded');
    }
  });

});

module.exports = db;
