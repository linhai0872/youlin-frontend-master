// src/models/user.d.ts

/**
 * 用户类别
 */
export type UserType = {
    id: number;
    username: string;
    userAccount: string;
    avatarUrl?: string;
    bio: string; 
    gender: number;      // 0-男, 1-女
    phone: string;
    email: string;
    userStatus: number;
    userRole: number;
    planetCode: string;
    tags: string;        // 注意：后端传来的是 JSON 字符串，前端需要解析
    createTime: Date;
};