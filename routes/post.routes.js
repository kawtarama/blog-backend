module.exports = app => {
    const posts = require('../controllers/post.controller');
  
    // Create a new Post with Base64 image
    app.post('/api/posts', posts.create);
  
    // Retrieve all Posts
    app.get('/api/posts', posts.findAll);
  
    // Retrieve a single Post with postId
    app.get('/api/posts/:postId', posts.findOne);
  
    // Update a Post with postId and Base64 image
    app.put('/api/posts/:postId', posts.update);
  
    // Delete a Post with postId
    app.delete('/api/posts/:postId', posts.delete);
  };