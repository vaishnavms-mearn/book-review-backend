const prisma= require("../DB/connection.js");
const jwt = require("jsonwebtoken"); // Import jwt if you haven't

exports.addBook = async (req, res) => {
  console.log("Inside add book");

  const { title, author, isbn, genre, description } = req.body;

  // Get token from Authorization header
  const token = req.headers.authorization?.split(" ")[1]; // Extract token
  if (!token) return res.status(403).json("Token is required");

  try {
    // Verify the token to extract the user ID
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET); // Use the secret key used to sign the JWT
    const userId = decodedToken.id; // Extract userId from the token

    const coverImage = req.file ? req.file.path : null;
    console.log(req.body);  // Logs the non-file form data
    console.log(req.file);  // Logs the uploaded file info

    // Check for missing required fields
    if (!title || !author || !isbn || !genre || !description || !coverImage) {
      return res.status(400).json("Missing required fields");
    }

    // Check if the book already exists with the given ISBN
    const existingBook = await prisma.book.findUnique({
      where: { isbn },
    });

    if (existingBook) {
      return res.status(406).json("Book with this ISBN already exists");
    }

    // Create a new book and associate it with the userId
    const newBook = await prisma.book.create({
      data: {
        title,
        author,
        isbn,
        genre,
        description,
        coverUrl: coverImage,
        userId: userId,  // Associate the book with the logged-in user
      },
    });

    res.status(201).json({
      message: "Book added successfully",
      book: newBook,
    });
  } catch (err) {
    console.error("Error adding book:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};
exports.editBook = async (req, res) => {
  const { title, author, isbn, genre, description } = req.body;
  const { id } = req.params;
  const coverImage = req.file ? req.file.path : null;
  try {
    if (isbn) {
      const existingBookWithSameISBN = await prisma.book.findFirst({
        where: {
          isbn,
          NOT: { id: parseInt(id) },
        },
      });

      if (existingBookWithSameISBN) {
        return res.status(400).json("ISBN already exists for another book");
      }
    }

    // Update the book details
    const updatedBook = await prisma.book.update({
      where: { id: parseInt(id) },
      data: {
        title,
        author,
        isbn,
        genre,
        description,
        ...(coverImage && { coverUrl: coverImage }),
      },
    });

    res.status(200).json({
      message: "Book updated successfully",
      book: updatedBook,
    });
  } catch (err) {
    console.error("Error updating book:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};
// controllers/reviewController.js
exports.addReview = async (req, res) => {
  const { text, rating } = req.body; // Extract review details
  const userId = req.payload?.id; // Get user ID from the token payload
  const { id } = req.params; // Extract book ID from params

  // Validate required fields
  if (!text || !rating || !id) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // Create a new review
    const newReview = await prisma.review.create({
      data: {
        text,
        rating: parseInt(rating, 10),
        bookId: parseInt(id, 10),
        userId: parseInt(userId, 10),
      },
    });

    // Send success response
    res.status(201).json({
      message: "Review added successfully",
      review: newReview,
    });
  } catch (err) {
    console.error("Error adding review:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};

exports.editReview = async (req, res) => {
  const { id } = req.params;
  const { text, rating } = req.body;

  try {
    const review = await prisma.review.findUnique({
      where: { id: parseInt(id) },
    });

    if (!review) {
      return res.status(404).json("Review not found");
    }

    const updatedReview = await prisma.review.update({
      where: { id: parseInt(id) },
      data: {
        text: text || review.text,
        rating: rating ? parseInt(rating) : review.rating,
      },
    });

    res.status(200).json({
      message: "Review updated successfully",
      review: updatedReview,
    });
  } catch (err) {
    console.error("Error updating review:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};
exports.deleteReview = async (req, res) => {
  const { id } = req.params;
  console.log(req.params);
  try {
    const review = await prisma.review.findUnique({
      where: { id: parseInt(id) },
    });

    if (!review) {
      return res.status(404).json("Review not found");
    }

    await prisma.review.delete({
      where: { id: parseInt(id) },
    });

    res.status(200).json({ message: "Review deleted successfully" });
  } catch (err) {
    console.error("Error deleting review:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};
exports.getRecommendations = async (req, res) => {
  const { bookId } = req.params;

  try {
    // Find the current book
    const currentBook = await prisma.book.findUnique({
      where: { id: parseInt(bookId) },
    });

    if (!currentBook) {
      return res.status(404).json("Book not found");
    }

    // Get recommended books based on genre
    const recommendedBooks = await prisma.book.findMany({
      where: {
        genre: currentBook.genre,
        NOT: { id: parseInt(bookId) },
      },
      take: 5,
    });

    res.status(200).json({
      message: "Recommendations fetched successfully",
      recommendations: recommendedBooks,
    });
  } catch (err) {
    console.error("Error fetching recommendations:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};
exports.getBooks = async (req, res) => {
  const { sortBy, order = "asc", genre, search } = req.query; // Add 'search' query param

  try {
      // Default behavior when no filters are applied, show some initial books
      const books = await prisma.book.findMany({
          where: {
              ...(genre && { genre }), // Filter by genre if provided
              ...(search && { // Search by title, author, or genre if 'search' is provided
                  OR: [
                      { title: { contains: search, mode: 'insensitive' } },
                      { author: { contains: search, mode: 'insensitive' } },
                      { genre: { contains: search, mode: 'insensitive' } }
                  ]
              })
          },
          orderBy: {
              // Sorting logic based on query params
              ...(sortBy === "title" && { title: order }),
              ...(sortBy === "author" && { author: order }),
              ...(sortBy === "rating" && { rating: order }),
              ...(sortBy === "dateAdded" && { createdAt: order }),
          },
          take: 10, // Limit to first 10 books or adjust as needed for pagination
      });

      // Check if any books were fetched
      if (!books || books.length === 0) {
          return res.status(404).json({
              message: "No books found",
          });
      }

      res.status(200).json({
          message: "Books fetched successfully",
          books,
      });
  } catch (err) {
      console.error("Error fetching books:", err.message);
      res.status(500).json({ error: "Server error" });
  }
};
exports.getUserBooks = async (req, res) => {
  const userId = req.payload?.id;  // Extract userId from token payload

  try {
    const books = await prisma.book.findMany({
      where: { userId: userId },
    });

    if (!books || books.length === 0) {
      return res.status(404).json("No books found for this user");
    }

    res.status(200).json({
      message: "User's books fetched successfully",
      books,
    });
  } catch (error) {
    console.error("Error fetching books:", error.message);
    res.status(500).json({ error: "Server error while fetching books" });
  }
};
exports.deleteBook = async (req, res) => {
  const { id } = req.params;  // Get the book ID from the URL params
  const token = req.headers.authorization?.split(" ")[1];  // Extract token from the Authorization header

  if (!token) return res.status(403).json("Token is required");

  try {
    // Verify the token to extract the user ID
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decodedToken.id; // Extract userId from the token

    // Find the book by ID and check if the user is the owner of the book
    const book = await prisma.book.findUnique({
      where: { id: parseInt(id) },
    });

    if (!book) {
      return res.status(404).json("Book not found");
    }

    if (book.userId !== userId) {
      return res.status(403).json("You are not authorized to delete this book");
    }

    // Delete the book
    await prisma.book.delete({
      where: { id: parseInt(id) },
    });

    res.status(200).json({ message: "Book deleted successfully" });
  } catch (err) {
    console.error("Error deleting book:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};
exports.getBookDetails = async (req, res) => {
  const { id } = req.params;  // Extract id from URL parameters
  const bookId = parseInt(id);  // Convert the string to an integer

  try {
    // Ensure bookId is parsed as an integer
    const parsedBookId = parseInt(bookId);

    if (isNaN(parsedBookId)) {
      return res.status(400).json({ message: "Invalid book ID" });
    }

    // Fetch the book with its reviews
    const book = await prisma.book.findUnique({
      where: {
        id: parsedBookId, // Pass the parsed bookId here
      },
      include: {
        reviews: true, // Include reviews associated with the book
      },
    });

    if (!book) {
      return res.status(404).json("Book not found");
    }

    // Calculate the average rating for the book based on the reviews
    const averageRating =
      book.reviews.length > 0
        ? book.reviews.reduce((sum, review) => sum + review.rating, 0) /
          book.reviews.length
        : 0;

    res.status(200).json({
      message: "Book details fetched successfully",
      book: {
        ...book,
        averageRating: averageRating.toFixed(1),  // Send the average rating
      },
    });
  } catch (err) {
    console.error("Error fetching book details:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};

