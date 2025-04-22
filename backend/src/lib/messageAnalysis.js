// Updated version of backend/src/lib/messageAnalysis.js
/**
 * Advanced message analysis for better smart reply generation
 */

// Message intent categories with expanded types
export const INTENT = {
    GREETING: 'greeting',
    QUESTION: 'question',
    STATEMENT: 'statement',
    REQUEST: 'request',
    FAREWELL: 'farewell',
    GRATITUDE: 'gratitude',
    APOLOGY: 'apology',
    AGREEMENT: 'agreement',
    DISAGREEMENT: 'disagreement',
    PLANNING: 'planning',      // New intent
    INVITATION: 'invitation',  // New intent
    COMPLIMENT: 'compliment',  // New intent
    CONCERN: 'concern',        // New intent
    SENTIMENT_POSITIVE: 'sentiment_positive',
    SENTIMENT_NEGATIVE: 'sentiment_negative',
    SENTIMENT_NEUTRAL: 'sentiment_neutral',
  };
  
  // Enhanced helper function for robust pattern matching
  const matchPattern = (text, pattern, threshold = 0.7) => {
    if (!text || typeof text !== 'string') return false;
    text = text.toLowerCase().trim();
    
    // For regex patterns
    if (pattern instanceof RegExp) {
        return pattern.test(text);
    }
    
    // For word lists with fuzzy matching
    if (Array.isArray(pattern)) {
        for (const word of pattern) {
            if (text.includes(word.toLowerCase())) {
                return true;
            }
        }
    }
    
    return false;
  };
  
  // Improved context handling
  const extractContext = (text) => {
    const contexts = {
        time: /\b(today|tomorrow|yesterday|weekend|week|month|year|soon|later|now|at \d+|\d+ (am|pm)|morning|afternoon|evening|night)\b/i,
        location: /\b(at|in|near|around|location|place|here|there|home|office|work|school)\b/i,
        people: /\b(we|us|they|them|everyone|everybody|someone|anybody|people|person|friend|family|colleague|with \w+)\b/i,
        event: /\b(meeting|party|call|event|appointment|celebration|gathering|wedding|birthday|conference)\b/i,
    };
    
    const foundContexts = {};
    
    for (const [type, regex] of Object.entries(contexts)) {
        const matches = text.match(regex);
        if (matches) {
            foundContexts[type] = matches[0];
        }
    }
    
    return foundContexts;
  };
  
  // Core intent detection with confidence scores
  export const detectIntent = (message) => {
    if (!message || typeof message !== 'string') {
        return {
          intents: [{ type: INTENT.STATEMENT, confidence: 0.5 }],
          context: {},
          topIntent: INTENT.STATEMENT
        };
    }
    
    const text = message.toLowerCase().trim();
    const results = [];
    const context = extractContext(text);
    
    // Key patterns for each intent type
    const patterns = {
        [INTENT.GREETING]: {
            patterns: [
                /\b(hi|hello|hey|greetings|good morning|good afternoon|good evening|howdy|yo|hiya|what'?s up|sup)\b/i,
                ['hi', 'hello', 'hey', 'morning', 'afternoon', 'evening', 'greetings']
            ],
            weight: 0.9
        },
        [INTENT.QUESTION]: {
            patterns: [
                /\?\s*$|\b(who|what|when|where|why|how|is|are|was|were|will|would|can|could|do|does|did|should|shall|may|might|has|have)\b.*\?/i,
                ['who', 'what', 'when', 'where', 'why', 'how', '?']
            ],
            weight: 0.85
        },
        [INTENT.REQUEST]: {
            patterns: [
                /\b(please|pls|plz|can you|could you|would you|will you|help|need|want|looking for)\b/i,
                ['please', 'need', 'want', 'help', 'request', 'assist']
            ],
            weight: 0.8
        },
        [INTENT.FAREWELL]: {
            patterns: [
                /\b(bye|goodbye|see you|talk to you later|ttyl|cya|have a good|good night|catch you later|farewell|until next time)\b/i,
                ['bye', 'goodbye', 'farewell', 'later', 'see you']
            ],
            weight: 0.9
        },
        [INTENT.GRATITUDE]: {
            patterns: [
                /\b(thanks|thank you|thx|appreciate|grateful|ty|thanking)\b/i,
                ['thanks', 'thank', 'appreciate', 'grateful']
            ],
            weight: 0.9
        },
        [INTENT.APOLOGY]: {
            patterns: [
                /\b(sorry|apologize|apologies|regret|forgive|my bad|my fault|I apologize)\b/i,
                ['sorry', 'apologize', 'apologies', 'regret']
            ],
            weight: 0.9
        },
        [INTENT.AGREEMENT]: {
            patterns: [
                /\b(agree|yes|yep|yeah|sure|absolutely|definitely|correct|right|exactly|indeed|of course|got it)\b/i,
                ['agree', 'yes', 'correct', 'right', 'sure']
            ],
            weight: 0.8
        },
        [INTENT.DISAGREEMENT]: {
            patterns: [
                /\b(disagree|no|nope|nah|not|don't think so|cannot|can't|won't|shouldn't|wouldn't|incorrect|wrong)\b/i,
                ['disagree', 'no', 'not', 'incorrect', 'wrong']
            ],
            weight: 0.8
        },
        [INTENT.PLANNING]: {
            patterns: [
                /\b(plan|schedule|will|would|going to|later|soon|tomorrow|next|upcoming|future|calendar|agenda)\b/i,
                ['plan', 'schedule', 'will', 'would', 'going', 'later']
            ],
            weight: 0.7
        },
        [INTENT.INVITATION]: {
            patterns: [
                /\b(invite|join|come|attend|let's|want to|would you like|are you free|available)\b/i,
                ['invite', 'join', 'come', 'attend', 'available']
            ],
            weight: 0.7
        },
        [INTENT.COMPLIMENT]: {
            patterns: [
                /\b(good|great|nice|awesome|excellent|amazing|wonderful|terrific|fantastic|impressive|beautiful|well done)\b/i,
                ['good', 'great', 'nice', 'awesome', 'excellent']
            ],
            weight: 0.7
        },
        [INTENT.CONCERN]: {
            patterns: [
                /\b(worry|worried|concern|concerned|afraid|scared|anxious|nervous|stress|stressed)\b/i,
                ['worry', 'concern', 'afraid', 'scared', 'anxious']
            ],
            weight: 0.7
        }
    };
    
    // Calculate sentiment scores
    const positiveWords = ['happy', 'good', 'great', 'love', 'awesome', 'wonderful', 'fantastic', 'excellent', 'amazing', 'best', 'glad', 'pleased', 'excited', 'joy', 'enjoy', 'nice', 'perfect', 'beautiful', 'brilliant', 'outstanding'];
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'sad', 'unhappy', 'disappointed', 'upset', 'sorry', 'problem', 'issue', 'hate', 'dislike', 'annoyed', 'angry', 'mad', 'frustrated', 'painful', 'scary', 'difficult'];
    
    let positiveScore = 0;
    let negativeScore = 0;
    
    for (const word of positiveWords) {
        if (text.includes(word)) {
            positiveScore += 0.2; // Increment score for each match
        }
    }
    
    for (const word of negativeWords) {
        if (text.includes(word)) {
            negativeScore += 0.2;
        }
    }
    
    // Check for specific conversation patterns
    const conversationPatterns = {
        howAreYou: /\b(how are you|how've you been|how('s| is| are) (it going|things|life)|what's up|how('s| is) everything|how('s| have) you been)\b/i,
        timeQuery: /\b(when|what time|schedule|available|free|meet|meeting|call)\b/i,
        helpRequest: /\b(help|assist|support|guide|how (to|do|can)|can you|would you|advice|advise)\b/i,
        opinion: /\b(what (do|should|would|could) you think|your (thoughts|opinion|take)|how (do|would|could) you feel)\b/i
    };
    
    // Process patterns and assign confidence scores
    for (const [intent, config] of Object.entries(patterns)) {
        let matched = false;
        let confidence = 0;
        
        for (const pattern of config.patterns) {
            if (matchPattern(text, pattern)) {
                matched = true;
                confidence += config.weight;
                // Don't break, we want to accumulate confidence
            }
        }
        
        if (matched) {
            results.push({ type: intent, confidence });
        }
    }
    
    // Add sentiment analysis
    if (positiveScore > negativeScore) {
        results.push({ type: INTENT.SENTIMENT_POSITIVE, confidence: positiveScore });
    } else if (negativeScore > positiveScore) {
        results.push({ type: INTENT.SENTIMENT_NEGATIVE, confidence: negativeScore });
    } else {
        results.push({ type: INTENT.SENTIMENT_NEUTRAL, confidence: 0.5 });
    }
    
    // Check for special cases with high priority
    for (const [pattern, regex] of Object.entries(conversationPatterns)) {
        if (regex.test(text)) {
            switch (pattern) {
                case 'howAreYou':
                    results.push({ type: 'how_are_you', confidence: 0.95 });
                    break;
                case 'timeQuery':
                    results.push({ type: 'time_query', confidence: 0.9 });
                    break;
                case 'helpRequest':
                    results.push({ type: 'help_request', confidence: 0.9 });
                    break;
                case 'opinion':
                    results.push({ type: 'opinion_request', confidence: 0.85 });
                    break;
            }
        }
    }
    
    // If no intents were detected, add statement as fallback
    if (results.length === 0) {
        results.push({ type: INTENT.STATEMENT, confidence: 0.6 });
    }
    
    // Sort by confidence score, highest first
    results.sort((a, b) => b.confidence - a.confidence);
    
    // Determine the top intents with the highest confidence
    const sortedIntents = results.sort((a, b) => b.confidence - a.confidence);
    const topIntents = sortedIntents.slice(0, 3);
    
    return {
        intents: topIntents,
        context: context,
        topIntent: topIntents.length > 0 ? topIntents[0].type : INTENT.STATEMENT
    };
  };
  
  // Generate smart replies based on message intent and context
  export const generateSmartRepliesByIntent = (message) => {
    if (!message || typeof message !== 'string' || message.trim().length < 2) {
        return [
            "I see",
            "Tell me more",
            "Interesting",
            "Got it",
            "Okay"
        ];
    }
    
    const analysis = detectIntent(message);
    const { intents, context, topIntent } = analysis;
    const allReplies = [];
    
    // Special case handlers with high priority
    if (message.match(/\b(how are you|how've you been|how('s| is| are) (it going|things|life)|what's up|how('s| is) everything|how('s| have) you been)\b/i)) {
        return [
            "I'm doing great, thanks for asking!",
            "Been busy but good, how about you?",
            "Not bad at all, thanks!",
            "Pretty well, thanks for asking!",
            "All good here, how are you?"
        ];
    }
    
    // Intent-based reply templates
    const intentReplies = {
        [INTENT.GREETING]: [
            "Hi there! How are you?",
            "Hello! Great to hear from you.",
            "Hey! What's up?",
            "Hi! How's your day going?",
            "Hello! How have you been?"
        ],
        [INTENT.QUESTION]: [
            "Let me think about that.",
            "Good question!",
            "I'd say yes.",
            "Probably not, but I'll consider it.",
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
        [INTENT.PLANNING]: [
            "Sounds like a plan!",
            "What time works for you?",
            "I'm available whenever you are.",
            "Let's coordinate our schedules.",
            "I can work with that timeline."
        ],
        [INTENT.INVITATION]: [
            "I'd love to join!",
            "Count me in!",
            "Thanks for the invitation!",
            "What time should I be there?",
            "That sounds fun, I'll be there!"
        ],
        [INTENT.COMPLIMENT]: [
            "Thank you so much!",
            "That's very kind of you!",
            "I appreciate that!",
            "You just made my day!",
            "That means a lot to me."
        ],
        [INTENT.CONCERN]: [
            "Try not to worry too much.",
            "I understand your concern.",
            "Is there anything I can do to help?",
            "Let me know if there's anything I can do.",
            "I'm here if you need to talk more about it."
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
        ],
        "how_are_you": [
            "I'm doing well, thanks! How about you?",
            "Pretty good, thanks for asking! How's your day?",
            "Not bad at all, thanks for asking!",
            "I'm great, thanks! How are things with you?",
            "Doing well! How's everything on your end?"
        ],
        "time_query": [
            "I'm free tomorrow afternoon.",
            "How about next week?",
            "I can meet anytime Thursday.",
            "What time works best for you?",
            "I'm available most evenings."
        ],
        "help_request": [
            "I'd be happy to help with that!",
            "Sure, let me know what you need.",
            "What can I help you with exactly?",
            "I'll do my best to assist you.",
            "Happy to help! What do you need?"
        ],
        "opinion_request": [
            "I think that's a good idea.",
            "In my opinion, it could work well.",
            "I'd go with the first option.",
            "That sounds reasonable to me.",
            "I think it's worth a try."
        ]
    };
    
    // Context-enhanced replies
    if (context.time) {
        allReplies.push(
            `That works for me ${context.time}.`,
            `I'm available ${context.time}.`,
            `${context.time} sounds good.`
        );
    }
    
    if (context.location) {
        allReplies.push(
            `I can meet you ${context.location}.`,
            `${context.location} works for me.`,
            `Sounds good, see you ${context.location}.`
        );
    }
    
    if (context.event) {
        allReplies.push(
            `Looking forward to the ${context.event}!`,
            `The ${context.event} sounds great!`,
            `I'll be ready for the ${context.event}.`
        );
    }
    
    // Add replies for top intents
    for (const intent of intents) {
        if (intentReplies[intent.type]) {
            // Add more replies for higher confidence intents
            const count = Math.min(5, Math.ceil(intent.confidence * 5));
            allReplies.push(...intentReplies[intent.type].slice(0, count));
        }
    }
    
    // If we have a decent number of replies, return them
    if (allReplies.length >= 3) {
        // Remove duplicates
        const uniqueReplies = [...new Set(allReplies)];
        
        // Shuffle and return up to 5 replies
        return uniqueReplies
            .sort(() => 0.5 - Math.random())
            .slice(0, 5);
    }
    
    // Fallback to general responses
    return [
        "I see what you mean.",
        "Tell me more about that.",
        "Interesting, please continue.",
        "Got it.",
        "I understand."
    ];
  };