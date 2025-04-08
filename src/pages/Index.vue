<template>
  <!-- 心动模式开关 -->
  <van-cell center title="心动模式">
    <template #right-icon>
      <van-switch v-model="isMatchMode" size="24" @change="onModeChange" :disabled="loading" />
    </template>
  </van-cell>

  <!-- 加载状态 -->
  <div v-if="loading" style="text-align: center; padding: 20px;">
    <van-loading size="24px">加载中...</van-loading>
  </div>

  <!-- 用户列表区域 (非加载状态) -->
  <div v-else>
    <!-- 数据为空提示 -->
    <van-empty v-if="userList.length === 0" description="暂无用户数据" />

    <!-- 用户卡片列表 -->
    <user-card-list v-else :user-list="userList" :loading="false" />

    <!-- 分页控件 (仅在普通模式且有数据时显示) -->
    <van-pagination
        v-if="!isMatchMode && totalItems > 0"
        v-model="currentPage"
        :total-items="totalItems"
        :items-per-page="pageSize"
        force-ellipses
        @change="onPageChange"
        style="margin-top: 16px;"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import myAxios from "../plugins/myAxios";
import { Toast, Loading, Pagination, Cell, Switch, Empty } from "vant"; // 导入所需组件
import UserCardList from "../components/UserCardList.vue";
import { UserType } from "../models/user";
import { useRouter } from 'vue-router';
import { getCurrentUser } from "../services/user";

const router = useRouter();

// --- 状态定义 ---
const isMatchMode = ref<boolean>(false); // 是否为心动模式
const userList = ref<UserType[]>([]);     // 用户列表数据
const loading = ref(true);           // 页面加载状态
const firstLoad = ref(true);          // 是否首次加载（用于 onMounted 判断）

// 分页参数
const currentPage = ref(1);          // 当前页码
const pageSize = 10;                // 每页数量
const totalItems = ref(0);           // 总条数 (用于分页组件)

// --- 生命周期 ---

onMounted(async () => {
  // 1. 检查登录状态
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    Toast('请先登录');
    router.push('/user/login');
    return;
  }
  // 2. 首次加载数据
  firstLoad.value = true;
  await fetchUsers();
  firstLoad.value = false;
});

// --- 数据获取 ---

/**
 * 获取用户数据
 */
const fetchUsers = async () => {
  loading.value = true;
  userList.value = []; // 清空旧数据，特别是分页切换时
  try {
    let res;
    if (isMatchMode.value) {
      // 心动模式：获取匹配用户 (假设后端返回固定数量，不支持分页)
      const num = 10; // 获取数量
      res = await myAxios.get('/user/match', { params: { num } });
      userList.value = res?.data || [];
      totalItems.value = userList.value.length; // 心动模式总数即为返回数量
      currentPage.value = 1; // 心动模式强制回到第一页
    } else {
      // 普通模式：获取推荐用户 (分页)
      res = await myAxios.get('/user/recommend', {
        params: {
          pageSize: pageSize,
          pageNum: currentPage.value,
        },
      });
      userList.value = res?.data?.records || [];
      totalItems.value = res?.data?.total || 0;

      // 如果当前页码大于总页数（例如切换模式后），则重新加载第一页
       const totalPages = Math.ceil(totalItems.value / pageSize);
       if (totalItems.value > 0 && currentPage.value > totalPages) {
           console.log(`Current page ${currentPage.value} exceeds total pages ${totalPages}. Fetching page 1.`);
           currentPage.value = 1;
           // 重新获取第一页数据 (避免递归调用，可以考虑在 onPageChange 中处理)
           // 或者，如果 res?.data?.records 为空，说明当前页无效，可以在这里直接再次请求第一页
           // 为简化，我们在 onPageChange 处理，这里仅设置 currentPage
       }
    }

  } catch (err: any) {
    console.error('加载用户数据失败:', err);
    // 避免在首次检查登录失败时弹出加载失败
    if (!firstLoad.value) {
        Toast.fail(err?.message || '加载失败，请稍后重试');
    }
    userList.value = []; // 出错清空列表
    totalItems.value = 0;
  } finally {
    loading.value = false;
  }
};

// --- 事件处理 ---

/**
 * 分页页码变化
 */
const onPageChange = (page: number) => {
  console.log(`Page changed to: ${page}`);
  // currentPage 会通过 v-model 自动更新
  fetchUsers(); // 重新获取数据
};

/**
 * 模式切换
 */
const onModeChange = (checked: boolean) => {
    console.log(`Mode changed to: ${checked ? 'Match' : 'Recommend'}`);
    isMatchMode.value = checked; // 更新模式状态
    currentPage.value = 1; // 切换模式时，重置到第一页
    totalItems.value = 0; // 重置总数，等待 fetchUsers 更新
    fetchUsers(); // 获取新模式下的数据
};

</script>

<style scoped>
/* 为加载状态和空状态提供一些间距 */
.van-loading, .van-empty {
  padding-top: 50px;
  padding-bottom: 50px;
}
</style>