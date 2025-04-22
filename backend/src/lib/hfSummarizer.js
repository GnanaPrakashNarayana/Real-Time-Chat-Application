// backend/src/lib/hfSummarizer.js
import axios from "axios";

const CHAT_MODEL = "facebook/bart-large-cnn-samsum";   // dialogue‑tuned
const FALLBACK_MODEL = "sshleifer/distilbart-cnn-6-6"; // always online

const HF_TOKEN = process.env.HF_API_TOKEN;
const HEADERS = {
  Authorization: `Bearer ${HF_TOKEN}`,
  "x-wait-for-model": "true",        // ← wait instead of 503
  Accept: "application/json",
};

/**
 * Try the main chat‑summary model once, then fall back to the tiny one.
 * Returns `null` if *both* calls fail (network, quota, etc.).
 */
export const summariseWithHF = async (text) => {
  if (!HF_TOKEN) {
    console.log("HF_TOKEN is missing, using enhanced local summarization");
    return generateLocalSummary(text);
  }

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

  /* 1️⃣ try SAMSum‑tuned model, 2️⃣ fall back to local summarization */
  const summary = await call(CHAT_MODEL) || await call(FALLBACK_MODEL);
  return summary || generateLocalSummary(text);
};

/**
 * Generate a meaningful summary locally when API calls fail
 * This is a more sophisticated fallback than just the last few sentences
 */
const generateLocalSummary = (text) => {
  // Split into sentences for analysis
  const sentences = text.split(/(?<=[.!?])\s+/);
  
  if (sentences.length <= 4) {
    return text; // If very short, just return the original
  }
  
  // Extract basic conversation structure
  const speakers = {};
  let currentSpeaker = null;
  
  // First pass - identify speakers and what they say
  for (const sentence of sentences) {
    const speakerMatch = sentence.match(/^(You|Them):/);
    if (speakerMatch) {
      currentSpeaker = speakerMatch[1];
      if (!speakers[currentSpeaker]) {
        speakers[currentSpeaker] = [];
      }
      const content = sentence.replace(/^(You|Them):/, '').trim();
      if (content) {
        speakers[currentSpeaker].push(content);
      }
    } else if (currentSpeaker && sentence.trim()) {
      speakers[currentSpeaker].push(sentence);
    }
  }
  
  // Detect greeting patterns
  const greetingWords = ['hi', 'hello', 'hey', 'greetings', 'good morning', 'good afternoon', 'good evening'];
  const hasGreetings = Object.values(speakers).some(messages => 
    messages.some(msg => 
      greetingWords.some(word => msg.toLowerCase().includes(word))
    )
  );
  
  // Detect question patterns
  const questionWords = ['what', 'when', 'where', 'who', 'why', 'how', 'can', 'could', 'would', 'should', 'is', 'are'];
  const hasQuestions = Object.values(speakers).some(messages => 
    messages.some(msg => 
      questionWords.some(word => msg.toLowerCase().includes(word + ' ')) || msg.includes('?')
    )
  );
  
  // Detect topic keywords
  const topicKeywords = {
    work: ['work', 'job', 'meeting', 'project', 'boss', 'company', 'office', 'client', 'deadline'],
    personal: ['family', 'friend', 'home', 'life', 'weekend', 'health', 'feeling'],
    planning: ['plan', 'schedule', 'tomorrow', 'next week', 'weekend', 'meet', 'visit'],
    technical: ['code', 'program', 'software', 'hardware', 'issue', 'problem', 'bug', 'fix'],
    social: ['party', 'event', 'fun', 'hang out', 'drinks', 'dinner', 'lunch', 'movie']
  };
  
  const detectedTopics = [];
  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    for (const keyword of keywords) {
      if (text.toLowerCase().includes(keyword)) {
        detectedTopics.push(topic);
        break;
      }
    }
  }
  
  // Analyze message frequency by speaker
  const messageCount = {};
  for (const speaker in speakers) {
    messageCount[speaker] = speakers[speaker].length;
  }
  
  // Build the summary
  let summary = '';
  
  if (hasGreetings) {
    summary += 'The conversation started with greetings. ';
  }
  
  if (hasQuestions) {
    summary += 'Questions were exchanged during the conversation. ';
  }
  
  if (detectedTopics.length > 0) {
    const uniqueTopics = [...new Set(detectedTopics)];
    summary += `Topics discussed included ${uniqueTopics.join(', ')}. `;
  }
  
  // Add message count
  if (Object.keys(messageCount).length > 0) {
    const counts = Object.entries(messageCount)
      .map(([speaker, count]) => `${speaker} sent ${count} messages`)
      .join(' and ');
    
    summary += counts + '. ';
  }
  
  // Add key points by extracting important sentences
  const importantSentences = [];
  const sentenceScores = {};
  
  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i].trim();
    if (!sentence) continue;
    
    // Weight by position (later sentences are often more important)
    const positionScore = i / sentences.length;
    
    // Weight by length (not too short, not too long)
    const lengthScore = Math.min(sentence.length / 100, 1) * 0.5;
    
    // Weight by importance keywords
    const importanceKeywords = ['important', 'key', 'main', 'critical', 'essential', 'need', 'must', 'should', 'agree'];
    const keywordScore = importanceKeywords.some(keyword => sentence.toLowerCase().includes(keyword)) ? 0.3 : 0;
    
    // Combine scores
    sentenceScores[sentence] = positionScore + lengthScore + keywordScore;
  }
  
  // Get top 2-3 sentences by score
  const sortedSentences = Object.entries(sentenceScores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(entry => entry[0]);
  
  if (sortedSentences.length > 0) {
    summary += 'Key points: ' + sortedSentences.join(' ');
  }
  
  return summary || "This conversation contained messages between multiple parties.";
};