import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { messages, temperature, max_tokens, modelUrl } = await request.json();
    
    // Safely retrieve the Hugging Face API Key from server environment
    const hfKey = process.env.NEXT_PUBLIC_HUGGINGFACE_API_KEY || process.env.HUGGINGFACE_API_KEY || "";
    
    const targetUrl = modelUrl || "https://api-inference.huggingface.co/models/Qwen/Qwen2.5-Coder-7B-Instruct/v1/chat/completions";
    
    const headers: Record<string, string> = {
      "Content-Type": "application/json"
    };

    if (hfKey) {
      headers["Authorization"] = `Bearer ${hfKey.trim()}`;
    }

    console.log(`Server Proxy: Forwarding fetch request to Hugging Face Model: ${targetUrl}`);

    const response = await fetch(targetUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        messages,
        temperature: temperature || 0.7,
        max_tokens: max_tokens || 2048
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json(
        { error: `Hugging Face API returned ${response.status} ${response.statusText}: ${errText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err: any) {
    console.error("Hugging Face server proxy failed:", err);
    return NextResponse.json(
      { error: err.message || "Internal Server Proxy Error" },
      { status: 500 }
    );
  }
}
