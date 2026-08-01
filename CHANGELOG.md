# Changelog

## v0.1.0 (2026-08-01) — 北极雪屿官网 minimum 走通

**项目**: ziven-bjxy-website — 北极雪屿滑雪培训官网  
**技术栈**: Flarum 2.0 page extension + 论坛子路径 `/bjxy`  
**风格**: v3 Flarum 极简 (白底 + 店照蓝 #2D7BE5 + 浅深双版 + 8px 圆角 + Inter)  

### 新增

- 论坛子路径 `/bjxy` 路由 (Flarum 2.0 Extend\Routes)
- 10 section 渲染: 公告条 + 导航 + Hero + 关于 + 特色 (6) + 教学体系 (单板 8 + 双板 9) + 教练 + 评价 + 学员展示 + 联系 + footer
- 后台 8 section 全可配:
  - 品牌: 品牌名 / 副标 / Logo / ELITE 文字
  - Hero: 主标题 / 副标题 / 浅色 banner / 深色 banner / CTA 文字 / CTA 链接
  - 关于: 小标题 / 主标题 / 描述 / 3 个 stat
  - 特色: 6 个特色卡片 (icon / title / desc) 可增删
  - 教学体系: 单板 8 级 / 双板 9 级 (level / name / desc) 可增删
  - 教练: 用户组多选 (inline checkbox, 弹 modal 留 v0.1.1)
  - 评价: HTML 自由区
  - 学员展示: HTML 自由区 + 简化 JSON 备选
  - 联系: 地址 / 电话 / 微信 / 邮箱
- 浅色/暗色双版 (`[data-theme]` 切换, 顶部 🌙/☀️ 按钮)
- 17 级教学体系数据 (单板 8 + 双板 9) hard-coded 默认 + settings 覆盖
- 6 特色 hard-coded 默认 + settings 覆盖
- 4 Controllers: Settings / Upload / Coaches / CoachShow
- 所有图片上传走 ziven-core TencentCOSService (不重复造轮子)
- Forum 页面加载时 `?theme=dark` URL 参数自动切暗色
- 默认 logo fallback: 品牌名首字 + "北极雪屿"

### 已知问题 / v0.1.1 待做

- 弹 modal 选用户组 (替代 inline checkbox)
- 拖拽排序教练 (sortablejs)
- 教练 modal 详细内容字段
- 评价/学员展示默认卡片模板 (目前只有 HTML 自由区, 没填时空白)

### 关键 SOP 沉淀

- **53. Flarum 2.0 JSX text 不能含裸 `"` (bail on babel parser)**:
  - JSX text 里 `[{image:"url"}]` 会报 `Unexpected token, expected "}"`
  - 修法: 改用 HTML entity `&quot;` 或 unicode 中文引号
  - bjxy v0.1.0 BjxySettings.jsx:190 实测
- **54. Flarum 2.0 扩展 JSX 不 import mithril, 走 vendor 注入的 global m** (zct 同款):
  - 写 `import m from 'mithril'` 找不到模块 (extension node_modules 没装 mithril)
  - 修法: 删 import, 依赖 vendor 编译时把 mithril 挂到 `window.m`
  - zct TagBgImageUpload.jsx + bjxy BjxyPage.jsx / BjxySettings.jsx 实测

