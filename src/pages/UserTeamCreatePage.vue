<template>
  <div id="userTeamCreatePage" class="page-container">
    <van-search v-model="searchText" placeholder="搜索我创建的队伍" @search="onSearch" />

    <!-- 移除之前的按钮容器 -->
    <!-- <div class="create-button-container">
      <van-button type="primary" icon="plus" @click="goToAddTeam">创建新队伍</van-button>
    </div> -->

    <!-- 添加一个间距 -->
     <div style="margin-bottom: 16px;"></div>

    <!-- 传递 loading 状态，监听 refresh 事件 -->
    <team-card-list :teamList="teamList" :loading="loading" @refresh="handleRefresh" />

    <!-- 优化空状态显示：仅在非加载状态且列表为空时显示 -->
    <van-empty v-if="!loading && teamList?.length < 1" description="您还没有创建任何队伍"/>

    <!-- **** 添加与 TeamPage 相同的固定圆形按钮 **** -->
    <van-button
        class="create-team-button"
        type="primary"
        icon="plus"
        round
        @click="goToAddTeam"
     />
     <!-- **** 添加结束 **** -->

  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import TeamCardList from "../components/TeamCardList.vue";
import { onMounted, ref } from "vue";
import myAxios from "../plugins/myAxios";
// 确保导入所需组件 (Button 已被导入)
import { Toast, Search, Button, Empty } from "vant";

const router = useRouter();
const searchText = ref('');
const teamList = ref([]);
const loading = ref(true); // 添加 loading 状态，默认为 true

// 跳转到创建队伍页
const goToAddTeam = () => { // 函数名保持不变
  router.push({
    path: "/team/add"
  })
}

/**
 * 加载我创建的队伍列表
 * @param val 搜索关键词
 */
const listTeam = async (val = '') => {
  loading.value = true; // 开始加载
  try {
    const res = await myAxios.get("/team/list/my/create", {
      params: {
        searchText: val,
        pageNum: 1,
        pageSize: 20,
      },
    });
    if (res?.code === 0 && Array.isArray(res.data)) {
      teamList.value = res.data;
    } else {
      Toast.fail('加载队伍失败' + (res?.description ? `：${res.description}` : '，请刷新重试'));
      teamList.value = [];
    }
  } catch (error) {
    console.error("加载我创建的队伍列表错误:", error);
    Toast.fail('网络错误，加载失败');
    teamList.value = [];
  } finally {
    loading.value = false; // 加载结束
  }
}

// 处理子组件触发的刷新事件
const handleRefresh = () => {
    console.log("收到 TeamCardList 的 refresh 事件，重新加载列表");
    listTeam(searchText.value);
}

// 页面加载时只触发一次
onMounted( () => {
  listTeam();
})

// 搜索时触发
const onSearch = (val) => {
  listTeam(val);
};

</script>

<style scoped>
.page-container {
  padding: 10px;
  padding-bottom: 60px; /* 仍然需要为底部导航栏留出空间 */
  position: relative; /* 确保上下文 */
  min-height: calc(100vh - 100px); /* 估算最小高度 */
}

/* 移除之前的按钮容器样式 */
/* .create-button-container { ... } */

/* **** 添加与 TeamPage 相同的按钮样式 **** */
.create-team-button {
  position: fixed; /* 固定在视口 */
  bottom: 70px;    /* 距离底部 (与 TeamPage 一致) */
  right: 20px;     /* 距离右侧 (与 TeamPage 一致) */
  z-index: 100;    /* 确保在顶层 */
  width: 50px;     /* 固定宽高 */
  height: 50px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15); /* 添加阴影 */
}
/* **** 样式结束 **** */

.van-empty {
  margin-top: 20px;
}
</style>