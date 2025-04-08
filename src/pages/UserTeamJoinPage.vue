<template>
  <div id="userTeamJoinPage" class="page-container">
    <van-search v-model="searchText" placeholder="搜索我加入的队伍" @search="onSearch" />

    <!-- 添加一个间距，让列表不紧贴搜索框 -->
    <div style="margin-bottom: 16px;"></div>

    <!-- 传递 loading 状态，监听 refresh 事件 -->
    <team-card-list :teamList="teamList" :loading="loading" @refresh="handleRefresh" />

    <!-- 优化空状态显示：仅在非加载状态且列表为空时显示 -->
    <van-empty v-if="!loading && teamList?.length < 1" description="您还没有加入任何队伍"/>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router"; // useRouter 可能不再需要，除非有其他跳转逻辑
import TeamCardList from "../components/TeamCardList.vue";
import { onMounted, ref } from "vue";
import myAxios from "../plugins/myAxios";
// 确保导入所需组件
import { Toast, Search, Empty } from "vant";

// const router = useRouter(); // 如果没有其他跳转，可以移除
const searchText = ref('');
const teamList = ref([]);
const loading = ref(true); // 添加 loading 状态，默认为 true

/**
 * 加载我加入的队伍列表
 * @param val 搜索关键词
 */
const listTeam = async (val = '') => {
  loading.value = true; // 开始加载
  try {
    const res = await myAxios.get("/team/list/my/join", {
      params: {
        searchText: val,
        pageNum: 1, // 可以根据需要添加分页参数
        pageSize: 20,
      },
    });
    // 确认后端返回数据结构正确
    if (res?.code === 0 && Array.isArray(res.data)) {
      teamList.value = res.data;
    } else {
      Toast.fail('加载队伍失败' + (res?.description ? `：${res.description}` : '，请刷新重试'));
      teamList.value = []; // 加载失败时清空
    }
  } catch (error) {
    console.error("加载我加入的队伍列表错误:", error);
    Toast.fail('网络错误，加载失败');
    teamList.value = []; // 网络错误时清空
  } finally {
    loading.value = false; // 加载结束
  }
}

// 处理子组件触发的刷新事件 (例如退出队伍后)
const handleRefresh = () => {
    console.log("收到 TeamCardList 的 refresh 事件，重新加载列表");
    listTeam(searchText.value); // 使用当前的搜索词重新加载
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
  padding: 10px; /* 给整个页面一些内边距 */
  padding-bottom: 60px; /* 防止底部内容被导航栏遮挡 */
}

/* 可以为 van-empty 添加一些上边距 */
.van-empty {
  margin-top: 20px;
}
</style>