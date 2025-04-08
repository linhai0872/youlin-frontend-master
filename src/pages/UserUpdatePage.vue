<template>
  <template v-if="user">
    <!-- 使用 Cell Group 增加边距和分组感 -->
    <van-cell-group inset>
      <van-cell title="昵称" is-link :value="user.username || '未设置'" @click="toEdit('username', '昵称', user.username)" />
      <van-cell title="账号" :value="user.userAccount"/>
      <van-cell title="头像" is-link @click="toEditAvatar">
        <img style="height: 48px; border-radius: 50%;" :src="user.avatarUrl || defaultAvatar"/>
      </van-cell>
      <van-cell title="性别" is-link :value="formatGender(user.gender)" @click="toEditGender"/>
      <van-cell title="电话" is-link :value="user.phone || '未设置'" @click="toEdit('phone', '电话', user.phone)" />
      <van-cell title="邮箱" is-link :value="user.email || '未设置'" @click="toEdit('email', '邮箱', user.email)" />
      <!-- 简介显示预览 (placeholder 文本颜色跟随 Vant is-link 默认) -->
      <van-cell title="简介" is-link :value="previewBio" @click="toEdit('bio', '简介', user.bio)" />

      <!-- 编辑标签入口显示更多标签 -->
      <van-cell title="我的标签" is-link @click="gotoEditTags">
        <template #value>
          <div v-if="userTags && userTags.length > 0" class="tag-preview">
            <!-- 最多显示 8 个标签预览 -->
            <van-tag v-for="tag in userTags.slice(0, 8)" :key="tag" type="primary" style="margin-right: 4px; margin-bottom: 4px;">{{ tag }}</van-tag>
            <span v-if="userTags.length > 8" style="color: #969799;">...</span>
          </div>
          <!-- 修改：给 placeholder span 添加 class -->
          <span v-else class="placeholder-text">点击编辑标签</span>
        </template>
      </van-cell>

      <van-cell title="星球编号" :value="user.planetCode"/>
      <van-cell title="注册时间" :value="formatDateTime(user.createTime)"/>
    </van-cell-group>
  </template>
  <van-empty v-else description="用户信息加载中..." />
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import { onMounted, ref, computed } from "vue";
import { Toast, Cell, CellGroup, Tag, Empty } from "vant"; // 确保导入所需组件
import { getCurrentUser } from "../services/user";
import type { UserType } from "../models/user";
import defaultAvatar from '../assets/logo.png';

const user = ref<UserType | null>(null);
const router = useRouter();

// --- 格式化函数 ---
function formatDateTime(dateTimeString: string | Date | undefined): string {
  if (!dateTimeString) return "N/A";
  const date = new Date(dateTimeString);
  if (isNaN(date.getTime())) return "无效日期";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

const formatGender = (gender: number | undefined): string => {
    if (gender === 1) return '女';
    if (gender === 0) return '男';
    return '未设置';
}

// --- 生命周期 ---
onMounted(async () => {
  const currentUser = await getCurrentUser();
   if (currentUser) {
    user.value = currentUser;
  } else {
    Toast.fail('未登录或获取用户信息失败');
    router.push('/user/login');
  }
});

// --- 计算属性 ---
// 解析用户标签
const userTags = computed(() => {
  if (user.value?.tags) {
    try {
      const parsedTags = JSON.parse(user.value.tags);
      return Array.isArray(parsedTags) ? parsedTags : [];
    } catch (e) {
      console.error("解析用户标签失败:", e);
      return [];
    }
  }
  return [];
});

// 生成简介预览
const previewBio = computed(() => {
  const bio = user.value?.bio;
  if (bio) {
    return bio.length > 20 ? bio.slice(0, 20) + '...' : bio;
  }
  return '点击设置简介'; // 返回 placeholder 字符串
});


// --- 导航函数 ---
const toEdit = (editKey: keyof UserType, editName: string, currentValue: any) => {
  const valueToPass = currentValue === null || currentValue === undefined ? '' : currentValue;
  router.push({
    path: '/user/edit',
    query: {
      editKey: String(editKey),
      editName,
      currentValue: String(valueToPass),
    }
  })
}

const toEditAvatar = () => {
    if(user.value) {
        toEdit('avatarUrl', '头像', user.value.avatarUrl);
    }
}

const toEditGender = () => {
    if(user.value) {
        toEdit('gender', '性别', String(user.value.gender ?? ''));
    }
}

const gotoEditTags = () => {
  router.push('/user/tag/edit');
};
</script>

<style scoped>
.tag-preview {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  max-height: 4.5em;
  overflow: hidden;
}


.placeholder-text {
  color: #969799; /* 设置 placeholder 文本为灰色 */
}

</style>