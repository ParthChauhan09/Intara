import express from "express";

const app = express();
const port = process.env.PORT || 5000;

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
