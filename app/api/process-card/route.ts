import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
  try {
    const { image, apiKey } = await req.json();

    if (!image) {
      return NextResponse.json({ error: "Image missing" }, { status: 400 });
    }

    // API Key yahan use karenge
    const genAI = new GoogleGenerativeAI(apiKey || process.env.GEMINI_API_KEY || "");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Base64 image ko part mein convert karo
    const base64Data = image.split(",")[1];
    
    const prompt = `Extract contact details from this business card. Return ONLY a valid JSON object. 
    Keys: name, jobTitle, company, email, phone, linkedinUrl, whatsappDraft. 
    Ensure phone and email are accurate.`;

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64Data, mimeType: "image/jpeg" } }
    ]);

    const responseText = result.response.text();
    
    // Clean text to extract JSON (Removes markdown code blocks if present)
    const jsonString = responseText.replace(/```json/g, "").replace(/```/g, "").trim();

    return NextResponse.json({ result: JSON.parse(jsonString) });
    
  } catch (error: any) {
    console.error("API Error Details:", error);
    return NextResponse.json({ 
      error: "Scanner Failed", 
      details: error.message 
    }, { status: 500 });
  }
}