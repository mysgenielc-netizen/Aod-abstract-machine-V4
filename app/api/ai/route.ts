import { GoogleGenAI, Type } from '@google/genai';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { query, state } = await req.json();

    const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });

    const systemInstruction = `
You are the AOD Abstract Machine v3 AI Agent.
Your task is to propose structural changes to the categorical state graph based on the user's query and the current state.
The state consists of nodes (objects) and edges (morphisms).
Nodes have: id, layer (graph, process, file, ip, user, governance, scripts), reward (0-10), safety (0-1).
Edges have: src, tgt, weight (0-10), prob (0-1).

Current State:
${JSON.stringify(state, null, 2)}

Propose a set of nodes and edges to add to the graph to fulfill the user's request.
Respond ONLY with a valid JSON object matching the schema.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: query,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reasoning: { type: Type.STRING, description: 'Explanation of the proposed changes' },
            nodes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  layer: { type: Type.STRING },
                  reward: { type: Type.NUMBER },
                  safety: { type: Type.NUMBER }
                },
                required: ['id', 'layer', 'reward', 'safety']
              }
            },
            edges: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  src: { type: Type.STRING },
                  tgt: { type: Type.STRING },
                  weight: { type: Type.NUMBER },
                  prob: { type: Type.NUMBER }
                },
                required: ['src', 'tgt', 'weight', 'prob']
              }
            }
          },
          required: ['reasoning', 'nodes', 'edges']
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error('No response from AI');

    const result = JSON.parse(text);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('AI Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
