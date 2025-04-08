<template>
  <div id="teamPage">
    <van-search v-model="searchText" placeholder="搜索队伍" @search="onSearch" />
    <van-tabs v-model:active="active" @change="onTabChange">
      <van-tab title="公开" name="public" />
      <van-tab title="加密" name="private" /> <!-- 注意：这里指 status=2 -->
    </van-tabs>
    <div style="margin-bottom: 16px" />

    <!-- 传递 loading 状态给子组件 -->
    <!-- 监听子组件的 refresh 事件 -->
    <team-card-list :teamList="teamList" :loading="loading" @refresh="handleRefresh" />

    <!-- 优化空状态显示 -->
    <van-empty v-if="!loading && teamList?.length < 1" description="暂无满足条件的队伍" />

    <!-- **** 使用固定定位的 van-button 替代 FloatingBubble **** -->
    <van-button
        class="create-team-button"
        type="primary"
        icon="plus"
        round
        @click="toAddTeam"
     />
    <!-- **** 替代结束 **** -->

  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import TeamCardList from "../components/TeamCardList.vue";
import { onMounted, ref } from "vue";
import myAxios from "../plugins/myAxios";
// **** 确保导入了 Button **** (如果之前没有显式导入，需要加上)
import { Toast, Empty, Search, Tabs, Tab, Button } from "vant"; // 移除了 FloatingBubble，确保 Button 在这里

const active = ref('public');
const router = useRouter();
const searchText = ref('');
const teamList = ref([]);
const loading = ref(true); // 初始加载状态

// 切换查询状态
const onTabChange = (name) => {
  const status = name === 'public' ? 0 : 2; // 公开=0, 加密=2
  listTeam(searchText.value, status);
}

// 跳转到创建队伍页
const toAddTeam = () => {
  router.push({ path: "/team/add" });
}

// 获取队伍列表
const listTeam = async (val = '', status = 0) => {
  loading.value = true; // 开始加载，设置 loading 为 true
  try {
    const res = await myAxios.get("/team/list", {
      params: {
        searchText: val,
        pageNum: 1,
        pageSize: 20,
        status,
      },
    });
    if (res?.code === 0 && Array.isArray(res.data)) {
      teamList.value = res.data;
    } else {
      Toast.fail('加载队伍失败' + (res?.description ? `:${res.description}`: ''));
      teamList.value = []; // 清空列表防止显示旧数据
    }
  } catch (error) {
    console.error("加载队伍列表错误:", error);
    Toast.fail('网络错误，加载队伍失败');
    teamList.value = []; // 清空列表
  } finally {
    loading.value = false; // 加载结束，设置 loading 为 false
  }
}

// 处理子组件触发的刷新事件
const handleRefresh = () => {
    const currentStatus = active.value === 'public' ? 0 : 2;
    listTeam(searchText.value, currentStatus);
}

// 页面加载时触发
onMounted( () => {
  listTeam(searchText.value, 0); // 默认加载公开队伍
})

// 搜索时触发
const onSearch = (val) => {
  const currentStatus = active.value === 'public' ? 0 : 2;
  listTeam(val, currentStatus);
};

</script>

<style scoped>
#teamPage {
  padding-bottom: 50px; /* 为底部导航栏留出空间 */
  position: relative; /* 如果按钮使用 absolute 定位，父元素需要相对定位 */
  min-height: calc(100vh - 100px); /* 估算一个最小高度，防止内容过少时按钮位置不对 */
}

/* **** 添加创建按钮的样式 **** */
.create-team-button {
  position: fixed; /* 固定在视口 */
  bottom: 70px;    /* 距离底部 */
  right: 20px;     /* 距离右侧 */
  z-index: 100;    /* 确保在顶层 */
  width: 50px;     /* 设置固定宽高使按钮为圆形 */
  height: 50px;
  /* 可以根据需要调整阴影等样式 */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}
/* **** 样式结束 **** */

</style>