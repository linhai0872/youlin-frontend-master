<template>
  <van-nav-bar
      :title="title"
      :left-arrow="showLeftArrow"
      @click-left="onClickLeft"
      @click-right="onClickRight"
  >
    <!-- 右上角图标 -->
    <template #right>
      <van-icon v-if="currentRoute.path === '/'" name="search" size="18" @click="onClickRight" />
    </template>
  </van-nav-bar>
  <div id="content">
    <router-view />
  </div>
  <van-tabbar route @change="onChange">
    <van-tabbar-item to="/" icon="home-o" name="index">主页</van-tabbar-item>
    <van-tabbar-item to="/team" icon="search" name="team">队伍</van-tabbar-item>
    <van-tabbar-item to="/ai" icon="chat-o" name="ai">聊天</van-tabbar-item>
    <van-tabbar-item to="/user" icon="friends-o" name="user">个人</van-tabbar-item>
  </van-tabbar>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import { ref, watch } from "vue";
import routes from "../config/route";

const router = useRouter();
const DEFAULT_TITLE = '有林'; // 可以保留一个默认标题
const title = ref(DEFAULT_TITLE);
const currentRoute = ref(router.currentRoute.value);
const showLeftArrow = ref(false);

/**
 * 根据路由切换标题和返回按钮
 */
router.beforeEach((to) => {
  updateTitleAndArrow(to);
});

watch(() => router.currentRoute.value, (to) => {
  currentRoute.value = to;
  updateTitleAndArrow(to); // 更新标题和返回箭头
});

function updateTitleAndArrow(route) {
  const toPath = route.path;

  // 使用 if/else if/else 结构设置标题
  if (toPath === '/') {
    title.value = '有林';
  } else if (toPath === '/team') {
    title.value = '寻找队伍';
  } else if (toPath === '/ai') {
     // 处理 /ai 路由的标题
    if (route.query.conversationId) {
        title.value = '有林AI助手';
    } else {
        title.value = '聊天';
    }
  } else if (toPath === '/user') {
    title.value = '个人信息';
  } else if (toPath === '/team/add') {
    title.value = '创建队伍';
  } else if (toPath === '/user/tag/edit') {
    title.value = '编辑标签';
  } else if (toPath === '/team/update') {
    title.value = '更新队伍';
  } else if (toPath === '/search') {
    title.value = '寻友';
  } else if (toPath === '/user/list') {
    title.value = '用户列表';
  } else if (toPath === '/user/edit') {
    title.value = '编辑信息';
  } else if (toPath.startsWith('/team/') && toPath.endsWith('/chat')) {
    // 可以在这里异步获取队伍名称设置更具体的标题，或者用通用标题
    title.value = '队伍聊天';
  }else if (toPath === '/user/register') {
      title.value = '注册';
  }else if (toPath === '/user/login') {
    title.value = '登录';
  } else if (toPath === '/user/update') {
    title.value = '更新信息';
  } else if (toPath === '/user/team/join') {
    title.value = '加入队伍';
  } else if (toPath === '/user/team/create') {
    title.value = '创建队伍';
  } else if (toPath.startsWith('/ai-settings/')) {
    title.value = 'AI 会话设置';
  }else {
    title.value = DEFAULT_TITLE; // 其他情况使用默认标题
  }

  // 根据路由路径判断是否显示返回按钮
  const basePaths = ['/', '/team', '/ai', '/user']; // 基础路径列表
  showLeftArrow.value = !basePaths.includes(toPath) || (toPath === '/ai' && route.query.conversationId); // 保留 AI 聊天页的特殊逻辑
    if (toPath === '/ai' && route.query.conversationId) {
        showLeftArrow.value = true;
    }
}

const onClickLeft = () => {
    // 统一的返回逻辑
    if (currentRoute.value.path === '/ai' && currentRoute.value.query.conversationId) {
        // 如果在 AI 聊天页面，点击返回按钮回到 AI 会话列表
        router.replace('/ai');
    } else {
        // 其他情况使用 router.back()
        router.back();
    }
};

const onClickRight = () => {
  if (currentRoute.value.path === '/') {
    router.push('/search');
  }
};

const onChange = (index: number) => {
  // 如果当前在 AI 聊天界面，则不允许切换标签栏
  if (currentRoute.value.path.startsWith('/ai') && currentRoute.value.query.conversationId) {
    // 这里可以添加提示，例如使用 Vant 的 Toast 组件
    return false; // 阻止切换
  }
};
</script>

<style scoped>
#content {
  padding-bottom: 50px;
}
</style>