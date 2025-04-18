// backend/src/lib/hfSummarizer.js
import axios from "axios";

const HF_MODEL = "sshleifer/distilbart-cnn-6-6";  // small & fast
const HF_URL   = `https://api-inference.huggingface.co/models/${HF_MODEL}`;
const HF_TOKEN = process.env.HF_API_TOKEN;

/**
 * Summarise text with Hugging Face Inference API
 * @param {string} text
 * @returns {string|null} summary or null on failure
 */
export const summariseWithHF = async (text) => {
  if (!HF_TOKEN) return null;            // env var missing → caller will fallback
  try {
    const { data } = await axios.post(
      HF_URL,
      { inputs: text },
      { headers: { Authorization: `Bearer ${HF_TOKEN}` }, timeout: 30_000 }
    );

    /* API returns e.g. [{summary_text:"..."}] */
    if (Array.isArray(data) && data[0]?.summary_text) return data[0].summary_text;
    console.error("Unexpected HF response", data);
    return null;
  } catch (err) {
    console.error("HF summariser error ➜", err.response?.data || err.message);
    return null;
  }
};