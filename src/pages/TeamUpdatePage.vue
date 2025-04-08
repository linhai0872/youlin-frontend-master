<template>
  <div id="teamAddPage">
    <van-form @submit="onSubmit">
      <van-cell-group inset title="队伍基础信息">
        <van-field
            v-model="addTeamData.name"
            name="name"
            label="队伍名"
            placeholder="请输入队伍名"
            :rules="[{ required: true, message: '请输入队伍名' }]"
        />
        <van-field
            v-model="addTeamData.description"
            rows="3"
            autosize
            label="队伍描述"
            type="textarea"
            placeholder="介绍一下你的队伍吧"
            maxlength="512"
            show-word-limit
        />
         <van-field name="stepper" label="最大人数">
          <template #input>
            <van-stepper v-model="addTeamData.maxNum" max="10" min="3"/>
          </template>
        </van-field>
      </van-cell-group>

       <van-cell-group inset title="时间和状态">
        <!-- 长期有效开关 -->
        <van-cell center title="长期有效">
            <template #right-icon>
                <van-switch v-model="isPermanent" size="24" @change="onPermanentChange" />
            </template>
        </van-cell>
         <!-- 过期时间选择器，根据 isPermanent 状态禁用 -->
        <van-field
            :is-link="!isPermanent"
            readonly
            clickable
            name="datetimePicker"
            label="过期时间"
            :placeholder="isPermanent ? '长期有效' : (addTeamData.expireTime ? formatDisplayDateTime(addTeamData.expireTime) : '点击选择过期时间')"
            :disabled="isPermanent"
            @click="!isPermanent && (showPicker = true)"
        />
        <van-popup v-model:show="showPicker" position="bottom">
          <van-datetime-picker
              :model-value="currentPickerDate"
              @confirm="onConfirmPicker"
              @cancel="showPicker = false"
              type="datetime"
              title="请选择过期时间"
              :min-date="minDate"
          />
        </van-popup>

        <van-field name="radio" label="队伍状态">
          <template #input>
            <van-radio-group v-model="addTeamData.status" direction="horizontal">
              <van-radio name="0">公开</van-radio>
              <van-radio name="1">私有</van-radio>
              <van-radio name="2">加密</van-radio>
            </van-radio-group>
          </template>
        </van-field>
        <van-field
            v-if="Number(addTeamData.status) === 2"
            v-model="addTeamData.password"
            type="password"
            name="password"
            label="队伍密码"
            placeholder="请输入队伍密码"
            :rules="[{ required: true, message: '请填写密码' }, { pattern: /^\S{4,}$/, message: '密码至少4位非空字符' }]"
        />
      </van-cell-group>

      <div style="margin: 16px;">
        <van-button round block type="primary" native-type="submit">
          {{ isUpdate ? '确认修改' : '创建队伍' }}
        </van-button>
      </div>
    </van-form>
  </div>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from "vue-router";
import { ref, onMounted, computed } from "vue";
import myAxios from "../plugins/myAxios";
import { Toast, Form, Field, CellGroup, Cell, Switch, Stepper, RadioGroup, Radio, Popup, DatetimePicker, Button } from "vant"; // 引入所需组件

const router = useRouter();
const route = useRoute();
const isUpdate = computed(() => !!route.query.id); // 判断是创建还是更新
const teamId = route.query.id;

// --- 表单数据 ---
const initFormData = {
  name: "",
  description: "",
  expireTime: null, // 内部存储 Date 对象或 null
  maxNum: 3,
  password: "",
  status: "0", // Vant RadioGroup v-model 默认是 string
};
const addTeamData = ref({ ...initFormData });

// --- 日期和开关状态 ---
const showPicker = ref(false);
const minDate = new Date();
const isPermanent = ref(false); // 是否长期有效

// 计算属性，用于 datetimePicker 的 v-model，确保它总是有值或默认值
const currentPickerDate = computed(() => addTeamData.value.expireTime || new Date());

// --- 方法 ---
// 格式化显示日期时间
const formatDisplayDateTime = (date: Date | string | null): string => {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

// 长期有效开关变化
const onPermanentChange = (checked: boolean) => {
  if (checked) {
    addTeamData.value.expireTime = null; // 设置为 null 代表长期
    showPicker.value = false; // 关闭可能打开的选择器
  } else {
    // 如果之前是 null，可以给一个默认值，比如一天后
    if (!addTeamData.value.expireTime) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        addTeamData.value.expireTime = tomorrow;
    }
  }
};

// 日期选择器确认
const onConfirmPicker = (value: Date) => {
  addTeamData.value.expireTime = value;
  isPermanent.value = false; // 选择了具体时间，则非长期
  showPicker.value = false;
};

// 加载更新数据 (仅在更新模式下)
onMounted(async () => {
  if (isUpdate.value) {
    if (!teamId || +teamId <= 0) {
      Toast.fail('无效的队伍ID');
      router.back();
      return;
    }
    try {
      const res = await myAxios.get("/team/get", { params: { id: teamId } });
      if (res?.code === 0 && res.data) {
        const data = res.data;
         // 后端返回的时间字符串转换为 Date 对象, null 保持 null
        data.expireTime = data.expireTime ? new Date(data.expireTime) : null;
        data.status = String(data.status); // 转换为字符串以匹配 radio
        addTeamData.value = data;
        isPermanent.value = data.expireTime === null; // 根据加载的数据设置开关状态
      } else {
        Toast.fail('加载队伍信息失败，请重试');
        router.back();
      }
    } catch (error) {
      console.error("加载队伍信息错误:", error);
      Toast.fail('网络错误，加载队伍信息失败');
      router.back();
    }
  } else {
      // 创建模式下，设置默认过期时间为一天后
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      addTeamData.value.expireTime = tomorrow;
      isPermanent.value = false; // 默认非长期
  }
});

// 提交表单
const onSubmit = async () => {
  // 准备提交的数据
  const postData = {
    ...addTeamData.value,
    status: Number(addTeamData.value.status), // 转回数字类型
    // 如果是长期有效，确保 expireTime 为 null
    expireTime: isPermanent.value ? null : addTeamData.value.expireTime,
  };

   // 前端参数校验 (基础)
  if (!postData.name || postData.name.length < 2) {
      Toast('队伍名称至少2个字符');
      return;
  }
  if (postData.description && postData.description.length > 512) {
      Toast('队伍描述过长');
      return;
  }
   if (postData.status === 2 && (!postData.password || postData.password.length < 4)) {
      Toast('加密队伍需要设置至少4位的密码');
      return;
  }

  const apiUrl = isUpdate.value ? "/team/update" : "/team/add";
  const successMsg = isUpdate.value ? '更新成功' : '创建成功';
  const failMsg = isUpdate.value ? '更新失败' : '创建失败';

  try {
    const res = await myAxios.post(apiUrl, postData);
    if (res?.code === 0) { // 假设后端成功创建或更新后，也可能返回 data (如队伍ID)
      Toast.success(successMsg);
      router.replace('/team'); // 使用 replace 避免返回到表单页
    } else {
      Toast.fail(failMsg + (res?.description ? `：${res.description}` : ''));
    }
  } catch (error) {
      console.error(`${failMsg}错误:`, error);
      Toast.fail(`网络错误，${failMsg}`);
  }
};
</script>

<style scoped>
#teamAddPage {
  padding-bottom: 20px; /* 底部留白 */
}
/* 可以为 Cell Group 添加一些间距 */
.van-cell-group {
    margin-bottom: 10px;
}
</style>