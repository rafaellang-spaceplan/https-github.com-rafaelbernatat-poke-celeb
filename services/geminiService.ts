import { GoogleGenAI, Type, Modality } from "@google/genai";
import { PokemonData } from "../types";

// @ts-ignore
const apiKey = process.env.API_KEY;

const SYSTEM_INSTRUCTION = `
Role: You are an expert Concept Artist and Game Designer for Pokémon.
Task: Analyze the input celebrity. Map their career highlights, controversies, and visual traits into Pokémon game mechanics.
Constraint 1 (Visuals): Describe the character as a monster/creature, NOT a human in a costume. Maintain the "Ken Sugimori" watercolor/cel-shaded style description. The prompt must explicitly ask for a white background. IMPORTANT: Do NOT include the celebrity's name in the 'visualPrompt', only describe their physical attributes converted into creature features.
Constraint 2 (Script): The script must be narrated in Portuguese (Brazil). IMPORTANT: The script MUST start exactly with the phrase: "É o {Pokemon Name}!". Then proceed with the creature's description/lore. It must be engaging, funny, and longer than 60 seconds when read aloud (approx 180 words).
Output: Return ONLY a valid JSON object.
`;

export const generatePokemonData = async (celebrityName: string): Promise<PokemonData> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Create a Pokémon based on the celebrity: ${celebrityName}`;
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          type: { type: Type.STRING },
          hp: { type: Type.STRING },
          description: { type: Type.STRING },
          evolution: { type: Type.STRING },
          visualPrompt: { type: Type.STRING },
          attacks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                cost: { type: Type.STRING },
                damage: { type: Type.STRING },
                description: { type: Type.STRING }
              }
            }
          },
          weakness: { type: Type.STRING },
          resistance: { type: Type.STRING },
          retreatCost: { type: Type.NUMBER },
          script: { type: Type.STRING }
        },
        required: ["name", "type", "hp", "description", "evolution", "visualPrompt", "attacks", "script"]
      }
    }
  });
  return JSON.parse(response.text) as PokemonData;
};

export const generatePokemonImage = async (imagePrompt: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [{ text: imagePrompt + " Ensure the background is pure solid white #FFFFFF." }] },
  });
  const imagePart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
  if (!imagePart?.inlineData?.data) throw new Error("No image generated");
  return imagePart.inlineData.data;
};

export const generatePokemonGallery = async (basePrompt: string): Promise<string[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const poses = [
        "performing a special attack", "defending", "sleeping", "happy expression", "running away"
    ];
    const results: string[] = [];
    for (const pose of poses) {
        try {
            const image = await generatePokemonImage(`${basePrompt}, ${pose}, Ken Sugimori style`);
            results.push(image);
        } catch (e) { console.error(e); }
    }
    return results;
};

export const generatePokemonSpeech = async (text: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
};