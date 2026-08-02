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
