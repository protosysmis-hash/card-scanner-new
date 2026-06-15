import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { image, apiKey } = body;
    
    // Log the incoming request size
    console.log("Request received. Image length:", image?.length);

    if (!image) return NextResponse.json({ error: "No image provided" }, { status: 400 });

    const key = apiKey || process.env.GEMINI_API_KEY;
    if (!key) return NextResponse.json({ error: "API Key missing in env" }, { status: 401 });

    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const base64Data = image.includes(",") ? image.split(",")[1] : image;
    
    const prompt = "Extract details: name, jobTitle, company, email, phone, linkedinUrl, whatsappDraft. Return ONLY valid JSON.";

    console.log("Calling Gemini API...");
    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64Data, mimeType: "image/jpeg" } }
    ]);

    const response = await result.response;
    const text = response.text().replace(/```json/g, "").replace(/```/g, "").trim();
    
    console.log("Gemini response received:", text);

    return NextResponse.json({ result: JSON.parse(text) });

  } catch (error: any) {
    console.error("CRITICAL ERROR:", error);
    // Ye line tumhe UI par batayegi ki asli problem kya hai
    return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}