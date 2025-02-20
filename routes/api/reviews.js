import express from "express";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = join(__dirname, "../../reviews.db");

async function getDb() {
  return open({
    filename: dbPath,
    driver: sqlite3.Database,
  });
}

router.get("/", async (req, res) => {
  const db = await getDb();
  try {
    const reviews = await db.all(`
      SELECT *, COALESCE(sentiment_score, 0.5) as sentiment_score 
      FROM reviews
    `);
    res.json(reviews);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ message: "Error fetching reviews" });
  } finally {
    await db.close();
  }
});

router.get("/:category", async (req, res) => {
  const category = req.params.category;
  const page = Number.parseInt(req.query.page) || 1;
  const pageSize = 3;

  const db = await getDb();
  try {
    const totalReviews = await db.get(
      "SELECT COUNT(*) as count FROM reviews WHERE department_name = ?",
      category
    );
    const averageReview = await db.get(
      "SELECT AVG(rating) as avg FROM reviews WHERE department_name = ?",
      category
    );
    const latestReviews = await db.all(
      "SELECT * FROM reviews WHERE department_name = ? ORDER BY id DESC LIMIT 5",
      category
    );
    const allReviews = await db.all(
      "SELECT * FROM reviews WHERE department_name = ? LIMIT ? OFFSET ?",
      category,
      pageSize,
      (page - 1) * pageSize
    );

    res.json({
      averageReview: averageReview.avg,
      latestReviews,
      allReviews,
      totalReviews: totalReviews.count,
    });
  } catch (error) {
    console.error("Error fetching category reviews:", error);
    res.status(500).json({ message: "Error fetching category reviews" });
  } finally {
    await db.close();
  }
});

export default router;
