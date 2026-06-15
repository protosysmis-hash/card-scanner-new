import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { image } = body;

    if (!image) {
      return NextResponse.json({ error: "Image missing" }, { status: 400 });
    }

    const base64Image = image.includes(",") ? image.split(",")[1] : image;

    const prompt = `Extract details from this business card: name, jobTitle, company, email, phone, linkedinUrl. 
    Return the result in valid JSON format ONLY. No markdown, no extra text.`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: { url: `data:image/jpeg;base64,${base64Image}` },
            },
          ],
        },
      ],
      model: "llama-3.2-90b-vision-instruct", 
      response_format: { type: "json_object" },
    });

    const content = chatCompletion.choices[0]?.message?.content || "{}";
    return NextResponse.json({ result: JSON.parse(content) });

  } catch (error: any) {
    console.error("GROQ ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}