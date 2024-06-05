const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const userRouter = require("./routes/user");
const adminRouter = require("./routes/admin");
const Razorpay = require("razorpay");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;

dotenv.config();

const USERNAME = process.env.DB_USERNAME;
const PASSWORD = process.env.DB_PASSWORD;

// Middleware
app.use(express.json());
app.use(cors()); // Add this line to enable CORS

// Routes
app.use("/admin", adminRouter);
app.use("/users", userRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

// Connect to MongoDB
mongoose
  .connect(
    `mongodb+srv://${USERNAME}:${PASSWORD}@cluster0.sa32hez.mongodb.net/`,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName: "courseverse",
    }
  )
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error.message);
  });

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
