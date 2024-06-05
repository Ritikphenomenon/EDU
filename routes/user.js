const express = require("express");
const { authenticateJwt, SECRET } = require("../middleware/index");
const { User, Course } = require("../db");

const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const bcrypt = require("bcrypt");

const router = express.Router();
const Razorpay = require("razorpay");

router.post("/signup", async (req, res) => {
  try {
    const { username, password, name, profilePhoto, bio } = req.body;
    const user = await User.findOne({ username });

    if (user) {
      return res.json({ message: "User already exists, please Login" });
    }

    // Hash the password before saving it
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      password: hashedPassword,
      name,
      profilePhoto,
      bio,
    });
    await newUser.save();

    res.json({ message: "User created successfully, please login" });
  } catch (error) {
    console.error("Error during User signup:", error.message);
    res.status(500).json({ message: "Server error during User signup" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // Generate token for the logged-in admin
    const token = jwt.sign({ username, role: "user" }, SECRET, {
      expiresIn: "375d",
    });

    res.json({ message: "Login successful", token });
  } catch (error) {
    console.error("Error during user login:", error.message);
    res.status(500).json({ message: "Server error during user login" });
  }
});

// GET request to fetch profile details
router.get("/profile", authenticateJwt, async (req, res) => {
  try {
    // Extract the username from the authenticated token
    const { username } = req.user;

    // Find the admin by username
    const user = await User.findOne({ username });

    // If user is not found, return a 404 error
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Return the profile details in the response
    res.json({
      name: user.name,
      profilePhoto: user.profilePhoto,
      bio: user.bio,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error.message);
    res
      .status(500)
      .json({ message: "Server error while fetching user profile" });
  }
});

router.get("/courses", authenticateJwt, async (req, res) => {
  try {
    // Fetch all courses from the database
    const courses = await Course.find();

    // Respond with the list of courses
    res.json(courses);
  } catch (error) {
    console.error("Error fetching courses:", error.message);
    res.status(500).json({ message: "Server error while fetching courses" });
  }
});

router.post("/check-course", authenticateJwt, async (req, res) => {
  try {
    const { courseId } = req.body;
    const { username } = req.user;

    // Find the user by ID
    const user = await User.findOne({ username }).populate("purchasedCourses");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if the course is in purchasedCourses
    const courseExists = user.purchasedCourses.some(
      (course) => course._id.toString() === courseId
    );

    return res.status(200).json({ courseExists });
  } catch (error) {
    console.error("Error checking course:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/order", authenticateJwt, async (req, res) => {
  try {
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const { amount, currency, receipt } = req.body;
    if (!amount || !currency || !receipt) {
      return res.status(400).send("Bad Request");
    }

    const options = { amount, currency, receipt };
    const order = await razorpay.orders.create(options);

    if (!order) {
      return res.status(400).send("Bad Request");
    }

    res.json(order);
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).send(error);
  }
});

router.post("/validate", authenticateJwt, async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      CourseId,
    } = req.body;
    const sha = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);

    sha.update(`${razorpay_order_id}|${razorpay_payment_id}`);

    const digest = sha.digest("hex");

    if (digest !== razorpay_signature) {
      return res.status(400).json({ msg: "Transaction is not legit!" });
    }

    //console.log("req.user", req.user);
    const { username } = req.user;
    // console.log("Finding user with username:", //username); // Logging
    const user = await User.findOne({ username }); // Correct usage

    //console.log("Finding course with ID:", CourseId); // Logging
    const course = await Course.findById(CourseId); // Correct usage

    if (!user || !course) {
      return res.status(404).json({ msg: "User or Course not found" });
    }

    if (!user.purchasedCourses.includes(course._id)) {
      user.purchasedCourses.push(course._id);
      await user.save();
    }

    res.json({
      msg: "Transaction is legit!",
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
    });
  } catch (error) {
    console.error("Error validating transaction:", error);
    res.status(500).send(error);
  }
});

// Route to get all purchased courses for a user
router.get("/purchased-courses", authenticateJwt, async (req, res) => {
  try {
    const { username } = req.user;

    // Find the user by username and populate purchasedCourses
    const user = await User.findOne({ username }).populate('purchasedCourses');

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Extract course IDs from purchasedCourses
    const courseIds = user.purchasedCourses.map(course => course._id);

    // Find all courses with the extracted course IDs
    const courses = await Course.find({ _id: { $in: courseIds } });

    return res.status(200).json(courses);
  } catch (error) {
    console.error("Error retrieving purchased courses:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
});




module.exports = router;
