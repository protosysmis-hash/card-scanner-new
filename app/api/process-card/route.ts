import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { image, apiKey } = body;
    
    // API Key Priority: Request body > Environment Variable
    const key = apiKey || process.env.GEMINI_API_KEY;

    if (!key) {
      console.error("API Key check failed: Key not found");
      return NextResponse.json({ error: "API Key missing! Check Vercel Environment Variables." }, { status: 401 });
    }

    if (!image) {
      return NextResponse.json({ error: "Image data missing" }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Ensure base64 string format is clean
    const base64Data = image.includes(",") ? image.split(",")[1] : image;
    
    const prompt = "Extract these details from the card: name, jobTitle, company, email, phone, linkedinUrl, whatsappDraft. Return ONLY raw JSON. No markdown.";

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64Data, mimeType: "image/jpeg" } }
    ]);

    const response = await result.response;
    const text = response.text();
    
    // Robust cleanup to ensure valid JSON
    const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
    
    try {
      const data = JSON.parse(cleanText);
      return NextResponse.json({ result: data });
    } catch (e) {
      console.error("JSON Parse Error. Raw output:", cleanText);
      return NextResponse.json({ error: "AI response format error", raw: cleanText }, { status: 500 });
    }

  } catch (error: any) {
    console.error("API Route Error:", error.message);
    // Returning specific error to help debug in Vercel logs
    return NextResponse.json({ error: "Server Error", details: error.message }, { status: 500 });
  }
}