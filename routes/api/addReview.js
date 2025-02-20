import express from "express";
import multer from "multer";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const router = express.Router();
const upload = multer();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = join(__dirname, "../../reviews.db");

async function getDb() {
  return open({
    filename: dbPath,
    driver: sqlite3.Database,
  });
}

router.post("/", upload.none(), async (req, res) => {
  const {
    title,
    reviewText,
    rating,
    department,
    sentimentScore,
    age,
    division,
    class: className,
  } = req.body;

  const db = await getDb();
  try {
    const parsedSentimentScore = Number.parseFloat(sentimentScore) || 0.5;

    await db.run(
      `
      INSERT INTO reviews (
        clothing_id, age, title, review_text, rating, recommended_ind,
        positive_feedback_count, division_name, department_name, class_name, sentiment_score
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        Date.now().toString(),
        Number.parseInt(age),
        title,
        reviewText,
        Number.parseInt(rating),
        Number.parseInt(rating) >= 4 ? 1 : 0,
        Number.parseInt(rating) >= 4 ? 1 : 0,
        division,
        department,
        className,
        parsedSentimentScore,
      ]
    );

    res.json({ message: "Review added successfully" });
  } catch (error) {
    console.error("Error adding review:", error);
    res.status(500).json({ message: "Error adding review" });
  } finally {
    await db.close();
  }
});

export default router;
