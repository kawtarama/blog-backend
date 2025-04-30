const Post = require('../models/post.model');
const fs = require('fs');
const path = require('path');
const { uploadsDir } = require('../database/database');

// Helper function to save Base64 image
const saveBase64Image = (base64String) => {
  // Extract the file type and actual base64 data
  const matches = base64String.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
  
  if (!matches || matches.length !== 3) {
    throw new Error('Invalid base64 string format');
  }
  
  // Extract file extension and image data
  const imageType = matches[1];
  const base64Data = matches[2];
  const allowedTypes = ['png', 'jpg', 'jpeg', 'gif'];
  
  if (!allowedTypes.includes(imageType)) {
    throw new Error('Invalid image type. Only PNG, JPG, JPEG, and GIF are allowed.');
  }
  
  // Generate a unique filename
  const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}.${imageType}`;
  const filePath = path.join(uploadsDir, fileName);
  
  // Check file size (base64 size * 0.75 is approximate byte size)
  const fileSizeInBytes = Math.ceil((base64Data.length * 3) / 4);
  if (fileSizeInBytes > 5 * 1024 * 1024) { // 5MB limit
    throw new Error('File size exceeds 5MB limit');
  }
  
  // Write the file
  fs.writeFileSync(filePath, base64Data, { encoding: 'base64' });
  
  // Return the URL path to be stored in the database
  return `/uploads/${fileName}`;
};

// Create and Save a new Post
exports.create = (req, res) => {
  // Validate request
  if (!req.body.title || !req.body.content || !req.body.author) {
    return res.status(400).send({
      message: "Post content cannot be empty!"
    });
  }

  try {
    // Create a Post object
    const post = {
      title: req.body.title,
      content: req.body.content,
      author: req.body.author,
      tags: req.body.tags || [],
      imageUrl: req.body.image ? saveBase64Image(req.body.image) : null
    };

    // Save Post in the database
    Post.create(post, (err, data) => {
      if (err) {
        // If there was an error and an image was saved, remove it
        if (post.imageUrl) {
          try {
            const imagePath = path.join(__dirname, '..', post.imageUrl);
            if (fs.existsSync(imagePath)) {
              fs.unlinkSync(imagePath);
            }
          } catch (e) {
            console.error('Error removing image after database error:', e);
          }
        }
        res.status(500).send({
          message: err.message || "Some error occurred while creating the Post."
        });
      } else {
        res.send(data);
      }
    });
  } catch (error) {
    res.status(400).send({
      message: error.message || "Error processing the image"
    });
  }
};

// Retrieve all Posts from the database
exports.findAll = (req, res) => {
  Post.findAll((err, data) => {
    if (err) {
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving posts."
      });
    } else {
      res.send(data);
    }
  });
};

// Find a single Post with a postId
exports.findOne = (req, res) => {
  Post.findById(req.params.postId, (err, data) => {
    if (err) {
      res.status(500).send({
        message: "Error retrieving Post with id " + req.params.postId
      });
    } else if (!data) {
      res.status(404).send({
        message: "Post not found with id " + req.params.postId
      });
    } else {
      res.send(data);
    }
  });
};

// Update a Post with the specified postId
exports.update = (req, res) => {
  // Validate Request
  if (!req.body.title && !req.body.content && !req.body.author && !req.body.image) {
    return res.status(400).send({
      message: "Post content cannot be empty"
    });
  }

  try {
    // Create a Post object
    const post = {
      title: req.body.title,
      content: req.body.content,
      author: req.body.author,
      tags: req.body.tags,
      imageUrl: req.body.image ? saveBase64Image(req.body.image) : undefined
    };

    // Update the post
    Post.update(req.params.postId, post, (err, data) => {
      if (err) {
        // If there was an error and a new image was saved, remove it
        if (post.imageUrl) {
          try {
            const imagePath = path.join(__dirname, '..', post.imageUrl);
            if (fs.existsSync(imagePath)) {
              fs.unlinkSync(imagePath);
            }
          } catch (e) {
            console.error('Error removing image after update error:', e);
          }
        }
        res.status(500).send({
          message: "Error updating Post with id " + req.params.postId
        });
      } else if (!data) {
        // If no post was found and a new image was saved, remove it
        if (post.imageUrl) {
          try {
            const imagePath = path.join(__dirname, '..', post.imageUrl);
            if (fs.existsSync(imagePath)) {
              fs.unlinkSync(imagePath);
            }
          } catch (e) {
            console.error('Error removing image after post not found:', e);
          }
        }
        res.status(404).send({
          message: "Post not found with id " + req.params.postId
        });
      } else {
        res.send(data);
      }
    });
  } catch (error) {
    res.status(400).send({
      message: error.message || "Error processing the image"
    });
  }
};

// Delete a Post with the specified postId
exports.delete = (req, res) => {
  Post.delete(req.params.postId, (err, data) => {
    if (err) {
      res.status(500).send({
        message: "Could not delete Post with id " + req.params.postId
      });
    } else if (!data.deleted) {
      res.status(404).send({
        message: "Post not found with id " + req.params.postId
      });
    } else {
      res.send({ message: "Post deleted successfully!" });
    }
  });
};