const mongoose = require("mongoose");

//define mongoose schema

const userSchema = new mongoose.Schema({
  username: { type: String },
  password: String,
  name: String, // Adding the name field
  profilePhoto: String, // Adding the profilePhoto field (stored as a URL)
  bio: String, // Adding the bio field
  purchasedCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],
});

const courseSchema = new mongoose.Schema({
  title: String,
  rating: Number,
  price: Number,
  imageLink: String,
  published: Boolean,
  courselink: String,
  Id: String,
});

const adminSchema = new mongoose.Schema({
  username: { type: String },
  password: String,
  name: String, // Adding the name field
  profilePhoto: String, // Adding the profilePhoto field (stored as a URL)
  bio: String, // Adding the bio field
});

const User = mongoose.model("User", userSchema);
const Admin = mongoose.model("Admin", adminSchema);
const Course = mongoose.model("Course", courseSchema);

module.exports = {
  User,
  Admin,
  Course,
};
