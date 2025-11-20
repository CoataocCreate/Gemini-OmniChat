import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { Message, ModelId, Role, AVAILABLE_MODELS, Attachment, GroundingMetadata } from "../types";

// We keep a reference to the current chat session
let chatSession: Chat | null = null;
let currentModelId: ModelId | null = null;

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Initializes or re-initializes the chat session.
 * If history is provided, it restores the conversation context.
 */
export const initChatSession = (modelId: ModelId, history: Message[] = []) => {
  currentModelId = modelId;
  
  const modelConfig = AVAILABLE_MODELS.find(m => m.id === modelId);
  if (!modelConfig) {
    throw new Error(`Model config not found for ID: ${modelId}`);
  }

  // Convert app messages to API history format
  const apiHistory = history.map(msg => {
    const parts: any[] = [];
    
    // Add Attachments if any (only for User)
    if (msg.role === Role.USER && msg.attachments && msg.attachments.length > 0) {
      msg.attachments.forEach(att => {
        parts.push({
          inlineData: {
            mimeType: att.mimeType,
            data: att.data
          }
        });
      });
    }

    // Add Text
    if (msg.content) {
      parts.push({ text: msg.content });
    }

    return {
      role: msg.role,
      parts: parts
    };
  });

  const config: any = {};
  // Apply thinking config if the model is a "Thinking" variant
  if (modelConfig.isThinking) {
    config.thinkingConfig = { thinkingBudget: 4096 };
    config.systemInstruction = `You are a deep thinking AI. 
    Before answering the user's request, you MUST explicitly plan and reason about your answer inside <thinking> tags.
    
    Structure your response like this:
    <thinking>
    1. Analyze the user's request...
    2. Identify key information...
    3. Step-by-step reasoning...
    </thinking>
    
    [Your final response here]
    
    Always use the <thinking> tags for your internal monologue and planning.`;
  }

  chatSession = ai.chats.create({
    model: modelConfig.apiModel,
    history: apiHistory,
    config: config
  });
};

export interface StreamResponse {
  text?: string;
  groundingMetadata?: GroundingMetadata;
}

/**
 * Sends a message to the current chat session and yields chunks of text and metadata.
 */
export async function* streamMessage(
  message: string, 
  modelId: ModelId, 
  currentHistory: Message[], 
  attachments: Attachment[] = [],
  useSearch: boolean = false
): AsyncGenerator<StreamResponse, void, unknown> {
  // If the model changed or session is null, re-init
  if (!chatSession || currentModelId !== modelId) {
    initChatSession(modelId, currentHistory);
  }

  if (!chatSession) {
    throw new Error("Failed to initialize chat session");
  }

  try {
    // Determine if the current model supports Maps (Flash 2.5 variants usually do)
    // Lite and Pro Preview often have restricted toolsets.
    const supportsMaps = modelId === ModelId.FLASH || modelId === ModelId.THINKING;

    // Enhance message with instruction if search is enabled
    let messageText = message;
    if (useSearch) {
      if (supportsMaps) {
        messageText += "\n\n[System: Google Search and Google Maps tools are enabled. Please use them to provide accurate, up-to-date information. If searching, cite your sources clearly. If finding locations, use the Maps tool.]";
      } else {
        messageText += "\n\n[System: Google Search is enabled. Please use it to provide accurate, up-to-date information. If searching, cite your sources clearly.]";
      }
    }

    // Construct the message payload. 
    let messagePayload: any = messageText;

    if (attachments.length > 0) {
      const parts: any[] = [];
      attachments.forEach(att => {
        parts.push({
          inlineData: {
            mimeType: att.mimeType,
            data: att.data
          }
        });
      });
      parts.push({ text: messageText });
      messagePayload = parts;
    }

    // Configure tools for this specific request
    const requestConfig: any = {};
    if (useSearch) {
      const tools: any[] = [{ googleSearch: {} }];
      
      // Only add Google Maps if supported by the model
      if (supportsMaps) {
        tools.push({ googleMaps: {} });
      }

      requestConfig.tools = tools;
      
      // Try to get location for better maps context ONLY if maps is enabled
      if (supportsMaps) {
        try {
           // Location retrieval logic would go here
        } catch (e) {
          // Ignore location errors
        }
      }
    }

    // Use standard sendMessageStream
    const resultStream = await chatSession.sendMessageStream({ 
      message: messagePayload,
      config: requestConfig 
    });

    for await (const chunk of resultStream) {
      const responseChunk = chunk as GenerateContentResponse;
      
      const output: StreamResponse = {};

      if (responseChunk.text) {
        output.text = responseChunk.text;
      }

      // Check for grounding metadata in the candidates
      const candidate = responseChunk.candidates?.[0];
      if (candidate?.groundingMetadata) {
        output.groundingMetadata = candidate.groundingMetadata as GroundingMetadata;
      }

      if (output.text || output.groundingMetadata) {
        yield output;
      }
    }
  } catch (error) {
    console.error("Error streaming message:", error);
    throw error;
  }
}

/**
 * Helper to check if API key is set
 */
export const hasApiKey = (): boolean => {
  return !!process.env.API_KEY;
};