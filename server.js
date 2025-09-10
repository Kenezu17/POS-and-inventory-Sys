import express from "express";
import bodyParser from "body-parser";
import cors from "cors";

const app = express();


app.use(cors());

app.use(bodyParser.json({ limit: "10mb" }));
app.use(express.static("public"));

let clients = [];

app.post("/scanner", (req, res) => {
  const { barcode, image } = req.body;

  const data = JSON.stringify({ barcode, image });
  clients.forEach(client => client.write(`data: ${data}\n\n`));

  res.json({ success: true });
});

app.get("/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  clients.push(res);
  req.on("close", () => {
    clients = clients.filter(c => c !== res);
  });
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));
