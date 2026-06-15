import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
  try {
    const { image, apiKey } = await req.json();

    if (!image) {
      return NextResponse.json({ error: "Image missing" }, { status: 400 });
    }

    const key = apiKey || process.env.GEMINI_API_KEY;
    if (!key) {
      return NextResponse.json({ error: "API Key missing in environment variables!" }, { status: 401 });
    }

    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const base64Data = image.split(",")[1];
    
    // AI ko instruction
    const prompt = "Extract contact details from this business card. Return ONLY a valid JSON object. Keys: name, jobTitle, company, email, phone, linkedinUrl, whatsappDraft.";

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64Data, mimeType: "image/jpeg" } }
    ]);

    const responseText = result.response.text();
    const cleanJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();

    return NextResponse.json({ result: JSON.parse(cleanJson) });
    
  } catch (error: any) {
    // AB YAHAN ASLI ERROR DIKHEGA
    console.error("DEBUG ERROR:", error);
    return NextResponse.json({ 
      error: "Detailed Error", 
      message: error.message || "Unknown error",
      stack: error.stack 
    }, { status: 500 });
  }
}