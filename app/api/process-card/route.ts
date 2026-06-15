import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

// Ye backend route business card image ko process karta hai
export async function POST(req: NextRequest) {
  try {
    const { image, apiKey } = await req.json();

    if (!image) {
      return NextResponse.json({ error: "Image missing" }, { status: 400 });
    }

    // Pehle frontend se aayi key check karenge, phir Vercel environment variable
    const key = apiKey || process.env.GEMINI_API_KEY;

    if (!key) {
      return NextResponse.json({ error: "API Key configure nahi hai!" }, { status: 401 });
    }

    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Base64 image ko process karne ke liye split kar rahe hain
    const base64Data = image.split(",")[1];
    
    // AI ko instruction ki kya extract karna hai
    const prompt = "Extract contact details from this business card. Return ONLY a valid JSON object. Keys: name, jobTitle, company, email, phone, linkedinUrl, whatsappDraft.";

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64Data, mimeType: "image/jpeg" } }
    ]);

    const responseText = result.response.text();
    // JSON clean kar rahe hain
    const jsonString = responseText.replace(/```json/g, "").replace(/```/g, "").trim();

    return NextResponse.json({ result: JSON.parse(jsonString) });
    
  } catch (error: any) {
    console.error("Backend Error:", error);
    return NextResponse.json({ 
      error: "Scanner Failed", 
      details: error.message 
    }, { status: 500 });
  }
}