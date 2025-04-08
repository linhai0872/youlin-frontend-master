/**
 * 队伍聊天消息类型
 */
export type TeamChatMessage = {
    id: number;
    teamId: number;
    userId: number;
    content: string;
    createTime: Date | string; // 后端传来可能是字符串
    username?: string;      // 发送者昵称 (后端关联查询提供)
    avatarUrl?: string;     // 发送者头像 (后端关联查询提供)
};