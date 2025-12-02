const express = require("express");
const multer = require("multer");
const axios = require("axios");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// Multer upload
const upload = multer({ dest: "uploads/" });

// ======================
// ROUTES
// ======================

// Upload PDF → send to Python RAG
app.post("/upload", upload.single("pdf"), async (req, res) => {
    try {
        const filePath = path.resolve(req.file.path);

        const pyResponse = await axios.post("http://localhost:5000/process", {
            filePath,
        });

        console.log("PYTHON RESPONSE:", pyResponse.data);
        res.json(pyResponse.data);
    } catch (error) {
        console.error("UPLOAD ERROR:", error);
        res.status(500).json({ status: "error", message: "Processing failed." });
    }
});

// Ask question → send to Python RAG
app.post("/ask", async (req, res) => {
    try {
        const pyResponse = await axios.post("http://localhost:5000/ask", req.body);

        console.log("ASK PY RESPONSE:", pyResponse.data);
        res.json(pyResponse.data);
    } catch (error) {
        console.error("ASK ERROR:", error);
        res.status(500).json({ status: "error", message: "Ask failed." });
    }
});

app.get("/", (req, res) => {
    res.json({ status: "ok", message: "Backend server running" });
});



// ======================
// START SERVER ONLY IF NOT IN TEST MODE
// ======================
if (require.main === module) {
    app.listen(4000, () => console.log("Node server running on port 4000"));
}

module.exports = app;
