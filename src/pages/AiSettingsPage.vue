<template>
    <div class="ai-settings-page">
      <van-cell-group>
        <van-field
          v-model="prompt"
          rows="3"
          autosize
          type="textarea"
          label="Prompt"
          placeholder="请输入自定义 Prompt"
          :border="false"
        />
        <van-cell>
          <van-button type="primary" round block @click="showSaveConfirm">保存 Prompt</van-button>
        </van-cell>
      </van-cell-group>
  
      <!-- 清理会话消息按钮 -->
      <div class="clear-button-wrapper">
        <van-button block @click="showConfirm = true" class="clear-button">清理会话消息</van-button>
      </div>
  
      <!-- 确认清理会话消息弹窗 -->
      <van-dialog
        v-model:show="showConfirm"
        title="确认清理"
        message="确定要清理当前会话的所有非默认消息吗？"
        show-cancel-button
        @confirm="clearMessages"
      >
      </van-dialog>
  
      <!-- 确认保存 Prompt 弹窗 -->
      <van-dialog
        v-model:show="showSavePromptConfirm"
        title="确认保存"
        message="保存 Prompt 将会清除当前会话之前的非默认消息，是否确定保存？"
        show-cancel-button
        @confirm="saveSettings"
      />
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, onMounted } from 'vue';
  import { useRouter, useRoute } from 'vue-router';
  import { Toast } from 'vant';
  import { setAiConversationSettings, clearAiConversationMessages, getAiConversationMessages } from '../services/aiMessage';
  import { AiMessage } from '../models/aiMessage';
  
  const router = useRouter();
  const route = useRoute();
  const conversationId = route.params.conversationId as string; // 类型断言为 string
  const prompt = ref('');
  const showConfirm = ref(false); // 控制确认清理弹窗显示
  const showSavePromptConfirm = ref(false); // 控制确认保存 Prompt 弹窗显示
  
  onMounted(async () => {
    await loadPrompt();
  });
  
  // 加载 Prompt
  const loadPrompt = async () => {
    if (!conversationId) return;
  
    try {
      const res = await getAiConversationMessages(conversationId);
      if (res.code === 0) {
        const defaultMessage = res.data.messages.find((msg: AiMessage) => msg.senderType === 2);
        if (defaultMessage) {
          prompt.value = defaultMessage.prompt || ''; // 设置 prompt
        }
      } else {
        Toast.fail(res.message || '加载 Prompt 失败');
      }
    } catch (error) {
      console.error('加载 Prompt 失败:', error);
      Toast.fail('加载 Prompt 失败');
    }
  };
  
  // 显示保存 Prompt 确认弹窗
  const showSaveConfirm = () => {
    showSavePromptConfirm.value = true;
  };
  
  // 保存设置 (在确认弹窗中调用)
  const saveSettings = async () => {
      if (!conversationId) return;
      try {
          const res = await setAiConversationSettings(conversationId, prompt.value);
          if (res.code === 0) {
              Toast.success('设置保存成功');
              showSavePromptConfirm.value = false; // 关闭确认弹窗
              //返回上一级
              router.back();
          } else {
              Toast.fail(res.message || '设置保存失败');
          }
      } catch (error) {
          console.error('设置保存失败:', error);
          Toast.fail('设置保存失败');
      }
  };
  
  // 清理消息 (先显示确认弹窗)
  const clearMessages = async () => {
    if (!conversationId) return;
  
    try {
      const res = await clearAiConversationMessages(conversationId);
      if (res.code === 0) {
        Toast.success('消息已清理');
        showConfirm.value = false; // 关闭弹窗
        router.back(); // 返回上一级
      } else {
        Toast.fail(res.message || '清理消息失败');
      }
    } catch (error) {
      console.error('清理消息失败:', error);
      Toast.fail('清理消息失败');
    }
  };
  </script>
  
  <style scoped>
  /* 样式根据需要调整 */
  .ai-settings-page {
    height: 100vh; /* 使用视口高度 */
    display: flex;
    flex-direction: column;
    justify-content: space-between; /* 让内容和按钮之间有空间 */
  }
  
  /* 清理按钮的容器 */
  .clear-button-wrapper {
    position: fixed; /* 固定定位 */
    bottom: 50px; /* 距离底部 tabbar 的高度 */
    left: 0;
    right: 0;
    padding: 0px;
    background-color: #fff; /* 背景色 */
    border-top: 1px solid #eee; /* 顶部边框 */
  }
  /* 清理按钮样式 */
  .clear-button {
    color: red; /* 红色文字 */
    background-color: transparent; /* 透明背景 */
    border: none; /* 无边框 */
  }
  </style>