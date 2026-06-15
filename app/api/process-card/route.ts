import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
  try {
    const { image, apiKey } = await req.json();

    // 1. API Key check - Ye logs mein dikhayega ki key mil rahi hai ya nahi
    const key = apiKey || process.env.GEMINI_API_KEY;
    console.log("Checking API Key: ", key ? "KEY FOUND" : "KEY MISSING");

    if (!key) {
      return NextResponse.json({ error: "Environment Variable GEMINI_API_KEY missing in Vercel!" }, { status: 401 });
    }

    if (!image) {
      return NextResponse.json({ error: "Image missing" }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(key);
    
    // 2. Stable model use kar rahe hain
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const base64Data = image.split(",")[1];
    const prompt = "Extract contact details from this business card. Return ONLY a valid JSON object. Keys: name, jobTitle, company, email, phone, linkedinUrl, whatsappDraft.";

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64Data, mimeType: "image/jpeg" } }
    ]);

    const responseText = result.response.text();
    const jsonString = responseText.replace(/```json/g, "").replace(/```/g, "").trim();

    return NextResponse.json({ result: JSON.parse(jsonString) });
    
  } catch (error: any) {
    console.error("Backend Error Details:", error);
    return NextResponse.json({ 
      error: "Scanner Error", 
      details: error.message 
    }, { status: 500 });
  }
}