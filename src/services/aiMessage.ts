import myAxios from '../plugins/myAxios';
import type { AiMessageSendRequest } from '../models/aiMessage';
import {Toast} from "vant";

/**
 * 初始化 AI 会话
 */
export const initAiConversation = () => {
    return myAxios.post('/ai_conversation/create');
};

/**
 * 获取 AI 会话列表
 */
export const listAiConversations = () => {
  return myAxios.get('/ai_conversation/list');
};

/**
 * 获取 AI 会话消息
 * @param conversationId
 */
export const getAiConversationMessages = (conversationId: string) => { // 参数类型是 string
  return myAxios.get(`/ai_conversation/${conversationId}/message/get`);
};

/**
 * 发送 AI 消息
 * @param conversationId
 * @param sendRequest
 */
export const sendAiMessage = (conversationId: number, sendRequest: AiMessageSendRequest) => {
  return myAxios.post(`/ai_conversation/${conversationId}/message/send`, sendRequest);
};

/**
 * 退出 AI 会话
 * @param conversationId
 */
export const quitAiConversation = (conversationId: number) => {
    return myAxios.post(`/ai_conversation/${conversationId}/quit`);
};

/**
 * 清除 AI 会话消息
 * @param conversationId
 */
export const clearAiConversationMessages = (conversationId: number) => {
    return myAxios.post(`/ai_conversation/${conversationId}/message/delete`);
};

/**
 * 设置 AI 会话参数
 * @param conversationId
 * @param prompt
 */
export const setAiConversationSettings = (conversationId: number, prompt: string) => {
  return myAxios.post(`/ai_conversation/${conversationId}/setting`,null, {
        params: {
            prompt: prompt,
        }
  });
};