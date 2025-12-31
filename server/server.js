const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config(); // Load environment variables
const Razorpay = require('razorpay');
const crypto = require('crypto');
const db = require('./db'); // Supabase database service

const app = express();
const PORT = 3000;

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../'))); // Serve frontend from parent dir

// DEBUG ROUTE
app.get('/test', (req, res) => res.send('Server is working!'));


// Supabase database replaces in-memory storage
// All data now persisted in database

// Helper function for crowd calculation
function calculateCrowd(peopleCount) {
    // Assuming max capacity of 50 passengers
    return Math.min(Math.round((peopleCount / 50) * 100), 100);
}

// API to receive data from Python
app.post('/api/crowd/update', async (req, res) => {
    const { vehicle_id, people_count } = req.body;
    if (vehicle_id) {
        try {
            const crowdData = await db.updateCrowdData(vehicle_id, people_count);
            console.log(`[DATA] Updated ${vehicle_id}: ${people_count} passengers`);
            res.json({
                success: true,
                crowdLevel: calculateCrowd(people_count),
                data: crowdData
            });
        } catch (error) {
            console.error('Error updating crowd data:', error.message);
            res.status(500).json({ error: 'Failed to update crowd data' });
        }
    } else {
        res.status(400).json({ error: 'Missing vehicle_id' });
    }
});

// API for Frontend to poll
app.get('/api/crowd/status', async (req, res) => {
    const vehicle_id = req.query.id || '12A'; // Default to 12A for demo
    try {
        const data = await db.getLatestCrowdData(vehicle_id);
        res.json(data);
    } catch (error) {
        console.error('Error fetching crowd status:', error.message);
        res.json({ passengers: 0, lastUpdate: new Date() });
    }
});

// API to get route stops for timeline
app.get('/api/routes/:busId/stops', async (req, res) => {
    const { busId } = req.params;
    try {
        const route = await db.getRouteStopsByBusNumber(busId);

        if (route) {
            res.json(route);
        } else {
            res.status(404).json({ error: 'Route not found' });
        }
    } catch (error) {
        console.error('Error fetching route stops:', error.message);
        res.status(500).json({ error: 'Failed to fetch route stops' });
    }
});

// API to get all routes
app.get('/api/routes', async (req, res) => {
    try {
        const routes = await db.getAllRoutes();
        res.json(routes);
    } catch (error) {
        console.error('Error fetching routes:', error.message);
        res.status(500).json({ error: 'Failed to fetch routes' });
    }
});

// API to get all buses with crowd data
app.get('/api/buses', async (req, res) => {
    try {
        const buses = await db.getActiveBusesWithCrowd();
        res.json(buses);
    } catch (error) {
        console.error('Error fetching buses:', error.message);
        res.status(500).json({ error: 'Failed to fetch buses' });
    }
});

const NLPEngine = require('./nlp_engine');
const nlp = new NLPEngine();

// Helper to query DeepSeek
async function queryDeepSeek(prompt) {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) return "Additional AI insights are currently unavailable.";

    try {
        const response = await fetch("https://api.deepseek.com/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "deepseek-chat",
                messages: [{ role: "user", content: prompt }],
                stream: false
            })
        });
        
        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        
        const data = await response.json();
        return data.choices?.[0]?.message?.content || "No detailed response available.";
    } catch (error) {
        console.error("DeepSeek API Error:", error.message);
        return "I'm having a bit of trouble connecting to my cloud brain.";
    }
}

app.post('/api/chat', async (req, res) => {
    const { message, context } = req.body;
    if (!message) return res.status(400).json({ reply: "Please say something!" });

    // 1. Get Summary Data (Active Buses)
    let busData = [];
    try {
        busData = await db.getActiveBusesWithCrowd();
    } catch (error) {
        console.error('Error fetching bus data for AI:', error.message);
        busData = context || [];
    }

    // Process message with NLP engine
    const nlpResult = nlp.process(message);
    const { intent, confidence, entities } = nlpResult;
    console.log(`[NLP] Intent: ${intent} (${(confidence * 100).toFixed(1)}%) | Entities:`, entities);

    // 2. Fetch Deep Data (Detailed Route Stops) if a bus is mentioned
    let detailedBusInfo = null;
    if (entities.busIds.length > 0) {
        const busId = entities.busIds[0];
        try {
            // Fetch validation: Is this ID in our active list?
            const summaryBus = busData.find(b => b.id.toLowerCase() === busId.toLowerCase());

            // Fetch details from DB regardless (might be inactive but exists in DB)
            const routeDetails = await db.getRouteStopsByBusNumber(busId);

            if (routeDetails) {
                detailedBusInfo = {
                    ...routeDetails,
                    // Merge with live summary data if available
                    liveStatus: summaryBus ? summaryBus.status : 'Not currently running',
                    crowd: summaryBus ? summaryBus.crowd : null,
                    eta: summaryBus ? summaryBus.eta : null
                };
            }
        } catch (err) {
            console.error(`Error fetching detailed info for ${busId}:`, err);
        }
    }

    // Helper functions
    const findBus = (busId) => busData.find(b => b.id.toLowerCase() === busId.toLowerCase());
    const findBusesByLocation = (location) => busData.filter(b => b.route.toLowerCase().includes(location.toLowerCase()));
    const getEmptiestBuses = () => [...busData].sort((a, b) => a.crowd - b.crowd).slice(0, 3);

    let reply = '';

    // --- RESPONSE LOGIC ---

    // 1. Specific Bus Query (with potential location check)
    if (detailedBusInfo && (intent === 'route_planning' || intent === 'list' || intent === 'timing' || entities.busIds.length > 0)) {
        const bus = detailedBusInfo;
        const requestedLocation = entities.locations[0];

        // "Does 12A go to Adyar?"
        if (requestedLocation) {
            const stops = bus.stops || [];
            const passesThrough = stops.some(s => s.name.toLowerCase().includes(requestedLocation.toLowerCase()));

            if (passesThrough) {
                // Find arrival estimation if possible (simple logic)
                const stopInfo = stops.find(s => s.name.toLowerCase().includes(requestedLocation.toLowerCase()));
                reply = `✅ **Yes! Bus ${bus.id} goes to ${stopInfo.name}.**\n\n` +
                    `Status: ${bus.liveStatus}\n` +
                    (bus.crowd ? `Crowd: ${bus.crowd}%\n` : '') +
                    `Route: ${bus.name}`;
            } else {
                reply = `❌ Bus ${bus.id} does not appear to stop at ${requestedLocation}.\n` +
                    `Its route is: ${bus.name}`;
            }
        }
        // "Tell me about 12A" / "Route of 12A"
        else {
            const firstFew = bus.stops.slice(0, 5).map(s => s.name).join(', ');
            const remaining = bus.stops.length > 5 ? `...and ${bus.stops.length - 5} more.` : '';

            reply = `🚌 **Bus ${bus.id} Details:**\n\n` +
                `🛣️ **Route:** ${bus.name}\n` +
                `⌚ **Status:** ${bus.liveStatus} ${bus.eta ? `(Arriving in ${bus.eta})` : ''}\n` +
                (bus.crowd ? `👥 **Crowd:** ${bus.crowd}%\n` : '') +
                `🚏 **Key Stops:** ${firstFew}${remaining}`;
        }
    }
    // 2. Greeting
    else if (intent === 'greeting') {
        reply = "Hi! I'm Tracko AI 🤖\n\n" +
            "I can answer detailed questions like:\n" +
            "• \"Does bus 12A go to Central?\"\n" +
            "• \"Show me the route of 570\"\n" +
            "• \"Is bus A1 crowded?\"\n\n" +
            "What can I help you with?";
    }
    // 3. Greeting / Thanks
    else if (intent === 'thanks') {
        reply = "You're very welcome! 😊 Safe travels!";
    }
    // 4. Route Planning (General - A to B or just To)
    else if (intent === 'route_planning' || (entities.locations.length > 0 && !detailedBusInfo)) {

        // CASE A: From -> To (Existing logic)
        if (entities.fromLocation && entities.toLocation) {
            const matchingBuses = busData.filter(b => {
                const r = b.route.toLowerCase();
                return r.includes(entities.fromLocation.toLowerCase()) && r.includes(entities.toLocation.toLowerCase());
            });

            if (matchingBuses.length > 0) {
                const best = matchingBuses[0];
                reply = `Found ${matchingBuses.length} bus(es) for you!\n\n` +
                    `🚌 **Bus ${best.id}** is your best bet.\n` +
                    `Route: ${best.route}\n` +
                    `Current Crowd: ${best.crowd}%`;
            } else {
                reply = `I couldn't find a direct active bus from ${entities.fromLocation} to ${entities.toLocation}. Try checking the full route map.`;
            }
        }
        // CASE B: Just "To Location" (New deep search)
        else if (entities.locations.length > 0) {
            const destination = entities.toLocation || entities.locations[0];
            const matchingBuses = await db.findBusesServingStop(destination);

            if (matchingBuses && matchingBuses.length > 0) {
                const best = matchingBuses.sort((a, b) => a.crowd - b.crowd)[0];
                reply = `✅ **Yes! I found buses going to ${best.destination_match}.**\n\n` +
                    `🚌 **Best Option: Bus ${best.id}**\n` +
                    `Crowd: ${best.crowd}% (${best.crowd < 50 ? 'Available' : 'Busy'})\n` +
                    `Route: ${best.route}\n\n` +
                    (matchingBuses.length > 1 ? `Other options: ${matchingBuses.slice(1).map(b => b.id).join(', ')}` : '');
            } else {
                reply = `I couldn't find any active buses stopping at "${destination}" right now.`;
            }
        }
    }
    // 5. Crowd Query (General)
    else if (intent === 'crowd_query') {
        if (entities.crowdPreference === 'least') {
            const sorted = [...busData].sort((a, b) => a.crowd - b.crowd).slice(0, 3);
            reply = `😌 **Least Crowded Buses:**\n` +
                sorted.map(b => `• Bus ${b.id}: ${b.crowd}%`).join('\n');
        } else {
            reply = `Most buses are running on time. Bus 570 is seeing heavy traffic today. Request a specific bus number for more info!`;
        }
    }
    // 6. Recommendation / Best Bus
    else if (intent === 'recommendation') {
        const best = getEmptiestBuses()[0];
        reply = `🌟 **My top recommendation right now:**\n\n` +
            `Bus ${best.id}\n` +
            `Why? Only ${best.crowd}% full, arriving soon (${best.eta})\n` +
            `Route: ${best.route}\n\n` +
            `Need somewhere specific? Just tell me where!`;
    }
    // 7. Timing (General)
    else if (intent === 'timing') {
        reply = "Which bus timing do you need? Tell me the bus number or destination!";
    }
    // 8. Ticket
    else if (intent === 'ticket') {
        reply = "💳 **Ticket Booking:**\n\n" +
            "• Price: ₹50 per person\n" +
            "• Max: 5 passengers\n\n" +
            "**How to book:**\n" +
            "1. Track any bus\n" +
            "2. Tap 'Buy Ticket'\n" +
            "3. Choose passengers\n" +
            "4. Pay & done!";
    }
    // Default / Online Fallback
    else {
        // Fallback to DeepSeek AI
        try {
            console.log(`[AI] Fallback to DeepSeek for: "${message}"`);
            const aiResponse = await queryDeepSeek(message);
            reply = aiResponse;
        } catch (e) {
            console.error('[AI] Fallback Error:', e.message);
            reply = "I'm having trouble connecting to online services.";
        }
    }

    console.log(`[AI] Reply: "${reply}"`);
    res.json({ reply });
});

// Create Razorpay Order
app.post('/api/payment/create-order', async (req, res) => {
    try {
        const { amount, currency, receipt } = req.body;

        const options = {
            amount: amount * 100, // Convert to paise (₹1 = 100 paise)
            currency: currency || 'INR',
            receipt: receipt || `receipt_${Date.now()}`,
            payment_capture: 1 // Auto capture payment
        };

        const order = await razorpay.orders.create(options);

        console.log('[Payment] Order created:', order.id);

        res.json({
            success: true,
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            key: process.env.RAZORPAY_KEY_ID // Send key ID to frontend
        });
    } catch (error) {
        console.error('[Payment] Order creation failed:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create payment order',
            error: error.message
        });
    }
});

// Verify Razorpay Payment
// Verify Razorpay Payment
app.post('/api/payment/verify', async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            ticketData
        } = req.body;

        // Create signature using order_id and payment_id
        const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
        hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
        const generated_signature = hmac.digest('hex');

        if (generated_signature === razorpay_signature) {
            console.log('[Payment] Verified:', razorpay_payment_id);
            // TICKET GENERATION LOGIC CAN GO HERE

            res.json({
                success: true,
                message: 'Payment verified successfully',
                paymentId: razorpay_payment_id
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Invalid signature'
            });
        }

    } catch (error) {
        console.error('[Payment] Verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Payment verification error',
            error: error.message
        });
    }
});

// Get Razorpay Key (for frontend)
app.get('/api/payment/key', (req, res) => {
    res.json({
        key: process.env.RAZORPAY_KEY_ID
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Tracko Server running at http://localhost:${PORT}`);
    console.log(`📹 Send Camera updates to http://localhost:${PORT}/api/crowd/update`);
});

// DEBUG: Keep process alive
setInterval(() => { }, 10000);

process.on('exit', (code) => {
    console.log(`[DEBUG] Process exiting with code: ${code}`);
});
