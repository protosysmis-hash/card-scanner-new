import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
  try {
    const { image, apiKey } = await req.json();

    if (!image || !apiKey) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Model initialized with direct name
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Image data clean karna
    const base64Data = image.includes(',') ? image.split(',')[1] : image;
    
    // MIME type detect karna
    const mimeType = image.startsWith('data:image/png') ? 'image/png' : 'image/jpeg';

    const result = await model.generateContent([
      "Extract contact info as JSON: name, jobTitle, company, email, phone, address. Only return the JSON object.",
      {
        inlineData: {
          data: base64Data,
          mimeType: mimeType,
        },
      },
    ]);

    const responseText = result.response.text();
    
    // Yahan syntax thik kiya gaya hai jo error de raha tha
    const cleanJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    
    return NextResponse.json({ result: JSON.parse(cleanJson) });

  } catch (error: any) {
    console.error("API ERROR DETAILS:", error); 
    return NextResponse.json({ 
      error: "Scanner Error", 
      details: error.message || error.toString() 
    }, { status: 500 });
  }
}