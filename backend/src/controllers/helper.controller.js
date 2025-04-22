// Predefined responses for common questions
const RESPONSES = {
  greetings: [
    "Hello! I'm Helper, your chat assistant. How can I help you today?",
    "Hi there! I'm Helper. What do you need help with?",
    "Greetings! I'm your Helper assistant. What questions do you have?"
  ],
  
  features: [
    "Chatterpillar offers real-time messaging, group chats, profile customization, theme settings, message reactions, voice messages, document sharing, and more!"
  ],
  
  groups: [
    "To create a group: 1) Go to the 'Group Chats' tab on the home page, 2) Click the '+' button, 3) Fill in the group name, optional description, and select members, 4) Click 'Create Group'"
  ],
  
  profile: [
    "You can update your profile by clicking on the 'Profile' button in the navigation bar. From there, you can change your profile picture by clicking on the camera icon."
  ],
  
  themes: [
    "To change the app theme, go to Settings and select one of the 30+ available themes. The app offers light, dark, and colorful options to match your style."
  ],
  
  messages: [
    "You can send text messages, images, documents, voice recordings, and even reactions to messages. In group chats, you can also create polls."
  ],
  
  offline: [
    "The app shows online/offline status for all users. Look for the green dot next to a user's avatar to see if they're online."
  ],
  
  troubleshooting: [
    "If you're experiencing issues, try refreshing the page, checking your internet connection, or logging out and back in. If problems persist, please contact our support team."
  ],
  
  jokes: [
    "Why don't scientists trust atoms? Because they make up everything!",
    "Why did the scarecrow win an award? Because he was outstanding in his field!",
    "What do you call a fake noodle? An impasta!",
    "Why couldn't the bicycle stand up by itself? It was two tired!"
  ],
  
  fallback: [
    "I'm a simple helper and don't have information about that. I can help with app features, creating groups, profile settings, and basic questions.",
    "I don't have specific information about that. Is there something else I can help you with regarding the chat app?",
    "I'm not able to answer that question. I can help with how to use the app features though!"
  ]
};

// Match user input to response categories
const findResponseCategory = (message) => {
  const lowerMessage = message.toLowerCase();
  
  if (/^(hi|hello|hey|greetings|howdy|hola)/i.test(lowerMessage)) {
    return 'greetings';
  }
  
  if (/feature|what can|what.*do|capabilities|functions/i.test(lowerMessage)) {
    return 'features';
  }
  
  if (/create.*group|start.*group|new group|group chat|add.*group/i.test(lowerMessage)) {
    return 'groups';
  }
  
  if (/profile|picture|avatar|photo|change.*name|update.*profile/i.test(lowerMessage)) {
    return 'profile';
  }
  
  if (/theme|color|appearance|dark|light|look|style/i.test(lowerMessage)) {
    return 'themes';
  }
  
  if (/send|message|attachment|image|document|voice|reaction|emoji/i.test(lowerMessage)) {
    return 'messages';
  }
  
  if (/online|offline|status|available|presence/i.test(lowerMessage)) {
    return 'offline';
  }
  
  if (/problem|issue|error|not working|bug|fix|help me/i.test(lowerMessage)) {
    return 'troubleshooting';
  }
  
  if (/joke|funny|laugh|humor|tell me a joke/i.test(lowerMessage)) {
    return 'jokes';
  }
  
  return 'fallback';
};

// Get a random response from a category
const getRandomResponse = (category) => {
  const responses = RESPONSES[category] || RESPONSES.fallback;
  const randomIndex = Math.floor(Math.random() * responses.length);
  return responses[randomIndex];
};

export const sendMessageToHelper = async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user._id;

    if (!message) {
      return res.status(400).json({ message: "Message is required" });
    }

    // Find appropriate response category
    const category = findResponseCategory(message);
    const response = getRandomResponse(category);

    // Create response object
    const responseObj = {
      query: message,
      response: response,
      timestamp: new Date(),
    };

    res.status(200).json(responseObj);
  } catch (error) {
    console.error("Error in helper:", error);
    res.status(500).json({ message: "Helper error", error: error.message });
  }
};

export const getChatHistory = async (req, res) => {
  try {
    // In a full implementation, we would fetch chat history from database
    // For now, just return a success message
    res.status(200).json({ message: "Chat history feature not implemented yet" });
  } catch (error) {
    console.error("Error getting chat history:", error);
    res.status(500).json({ message: "Error fetching chat history" });
  }
};