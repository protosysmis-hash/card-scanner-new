import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY; 

    if (!apiKey) {
      return NextResponse.json({ error: "Server Configuration Error: API Key missing" }, { status: 500 });
    }

    const { image } = await req.json();
    if (!image) {
      return NextResponse.json({ error: "Missing image data" }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const base64Data = image.includes(',') ? image.split(',')[1] : image;
    const mimeType = image.startsWith('data:image/png') ? 'image/png' : 'image/jpeg';

    const result = await model.generateContent([
      "Extract contact info as JSON: name, jobTitle, company, email, phone, address. Only return the JSON object.",
      { inlineData: { data: base64Data, mimeType: mimeType } },
    ]);

    const responseText = result.response.text();
    const cleanJson = responseText.split("```json").join("").split("```").join("").trim();
    
    return NextResponse.json({ result: JSON.parse(cleanJson) });

  } catch (error: any) {
    console.error("API ERROR:", error);
    return NextResponse.json({ error: "Scanner Failed", details: error.message }, { status: 500 });
  }
}