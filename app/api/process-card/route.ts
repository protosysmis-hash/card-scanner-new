import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

// Initialize Groq client with API key from environment variables
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { image } = body;

    if (!image) {
      return NextResponse.json({ error: "Image missing" }, { status: 400 });
    }

    const base64Image = image.includes(",") ? image.split(",")[1] : image;

    // Using 11b model as it is highly stable for vision tasks on Groq
    const modelName = "llama-3.2-11b-vision-instruct";

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: [
            { 
              type: "text", 
              text: "Extract details from this business card: name, jobTitle, company, email, phone, linkedinUrl. Return the result in valid JSON format ONLY. No markdown, no extra text." 
            },
            {
              type: "image_url",
              image_url: { url: `data:image/jpeg;base64,${base64Image}` },
            },
          ],
        },
      ],
      model: modelName,
      response_format: { type: "json_object" },
    });

    const content = chatCompletion.choices[0]?.message?.content || "{}";
    
    // Parse and return the JSON
    return NextResponse.json({ result: JSON.parse(content) });

  } catch (error: any) {
    console.error("GROQ ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}