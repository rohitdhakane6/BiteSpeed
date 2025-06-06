import express from "express";
import { identifyRouter } from "./routes/identify";
import dotenv from "dotenv";
import path from "path";

const app = express();
app.use(express.json());
dotenv.config;
// app.use(express.static(path.join(__dirname, "public")));

const port = 3000;
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.use("/identify", identifyRouter);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
