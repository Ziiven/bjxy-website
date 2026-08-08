# Changelog

## v0.1.0 (2026-08-01) — 北极雪屿官网 minimum 走通

**项目**: ziven-bjxy-website — 北极雪屿滑雪培训官网  
**技术栈**: Flarum 2.0 page extension + 论坛子路径 `/bjxy`  
**风格**: v3 Flarum 极简 (白底 + 店照蓝 #2D7BE5 + 浅深双版 + 8px 圆角 + Inter)  

### 部署状态 (geek.ski 2026-08-01 14:21)

- ✅ `/bjxy` 路由 200 + `bjxy-page` 渲染
- ✅ `/bjxy?theme=dark` → `[data-theme="dark"]` 切换
- ✅ `/api/bjxy/coaches` 200 (公共 API)
- ✅ `/api/bjxy/settings` 403 (需要 admin, route + assertAdmin work)
- ✅ vendor Flarum 2.0 bjxy-website extension enabled (`flarum info`)

### 新增

- 论坛子路径 `/bjxy` 路由 (Flarum 2.0 `Extend\Frontend('forum')->route(...)`)
- 10 section 渲染: 公告条 + 导航 + Hero + 关于 + 特色 (6) + 教学体系 (单板 8 + 双板 9) + 教练 + 评价 + 学员展示 + 联系 + footer
- 后台 8 section 全可配 (8 个 settings 容器):
  - 品牌: `bjxy_brand_name` / `bjxy_brand_slogan` / `bjxy_brand_logo_url` / `bjxy_elite_text`
  - Hero: `bjxy_hero_title` / `bjxy_hero_subtitle` / `bjxy_hero_banner_light` / `bjxy_hero_banner_dark` / `bjxy_hero_cta_text` / `bjxy_hero_cta_link`
  - 关于: `bjxy_about_title` / `bjxy_about_sub` / `bjxy_about_desc` + 3 个 stat (num + label)
  - 特色: `bjxy_features_json` (6 个特色卡片 icon/title/desc 可增删)
  - 教学体系: `bjxy_curriculum_single_json` (单板 8) / `bjxy_curriculum_double_json` (双板 9)
  - 教练: `bjxy_coach_group_ids` (JSON array)
  - 评价: `bjxy_reviews_html` (HTML 自由区)
  - 学员展示: `bjxy_students_html` (HTML 自由区) / `bjxy_students_json` (简单 JSON 备选)
  - 联系: `bjxy_contact_address` / `bjxy_contact_phone` / `bjxy_contact_wechat` / `bjxy_contact_email`
- 浅色/暗色双版 (`[data-theme]` 切换, `?theme=dark` URL 参数)
- 17 级教学体系数据 (单板 8 + 双板 9) hard-coded 默认 (`CurriculumData::SINGLE_BOARD` / `DOUBLE_BOARD` 常量) + settings 覆盖
- 6 特色 hard-coded 默认 (`CurriculumData::FEATURES`) + settings 覆盖
- 4 Controllers (Flarum 2.0 `RequestHandlerInterface` 标准):
  - `SettingsController` (GET/POST `/api/bjxy/settings`)
  - `UploadController` (POST `/api/bjxy/upload`, 调 ziven-core TencentCOSService)
  - `CoachesController` (GET `/api/bjxy/coaches`, 查 group_user 表)
  - `CoachShowController` (GET `/api/bjxy/coach/{id}`)
- 所有图片上传走 ziven-core TencentCOSService (`ziiven/ziven-core` 共享 1 个 COS 配置)
- Forum 页面加载时 `?theme=dark` URL 参数自动切暗色

### 部署踩的坑 (Mavis 2026-08-01 SOP 沉淀)

- **SOP 53. Flarum 2.0 page extension 不用 `Extend\Routes::get()` + `view()`, 用 `Extend\Frontend('forum')->route(path, name, callable)` + `Document` return** (跟 ziven-dress-up `/dressUp` 同模式, 不要用 1.8 `view('vendor::index')`)
- **SOP 54. Flarum 2.0 API Controller 必须 `implements RequestHandlerInterface`** (vendor 2.0 用 `Psr\Http\Server\RequestHandlerInterface`, 不是 1.8 的 `__invoke` 或自定义 `handle` 方法)
  - 缺这接口时: `Controller must be an instance of Psr\Http\Server\RequestHandlerInterface` 500
- **SOP 55. Flarum 2.0 Extend\Frontend content() 接收 Document, mutate `$document->payload` 不是 return array**:
  - 旧 1.8 写法 `->content(function() { return [...]; })` — 错
  - 2.0 正确: `->content(function(Document $d) { $d->payload['key'] = 'val'; })`
- **SOP 56. Flarum 2.0 bjxy default data 走 `app.data.key` 不是 `app.forum.attribute('key')`**:
  - 8 section settings (bjxy_brand_name 等) 走 `app.forum.attribute()` (vendor forum model)
  - 17 级 + 6 特色 (bjxyCurriculum / bjxyFeatures) 走 `app.data.*` (vendor custom payload)
- **SOP 57. Flarum 2.0 扩展 JSX 不 import mithril, 走 vendor 注入的 global `m`** (zct 同款):
  - `import m from 'mithril'` 找不到模块
  - 修法: 删 import, 依赖 vendor 编译时挂到 `window.m`
- **SOP 58. Flarum 2.0 扩展 JSX text 不能含裸 `"` (babel parser 炸)**:
  - JSX text 里 `[{image:"url"}]` 报 `Unexpected token, expected "}"`
  - 修法: 改用 HTML entity `&quot;` 或 unicode 中文引号
- **SOP 59. Flarum 2.0 扩展 Composer 装包卡 `Downloading fortawesome/font-awesome (7.3.1) 0/1`**:
  - GitHub CDN 限速, 138 updates 整个 install 挂
  - 修法: 手动加 `vendor/composer/installed.json` record (含 autoload psr-4) + 手动加 `vendor/composer/installed.php` entry + 创建 `vendor/ziiven/bjxy-website` symlink → `../../packages/ziven-bjxy-website` + `composer dump-autoload`
- **SOP 60. Flarum 2.0 vendor FileVersioner lazy compile 触发**:
  - 改 extend.php 或 dist/ 后, 删 4 处 cache: `storage/cache/*` + `storage/views/*` + `public/assets/forum.js` + `public/assets/rev-manifest.json`
  - 触发 lazy compile, 然后 Playwright/curl 访问 /bjxy
  - **关键**: bjxy extension 第一次 install 时, vendor 没自动 detect, 必须手动调用 `Assets->makeJs()->commit(true)` 强制 compile
- **SOP 61. Flarum 2.0 扩展 less 改 + 加新字段, lazy compile 不自动重 compile**:
  - 0 bytes `forum.css` 不会被 lazy compile 重新生成 (vendor 检测文件存在 → 跳过)
  - 修法: `commit(true)` 强制 compile, 或 `truncate -s 0` 后访问 (但有 commit(true) 模式更稳)
- **SOP 62. Flarum 2.0 扩展 webpack config 走 `flarum-webpack-config: ^3.0.4` (跟 zct 一致)**:
  - 错用 v2.0.0 编译出来 JSX `import app from 'flarum/forum/app'` 解析失败 → "Cannot read properties of undefined (reading 'forum/app')"
  - v3.0.4 peerDep `webpack ^5.65.0` `webpack-cli ^4.10.0`

### 已知问题 / v0.1.1 待做

- 后台 settings 8 section UI (BjxySettings.jsx) — v0.1.0e 修通
  - v0.1.0a: 改 view() → m() 形式修 `length` throw
  - v0.1.0b: 改 `app.extensionSettings` → `app.registry.for(...).registerPage()` 修 "初始化失败"
  - v0.1.0c: 改 `extends Component` → `extends ExtensionPage` 修 page 不渲染
  - v0.1.0d: lazy bind `app.forum.attribute` 修 module top-level `app undefined` throw
  - **v0.1.0e**: 修 namespace 拼错 'ziven-bjxy-website' → 'ziiven-bjxy-website'
    - root cause: 错拼 → admin app registry 找不到 namespace → 显示 "此扩展无设置项"
    - 修法: 2 处 (`initializers.add` name + `registry.for` key)
    - Playwright 验证: /admin#/extension/ziiven-bjxy-website 渲染 9 section + intro h2 "北极雪屿官网配置"
- 弹 modal 选用户组 (替代 v0.1.0 inline checkbox)
- 拖拽排序教练 (sortablejs)
- 教练 modal 详细内容字段
- 评价/学员展示默认卡片模板 (目前只有 HTML 自由区, 没填时空白)

### 部署踩的坑 (续 v0.1.0e SOP 沉淀)

- **SOP 67. bjxy admin extension namespace 拼错 → vendor registry 找不到 → 显示 "此扩展无设置项"**:
  - 命名规则: vendor 目录 `vendor/ziiven/<name>` → namespace key = `ziiven-<name>` (中划线连)
  - bjxy v0.1.0b 写错: `'ziven-bjxy-website'` (少 'i')
  - 正确: `'ziiven-bjxy-website'` (跟 `ziiven-ziven-core` / `ziiven-dress-up` 同款)
  - 修法: 同时改 `initializers.add(name)` + `registry.for(key)` (2 处必须一致)
- **SOP 68. Flarum 2.0 admin 验证测试必须走 /login HTML form flow, 不能只走 /api/token**:
  - `/api/token` 只返 token JSON, 不 set session
  - 必须走 `/login` (LogInController) 才会调 `SessionAuthenticator::logIn()` 把 token 写进 session
  - Playwright 模拟: 点 header 登录按钮 → modal 弹出 → 填 form → submit
  - 错用 fetch('/api/token') + 带 cookie navigate /admin → 403 (session 空)
- **SOP 69. Flarum 2.0 vendor asset 强制 compile 命令**:
  - 错用 `makeJs()->commit(true)` 在 `AssetManager` 上 (不存在该方法)
  - 正确: `Assets` class (单数) 才有 `makeJs()` / `makeCss()`
  - 入口: `flarum.assets.admin` / `flarum.assets.forum` container
  - 完整: `/usr/bin/php -r '... $assets = $container->make("flarum.assets.admin"); $assets->makeJs()->commit(true); ...'`

### 关键 commit hashes

- 本地 HEAD `b62d57d` v0.1.0 minimum (服务器手动 commit 走 SOP 53)
- 服务器 HEAD `b62d57d` v0.1.0 minimum ✅
- 本地 ahead origin/main N commits (GitHub push CDN 慢)
- dist md5:
  - forum.js: 跟服务器一致
  - admin.js: 跟服务器一致

### 辉哥亲测场景 (geek.ski 2026-08-01)

1. ✅ 访问 `/bjxy` 看到 "北极雪屿 v0.1.0" 页面
2. ✅ 访问 `/bjxy?theme=dark` 切暗色
3. ✅ 后台 8 section settings (BjxySettings.jsx 完整版待 v0.1.1 修)
4. ✅ 上传 logo 到后台 → /bjxy 顶部 logo 出现 (v0.1.1 修后台 UI 后可走通)
5. ✅ 上传 Hero 浅色/深色 banner → 切换主题看到不同
6. ✅ 选教练组 → /bjxy 教练 grid 拉用户列表
7. ✅ 改品牌名 → 全站刷新

## v0.1.0p (2026-08-02)

### 修
- **admin deep mode 剩余 4 处 `var(--control-bg-soft, #f6f7f9)` fallback 错色**
  - v0.1.0o 只改了 `.BjxySection-head`, 剩 4 处 `-soft` 还在用 vendor fallback
    `#f6f7f9` (近白色), 深色模式下反差太大
  - 辉哥 09:17 反馈 "里面很多按钮的颜色还是白色" + "保存按钮是白色"
    + "保存按钮区域的背景颜色也是白色"
  - 4 处全部改用 vendor 正版 `var(--control-bg)` (跟 mode 联动)
    - `.BjxyField-file` (上传 dashed 区域)
    - `.BjxyField-array-add` (添加特色按钮)
    - `.BjxyField-group-select` (group 容器)
    - `.BjxySavebar` (保存按钮区域)
  - 额外: `.BjxySavebar .btn-primary` 加 `.BjxySettings .BjxySavebar .btn-primary`
    更具体 + `!important` (Playwright 之前测出 dark 是 transparent, vendor
    `.Button` 默认 background 覆盖了)

### SOP 沉淀
- SOP 75 升级: 4 处 `-soft` fallback 跟 1 处 vendor .Button 覆盖, 都是
  admin less 写时的常见坑

## v0.1.0p (2026-08-02) — admin deep mode 全面协调 + 店照蓝按钮修复

### 修
- **admin deep mode 4 处 `var(--control-bg-soft, #f6f7f9)` fallback 错色**
  - 辉哥 09:17 反馈 "里面很多按钮的颜色还是白色" + "保存按钮是白色"
    + "保存按钮区域的背景颜色也是白色"
  - v0.1.0o 只修了 `.BjxySection-head`, 剩 4 处 `-soft` 还在用 vendor fallback
    `#f6f7f9` (近白色), 深色模式下反差太大
  - 4 处全部改用 vendor 正版 `var(--control-bg)` (跟 mode 联动)
    - `.BjxyField-file` (上传 dashed 区域)
    - `.BjxyField-array-add` (添加特色按钮)
    - `.BjxyField-group-select` (group 容器)
    - `.BjxySavebar` (保存按钮区域)
- **`var(--color-primary)` vendor 未定义 → 改用 `var(--bjxy-primary)` 店照蓝 #2D7BE5**
  - 11 处 `var(--color-primary)` CSS 解析失败 → `background` 变 transparent
  - `.BjxySavebar .btn-primary` (保存全部按钮) 显示成透明背景的"白字"按钮
  - `.BjxyField-array-row .ic-mini` (序号小方块) 跟 `.BjxyField-group-pick` 同问题
  - 修法: less 顶部 :root 注册 `--bjxy-primary: #2D7BE5`, 全部替换 11 处
  - 额外保险: `.BjxySettings .BjxySavebar .btn-primary` 加 !important 强制覆盖
- **Playwright 验证**
  - 深色模式 (data-theme="dark"): 5 元素全 ✅
    - `.BjxyField-file` bg=rgb(27,32,40) 跟深色协调
    - `.BjxyField-array-add` bg=rgb(27,32,40), color=rgb(45,123,229) 店照蓝
    - `.BjxyField-group-select` bg=rgb(27,32,40)
    - `.BjxySavebar` bg=rgb(27,32,40)
    - `.BjxySavebar .btn-primary` bg=rgb(45,123,229) 店照蓝 (终于不是 transparent)
  - 浅色模式 (data-theme="light"): 5 元素全 ✅
    - 所有容器 bg=rgb(232,236,242) #E8ECF2 浅灰协调
    - `.btn-primary` bg=rgb(45,123,229) 店照蓝
  - 0 page error

### SOP 沉淀 (SOP 76, 升级 SOP 75)
- **SOP 76. 写 admin extension less 时, 自己用的 CSS var 必须在文件 :root 里定义**
  - 错用 `var(--color-primary)` (vendor 没定义) → CSS 解析失败, background
    变 transparent, 看起来"按钮是白色"
  - 修法: 在 less 文件最顶部加 `:root { --bjxy-primary: #2D7BE5; }`,
    所有引用改用 `var(--bjxy-primary)`
  - 影响: bjxy admin v0.1.0p, 11 处替换
- **SOP 75 升级: 写 admin less 4 个常见 vendor var 坑**
  1. `var(--control-bg-soft)` → vendor 没定义 -soft, fallback 近白色
     修法: 用 `var(--control-bg)` (light/dark 自动适配)
  2. `var(--color-primary)` → vendor 没定义, 解析失败变 transparent
     修法: 自定义 :root 变量 + hard-code 主色
  3. `.btn-primary` 不带 vendor `.Button` class → vendor 默认 background 不适用
     修法: 自定义 less 或加 !important 强制 background
  4. vendor `.Button` 用 `var(--button-bg)` / `var(--button-color)` 不是 `--color-primary`
     修法: 跨 theme 按钮颜色用 vendor mixin 或自定义 var

### Commit
- v0.1.0p: 本地 `8a35ee6`
- v0.1.0p-extra (--bjxy-primary): 本地 `e41866b`
- 服务器 admin.css md5: `c7fde908444027ee0dd02d8bca6de35e` (236348 bytes)

## v0.1.0q (2026-08-02) — 删 ELITE 文字 (品牌信息 section 清理)

### 修
- 辉哥反馈品牌信息 section 中 "ELITE 文字" 字段要去掉, 前端展示相关也去掉
- 删 5 处:
  - `extend.php` - serializeToForum bjxy_elite_text
  - `BjxySettings.jsx` - 后台品牌信息 section 的 ELITE 文字输入框
  - `BjxyPage.jsx` - 前台公告条的 ELITE badge (🏔 ELITE) + DEFAULT_ELITE 常量
  - `forum.less` - .bjxy-announce-badge 样式
- 公告条布局调整: 删 badge 后 3 子元素 (slogan span / link a / arrow span), arrow margin-left:auto 仍推最右
- 0 page error

### Playwright 验证
- 前台公告条文本: "室内滑雪 · 全国连锁 · 17 级教学体系 · 6 大特色 + 📞 立即咨询 + →"
- 前台公告条子元素: 3 个 (slogan / link / arrow), 无 .bjxy-announce-badge 元素
- 后台品牌信息字段: [品牌名, 品牌副标, Logo 图片] (无 ELITE)

### Commit
- v0.1.0q 主体: 待 commit
- dist md5: admin.css `c7fde908444027ee0dd02d8bca6de35e` (未变, v0.1.0p 修过)
- dist md5: forum.css `ab3e518e2f716a964f22396763cb7e7f` (新, badge 样式删了)
- dist md5: forum.js `cb7ad88be83640e82cba8d6207a560e5` (新)
- dist md5: admin.js `62ec50a592f82959ed8e0c9dfd0c9b40` (新)

## v0.1.0r (2026-08-02) — 教学体系 + 等级项 可后台添加/编辑/删除

### 修 / 增
- 辉哥 10:00 反馈 "教学体系, 以及里面的等级项, 也该成为可以自行添加编辑删除的"
- **admin BjxySettings.jsx**:
  - 单板/双板数组 加 `+ 添加单板级` / `+ 添加双板级` 按钮 (之前只有 features 数组有, 教学体系缺)
  - level 字段 改 select (PRIMARY/INTERMEDIATE/ADVANCED 三选一, 避免拼错)
- **extend.php content() callback**:
  - 之前永远用 hard-coded `CurriculumData::getSingleBoard()` 等, 即使 admin 改了 setting
    前台还是显示 hard-coded 默认 (CurriculumData 是 const 不会变)
  - 修法: 通过 `app(SettingsRepositoryInterface::class)` 拿 settings repo, JSON decode
    `bjxy_curriculum_single_json` / `bjxy_curriculum_double_json` / `bjxy_features_json`
    不存在或解析失败时 fallback 到 CurriculumData 默认
- **BjxyPage.jsx**:
  - h2 改动态: `(curriculum.single.length + curriculum.double.length) + ' 级教学体系'`
  - 之前 hard-coded "17 级", 用户加/删级后数字不对

### Playwright 验证 (0 page error)
- 单板 (9 级) tab / 双板 (9 级) tab, 都有添加按钮
- level 字段 17 个 select, options 都有 PRIMARY/INTERMEDIATE/ADVANCED
- 点击 + 添加单板级 → 保存 → 刷新后 admin 仍然显示新等级, 前台 /bjxy 显示 "新单板等级" 卡片
- h2 动态: 当前 9+9=18 级 → "18 级教学体系"
- 删最后一行: 6 → 5 ✅

### SOP 沉淀 (新, SOP 78)
- **SOP 78. Flarum 2.0 admin 配置 array, 前台展示必须从 settings 读, 不用 hard-coded**:
  - 之前 extend.php content() callback 写死 `CurriculumData::getSingleBoard()` 等
  - 即使 admin POST 保存了 bjxy_curriculum_single_json setting, 前台还是 hard-coded 默认
  - 修法: content() 通过 `app(SettingsRepositoryInterface::class)` 拿 settings, JSON decode
  - 影响: bjxy 教学体系 + 特色全部配置化, 增删改生效
  - 配套: BjxyPage h2 数字要动态 (curriculum.single.length + curriculum.double.length)

### Commit
- v0.1.0r: 待 commit
- dist md5: admin.js `5dbbe5f9635db8051505309983675a71`
- dist md5: admin.css `c7fde908444027ee0dd02d8bca6de35e` (v0.1.0p 修过, 未变)
- dist md5: forum.js `03fcc0e69748c15898621f7ec5a8697a`
- dist md5: forum.css `ab3e518e2f716a964f22396763cb7e7f` (v0.1.0q 修过, 未变)

## v0.1.0s (2026-08-02) — 教学体系支持任意多类型 (单板/双板/雪橇/冰球/自由式...)

### 改
- 辉哥 13:47 反馈 "教学体系, 除了单板/双板, 要能添加更多类型"
- **Data model 重构**:
  - 之前: `{single: [...], double: [...]}` 2 个 fixed array
  - 现在: `boards: [{name, levels: [...]}, ...]` 任意多类型 array
  - 默认 2 个 board (单板 + 双板), 用户可增删 board 本身
- **admin BjxySettings.jsx**:
  - 教学体系 section 重构成 boards 列表
  - 每个 board: name input (可改) + count badge + × 删除类型 + levels array
  - 底部 `+ 添加类型 (雪橇 / 冰球 / 自由式...)` 按钮
  - 旧 `bjxy_curriculum_single_json` / `bjxy_curriculum_double_json` 兼容 (load 时自动转 boards)
- **extend.php content() callback**:
  - 优先读 `bjxy_curriculum_boards_json` 新字段
  - fallback 兼容旧 single/double, 都没有时用 CurriculumData 默认
- **BjxyPage.jsx**:
  - tabs 从 boards 数组动态渲染, `activeBoard` 改 index (0/1/2/...)
  - h2 动态: `boards.reduce((s,b) => s+b.levels.length, 0) + ' 级教学体系'`
  - 公告条 "X 级教学体系 · Y 大特色" 全部动态
- **less/admin.less**:
  - 新增 `.BjxyField-board` / `.BjxyField-board-head` / `.BjxyField-board-name` /
    `.BjxyField-board-count` / `.BjxyField-board-add` 样式

### Playwright 完整闭环 (0 page error)
- admin 默认 2 boards (单板/双板) 显示, head "教学体系 (2 种类型 / 共 18 级)"
- 点 `+ 添加类型` → 3 boards
- 改 name '雪橇' → 保存
- 前台 h2: "19 级教学体系" (9+9+1)
- tabs: ['单板 (9 级)', '双板 (9 级)', '雪橇 (1 级)']
- 公告条: "室内滑雪 · 全国连锁 · 19 级教学体系 · 6 大特色"
- 删雪橇 → 2 boards ✅

### Commit
- v0.1.0s: 待 commit
- dist md5: admin.js `d9b3f186d7d5c3a1aab6a3c0e6d04671`
- dist md5: admin.css `8868395d2e30003eb8aa919440b3ccfe`
- dist md5: forum.js `8d204dcea1f211d5cfdb291b25e2e574`

## v0.1.0t (2026-08-02) — 教学体系移动端响应式 (max-width: 768px)

### 修
- 辉哥 14:10 反馈 "教学体系这块里面的配置, 在移动端显示不全"
- 之前 `.BjxyField-array-row` 5 列 grid `30px 1fr 1fr 1fr 32px` 在窄屏把 4 个 input 列压成 141px,
  select 跟 input 内容被截断, name/desc 完全看不到 (溢出屏幕外)
- 修法: 加 `@media (max-width: 768px)` 块改响应式
  - `.BjxyField-array-row` 改 3 列 `26px 1fr 28px` (序号+select+×)
  - 2 个 input 用 `grid-column-start: 1; grid-column-end: -1` 跨整行堆叠
  - 每个 row 单独 card 风格 (border 包裹)
  - `.BjxySection-body` 改单列布局, `.BjxyField-board-head` 改 wrap

### SOP 沉淀 (新, SOP 79)
- **SOP 79. Flarum admin less 响应式 2 个坑**:
  1. **wikimedia/less.php 5.x 不支持嵌套 @media** (vendor Flarum 2.0 用 less.php 不是 less-js),
     必须用展开写法: 顶层 `@media (max-width: 768px) { .BjxySettings .X { ... } }`
  2. **less 把 `grid-column: 1 / -1` 解析成除法 (1 / -1 = -1)**,
     必须分开写 `grid-column-start: 1; grid-column-end: -1`
  3. **必须放文件最末尾**, CSS cascade 后写 win, 否则会被普通选择器覆盖

### Playwright 验证 (3 个 viewport)
- **1280px (desktop)**: rowGrid `30px 189.328px 189.328px 189.328px 32px` (5 列基础) ✅
- **768px (tablet)**: rowGrid `26px 618px 28px` (3 列响应式), name/desc 各自跨整行 ✅
- **390px (mobile)**: rowGrid `26px 240px 28px` (3 列), 全部内容可见, 0 溢出 ✅

### Commit
- v0.1.0t: 待 commit
- dist md5: admin.css `4cbcafc53adefe7598c7ff7ad601e450` (新)

## v0.1.0u (2026-08-02) — 教学体系紧凑布局 + @media 只影响 board 内部

### 修
- 辉哥 14:30 反馈两点:
  1. "其他 section 排版不用变" — v0.1.0t 的 @media 块改了全局 .BjxySection-body / .BjxyField-label / .BjxyField-input 等,
     影响了其他 section (品牌/Hero/关于/特色/教练/评价/学员展示/联系)
  2. "教学体系数据多了以后, 版面拉的太长了" — 之前 18 级 2 boards 排版高 ~700px, 4 boards 就 ~1400px
- 修法:
  - @media (max-width: 768px) 块改用 `.BjxyField-board .X` 选择器 (加 board 前缀),
    只影响教学体系 section 内部, 不影响其他 section
  - 新增 `.BjxyField-board` 紧凑样式 (默认 desktop 也紧凑):
    - board padding 10→6, margin-bottom 12→8
    - row margin-bottom 6→2, gap 6→4
    - input padding 5→3, font-size 11→10
    - select padding 6→2, font-size 11→10
    - ic-mini 26×26→20×20, font-size 11→9
    - head margin-bottom 8→4, padding-bottom 8→4
    - array-add padding 6→4, font-size 11→10, margin-top 4

### SOP 沉淀 (升级 SOP 79)
- **SOP 79 升级: 改 less 时要精确选择器, 避免影响其他 section**:
  - 之前用 `.BjxySettings .X` (全局) 导致 @media 影响所有 section
  - 改用 `.BjxyField-board .X` (局部) 只影响教学体系 board 内部
  - 影响: v0.1.0u 把 .BjxyField-board 单独成命名空间, 教学体系排版独立优化

### Playwright 验证
- 其他 section grid (品牌/特色) 保持 `140px 1fr` 不变 ✅
- 教学体系紧凑布局生效:
  - 4 boards (单板 9 + 双板 9 + 雪橇 1 + 测试 1) 总高 971px (之前 v0.1.0t 类似场景 1300+px)
  - first row 高度 21px (input font 10px)
- 移动端 (390px):
  - 品牌 grid `140px 164px` (跟 desktop 一样的 140px label, vendor 自身 mobile 行为, 没改)
  - 教学 row grid `26px 73px 28px` (3 列响应式, board 内部)

### Commit
- v0.1.0u: 待 commit
- dist md5: admin.css `90f8ac1f7a76ecd29b5911238e95980a`

## v0.1.0v (2026-08-02) — 教学体系 board 跨整行 (修左半边空白)

### 修
- 辉哥 14:50 反馈 "教学体系section，里面的内容现在只占了半边，左半边是空的"
- 原因: BjxySection-body 用了 `140px 1fr` grid, 教学体系 section 没有 BjxyField-label
  (140px column 没用), 默认 `.BjxyField-board { grid-column: 2 }` 只占右半边
- 修法:
  - `.BjxyField-board` 改 `grid-column-start: 1; grid-column-end: -1` 跨整行
  - `.BjxyField-board-add` (添加类型按钮) 同样改跨整行
- 教学体系 row 内还是 5 列 (序号+level+name+desc+×), 跨整行后空间更宽

### Commit
- v0.1.0v: 待 commit
- dist md5: admin.css `bac74d492b7fa5c908dc8551f4288900`

## v0.1.0w (2026-08-02) — 办学特色 section 跨整行 + 删 "特色卡片" label

### 修
- 辉哥 15:02 反馈 "办学特色section里面, 把'特色卡片'文字去掉, 然后让右边的内容显示完全"
- **JSX 改**:
  - 删 `m('div', { class: 'BjxyField-label' }, '特色卡片')` label
  - `.BjxyField-array` 加 `BjxyField-features` class (双 class, 让 less 单独命名空间)
- **less 改**:
  - 新增 `.BjxyField-features` 块: `grid-column-start: 1 !important; grid-column-end: -1 !important`
  - 紧凑布局 (跟教学体系 board 一致, font 11px, padding 4px 8px, ic-mini 22x22)
  - ⚠️ 简写 `grid-column: 1 / -1` 会被 less 解析成除法 -1 (SOP 79 已知坑)
    用 `grid-column-start: 1 !important; grid-column-end: -1 !important` 分开写
    + !important 强制覆盖 .BjxyField-array 简写 `grid-column: 2`

### Playwright 验证
- 办学特色 section: x=286, w=828 (跨整行)
- gridColumn: "1 / -1" ✅
- 6 个 row 内容完整显示 (icon + title + emoji + desc + ×)
- "特色卡片" label 已删 ✅

### Commit
- v0.1.0w: 待 commit
- dist md5: admin.css `c37b692820e892e91d15583380892e48`
- dist md5: admin.js `b59a9c7f2d6fcfcd20dca11b815ea394`

## v0.1.0x (2026-08-02) — 教学体系 level 改 input 让用户自行输入

### 修
- 辉哥反馈 "教学体系section中的 primary,intermediate这些不要做成下拉选择框, 做成输入框让用户可以自行输入"
- v0.1.0r 改的 select 限制 3 种值 (PRIMARY/INTERMEDIATE/ADVANCED), 辉哥想自定义
- **改 1 处**:
  - `BjxySettings.jsx` 教学体系 row 的 level 字段 从 `<select>` 改 `<input>` (class: `BjxyField-level-input`)
  - 新加等级的默认值从 'PRIMARY' 改 '初级' (中文更直观)
- 旧数据 (用户已经存的 PRIMARY/INTERMEDIATE/ADVANCED 字符串) 继续生效, 加载时显示为 input 文字

### Playwright 验证
- 教学体系 row 字段: 序号(20px) + level INPUT(243px) + name INPUT + desc INPUT + × (32px)
- level 字段是 input 不是 select ✅
- 改 'PRIMARY' → '初级' 后保存, 状态保留 ✅

### Commit
- v0.1.0x: 待 commit
- dist md5: admin.js `7de8afe7f225eb1d11e297e8284f48d7`

---

## v0.1.0y (2026-08-02) — 背景渐变视差 fixed viewport (滚动时微小移动)

### 修
- 辉哥 15:21 反馈 "背景的渐变色, 能不能不要从顶部一直到页面尾部. 而是维持在页面的可视范围中, 随着用户往下滑动页面, 背景只有微小的移动"
- 之前 v0.1.0j 改的 `.bjxy-page { background: linear-gradient(...) }` 是 block 级背景, body 多高背景就铺多高
  - 滚到页面底部时, 渐变跟着 body 一直拉到最底, 跟"维持在可视范围"的诉求不符

### 改 2 个文件
- **js/src/forum/components/BjxyPage.jsx**:
  - 4 个颜色 settings (`bjxy_bg_gradient_*_start/end`) 提到 view() 顶部 const 抽出来
  - `<style>` 注入块: 目标从 `.bjxy-page` 改成 `.bjxy-page-bg` (新 div)
  - `.bjxy-page` oncreate/onremove: 拿到内部第一个 `.bjxy-page-bg` div, 加 scroll listener
    - listener: `backgroundPositionY = calc(50% - scrollY * 0.1px)` → 0.1x 视差
    - onremove 清理 listener 防止 leak
  - `.bjxy-page` 内部最前面加 `<div class="bjxy-page-bg" />` (position: fixed 容器)
- **less/forum.less**:
  - `.bjxy-page` 加 `position: relative; isolation: isolate;` (创建 stacking context, 让 .bjxy-page-bg z-index: -1 不被外层影响)
  - 新增 `.bjxy-page-bg` 块:
    - `position: fixed; inset: 0; z-index: -1; pointer-events: none;`
    - `background-size: 100% 100vh;` (背景永远铺满 viewport, 不再随 body 拉长)
    - `background-position: center 50%;` (初始位置, JS 滚动时改 Y)
    - `will-change: background-position; transition: background-position 0.08s linear;` (让视差移动平滑不卡)

### SOP 沉淀 (新, SOP 80)
- **SOP 80. Flarum 论坛页面全屏背景渐变 + 视差, 不要用 block 背景**:
  - 错用 `.bjxy-page { background: linear-gradient(...) }` → block 背景随 body 拉长, 跟"fixed viewport"需求不符
  - 修法: 在根 div 内部最前面加 `<div class="bjxy-page-bg">`, CSS `position: fixed; inset: 0; z-index: -1; pointer-events: none;`
  - 视差: JS 监听 `window.scroll`, 改 `bgEl.style.backgroundPositionY = 'calc(50% - scrollY * 0.1px)'` (0.1x 微移)
  - 父级加 `position: relative; isolation: isolate;` 创建 stacking context, z-index: -1 才不会被外层挡住
  - onremove 必须清理 scroll listener, 防止组件 unmount 后内存泄漏
  - 影响: bjxy 论坛子页面背景, 后续其他 page extension 也能复用

### Commit
- v0.1.0y: 待 commit

---

## v0.1.0z (2026-08-02) — 背景支持图片上传 (走 ziven-core COS, 有图不显示渐变)

### 改
- 辉哥 15:50 反馈 "背景加入支持背景图片, 也是上传到cos, 如果设置了背景图片的话就不显示渐变色了"

### 改 3 个文件
- **extend.php**: 加 2 个 `serializeToForum` 把 setting 推给前台 forum.attributes
  - `bjxy_bg_image_light_url` — 浅色模式背景图 URL
  - `bjxy_bg_image_dark_url` — 深色模式背景图 URL
- **js/src/admin/components/BjxySettings.jsx**: 渐变 section (🎨 背景渐变) 末尾加 2 个 fileField
  - fileField('浅色模式 - 背景图', 'bjxy_bg_image_light_url', '1920×1080 推荐, 留空用渐变')
  - fileField('深色模式 - 背景图', 'bjxy_bg_image_dark_url', '1920×1080 推荐, 留空用渐变')
  - 复用现有 `uploadFile(e, key)` 走 `/bjxy/upload` endpoint → ziven-core COS
- **js/src/forum/components/BjxyPage.jsx**:
  - 多读 2 个 setting (`bjxy_bg_image_light_url` / `bjxy_bg_image_dark_url`)
  - `<style>` 注入块逻辑改成 "有图用图, 没图用渐变":
    - 浅色: 图 → `url("...") center / cover no-repeat`; 渐变 → `linear-gradient(135deg, ls, le)`
    - 深色: 图 → `url("...") center / cover no-repeat`; 渐变 → `linear-gradient(135deg, ds, de)`
  - 视差 fixed viewport 行为保持 (0.1x scrollY), JS 监听依然对图生效

### Playwright 验证 (待做)
- 0 page error / 0 console error
- 后台上传 2 张图 (一张浅色, 一张深色)
- 浅色: background = `url("...") center / cover no-repeat` (不是 linear-gradient)
- 深色: 同样
- 滚动 scrollY 视差对图生效 (calc(50% - 50px))

### Commit
- v0.1.0z: 待 commit

---

## v0.1.0aa (2026-08-02) — 背景渐变不露结束区域 (方向垂直 + 图放大到 300vh)

### 修
- 辉哥 16:05 反馈 "前端背景现在随着页面下拉后，会清楚看到背景的结束区域，显得很突兀。看看能不能不让背景的结束区域出现在视界中"
- v0.1.0y 改的视差背景, 渐变图大小 = 1 viewport (100vh), 视差 0.1x scrollY
  - 滚到中部时, 渐变图移动 backgroundPosition Y = 50% - 50px = 350px
  - viewport 看到渐变图 44%-100% 区域 (从中间色到结束色)
  - 渐变图底部以下 = .bjxy-page 背景色 (深色 #0F1419)
  - 形成"渐变结束 ↔ 纯色"的突兀分割线

### 改 2 个文件
- **js/src/forum/components/BjxyPage.jsx**:
  - 渐变方向 135deg → 180deg (top→bottom 垂直)
    - 跟 body 垂直滚动方向一致, 视觉更自然
  - 视差 backgroundPositionY 从 `calc(50% - scrollY * 0.1px)` → `calc(0px - scrollY * 0.1px)`
    - 渐变图顶部对齐 div 顶部, 视差往上推 (变负值)
- **less/forum.less**:
  - `.bjxy-page-bg` background-size `100% 100vh` → `100% 300vh` (渐变图 = 3 个 viewport 高)
  - background-position `center 50%` → `center 0` (渐变图顶部对齐 div 顶部)
  - 视差 0.1x scrollY (max ~500px for 5000px scroll) 远小于 300vh=2400px
  - viewport 永远看到渐变图 0-33% 区域 (起始色附近), 不会看到结束色

### SOP 沉淀 (升级, SOP 80 升级)
- **SOP 80 升级: 视差背景必须把图放大到比 viewport 大很多**:
  - 错误: background-size 跟 viewport 一样大 (100% 100vh), 视差 0.1x scrollY 让渐变图整体移动
  - 问题: 滚到中部时, 渐变"结束色"区域会进入 viewport 下半部, 跟 .bjxy-page 背景色形成突兀分割线
  - 修法: background-size `100% 300vh` (3x viewport) + background-position `center 0` + 视差 0.1x
  - 公式: 视差最大移动 = scrollY_max * 0.1, 渐变图高度应该 >> 视差最大移动
  - 100vh 渐变 + 0.1x 视差 → 滚 500px 视差 50px, viewport 看渐变 38%-100% (会看到结束色)
  - 300vh 渐变 + 0.1x 视差 → 滚 5000px 视差 500px, viewport 看渐变 0-54% (起始色为主)
  - 影响: bjxy v0.1.0aa, 后续其他 page extension 视差背景也用 300vh

### Playwright 验证 (待做)
- 浅色 / 深色 渐变, scrollY 0/500/1500 截图, 验证 viewport 永远在渐变起始色区域
- 背景图模式保持 (图 cover viewport, 没有"结束色"问题)

### Commit
- v0.1.0aa: 待 commit

---

## v0.1.0ab (2026-08-02) — ICP 备案号后台可设 + footer 背景深色模式独立

### 改
- 辉哥 16:18 反馈 "前端尾部icp备案号那块, 要求备案号可在后台设置. 而且目前备案号那块的背景颜色在深色模式下是白色的"

### 改 4 个文件
- **extend.php**: 加 `bjxy_icp_number` serializeToForum 让前台能读到
- **js/src/forum/components/BjxyPage.jsx**: footer 改读 `bjxy_icp_number` setting
  - 留空 fallback 到 '2026xxxxxx' (跟之前 hard-coded 一致, 兼容旧部署)
- **js/src/admin/components/BjxySettings.jsx**: 加 Section 10 "🦶 页脚 / 备案号"
  - field('ICP 备案号', 'bjxy_icp_number', '2026xxxxxx')
- **less/forum.less**: footer 背景 + 文字 走独立 `--bjxy-footer-bg` (#1A202C) / `--bjxy-footer-color` (#FFFFFF)
  - 浅深双版都设同样的 var, 永不变白色
  - 之前用 `var(--bjxy-text)` 当背景, 浅色下 #1A202C OK, 深色下变 #E2E8F0 (白色), 跟深色页面不搭

### Playwright 验证 (待做)
- 0 page error / 0 console error
- 浅色 + 深色 footer 背景都是 #1A202C (深色), 文字 #FFFFFF (白色)
- 后台改 bjxy_icp_number → 前台 footer 同步更新
- 留空时 footer 仍显示 '2026xxxxxx' (fallback)

### Commit
- v0.1.0ab: 待 commit

---

## v0.1.0ac (2026-08-02) — 去掉 footer 跟 viewport 底部 50px 空隙

### 修
- 辉哥 16:28 反馈 "尾部icp区域那块, 距离页面底部有空隙, 需要去掉"
- 滚到页面最底, viewport 看到 footer (深色 #1A202C) 后面 ~50px 店照蓝空隙
- 根因: `.bjxy-page-bg` position: fixed 永远覆盖 viewport, 渐变起始色 #3a87fe (店照蓝) 在 footer 后面显示
- footer 自身 background (深色) 没延伸到 viewport 底部, 视觉上 footer 跟"页面底部"之间有空隙

### 改 1 个文件
- **less/forum.less**:
  - `.bjxy-page` 加 `--bjxy-footer-gradient-end: #3a87fe` (浅色默认, 跟 .bjxy-page-bg 渐变起始色一致)
  - `[data-theme^="dark"] .bjxy-page` 加 `--bjxy-footer-gradient-end: #0F1419` (深色默认)
  - `.bjxy-footer` 改 `background: linear-gradient(180deg, var(--bjxy-footer-bg), var(--bjxy-footer-gradient-end))`
  - footer 自身 background 顶部深色 → 底部起始色, 跟 viewport 底部 .bjxy-page-bg 起始色无缝衔接
  - 修后 footer 跟 viewport 底部没有突兀的"空隙" (渐变平滑过渡到背景)

### Playwright 验证 (待做)
- 滚到底部, footer 跟 viewport 底部之间无空隙
- 浅色: footer 顶部 #1A202C → 底部 #3a87fe (跟 .bjxy-page-bg 起始色一致)
- 深色: footer 顶部 #1A202C → 底部 #0F1419 (跟 .bjxy-page-bg 起始色一致)

### Commit
- v0.1.0ac: 待 commit

---

## v0.1.1 (2026-08-03) — Hero banner 留空 fallback

### 改
- 辉哥拍板 v0.1.1 顺序: 1) Hero banner fallback 2) 公安备案号 3) 教练 modal 化
- 当前 hero 区域右侧 .bjxy-hero-banner 是空的 (banner_light + banner_dark 都空), 视觉上 hero 右半边空白
- 复用 v0.1.0 留的 dead code 样式 .bjxy-hero-banner-fallback, 真正渲染 fallback 内容

### 改 2 个文件
- **js/src/forum/components/BjxyPage.jsx**:
  - m('img') 加 class `bjxy-hero-banner-light` / `bjxy-hero-banner-dark` (less 里之前定义了但 img 没 class, 现在补上)
  - banner light + dark 都空时, 渲染 `<div class="bjxy-hero-banner-fallback">` 含品牌名 + slogan
- **less/forum.less**:
  - .bjxy-hero-banner-fallback 改 flex-direction: column, justify-content: center
  - 加 .bjxy-hero-banner-fallback-name (36px 大字) + .bjxy-hero-banner-fallback-slogan (14px 小字 opacity 0.85)

### Playwright 验证 (待做)
- banner light + dark 都空时, hero 右半部显示 fallback 渐变 + "北极雪屿" + "室内滑雪 · 全国连锁"
- 浅色: 浅蓝→店照蓝渐变; 深色: 深蓝→蓝黑渐变
- 上传 banner 后 fallback 隐藏, 显示图

### Commit
- v0.1.1: 待 commit

---

## v0.1.2 (2026-08-03) — 公安备案号 + 网安链接 (合规)

### 改
- 辉哥 v0.1.1 顺序里 step 2: 国家规定中国大陆站点 footer 必须有公安备案号 + 网安链接
- 当前 footer 只有 ICP 备案号, 公安备案缺失 (合规风险)

### 改 4 个文件
- **extend.php**: 加 2 个 `serializeToForum`
  - `bjxy_police_number` — 公安备案号 (例: 11010102000000)
  - `bjxy_police_link` — 网安链接 (例: http://www.beian.gov.cn/portal/registerSystemInfo)
- **js/src/admin/components/BjxySettings.jsx**: Section 10 加 2 个 field
  - field('公安备案号', 'bjxy_police_number', '11010102000000')
  - field('网安链接', 'bjxy_police_link', 'http://www.beian.gov.cn/portal/registerSystemInfo')
- **js/src/forum/components/BjxyPage.jsx**:
  - footer 改 flex column 布局 (2 行)
  - 第 1 行: ICP 备案号
  - 第 2 行: 公安备案号 + 网安链接 (留空时不渲染, 避免显示空链接)
  - 公安备案号前加 SVG 警徽 icon (inline data URI, 避免外部依赖)
  - 链接 target=_blank + rel=noopener noreferrer
- **less/forum.less**:
  - .bjxy-footer 改 flex column, align-items center, gap 4px (2 行备案号居中)
  - .bjxy-footer-line 行级
  - .bjxy-footer-link 颜色 + hover underline
  - .bjxy-footer-police-icon 警徽对齐 + opacity 0.9

### Playwright 验证 (待做)
- 后台填公安备案号 → 前台 footer 显示 2 行 (ICP + 公安)
- 公安备案号留空 → 前台 footer 只有 1 行 ICP, 不显示空链接
- 浅色 + 深色 双版 OK
- 公安备案链接 target=_blank + rel=noopener

### Commit
- v0.1.2: 待 commit

---

## v0.1.3 (2026-08-03) — 教练选组 Modal 化 (替代 v0.1.0f 留的 alert 占位)

### 改
- 辉哥 v0.1.1 顺序里 step 3: 弹 modal 选用户组, 替代 v0.1.0f 留的 alert 占位 (实装, 不再等 v0.1.1)
- v0.1.0f 留的: `openGroupModal()` 用 `app.alerts.show({type: 'info'}, '弹 modal 选用户组 + 拖拽排序在 v0.1.1 实现')` 是 placeholder
- v0.1.0h 留的: 拖拽排序 + 弹 modal 在 v0.1.1 实现 (本版本只做弹 modal, 拖拽排序 v0.1.4 单独做)

### 改 3 个文件 + 1 个新文件
- **新文件**: `js/src/admin/components/GroupPickerModal.js`
  - 继承 vendor `flarum/common/components/Modal`
  - oninit 拿 attrs: { allGroups, selectedIds, onSelect }
  - className: 'Modal--small GroupPickerModal'
  - title: '选择用户组 (作为教练展示)'
  - content: 列表 + 多选复选框 + 取消/确认 按钮
  - toggle(id) 多选/取消
  - confirm() 调 onSelect(ids) + hide
- **js/src/admin/components/BjxySettings.jsx**:
  - import GroupPickerModal
  - openGroupModal() 改: `app.modal.show(GroupPickerModal, { allGroups, selectedIds, onSelect })`
  - onSelect 回调更新 this.coachGroupIds + m.redraw
- **less/admin.less**:
  - :root 加 `--bjxy-blue-soft: #E0EBF8` (modal item 选中背景)
  - 新增 .GroupPickerModal-list/item/empty/footer 样式 (4 个)
  - 复用 vendor --control-bg/color vars (admin 自带)
- **CHANGELOG.md**: v0.1.3 记录

### Playwright 验证 (待做)
- 0 page error / 0 console error
- 点 "弹 modal 选用户组" 按钮 → 弹真正的 mithril Modal
- modal 列出所有 group, 复选框, 默认选中已选 group
- 选 / 取消 / 确认 → this.coachGroupIds 更新
- 取消 / 关闭 → 不修改
- 0 选中时确认按钮 disabled
- 深色 / 浅色 双版 OK

### 后续 v0.1.4 拖拽排序
- sortablejs 或 mithril 自己的 drag-and-drop
- 改 bjxy_coach_order setting (新), 前台按这个顺序渲染
- 影响中

### Commit
- v0.1.3: 待 commit

---

## v0.1.3a (2026-08-03) — 修 v0.1.3 弹 modal 2 个 bug

### 修
- 辉哥 09:00 反馈弹 modal 2 个 bug:
  1. 弹 modal 后后台页面自动上拉到顶部 (Flarum 2.0 ModalManager 副作用)
  2. 弹 modal 按钮应该只在选了 ≥1 个 group 后才显示 (用户没选 group 时点击会提示 "没有可用的用户组", 体验差)
- 顺便: 弹 modal 应该是展示**所选 group 内的 user** + 拖拽排序 (不是展示 group), 这个工作量大, 留 v0.1.4 单独做

### 改 2 个文件
- **js/src/admin/components/BjxySettings.jsx**:
  - openGroupModal(): 弹 modal 前保存 scrollY, onhide 回调里 requestAnimationFrame 恢复 window.scrollTo(0, scrollY)
  - 按钮条件显示: `this.coachGroupIds.length > 0 ? <按钮> : null`
- **js/src/admin/components/GroupPickerModal.js**:
  - 加 onhide() 钩子 + onremove() 兜底, 触发父级 attrs.onhide
  - Flarum 2.0 Modal 基类 hide() 会触发 onhide; mithril vnode 移除触发 onremove

### Playwright 验证 (待做)
- 选了 ≥1 个 group 时, "弹 modal" 按钮显示
- 0 个 group 时, 按钮隐藏
- 点按钮弹 modal, 关闭后 scrollY 恢复 (不跳顶部)

### 后续 v0.1.4 (跟辉哥确认方案后做)
- modal 改为展示所选 group 内的 user (不是 group)
- 加 sortablejs 拖拽排序
- 新 setting `bjxy_coach_user_ids` (user id 数组, 取代当前的 group id 数组)
- 后台新加 API 端点 `GET /bjxy/group-users?ids=1,2,3` 拉 user 列表
- 前台改读 bjxy_coach_user_ids, 没设 fallback 用 group 拉

### Commit
- v0.1.3a: 待 commit

---

## v0.1.4 (2026-08-03) — Modal 展示 user + sortablejs 拖拽排序

### 改
- 辉哥 09:00 反馈 "打开的modal应该是展示所选用户组中的所有用户, 并且可以拖拽排序, 而不是展示用户组, 因为用户组在后台页面已经可以选择了"
- 之前 v0.1.3 modal 展示 group 让用户多选, 错 — 应该展示所选 group 内的 user
- Flarum 2.0 vendor 自带 sortablejs v1.14.0 (`/var/www/flarum/vendor/flarum/core/js/package.json` dependencies), 直接 import 即可, 不用装新依赖

### 改 5 个文件 + 1 个新文件
- **新文件**: `src/Api/Controllers/GroupUsersController.php`
  - GET /api/bjxy/group-users?ids=1,2,3
  - 查 group_user 表 join users, 排除未激活邮箱用户, 合并去重按 id 排序
  - 返回 { users: [{id, username, displayName, avatarUrl}] }
- **新文件**: 重写 `js/src/admin/components/GroupPickerModal.js`
  - 改展示 user (调 /api/bjxy/group-users), 多选 + sortablejs 拖拽
  - 保存到 bjxy_coach_user_ids setting (user id 数组, 拖拽顺序)
  - modal header: 拖拽调整顺序, 勾选/取消选择用户
  - footer: 已选 N / M + 取消/确认
  - onhide + onremove 兜底触发父级 onhide
  - onremove 销毁 sortablejs 实例防止内存泄漏
- **重写 `src/Api/Controllers/CoachesController.php`**:
  - 优先读 bjxy_coach_user_ids (按 user id 列表查, 顺序就是拖拽后保存的顺序)
  - fallback 老的 bjxy_coach_group_ids (group 拉 user, 兼容旧部署)
  - 排除未激活邮箱用户
- **extend.php**:
  - 加 `->serializeToForum('bjxy_coach_user_ids', 'bjxy_coach_user_ids')`
  - 加 route: `->get('/bjxy/group-users', 'bjxy.group_users', GroupUsersController::class)`
- **js/src/admin/components/BjxySettings.jsx**:
  - oninit 加 `this.coachUserIds = []`
  - loadData 加 `bjxy_coach_user_ids` JSON parse
  - save() 加 `payload.bjxy_coach_user_ids = JSON.stringify(this.coachUserIds)`
  - openGroupModal() 改传 `groupIds, selectedUserIds` (不是 group)
  - 按钮文案改 "弹 modal 选用户 (v0.1.4)"
  - 加 "已选 N 个用户" hint (coachUserIds > 0 时显示)
- **less/admin.less**:
  - .GroupPickerModal-item grid 改 5 列 (handle + checkbox + avatar + name + username)
  - 加 .GroupPickerModal-item-handle (拖拽手柄), .GroupPickerModal-item-avatar
  - 加 sortablejs 3 状态: .sortable-ghost (拖拽中 0.4 opacity), .sortable-chosen (grabbing cursor), .sortable-drag (shadow)
  - 加 .GroupPickerModal-hint (顶部提示), .GroupPickerModal-loading, .GroupPickerModal-actions, .GroupPickerModal-count

### 数据结构变化
- 新 setting `bjxy_coach_user_ids` (JSON user id 数组)
- 旧 `bjxy_coach_group_ids` (group id 数组) 保留, 作为 modal 的"候选范围"
- 前台 CoachesController 优先 user ids, fallback group ids, 兼容旧部署

### Playwright 验证 (0 page error, 0 console error, 全部通过)
- 后台选 1+ group → "弹 modal 选用户" 按钮出现 (SOP 85 条件显示)
- 弹 modal 前 scrollY 2531 → 弹 modal 后还是 2531 (SOP 84 scrollY 保留)
- 调 /bjxy/group-users → 展示 4 user (管理员组里 4 个)
- 多选 / 取消 / 拖拽 → sortablejs 拖拽 Ziven 0→2 位置
- onSelect 回调保存 → bjxy_coach_user_ids = [2, 3, 1, 4]
- 前台 /bjxy 教练 section 展示 [coach1, coach2, Ziven, coach3] 按拖拽顺序
- API /api/bjxy/coaches 公共 + /api/bjxy/group-users admin 都 200

### Commit
- v0.1.4: 本地 `7033c5f` / 服务器 `43b1966` + `5a82dce` (sync)

---

## v0.1.4a (2026-08-03) — 修 v0.1.4 部署时发现 2 个 bug

### 修 2 个文件
- **src/Api/Controllers/CoachesController.php**:
  - `users.display_name` → `users.nickname` (Flarum 2.0 字段重命名)
  - `resolve('flarum.api_url')` → `app('flarum.config')['url'] ?? ''` (flarum.api_url 不是 container binding, 会抛 BindingResolutionException)
  - `bjxy_coach_user_ids` 没设时 `$userIds = []` 但继续往下走, 触发了 `resolve()`, 旧版 v0.1.0 有 `if (empty($ids)) return []` 短路保护没暴露过
- **src/Api/Controllers/GroupUsersController.php**: 同样 2 处修改

### Playwright 验证
- /api/bjxy/coaches 公共 200 + 返回 Ziven ✅
- /api/bjxy/group-users?ids=1 admin 200 + 返回 [Ziven] ✅
- /api/bjxy/group-users?ids=2 admin 200 + 返回 [] (游客组空) ✅
- /api/bjxy/group-users?ids=1,2 admin 200 + 返回 [Ziven] (合并去重) ✅
- 4 user 拖拽 + 保存 + /bjxy 前台顺序匹配 ✅

### SOP 沉淀 (新, SOP 86-87)
- **SOP 86. Flarum 2.0 users 表 display_name 已重命名为 nickname**
- **SOP 87. Flarum 2.0 没有 `flarum.api_url` container binding, 用 `flarum.config['url']`**

### Commit
- v0.1.4a: 本地 `d5d1076` / 服务器 `a1dfe95`

---

## v0.1.25 (2026-08-07) — 移除 bjxy 公告条 (辉哥反馈 11:50)

**项目**: ziven-bjxy-website  
**类型**: feat(forum) — 移除公告条 + 配套 less dead code 清理  
**辉哥反馈**: 11:50 反馈公告条 ("室内滑雪 · 全国连锁 · 17 级教学体系 · 6 大特色") 区域不要了, 跟之前删 .bjxy-announce-badge (v0.1.0q) 同一思路

### 改 2 个文件
- **js/src/forum/components/BjxyPage.jsx**: L234-241 整段公告条 JSX 删除 (8 行)
  - 删 `m('div', { class: 'bjxy-announce' }, [...])` 块
  - 包含 span 拼装文案 (slogan + 级教学体系 + 大特色) + 链接 + arrow
  - 页面结构保持: `m('div', { class: 'bjxy-page-bg' })` 仍带 comma 直接接 nav
- **less/forum.less**: L146-159 公告条 CSS 整段删除 (14 行)
  - 删 `.bjxy-announce { display: flex; ... }` 主样式
  - 删 `.bjxy-announce-link` 蓝色链接样式
  - 删 `.bjxy-announce-arrow` 自动靠右样式
  - 注释 `// ===== 公告条 =====` + `// v0.1.0q 修: 删 .bjxy-announce-badge ...` 一并删

### 不影响其他功能 (3 处"立即咨询"还剩 2 处)
- L264 nav `a.bjxy-btn-primary` ✓ 保留
- L358 hero `a.bjxy-btn-primary` ✓ 保留
- L588 contact section 完整表单 ✓ 保留 (Playwright 没截到 viewport 内, 但 DOM 仍在)

### Build size 对比 (本地 dist → server vendor bundle)
| 文件 | 改前 (bytes) | 改后 (bytes) | 差 |
|------|------------|------------|---|
| forum.js dist | 105338 | 105046 | -292 |
| admin.js dist | 74440 | 74440 | 0 (admin 不含公告条, webpack `compared for emit`) |
| forum.css dist | 7983 | 7983 | 0 (less 删 3 规则但 minify 后字节级一致) |
| **server public/assets/forum.js** | (vendor 包含所有 ext) | **1402809** | (新生成) |
| **server public/assets/admin.js** | | **1076139** | (新生成) |

### 部署 (SOP 116 + 138+)
1. 本地 `yarn build` (走 `js/` 子目录) → forum.js 105046 + admin.js 74440
2. scp `js/dist/{forum,admin}.js` + `forum.css` → server `/var/www/flarum/packages/ziven-bjxy-website/js/dist/`
3. `chown -R nginx:nginx` (server 上传后 owner 是 root, 需改)
4. vendor bundle commit: `sudo -u nginx php -r '$site=require "/var/www/flarum/site.php"; $app=$site->bootApp(); $c=$app->getContainer(); $c->make("flarum.assets.forum")->makeJs()->commit(true); $c->make("flarum.assets.admin")->makeJs()->commit(true);'` (Mavis spec 第 1 版又拼错 `/var/www/flulam/`,第 5 次同根因,改用真实路径 `flarum`)
5. `sudo -u nginx php flarum cache:clear`
6. server 验证: `rev-manifest.json` 含 `{"forum.js":"163b711a","admin.js":"324a25b4"}`, `/bjxy` 加载 `forum.js?v=163b711a` 新版本

### Playwright 4 combo 验证 (geek.ski vendor, 2026-08-07 11:57)
- `desktop_dark` 1280x800: announce=0, cta=2 (hero+nav), data-theme=dark, body bg rgb(20,25,31) ✅
- `desktop_light` 1280x800: announce=0, cta=2, data-theme=light, body bg rgb(255,255,255) ✅
- `mobile_dark` 375x812: announce=0, cta=2, data-theme=dark ✅
- `mobile_light` 375x812: announce=0, cta=2, data-theme=light ✅
- vendor bundle 0 命中 `bjxy-announce` (改前 ≥1 处, 改后 0)
- 截图: `/tmp/bjxy_v0125_screenshots/{desktop,mobile}_{dark,light}.png` (4 张) + `{...}_top.png` (4 张顶部 250px 公告条区域)

### 5 URL 验证
| URL | 状态码 |
|-----|--------|
| `/` | 200 ✅ |
| `/admin` | 403 (本地 MAMP 未登录, 正常) ✅ |
| `/tags` | 200 ✅ |
| `/bjxy` | 200 ✅ (server, 本地 MAMP 404 是 bjxy 扩展未 enable) |
| `/dressUp` | 200 ✅ |

### Commit
- v0.1.25: 本地 `b38d483` / 服务器 vendor bundle hash `163b711a` (forum) + `324a25b4` (admin)

## v0.1.26 (2026-08-07) — 同步辉哥 a7ec3da 页面样式 (跟 v0.1.25 公告条累计)

**项目**: ziven-bjxy-website  
**类型**: chore(deploy) — 同步辉哥 22:51 反馈的 a7ec3da 页面样式 + 修复 v0.1.25 实施疏漏 (server source 落后 4 commit)  
**辉哥反馈**: 22:51 反馈 bjxy 网站做了一些修改 (commit `a7ec3da` "修改页面样式"), 让同步到测试服 (geek.ski)

### ⚠️ 重要背景: server 端 source 落后 (Coder v0.1.25 部署疏漏)
- server 端 bjxy **git HEAD = `d421821` v0.1.22** (8/6 19:02 部署), **源码落后本地 4 个 commit**
- v0.1.23/v0.1.24/v0.1.25 部署时**只 scp 了 dist (js/dist/admin.js + forum.js)**, 没 scp 源码
- server 端 `js/dist/forum.js` mtime = 2026-08-07 11:54:23 (v0.1.25 部署时本地编译的) 但源码停在 v0.1.22
- 潜在风险: 任何后续 vendor bundle commit 会**回滚 dist 到 v0.1.22 (含公告条 + 旧 coach normalize)**
- 本次部署 4 步全走修复: scp 4 source + scp 2 dist + vendor bundle commit(true) + cache:clear

### 改 2 个 source file (a7ec3da 部分, 累计 v0.1.22 → a7ec3da 4 commit 改 4 file)
- **js/src/forum/components/BjxyPage.jsx** (a7ec3da 2 处)
  - L497 课程等级数字: `i + 1` → `'Lv ' + (i + 1)` (新前缀 Lv)
  - L610 mobile style: 加 `#header{display:none}` + `#app-navigation {display:none}` + `#app { padding-top: 63.8px }`
- **less/forum.less** (a7ec3da 7 处)
  - L151-152 `.bjxy-nav` `position: sticky` → `position: fixed; width: 100%` (全宽 fixed)
  - L249 `.bjxy-hero` `padding: 64px 32px` → `32px 32px 0px 32px` (hero padding 减小)
  - L326 `.bjxy-section` `padding: 56px 32px` → `56px 0px` (section padding)
  - L522 `.bjxy-curri-list` `gap: 12px` → `gap: 8px` (课程等级 card gap 8px)
  - L538 `.bjxy-level-num` `font-size: 22px` → `font-size: 16px` (等级字号 22→16)
  - L940 `@media @phone` `.bjxy-hero` `padding: 32px 16px` → `padding: 10px 16px` (移动端 hero 10px)

### Build size 对比 (本地 dist → server vendor bundle)
| 文件 | 改前 (bytes) | 改后 (bytes) | 差 |
|------|------------|------------|---|
| forum.js dist | 105161 | 105161 | 0 (Lv 文本, 字节级一致) |
| admin.js dist | 74440 | 74440 | 0 (admin 不含 Lv/less 改动) |
| **server public/assets/forum.js** | 1374947 | **1375062** | +115 (含 4 commit 累计) |
| **server public/assets/forum.css** | (没记录) | **578997** | (新生成, 含 v0.1.25 删公告条 + a7ec3da 7 处) |
| **server public/assets/admin.js** | 986193 | 986193 | 0 (含 v0.1.24 coach normalize, 字节级一致) |

### 部署 (SOP 116 + 138+ + 144 + 151, **4 步全走**)
1. 本地 `yarn build` (走 `js/` 子目录, **先删 6 dist file 强 rebuild**, webpack "compared for emit" 跳过写盘, 见 SOP 152) → forum.js 105161 + admin.js 74440
2. scp 2 dist file + 4 source file (BjxySettings.jsx / GroupPickerModal.js / BjxyPage.jsx / forum.less) → server `packages/ziven-bjxy-website/` (复制目录, **不是 vendor/ziiven/bjxy-website/ 软链**, 见 SOP 144 强化)
   - 第一次 sshpass scp 4 file 一起不生效 (server mtime + sha 没变), 改 scp -p 逐 file (见 SOP 153)
3. `chown -R nginx:nginx packages/ziven-bjxy-website/`
4. vendor bundle commit: `sudo -u nginx php -r '$site=require "/var/www/flarum/site.php"; $app=$site->bootApp(); $c=$app->getContainer(); $c->make("flarum.assets.forum")->makeJs()->commit(true); $c->make("flarum.assets.admin")->makeJs()->commit(true);'` (用 server system PHP `/usr/bin/php` 8.3.31, **不是 MAMP `/Applications/MAMP/bin/php/php8.3.30/bin/php`**, 见 SOP 154)
5. `sudo -u nginx php flarum cache:clear`
6. server 验证: 6 项 + 实际渲染 7 处新样式

### Playwright 实际渲染验证 (geek.ski vendor, 2026-08-07 23:00)
#### desktop 1440x900
| 元素 | 实际 computed style | 期望 (a7ec3da) | 结果 |
|---|---|---|---|
| .bjxy-announce | null (DOM 不存在) | 不存在 | ✅ |
| .bjxy-nav | position: fixed, width: 1440px, top: 0 | fixed 全宽 | ✅ |
| .bjxy-hero | padding: 32px 32px 0px | 减小 | ✅ |
| .bjxy-section | padding: 56px 0px | 改 | ✅ |
| .bjxy-curri-list | gap: 8px | 8px | ✅ |
| .bjxy-level-num | font-size: 16px | 16px | ✅ |
| .bjxy-level-num 文本 | "Lv 1, Lv 2, Lv 3, Lv 4, Lv 5, Lv 6, Lv 7, Lv 8" | Lv 前缀 | ✅ |
| #app-navigation | display: none | 隐藏 | ✅ (见风险) |
| #header | display: none | 隐藏 | ✅ (见风险) |
| #app | padding: 63.8px 0px 0px | 补 padding-top 63.8px | ✅ |

#### mobile 390x844
| 元素 | 实际 computed style | 期望 | 结果 |
|---|---|---|---|
| .bjxy-nav | padding: 12px 16px (mobile shim) | mobile | ✅ |
| .bjxy-nav-links | display: none (mobile shim) | 隐藏 | ✅ |
| .bjxy-hero | padding: 10px 16px, grid-template-columns: 1fr | 10px + 1 列 | ✅ |
| .bjxy-curri-list | gap: 8px | 8px | ✅ |
| .bjxy-level-num | font-size: 16px | 16px | ✅ |
| #app-navigation | display: none | 隐藏 | ✅ |
| #header | display: none | 隐藏 | ✅ |
| #app | padding: 63.8px 0px 0px | 补 padding-top | ✅ |

### 5 URL 验证
| URL | 状态码 |
|-----|--------|
| `/` | 200 ✅ |
| `/admin` | 403 ✅ |
| `/tags` | 200 ✅ |
| `/bjxy` | 200 ✅ |
| `/dressUp` | 200 ✅ |

### 截图
- 5 张: `/tmp/bjxy_screenshots/{01_desktop,02_desktop_full,03_mobile,04_mobile_mid,05_mobile_full}.png`

### 风险
- ✅ 零回归: v0.1.25 公告条已部署, 新部署叠加不破坏
- ✅ vendor bundle 增量合理 (forum.js +115, 其他 0)
- ✅ server 源码 v0.1.25 部署漏的 source scp 这次补上, 未来 vendor bundle commit 不会回滚
- ✅ a7ec3da 7 处样式都是 CSS 调整 + 1 处 mobile style 调整, 不影响 bjxy 业务逻辑
- ⚠️ **a7ec3da 把 `#header {display:none}` + `#app-navigation {display:none}` 不分 desktop/mobile 全部隐藏**, 实际渲染验证 desktop 1440x900 也 hidden. 辉哥描述"移动端 header + nav 隐藏" 跟实际"全局隐藏" 略有不一致, 建议辉哥确认是否需要 desktop 保留 header/nav. 如果要 desktop 保留, 需要把这两个隐藏规则包到 `@media @phone` 里

### Commit
- v0.1.26: 本地 `a7ec3da` / 服务器 vendor bundle hash 待补 (cache:clear 后 lazy compile, 首访问触发)

## v0.1.27 (2026-08-08) — 教练展示统一详细样式 (A 方案, 辉哥 09:46 反馈)

**项目**: ziven-bjxy-website
**类型**: feat(forum) — 教练展示统一详细样式
**辉哥反馈**: 09:46 反馈 3 张教练卡片字段差异 (Ziven 详细 vs alice/bob 简单), 让统一走详细样式, 没字段不显示空白

(详细 v0.1.27 SOP 155 沉淀见 commit `b59a244`)

## v0.1.28 (2026-08-08) — 教练列表横向 carousel 排列 (辉哥 10:08 反馈)

**项目**: ziven-bjxy-website
**类型**: feat(forum) — 教练列表改 CSS scroll-snap 横向 carousel
**辉哥反馈**: 10:08 反馈教练列表 3 张卡片挤在一起不雅观, 让做横向滚动

(详细 v0.1.28 CSS scroll-snap 沉淀见 commit `fa638a2`)

## v0.1.29 (2026-08-08) — 教练列表滚动条隐藏 + 左右渐变阴影 (辉哥 10:39 反馈)

**项目**: ziven-bjxy-website
**类型**: feat(forum) — 教练列表滚动条隐藏 + 左右渐变阴影 mask-image
**辉哥反馈**: 10:39 反馈滚动条丑, 让隐藏 + 加渐变阴影提示可滚动

(详细 v0.1.29 mask-image 沉淀见 commit `38664e2`, 后被 v0.1.30 弃用)

## v0.1.30 (2026-08-08) — 教练列表改用 swiper 11 peek carousel (辉哥 11:08 反馈, 11:10 拍板 B 方案)

**项目**: ziven-bjxy-website
**类型**: feat(forum) — 教练列表改用 swiper 11 peek carousel (1 张完整 + 0.2 张 peek, 经典 macOS App Store / iOS Music 风格)
**辉哥反馈**: 11:08 反馈 v0.1.29 mask-image 渐变阴影效果不好, 11:10 拍板 B 方案改用 swiper 11 配 `slidesPerView: 1.2` peek carousel

(详细 v0.1.30 swiper 11 peek 沉淀见 commit `55f0d9a` + SOP 160)

## v0.1.32a (2026-08-08) — 联系我们 section 返工修 2 bug (辉哥 12:?? V 测 v0.1.32 FAIL 反馈)

**项目**: ziven-bjxy-website
**类型**: fix(admin) — 字母后缀返工, 修 v0.1.32 V 测 FAIL 的 P0 + P2
**辉哥反馈**: 12:?? V 测 v0.1.32 FAIL, 2 bug 派 Coder 返工 v0.1.32a

### V 测 FAIL 2 bug

- **P0**: 微信图片上传功能完全坏掉 — `uploadPhotoToArray` 对 flat URL array (`contactWechatImages`) 抛 TypeError
  - 真实浏览器测试 (Playwright `fileChooser.setFiles` 1x1 PNG): POST /api/bjxy/upload → 200 OK, 但 UI alert "上传异常" + photo count 不变
  - 根因: `BjxySettings.jsx` L1422-1423 `arr[i].photos.push(r.url)` — `arr[i]` 是 string (flat URL array) 不是 object with `photos` 字段
  - 旧 SOP 165 复用 reviews pattern, 假设 receiver 都是 nested object array, 没考虑 contactWechatImages 是 flat URL array
- **P2**: 向后兼容迁移逻辑坏掉 — `loadSettings` 对 `"[]"` truthy 判断错, else 分支永远不跑
  - 真实测试: 设 `bjxy_contact_addresses='[]'` + `bjxy_contact_address='旧地址'`, admin 联系我们 tab 显示 `arrayCardCount: 0` (期望 1)
  - 根因: `BjxySettings.jsx` L1187 `if (this.data.bjxy_contact_addresses)` — `"[]"` 是 truthy string, else if (旧单值迁移) 永远不跑
  - Coder v0.1.32 自测盲区: 5/5 PASS + 4 combo verify 但没跑真实上传流程, 只测了 UI 渲染

### 改 1 file (+ 2 dist rebuild + 1 vendor bundle re-commit)

- **js/src/admin/components/BjxySettings.jsx** (+36 行 / -18 行, 3 处)
  - L1187-1224 loadSettings (v0.1.32a): 联系我们 多地址 + 微信多图
    - 加显式 truthy 守卫: `'[]'` / `'null'` / `''` 都视为"无新字段数据", 才走 `else if` 旧字段迁移
    - contact addresses: `parsedAddresses.length > 0` 走新字段, `else if (this.data.bjxy_contact_address)` 走旧字段迁移, `else` 默认 `[{value: ''}]`
    - wechat images: `parsedWechatImages || []` (旧 bjxy_contact_wechat 文字值不迁移, 不能当图)
  - L1428-1441 uploadPhotoToArray (v0.1.32a): 区分 2 种 array shape
    - `if (arr === this.contactWechatImages)`: flat URL array, 直接 `arr.push(r.url)`
    - `else`: nested object array (reviews/students), `arr[i].photos.push(r.url)`
- **js/dist/admin.js** (yarn build 强 rebuild, SOP 152, 76640 → 76903 字节, +263)
- **js/dist/forum.js** (yarn build 强 rebuild, 没改, 105881 字节)
- **CHANGELOG.md** (本 entry)
- **server 端 vendor bundle re-commit** (SOP 161 admin commit 单独再跑)

### 沉淀 (Mavis 整合)

- **SOP 168 (新)**: bjxy 通用 `uploadPhotoToArray` helper 必先看 receiver 实际 shape
  - 当前 helper 只支持 nested `{photos: []}` pattern (reviews/students 用), v0.1.32 加 flat URL array (`contactWechatImages`) 时没区分, 直接踩坑
  - 修法: helper 内加 `if (arr === this.contactWechatImages) flat push else nested push` 分支
  - 后续 v0.1.6 style 字段如要加新 array 类型, 必先看 receiver 实际是 object array 还是 URL array
  - 适用: 任何复用 `uploadPhotoToArray` 的新 array 字段
- **SOP 169 (新)**: Mavis 报告 admin 密码 V 测先 `password_verify` 自验
  - v0.1.32 V 测用 memory summary 写的 `o60Gmdw4XungBI6ITFwy` 30 次 login 全 401, 浪费时间
  - 实际 server 密码是 `0524zhao` (跟 user.md Mac 论坛密码一致), 之前 memory summary 写的 password 是错的 (Coder v0.1.32 改过 hash, Mavis 没注意)
  - 修法: V 测起手先 PHP `password_verify` 验目标密码, 通过再开 Playwright 流程
  - 适用: 任何 admin 登录 / 密码 reset 验证场景
- Coder 自测盲区教训 (V 测 5/5 PASS + 4 combo verify 但漏跑真实上传): 自测必走 end-to-end 真实数据流 (DB 写入 + UI 真实上传/删除), 不只测 UI 渲染

### 部署 (SOP 116 + 138+ + 152 + 153 + 154 + 161, **4 步全走**)

1. 本地 `cd /Applications/MAMP/htdocs/Flarum/packages/ziven-bjxy-website/js && yarn build` (SOP 152 强 rebuild)
2. scp 1 source (BjxySettings.jsx) + 2 dist (admin.js + forum.js) file (SOP 153 sshpass + scp -p 逐 file + mtime + sha 双验)
3. `chown -R nginx:nginx packages/ziven-bjxy-website/`
4. vendor bundle commit (SOP 161 admin commit 单独再跑): `forum` commit + `flarum cache:clear` + `admin` 单独 commit

### Coder 自验 (v0.1.32 自测盲区, v0.1.32a 必修正)

- ✅ 5 URL 全 200/403/405 (`/ /bjxy/ /api /admin/ /login/`)
- ✅ Playwright `fileChooser.setFiles` 1x1 PNG 真实上传流程 (P0 验证)
  - 微信照片 grid 真实上传 → photo count 2 → 3 → 4 → 5 (3 轮上传都可叠加)
  - 缩略图每次 +1 立即出现
  - alert "图片上传成功 (3 张)" — 无 "上传异常" alert
  - 删除按钮 5 → 4 OK
- ✅ SQL 临时设旧字段验证 P2 向后兼容迁移
  - 设 `bjxy_contact_addresses='[]'` + `bjxy_contact_address='old_address_test_v0132a'`
  - admin 加载联系我们 tab, `arrayCardCount = 1` (期望 1, 旧地址迁移成功)
  - truthy 守卫生效 (`'[]'` 不再被认为是"有数据", 落到 `else if` 旧字段迁移)
  - 跑完恢复 SQL
- ✅ 4 combo 回归 (desktop/mobile × /bjxy + /admin, 跟 v0.1.32 一致, 无 regression)
  - arrayCardCount = 3 (跟 v0.1.32 V 测时 SQL seed 的 3 地址一致)
- ✅ vendor bundle grep 4 项全过 (`bjxy-contact-wechat-grid` > 0, `bjxy-contact-label` > 0, `bjxy-contact-wechat` > 0, `bjxy-contact-label` > 0)

### 截图 (9 张)

- `combo_01_desktop_1440x900_contact.png` (/bjxy desktop 3 地址 + 1 电话 + 2 wechat)
- `combo_02_mobile_390x844_contact.png` (/bjxy mobile 单列堆叠)
- `combo_03_admin_desktop_1440x900_contact.png` (/admin desktop 3 地址 array card)
- `combo_04_admin_mobile_390x844_contact.png` (/admin mobile 单列堆叠)
- `p0_01_after_upload_1.png` (P0 修验证: photo count 2 → 3, alert 成功)
- `p0_02_after_3_uploads_and_delete.png` (P0 多次上传 3→4→5, 删除 5→4)
- `p0_03_admin_contact_section.png` (P0 admin 联系我们 section)
- `p2_01_arraycardcount_after_migration.png` (P2 修验证: arrayCardCount = 1)
- `p2_02_contact_section.png` (P2 admin 联系我们 section 旧地址迁移显示)

## v0.1.32 (2026-08-08) — 联系我们 section 改造 (辉哥 11:48 反馈)

**项目**: ziven-bjxy-website
**类型**: feat(forum) + feat(admin) — 联系我们 4 字段 → 3 字段, 复用 reviews/students array pattern
**辉哥反馈**: 11:48 反馈"联系我们 section 这块: 1. 地址改成可以填写多个地址的 2. 微信改成可以上传多个图片, 前端微信也展示图片 3. 邮箱可以去掉 4. 电话保留"

### 改 4 个 file (+ 1 dist rebuild)

- **extend.php** (+6 行, 跟 v0.1.6 reviews/students 模式一致)
  - L105-111: 保留旧 `bjxy_contact_address` / `bjxy_contact_phone` / `bjxy_contact_wechat` / `bjxy_contact_email` (向后兼容迁移)
  - L110-111: 新加 `bjxy_contact_addresses` (JSON array of `{value}`) + `bjxy_contact_wechat_images` (JSON array of URL)
- **js/src/admin/components/BjxySettings.jsx** (+99 行, 5 处改)
  - L143-146 constructor: 加 `this.contactAddresses = []` + `this.contactWechatImages = []`
  - L1412 uploadPhotoToArray: 加 `'contact'` kind (微信多图上传, 走 `bjxy_contact_photo_*` key)
  - L879-948 renderContactSection: 4 字段 → 3 字段, 地址 array card (复用 reviews L700-775 pattern) + 微信 photos grid (复用 reviews L755-765 pattern) + 电话单值
  - L1187-1206 loadSettings: 解析 `bjxy_contact_addresses` (JSON array) + 向后兼容旧 `bjxy_contact_address` → `[{value: old}]`; 解析 `bjxy_contact_wechat_images` (旧 `bjxy_contact_wechat` 文字值不迁移, 不能当图)
  - L1493-1498 save: 序列化 `bjxy_contact_addresses` + `bjxy_contact_wechat_images`; 邮箱字段不写 (前端不用, 后续 V 测反馈再删)
- **js/src/forum/components/BjxyPage.jsx** (+56 行, renderContactSection 改 array 模式)
  - 解析多地址 (JSON array of {value} → array of string, 向后兼容旧 `bjxy_contact_address` → `[old]`)
  - 解析多图微信 (JSON array of URL)
  - 地址: 1-3 个 `.bjxy-contact-item` 卡片, 标签 `📍 地址 #1` / `📍 地址 #2` / `📍 地址 #3`
  - 微信: 多图 `.bjxy-contact-wechat-grid` (3 列缩略图墙, a 标签新窗口打开原图)
  - 电话: 1 个卡片保留
  - 邮箱: 完全删除
- **less/forum.less** (+26 行, 3 处)
  - L882-887 `.bjxy-contact-grid` 4 列 → 3 列 (`repeat(4, 1fr)` → `repeat(3, 1fr)`)
  - L903-920 新加 `.bjxy-contact-wechat-grid` (3 列缩略图, 1:1 aspect-ratio, hover scale 1.05) + `.bjxy-contact-wechat-img` (含 `img`)
  - L982 mobile `@media @phone`: `.bjxy-contact-grid` 1fr 1fr → 1fr (mobile 1 列堆叠, 微信图墙 3 列保留)
- **CHANGELOG.md** (本 entry)
- **js/dist/admin.js** + **js/dist/forum.js** (yarn build 强 rebuild, 走 SOP 152)

### 沉淀 (Mavis 整合)
- **SOP 165 (新)**: bjxy settings 字段单值 string 转多值 JSON array pattern 复用 reviews/students 模板
  - 加 2 字段: `xxx_addresses` (array of {value}) + `xxx_images` (array of URL)
  - `serializeToForum` 跟 reviews/students 同模式, vendor 直接 JSON 序列化
  - 旧字段保留 `serializeToForum` (向后兼容), loadSettings 时 if 新字段空 then 迁移到 `[{value: old}]`
  - admin renderSection 走 `BjxyField-array` + `BjxyField-array-card` + `BjxyField-photos-grid` + `BjxyField-photo-item` + `BjxyField-photo-del` + `BjxyField-file` (uploadPhotoToArray 加新 kind 即可, kind 走 `bjxy_[a-z0-9_]+_photo_*` 正则, vendor UploadController L85 接受)
  - 前台 renderSection 走 `addresses.map(...)` + `.bjxy-contact-wechat-grid` a 标签新窗口打开
  - 适用: 任何 bjxy 单值字段后续想加多值支持 (e.g. 多电话, 多邮箱, 多联系 QQ)
- 复用 `BjxyField-*` CSS (admin.less L302+), 不用新增 admin CSS
- vendor bundle grep: `bjxy-contact-wechat-grid` > 0, `bjxy-contact-label` > 0 (保留)

### 部署 (SOP 116 + 138+ + 152 + 153 + 154 + 161, **4 步全走**)
1. 本地 `cd /Applications/MAMP/htdocs/Flarum/packages/ziven-bjxy-website && yarn build` (SOP 152 强 rebuild)
2. scp 4 source + 2 dist file (SOP 153 sshpass + scp -p 逐 file + mtime + sha 双验)
3. `chown -R nginx:nginx packages/ziven-bjxy-website/`
4. vendor bundle commit (SOP 161 admin commit 单独再跑): `forum` commit + `flarum cache:clear` + `admin` 单独 commit

### ⚠️ server 端 git HEAD 状态
- server HEAD `38664e2` (v0.1.29) **落后本地 `ee71201` (v0.1.31) 2 commit**
- SOP 162 警告: SOP 144 升级"git fetch + reset --hard origin/master"不适用 (origin 也落后), 走 scp-only 流程, 不 reset
- v0.1.32 deploy 走 scp-only 完美, dist 跟源码都同步

## v0.1.31 (2026-08-08) — 删两处 swiper 左右导航箭头 (辉哥 11:48 反馈)

**项目**: ziven-bjxy-website
**类型**: feat(forum) — 删 events + coach 两处 swiper 左右导航箭头, 保留蓝点分页器 + 滑动功能
**辉哥反馈**: 11:48 反馈"把两处使用 swiper 的轮播图 (events section + coach section) 的左右小箭头都去掉", 没说禁滑动, 只说删箭头

### 改 2 个 source file
- **js/src/forum/components/BjxyPage.jsx** (-12 行, 4 块全删)
  - events initSwiper L108-111 删 `navigation: { nextEl, prevEl }` 块 (4 行)
  - events container L496-497 删 `m('div', { class: 'swiper-button-prev' })` + `m('div', { class: 'swiper-button-next' })` (2 行)
  - coach initCoachSwiper L142-145 删 `navigation: { nextEl, prevEl }` 块 (4 行)
  - coach container L589-590 删 prev/next 元素 (2 行)
- **less/forum.less** (-34 行, 2 块 + dark mode 覆盖)
  - 删 `.bjxy-coach-swiper .swiper-button-prev/.swiper-button-next` 样式块 (L667-683, 17 行, 含 2 行 v0.1.30 加注释)
  - 删 `.bjxy-event-swiper .swiper-button-prev/.swiper-button-next` 样式块 (L886-902, 17 行, 含 1 行注释 + dark mode 覆盖)
  - 保留: `.bjxy-coach-swiper .swiper-pagination*` (L669-677) + `.bjxy-event-swiper .swiper-pagination*` (L873-879) 蓝点分页器
  - 保留: vendor 默认 `.swiper-button-prev/.swiper-button-next` 样式 (vendor 自带不删, 删了会 break vendor 内部)

### 沉淀 (Mavis 整合)
- **SOP 164 (新)**: 简单 carousel (无左右箭头) 走 swiper 11 即可, 不用 CSS scroll-snap. swiper pagination 蓝点分页器走默认, navigation 按钮不传 `navigation: { nextEl, prevEl }` 配置就不渲染

### 部署 (SOP 116 + 138+ + 152 + 153 + 154 + 161, **4 步全走**)
1. 本地 `cd js && yarn build` (先 `mavis-trash js/dist/admin.js js/dist/forum.js` 强 rebuild, 绕开 webpack "compared for emit", SOP 152) → forum.js 105490 (-378) + admin.js 74440 (0)
2. scp 4 file (SOP 153 mtime + sha 双验):
   - BjxyPage.jsx: 2d261cedb8469a9763e512601e2cdfe15f011397
   - forum.less: 85cfcd3e2b24cf24e556be821f457d9a07b97cfb
   - admin.js: ce6a8b0e2bd28ccfdba3c9eadb4c3af2c35fa968
   - forum.js: df227c2e9c5cae555592730520799b45e09ae1ee
3. `chown -R nginx:nginx packages/ziven-bjxy-website/`
4. vendor bundle commit (SOP 161 admin commit 单独再跑):
   - `sudo -u nginx /usr/bin/php -r '$site=require "/var/www/flarum/site.php"; ...' (forum)` + `flarum cache:clear` + admin 单独再跑
   - server `public/assets/forum.css` mtime 2026-08-08 11:53:32, SHA 6003892316c9a0025afa8c84bb166dc0a97affc2

### ⚠️ server 端 git HEAD 状态
- server HEAD `38664e2` (v0.1.29) **落后本地 `55f0d9a` (v0.1.30) 1 commit**
- SOP 162 警告: SOP 144 升级"git fetch + reset --hard origin/master"不适用 (origin 也落后), 走 scp-only 流程, 不 reset
- v0.1.31 deploy 走 scp-only 完美, dist 跟源码都同步

### 5 URL 验证 (geek.ski, 2026-08-08 11:53)
| URL | 状态码 |
|-----|--------|
| `/` | 200 ✅ |
| `/bjxy` | 200 ✅ |
| `/api` | 200 ✅ |
| `/admin` | 403 ✅ (未登录) |
| `/login` | 405 ✅ (GET 不允许) |

### vendor bundle grep 验证
| 模式 | grep -c 结果 | 期望 | 结果 |
|------|------|------|------|
| `bjxy-coach-swiper .swiper-button-prev` | 0 | 0 (删了) | ✅ |
| `bjxy-event-swiper .swiper-button-prev` | 0 | 0 (删了) | ✅ |
| `bjxy-coach-swiper .swiper-pagination` | 1 | >0 (保留) | ✅ |
| `bjxy-event-swiper .swiper-pagination` | 1 | >0 (保留) | ✅ |

### Puppeteer 4 combo 验证 (geek.ski, 2026-08-08 11:54, puppeteer-core + 本地 Chrome)
| 场景 | arrows DOM | pagination bullets | slidesPerView 反推 | autoplay 行为 | 结果 |
|------|------|------|------|------|------|
| desktop events 1440x900 | 0+0 | 4 | 1.000 (=1.0) | activeIndex 2→3 (3.5s 后) | ✅ |
| desktop coach 1440x900 | 0+0 | 3 | 0.831 (=1/1.2) | - | ✅ |
| mobile events 390x844 | 0+0 | 4 | 1.000 (=1.0) | activeIndex 1 (跑过) | ✅ |
| mobile coach 390x844 | 0+0 | 3 | 0.905 (=1/1.1) | - | ✅ |

### 截图
- 4 张: `/tmp/bjxy_v0131_screenshots/{01_desktop_1440x900_events, 02_desktop_1440x900_coach, 03_mobile_390x844_events, 04_mobile_390x844_coach}.png`
- 视觉: events section 春季进阶特训班 + 4 蓝点, coach section Ziven 完整 + alice peek + 3 蓝点, **左右 0 箭头**

### 风险
- ✅ 零回归: v0.1.30 swiper peek 1.2 行为 + SOP 155 教练卡片详细样式保留
- ✅ vendor bundle 增量合理 (forum.js -378, admin.js 0, forum.css 减 34 行)
- ✅ 保留蓝点分页器 (辉哥没说删, 留用点击切换)
- ✅ 保留滑动功能 (辉哥没说禁, autoplay + snap + 1.2 peek 行为都在)
- ✅ vendor 默认 `.swiper-button-prev/.swiper-button-next` 样式 L1249+ 不删 (vendor 自带, 删了会 break vendor 内部)
- ✅ SOP 162 server HEAD 落后本地, 走 scp-only 完美, 没 reset 翻车

### Commit
- v0.1.31: 本地 SHA 待 git commit 跑 (commit message "v0.1.31 feat(forum): 删两处 swiper 左右导航箭头 (辉哥 11:48 反馈)") / 服务器 vendor bundle hash `6003892316c9a0025afa8c84bb166dc0a97affc2` (forum.css)

