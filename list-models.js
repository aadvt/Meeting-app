const fs = require('fs');

const envContent = fs.readFileSync(".env.local", "utf8");
const match = envContent.match(/GEMINI_API_KEY=(.*)/);
const apiKey = match ? match[1].trim() : process.env.GEMINI_API_KEY;

fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`)
    .then(res => res.json())
    .then(data => {
        if (!data.models) {
            console.error("Error fetching models:", data);
            return;
        }
        const models = data.models.map(m => m.name);
        console.log("AVAILABLE MODELS:\n" + models.filter(m => m.includes("embed")).join("\n"));
    })
    .catch(console.error);
