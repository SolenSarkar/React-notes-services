import express from "express";
import mongoose from "mongoose";
import Note from "../models/Note.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();


// =====================================================
// CREATE NOTE
// POST /api/notes
// =====================================================

router.post("/", authMiddleware, async (req, res) => {
  try {
    const { title, content } = req.body;

    // Server-side validation
    if (typeof title !== "string" || !title.trim()) {
      return res.status(400).json({
        message: "Title is required",
      });
    }

    if (typeof content !== "string" || !content.trim()) {
      return res.status(400).json({
        message: "Content is required",
      });
    }

    const cleanTitle = title.trim();
    const cleanContent = content.trim();

    if (cleanTitle.length > 100) {
      return res.status(400).json({
        message: "Title cannot exceed 100 characters",
      });
    }

    if (cleanContent.length > 5000) {
      return res.status(400).json({
        message: "Content cannot exceed 5000 characters",
      });
    }

    const note = await Note.create({
      title: cleanTitle,
      content: cleanContent,
      user: req.user.id,
    });

    return res.status(201).json({
      message: "Note created successfully",
      note,
    });
  } catch (error) {
    console.error("Create note error:", error);

    return res.status(500).json({
      message: "Server error while creating note",
    });
  }
});


// =====================================================
// GET NOTES
// GET /api/notes
//
// Supports:
// ?search=react
// ?page=1
// ?limit=10
// ?search=react&page=2&limit=5
// =====================================================

router.get("/", authMiddleware, async (req, res) => {
  try {
    let { search = "", page = 1, limit = 10 } = req.query;

    // Convert query parameters to numbers
    page = Number(page);
    limit = Number(limit);

    // Validate page
    if (!Number.isInteger(page) || page < 1) {
      return res.status(400).json({
        message: "Page must be a positive integer",
      });
    }

    // Validate limit
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      return res.status(400).json({
        message: "Limit must be between 1 and 100",
      });
    }

    // Validate search
    if (typeof search !== "string") {
      return res.status(400).json({
        message: "Search must be a string",
      });
    }

    search = search.trim();

    // ---------------------------------------------
    // Build query
    // ---------------------------------------------

    const query = {
      user: req.user.id,
    };

    // Search title OR content
    if (search) {
      query.$or = [
        {
          title: {
            $regex: search,
            $options: "i",
          },
        },
        {
          content: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    // ---------------------------------------------
    // Pagination
    // ---------------------------------------------

    const skip = (page - 1) * limit;

    // Get total number of matching notes
    const total = await Note.countDocuments(query);

    // Get notes
    const notes = await Note.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
      notes,

      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Get notes error:", error);

    return res.status(500).json({
      message: "Server error while fetching notes",
    });
  }
});


// =====================================================
// GET SINGLE NOTE
// GET /api/notes/:id
// OWNER ONLY
// =====================================================

router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid note ID",
      });
    }

    const note = await Note.findOne({
      _id: id,
      user: req.user.id,
    });

    if (!note) {
      return res.status(404).json({
        message: "Note not found",
      });
    }

    return res.status(200).json({
      note,
    });
  } catch (error) {
    console.error("Get note error:", error);

    return res.status(500).json({
      message: "Server error while fetching note",
    });
  }
});


// =====================================================
// UPDATE NOTE
// PUT /api/notes/:id
// OWNER ONLY
// =====================================================

router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid note ID",
      });
    }

    // Server-side validation
    if (typeof title !== "string" || !title.trim()) {
      return res.status(400).json({
        message: "Title is required",
      });
    }

    if (typeof content !== "string" || !content.trim()) {
      return res.status(400).json({
        message: "Content is required",
      });
    }

    const cleanTitle = title.trim();
    const cleanContent = content.trim();

    if (cleanTitle.length > 100) {
      return res.status(400).json({
        message: "Title cannot exceed 100 characters",
      });
    }

    if (cleanContent.length > 5000) {
      return res.status(400).json({
        message: "Content cannot exceed 5000 characters",
      });
    }

    // IMPORTANT:
    // The note must belong to the logged-in user.
    const note = await Note.findOneAndUpdate(
      {
        _id: id,
        user: req.user.id,
      },
      {
        title: cleanTitle,
        content: cleanContent,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!note) {
      return res.status(403).json({
        message: "You are not authorized to update this note",
      });
    }

    return res.status(200).json({
      message: "Note updated successfully",
      note,
    });
  } catch (error) {
    console.error("Update note error:", error);

    return res.status(500).json({
      message: "Server error while updating note",
    });
  }
});


// =====================================================
// DELETE NOTE
// DELETE /api/notes/:id
// OWNER ONLY
// =====================================================

router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid note ID",
      });
    }

    // IMPORTANT:
    // The note must belong to the logged-in user.
    const note = await Note.findOneAndDelete({
      _id: id,
      user: req.user.id,
    });

    if (!note) {
      return res.status(403).json({
        message: "You are not authorized to delete this note",
      });
    }

    return res.status(200).json({
      message: "Note deleted successfully",
    });
  } catch (error) {
    console.error("Delete note error:", error);

    return res.status(500).json({
      message: "Server error while deleting note",
    });
  }
});


export default router;