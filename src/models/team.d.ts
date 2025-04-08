export type TeamType = {
    id: number;
    name: string;
    description: string;
    expireTime?: Date | string | null; // 允许 null
    maxNum: number;
    password?: string;
    status: number; // 0 公开, 1 私有, 2 加密
    createTime: Date | string;
    updateTime: Date | string;
    createUser?: UserType;      // 创建者信息 (重要)
    hasJoin: boolean;          // 当前用户是否已加入 (重要)
    hasJoinNum?: number;       // 当前已加入人数
    // 可能还需要一个成员列表，但这通常在详情接口获取
    // members?: UserType[];
};