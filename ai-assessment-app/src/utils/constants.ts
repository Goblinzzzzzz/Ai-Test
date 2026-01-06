// Assessment questions based on PRD
export const QUESTIONS = [
  {
    id: 1,
    dimension: 1, // AI卷入度
    text: "你目前在工作中使用AI工具（如ChatGPT、文心一言等）的频率是？",
    options: [
      { text: "每天都离不开，它是我的'外挂'", value: 3 },
      { text: "每周偶尔用几次，辅助处理一些小事", value: 2 },
      { text: "听说过但没怎么用过，主要还是靠自己", value: 1 },
      { text: "几乎不用，感觉那是技术人员的事", value: 0 }
    ]
  },
  {
    id: 2,
    dimension: 1, // AI卷入度
    text: "你是否购买过ChatGPT Plus、Midjourney或其他AI工具的会员？",
    options: [
      { text: "是，长期订阅，为了效率愿意付费", value: 3 },
      { text: "买过体验了一下，没续费", value: 2 },
      { text: "没有，只用免费的", value: 1 },
      { text: "公司/他人给配了账号", value: 2 } // 特殊项：被动卷入
    ]
  },
  {
    id: 3,
    dimension: 2, // 指令驾驭力
    text: "为了让AI写出的文案更符合你的要求，你通常会怎么提问？",
    options: [
      { text: "提供详细的角色、背景、任务目标和参考范文", value: 3 },
      { text: "会多写几句话描述我的具体需求", value: 2 },
      { text: "直接说'帮我写个...'", value: 1 },
      { text: "没怎么写过/不知道还能怎么问", value: 0 }
    ]
  },
  {
    id: 4,
    dimension: 2, // 指令驾驭力
    text: "当你觉得AI回答得不好（胡说八道）时，你会怎么做？",
    options: [
      { text: "我有自己的一套'指令模版'或知识库，很少翻车", value: 3 },
      { text: "像教实习生一样，指出它的错误，补充背景信息，让它重写", value: 2 },
      { text: "换个问题重新问，或者刷新重来", value: 1 },
      { text: "直接放弃，觉得'AI也就那样，不好用'", value: 0 }
    ]
  },
  {
    id: 5,
    dimension: 3, // 场景覆盖率
    text: "你目前尝试过用AI解决哪些领域的问题？",
    options: [
      { text: "文本写作 + 图片生成 + 数据/代码分析", value: 3 },
      { text: "文本写作 + 图片生成", value: 2 },
      { text: "仅限文本写作/翻译/搜索", value: 1 },
      { text: "还没开始有效使用", value: 0 }
    ]
  },
  {
    id: 6,
    dimension: 3, // 场景覆盖率
    text: "除了对话，你是否尝试过用AI生成图片或辅助做PPT？",
    options: [
      { text: "经常用，已纳入我的工作流（如做海报、配图）", value: 3 },
      { text: "试过一两次，觉得挺好玩但还没用于工作", value: 2 },
      { text: "没试过，不知道AI还能做这个", value: 1 },
      { text: "不感兴趣，不如自己做得快", value: 0 }
    ]
  },
  {
    id: 7,
    dimension: 4, // 创新进化力
    text: "每周耗时1小时的重复性报表，若有机会用AI改造？",
    options: [
      { text: "非常想！愿意花3小时搭流程，之后自动运行", value: 3 },
      { text: "尝试让AI写公式简化，但不敢完全交给机器", value: 2 },
      { text: "搜简单工具，有'一键生成'就用", value: 1 },
      { text: "维持现状，怕麻烦", value: 0 }
    ]
  },
  {
    id: 8,
    dimension: 4, // 创新进化力
    text: "课程涉及底层逻辑（如AI编程），你的心态？",
    options: [
      { text: "掌控：希望学底层逻辑，自己设计工具", value: 3 },
      { text: "好奇：好奇AI的思考逻辑", value: 2 },
      { text: "实用：只关心 SOP 和结果", value: 1 },
      { text: "畏难：技术原理部分会跳过", value: 0 }
    ]
  },
  {
    id: 9,
    dimension: 5, // 技术亲和度
    text: "面对文件名混乱或需清洗的Excel表格？",
    options: [
      { text: "尝试寻找'一句话搞定'的工具/方法", value: 3 },
      { text: "找技术部/IT同事写脚本", value: 2 },
      { text: "用 Excel 函数慢慢做", value: 1 },
      { text: "手工一个个弄", value: 0 }
    ]
  },
  {
    id: 10,
    dimension: 5, // 技术亲和度
    text: "'今天能用自然语言写出代码（Python）'，你的反应？",
    options: [
      { text: "期待：不背语法也能写代码想试试", value: 3 },
      { text: "怀疑：觉得太难，短课学不会", value: 1 }, // 特殊项：B=1
      { text: "无感：不需要写代码", value: 1 }, // 特殊项：C=1
      { text: "不可能：零基础/文科生，抗拒", value: 0 }
    ]
  }
];

export const DIMENSION_NAMES = {
  1: "AI卷入度",
  2: "指令驾驭力", 
  3: "场景覆盖率",
  4: "创新进化力",
  5: "技术亲和度"
};

export const PERSONA_TITLES = {
  "AI 观望者": "AI 观望者（The Observer）",
  "效率尝鲜者": "效率尝鲜者（The Explorer）", 
  "流程设计师": "流程设计师（The Designer）",
  "超级个体": "超级个体（The Super Individual）"
};

export const PERSONA_DESCRIPTIONS = {
  "AI 观望者": "对AI保持观望，还没找到结合点",
  "效率尝鲜者": "当搜索引擎用，遇到幻觉会挫败", 
  "流程设计师": "痛恨重复劳动，有 CTO 思维，只差兵器",
  "超级个体": "走在 90% 职场人前面，懂技术杠杆"
};

export const PERSONA_SUGGESTIONS = {
  "AI 观望者": "破冰就在此刻！关注第一节课'基础工具'",
  "效率尝鲜者": "从会用到善用！重点'提示词工程（Prompt）'", 
  "流程设计师": "打破能力边界！重点'AI Coding'自动化",
  "超级个体": "构建数字分身！重点'智能体（Agent）'"
};