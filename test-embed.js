const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');

const envContent = fs.readFileSync(".env.local", "utf8");
const match = envContent.match(/GEMINI_API_KEY=(.*)/);
const apiKey = match ? match[1].trim() : process.env.GEMINI_API_KEY;

const genAI = new GoogleGenerativeAI(apiKey);

async function run(modelStr) {
    const model = genAI.getGenerativeModel({ model: modelStr });
    try {
        const res = await model.embedContent("test");
        console.log("SUCCESS:", modelStr, res.embedding.values.slice(0, 3).join(", "), `(Dims: ${res.embedding.values.length})`);
    } catch (e) {
        console.error("FAIL:", modelStr, e.message);
    }
}

async function testAll() {
    await run("gemini-embedding-001");
    await run("gemini-embedding-2-preview");
    await run("embedding-001");
    await run("text-embedding-004");
}

testAll();
