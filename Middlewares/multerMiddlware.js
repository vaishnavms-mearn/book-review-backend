const multer = require("multer");

// Storage configuration to store the file
const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, "./uploads"); // Ensure the "uploads" folder exists in your project root
  },
  // Creating a unique filename for the uploaded image
  filename: (req, file, callback) => {
    const filename = `image-${Date.now()}-${file.originalname}`; // Fixed Date.now()
    callback(null, filename);
  },
});

// File filter to restrict file types
const fileFilter = (req, file, callback) => {
  const allowedMimeTypes = ["image/png", "image/jpeg", "image/jpg"];
  if (allowedMimeTypes.includes(file.mimetype)) {
    callback(null, true); // Allow the file
  } else {
    callback(null, false); // Reject the file
    return callback(
      new Error("Invalid file type. Must be image/jpeg or image/jpg or image/png.")
    );
  }
};

// Multer configuration
const multerConfig = multer({
  storage,
  fileFilter,
});

module.exports = multerConfig;
