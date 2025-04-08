<template>
  <!-- 骨架屏 -->
  <van-skeleton title avatar :row="3" :loading="props.loading" v-for="user in props.userList" :key="user.id">
    <!-- 用户卡片 -->
    <van-card
        :desc="user.bio || '这个人很懒，什么简介都没留下~'"
        :title="`${user.username || '匿名用户'}（${user.planetCode}）`"
        :thumb="user.avatarUrl || defaultAvatar"
    >
      <template #tags>
        <!-- 主页卡片标签显示上限 (最多8个) -->
        <van-tag plain type="danger" v-for="tag in safeParseTags(user.tags).slice(0, 8)" :key="tag" style="margin-right: 8px; margin-top: 8px">
          {{ tag }}
        </van-tag>
         <van-tag plain type="default" v-if="safeParseTags(user.tags).length > 8" style="margin-right: 8px; margin-top: 8px">...</van-tag>
      </template>
      <template #footer>
        <div style="display: flex; justify-content: flex-end; width: 100%;">
          <van-button size="mini" type="primary" @click="showContactInfo(user)">详细信息</van-button>
        </div>
      </template>
    </van-card>
  </van-skeleton>

  <!-- 详细信息弹窗 -->
  <van-dialog v-model:show="showDialog" title="详细信息" :show-confirm-button="false" close-on-click-overlay>
      <div style="padding: 16px 0;">
          <!-- 头像和基础信息 -->
          <div style="display: flex; align-items: center; padding: 0 16px 16px;">
              <van-image :src="currentUser?.avatarUrl || defaultAvatar" width="60" height="60" round style="margin-right: 16px;"/>
              <div>
                  <div style="font-size: 16px; font-weight: bold; margin-bottom: 4px; color: #323233;">{{ currentUser?.username || '匿名用户' }}</div>
                  <div style="font-size: 12px; color: #969799;">账号: {{ currentUser?.userAccount }}</div>
              </div>
          </div>

          <!-- 分组信息 -->
          <van-cell-group inset>
              <van-cell title="性别">
                <template #value>
                  <span :style="{ color: currentUser?.gender === undefined || currentUser?.gender === null ? '#969799' : '#323233' }">
                     <van-icon v-if="currentUser?.gender !== undefined && currentUser?.gender !== null" :name="currentUser?.gender === 1 ? 'female' : 'male'" :color="currentUser?.gender === 1 ? '#ee0a24' : '#1989fa'" style="margin-right: 4px;"/>
                     {{ formatGender(currentUser?.gender) }}
                  </span>
                </template>
              </van-cell>

              <van-cell title="标签">
                <template #value>
                   <!-- 容器允许滚动 -->
                   <div v-if="parsedTags && parsedTags.length > 0" class="scrollable-tags">
                       <van-tag v-for="tag in parsedTags" :key="tag" type="primary" style="margin-right: 4px; margin-bottom: 4px;">{{ tag }}</van-tag>
                   </div>
                   <!-- 无标签提示 -->
                   <span v-else style="color: #969799;">暂无标签</span>
                </template>
              </van-cell>

              <!-- 简介单元格 -->
               <van-cell title="简介" value-class="bio-value-container"> <!-- 给 value 的外层容器加 class -->
                <template #value>
                    <!-- 滚动容器 -->
                    <div class="bio-scroll-content">
                        <!-- 有简介内容 -->
                        <span v-if="currentUser?.bio" style="color: #323233;">
                            {{ currentUser?.bio }}
                        </span>
                        <!-- 无简介提示 -->
                        <span v-else style="color: #969799;">这个人很懒，什么都没留下</span>
                    </div>
                </template>
              </van-cell>

               <van-cell title="电话">
                 <template #value>
                     <span :style="{ color: currentUser?.phone ? '#323233' : '#969799' }">
                        {{ currentUser?.phone || '未设置' }}
                     </span>
                 </template>
               </van-cell>

               <van-cell title="邮箱">
                 <template #value>
                     <span :style="{ color: currentUser?.email ? '#323233' : '#969799' }">
                         {{ currentUser?.email || '未设置' }}
                     </span>
                 </template>
               </van-cell>
          </van-cell-group>
      </div>
      <!-- 底部关闭按钮 -->
       <div style="padding: 10px 16px;">
          <van-button type="primary" block @click="showDialog = false">关闭</van-button>
       </div>
  </van-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { UserType } from "../models/user";
import { Dialog, Image, Icon, Tag, Cell, CellGroup, Skeleton, Card, Button } from 'vant';
import defaultAvatar from '../assets/logo.png';

interface UserCardListProps {
  loading: boolean;
  userList: UserType[];
}

const props = withDefaults(defineProps<UserCardListProps>(), {
  loading: true,
  userList: () => [] as UserType[],
});

const showDialog = ref(false);
const currentUser = ref<UserType | null>(null);

const safeParseTags = (tagsJson?: string): string[] => {
  if (!tagsJson) return [];
  try {
    const tags = JSON.parse(tagsJson);
    return Array.isArray(tags) ? tags : [];
  } catch (e) {
    console.error("解析标签失败:", tagsJson, e);
    return [];
  }
};

const formatGender = (gender?: number): string => {
  if (gender === 1) return '女';
  if (gender === 0) return '男';
  return '未设置';
};

const parsedTags = computed(() => {
  return safeParseTags(currentUser.value?.tags);
});

const showContactInfo = (user: UserType) => {
  currentUser.value = user;
  showDialog.value = true;
};

</script>

<style scoped>
/* 主页卡片描述样式 */
.van-card__desc {
  max-height: 3em;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

/* 弹窗内标签滚动容器样式 */
.scrollable-tags {
  max-height: 80px; /* 限制最大高度 */
  overflow-y: auto; /* 超出高度则滚动 */
  text-align: right; /* 标签靠右显示 */
  padding-right: 5px;
  margin-right: -5px;
}
.scrollable-tags .van-tag {
  white-space: normal;
}


/* 弹窗内简介单元格 - value 的外层容器 */
/* 尝试让 value 容器占据更多空间 */
:deep(.bio-value-container) {
  flex: 3; /* 增加 flex 比例，给 value 更多空间，可调整 2, 3, 4 等*/
  text-align: left !important; /* 强制左对齐 */
  /* 确保容器能正确处理内部滚动 */
  overflow: hidden; /* 防止内部滚动条溢出容器本身 */
}

/* 弹窗内简介单元格 - 内部滚动内容区域 */
.bio-scroll-content {
  max-height: 80px; /* 恢复最大高度限制, 约 4-5 行 */
  overflow-y: auto; /* 恢复 Y 轴滚动条 */
  /* 以下样式保证文本正确换行显示 */
  white-space: normal;
  word-break: break-word;
  line-height: 1.5; /* 调整行高以便阅读 */
  text-align: left; /* 确保内容左对齐 */
  /* 可以加一点右内边距，避免文字紧贴滚动条 */
  padding-right: 5px;
}

/* 保证单元格标题和内容垂直对齐 (特别是当内容多行时) */
/* :deep(.van-cell__title),
:deep(.bio-value-container) { */
  /* 默认 van-cell 就是 flex 布局并 align-items: center，一般无需额外设置 */
  /* 如果出现不对齐，可以取消注释并尝试设置 align-items: flex-start 或 center */
/* } */

</style>