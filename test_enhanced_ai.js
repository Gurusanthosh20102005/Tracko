const http = require('http');

const testQueries = [
    "How do I get to Airport?",
    "Which bus is least crowded?",
    "Bus from Central to Tech Park",
    "Best bus to T.Nagar",
    "Is bus 12A crowded?",
    "Fastest bus to Koyambedu"
];

const busData = [
    { id: '12A', route: 'Central Stn - Tech Park', crowd: 65, status: 'On Time', eta: '5 min' },
    { id: '45C', route: 'Koyambedu - Airport', crowd: 20, status: 'Delayed', eta: '12 min' },
    { id: '21G', route: 'Broadway - Tambaram', crowd: 45, status: 'On Time', eta: '8 min' },
    { id: '570', route: 'CMBT - Siruseri', crowd: 95, status: 'V. Crowded', eta: '1 min' },
    { id: '5B', route: 'Adyar - T.Nagar', crowd: 90, status: 'Crowded', eta: '2 min' },
    { id: 'A1', route: 'Central - Airport', crowd: 85, status: 'Peak', eta: '4 min' }
];

console.log('🤖 Testing Enhanced AI Chatbot\n');

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
                console.log('---');
            });
        });
        req.on('error', (e) => console.error('Error:', e.message));
        req.write(data);
        req.end();
    }, index * 600);
});
