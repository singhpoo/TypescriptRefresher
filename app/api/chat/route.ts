import { NextResponse } from "next/server";
import { OpenAI } from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const systemMessage = {
  role: "system",
  content:
    "You are a helpful AI assistant that specializes in coding. When appropriate, provide code examples that can be executed. Format your code blocks with triple backticks and specify the language. Be concise and helpful.",
};

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const response = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [systemMessage, ...messages],
      temperature: 0,
      max_tokens: 2048,
      stream: true,
    });

    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of response) {
          const content = chunk.choices[0]?.delta?.content || "";
          if (content) {
            controller.enqueue(new TextEncoder().encode(content));
          }
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
