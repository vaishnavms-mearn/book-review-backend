const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma= require("../DB/connection.js");
require("dotenv").config();
exports.register = async (req, res) => {
  const { name, email, password } = req.body;

  console.log("Received registration data:", req.body);

  // Validate Input
  if (!name || !email || !password) {
    return res.status(400).send("Missing required fields");
  }

  try {
    // Check if the email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).send("Email already exists");
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the new user in the database
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    console.log("User registered successfully:", newUser);

    res.status(201).send("User registered successfully");
  } catch (err) {
    console.error("Error during registration:", err);
    res.status(500).send("Server error");
  }
};
exports.login = async (req, res) => {
    const { email, password } = req.body;

    console.log("Received login data:", req.body);

    if (!email || !password) {
      return res.status(400).send("Missing required fields");
    }

    try {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (!existingUser) {
        return res.status(404).send("User not found");
      }

      const isPasswordValid = await bcrypt.compare(password, existingUser.password);

      if (!isPasswordValid) {
        return res.status(401).send("Invalid credentials");
      }

      // Generate a JWT token
      const token = jwt.sign(
        { id: existingUser.id, email: existingUser.email },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );
      console.log("User logged in successfully:", existingUser);

      res.status(200).json({
        message: "Login successful",
        token,
        user: {
          id: existingUser.id,
          name: existingUser.name,
          email: existingUser.email,
        },
      });
    } catch (err) {
      console.error("Error during login:", err);
      res.status(500).send("Server error");
    }
  };