const jwt = require("jsonwebtoken");
require("dotenv").config();

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Extract token

  if (!token) {
    console.log("No token provided"); // Debugging
    return res.status(401).json("Access Denied: No Token Provided");
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET); // Verify the token
    console.log("Decoded Token:", verified); // Debugging
    req.payload = verified; // Attach decoded payload to request
    next();
  } catch (err) {
    console.error("Invalid Token:", err.message); // Debugging
    res.status(403).json("Invalid Token");
  }
};

module.exports = authenticateToken;
