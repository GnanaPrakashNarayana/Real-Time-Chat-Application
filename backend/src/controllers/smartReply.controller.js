import { generateSmartRepliesByIntent } from "../lib/messageAnalysis.js";
import { analyzeConversationContext, getTopicSpecificReplies } from "../lib/conversationContext.js";
import { generateSmartReplies } from "../services/aiService.js";
// backend/src/controllers/smartReply.controller.js

// Enhanced message analysis and smart reply generation
const generateSmartReplies = (message) => {
  if (!message) return [];
  
  const messageText = message.toLowerCase().trim();
  
  // Message type identification patterns
  const patterns = {
    greeting: /\b(hi|hello|hey|greetings|howdy)\b/i,
    howAreYou: /\b(how are you|how've you been|how('s| is| are) (it going|things|life)|what's up|how('s| is) everything|how('s| have) you been)\b/i,
    thanks: /\b(thank(s| you)|appreciate|grateful|gracias|thx)\b/i,
    apology: /\b(sorry|apologize|forgive|regret|apologies)\b/i,
    goodbye: /\b(bye|goodbye|see you|talk (to you|later)|catch you later|farewell|until next time|later)\b/i,
    timeQuery: /\b(when|what time|schedule|available|free|meet|meeting|call)\b/i,
    helpRequest: /\b(help|assist|support|guide|how (to|do|can)|can you|would you|advice|advise)\b/i,
    opinion: /\b(what (do|should|would|could) you think|your (thoughts|opinion|take)|how (do|would|could) you feel)\b/i,
    invitation: /\b(join|come|attend|invite|party|event|meeting|gathering)\b/i,
    compliment: /\b(nice|good|great|awesome|excellent|amazing|wonderful|cool|impressive|beautiful|pretty|handsome)\b/i,
    agreement: /\b(agree|yes|absolutely|definitely|certainly|indeed|exactly|correct)\b/i,
    disagreement: /\b(disagree|no|nope|not really|i don't think so|incorrect)\b/i,
    suggestion: /\b(suggest|recommend|idea|proposal|how about|perhaps|maybe|consider)\b/i
  };
  
  // Helper function to check message against a pattern
  const matchesPattern = (pattern) => pattern.test(messageText);
  
  // Specific reply generator based on message context
  if (matchesPattern(patterns.howAreYou)) {
    return [
      "I'm doing great, thanks for asking!",
      "Been busy but good, how about you?",
      "Not bad at all, thanks!",
      "Pretty well, thanks for asking!",
      "All good here, how are you?"
    ];
  }
  
  if (matchesPattern(patterns.greeting)) {
    return [
      "Hi there! How are you?",
      "Hello! Great to hear from you.",
      "Hey! What's up?",
      "Hi! How's your day going?",
      "Hello! How have you been?"
    ];
  }
  
  if (matchesPattern(patterns.thanks)) {
    return [
      "You're welcome!",
      "Happy to help!",
      "No problem at all!",
      "Anytime!",
      "My pleasure!"
    ];
  }
  
  if (matchesPattern(patterns.apology)) {
    return [
      "No worries at all!",
      "It's completely fine.",
      "Don't worry about it!",
      "That's alright, no problem.",
      "No need to apologize!"
    ];
  }
  
  if (matchesPattern(patterns.goodbye)) {
    return [
      "Talk to you later!",
      "Bye! Have a great day!",
      "See you soon!",
      "Take care!",
      "Catch you later!"
    ];
  }
  
  if (matchesPattern(patterns.timeQuery)) {
    return [
      "I'm free tomorrow afternoon.",
      "How about next week?",
      "I can meet anytime Thursday.",
      "What time works for you?",
      "My schedule is flexible."
    ];
  }
  
  if (matchesPattern(patterns.helpRequest)) {
    return [
      "I'd be happy to help!",
      "What can I help you with exactly?",
      "Sure, I can assist with that.",
      "I'll do my best to help.",
      "Let me know what you need."
    ];
  }
  
  if (matchesPattern(patterns.opinion)) {
    return [
      "I think that sounds good.",
      "That's an interesting perspective.",
      "I'd need to think about that more.",
      "I see both sides of that.",
      "That makes sense to me."
    ];
  }
  
  if (matchesPattern(patterns.invitation)) {
    return [
      "I'd love to join!",
      "Thanks for the invite!",
      "What time should I be there?",
      "Sounds fun, count me in!",
      "I'll check my schedule and let you know."
    ];
  }
  
  if (matchesPattern(patterns.compliment)) {
    return [
      "Thank you so much!",
      "That's very kind of you!",
      "I appreciate that!",
      "Thanks! That means a lot.",
      "You're too kind!"
    ];
  }
  
  if (matchesPattern(patterns.agreement)) {
    return [
      "Glad we're on the same page!",
      "I think so too.",
      "Absolutely!",
      "Exactly my thoughts!",
      "Couldn't agree more."
    ];
  }
  
  if (matchesPattern(patterns.disagreement)) {
    return [
      "I see your point.",
      "Let's discuss this further.",
      "I understand your perspective.",
      "We might need to compromise.",
      "I respect your opinion."
    ];
  }
  
  if (matchesPattern(patterns.suggestion)) {
    return [
      "That's a great idea!",
      "I like your thinking.",
      "That could work well.",
      "Let's try that approach.",
      "I'm open to your suggestion."
    ];
  }
  
  // Analyze content with basic NLP
  const wordsInMessage = messageText.split(/\s+/);
  const questionWords = ['what', 'when', 'where', 'who', 'why', 'how', 'is', 'are', 'was', 'were', 'will', 'would', 'can', 'could'];
  const isQuestion = questionWords.some(word => wordsInMessage.includes(word)) || messageText.endsWith('?');
  
  // Default contextual replies based on message characteristics
  if (isQuestion) {
    return [
      "Let me think about that.",
      "That's a good question.",
      "I'm not quite sure, honestly.",
      "Interesting question!",
      "I'll have to consider that."
    ];
  }
  
  // Default engagement responses
  return [
    "Thanks for sharing that.",
    "I appreciate your message.",
    "I understand.",
    "Interesting perspective.",
    "Tell me more about that."
  ];
};

export const getSmartReplies = async (req, res) => {
  try {
    const { message, context } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }
    
    // Generate smart replies with context if available
    const messageToAnalyze = typeof message === 'string' ? message : '';
    const smartReplies = generateSmartRepliesByIntent(messageToAnalyze);
    
    // Log performance metrics in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`Generated ${smartReplies.length} smart replies for message: "${messageToAnalyze.substring(0, 30)}..."`);
    }
    
    res.status(200).json({ 
      replies: smartReplies,
      success: true
    });
  } catch (error) {
    console.error("Error in getSmartReplies controller:", error);
    res.status(500).json({ error: "Internal server error", details: error.message });
  }
};

export const getSmartRepliesWithContext = async (req, res) => {
  try {
    const { message, previousMessages } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }
    
    // Generate standard replies based on current message
    const baseReplies = generateSmartRepliesByIntent(message);
    
    // If we have previous messages, enhance with context
    if (Array.isArray(previousMessages) && previousMessages.length > 0) {
      // Format messages for context analysis
      const formattedMessages = previousMessages.map(text => ({ text }));
      
      // Add current message
      formattedMessages.push({ text: message });
      
      // Analyze conversation context
      const context = analyzeConversationContext(formattedMessages);
      
      // Get topic-specific replies
      const topicReplies = getTopicSpecificReplies(context.recentTopic);
      
      // Combine replies based on confidence
      let combinedReplies = [];
      
      // If high confidence in topic, prioritize topic replies
      if (context.confidence > 0.7) {
        combinedReplies = [...topicReplies, ...baseReplies];
      } else {
        // Mix replies based on confidence
        const topicReplyCount = Math.ceil(context.confidence * 5); // 0-5 based on confidence
        combinedReplies = [
          ...topicReplies.slice(0, topicReplyCount),
          ...baseReplies
        ];
      }
      
      // Deduplicate and limit to 5
      const uniqueReplies = [...new Set(combinedReplies)].slice(0, 5);
      
      return res.status(200).json({ 
        replies: uniqueReplies,
        success: true,
        context: {
          topic: context.recentTopic,
          confidence: context.confidence
        }
      });
    }
    
    // If no context, just return base replies
    res.status(200).json({ 
      replies: baseReplies,
      success: true 
    });
  } catch (error) {
    console.error("Error in getSmartRepliesWithContext controller:", error);
    res.status(500).json({ error: "Internal server error", details: error.message });
  }
};