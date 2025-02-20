import express from "express";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 3000;

// Подключение статических файлов
app.use(express.static(join(__dirname, "public")));

// Импорт маршрутов
import reviewsRoutes from "./routes/api/reviews.js";
import clothesCategoriesRoutes from "./routes/api/clothesCategories.js";
import addReviewRoutes from "./routes/api/addReview.js";
import pagesRoutes from "./routes/pages.js";

// Подключение маршрутов
app.use("/api/reviews", reviewsRoutes);
app.use("/api/clothes-categories", clothesCategoriesRoutes);
app.use("/api/add-review", addReviewRoutes);
app.use("/", pagesRoutes);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
