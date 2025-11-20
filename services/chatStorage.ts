import { ChatSession, ModelId } from '../types';

const STORAGE_KEY = 'gemini_omnichat_sessions';

export const loadSessions = (): ChatSession[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const sessions = JSON.parse(stored);
    // Sort by updatedAt desc
    return sessions.sort((a: ChatSession, b: ChatSession) => b.updatedAt - a.updatedAt);
  } catch (e) {
    console.error("Failed to load sessions", e);
    return [];
  }
};

export const saveSession = (session: ChatSession) => {
  try {
    const sessions = loadSessions();
    const index = sessions.findIndex(s => s.id === session.id);
    
    if (index >= 0) {
      sessions[index] = session;
    } else {
      sessions.unshift(session);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    return sessions;
  } catch (e) {
    console.error("Failed to save session", e);
    return [];
  }
};

export const deleteSession = (sessionId: string) => {
  try {
    const sessions = loadSessions().filter(s => s.id !== sessionId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    return sessions;
  } catch (e) {
    console.error("Failed to delete session", e);
    return [];
  }
};

export const createNewSession = (modelId: ModelId): ChatSession => ({
  id: Date.now().toString(),
  title: 'New Chat',
  modelId,
  messages: [],
  createdAt: Date.now(),
  updatedAt: Date.now(),
});
