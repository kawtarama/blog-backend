const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Create a database connection
const dbPath = path.resolve(__dirname, '../blog.db');
const db = new sqlite3.Database(dbPath);

// Create uploads directory if it doesn't exist
const uploadsDir = path.resolve(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Initialize the database with tables
exports.initialize = () => {
  db.serialize(() => {
    // Enable foreign keys
    db.run('PRAGMA foreign_keys = ON');
    
    // Create posts table with image field
    db.run(`
      CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        author TEXT NOT NULL,
        tags TEXT,
        image_url TEXT,
        published_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Database initialized successfully');
  });
};

// Export database for use in other files
exports.db = db;
// Export uploads directory path for use in other files
exports.uploadsDir = uploadsDir;