const https = require('https');

const API_KEY = 'sk-c9f48d412dfd44c29d055ef3961594ff';

const requestData = JSON.stringify({
    model: "deepseek-chat",
    messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "Say hello in one short sentence" }
    ],
    stream: false
});

const options = {
    hostname: 'api.deepseek.com',
    path: '/chat/completions',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Length': requestData.length
    }
};

console.log('Testing NEW DeepSeek API Key...');

const req = https.request(options, (res) => {
    let data = '';
    console.log('Status Code:', res.statusCode);

    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            if (res.statusCode === 200 && json.choices && json.choices[0]) {
                console.log('\n✅ SUCCESS! API Key is VALID and has balance!');
                console.log('AI Reply:', json.choices[0].message.content);
            } else {
                console.log('\n❌ FAILED!');
                console.log('Response:', JSON.stringify(json, null, 2));
            }
        } catch (e) {
            console.log('Raw:', data);
        }
    });
});

req.on('error', (e) => {
    console.error('❌ Request Error:', e.message);
});

req.write(requestData);
req.end();
