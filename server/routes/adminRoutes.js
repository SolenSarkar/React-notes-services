import express from "express";
import mongoose from "mongoose";

import Note from "../models/Note.js";
import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";

const router = express.Router();


// =====================================================
// GET ALL NOTES
// GET /api/admin/notes
//
// Admin only
//
// Supports:
// ?search=react
// ?page=1
// ?limit=10
// =====================================================

router.get(
  "/notes",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      let {
        search = "",
        page = 1,
        limit = 10,
      } = req.query;

      page = Number(page);
      limit = Number(limit);

      // Validate page
      if (!Number.isInteger(page) || page < 1) {
        return res.status(400).json({
          message: "Page must be a positive integer",
        });
      }

      // Validate limit
      if (
        !Number.isInteger(limit) ||
        limit < 1 ||
        limit > 100
      ) {
        return res.status(400).json({
          message: "Limit must be between 1 and 100",
        });
      }

      if (typeof search !== "string") {
        return res.status(400).json({
          message: "Search must be a string",
        });
      }

      search = search.trim();

      // ---------------------------------------------
      // Build admin query
      // ---------------------------------------------

      const query = {};

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

      const skip = (page - 1) * limit;

      const total = await Note.countDocuments(query);

      const notes = await Note.find(query)
        .populate("user", "name email role")
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
      console.error("Admin get notes error:", error);

      return res.status(500).json({
        message: "Server error while fetching notes",
      });
    }
  }
);


// =====================================================
// DELETE ANY NOTE
// DELETE /api/admin/notes/:id
//
// Admin only
// =====================================================

router.delete(
  "/notes/:id",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          message: "Invalid note ID",
        });
      }

      const note = await Note.findByIdAndDelete(id);

      if (!note) {
        return res.status(404).json({
          message: "Note not found",
        });
      }

      return res.status(200).json({
        message: "Note removed by administrator",
      });
    } catch (error) {
      console.error("Admin delete note error:", error);

      return res.status(500).json({
        message: "Server error while deleting note",
      });
    }
  }
);


export default router;