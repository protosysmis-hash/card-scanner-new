import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the API with the key from env
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

    const model = genAI.getGenerativeModel({ model: "Gemini 3.1 Flash Lite" });

    const prompt = `Extract details from this business card: name, jobTitle, company, email, phone, linkedinUrl. 
    Return the result in valid JSON format ONLY. 
    Do not include any markdown formatting. 
    If a field is not found, return an empty string "" for that field.`;

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64Data, mimeType } }
    ]);

    const response = await result.response;
    const text = response.text().trim();
    
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();

    try {
      const data = JSON.parse(cleanJson);
      return NextResponse.json({ result: data });
    } catch (parseError) {
      // If parsing fails, return the raw text as the detail so we can see what Gemini returned
      return NextResponse.json({ 
        error: "AI response was not valid JSON", 
        details: text 
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    // Return the actual error message from the API
    return NextResponse.json({ 
      error: "Failed to process card (Gemini API)", 
      details: error.message || "Unknown error occurred" 
    }, { status: 500 });
  }
}