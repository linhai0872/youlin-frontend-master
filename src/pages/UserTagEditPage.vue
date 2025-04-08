<template>
    <!-- 只有在用户信息加载成功后才显示页面内容 -->
    <div v-if="currentUser" class="tag-edit-page">
      <!-- 1. 已选标签区域 -->
      <van-divider content-position="left">已选标签</van-divider>
      <!-- 如果没有选中标签，显示提示文字 -->
      <div v-if="!activeIds || activeIds.length === 0" class="empty-tags">暂未选择标签，请在下方选择</div>
      <!-- 已选标签列表，使用 van-row 和 van-col 排列 -->
      <van-row gutter="8" class="selected-tags-row">
        <van-col v-for="tag in activeIds" :key="tag">
          <!-- 每个标签都带有关闭按钮 -->
          <van-tag closeable size="medium" type="primary" @close="doClose(tag)">
            {{ tag }}
          </van-tag>
        </van-col>
      </van-row>

      <!-- 2. 选择标签区域 -->
      <van-divider content-position="left">选择标签</van-divider>
      <!-- 标签选择的整体布局容器 -->
      <div class="tag-selection-area">
        <!-- 左侧一级分类导航栏 -->
        <van-sidebar v-model="activeIndex" class="tag-sidebar">
          <!-- 遍历 originTagList 生成一级分类项 -->
          <van-sidebar-item v-for="(category, index) in originTagList" :key="index" :title="category.text" />
        </van-sidebar>

        <!-- 右侧二级/三级标签选择区域 -->
        <div class="tag-content">
          <!-- 确保当前选中的一级分类有效 -->
          <div v-if="currentCategory">
            <!-- 使用 Checkbox Group 管理所有 Checkbox 的选中状态 -->
            <van-checkbox-group v-model="activeIds" ref="checkboxGroupRef">
              <!-- 遍历当前一级分类下的所有二级分类 -->
              <template v-for="subCategory in currentCategory.children" :key="subCategory.text">
                <!-- 只有当二级分类下有三级标签时才显示 -->
                <template v-if="subCategory.children && subCategory.children.length > 0">
                  <!-- 二级分类标题 -->
                  <van-cell :title="subCategory.text" class="sub-category-title" />
                  <!-- 三级分类 Checkbox 网格布局 -->
                  <div class="checkbox-grid">
                    <!-- 遍历二级分类下的所有三级标签 -->
                    <van-checkbox
                      v-for="tagItem in subCategory.children"
                      :key="tagItem.id"
                      :name="tagItem.id"  
                      shape="square" 
                      class="checkbox-item"
                    >
                      <!-- 显示标签文本 -->
                      {{ tagItem.text }}
                    </van-checkbox>
                  </div>
                </template>
              </template>
            </van-checkbox-group>
          </div>
          <!-- 如果没有选中一级分类或一级分类无效，显示提示 -->
          <van-empty v-else description="请在左侧选择分类" />
        </div>
      </div>

      <!-- 3. 底部占位符和保存按钮 -->
      <!-- 用于防止内容被固定按钮遮挡 -->
      <div class="save-button-placeholder"></div>
      <!-- 固定在底部的保存按钮容器 -->
      <div class="save-button-container">
        <van-button block type="primary" @click="doSaveTags">保存</van-button>
      </div>

    </div>
    <!-- 如果用户信息加载失败，显示空状态提示 -->
    <van-empty v-else description="用户信息加载失败，请稍后重试或重新登录" />
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from "vue-router";
import { Toast } from 'vant';
import myAxios from "../plugins/myAxios";
import { getCurrentUser } from "../services/user";
import type { UserType } from "../models/user";

const router = useRouter();

// 当前登录用户信息
const currentUser = ref<UserType | null>(null);
// 存储已选中的标签 ID (字符串数组)
const activeIds = ref<string[]>([]);
// 左侧 Sidebar 激活的索引
const activeIndex = ref(0);

// --- 统一后的标签数据结构 (与 SearchPage 一致) ---
const originTagList = [
  {
    text: "学校信息", // 一级分类
    children: [
      // 年级 (按学历层次拆分为二级分类)
      {
        text: "年级 - 本科", // 二级分类
        children: [
          { text: "大一", id: "大一" },
          { text: "大二", id: "大二" },
          { text: "大三", id: "大三" },
          { text: "大四", id: "大四" },
        ],
      },
      {
        text: "年级 - 研究生", // 二级分类
        children: [
          { text: "研一", id: "研一" },
          { text: "研二", id: "研二" },
          { text: "研三", id: "研三" },
        ],
      },
      {
        text: "年级 - 博士", // 二级分类
        children: [
          { text: "博一", id: "博一" },
          { text: "博二", id: "博二" },
          { text: "博三", id: "博三" },
          { text: "博三以上", id: "博三以上" }, // 增加一个，覆盖博二+
        ],
      },
      // 专业 (按学院拆分为二级分类)
      {
        text: "专业 - 商学院", // 二级分类
        children: [
          { text: "工商管理", id: "工商管理" },
          { text: "市场营销", id: "市场营销" },
          { text: "供应链管理", id: "供应链管理" },
          { text: "人力资源", id: "人力资源" },
          { text: "电子商务", id: "电子商务" },
        ],
      },
      {
        text: "专业 - 法学院", // 二级分类
        children: [{ text: "法学", id: "法学" }],
      },
      {
        text: "专业 - 艺术学院", // 二级分类
        children: [
          { text: "音乐表演", id: "音乐表演" },
          { text: "舞蹈表演", id: "舞蹈表演" },
          { text: "视觉传达", id: "视觉传达" },
        ],
      },
      {
        text: "专业 - 会计学院", // 二级分类
        children: [
          { text: "会计学", id: "会计学" },
          { text: "财务管理", id: "财务管理" },
          { text: "审计学", id: "审计学" },
        ],
      },
      {
        text: "专业 - 金融学院", // 二级分类
        children: [
          { text: "金融学", id: "金融学" },
          { text: "保险学", id: "保险学" },
          { text: "金融工程", id: "金融工程" },
        ],
      },
      {
        text: "专业 - 信息学院", // 二级分类
        children: [
          { text: "计算机科学", id: "计算机科学" },
          { text: "软件工程", id: "软件工程" },
          { text: "网络安全", id: "网络安全" },
        ],
      },
      {
        text: "专业 - 数统学院", // 二级分类
        children: [
          { text: "经济统计学", id: "经济统计学" },
          { text: "精算应用数学", id: "精算应用数学" },
          { text: "师范应用数学", id: "师范应用数学" },
        ],
      },
      {
        text: "专业 - 新传学院", // 二级分类
        children: [
          { text: "播音主持", id: "播音主持" },
          { text: "新闻学", id: "新闻学" },
          { text: "网媒", id: "网媒" },
        ],
      },
      {
        text: "专业 - 英语教育学院", // 二级分类
        children: [
          { text: "英语教育学", id: "英语教育学" },
          { text: "英语教育", id: "英语教育" },
        ],
      },
      {
        text: "专业 - 经济贸易学院", // 二级分类
        children: [
          { text: "国贸", id: "国贸" },
          { text: "数字经济", id: "数字经济" },
          { text: "经济学", id: "经济学" },
          { text: "财政学", id: "财政学" },
          { text: "税收学", id: "税收学" },
        ],
      },
      {
        text: "专业 - 国际关系学院", // 二级分类
        children: [
          { text: "外交学", id: "外交学" },
          { text: "国际政治", id: "国际政治" },
          { text: "国际组织治理", id: "国际组织治理" },
        ],
      },
      {
        text: "专业 - 社会公管学院", // 二级分类
        children: [
          { text: "应用心理学", id: "应用心理学" },
          { text: "社会工作", id: "社会工作" },
          { text: "行政管理", id: "行政管理" },
        ],
      },
      // 发展方向 (保持为一个二级分类)
      {
        text: "发展方向", // 二级分类
        children: [
          { text: "学习", id: "学习" },
          { text: "实习", id: "实习" },
          { text: "竞赛", id: "竞赛" },
          { text: "学术", id: "学术" },
          { text: "考研", id: "考研" },
          { text: "考公", id: "考公" },
          { text: "求职", id: "求职" },
          { text: "留学", id: "留学" },
          { text: "创业", id: "创业" },
        ],
      },
    ],
  },
  {
    text: "个人信息", // 一级分类
    children: [
      // 个性状态 (按类型拆分为二级分类)
      {
        text: "个性状态 - MBTI", // 二级分类
        children: [
          { text: "ISTJ", id: "ISTJ" }, { text: "INFJ", id: "INFJ" }, { text: "INFP", id: "INFP" },
          { text: "ESTJ", id: "ESTJ" }, { text: "ISFJ", id: "ISFJ" }, { text: "ESFJ", id: "ESFJ" },
          { text: "ISTP", id: "ISTP" }, { text: "ISFP", id: "ISFP" }, { text: "ESTP", id: "ESTP" },
          { text: "ESFP", id: "ESFP" }, { text: "INTJ", id: "INTJ" }, { text: "INTP", id: "INTP" },
          { text: "ENTJ", id: "ENTJ" }, { text: "ENTP", id: "ENTP" }, { text: "ENFJ", id: "ENFJ" },
          { text: "ENFP", id: "ENFP" },
        ],
      },
      {
        text: "个性状态 - 星座", // 二级分类
        children: [
          { text: "白羊座", id: "白羊座" }, { text: "金牛座", id: "金牛座" }, { text: "双子座", id: "双子座" },
          { text: "巨蟹座", id: "巨蟹座" }, { text: "狮子座", id: "狮子座" }, { text: "处女座", id: "处女座" },
          { text: "天秤座", id: "天秤座" }, { text: "天蝎座", id: "天蝎座" }, { text: "射手座", id: "射手座" },
          { text: "摩羯座", id: "摩羯座" }, { text: "水瓶座", id: "水瓶座" }, { text: "双鱼座", id: "双鱼座" },
        ],
      },
      {
        text: "个性状态 - 社交风格", // 二级分类
        children: [
          { text: "社牛", id: "社牛" }, { text: "社恐", id: "社恐" },
          { text: "慢热", id: "慢热" }, { text: "健谈", id: "健谈" },
        ],
      },
      {
        text: "个性状态 - 个人状态", // 二级分类
        children: [
          { text: "单身", id: "单身" }, { text: "恋爱中", id: "恋爱中" },
          { text: "佛系随缘", id: "佛系随缘" }, { text: "专注目标", id: "专注目标" },
        ],
      },
      // 技能特长 (保持为一个二级分类)
      {
        text: "技能特长", // 二级分类
        children: [
          { text: "编程", id: "编程" }, { text: "设计", id: "设计" }, { text: "写作", id: "写作" },
          { text: "绘画", id: "绘画" }, { text: "乐器", id: "乐器" }, { text: "唱歌", id: "唱歌" },
          { text: "运动", id: "运动" }, { text: "演讲主持", id: "演讲主持" }, { text: "摄影剪辑", id: "摄影剪辑" },
          { text: "数据分析", id: "数据分析" }, { text: "外语口语", id: "外语口语" },
        ],
      },
      // 兴趣爱好 (按类型拆分为二级分类)
      {
        text: "兴趣爱好 - 文娱", // 二级分类
        children: [
          { text: "电影", id: "电影" }, { text: "音乐", id: "音乐" }, { text: "阅读", id: "阅读" },
          { text: "游戏", id: "游戏" }, { text: "动漫", id: "动漫" }, { text: "桌游", id: "桌游" },
        ],
      },
      {
        text: "兴趣爱好 - 生活", // 二级分类
        children: [
          { text: "运动健身", id: "运动健身" }, { text: "美食", id: "美食" }, { text: "旅行", id: "旅行" },
          { text: "摄影", id: "摄影" }, { text: "萌宠", id: "萌宠" }, { text: "志愿者", id: "志愿者" },
        ],
      },
    ],
  },
  {
    text: "交友组队偏好", // 一级分类
    children: [
      // 组队领域 (保持为一个二级分类)
      {
        text: "组队领域", // 二级分类
        children: [
          { text: "比赛组队", id: "比赛组队" }, { text: "项目组队", id: "项目组队" },
          { text: "科研组队", id: "科研组队" }, { text: "学习小组", id: "学习小组" },
          { text: "日常搭子", id: "日常搭子" }, { text: "创业伙伴", id: "创业伙伴" },
        ],
      },
      // 角色定位 (保持为一个二级分类)
      {
        text: "角色定位", // 二级分类
        children: [
          { text: "找队友", id: "找队友" }, { text: "找队长", id: "找队长" }, { text: "找成员", id: "找成员" },
          { text: "技术担当", id: "技术担当" }, { text: "创意担当", id: "创意担当" },
          { text: "文档PPT", id: "文档PPT" }, { text: "设计美工", id: "设计美工" },
          { text: "组织协调", id: "组织协调" },
        ],
      },
    ],
  },
];

// --- 计算属性 ---
// 计算当前选中的一级分类对应的数据，用于右侧显示
// 这个计算属性只负责根据 activeIndex 返回对应的一级分类数据，不进行过滤
const currentCategory = computed(() => {
  // 确保 activeIndex 在有效范围内
  if (activeIndex.value >= 0 && activeIndex.value < originTagList.length) {
    return originTagList[activeIndex.value];
  }
  return null; // 如果索引无效，返回 null
});


// --- 生命周期函数 ---
// 组件挂载后执行
onMounted(async () => {
  // 显示加载提示
  const loadingToast = Toast.loading({ message: '加载中...', forbidClick: true, duration: 0 });
  try {
    // 获取当前登录用户信息
    const user = await getCurrentUser();
    if (user) {
      currentUser.value = user;
      // 解析用户已有的标签 (tags 字段是 JSON 字符串)
      try {
        const parsedTags = user.tags ? JSON.parse(user.tags) : [];
        // 健壮性处理：确保解析结果是数组，并过滤掉可能存在的非字符串或 null/undefined 项
        activeIds.value = Array.isArray(parsedTags) ? parsedTags.filter(tag => typeof tag === 'string') : [];
      } catch (e) {
        console.error("解析用户标签 JSON 失败", e);
        Toast.fail('加载用户标签失败');
        activeIds.value = []; // 解析失败则清空已选标签
      }
    } else {
      // 如果获取用户信息失败
      Toast.fail('获取用户信息失败，请重新登录');
      // 可以选择跳转到登录页
      // router.replace('/user/login');
    }
  } catch (error) {
    console.error("获取当前用户失败:", error);
    Toast.fail('网络错误，无法加载用户信息');
  } finally {
      // 清除加载提示
      loadingToast.clear();
  }
});

// --- 方法 ---
// 移除一个已选标签 (点击标签上的关闭按钮)
const doClose = (tag: string) => {
  // 从 activeIds 数组中过滤掉被点击移除的标签
  activeIds.value = activeIds.value.filter(item => item !== tag);
};

// 点击底部的 "保存" 按钮
const doSaveTags = async () => {
  // 检查用户信息是否有效
  if (!currentUser.value) {
    Toast.fail('用户信息无效，无法保存');
    return;
  }
  // 显示保存中的加载提示
  const savingToast = Toast.loading({ message: '保存中...', forbidClick: true, duration: 0 });

  try {
    // 确保 activeIds 是有效的数组，理论上已经是 string[]
    const validTags = Array.isArray(activeIds.value) ? activeIds.value : [];
    // 将标签数组转换为 JSON 字符串，后端需要接收 JSON 格式
    const tagsToSend = JSON.stringify(validTags);

    // 构造更新请求的数据体，只需要包含用户 ID 和新的 tags 字符串
    const updatedUserData = {
      id: currentUser.value.id,
      tags: tagsToSend
    };

    // 发送 POST 请求到后端 /user/update 接口
    const res = await myAxios.post('/user/update', updatedUserData);

    // 根据后端的响应判断是否成功
    // 假设后端成功时 code 为 0，且 data > 0 表示更新成功
    if (res.code === 0 && res.data > 0) {
      Toast.success('标签更新成功');
      // 可选: 更新本地内存中的 currentUser 的 tags，以便返回上一页时显示最新状态
      // 注意：这不会自动更新通过 getCurrentUser 获取的缓存，除非你的 getCurrentUser 做了相应处理
      if (currentUser.value) {
          currentUser.value.tags = tagsToSend;
      }
      // 保存成功后返回上一页
      router.back();
    } else {
      // 保存失败，显示后端返回的错误信息或通用错误提示
      Toast.fail('标签更新失败: ' + (res.description || '服务器错误'));
    }
  } catch (error) {
    // 网络请求或其他异常处理
    console.error("更新标签时出错:", error);
    Toast.fail('网络错误或服务器异常，请稍后再试');
  } finally {
    // 清除保存中的加载提示
    savingToast.clear();
  }
};

</script>

<style scoped>
/* 整体页面添加底部内边距，防止内容被底部按钮遮挡 */
.tag-edit-page {
  padding-bottom: 70px; /* 至少为底部按钮容器的高度 */
}

/* 已选标签区域 - 提示文字 */
.empty-tags {
  padding: 16px;
  color: #969799; /* Vant 灰色 */
  font-size: 14px;
  text-align: center; /* 居中显示 */
}

/* 已选标签区域 - 标签行样式 */
.selected-tags-row {
  padding: 0 16px 16px 16px; /* 上 右 下 左 内边距 */
}

/* 已选标签区域 - 单个标签样式 */
.selected-tags-row .van-tag {
  margin-right: 8px;  /* 标签右边距 */
  margin-bottom: 8px; /* 标签下边距 */
}

/* 标签选择区域 容器 (Sidebar + Content) */
.tag-selection-area {
  display: flex;
  /* 高度计算，与 SearchPage 保持一致或根据需要微调 */
  height: calc(100vh - 54px - 40px - 70px - 50px); /* 估算值 */
  min-height: 300px; /* 保证一个最小的可视高度 */
  border-top: 1px solid #ebedf0; /* 顶部加一条细线分隔 */
}

/* 左侧 Sidebar 样式 */
.tag-sidebar {
  width: 100px; /* 固定宽度 */
  height: 100%; /* 高度充满父容器 */
  overflow-y: auto; /* 内容超出时垂直滚动 */
  background-color: #f7f8fa; /* Vant 侧边导航默认背景色 */
}
/* Sidebar 选中项样式 */
:deep(.van-sidebar-item--select)::before {
    background-color: #1989fa; /* 选中项的指示条颜色 */
}

/* 右侧标签内容区域 */
.tag-content {
  flex: 1; /* 占据剩余宽度 */
  height: 100%; /* 高度充满父容器 */
  overflow-y: auto; /* 内容超出时垂直滚动 */
  padding: 8px 16px 16px 16px; /* 内边距，顶部留小一点 */
  background-color: #fff; /* 右侧内容区背景色 */
}

/* 二级分类标题 (van-cell) */
.sub-category-title {
  font-weight: bold;    /* 加粗 */
  margin-top: 16px;     /* 与上方元素的间距 */
  margin-bottom: 8px;   /* 与下方标签的间距 */
  padding: 0;           /* 去除 Cell 默认的左右内边距 */
  background-color: transparent; /* 背景透明 */
  color: #323233;       /* Vant 标题颜色 */
  font-size: 14px;      /* 字体大小 */
}
/* 去除 van-cell 默认的下边框 */
.sub-category-title::after {
  border-bottom: none;
}
/* 第一个二级分类标题不需要顶部外边距 */
.tag-content .van-cell:first-child {
  margin-top: 8px;
}


/* 三级标签 Checkbox 网格布局 */
.checkbox-grid {
  display: flex;
  flex-wrap: wrap; /* 允许换行 */
  gap: 8px;        /* 网格间距 */
}

/* 单个 Checkbox 项目样式 */
.checkbox-item {
  /* 使 Checkbox 看起来像标签 */
  background-color: #f7f8fa; /* 默认背景色 */
  border: 1px solid #f7f8fa; /* 默认无明显边框 */
  border-radius: 4px;        /* 轻微圆角 */
  padding: 4px 10px;       /* 内边距 */
  margin: 0 !important;      /* 重置 Vant Checkbox 可能的 margin */
  font-size: 13px;           /* 标签字体大小 */
  line-height: 1.4;          /* 行高 */
  color: #555;              /* 默认文字颜色 */
}

/* Checkbox 标签文本样式 */
:deep(.van-checkbox__label) {
    margin-left: 4px;   /* 图标和文字间距 */
    line-height: inherit; /* 继承父级行高 */
}

/* Checkbox 选中时的特殊样式 */
:deep(.van-checkbox--checked) .checkbox-item {
    background-color: #eef7ff; /* 选中背景色 (淡蓝) */
    border-color: #d0eaff;     /* 选中边框色 (更淡的蓝) */
    color: #1989fa;            /* 选中文本颜色 (主蓝) */
}
/* Checkbox 选中时 Icon 颜色 */
:deep(.van-checkbox__icon .van-icon) {
    border-color: #c8c9cc; /* 未选中边框色 */
}
:deep(.van-checkbox--checked .van-icon) {
    background-color: #1989fa; /* 选中背景色 */
    border-color: #1989fa;     /* 选中边框色 */
}

/* 底部固定按钮区域 - 占位符 */
.save-button-placeholder {
  height: 70px; /* 高度与下方容器一致或稍大，防止内容被遮挡 */
}
/* 底部固定按钮区域 - 容器 */
.save-button-container {
  position: fixed; /* 固定定位 */
  bottom: 0;       /* 底部对齐 */
  left: 0;
  right: 0;
  padding: 10px 16px; /* 内边距 */
  background-color: #fff; /* 背景色 */
  border-top: 1px solid #ebedf0; /* 顶部细线 */
  z-index: 100;      /* 确保在其他内容之上 */
  box-sizing: border-box; /* padding 不影响宽度 */
  box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.05); /* 可选：加一点阴影 */
}
</style>