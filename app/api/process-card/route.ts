import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Ensure GEMINI_API_KEY is set in Vercel Environment Variables
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { image } = body;

    if (!image) {
      return NextResponse.json({ error: "Image is missing" }, { status: 400 });
    }

    // Clean base64 string
    const base64Data = image.includes(",") ? image.split(",")[1] : image;
    const mimeType = "image/jpeg";

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Extract details from this business card: name, jobTitle, company, email, phone, linkedinUrl. 
    Return the result in valid JSON format ONLY. 
    Do not include any markdown formatting like \`\`\`json or \`\`\`. 
    If a field is not found, return an empty string "" for that field.`;

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64Data, mimeType } }
    ]);

    const response = await result.response;
    const text = response.text().trim();

    // Remove any accidental markdown backticks just in case
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();

    const data = JSON.parse(cleanJson);

    return NextResponse.json({ result: data });

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return NextResponse.json({ 
      error: "Failed to process card", 
      details: error.message 
    }, { status: 500 });
  }
}