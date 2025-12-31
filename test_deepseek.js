const https = require('https');

const API_KEY = 'sk-bed30bf29ca04438adfee59326a0c261';

const requestData = JSON.stringify({
    model: "deepseek-chat",
    messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "Say hello" }
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

console.log('Testing DeepSeek API...');
console.log('Hostname:', options.hostname);
console.log('Path:', options.path);

const req = https.request(options, (res) => {
    let data = '';
    console.log('Status Code:', res.statusCode);
    console.log('Headers:', JSON.stringify(res.headers, null, 2));

    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        console.log('\nResponse Body:');
        try {
            const json = JSON.parse(data);
            console.log(JSON.stringify(json, null, 2));
            if (json.choices && json.choices[0]) {
                console.log('\n✅ SUCCESS! AI Reply:', json.choices[0].message.content);
            }
        } catch (e) {
            console.log('Raw:', data);
            console.log('Parse Error:', e.message);
        }
    });
});

req.on('error', (e) => {
    console.error('❌ Request Error:', e.message);
    console.error('Full Error:', e);
});

req.write(requestData);
req.end();
