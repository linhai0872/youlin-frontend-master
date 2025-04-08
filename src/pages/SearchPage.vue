<template>
  <div class="search-page">
    <!-- 1. 标签文本搜索框 -->
    <form action="/">
      <van-search
          v-model="searchText"
          show-action
          clearable
          placeholder="搜索标签"
          @search="onSearch"
          @cancel="onCancel"
          @clear="onClear"
      />
    </form>

    <!-- 2. 已选标签区域 -->
    <van-divider content-position="left">已选标签</van-divider>
    <div v-if="!activeIds || activeIds.length === 0" class="empty-tags">请在下方选择标签</div>
    <van-row gutter="8" class="selected-tags-row">
      <van-col v-for="tag in activeIds" :key="tag">
        <van-tag closeable size="medium" type="primary" @close="doClose(tag)">
          {{ tag }}
        </van-tag>
      </van-col>
    </van-row>

    <!-- 3. 选择标签区域 -->
    <van-divider content-position="left">选择标签</van-divider>
    <div class="tag-selection-area">
      <!-- 左侧一级分类导航 -->
      <van-sidebar v-model="activeIndex" class="tag-sidebar">
        <!-- 直接遍历 originTagList 获取一级分类标题 -->
        <van-sidebar-item v-for="(category, index) in originTagList" :key="index" :title="category.text" />
      </van-sidebar>

      <!-- 右侧二级/三级标签选择区 -->
      <div class="tag-content">
        <!-- 使用 Checkbox Group 实现多选 -->
        <van-checkbox-group v-model="activeIds" ref="checkboxGroupRef">
          <!-- 遍历计算出的、过滤后的二级分类 -->
          <template v-for="subCategory in filteredSubCategories" :key="subCategory.text">
            <!-- 二级分类标题 (只有当其下有可见标签时才显示) -->
            <!-- 使用 van-cell 作为二级分类标题，更清晰 -->
            <van-cell v-if="subCategory.visibleChildren && subCategory.visibleChildren.length > 0" :title="subCategory.text" class="sub-category-title" />
            <!-- 三级分类 Checkbox 网格布局 -->
            <div v-if="subCategory.visibleChildren && subCategory.visibleChildren.length > 0" class="checkbox-grid">
              <van-checkbox
                v-for="tagItem in subCategory.visibleChildren"
                :key="tagItem.id"
                :name="tagItem.id"
                shape="square"
                class="checkbox-item"
              >
                {{ tagItem.text }}
              </van-checkbox>
            </div>
          </template>
        </van-checkbox-group>
        <!-- 搜索无结果或当前分类无内容时的提示 -->
        <van-empty v-if="filteredSubCategories.length === 0 && searchText" description="未找到相关标签" />
        <van-empty v-else-if="filteredSubCategories.length === 0 && !searchText && currentCategory && currentCategory.children.length > 0" description="当前分类下无标签或已被过滤" />
        <van-empty v-else-if="!currentCategory || currentCategory.children.length === 0" description="请在左侧选择分类" />
      </div>
    </div>

    <!-- 4. 底部占位符和搜索按钮 -->
    <div class="search-button-placeholder"></div>
    <div class="search-button-container">
      <van-button block type="primary" @click="doSearchResult">按标签搜索</van-button>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from "vue-router";
// import { Toast } from 'vant'; // 如果需要提示，可以取消注释

const router = useRouter();

const searchText = ref(''); // 搜索框文本
const activeIds = ref<string[]>([]); // 已选中的标签 ID (对应 tagItem.id)
const activeIndex = ref(0); // 左侧 Sidebar 激活索引, 默认为第一个分类

// --- 更新后的标签数据结构 (三级) ---
// originTagList: Array<{ text: string, children: Array<{ text: string, children: Array<{ text: string, id: string }> }> }>
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
// 计算当前选中的一级分类对应的数据
const currentCategory = computed(() => {
  // 确保 activeIndex 在有效范围内
  if (activeIndex.value >= 0 && activeIndex.value < originTagList.length) {
    return originTagList[activeIndex.value];
  }
  return null; // 如果索引无效，返回 null
});

// 计算需要显示在右侧的、经过搜索过滤后的二级和三级标签
// 返回值: Array<{ text: string, visibleChildren: Array<{ text: string, id: string }> }>
const filteredSubCategories = computed(() => {
  // 如果没有选中任何一级分类，或选中的分类无效，则返回空数组
  if (!currentCategory.value || !currentCategory.value.children) {
      return [];
  }

  const query = searchText.value.trim().toLowerCase(); // 获取搜索词并转小写，去除首尾空格

  // 如果没有搜索词，直接返回当前一级分类下的所有有效二级分类及其所有三级标签
  if (!query) {
    return currentCategory.value.children
      // 过滤掉本身没有 children 或 children 为空的二级分类
      .filter(sub => sub.children && sub.children.length > 0)
      // 对每个有效的二级分类，添加一个 visibleChildren 属性，包含其所有的三级标签
      .map(sub => ({ ...sub, visibleChildren: sub.children }));
  }

  // 如果有搜索词，则需要过滤
  return currentCategory.value.children
    .map(sub => {
      // 过滤当前二级分类下的三级标签 (tagItem)
      // 条件：三级标签的文本 (转小写) 包含搜索词 (query)
      const visibleChildren = sub.children?.filter(tagItem =>
        tagItem.text.toLowerCase().includes(query)
      ) || []; // 如果 sub.children 不存在，则默认为空数组

      // 返回一个新的二级分类对象，其中只包含过滤后可见的三级标签
      return { ...sub, visibleChildren };
    })
    // 最后，只保留那些过滤后仍然有可见三级标签 (visibleChildren.length > 0) 的二级分类
    .filter(sub => sub.visibleChildren.length > 0);
});


// --- 方法 ---
// 触发搜索（用户在搜索框按下回车或点击搜索图标）
const onSearch = (val: string) => {
  // searchText 已经通过 v-model 绑定，computed 属性会自动重新计算
  console.log('Search triggered with:', val);
  // 通常不需要在这里执行额外操作，除非你想在搜索时做其他事，比如记录日志
};

// 点击搜索框右侧的取消按钮
const onCancel = () => {
  searchText.value = ''; // 清空搜索框内容
  // computed 属性会自动更新，显示所有标签
};

// 点击搜索框内的清除图标
const onClear = () => {
  searchText.value = ''; // 清空搜索框内容
  // computed 属性会自动更新，显示所有标签
};

// 移除一个已选标签 (点击标签上的关闭按钮)
const doClose = (tag: string) => {
  // 从 activeIds 数组中过滤掉被点击的标签
  activeIds.value = activeIds.value.filter(item => item !== tag);
};

// 点击底部的 "按标签搜索" 按钮
const doSearchResult = () => {
  // 检查是否选择了标签
  if (activeIds.value.length === 0) {
    // 可选：给用户一个提示
    // Toast('请至少选择一个标签进行搜索');
    // return; // 阻止跳转

    // 或者，如果未选标签也允许搜索（例如显示所有用户），则直接跳转
    router.push({
      path: '/user/list' // 跳转到用户列表/搜索结果页
      // query: {} // 没有标签，不传递 query 参数或传空对象
    });
    return;
  }

  // 跳转到用户列表/搜索结果页，并将选中的标签 ID 数组作为查询参数传递
  router.push({
    path: '/user/list',
    query: {
      // vue-router 会自动将数组转换为 ?tags=tag1&tags=tag2... 的形式
      tags: activeIds.value
    }
  });
};

</script>

<style scoped>
/* 整体页面添加底部内边距，防止内容被底部按钮遮挡 */
.search-page {
  padding-bottom: 70px; /* 至少为底部按钮容器的高度 */
}

/* 已选标签区域 - 提示文字 */
.empty-tags {
  padding: 16px;
  color: #969799; /* Vant 灰色 */
  font-size: 14px;
  text-align: center;
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
  /* 高度计算：视口高度 - 搜索框高度 - 上下分割线及边距 - 底部按钮预留空间 - 其他可能的垂直边距 */
  /* 这个值需要根据实际情况微调，确保在不同屏幕上表现良好 */
  height: calc(100vh - 54px - 40px - 70px - 50px); /* 估算值，可能需要调整 */
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
/* 可以调整 Sidebar Item 的样式 */
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
  /* 不强制宽度，让其自适应内容 */
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
/* Checkbox 选中时 Icon 颜色 (Vant 默认会处理，但可以强制指定) */
:deep(.van-checkbox__icon .van-icon) {
    border-color: #c8c9cc; /* 未选中边框色 */
}
:deep(.van-checkbox--checked .van-icon) {
    background-color: #1989fa; /* 选中背景色 */
    border-color: #1989fa;     /* 选中边框色 */
}


/* 底部固定按钮区域 - 占位符 */
.search-button-placeholder {
  height: 70px; /* 高度与下方容器一致或稍大，防止内容被遮挡 */
}
/* 底部固定按钮区域 - 容器 */
.search-button-container {
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