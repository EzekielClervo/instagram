const express = require('express');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const MemoryStore = require('memorystore')(session);
const crypto = require('crypto');
const { promisify } = require('util');
const path = require('path');
const http = require('http');
const automationRoutes = require('./automation-routes');

// Utilities for password hashing
const scryptAsync = promisify(crypto.scrypt);

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString('hex')}.${salt}`;
}

async function comparePasswords(supplied, stored) {
  const [hashed, salt] = stored.split('.');
  const hashedBuf = Buffer.from(hashed, 'hex');
  const suppliedBuf = await scryptAsync(supplied, salt, 64);
  return crypto.timingSafeEqual(hashedBuf, suppliedBuf);
}

// In-memory storage implementation
class MemStorage {
  constructor() {
    this.users = new Map();
    this.instagramAccounts = new Map();
    this.cookies = new Map();
    this.activityLogs = new Map();
    this.userId = 1;
    this.accountId = 1;
    this.cookieId = 1;
    this.logId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
    
    // Initialize admin user
    this.createAdminUser();
  }

  async createAdminUser() {
    const adminExists = await this.getUserByUsername('david');
    if (!adminExists) {
      this.createUser({
        username: 'david',
        email: 'admin@igboost.com',
        password: await hashPassword('david@@@'),
        isAdmin: true
      });
    }
  }

  // User methods
  async getUser(id) {
    return this.users.get(id);
  }

  async getUserByUsername(username) {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }

  async createUser(userData) {
    const id = this.userId++;
    const now = new Date().toISOString();
    const user = { 
      ...userData, 
      id, 
      createdAt: now, 
      updatedAt: now 
    };
    this.users.set(id, user);
    return user;
  }
  
  async getAllUsers() {
    return Array.from(this.users.values());
  }
  
  async deleteUser(id) {
    // Delete user's accounts, cookies, and logs first
    const accounts = await this.getInstagramAccounts(id);
    for (const account of accounts) {
      await this.deleteInstagramAccount(account.id);
    }
    
    // Delete logs
    const logs = await this.getActivityLogsByUserId(id);
    for (const log of logs) {
      this.activityLogs.delete(log.id);
    }
    
    // Delete user
    this.users.delete(id);
  }

  // Instagram account methods
  async getInstagramAccount(id) {
    return this.instagramAccounts.get(id);
  }

  async getInstagramAccounts(userId) {
    return Array.from(this.instagramAccounts.values()).filter(
      (account) => account.userId === userId
    );
  }

  async createInstagramAccount(account) {
    const appppd = this.accountId++;
    const now = new Date().toISOString();
    const newAccount = { ...account, id, createdAt: now, updatedAt: now };
    this.instagramAccounts.set(id, newAccount);
    return newAccount;
  }

  async deleteInstagramAccount(id) {
    // Delete associated cookies first
    const accountCookies = Array.from(this.cookies.values()).filter(
      (cookie) => cookie.accountId === id
    );
    
    for (const cookie of accountCookies) {
      await this.deleteCookie(cookie.id);
    }
    
    // Delete account
    this.instagramAccounts.delete(id);
  }

  // Cookie methods
  async getCookie(id) {
    return this.cookies.get(id);
  }

  async getCookiesByUserId(userId) {
    // Get all accounts for this user
    const accounts = await this.getInstagramAccounts(userId);
    const accountIds = accounts.map(account => account.id);
    
    // Return cookies for these accounts
    return Array.from(this.cookies.values()).filter(
      (cookie) => accountIds.includes(cookie.accountId)
    );
  }

  async createCookie(cookie) {
    const id = this.cookieId++;
    const now = new Date().toISOString();
    const newCookie = { ...cookie, id, createdAt: now, updatedAt: now };
    this.cookies.set(id, newCookie);
    return newCookie;
  }

  async deleteCookie(id) {
    this.cookies.delete(id);
  }

  // Activity log methods
  async getActivityLog(id) {
    return this.activityLogs.get(id);
  }

  async getActivityLogsByUserId(userId, limit) {
    let logs = Array.from(this.activityLogs.values())
      .filter((log) => log.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    if (limit) {
      logs = logs.slice(0, limit);
    }
    
    return logs;
  }

  async createActivityLog(log) {
    const id = this.logId++;
    const now = new Date().toISOString();
    const newLog = { ...log, id, createdAt: now, updatedAt: now };
    this.activityLogs.set(id, newLog);
    return newLog;
  }
  
  async updateActivityLog(id, updates) {
    const log = this.activityLogs.get(id);
    if (!log) {
      throw new Error(`Activity log with ID ${id} not found`);
    }
    
    const now = new Date().toISOString();
    const updatedLog = { ...log, ...updates, updatedAt: now };
    this.activityLogs.set(id, updatedLog);
    return updatedLog;
  }
}

// Create storage instance
const storage = new MemStorage();

// Set up Express app
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Make storage accessible in routes
app.locals.storage = storage;

// Session and authentication setup
const sessionSettings = {
  secret: process.env.SESSION_SECRET || 'igboost-secret-key',
  resave: false,
  saveUninitialized: false,
  store: storage.sessionStore,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
  }
};

app.set('trust proxy', 1);
app.use(session(sessionSettings));
app.use(passport.initialize());
app.use(passport.session());

// Passport local strategy
passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await storage.getUserByUsername(username);
      if (!user || !(await comparePasswords(password, user.password))) {
        return done(null, false);
      } else {
        return done(null, user);
      }
    } catch (err) {
      return done(err);
    }
  })
);

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await storage.getUser(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
};

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (req.isAuthenticated() && req.user.isAdmin) {
    return next();
  }
  return res.status(403).json({ message: "Forbidden" });
};

// Authentication routes
app.post("/api/register", async (req, res, next) => {
  try {
    const existingUser = await storage.getUserByUsername(req.body.username);
    if (existingUser) {
      return res.status(400).send("Username already exists");
    }

    const hashedPassword = await hashPassword(req.body.password);
    const user = await storage.createUser({
      ...req.body,
      password: hashedPassword,
      isAdmin: false,
    });

    req.login(user, (err) => {
      if (err) return next(err);
      return res.status(201).json(user);
    });
  } catch (err) {
    next(err);
  }
});

app.post("/api/login", passport.authenticate("local"), (req, res) => {
  res.status(200).json(req.user);
});

app.post("/api/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.sendStatus(200);
  });
});

app.get("/api/user", (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  res.json(req.user);
});

// Instagram Account Management
app.get("/api/instagram/accounts", isAuthenticated, async (req, res) => {
  try {
    const accounts = await storage.getInstagramAccounts(req.user.id);
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ message: "Error fetching accounts", error: error.message });
  }
});

app.post("/api/instagram/accounts", isAuthenticated, async (req, res) => {
  try {
    const { email, password } = req.body;
    const account = await storage.createInstagramAccount({
      userId: req.user.id,
      email,
      password,
      username: email.split('@')[0],
      active: true,
    });
    res.status(201).json(account);
  } catch (error) {
    res.status(500).json({ message: "Error creating account", error: error.message });
  }
});

app.delete("/api/instagram/accounts/:id", isAuthenticated, async (req, res) => {
  try {
    const accountId = parseInt(req.params.id);
    const account = await storage.getInstagramAccount(accountId);
    
    if (!account || account.userId !== req.user.id) {
      return res.status(404).json({ message: "Account not found" });
    }
    
    await storage.deleteInstagramAccount(accountId);
    res.sendStatus(204);
  } catch (error) {
    res.status(500).json({ message: "Error deleting account", error: error.message });
  }
});

// Cookie Management
app.get("/api/instagram/cookies", isAuthenticated, async (req, res) => {
  try {
    const cookies = await storage.getCookiesByUserId(req.user.id);
    res.json(cookies);
  } catch (error) {
    res.status(500).json({ message: "Error fetching cookies", error: error.message });
  }
});

app.post("/api/instagram/cookies", isAuthenticated, async (req, res) => {
  try {
    const { accountId, cookieValue } = req.body;
    
    // Check if the account belongs to the current user
    const account = await storage.getInstagramAccount(parseInt(accountId));
    if (!account || account.userId !== req.user.id) {
      return res.status(404).json({ message: "Account not found" });
    }
    
    const cookie = await storage.createCookie({
      accountId: parseInt(accountId),
      cookieValue,
      active: true,
    });
    
    res.status(201).json(cookie);
  } catch (error) {
    res.status(500).json({ message: "Error creating cookie", error: error.message });
  }
});

app.delete("/api/instagram/cookies/:id", isAuthenticated, async (req, res) => {
  try {
    const cookieId = parseInt(req.params.id);
    const cookie = await storage.getCookie(cookieId);
    
    if (!cookie) {
      return res.status(404).json({ message: "Cookie not found" });
    }
    
    // Check if the cookie's account belongs to the user
    const account = await storage.getInstagramAccount(cookie.accountId);
    if (!account || account.userId !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    await storage.deleteCookie(cookieId);
    res.sendStatus(204);
  } catch (error) {
    res.status(500).json({ message: "Error deleting cookie", error: error.message });
  }
});

// Activity Logs
app.get("/api/activity-logs", isAuthenticated, async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : undefined;
    const logs = await storage.getActivityLogsByUserId(req.user.id, limit);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: "Error fetching activity logs", error: error.message });
  }
});

// Automation Routes
app.use('/api/automation', automationRoutes);

// Admin Routes
app.get("/api/admin/users", isAdmin, async (req, res) => {
  try {
    const users = await storage.getAllUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Error fetching users", error: error.message });
  }
});

app.delete("/api/admin/users/:id", isAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    if (user.isAdmin) {
      return res.status(403).json({ message: "Cannot delete admin users" });
    }
    
    await storage.deleteUser(userId);
    res.sendStatus(204);
  } catch (error) {
    res.status(500).json({ message: "Error deleting user", error: error.message });
  }
});

// Serve static files always (not just in production)
app.use(express.static(path.join(__dirname, 'client/dist')));

// Handle all other routes by serving the index.html file
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/dist/index.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ 
    message: "Internal server error", 
    error: process.env.NODE_ENV === 'production' ? null : err.message
  });
});

// Start server
const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`Serrunningning on port ${PORT}`);
});

module.exports = app;
