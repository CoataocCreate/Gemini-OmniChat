export enum Role {
  USER = 'user',
  MODEL = 'model'
}

export interface Attachment {
  mimeType: string;
  data: string; // Base64 string
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export interface GroundingMetadata {
  groundingChunks: GroundingChunk[];
  webSearchQueries?: string[];
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  attachments?: Attachment[];
  isThinking?: boolean;
  timestamp: number;
  groundingMetadata?: GroundingMetadata;
}

export enum ModelId {
  LITE = 'lite',
  FLASH = 'flash',
  THINKING = 'thinking',
  PRO = 'pro',
}

export interface ModelConfig {
  id: ModelId;
  apiModel: string;
  name: string;
  description: string;
  icon: string;
  isThinking?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  modelId: ModelId;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export const AVAILABLE_MODELS: ModelConfig[] = [
  {
    id: ModelId.LITE,
    apiModel: 'gemini-flash-lite-latest',
    name: 'Flash Lite',
    description: 'Fastest & cost-effective. Best for simple tasks.',
    icon: '🚀',
  },
  {
    id: ModelId.FLASH,
    apiModel: 'gemini-2.5-flash',
    name: 'Flash 2.5',
    description: 'Balanced performance. Good for general daily use.',
    icon: '⚡',
  },
  {
    id: ModelId.THINKING,
    apiModel: 'gemini-2.5-flash',
    name: 'Flash Thinking',
    description: 'Enhanced reasoning with 2.5 Thinking config.',
    icon: '🧠',
    isThinking: true,
  },
  {
    id: ModelId.PRO,
    apiModel: 'gemini-3-pro-preview',
    name: 'Pro 3.0',
    description: 'Top-tier intelligence for complex problem solving.',
    icon: '💎',
  },
];