// backend/src/services/aiService.js
import { Configuration, OpenAIApi } from 'openai';

// Initialize with your API key
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

export const generateSmartReplies = async (currentMessage, previousMessages = []) => {
  try {
    // Format conversation history for the AI
    const conversationHistory = previousMessages.map(msg => {
      const role = msg.senderId === currentMessage.receiverId ? 'user' : 'assistant';
      return { role, content: msg.text || '' };
    });

    // Add the most recent message
    conversationHistory.push({ role: 'user', content: currentMessage.text || '' });

    // Call the API with a specific prompt
    const response = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "Generate 3-5 short, natural smart reply options that a person might use to respond to this conversation. Each reply should be 1-8 words, appropriate to the context, and varied in tone. Return only the replies as a JSON array of strings." },
        ...conversationHistory
      ],
      temperature: 0.7,
      max_tokens: 150,
    });

    // Parse and return the replies
    const content = response.data.choices[0].message.content;
    try {
      // Try to parse as JSON first
      return JSON.parse(content);
    } catch (e) {
      // Fallback to simple text parsing
      return content.split('\n')
        .map(line => line.replace(/^[0-9-.\s"']+/, '').trim())
        .filter(line => line.length > 0 && line.length < 40)
        .slice(0, 5);
    }
  } catch (error) {
    console.error('Error generating smart replies:', error);
    // Return fallback replies
    return [
      "I see",
      "Thanks for sharing",
      "Interesting",
      "Tell me more",
      "Got it"
    ];
  }
};