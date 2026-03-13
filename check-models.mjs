
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function listModels() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    try {
        // Note: The JS SDK doesn't have a direct 'listModels' in the same way the REST API does, 
        // but we can try to initialize and check if a common model works.
        console.log("Checking API Key for Gemini 2.5 Flash...");
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent("Hello");
        console.log("Gemini 2.5 Flash connection successful.");
        console.log("Response:", result.response.text());

        console.log("\nChecking Embedding Model (text-embedding-004)...");
        const embedModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
        const embedResult = await embedModel.embedContent("Hello world");
        console.log("Embedding Model text-embedding-004 is available.");
    } catch (err: any) {
        console.error("Error detected:", err.message);
        if (err.message.includes("404")) {
            console.error("Specifically: The model was not found (404). This usually means the API key doesn't have access or the name is incorrect.");
        }
    }
}

listModels();
