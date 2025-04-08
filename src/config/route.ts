// 定义一些路由
import Index from "../pages/Index.vue";
import Team from "../pages/TeamPage.vue";
import UserPage from "../pages/UserPage.vue";
import UserUpdatePage from "../pages/UserUpdatePage.vue";
import UserTeamJoinPage from "../pages/UserTeamJoinPage.vue";
import UserTeamCreatePage from "../pages/UserTeamCreatePage.vue";
import SearchPage from "../pages/SearchPage.vue";
import SearchResultPage from "../pages/SearchResultPage.vue";
import UserEditPage from "../pages/UserEditPage.vue";
import UserLoginPage from "../pages/UserLoginPage.vue";
import TeamAddPage from "../pages/TeamAddPage.vue";
import TeamUpdatePage from "../pages/TeamUpdatePage.vue";
import UserRegisterPage from "../pages/UserRegisterPage.vue";
import TeamChatPage from "../pages/TeamChatPage.vue";

import UserTagEditPage from "../pages/UserTagEditPage.vue";

import AiChatPage from "../pages/AiChatPage.vue";
import AiSettingsPage from "../pages/AiSettingsPage.vue";



const routes = [
    { path: '/', component: Index },
    { path: '/team', title: '寻找队伍', component: Team },
    { path: '/team/add', title: '创建队伍', component: TeamAddPage },
    { path: '/team/update', title: '更新队伍', component: TeamUpdatePage },
    { path: '/user', title: '个人信息', component: UserPage },
    { path: '/search', title: '寻友', component: SearchPage },
    { path: '/user/list', title: '用户列表', component: SearchResultPage },
    {
        path: '/team/:teamId/chat', // <-- 确认这里完全正确
        name: 'TeamChat',            // name 是可选的，但 path 必须正确
        component: TeamChatPage,
        meta: { title: '队伍聊天' }
    },
    { path: '/user/edit', title: '编辑信息', component: UserEditPage },
    { path: '/user/register', title: '注册', component: UserRegisterPage },
    { path: '/user/login', title: '登录', component: UserLoginPage },
    { path: '/user/update', title: '更新信息', component: UserUpdatePage },
    { path: '/user/team/join', title: '加入队伍', component: UserTeamJoinPage },
    { path: '/user/team/create', title: '创建队伍', component: UserTeamCreatePage },
    { path: '/user/tag/edit', title: '编辑标签', component: UserTagEditPage },
    { path: '/ai', title: '聊天' , component: AiChatPage},
    { path: '/ai-settings/:conversationId', title: 'AI 会话设置' , component: AiSettingsPage},
]

export default routes;