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
      return NextResponse.json({ error: "API Key configure nahi hai!" }, { status: 401 });
    }

    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const base64Data = image.split(",")[1];
    
    // Instruction ko thoda aur sakht kiya hai taaki AI sirf JSON hi de
    const prompt = `Extract contact details from this business card. 
    Return ONLY a valid JSON object without any Markdown formatting or extra text. 
    Keys required: name, jobTitle, company, email, phone, linkedinUrl, whatsappDraft.`;

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64Data, mimeType: "image/jpeg" } }
    ]);

    const responseText = result.response.text();
    
    // --- ROBUST JSON PARSING ---
    // AI kabhi-kabhi "Here is the JSON: { ... }" likh deta hai, ye use saaf kar dega
    const jsonStart = responseText.indexOf('{');
    const jsonEnd = responseText.lastIndexOf('}');
    
    if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error("AI did not return valid JSON: " + responseText);
    }

    const cleanJson = responseText.substring(jsonStart, jsonEnd + 1);
    return NextResponse.json({ result: JSON.parse(cleanJson) });
    
  } catch (error: any) {
    console.error("DEBUG ERROR:", error);
    return NextResponse.json({ 
      error: "Scanner Failed", 
      details: error.message 
    }, { status: 500 });
  }
}