// Create a new file: backend/src/lib/conversationContext.js

/**
 * Utility for analyzing conversation context to improve smart replies
 */

// Constants for conversation topics
export const TOPICS = {
  GENERAL: 'general',
  WORK: 'work',
  SOCIAL: 'social',
  PLANNING: 'planning',
  TECHNICAL: 'technical',
  SUPPORT: 'support',
  PERSONAL: 'personal'
};

// Topic detection rules
const topicPatterns = {
  [TOPICS.WORK]: [
    /\b(work|job|office|meeting|project|deadline|task|client|boss|colleague|report|presentation|email)\b/i,
    /\b(assignment|manager|team|company|business|corporate|interview|resume|career|promotion)\b/i
  ],
  [TOPICS.SOCIAL]: [
    /\b(party|hang out|drinks|dinner|lunch|coffee|movie|concert|event|fun|weekend|friend)\b/i,
    /\b(dating|relationship|tinder|bumble|match|date|girlfriend|boyfriend|partner|spouse|marry|wedding)\b/i
  ],
  [TOPICS.PLANNING]: [
    /\b(plan|schedule|calendar|agenda|tomorrow|next week|upcoming|future|soon|later|event|organize)\b/i,
    /\b(prepare|arrangement|booking|reservation|ticket|flight|hotel|trip|travel|vacation|holiday)\b/i
  ],
  [TOPICS.TECHNICAL]: [
    /\b(code|bug|error|server|database|website|app|software|hardware|computer|laptop|phone|tech)\b/i,
    /\b(programming|developer|engineer|IT|javascript|python|java|css|html|api|framework|library)\b/i
  ],
  [TOPICS.SUPPORT]: [
    /\b(help|support|issue|problem|trouble|error|fix|solve|resolution|solution|assist|guidance)\b/i,
    /\b(not working|broken|won't|can't|doesn't|failed|stuck|crash|glitch|bug|error message)\b/i
  ],
  [TOPICS.PERSONAL]: [
    /\b(feel|feeling|health|family|home|house|apartment|car|personal|private|secret|confidential)\b/i,
    /\b(sick|ill|doctor|hospital|medication|therapy|stress|anxiety|depression|mental health)\b/i
  ]
};

/**
 * Analyze conversation messages to detect topics and context
 * @param {Array} messages - Array of message objects with text content
 * @return {Object} Conversation context data
 */
export const analyzeConversationContext = (messages) => {
  if (!Array.isArray(messages) || messages.length === 0) {
    return {
      mainTopic: TOPICS.GENERAL,
      recentTopic: TOPICS.GENERAL,
      confidence: 0.5,
      messageCount: 0
    };
  }
  
  // Count topic occurrences across all messages
  const topicCounts = {};
  let totalMessages = 0;
  
  // Consider only text messages
  const textMessages = messages.filter(msg => msg.text && typeof msg.text === 'string');
  
  textMessages.forEach(message => {
    const text = message.text.toLowerCase();
    totalMessages++;
    
    // Check each topic pattern for matches
    for (const [topic, patterns] of Object.entries(topicPatterns)) {
      // Check all regex patterns for this topic
      const hasMatch = patterns.some(pattern => pattern.test(text));
      
      if (hasMatch) {
        topicCounts[topic] = (topicCounts[topic] || 0) + 1;
      }
    }
  });
  
  // Determine main topic - the one with highest occurrences
  let mainTopic = TOPICS.GENERAL;
  let maxCount = 0;
  
  for (const [topic, count] of Object.entries(topicCounts)) {
    if (count > maxCount) {
      maxCount = count;
      mainTopic = topic;
    }
  }
  
  // Calculate confidence level
  const confidence = totalMessages > 0 ? (maxCount / totalMessages) : 0.5;
  
  // Get most recent non-empty messages
  const recentMessages = textMessages.slice(-3);
  
  // Analyze most recent message for immediate context
  let recentTopic = TOPICS.GENERAL;
  
  if (recentMessages.length > 0) {
    const latestMessage = recentMessages[recentMessages.length - 1];
    
    if (latestMessage && latestMessage.text) {
      for (const [topic, patterns] of Object.entries(topicPatterns)) {
        if (patterns.some(pattern => pattern.test(latestMessage.text.toLowerCase()))) {
          recentTopic = topic;
          break;
        }
      }
    }
  }
  
  return {
    mainTopic,
    recentTopic,
    confidence,
    messageCount: totalMessages,
    recentMessages: recentMessages.map(msg => msg.text)
  };
};

/**
 * Generate topic-specific smart replies based on conversation context
 * @param {string} topic - Detected conversation topic
 * @return {Array} Array of topic-specific reply suggestions
 */
export const getTopicSpecificReplies = (topic) => {
  const topicReplies = {
    [TOPICS.WORK]: [
      "Let's schedule a meeting to discuss this.",
      "I can send you the report by end of day.",
      "Should we loop in the team on this?",
      "What's our timeline for this project?",
      "I'll follow up with an email about this."
    ],
    [TOPICS.SOCIAL]: [
      "That sounds fun, I'd love to join!",
      "What time should we meet up?",
      "Who else is coming?",
      "I'm free this weekend if you want to hang out.",
      "Let's make it happen!"
    ],
    [TOPICS.PLANNING]: [
      "Let me check my calendar.",
      "What date works best for you?",
      "I'm available next week.",
      "Should we make a reservation?",
      "Let's finalize the details soon."
    ],
    [TOPICS.TECHNICAL]: [
      "Have you tried restarting it?",
      "Can you share your screen so I can see the error?",
      "What version are you running?",
      "Let me know if the issue persists.",
      "I'll help you troubleshoot this."
    ],
    [TOPICS.SUPPORT]: [
      "I'll help you resolve this issue.",
      "Can you provide more details about the problem?",
      "Let me know if that fixes it.",
      "Have you tried the steps I suggested?",
      "I can walk you through the solution."
    ],
    [TOPICS.PERSONAL]: [
      "I hope you feel better soon.",
      "That's great news!",
      "I'm here if you need to talk more.",
      "Take care of yourself.",
      "Let me know if there's anything I can do to help."
    ],
    [TOPICS.GENERAL]: [
      "Sounds good!",
      "I understand.",
      "Let me know your thoughts.",
      "Keep me updated.",
      "Let's discuss this more."
    ]
  };
  
  return topicReplies[topic] || topicReplies[TOPICS.GENERAL];
};