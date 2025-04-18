// backend/src/lib/messageAnalysis.js

/**
 * Advanced message analysis for better smart reply generation
 */

// Message intent categories
const INTENT = {
    GREETING: 'greeting',
    QUESTION: 'question',
    STATEMENT: 'statement',
    REQUEST: 'request',
    FAREWELL: 'farewell',
    GRATITUDE: 'gratitude',
    APOLOGY: 'apology',
    AGREEMENT: 'agreement',
    DISAGREEMENT: 'disagreement',
    SENTIMENT_POSITIVE: 'sentiment_positive',
    SENTIMENT_NEGATIVE: 'sentiment_negative',
    SENTIMENT_NEUTRAL: 'sentiment_neutral',
  };
  
  // Helper function to check for word patterns
  const containsAny = (text, wordList) => {
    const regex = new RegExp(`\\b(${wordList.join('|')})\\b`, 'i');
    return regex.test(text);
  };
  
  // Detect message intent
  const detectIntent = (message) => {
    const text = message.toLowerCase();
    const intents = [];
    
    // Detect greeting
    if (containsAny(text, ['hi', 'hello', 'hey', 'greetings', 'good morning', 'good afternoon', 'good evening'])) {
      intents.push(INTENT.GREETING);
    }
    
    // Detect question
    if (text.includes('?') || 
        containsAny(text, ['who', 'what', 'when', 'where', 'why', 'how', 'is', 'are', 'can', 'could', 'would', 'will', 'do'])) {
      intents.push(INTENT.QUESTION);
    }
    
    // Detect request
    if (containsAny(text, ['please', 'could you', 'would you', 'can you', 'help', 'need', 'want', 'request'])) {
      intents.push(INTENT.REQUEST);
    }
    
    // Detect farewell
    if (containsAny(text, ['bye', 'goodbye', 'see you', 'later', 'talk to you', 'farewell'])) {
      intents.push(INTENT.FAREWELL);
    }
    
    // Detect gratitude
    if (containsAny(text, ['thanks', 'thank you', 'appreciate', 'grateful', 'thx'])) {
      intents.push(INTENT.GRATITUDE);
    }
    
    // Detect apology
    if (containsAny(text, ['sorry', 'apologize', 'apologies', 'regret', 'forgive'])) {
      intents.push(INTENT.APOLOGY);
    }
    
    // Detect agreement
    if (containsAny(text, ['agree', 'yes', 'correct', 'right', 'exactly', 'precisely', 'absolutely'])) {
      intents.push(INTENT.AGREEMENT);
    }
    
    // Detect disagreement
    if (containsAny(text, ['disagree', 'no', 'incorrect', 'wrong', 'not', 'don\'t think'])) {
      intents.push(INTENT.DISAGREEMENT);
    }
    
    // Simple sentiment analysis
    const positiveWords = ['good', 'great', 'awesome', 'wonderful', 'fantastic', 'excellent', 'happy', 'glad', 'pleased', 'excited'];
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'sad', 'unhappy', 'disappointed', 'upset', 'sorry', 'problem'];
    
    const positiveCount = positiveWords.filter(word => text.includes(word)).length;
    const negativeCount = negativeWords.filter(word => text.includes(word)).length;
    
    if (positiveCount > negativeCount) {
      intents.push(INTENT.SENTIMENT_POSITIVE);
    } else if (negativeCount > positiveCount) {
      intents.push(INTENT.SENTIMENT_NEGATIVE);
    } else {
      intents.push(INTENT.SENTIMENT_NEUTRAL);
    }
    
    // If no specific intents detected, mark as a statement
    if (intents.length === 0 || (intents.length === 1 && intents[0].startsWith('sentiment_'))) {
      intents.push(INTENT.STATEMENT);
    }
    
    return intents;
  };
  
  // Generate smart replies based on message intent
  const generateSmartRepliesByIntent = (message) => {
    const intents = detectIntent(message);
    const allReplies = [];
    
    // Replies for each intent
    const intentReplies = {
      [INTENT.GREETING]: [
        "Hi there! How are you?",
        "Hello! Great to hear from you.",
        "Hey! What's up?",
        "Hello! How's your day going?",
        "Hi! How have you been?"
      ],
      [INTENT.QUESTION]: [
        "Let me think about that.",
        "Good question!",
        "I'd say yes.",
        "Probably not, but let me consider.",
        "I'm not entirely sure."
      ],
      [INTENT.STATEMENT]: [
        "I see what you mean.",
        "That makes sense.",
        "I understand.",
        "Interesting point.",
        "I hear you."
      ],
      [INTENT.REQUEST]: [
        "I'd be happy to help!",
        "Sure, I can do that.",
        "Let me see what I can do.",
        "I'll try my best.",
        "No problem, I'll help."
      ],
      [INTENT.FAREWELL]: [
        "Talk to you later!",
        "Bye! Have a great day!",
        "See you soon!",
        "Take care!",
        "Catch you later!"
      ],
      [INTENT.GRATITUDE]: [
        "You're welcome!",
        "Happy to help!",
        "No problem at all!",
        "Anytime!",
        "My pleasure!"
      ],
      [INTENT.APOLOGY]: [
        "No worries at all!",
        "It's completely fine.",
        "Don't worry about it!",
        "That's alright.",
        "No need to apologize!"
      ],
      [INTENT.AGREEMENT]: [
        "Glad we're on the same page!",
        "I think so too.",
        "Absolutely!",
        "Exactly my thoughts!",
        "Couldn't agree more."
      ],
      [INTENT.DISAGREEMENT]: [
        "I see your point of view.",
        "Let's discuss this further.",
        "I understand your perspective.",
        "We might need to find common ground.",
        "I respect your opinion."
      ],
      [INTENT.SENTIMENT_POSITIVE]: [
        "That's great to hear!",
        "I'm glad!",
        "Sounds wonderful!",
        "That's excellent!",
        "I'm happy for you!"
      ],
      [INTENT.SENTIMENT_NEGATIVE]: [
        "I'm sorry to hear that.",
        "That sounds tough.",
        "Is there anything I can do?",
        "I hope things get better.",
        "I'm here if you need to talk."
      ],
      [INTENT.SENTIMENT_NEUTRAL]: [
        "Interesting.",
        "I see.",
        "Thanks for sharing.",
        "Tell me more.",
        "Good to know."
      ]
    };
    
    // Specific handling for common questions
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.match(/how('s| is| are) (it going|things|life)|how('s| have) you been|how are you|what's up/i)) {
      return [
        "I'm doing great, thanks for asking!",
        "Been busy but good, how about you?",
        "Not bad at all, thanks!",
        "Pretty well, thanks for asking!",
        "All good here, how are you?"
      ];
    }
    
    // Add replies for each detected intent
    intents.forEach(intent => {
      if (intentReplies[intent]) {
        allReplies.push(...intentReplies[intent]);
      }
    });
    
    // If we have replies, return a selection of them
    if (allReplies.length > 0) {
      // Remove duplicates
      const uniqueReplies = [...new Set(allReplies)];
      
      // Shuffle and return up to 5 replies
      return uniqueReplies
        .sort(() => 0.5 - Math.random())
        .slice(0, 5);
    }
    
    // Fallback default replies
    return [
      "I see.",
      "Interesting.",
      "Thanks for sharing.",
      "Got it.",
      "Tell me more about that."
    ];
  };
  
  module.exports = {
    detectIntent,
    generateSmartRepliesByIntent,
    INTENT
  };