const express = require("express");
const multer = require("multer");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: "uploads/" });

app.post("/upload", upload.single("pdf"), async (req, res) => {
    try {
        const path = require("path");
        const filePath = path.resolve(req.file.path);


        const pyResponse = await axios.post("http://localhost:5000/process", {
            filePath,
        });

        res.json(pyResponse.data);
        console.log("PYTHON RESPONSE:", pyResponse.data);

    } catch (error) {
        console.error(error);
        res.status(500).json({ status: "error", message: "Processing failed." });
    }
});

app.post("/ask", async (req, res) => {
    try {
        const pyResponse = await axios.post("http://localhost:5000/ask", req.body);

        console.log("ASK PY RESPONSE:", pyResponse.data);  // <-- ADD THIS

        res.json(pyResponse.data);
    } catch (error) {
        console.error("ASK ERROR:", error);
        res.status(500).json({ status: "error", message: "Ask failed." });
    }
});

app.listen(4000, () => console.log("Node server running on port 4000"));
