import express from "express";

const authorsJSONPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "authors.json"
);

const authorsRouter = express.Router()

authorsRouter.post("/", () => {
    
})