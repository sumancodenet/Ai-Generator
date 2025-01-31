import express from "express";
import dotenv from "dotenv";
import { getContent } from "./routes/generateContent.routes.js";
import cors from "cors"
const app = express();
dotenv.config();

app.get("/", (req, res) => {
  res.send("PopTech Is Running");
});

app.use(express.json());
const allowedOrigins = 3001;
app.use(cors({ origin: allowedOrigins }));

getContent(app);

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`AI is running in http://localhost:${PORT}`);
});
