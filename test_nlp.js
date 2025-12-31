const http = require('http');

const naturalQueries = [
    "Take me to the airport",
    "Which bus has less people?",
    "I want to travel from Central to Tech Park",
    "Tell me about bus 12A",
    "I'm going to Koyambedu, what are my options?",
    "Show me the emptiest bus"
];

const busData = [
    { id: '12A', route: 'Central Stn - Tech Park', crowd: 65, status: 'On Time', eta: '5 min' },
    { id: '45C', route: 'Koyambedu - Airport', crowd: 20, status: 'Delayed', eta: '12 min' },
    { id: '21G', route: 'Broadway - Tambaram', crowd: 45, status: 'On Time', eta: '8 min' },
    { id: '570', route: 'CMBT - Siruseri', crowd: 95, status: 'V. Crowded', eta: '1 min' },
    { id: '5B', route: 'Adyar - T.Nagar', crowd: 90, status: 'Crowded', eta: '2 min' },
    { id: 'A1', route: 'Central - Airport', crowd: 85, status: 'Peak', eta: '4 min' }
];

console.log('🧠 Testing NLP-Powered Chatbot\n');
console.log('Natural Language Queries:\n');

naturalQueries.forEach((query, index) => {
    const data = JSON.stringify({
        message: query,
        context: busData
    });

    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/chat',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length
        }
    };

    setTimeout(() => {
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (d) => body += d);
            res.on('end', () => {
                const response = JSON.parse(body);
                console.log(`${index + 1}. 💬 "${query}"`);
                console.log(`   🤖 ${response.reply}\n`);
                console.log('─'.repeat(60) + '\n');
            });
        });
        req.on('error', (e) => console.error('Error:', e.message));
        req.write(data);
        req.end();
    }, index * 700);
});
