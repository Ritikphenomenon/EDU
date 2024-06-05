const express = require('express');
const { Course, Admin } = require("../db");
const jwt = require('jsonwebtoken');
const { SECRET } = require("../middleware/index")
const { authenticateJwt } = require("../middleware/index");
const bcrypt = require('bcrypt');



const router = express.Router();

router.post('/signup', async (req, res) => {
    try {
      const { username, password, name, profilePhoto, bio } = req.body;
      const admin = await Admin.findOne({ username });
  
      if (admin) {
        return res.json({ message: 'Admin already exists, please Login' });
      }

        // Hash the password before saving it
        const hashedPassword = await bcrypt.hash(password, 10);
  
      const newAdmin = new Admin({ username,  password: hashedPassword, name, profilePhoto, bio });
      await newAdmin.save();
      
      res.json({ message: 'Admin created successfully, please login' });
    } catch (error) {
      console.error('Error during admin signup:', error.message);
      res.status(500).json({ message: 'Server error during admin signup' });
    }
  });

  router.post('/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      const admin = await Admin.findOne({ username });
  
      if (!admin || !await bcrypt.compare(password, admin.password)) {
        return res.status(401).json({ message: 'Invalid username or password' });
      }
      
      // Generate token for the logged-in admin
      const token = jwt.sign({ username, role: 'admin' }, SECRET, { expiresIn: '375d' });
      
      res.json({ message: 'Login successful', token });
    } catch (error) {
      console.error('Error during admin login:', error.message);
      res.status(500).json({ message: 'Server error during admin login' });
    }
  });
  


// GET request to fetch profile details
router.get('/profile', authenticateJwt, async (req, res) => {
  try {
    // Extract the username from the authenticated token
    const { username } = req.user;
  
    // Find the admin by username
    const admin = await Admin.findOne({ username });
  
    // If admin is not found, return a 404 error
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }
  
    // Return the profile details in the response
    res.json({ username:username,name: admin.name, profilePhoto: admin.profilePhoto, bio: admin.bio });
  } catch (error) {
    console.error('Error fetching admin profile:', error.message);
    res.status(500).json({ message: 'Server error while fetching admin profile' });
  }
});


  // POST request to add a new course
router.post('/courses', authenticateJwt, async (req, res) => {
    try {
      // Extract course details from the request body
      const { title, rating, price, imageLink, published,courselink } = req.body;

      const Id=req.user.username;

      // Create a new course instance
      const newCourse = new Course({
        title,
        rating,
        price,
        imageLink,
        published,
        courselink,
        Id
      });
  
      // Save the new course to the database
      await newCourse.save();
  
      // Respond with success message
      res.status(201).json({ message: 'Course created successfully', course: newCourse });
    } catch (error) {
      console.error('Error creating course:', error.message);
      res.status(500).json({ message: 'Server error while creating course' });
    }
  });

  router.get('/courses', authenticateJwt, async (req, res) => {
    try {
      // Fetch all courses from the database
      const courses = await Course.find();
  
      // Respond with the list of courses
      res.json(courses);
    } catch (error) {
      console.error('Error fetching courses:', error.message);
      res.status(500).json({ message: 'Server error while fetching courses' });
    }
  });

  router.get('/mycourses', authenticateJwt, async (req, res) => {
    try {
      // Extract the username from the authenticated token
      const { username } = req.user;
  
      
  
  
      // Find all courses created by the admin
      const courses = await Course.find({ Id:username });
  
      // Respond with the list of courses
      res.json(courses);
    } catch (error) {
      console.error('Error fetching courses:', error.message);
      res.status(500).json({ message: 'Server error while fetching courses' });
    }
  });

  
  router.put('/courses/:id', authenticateJwt, async (req, res) => {
    try {
      const courseId = req.params.id;
      const { title, rating, price, imageLink, published ,courselink} = req.body;
  
      // Find the course by ID
      const course = await Course.findById(courseId);
  
      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }
  
      // Update the course fields
      course.title = title;
      course.rating = rating;
      course.price = price;
      course.imageLink = imageLink;
      course.published = published;
      course.courselink=courselink;
  
      // Save the updated course to the database
      await course.save();
  
      // Respond with the updated course
      res.json({ message: 'Course updated successfully', course });
    } catch (error) {
      console.error('Error updating course:', error.message);
      res.status(500).json({ message: 'Server error while updating course' });
    }
  });

  router.delete('/courses/:id', authenticateJwt, async (req, res) => {
    try {
        const courseId = req.params.id;

        // Delete the course from the database
        const result = await Course.deleteOne({ _id: courseId });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Respond with a success message
        res.json({ message: 'Course deleted successfully' });
    } catch (error) {
        console.error('Error deleting course:', error.message);
        res.status(500).json({ message: 'Server error while deleting course' });
    }
});

router.post('/changepassword', authenticateJwt, async (req, res) => {
  const { username, currentPassword, newPassword } = req.body;

  try {
    // Find the user by ID
    const admin = await Admin.findOne({username});

    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    // Check if the current password matches
    const isMatch = await bcrypt.compare(currentPassword, admin.password);

    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash the new password
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the password in the database
    admin.password = hashedPassword;
    await admin.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ message: 'Server error' });
  }
});





module.exports = router
