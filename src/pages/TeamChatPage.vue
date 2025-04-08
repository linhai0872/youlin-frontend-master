<template>
    <div class="team-chat-page">
      <!-- 消息列表 -->
      <div class="message-list" ref="messageListRef">
        <div v-if="loading" class="loading-indicator">
           <van-loading size="24px">加载消息中...</van-loading>
        </div>
         <van-empty v-else-if="messages.length === 0" description="还没有人发言哦~" />
        <div
          v-else
          v-for="message in messages"
          :key="message.id"
          :class="['message-item', message.userId === currentUserId ? 'sent' : 'received']"
        >
          <!-- 头像 (非本人消息显示) -->
          <van-image
            v-if="message.userId !== currentUserId"
            round
            width="35"
            height="35"
            :src="message.avatarUrl || defaultAvatar"
            class="avatar received-avatar"
          />
          <!-- 消息气泡 -->
          <div class="message-bubble">
            <!-- 用户名 (非本人消息显示) -->
            <div v-if="message.userId !== currentUserId" class="username">
              {{ message.username || '用户' + message.userId }}
            </div>
            <!-- 消息内容 -->
            <div class="content">{{ message.content }}</div>
            <!-- 时间戳 (可选) -->
            <!-- <div class="timestamp">{{ formatTime(message.createTime) }}</div> -->
          </div>
           <!-- 头像 (本人消息显示) -->
           <van-image
             v-if="message.userId === currentUserId"
             round
             width="35"
             height="35"
             :src="message.avatarUrl || defaultAvatar"
             class="avatar sent-avatar"
           />
        </div>
      </div>
  
      <!-- 输入区域 -->
      <div class="input-area">
        <van-field
          v-model="inputMessage"
          rows="1"
          autosize
          type="textarea"
          placeholder="说点什么..."
          class="input-field"
          :border="false"
           @keyup.enter="handleSend"
        />
        <van-button
          type="primary"
          size="small"
          class="send-button"
          @click="handleSend"
          :disabled="isSending || !inputMessage.trim()"
          :loading="isSending"
        >
          发送
        </van-button>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue';
  import { useRoute } from 'vue-router';
  import { Toast, Loading, Empty, Field, Button, Image as VanImage } from 'vant';
  import { listTeamMessages, sendTeamMessage } from '../services/chat';
  import { getCurrentUser } from '../services/user'; // 复用获取当前用户方法
  import type { TeamChatMessage } from '../models/chat';
  import type { UserType } from '../models/user';
  
  const route = useRoute();
  const messageListRef = ref<HTMLDivElement | null>(null);
  
  const teamId = ref<number | null>(null);
  const messages = ref<TeamChatMessage[]>([]);
  const inputMessage = ref('');
  const loading = ref(true);
  const isSending = ref(false);
  const currentUser = ref<UserType | null>(null);
  const currentUserId = computed(() => currentUser.value?.id);
  const defaultAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'; // 默认头像
  
  let pollInterval: number | null = null;
  const POLLING_INTERVAL_MS = 5000; // 5秒轮询一次
  
  onMounted(async () => {
    const id = route.params.teamId;
    if (typeof id === 'string') {
      teamId.value = parseInt(id, 10);
    } else {
      Toast.fail('无效的队伍ID');
    
    currentUser.value = await getCurrentUser();
    console.log('Current User:', currentUser.value); // <-- 添加日志3：检查当前用户信息
    if (!currentUser.value) {
        Toast.fail('请先登录');
        return;
    }
    // 确保 currentUserId 能正确计算
    console.log('Current User ID:', currentUserId.value); // <-- 添加日志4：检查计算出的ID

    await fetchMessages();
    startPolling();
      // 可以考虑跳转回上一页 router.back();
    }
  
    // 获取当前用户信息
    currentUser.value = await getCurrentUser();
    if (!currentUser.value) {
        Toast.fail('请先登录');
        // router.push('/user/login'); // 跳转到登录页
        return;
    }
  
    // 首次加载消息
    await fetchMessages();
  
    // 启动轮询
    startPolling();
  
    // TODO: 获取队伍信息，设置页面标题 (如果需要的话)
    // const teamInfo = await getTeamById(teamId.value); // 假设有这个API
    // document.title = teamInfo?.name || '队伍聊天'; // 简单示例
  });
  
  onUnmounted(() => {
    stopPolling();
  });
  
  // 获取消息
  // 获取消息
  const fetchMessages = async () => {
      if (!teamId.value) return;
      // 非首次加载时不显示全局 loading，避免闪烁
      if (messages.value.length === 0) {
          loading.value = true;
      }
      try {
          console.log(`Fetching messages for team ID: ${teamId.value}`);
          const res = await listTeamMessages(teamId.value); // res is { code: 0, data: [...], ... }
          console.log('Raw response from listTeamMessages:', res);

          // --- 修改下面这行 ---
          // messages.value = res || []; // 错误：将整个 BaseResponse 对象赋值
          messages.value = res?.data || []; // 正确：将 BaseResponse 中的 data 数组赋值
          // --- 修改结束 ---

          console.log('Messages ref updated:', messages.value); // 现在应该打印实际的消息数组了
          scrollToBottom(); // 获取到新消息后滚动到底部
      } catch (error: any) {
          console.error('获取消息失败:', error);
          Toast.fail(error?.message || '获取消息失败');
      } finally {
           loading.value = false;
           console.log(`Fetch complete. Loading: ${loading.value}, Message count: ${messages.value.length}`);
      }
  };
  
  // 发送消息
  const handleSend = async () => {
    if (!teamId.value || !inputMessage.value.trim() || isSending.value) {
      return;
    }
    isSending.value = true;
    const contentToSend = inputMessage.value.trim();
    inputMessage.value = ''; // 清空输入框
  
    try {
      await sendTeamMessage(teamId.value, contentToSend);
      // 发送成功后立即获取最新消息，而不是等轮询
      await fetchMessages();
      // nextTick(() => scrollToBottom()); // 确保 DOM 更新后滚动
    } catch (error: any) {
      console.error('发送消息失败:', error);
      Toast.fail(error?.message || '发送失败');
      inputMessage.value = contentToSend; // 发送失败时恢复输入内容
    } finally {
      isSending.value = false;
    }
  };
  
  // 滚动到底部
  const scrollToBottom = () => {
    nextTick(() => {
      if (messageListRef.value) {
        messageListRef.value.scrollTop = messageListRef.value.scrollHeight;
      }
    });
  };
  
  // 启动轮询
  const startPolling = () => {
    stopPolling(); // 先停止可能存在的旧轮询
    pollInterval = window.setInterval(async () => {
       console.log("Polling messages...");
       await fetchMessages();
    }, POLLING_INTERVAL_MS);
  };
  
  // 停止轮询
  const stopPolling = () => {
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
      console.log("Polling stopped.");
    }
  };
  
  // 格式化时间 (可选)
  // const formatTime = (time: Date | string) => { ... };
  
  </script>
  
  <style scoped>
  .team-chat-page {
    display: flex;
    flex-direction: column;
    height: calc(100vh - 50px); /* 减去底部 TabBar 高度 */
    background-color: #f7f8fa; /* 淡灰色背景 */
  }
  
  .message-list {
    flex: 1;
    overflow-y: auto;
    padding: 10px;
    /* 为了输入框留出空间 */
    padding-bottom: 70px; /* 大于输入框高度 */
  }
  
   .loading-indicator {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100px;
   }
  
  .message-item {
    display: flex;
    margin-bottom: 15px;
    align-items: flex-start; /* 垂直方向顶部对齐 */
  }
  
  .message-item.sent {
    flex-direction: row-reverse; /* 自己发送的消息靠右 */
  }
  
   .avatar {
       flex-shrink: 0; /* 防止头像被压缩 */
       margin-top: 5px; /* 轻微下移，与用户名对齐 */
   }
  
   .received-avatar {
       margin-right: 8px;
   }
  
   .sent-avatar {
       margin-left: 8px;
   }
  
  .message-bubble {
    max-width: 70%;
    padding: 8px 12px;
    border-radius: 8px;
    word-wrap: break-word; /* 长单词换行 */
    position: relative;
  }
  
  .message-item.received .message-bubble {
    background-color: #ffffff; /* 接收的消息白色背景 */
    text-align: left;
    border: 1px solid #ebedf0;
  }
  
  .message-item.sent .message-bubble {
    background-color: #e0f0ff; /* 发送的消息淡蓝色背景 */
    text-align: left; /* 内容还是左对齐 */
  }
  
  .username {
      font-size: 12px;
      color: #969799; /* 灰色用户名 */
      margin-bottom: 4px;
  }
  
  .content {
    font-size: 14px;
    line-height: 1.5;
    color: #323233;
  }
  
  /* 输入区域 */
  .input-area {
    position: fixed;
    bottom: 50px; /* 底部 TabBar 上方 */
    left: 0;
    right: 0;
    display: flex;
    align-items: center;
    padding: 8px 10px;
    background-color: #fff;
    border-top: 1px solid #ebedf0;
  }
  
  .input-field {
    flex: 1;
    margin-right: 8px;
    background-color: #f7f8fa; /* 输入框背景色 */
    border-radius: 15px; /* 圆角 */
    padding: 5px 10px; /* 调整内边距 */
  }
  
   /* 覆盖 Vant Field 默认样式 */
  .input-field :deep(.van-field__control) {
      max-height: 60px; /* 限制最大高度 */
      overflow-y: auto; /* 超出时滚动 */
  }
  
  
  .send-button {
    min-width: 50px; /* 固定按钮宽度 */
  }
  </style>