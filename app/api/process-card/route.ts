import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
  try {
    const { image, apiKey } = await req.json();

    if (!image) {
      return NextResponse.json({ error: "Image missing" }, { status: 400 });
    }

    const finalApiKey = apiKey || process.env.GEMINI_API_KEY;

    if (!finalApiKey) {
      return NextResponse.json({ error: "API Key missing! Please enter it in the app or Vercel settings." }, { status: 401 });
    }

    const genAI = new GoogleGenerativeAI(finalApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const base64Data = image.split(",")[1];
    
    const prompt = `Extract contact details from this business card. Return ONLY a valid JSON object. 
    Keys: name, jobTitle, company, email, phone, linkedinUrl, whatsappDraft. 
    Ensure phone and email are accurate.`;

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64Data, mimeType: "image/jpeg" } }
    ]);

    const responseText = result.response.text();
    const jsonString = responseText.replace(/```json/g, "").replace(/```/g, "").trim();

    return NextResponse.json({ result: JSON.parse(jsonString) });
    
  } catch (error: any) {
    console.error("API Error Details:", error);
    return NextResponse.json({ 
      error: "Scanner Failed", 
      details: error.toString() 
    }, { status: 500 });
  }
}