require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");

const contactRoutes = require("./routes/contact");

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use("/api/contact", contactRoutes);

// Store CV requests (Replace with database in future)
let pendingRequests = [];

const CV_PATH = path.join(__dirname, "cv.pdf");

// Route: Request to Download CV
app.post("/api/request-cv", (req, res) => {
    const { userEmail } = req.body;
    
    // Check if request already exists
    if (pendingRequests.find((r) => r.userEmail === userEmail)) {
        return res.status(400).json({ message: "Request already submitted. Awaiting approval." });
    }

    pendingRequests.push({ userEmail, approved: false });
    console.log(`New CV request from: ${userEmail}`);
    res.json({ message: "Your request has been submitted. Awaiting approval." });
});

// Route: Approve CV Download (Only for Admin)
app.post("/api/approve-cv", (req, res) => {
    const { userEmail, adminKey } = req.body;

    if (adminKey !== process.env.ADMIN_KEY) {
        return res.status(403).json({ message: "Unauthorized action." });
    }

    const request = pendingRequests.find((r) => r.userEmail === userEmail);
    
    if (request) {
        request.approved = true;
        console.log(`CV request approved for: ${userEmail}`);
        return res.json({ message: "Request approved. User can now download the CV." });
    }

    res.status(404).json({ message: "Request not found." });
});

// Route: Download CV (Only If Approved)
app.get("/api/download-cv", (req, res) => {
    const { userEmail } = req.query;

    const request = pendingRequests.find((r) => r.userEmail === userEmail);

    if (request && request.approved) {
        return res.download(CV_PATH);
    }

    res.status(403).json({ message: "Access denied. Your request is pending approval." });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
