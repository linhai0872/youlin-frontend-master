<template>
    <div class="ai-chat-page">
      <!-- 会话列表 -->
      <div v-if="!$route.query.conversationId" class="conversation-list">
        <van-cell-group v-if="conversations.length > 0">
          <van-cell
            v-for="conversation in conversations"
            :key="conversation.conversationId"
            is-link
            @click="enterConversation(conversation.conversationId)"
            class="custom-cell"
          >
            <template #icon>
              <van-image
                round
                width="40"
                height="40"
                src="https://fastly.jsdelivr.net/npm/@vant/assets/logo.png"
                class="avatar"
              />
            </template>
            <template #title>
              <div class="title-wrapper">
                <span>有林AI助手</span>
                <span class="time">{{ formatDate(conversation.lastMessageTime) }}</span>
              </div>
            </template>
  
            <template #label>
              <div class="label-wrapper">
                {{ truncateMessage(conversation.lastMessage) }}
              </div>
            </template>
          </van-cell>
        </van-cell-group>
        <van-empty v-else description="暂无 AI 会话" />
      </div>
  
      <!-- AI 聊天窗口 -->
      <div v-else class="chat-window">
        <div class="message-list" ref="messageListRef">
          <div
            v-for="message in messages"
            :key="message.id"
            :class="['message', message.senderType === 0 ? 'user-message' : 'ai-message']"
          >
            <!-- AI 头像 -->
            <van-image
              v-if="message.senderType !== 0"
              round
              width="30"
              height="30"
              src="https://fastly.jsdelivr.net/npm/@vant/assets/logo.png"
              class="ai-avatar"
            />
            <!-- 消息内容 -->
            <div class="message-content">{{ message.content }}</div>
          </div>
        </div>
      </div>
  
      <!-- 设置按钮 -->
      <van-button
        v-if="$route.query.conversationId"
        icon="setting-o"
        type="primary"
        round
        color="#1989fa"
        class="setting-button"
        @click="openSettings"
      />
  
      <!-- 输入框和发送按钮区域 -->
      <div v-if="$route.query.conversationId" class="input-area">
        <van-field
          v-model="inputMessage"
          rows="1"
          autosize
          type="textarea"
          maxlength="500"
          placeholder="请输入消息"
          show-word-limit
          :border="false"
          class="input-field"
        >
          <template #button>
            <van-button
              class="send-button"
              size="small"
              type="primary"
              round
              :disabled="isLoading"
              @click="sendMessage"
            >
              发送
            </van-button>
          </template>
        </van-field>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount, nextTick, watch } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { Toast } from 'vant';
  import {
    listAiConversations,
    getAiConversationMessages,
    sendAiMessage,
    quitAiConversation,
  } from '../services/aiMessage';
  import type { AiConversationVO, AiMessage } from '../models/aiMessage';
  import { getCurrentUser } from "../services/user"; // 导入 getCurrentUser
  
  const router = useRouter();
  const route = useRoute();
  const messageListRef = ref<HTMLDivElement | null>(null);
  
  const conversations = ref<AiConversationVO[]>([]);
  const messages = ref<AiMessage[]>([]);
  const inputMessage = ref('');
  const isLoading = ref(false);
  const pollingInterval = ref<number | null>(null);
  const pendingMessageId = ref<number | null>(null);
  
  onMounted(async () => {
    // 检查用户登录状态
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      router.push('/user/login');
      Toast('请先登录');
      return; // 阻止后续代码执行
    }
  
    await loadConversations();
  
    watch(
      () => route.query.conversationId,
      (newConversationId) => {
        if (newConversationId) {
          nextTick(() => loadMessages());
        } else {
          messages.value = [];
          clearPolling();
        }
      },
      { immediate: true }
    );
  });
  
  onBeforeUnmount(() => {
    clearPolling();
    if (route.query.conversationId) {
      quitCurrentConversation();
    }
  });
  
  const loadConversations = async () => {
    try {
      const res = await listAiConversations();
      if (res.code === 0) {
        conversations.value = res.data;
      } else {
        Toast.fail(res.message || '加载会话列表失败');
      }
    } catch (error) {
      console.error('加载会话列表失败:', error);
      Toast.fail('加载会话列表失败');
    }
  };
  
  const enterConversation = (conversationId: string) => {
    router.push({ path: '/ai', query: { conversationId } });
  };
  
  const loadMessages = async () => {
    const conversationId = route.query.conversationId;
    if (!conversationId) return;
  
    try {
      const res = await getAiConversationMessages(conversationId);
      if (res.code === 0) {
        messages.value = res.data.messages;
        nextTick(() => scrollToBottom());
      } else {
        Toast.fail(res.message || '加载消息失败');
      }
    } catch (error) {
      console.error('加载消息失败:', error);
      Toast.fail('加载消息失败');
    }
  };
  
  const sendMessage = async () => {
    const conversationId = route.query.conversationId;
    if (!conversationId || !inputMessage.value.trim()) return;
  
    const content = inputMessage.value.trim();
    inputMessage.value = '';
  
    const userMessage: AiMessage = {
      id: Date.now(),
      conversationId: Number(conversationId),
      userId: 0,
      senderType: 0,
      content,
      modelId: '',
      prompt: '',
      createTime: new Date(),
      updateTime: new Date(),
      isDelete: 0,
    };
  
    const pendingMessage: AiMessage = {
      id: Date.now() + 1,
      conversationId: Number(conversationId),
      userId: 0,
      senderType: 1,
      content: '生成中...',
      modelId: '',
      prompt: '',
      createTime: new Date(),
      updateTime: new Date(),
      isDelete: 0,
    };
    pendingMessageId.value = pendingMessage.id;
  
    messages.value.push(userMessage, pendingMessage);
  
    isLoading.value = true;
    nextTick(() => scrollToBottom());
  
    try {
      const res = await sendAiMessage(conversationId, { content });
      if (res.code === 0) {
        startPolling();
      } else {
        Toast.fail(res.message || '发送消息失败');
        isLoading.value = false;
        removePendingMessage();
      }
    } catch (error) {
      console.error('发送消息失败:', error);
      Toast.fail('发送消息失败');
      isLoading.value = false;
      removePendingMessage();
    }
  };
  
  const startPolling = () => {
    clearPolling();
    doPolling();
    pollingInterval.value = window.setInterval(doPolling, 2000);
  };
  
  const clearPolling = () => {
    if (pollingInterval.value) {
      clearInterval(pollingInterval.value);
      pollingInterval.value = null;
    }
  };
  
  const doPolling = async () => {
    const conversationId = route.query.conversationId;
    if (!conversationId) return;
  
    try {
      const res = await getAiConversationMessages(conversationId);
      if (res.code === 0) {
        const newMessages = res.data.messages;
  
        if (newMessages.length > 0 && newMessages[newMessages.length - 1].senderType === 1) {
          removePendingMessage();
          messages.value = newMessages;
          isLoading.value = false;
          clearPolling();
        }
  
        nextTick(() => scrollToBottom());
      } else {
        Toast.fail(res.message || '获取消息失败');
      }
    } catch (error) {
      console.error('轮询出错:', error);
      Toast.fail('获取消息失败');
      clearPolling();
      isLoading.value = false;
      removePendingMessage();
    }
  };
  
  const removePendingMessage = () => {
    if (pendingMessageId.value) {
      const index = messages.value.findIndex((msg) => msg.id === pendingMessageId.value);
      if (index !== -1) {
        messages.value.splice(index, 1);
      }
      pendingMessageId.value = null;
    }
  };
  
  const quitCurrentConversation = async () => {
    const conversationId = route.query.conversationId;
    if (!conversationId) return;
  
    try {
      await quitAiConversation(conversationId);
    } catch (error) {
      console.error('退出会话失败:', error);
      Toast.fail('退出会话失败');
    }
  };
  
  const openSettings = () => {
    const conversationId = route.query.conversationId;
    if (!conversationId) {
      Toast.fail('会话 ID 不存在');
      return;
    }
    router.push(`/ai-settings/${conversationId}`);
  };
  
  const formatDate = (time: Date | string) => {
    if (!time) {
      return '';
    }
  
    const date = typeof time === 'string' ? new Date(time) : time;
    const now = new Date();
  
    if (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate()
    ) {
      return date.toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit' });
    } else {
      return `${date.getMonth() + 1}月${date.getDate()}日`;
    }
  };
  
  const truncateMessage = (message: string) =>
    message ? (message.length > 20 ? message.substring(0, 20) + '...' : message) : '';
  
  const scrollToBottom = () => {
    if (messageListRef.value) messageListRef.value.scrollTop = messageListRef.value.scrollHeight;
  };
  </script>
  
  <style scoped>
  /* 页面容器 */
  .ai-chat-page {
    height: 100vh;
    display: flex;
    flex-direction: column;
    position: relative; /* 相对定位 */
    overflow: hidden;
  }
  
  /* 会话列表样式 */
  .conversation-list {
    flex: 1;
    overflow-y: auto;
  }
  
  .custom-cell {
    padding: 10px 15px;
  }
  
  /* 重点修改：确保头像容器有固定宽度，且内容不会溢出 */
  .avatar {
    margin-right: 10px;
    flex-shrink: 0; /* 防止头像被压缩 */
  }
  
  .title-wrapper {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
  }
  
  .time {
    font-size: 12px;
    color: #999;
  }
  
  .label-wrapper {
    font-size: 14px;
    color: #666;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  /* 聊天窗口 */
  .chat-window {
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow-y: auto;
    padding-bottom: calc(45px + 60px + 10px);
  }
  
  /* 消息列表 */
  .message-list {
    padding: 10px;
    display: flex;
    flex-direction: column;
  }
  
  /* 单条消息 */
  .message {
    margin-bottom: 10px;
    padding: 8px 12px;
    border-radius: 18px;
    max-width: 75%;
    display: flex;
    align-items: flex-start; /* 顶部对齐 */
  }
  
  /* 用户消息 */
  .user-message {
    background-color: #a3d1ff;
    align-self: flex-end;
    flex-direction: row-reverse;
  }
  
  /* AI 消息 */
  .ai-message {
    background-color: #f0f0f0;
    align-self: flex-start;
    flex-direction: row;
  }
  
  /* 消息内容 */
  .message-content {
    font-size: 14px;
    word-break: break-word;
    margin: 0 8px;
    align-self: center;
  }
  
  /* AI 头像 */
  .ai-avatar {
    margin-right: 8px;
    flex-shrink: 0; /* 防止头像被压缩 */
  }
  
  /* 设置按钮样式 */
  .setting-button {
    position: fixed;
    bottom: calc(45px + 60px + env(safe-area-inset-bottom) + 50px);
    right: 7vw;
    z-index: 1000;
  }
  
  /* 输入框和发送按钮区域 */
  .input-area {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 45px;
    background-color: #fff;
    border-top: 1px solid #ddd;
    padding: 8px;
    box-sizing: border-box;
    z-index: 500;
    display: flex;
    align-items: center;
  }
  
  /* 输入框样式 */
  .input-field {
    flex: 1;
  }
  
  /* 发送按钮样式 */
  .send-button {
    height: 36px;
    width: 72px;
    margin-left: 8px;
    border-radius: 18px;
  }
  </style>