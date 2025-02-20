import express from "express";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

router.get("/", (req, res) => {
  res.redirect("/index");
});

router.get("/:page", (req, res) => {
  const page = req.params.page;
  const filePath = join(__dirname, "../public/views", `${page}.html`);

  res.sendFile(filePath, (err) => {
    if (err) {
      res.status(404).send("404: Page not found");
    }
  });
});

export default router;
