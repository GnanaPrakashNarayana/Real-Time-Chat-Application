// backend/src/routes/helper.route.js
import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

// A light‑weight open‑source chat model that is FREE to call
const HF_MODEL_URL =
  "https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium";

/**
 * POST  /api/ai/chat
 * body: { message: string }
 * resp: { id: string, text: string }
 */
router.post("/chat", async (req, res) => {
  const { message } = req.body;
  if (!message)
    return res.status(400).json({ error: "Message text is required" });

  try {
    const hfRes = await fetch(HF_MODEL_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.HF_API_KEY}`, // free token
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        inputs: { text: message }
      })
    });

    const data = await hfRes.json();
    // HF sometimes returns an array, sometimes an object
    const reply =
      Array.isArray(data)
        ? data[0]?.generated_text
        : data.generated_text || "Sorry, I’m not sure how to answer that.";

    return res.json({ id: Date.now().toString(), text: reply.trim() });
  } catch (err) {
    console.error("Helper‑bot error:", err);
    return res
      .status(500)
      .json({ error: "Failed to retrieve response from Helper bot" });
  }
});

export default router;
