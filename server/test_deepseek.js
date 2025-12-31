require('dotenv').config();

async function testDeepSeek() {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
        console.error("❌ No API Key found in .env");
        return;
    }
    console.log("🔑 API Key found:", apiKey.substring(0, 5) + "...");

    const url = "https://api.deepseek.com/chat/completions";
    const payload = {
        model: "deepseek-chat",
        messages: [
            { role: "user", content: "Hello, this is a test." }
        ],
        stream: false
    };

    try {
        console.log("📡 Sending request to DeepSeek...");
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error("❌ API Error:", response.status, errText);
        } else {
            const data = await response.json();
            console.log("✅ Success! Response:", data.choices[0].message.content);
        }
    } catch (error) {
        console.error("❌ Network/Fetch Error:", error.message);
    }
}

testDeepSeek();
