import myAxios from '../plugins/myAxios';
import type { TeamChatMessage } from '../models/chat'; // 需要创建 chat.d.ts

/**
 * 发送队伍聊天消息
 * @param teamId 队伍 ID
 * @param content 消息内容
 */
export const sendTeamMessage = (teamId: number, content: string) => {
  return myAxios.post(`/chat/team/${teamId}/message`, { content });
};

/**
 * 获取队伍聊天消息列表
 * @param teamId 队伍 ID
 */
export const listTeamMessages = (teamId: number) => {
  // 后端返回的数据结构是 BaseResponse<List<TeamChatMessage>>
  // myAxios 拦截器处理后，这里直接得到 data 部分，即 List<TeamChatMessage>
  return myAxios.get<TeamChatMessage[]>(`/chat/team/${teamId}/messages`);
};