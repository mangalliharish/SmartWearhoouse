import express from "express";

const app = express();

app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.send("SmartWarehouse running 🚀");
});

// Port
const port = Number(process.env.PORT) || 3000;

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// 🔥 KEEP SERVER ALIVE (IMPORTANT FIX)
setInterval(() => {}, 1000);