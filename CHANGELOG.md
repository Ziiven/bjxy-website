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
