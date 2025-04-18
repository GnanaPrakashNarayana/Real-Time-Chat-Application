// Helper function to get contextual replies based on message content
const generateSmartReplies = (message) => {
    if (!message) return [];
    
    const messageText = message.toLowerCase();
    
    // Default responses if no specific pattern matches
    const defaultReplies = [
      "Sounds good!",
      "Thanks for sharing.",
      "That's interesting.",
      "Got it.",
      "I see."
    ];
    
    // Checking for common patterns in messages and providing contextual replies
    if (messageText.includes('hello') || messageText.includes('hi') || messageText.includes('hey')) {
      return [
        "Hi there! How are you?",
        "Hello! Nice to hear from you.",
        "Hey! What's up?"
      ];
    }
    
    if (messageText.includes('how are you') || messageText.includes('how\'s it going')) {
      return [
        "I'm doing well, thanks for asking!",
        "All good here, how about you?",
        "Great! How about yourself?"
      ];
    }
    
    if (messageText.includes('thank')) {
      return [
        "You're welcome!",
        "No problem at all.",
        "Happy to help!"
      ];
    }
    
    if (messageText.includes('sorry')) {
      return [
        "No worries!",
        "It's alright.",
        "Don't worry about it."
      ];
    }
    
    if (messageText.includes('bye') || messageText.includes('goodbye') || messageText.includes('see you')) {
      return [
        "Bye! Talk to you later.",
        "See you soon!",
        "Take care!"
      ];
    }
    
    if (messageText.includes('time')) {
      return [
        "I'm flexible with time.",
        "What time works for you?",
        "I'm available whenever."
      ];
    }
    
    if (messageText.includes('help') || messageText.includes('support')) {
      return [
        "I'd be happy to help!",
        "What do you need help with?",
        "Let me know how I can assist."
      ];
    }
    
    if (messageText.includes('meeting') || messageText.includes('call')) {
      return [
        "I'm available for a meeting.",
        "Let's schedule a call.",
        "When would be a good time?"
      ];
    }
    
    if (messageText.includes('weekend') || messageText.includes('holiday')) {
      return [
        "Hope you have a great time!",
        "Enjoy your break!",
        "Sounds fun!"
      ];
    }
    
    if (messageText.includes('project') || messageText.includes('work')) {
      return [
        "How's the project coming along?",
        "Need any help with that?",
        "Sounds like good progress."
      ];
    }
    
    if (messageText.includes('agree')) {
      return [
        "Glad we're on the same page.",
        "I think so too.",
        "Absolutely!"
      ];
    }
    
    if (messageText.includes('disagree') || messageText.includes('not sure')) {
      return [
        "I understand your perspective.",
        "Let's discuss this further.",
        "I see your point."
      ];
    }
    
    if (messageText.includes('idea') || messageText.includes('suggestion')) {
      return [
        "That's a great idea!",
        "I like your thinking.",
        "Let's explore that."
      ];
    }
    
    if (messageText.includes('question')) {
      return [
        "Happy to answer.",
        "What would you like to know?",
        "I'll try my best to help."
      ];
    }
    
    // If no specific pattern matches, return the default replies
    return defaultReplies;
  };
  
  export const getSmartReplies = async (req, res) => {
    try {
      const { message } = req.body;
      
      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }
      
      const smartReplies = generateSmartReplies(message);
      
      res.status(200).json({ replies: smartReplies });
    } catch (error) {
      console.error("Error in getSmartReplies controller:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };