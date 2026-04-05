import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("wedding.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS user_state (
    id TEXT PRIMARY KEY,
    state TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS admin_users (
    email TEXT PRIMARY KEY,
    password TEXT,
    name TEXT,
    contact TEXT,
    image TEXT,
    role TEXT DEFAULT 'Manager'
  );

  CREATE TABLE IF NOT EXISTS vendors (
    id TEXT PRIMARY KEY,
    name TEXT,
    services TEXT,
    status TEXT DEFAULT 'pending',
    details TEXT,
    rating REAL DEFAULT 0,
    category TEXT
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY,
    service TEXT,
    customer_name TEXT,
    customer_id TEXT,
    date TEXT,
    payment_status TEXT,
    vendor_id TEXT,
    amount REAL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT,
    user_type TEXT,
    status TEXT DEFAULT 'active',
    last_activity DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    name TEXT,
    type TEXT,
    date TEXT,
    location TEXT,
    status TEXT DEFAULT 'pending',
    details TEXT
  );

  CREATE TABLE IF NOT EXISTS ai_config (
    id TEXT PRIMARY KEY,
    expert_chat_prompt TEXT,
    recommendations_enabled INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    title TEXT,
    message TEXT,
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    read INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS feedback (
    id TEXT PRIMARY KEY,
    customer_name TEXT,
    message TEXT,
    response TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Seed admin if not exists
const adminCheck = db.prepare("SELECT * FROM admin_users WHERE email = ?").get("admin@wedding.com");
if (!adminCheck) {
  db.prepare("INSERT INTO admin_users (email, password, name, contact, image, role) VALUES (?, ?, ?, ?, ?, ?)").run(
    "admin@wedding.com", 
    "admin123", 
    "Priyanshi Mehta", 
    "+91 9876543210", 
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Priyanshi", 
    "Super Admin"
  );
}

// Seed some users if empty
const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
if (userCount.count === 0) {
  db.prepare("INSERT INTO users (id, name, email, user_type, status) VALUES (?, ?, ?, ?, ?)").run("u1", "Priya Sharma", "priya@example.com", "bride", "active");
  db.prepare("INSERT INTO users (id, name, email, user_type, status) VALUES (?, ?, ?, ?, ?)").run("u2", "Rohan Mehta", "rohan@example.com", "groom", "active");
}

// Seed some events if empty
const eventCount = db.prepare("SELECT COUNT(*) as count FROM events").get() as { count: number };
if (eventCount.count === 0) {
  db.prepare("INSERT INTO events (id, name, type, date, location, status) VALUES (?, ?, ?, ?, ?, ?)").run("e1", "Mehta Wedding", "wedding", "2026-12-12", "Udaipur", "approved");
  db.prepare("INSERT INTO events (id, name, type, date, location, status) VALUES (?, ?, ?, ?, ?, ?)").run("e2", "Corporate Gala", "corporate", "2026-11-20", "Mumbai", "pending");
}

// Seed AI config if empty
const aiConfigCheck = db.prepare("SELECT * FROM ai_config WHERE id = ?").get("default");
if (!aiConfigCheck) {
  db.prepare("INSERT INTO ai_config (id, expert_chat_prompt, recommendations_enabled) VALUES (?, ?, ?)").run(
    "default", 
    "You are Aira, a professional AI Wedding Concierge for the Vivaha app. Your goal is to help couples plan their dream wedding.", 
    1
  );
}

// Seed some vendors if empty
const vendorCount = db.prepare("SELECT COUNT(*) as count FROM vendors").get() as { count: number };
if (vendorCount.count === 0) {
  db.prepare("INSERT INTO vendors (id, name, services, status, details, rating, category) VALUES (?, ?, ?, ?, ?, ?, ?)").run("v1", "The Wedding Salad", "Photography", "pending", "Premium photography service", 4.8, "photographer");
  db.prepare("INSERT INTO vendors (id, name, services, status, details, rating, category) VALUES (?, ?, ?, ?, ?, ?, ?)").run("v2", "Royal Caterers", "Catering", "approved", "Traditional Rajasthani food", 4.5, "catering");
}

// Seed some bookings if empty
const bookingCount = db.prepare("SELECT COUNT(*) as count FROM bookings").get() as { count: number };
if (bookingCount.count === 0) {
  db.prepare("INSERT INTO bookings (id, service, customer_name, customer_id, date, payment_status, vendor_id, amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run("b1", "Photography", "Priya Sharma", "u1", "2026-12-12", "Paid", "v1", 150000);
  db.prepare("INSERT INTO bookings (id, service, customer_name, customer_id, date, payment_status, vendor_id, amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run("b2", "Catering", "Rohan Mehta", "u2", "2026-12-12", "Pending", "v2", 500000);
}

// Seed some feedback if empty
const feedbackCount = db.prepare("SELECT COUNT(*) as count FROM feedback").get() as { count: number };
if (feedbackCount.count === 0) {
  db.prepare("INSERT INTO feedback (id, customer_name, message) VALUES (?, ?, ?)").run("f1", "Priya Sharma", "The app is great! Can you add more venues in Udaipur?");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Admin Auth
  app.post("/api/admin/login", (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare("SELECT * FROM admin_users WHERE email = ? AND password = ?").get(email, password);
    if (user) {
      res.json({ success: true, user });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  app.post("/api/admin/profile", (req, res) => {
    const { email, name, contact, image } = req.body;
    db.prepare("UPDATE admin_users SET name = ?, contact = ?, image = ? WHERE email = ?").run(name, contact, image, email);
    res.json({ success: true });
  });

  // Admin Users
  app.get("/api/admin/users", (req, res) => {
    const users = db.prepare("SELECT * FROM users").all();
    res.json(users);
  });

  app.post("/api/admin/users/:id/status", (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    db.prepare("UPDATE users SET status = ? WHERE id = ?").run(status, id);
    res.json({ success: true });
  });

  // Admin Vendors
  app.get("/api/admin/vendors", (req, res) => {
    const vendors = db.prepare("SELECT * FROM vendors").all();
    res.json(vendors);
  });

  app.post("/api/admin/vendors/:id/status", (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    db.prepare("UPDATE vendors SET status = ? WHERE id = ?").run(status, id);
    res.json({ success: true });
  });

  app.post("/api/admin/vendors", (req, res) => {
    const { name, category, services, details } = req.body;
    const id = "v" + Math.random().toString(36).substring(2, 9);
    db.prepare("INSERT INTO vendors (id, name, category, services, details, status) VALUES (?, ?, ?, ?, ?, ?)").run(id, name, category, services, details, 'approved');
    res.json({ success: true, id });
  });

  // Admin Events
  app.get("/api/admin/events", (req, res) => {
    const events = db.prepare("SELECT * FROM events").all();
    res.json(events);
  });

  app.post("/api/admin/events/:id/status", (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    db.prepare("UPDATE events SET status = ? WHERE id = ?").run(status, id);
    res.json({ success: true });
  });

  // Admin Bookings
  app.get("/api/admin/bookings", (req, res) => {
    const bookings = db.prepare("SELECT * FROM bookings").all();
    res.json(bookings);
  });

  // Admin AI Config
  app.get("/api/admin/ai-config", (req, res) => {
    const config = db.prepare("SELECT * FROM ai_config WHERE id = ?").get("default");
    res.json(config);
  });

  app.post("/api/admin/ai-config", (req, res) => {
    const { expert_chat_prompt, recommendations_enabled } = req.body;
    db.prepare("UPDATE ai_config SET expert_chat_prompt = ?, recommendations_enabled = ? WHERE id = ?").run(expert_chat_prompt, recommendations_enabled ? 1 : 0, "default");
    res.json({ success: true });
  });

  // Admin Notifications
  app.get("/api/admin/notifications", (req, res) => {
    const notifications = db.prepare("SELECT * FROM notifications ORDER BY date DESC").all();
    res.json(notifications);
  });

  app.post("/api/admin/notifications", (req, res) => {
    const { title, message } = req.body;
    const id = "n" + Math.random().toString(36).substring(2, 9);
    db.prepare("INSERT INTO notifications (id, title, message) VALUES (?, ?, ?)").run(id, title, message);
    res.json({ success: true, id });
  });

  // Admin Reports
  app.get("/api/admin/reports", (req, res) => {
    const totalBookings = db.prepare("SELECT COUNT(*) as count FROM bookings").get() as { count: number };
    const pendingApprovals = db.prepare("SELECT COUNT(*) as count FROM vendors WHERE status = 'pending'").get() as { count: number };
    const approvedVendors = db.prepare("SELECT COUNT(*) as count FROM vendors WHERE status = 'approved'").get() as { count: number };
    const totalUsers = db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
    const totalEvents = db.prepare("SELECT COUNT(*) as count FROM events").get() as { count: number };
    const totalRevenue = db.prepare("SELECT SUM(amount) as total FROM bookings WHERE payment_status = 'Paid'").get() as { total: number };
    
    // Mock monthly trends
    const monthlyTrends = [
      { month: 'Jan', bookings: 12, revenue: 150000 },
      { month: 'Feb', bookings: 18, revenue: 250000 },
      { month: 'Mar', bookings: 15, revenue: 200000 },
      { month: 'Apr', bookings: 22, revenue: 350000 },
      { month: 'May', bookings: 30, revenue: 500000 },
      { month: 'Jun', bookings: 25, revenue: 400000 },
    ];

    res.json({
      totalBookings: totalBookings.count,
      pendingApprovals: pendingApprovals.count,
      approvedVendors: approvedVendors.count,
      totalUsers: totalUsers.count,
      totalEvents: totalEvents.count,
      totalRevenue: totalRevenue.total || 0,
      monthlyTrends
    });
  });

  // API Routes
  app.get("/api/state/:id", (req, res) => {
    try {
      const { id } = req.params;
      const row = db.prepare("SELECT state FROM user_state WHERE id = ?").get(id) as { state: string } | undefined;
      if (row) {
        res.json(JSON.parse(row.state));
      } else {
        res.status(404).json({ error: "Not found" });
      }
    } catch (error) {
      console.error("Error loading state:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/state/:id", (req, res) => {
    try {
      const { id } = req.params;
      const state = JSON.stringify(req.body);
      db.prepare("INSERT OR REPLACE INTO user_state (id, state, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)").run(id, state);
      res.json({ success: true });
    } catch (error) {
      console.error("Error saving state:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
