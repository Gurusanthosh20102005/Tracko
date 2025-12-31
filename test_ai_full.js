const http = require('http');

const testQueries = [
    "Where is bus 12A?",
    "Is bus 45C crowded?",
    "When will bus 21G arrive?",
    "How do I buy a ticket?",
    "Tell me about bus 570"
];

const busData = [
    { id: '12A', route: 'Central Stn - Tech Park', crowd: 65, status: 'On Time', eta: '5 min' },
    { id: '45C', route: 'Koyambedu - Airport', crowd: 20, status: 'Delayed', eta: '12 min' },
    { id: '21G', route: 'Broadway - Tambaram', crowd: 45, status: 'On Time', eta: '8 min' },
    { id: '570', route: 'CMBT - Siruseri', crowd: 95, status: 'V. Crowded', eta: '1 min' }
];

console.log('🤖 Testing Local AI Chatbot\n');

testQueries.forEach((query, index) => {
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
                console.log(`\n${index + 1}. Q: "${query}"`);
                console.log(`   A: ${response.reply}`);
            });
        });
        req.write(data);
        req.end();
    }, index * 500);
});
