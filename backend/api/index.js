const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const nodemailer = require('nodemailer');
const app = express();
app.use(express.json());





app.use(cors({
  origin: true,
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
}));

app.options("*", cors());

const CCLDB = require("../models/CCLDB");
const CCLTeam = require("../models/CCLTEAMS");


if (!process.env.MONGO_URI) {
  throw new Error("MONGO_URI is not defined");
}

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  throw new Error("Email credentials missing");
}


let isConnected = false;

async function connectDB() {
  if (isConnected) return;
  await mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 5000,
});
  isConnected = true;
}





app.get("/api/", async (req, res) => {
  await connectDB();
  res.send("Server is running");
});


app.get("/api/ccldb", async (req, res) => {
  await connectDB();
  try {
    console.log(req.body);
    const student = await CCLDB.find();
    student.map((stu) => {stu.status = "False"; stu.save();});
    res.status(201).json(student);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});




// 1. Configure the Transporter
const transporter = nodemailer.createTransport({
  service: 'gmail', // Use 'gmail' or your SMTP host (e.g., smtp.office365.com)
  auth: {
    user: process.env.EMAIL_USER, // Your email from .env
    pass: process.env.EMAIL_PASS  // Your app password from .env
  }
});

// ... imports and config

// 1. Send OTP Route
app.post("/api/send-otp", async (req, res) => {
  await connectDB();
  try {
    const { email } = req.body;
    
    // Find user
    const user = await CCLDB.findOne({ email, status:"False"});
    if (!user) {
      return res.status(404).json({ message: "Email not found in our database or team has been formed already." });
    }

    // Generate OTP
    const otp = Math.floor(1000 + Math.random() * 9000);
    
    // IMPORTANT: Save OTP to DB to verify later
    user.otp = otp; 
    await user.save(); 

    console.log(`Generated OTP for ${email}: ${otp}`);

    const emailHtml = `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      body { 
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
        background-color: #f4f4f4; 
        margin: 0; 
        padding: 0; 
      }
      .container { 
        max-width: 600px; 
        margin: 40px auto; 
        background-color: #ffffff; 
        border-radius: 8px; 
        box-shadow: 0 4px 12px rgba(0,0,0,0.05); 
        overflow: hidden; 
      }
      .header { 
        background-color: #1e3a8a; 
        padding: 35px 20px; 
        text-align: center; 
      }
      .header h1 { 
        color: #ffffff; 
        margin: 0; 
        font-size: 26px; 
        letter-spacing: 2px; 
        font-weight: 800; 
        text-transform: uppercase;
      }
      .content { 
        padding: 40px 40px; 
        text-align: center; 
        color: #374151; 
      }
      .greeting {
        font-size: 20px;
        font-weight: 700;
        color: #111827;
        margin-bottom: 16px;
      }
      .message {
        font-size: 16px;
        line-height: 1.6;
        color: #4b5563;
        margin-bottom: 30px;
      }
      .otp-box { 
        background-color: #f9fafb; 
        border: 2px dashed #1e3a8a; 
        border-radius: 12px; 
        padding: 20px 40px; 
        margin: 30px auto; 
        display: inline-block;
      }
      .otp-code { 
        font-size: 36px; 
        font-weight: 800; 
        color: #1e3a8a; 
        letter-spacing: 12px; 
        margin: 0; 
        font-family: monospace;
      }
      .sub-text {
        font-size: 14px;
        color: #6b7280;
        margin-top: 20px;
      }
      .footer { 
        background-color: #f9fafb; 
        padding: 24px; 
        text-align: center; 
        border-top: 1px solid #e5e7eb;
      }
      .footer p {
        font-size: 12px; 
        color: #9ca3af;
        margin: 5px 0;
      }
      .footer a {
        color: #1e3a8a;
        text-decoration: none;
        font-weight: 600;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <!-- Header -->
      <div class="header">
        <h1>SYNERGY SQUAD</h1>
      </div>
      
      <!-- Content -->
      <div class="content">
        <div class="greeting">Hello ${user.fullName || 'Future Leader'},</div>
        
        <p class="message">
          We received a request to verify your email address for the <strong>CCL Coding Challenge</strong> team formation. Use the One-Time Password (OTP) below to proceed.
        </p>
        
        <!-- OTP Box -->
        <div class="otp-box">
          <div class="otp-code">${otp}</div>
        </div>
        
        <p class="sub-text">Please enter this code in the portal to verify your identity.</p>
      </div>
      
      <!-- Footer -->
      <div class="footer">
        <p>&copy; 2025 Synergy Squad. All rights reserved.</p>
        <p>Need help? Contact us at <a href="mailto:synergysquad@kiot.ac.in">support@synergysquad.com</a></p>
      </div>
    </div>
  </body>
  </html>
`;
    await transporter.sendMail({
      from: `"Synergy Squad" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Action Required: Your Verification Code",
      html: emailHtml,
    });

    res.status(200).json({ message: "OTP sent successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error sending email" });
  }
});

// 2. Verify OTP Route (Add this to your backend)
app.post("/api/verify-otp", async (req, res) => {
  await connectDB();
  try {

    const { email, otp } = req.body;
    
    const user = await CCLDB.findOne({ email });
    
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    // Check if OTP matches (Ensure types match, usually string vs number)
    if (user.otp == otp) { 
        // Optional: Clear OTP after success so it can't be used again
        user.otp = null; 
        await user.save();
        return res.status(200).json({ message: "Verified" });
    } else {
        return res.status(400).json({ message: "Invalid OTP" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error during verification" });
  }
});

// ... existing imports and configs ...

// 1. GET AVAILABLE STUDENTS (For Dropdown)
// Fetches students where status is NOT "True" (i.e., "False" or undefined)
app.get("/api/available-students", async (req, res) => {
  await connectDB();
  try {
    const students = await CCLDB.find({ 
        status: { $ne: "True" } 
    }).select("email branch fullName"); // Only send necessary data
    
    res.status(200).json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. CREATE TEAM (With Constraint Checks)
app.post("/api/create-team", async (req, res) => {
  await connectDB();
  try {
    const { teamName, leaderEmail, member2Email, member3Email } = req.body;

    // A. Check if Team Name is unique
    const existingTeam = await CCLTeam.findOne({ teamName: new RegExp(`^${teamName}$`, 'i') });
    if (existingTeam) {
      return res.status(400).json({ message: "Team name already taken. Please choose another." });
    }

    // B. Fetch all 3 Students
    const leader = await CCLDB.findOne({ email: leaderEmail });
    const mem2 = await CCLDB.findOne({ email: member2Email });
    const mem3 = await CCLDB.findOne({ email: member3Email });

    // C. Verify they exist and are available
    if (!leader || !mem2 || !mem3) {
      return res.status(404).json({ message: "One or more members not found." });
    }

    if (leader.status === "True" || mem2.status === "True" || mem3.status === "True") {
      return res.status(400).json({ message: "One or more members are already in a team." });
    }

    // D. CONSTRAINT: At least one person from a different department
    // Check if Branch 1 == Branch 2 AND Branch 2 == Branch 3
    if (leader.branch === mem2.branch && mem2.branch === mem3.branch) {
      return res.status(400).json({ 
        message: `Diversity Rule: The team cannot consist of 3 members from the same department (${leader.branch}). At least one member must be from a different branch.` 
      });
    }

    // E. Create the Team in CCLTeam Collection
    const newTeam = new CCLTeam({
      teamName: teamName,
      leader: leader._id,
      member2: mem2._id,
      member3: mem3._id,
    });
    await newTeam.save();

    // F. Update Status of all members to "True" in CCLDB
    leader.status = "True";
    mem2.status = "True";
    mem3.status = "True";
    
    // Save updates
    await Promise.all([leader.save(), mem2.save(), mem3.save()]);

    res.status(200).json({ message: "Team Created Successfully!" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error during team creation." });
  }
});

// ... existing imports

// 3. GET ALL TEAMS (For View Teams Modal)
app.get("/api/get-all-teams", async (req, res) => {
  await connectDB();
  try {
    // Fetch teams and populate student details (only email and branch)
    const teams = await CCLTeam.find()
      .populate("leader", "email branch")
      .populate("member2", "email branch")
      .populate("member3", "email branch");

    res.status(200).json(teams);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch teams" });
  }
});


module.exports = app;