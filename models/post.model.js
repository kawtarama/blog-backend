const db = require('../database/database').db;
const fs = require('fs');
const path = require('path');
const { uploadsDir } = require('../database/database');

// Create and Save a new Post
exports.create = (post, callback) => {
  const { title, content, author, tags, imageUrl } = post;
  const tagsString = tags ? JSON.stringify(tags) : '[]';
  
  const sql = `
    INSERT INTO posts (title, content, author, tags, image_url)
    VALUES (?, ?, ?, ?, ?)
  `;
  
  db.run(sql, [title, content, author, tagsString, imageUrl], function(err) {
    if (err) {
      callback(err, null);
      return;
    }
    
    // Get the inserted post
    exports.findById(this.lastID, callback);
  });
};

// Retrieve all Posts from the database
exports.findAll = (callback) => {
  const sql = 'SELECT * FROM posts ORDER BY created_at DESC';
  
  db.all(sql, [], (err, rows) => {
    if (err) {
      callback(err, null);
      return;
    }
    
    // Parse tags from JSON string
    const posts = rows.map(row => {
      try {
        row.tags = JSON.parse(row.tags || '[]');
      } catch (e) {
        row.tags = [];
      }
      return row;
    });
    
    callback(null, posts);
  });
};

// Find a single Post with a postId
exports.findById = (id, callback) => {
  const sql = 'SELECT * FROM posts WHERE id = ?';
  
  db.get(sql, [id], (err, row) => {
    if (err) {
      callback(err, null);
      return;
    }
    
    if (!row) {
      callback(null, null);
      return;
    }
    
    // Parse tags from JSON string
    try {
      row.tags = JSON.parse(row.tags || '[]');
    } catch (e) {
      row.tags = [];
    }
    
    callback(null, row);
  });
};

// Update a Post with the specified postId
exports.update = (id, post, callback) => {
  // First, get the existing post to check if we need to delete an old image
  exports.findById(id, (err, existingPost) => {
    if (err) {
      callback(err, null);
      return;
    }
    
    if (!existingPost) {
      callback(null, null);
      return;
    }
    
    const { title, content, author, tags, imageUrl } = post;
    const tagsString = tags ? JSON.stringify(tags) : '[]';
    
    // If there's a new image and an old one exists, delete the old one
    if (imageUrl && imageUrl !== existingPost.image_url && existingPost.image_url) {
      try {
        const oldImagePath = path.join(uploadsDir, path.basename(existingPost.image_url));
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      } catch (error) {
        console.error('Error deleting old image:', error);
        // Continue with the update even if image deletion fails
      }
    }
    
    const sql = `
      UPDATE posts
      SET title = ?, content = ?, author = ?, tags = ?, 
          image_url = COALESCE(?, image_url), updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    db.run(sql, [title, content, author, tagsString, imageUrl || null, id], function(err) {
      if (err) {
        callback(err, null);
        return;
      }
      
      if (this.changes === 0) {
        // No post with this ID found
        callback(null, null);
        return;
      }
      
      // Get the updated post
      exports.findById(id, callback);
    });
  });
};

// Delete a Post with the specified postId
exports.delete = (id, callback) => {
  // First, get the post to find the image URL
  exports.findById(id, (err, post) => {
    if (err) {
      callback(err, null);
      return;
    }
    
    if (!post) {
      callback(null, { deleted: false });
      return;
    }
    
    // Delete the post from the database
    const sql = 'DELETE FROM posts WHERE id = ?';
    
    db.run(sql, [id], function(err) {
      if (err) {
        callback(err, null);
        return;
      }
      
      // If the post had an image, delete it from the filesystem
      if (post.image_url) {
        try {
          const imagePath = path.join(uploadsDir, path.basename(post.image_url));
          if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
          }
        } catch (error) {
          console.error('Error deleting image file:', error);
          // Still report successful deletion even if image deletion fails
        }
      }
      
      callback(null, { deleted: this.changes > 0 });
    });
  });
};