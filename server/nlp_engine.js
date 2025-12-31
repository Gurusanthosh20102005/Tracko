// ========================================
// NATURAL LANGUAGE PROCESSING ENGINE
// ========================================

class NLPEngine {
    constructor() {
        // Intent patterns with synonyms
        this.intents = {
            greeting: {
                patterns: ['hello', 'hi', 'hey', 'greetings', 'good morning', 'good evening', 'sup', 'yo'],
                response: 'greeting'
            },
            thanks: {
                patterns: ['thank', 'thanks', 'appreciate', 'grateful'],
                response: 'thanks'
            },
            route_planning: {
                patterns: ['how to', 'how do i', 'get to', 'go to', 'reach', 'travel to', 'way to', 'route to', 'bus to', 'take me'],
                response: 'route_planning'
            },
            crowd_query: {
                patterns: ['crowded', 'crowd', 'busy', 'full', 'empty', 'packed', 'people', 'space', 'less people', 'fewer people'],
                response: 'crowd_query'
            },
            best_recommendation: {
                patterns: ['best', 'recommend', 'suggest', 'should i', 'which one', 'what bus', 'better', 'prefer'],
                response: 'recommendation'
            },
            timing: {
                patterns: ['when', 'time', 'arrive', 'eta', 'reach', 'departure', 'schedule'],
                response: 'timing'
            },
            ticket: {
                patterns: ['ticket', 'buy', 'purchase', 'book', 'fare', 'price', 'cost', 'pay'],
                response: 'ticket'
            },
            list_buses: {
                patterns: ['all buses', 'list', 'show', 'available', 'display'],
                response: 'list'
            }
        };

        // Crowd-related terms
        this.crowdTerms = {
            least: ['least', 'less', 'not', 'empty', 'less crowded', 'emptiest', 'fewer'],
            most: ['most', 'very', 'too', 'packed', 'full', 'crowded']
        };
    }

    // Tokenize and clean text
    tokenize(text) {
        return text.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 0);
    }

    // Calculate similarity between two token sets
    similarity(tokens1, tokens2) {
        const set1 = new Set(tokens1);
        const set2 = new Set(tokens2);
        const intersection = new Set([...set1].filter(x => set2.has(x)));
        const union = new Set([...set1, ...set2]);
        return intersection.size / union.size;
    }

    // Classify intent
    classifyIntent(message) {
        const tokens = this.tokenize(message);
        let bestIntent = null;
        let bestScore = 0;

        for (const [intent, data] of Object.entries(this.intents)) {
            for (const pattern of data.patterns) {
                const patternTokens = this.tokenize(pattern);
                const score = this.similarity(tokens, patternTokens);

                // Also check for exact substring matches
                const hasExactMatch = message.toLowerCase().includes(pattern);
                const finalScore = hasExactMatch ? score + 0.5 : score;

                if (finalScore > bestScore) {
                    bestScore = finalScore;
                    bestIntent = data.response;
                }
            }
        }

        return { intent: bestIntent, confidence: bestScore };
    }

    // Extract entities (locations, bus IDs)
    extractEntities(message) {
        const entities = {
            locations: [],
            busIds: [],
            fromLocation: null,
            toLocation: null,
            crowdPreference: null
        };

        // Extract bus IDs
        const busIdMatch = message.match(/\b(\d+[a-z]?|[a-z]+\d+)\b/gi);
        if (busIdMatch) {
            entities.busIds = busIdMatch.map(id => id.toUpperCase());
        }

        // Extract locations with better pattern matching
        const locations = ['central', 'tech park', 'airport', 'koyambedu', 'adyar', 't.nagar', 'tambaram', 'broadway', 'guindy', 'cmbt', 'siruseri', 'kelambakkam', 'perambur', 'anna nagar'];

        // Check for any location mentions
        for (const loc of locations) {
            if (message.toLowerCase().includes(loc)) {
                entities.locations.push(loc);
            }
        }

        // Flexible from/to extraction
        const fromPatterns = [
            /(?:from|starting|leaving)\s+([a-z\s.]+?)(?:\s+to|\s+going|\s+and|$)/i,
            /([a-z\s.]+?)\s+to\s+/i  // "Central to Airport"
        ];

        const toPatterns = [
            /(?:to|towards|going to|reach|get to)\s+(?:the\s+)?([a-z\s.]+?)(?:\s|$|[?,!])/i,
            /\s+to\s+([a-z\s.]+?)(?:\s|$|[?,!])/i,
            /(?:take me)\s+to\s+(?:the\s+)?([a-z\s.]+?)(?:\s|$|[?,!])/i
        ];

        // Try to extract 'from' location
        for (const pattern of fromPatterns) {
            const match = message.match(pattern);
            if (match && match[1]) {
                const location = match[1].trim();
                if (locations.some(loc => location.toLowerCase().includes(loc))) {
                    entities.fromLocation = location;
                    break;
                }
            }
        }

        // Try to extract 'to' location
        for (const pattern of toPatterns) {
            const match = message.match(pattern);
            if (match && match[1]) {
                const location = match[1].trim();
                // Check if it's a valid location
                const matchedLoc = locations.find(loc => location.toLowerCase().includes(loc));
                if (matchedLoc) {
                    entities.toLocation = matchedLoc;
                    break;
                }
            }
        }

        // Extract crowd preference
        const tokens = this.tokenize(message);
        if (tokens.some(t => this.crowdTerms.least.includes(t)) || message.includes('less people') || message.includes('fewer people')) {
            entities.crowdPreference = 'least';
        } else if (tokens.some(t => this.crowdTerms.most.includes(t))) {
            entities.crowdPreference = 'most';
        }

        return entities;
    }

    // Main NLP processing
    process(message) {
        const intent = this.classifyIntent(message);
        const entities = this.extractEntities(message);

        return {
            ...intent,
            entities,
            originalMessage: message
        };
    }
}

module.exports = NLPEngine;
