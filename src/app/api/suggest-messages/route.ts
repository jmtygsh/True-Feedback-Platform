import { google } from "@ai-sdk/google";
import { streamText } from "ai";

// This is vercel AI SDK, which provides a simple way to interact with Google Gemini models.
// Initialize the Google Gemini provider.
// The API key is automatically read from the GOOGLE_GENERATIVE_AI_API_KEY

// Set the runtime to edge for serverless and fast responses
export const runtime = "edge";

export async function POST(req: Request) {
  const { text } = await req.json();
  try {
    const prompt = `Create a list of three open-ended and engaging questions formatted as a single string. Each question should be separated by '||'. These questions are for an anonymous social messaging platform, like Qooh.me, and should be suitable for a diverse audience. Avoid personal or sensitive topics, focusing instead on universal themes that encourage friendly interaction. For example, your output should be structured like this: 'What’s a hobby you’ve recently started?||If you could have dinner with any historical figure, who would it be?||What’s a simple thing that makes you happy?'. Ensure the questions are intriguing, foster curiosity, and contribute to a positive and welcoming conversational environment. but you can change the context to be more specific to the user's interests: ${text}`;

    // Use the `streamText` function from the AI SDK
    const result = streamText({
      // Use a modern, fast, and cost-effective Gemini model
      model: google("models/gemini-1.5-flash-latest"),
      prompt: prompt,
    });

    // The result object has a helper function to convert the stream
    // into a standard Vercel AI SDK response
    return result.toTextStreamResponse();
  } catch (error) {
    // General error handling
    console.error("An unexpected error occurred:", error);
    // Send a generic error response
    return Response.json(
      { error: "An internal server error occurred." },
      { status: 500 }
    );
  }
}
