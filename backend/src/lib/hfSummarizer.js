// backend/src/lib/hfSummarizer.js
import axios from "axios";

const CHAT_MODEL = "facebook/bart-large-cnn-samsum";   // dialogue‑tuned
const FALLBACK_MODEL = "sshleifer/distilbart-cnn-6-6"; // always online

const HF_TOKEN = process.env.HF_API_TOKEN;
const HEADERS = {
  Authorization: `Bearer ${HF_TOKEN}`,
  "x-wait-for-model": "true",        // ← wait instead of 503  [oai_citation_attribution:0‡GitHub](https://github.com/huggingface/hub-docs/blob/main/docs/api-inference/parameters.md?utm_source=chatgpt.com)
  Accept: "application/json",
};

/**
 * Try the main chat‑summary model once, then fall back to the tiny one.
 * Returns `null` if *both* calls fail (network, quota, etc.).
 */
export const summariseWithHF = async (text) => {
  if (!HF_TOKEN) return null; // env var missing

  /** inner helper */
  const call = async (model) => {
    const url = `https://api-inference.huggingface.co/models/${model}`;
    try {
      const { data } = await axios.post(
        url,
        {
          inputs: text,
          parameters: { max_length: 60, min_length: 25 },
        },
        { headers: HEADERS, timeout: 45_000 }
      );
      if (Array.isArray(data) && data[0]?.summary_text) return data[0].summary_text.trim();
      if (data?.error?.includes("loading")) return null; // will retry
      return null;
    } catch (err) {
      console.error("HF summariser ►", err.response?.data || err.message);
      return null;
    }
  };

  /* 1️⃣ try SAMSum‑tuned model, 2️⃣ fall back */
  return (await call(CHAT_MODEL)) || (await call(FALLBACK_MODEL));
};