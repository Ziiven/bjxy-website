// ====================================================================
// BjxySettings.jsx — 后台 settings UI (v0.1.8 tab 化重构)
// ====================================================================
//
// v0.1.8 改动 (辉哥反馈 "网站后台 tab 改做成跟 ziven-core 那样, 沿用 ziven-core 样式"):
//   - 8 section 拆 11 tab (背景/品牌是 2 个, 联系 + 页脚是 2 个, 11 个独立 tab)
//   - 顶部 .bjxy-tab-bar + 11 个 .bjxy-tab-btn 切换
//   - 容器 .bjxy-settings 走 ziven-core 同款深色玻璃风背景
//     (linear-gradient(180deg, #1a1a2e 0%, #16213e 100%) + 黄 #fbbc04 高亮)
//   - section 容器改 .bjxy-section.glass-card (跟 ziven-core .ziven-core-section.glass-card 1:1)
//   - 内部 .BjxyField-* 工具函数 (colorField / fileField / array / sortable / modal / savebar) 全部保留
//   - save() / loadSettings() / uploadFile / uploadPhotoToArray / sortablejs / coach modal 不变
//
// 11 tab 顺序 (跟 ziven-core 2 tab 同款 oninit 初始 activeTab + m.redraw() 模式):
//   brand / bg / hero / about / features / curriculum / coach / reviews / events / contact / footer
//
// 沿用 ziven-core admin 设计语言:
//   - 黄 #fbbc04 (跟 ziven-core --ziven-core-accent 一致, 不走 bjxy 旧 --bjxy-primary 蓝)
//   - 玻璃风 backdrop-filter blur(20px)
//   - 圆角 16px
//
// 注册: js/src/admin/index.js → app.registry.for('ziiven-ziven-bjxy-website').registerPage(BjxySettings)
// 路由: Flarum 2.0 admin 自动通过 /extension/:id 渲染 registerPage 注册的 page
// ====================================================================
import app from 'flarum/admin/app';
import ExtensionPage from 'flarum/admin/components/ExtensionPage';
import ColorPreviewInput from 'flarum/common/components/ColorPreviewInput';
// v0.1.3: 弹 modal 选用户组 (替代 v0.1.0f 留的 alert 占位)
import GroupPickerModal from './GroupPickerModal';
// v0.1.7: 评价 / 活动 拖拽排序 (复用 v0.1.4 GroupPickerModal sortablejs 模式)
import Sortable from 'sortablejs';
// mithril 走 vendor 注入的 global m (zct 同款, 不 import)

const DEFAULT_FEATURES = [
  { icon: '🏂', title: '室内滑雪高效', desc: '一年四季恒温环境, 不受天气影响' },
  { icon: '🛡️', title: '安全专业教练', desc: '认证教练全程指导, 安全第一' },
  { icon: '📚', title: '滑雪教学', desc: '自主研发课程体系, 分级进阶' },
  { icon: '🎿', title: '雪具护具免费', desc: '全套装备免费使用, 省心省力' },
  { icon: '🌐', title: '全国品牌机构', desc: '连锁品牌, 标准化教学' },
  { icon: '🏔️', title: '学玩用赛', desc: '全生态滑雪服务' },
];

// v0.1.0s 改: 教学体系从 2 个固定 array (single/double) 重构成 boards 数组
const DEFAULT_BOARDS = [
  { name: '单板', levels: [
    { level: 'PRIMARY', name: '直滑降后刃推坡', desc: '能够熟练的做直滑降练习...' },
    { level: 'PRIMARY', name: '前刃推坡', desc: '能够利用前刃做到匀速上滑...' },
    { level: 'PRIMARY', name: '前后刃落叶飘', desc: '在前后刃落叶飘的过程当中...' },
    { level: 'INTERMEDIATE', name: '辅助换刃', desc: '在借助扶杆 + 拉绳 + 拉手...' },
    { level: 'INTERMEDIATE', name: '基础转弯', desc: '不借助外力, S 形搓雪...' },
    { level: 'INTERMEDIATE', name: '标准转弯', desc: '动作有明显引申, 滑行流畅...' },
    { level: 'ADVANCED', name: '刻滑', desc: '不搓雪的刻滑转弯...' },
    { level: 'ADVANCED', name: '自由式', desc: '流畅正反脚滑行, Ollie...' },
  ]},
  { name: '双板', levels: [
    { level: 'PRIMARY', name: '犁式刹车', desc: '熟悉滑雪基本站姿...' },
    { level: 'PRIMARY', name: '基础犁式转弯', desc: '在犁式刹车基础上...' },
    { level: 'PRIMARY', name: '高级犁式转弯', desc: '熟练基础犁式转弯的基础上...' },
    { level: 'INTERMEDIATE', name: '半犁式转弯', desc: '稳定流畅的犁式转弯后...' },
    { level: 'INTERMEDIATE', name: '高级半犁式', desc: '熟练犁式转弯...' },
    { level: 'INTERMEDIATE', name: '基础平行式', desc: '能够在转弯的任何阶段保持双板平行...' },
    { level: 'ADVANCED', name: '中级平行式', desc: '平行转弯流畅, 有较好的滑行节奏...' },
    { level: 'ADVANCED', name: '高级平行式', desc: '精准的控制雪板刃的使用...' },
    { level: 'ADVANCED', name: '全地域大神', desc: '单脚滑行, 豚跳, 180 度旋转...' },
  ]},
];

// v0.1.8 11 tab 配置 — 跟 ziven-core 同款 [{key, icon, label}] 列表
//   渲染时遍历生成 .bjxy-tab-btn, switchTab(key) 改 this.activeTab + m.redraw()
// v0.1.9 改: tab 顺序改成可拖拽 (sortablejs), this.tabOrder 持久化到 bjxy_section_order_json
//   前台 BjxyPage.jsx 读这个 settings, 按顺序渲染 8 主体 section (过滤 brand/footer)
//
// v0.1.14 改: bg tab 从主 tab bar 完全分离, 放到独立 "全局设置" 区域 (不参与排序)
//   辉哥 16:25 拍板: "不是现在这样，我是说把颜色渐变做成个tab放到另一个区域里，不要跟那些section的tab放到一起"
//   bg 还是 tab 形式, 但放在主 tab bar 之外的一个独立 "🎨 全局设置" card 区域
//   主 tab bar 仍然 10 个可拖 (brand + 8 主体 + footer)
//   独立全局设置区可以容纳其他全局 tab (bg / footer 全局 / SEO / theme 等)
//   this.tabOrder 只存 10 个可拖 key, bg 不参与排序, 不存 settings
//   this.activeGlobalTab 状态机: 当前全局 tab (目前只有 'bg')
//
//   设计上:
//     <div.bjxy-global-section>  <- 独立 card 区域 (顶部, 跟主 tab bar 分开)
//       <div.bjxy-global-section-header>🎨 全局设置</div>
//       <div.bjxy-global-tab-bar>  <- 全局 tab bar (目前只 bg, 未来可加)
//         <button> 背景渐变 </button>
//       </div>
//       <div.bjxy-global-section-content>  <- 当前 active 全局 tab 的内容
//         {renderBgSection()}
//       </div>
//     </div>
//     <div.bjxy-section-tab-area>  <- 主 tab bar + 主 section 容器 (跟全局区分)
//       {renderTabBar()}  <- 10 个可拖 tab
//       {renderActiveSection()}  <- 10 个对应 section
//     </div>
const BJXY_TABS = [
  { key: 'brand',      icon: '🏔',  label: '品牌信息' },
  { key: 'hero',       icon: '🖼',   label: 'Hero 区域' },
  { key: 'about',      icon: '📖',  label: '关于我们' },
  { key: 'features',   icon: '✨',  label: '办学特色' },
  { key: 'curriculum', icon: '📚',  label: '教学体系' },
  { key: 'coach',      icon: '👥',  label: '教练展示' },
  { key: 'reviews',    icon: '💬',  label: '学员评价' },
  { key: 'events',     icon: '🎯',  label: '活动展示' },
  { key: 'contact',    icon: '📞',  label: '联系我们' },
  { key: 'footer',     icon: '🦶',  label: '页脚 / 备案' },
];

// v0.1.9: 默认 tab 顺序 (跟 v0.1.6b 沉淀一致: hero/about/events 在前, contact 在后, footer 永远最底)
//   v0.1.14 改: 不含 'bg' (10 个可拖), bg 在独立全局设置区, 不参与主排序
const DEFAULT_TAB_ORDER = [
  'brand', 'hero', 'about', 'events', 'features', 'curriculum', 'coach', 'reviews', 'contact', 'footer'
];

// v0.1.14: 全局设置 tab 数组 (跟主 tab bar 分开, 独立渲染在 .bjxy-global-section 区域)
//   跟 BJXY_TABS 1:1 结构 [{key, icon, label}], 未来可加 footer 全局 / SEO / theme 等
//   全局 tab 不参与主 tab 排序, 不存 settings
//   this.activeGlobalTab 状态机控制当前显示哪个全局 tab 的内容
const BJXY_GLOBAL_TABS = [
  { key: 'bg', icon: '🎨', label: '背景渐变' },
];

export default class BjxySettings extends ExtensionPage {
  // v0.1.8 跟 ziven-core 1:1: bodyClass 让 admin 路由白底隔离
  bodyClass = 'App--admin-ziiven-ziven-bjxy-website';

  oninit(vnode) {
    super.oninit(vnode);
    this.loading = true;
    this.saving = false;
    this.data = {};
    this.features = JSON.parse(JSON.stringify(DEFAULT_FEATURES));
    this.boards = JSON.parse(JSON.stringify(DEFAULT_BOARDS));
    this.coachUserIds = [];
    this.coachGroupIds = [];
    this.allGroups = [];
    this.coachDetails = {};
    this.reviews = [];
    this.students = [];
    this.eventsAutoplayMs = 3000;
    // v0.1.15: 10 个 section 可见性状态 (默认全部 true 开启)
    //   辉哥 18:19 拍板: "给每个section的tab里加上一个开关，默认是开启状态，只有在开启时前端对应的section才展示"
    //   10 个 key: brand/hero/about/events/features/curriculum/coach/reviews/contact/footer
    //   sectionHead 渲染 toggle 开关, 关闭时前台对应 section 不展示
    this.sectionVisible = {
      brand: true, hero: true, about: true, events: true, features: true,
      curriculum: true, coach: true, reviews: true, contact: true, footer: true,
    };
    this.reviewsSortable = null;
    this.studentsSortable = null;
    // v0.1.8 tab 状态: 跟 ziven-core 1:1 模式, oninit 给初始值, switchTab() 改 + m.redraw()
    this.activeTab = 'brand';
    // v0.1.14: 全局设置区 active tab 状态机 (独立于主 activeTab, 跟主 tab bar 完全分离)
    //   全局 tab 永远在独立 card 区域 (.bjxy-global-section), 跟主 10 个可拖 tab 不混
    this.activeGlobalTab = 'bg';
    // v0.1.9: tab 顺序 (可拖拽, 持久化到 bjxy_section_order_json)
    //   oninit 给默认顺序, loadSettings() 读 settings 覆盖
    this.tabOrder = DEFAULT_TAB_ORDER.slice();
    this.tabBarSortable = null;
    this.loadSettings();
  }

  // v0.1.8 主 tab 切换 (跟 ziven-core ZivenCoreSettingsPage.switchTab 1:1 模式)
  switchTab(tab) {
    if (this.activeTab !== tab) {
      this.activeTab = tab;
      m.redraw();
    }
  }

  // v0.1.14: 全局设置区 tab 切换 (独立状态机, 跟主 activeTab 完全分离)
  //   走独立 .bjxy-global-section 区域, 跟主 10 个可拖 tab 不混
  //   未来加全局 tab: 在 BJXY_GLOBAL_TABS 数组加项 + renderActiveGlobalSection 加 case
  switchGlobalTab(tab) {
    if (this.activeGlobalTab !== tab) {
      this.activeGlobalTab = tab;
      m.redraw();
    }
  }

  // v0.1.9: 顶部 tab bar — 按 this.tabOrder 排序遍历 BJXY_TABS 生成 .bjxy-tab-btn
  //   加 sortablejs 拖拽, 整个 tab bar 可拖, onEnd 改 this.tabOrder + m.redraw()
  //   注: 拖拽时不能切 tab (避免误点), 切 tab 用 click; sortable handle 是 .bjxy-tab-handle (右侧拖拽图标)
  //
  // v0.1.14 改: bg 从这里拿走 (独立到 .bjxy-global-section 区域, 跟主 tab bar 完全分开)
  //   现在 renderTabBar 只渲染 10 个主可拖 tab, bg 不再出现
  renderTabBar() {
    // 按 this.tabOrder 排序生成可拖 tabs
    const tabMap = {};
    BJXY_TABS.forEach(t => { tabMap[t.key] = t; });
    const orderedDraggableTabs = this.tabOrder.map(k => tabMap[k]).filter(Boolean);

    return (
      <div className="bjxy-tab-bar-wrapper">
        <div className="bjxy-tab-bar-hint">
          <i className="fas fa-arrows-alt"></i>
          拖动 tab 可调整顺序 (前台 /bjxy 页面会跟着这个顺序展示)
        </div>
        <div
          className="bjxy-tab-bar"
          oncreate={(vnode) => this.initTabBarSortable(vnode)}
          onremove={() => this.destroyTabBarSortable()}
        >
          {orderedDraggableTabs.map(t => (
            <button
              type="button"
              className={`bjxy-tab-btn ${this.activeTab === t.key ? 'active' : ''}`}
              onclick={() => this.switchTab(t.key)}
              key={t.key}
              data-tab-key={t.key}
            >
              <i>{t.icon}</i>
              {t.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // v0.1.14: 独立全局设置区 (跟主 tab bar 完全分开的独立 card 区域)
  //   渲染 .bjxy-global-section 容器, 里面有:
  //     - .bjxy-global-section-header (图标 + 标题 + hint)
  //     - .bjxy-global-tab-bar (全局 tab 按钮, 跟主 tab bar 视觉一致但独立)
  //     - .bjxy-global-section-content (当前 active 全局 tab 的内容, 走 renderActiveGlobalSection)
  //   跟主 tab bar (.bjxy-tab-bar) 用 class namespace 区分, CSS 也是独立 .bjxy-global-* 样式
  //   未来加全局 tab: 在 BJXY_GLOBAL_TABS 数组加项 + renderActiveGlobalSection 加 case
  renderGlobalSection() {
    return (
      <div className="bjxy-global-section glass-card">
        {this.sectionHead('🎨', '全局设置', '不属于前台 section, 影响整个页面 (背景 / 主题 / SEO 等)')}
        <div className="bjxy-global-tab-bar">
          {BJXY_GLOBAL_TABS.map(t => (
            <button
              type="button"
              className={`bjxy-tab-btn bjxy-global-tab-btn ${this.activeGlobalTab === t.key ? 'active' : ''}`}
              onclick={() => this.switchGlobalTab(t.key)}
              key={`global-${t.key}`}
              data-global-tab-key={t.key}
            >
              <i>{t.icon}</i>
              {t.label}
            </button>
          ))}
        </div>
        <div className="bjxy-global-section-content">
          {this.renderActiveGlobalSection()}
        </div>
      </div>
    );
  }

  // v0.1.14: 全局 tab → 对应 render method 映射
  //   跟 renderActiveSection() 同款结构, 但走独立全局 section
  //   未来加全局 tab: 加 case + 写新 renderXxxGlobalSection() 方法
  renderActiveGlobalSection() {
    switch (this.activeGlobalTab) {
      case 'bg':         return this.renderBgSection();
      // 未来: case 'footer':  return this.renderFooterGlobalSection();
      // 未来: case 'seo':     return this.renderSeoGlobalSection();
      // 未来: case 'theme':   return this.renderThemeGlobalSection();
      default:           return this.renderBgSection();
    }
  }

  // v0.1.9: 初始化 tab bar sortablejs (复用 v0.1.4 GroupPickerModal / v0.1.7 reviews 拖拽模式)
  //   animation 150 + ghost/chosen/drag class
  //   onEnd 改 this.tabOrder + m.redraw() 立即重渲
  // v0.1.14 改: 移除 filter (bg 已经从主 tab bar 完全独立到 .bjxy-global-section 区域, 主 tab bar 都是可拖)
  initTabBarSortable(vnode) {
    if (this.tabBarSortable) this.tabBarSortable.destroy();
    this.tabBarSortable = Sortable.create(vnode.dom, {
      animation: 150,
      // v0.1.9: 拖拽手柄 = 整个 tab button (整条可拖, 跟 zct 评价卡片同款)
      //   不用指定 handle, 整个 .bjxy-tab-btn 可拖
      ghostClass: 'bjxy-tab-sortable-ghost',
      chosenClass: 'bjxy-tab-sortable-chosen',
      dragClass: 'bjxy-tab-sortable-drag',
      onEnd: (e) => {
        if (e.oldIndex === e.newIndex) return;
        // 改 this.tabOrder 顺序
        const moved = this.tabOrder.splice(e.oldIndex, 1)[0];
        this.tabOrder.splice(e.newIndex, 0, moved);
        // m.redraw() 立即重渲, 同步 this.activeTab 对应的 active class
        m.redraw();
        console.log('[bjxy] tab order changed:', this.tabOrder.join(' → '));
      },
    });
  }

  // 销毁 tab bar sortable 实例
  destroyTabBarSortable() {
    if (this.tabBarSortable) {
      this.tabBarSortable.destroy();
      this.tabBarSortable = null;
    }
  }

  // ================== 工具函数 (跟 ziven-core buildSettingComponent 同思路, 走 this.data) ==================
  // v0.1.8 重构: 之前是 content() 内 local function, 现在拆 11 tab 多次调用, 提到 this method
  // 保留所有 v0.1.0n value 优先级 (this.data 优先) 跟 v0.1.0m ColorPreviewInput 跨浏览器颜色块修法

  // v0.1.0n value 优先级: this.data[key] 优先 (用户输入), s(key) (load 时 server 值), default
  _s() {
    // v0.1.0d 修: 不能在 module top-level 缓存 app.forum.attribute.bind() (那时 admin app
    // 还没 register, app undefined throw). 改在调用时 lazy 拿 app.
    return app && app.forum ? app.forum.attribute.bind(app.forum) : () => null;
  }

  field(label, key, defaultValue) {
    const s = this._s();
    return m('div', { class: 'BjxyField-row' }, [
      m('div', { class: 'BjxyField-label' }, label),
      m('input', {
        class: 'BjxyField-input',
        value: (this.data[key] != null ? this.data[key] : (s(key) || '')) || defaultValue,
        placeholder: defaultValue,
        oninput: (e) => { this.data[key] = e.target.value; },
      }),
    ]);
  }

  // v0.1.0m 颜色选择器: 走 vendor ColorPreviewInput (跨浏览器一致)
  colorField(label, key, defaultColor) {
    const s = this._s();
    return m('div', { class: 'BjxyField-row' }, [
      m('div', { class: 'BjxyField-label' }, label),
      m(ColorPreviewInput, {
        className: 'BjxyField-color-text',
        value: (this.data[key] != null ? this.data[key] : (s(key) || '')) || defaultColor,
        placeholder: defaultColor,
        onchange: (e) => { this.data[key] = e.target.value; m.redraw(); },
      }),
    ]);
  }

  textareaField(label, key, defaultValue) {
    const s = this._s();
    return m('div', { class: 'BjxyField-row' }, [
      m('div', { class: 'BjxyField-label' }, label),
      m('textarea', {
        class: 'BjxyField-textarea',
        value: (this.data[key] != null ? this.data[key] : (s(key) || '')) || defaultValue,
        placeholder: defaultValue,
        oninput: (e) => { this.data[key] = e.target.value; },
      }),
    ]);
  }

  fileField(label, key, hint) {
    const url = this.data[key] || '';
    return m('div', { class: 'BjxyField-row' }, [
      m('div', { class: 'BjxyField-label' }, label),
      m('div', null, [
        m('div', { class: 'BjxyField-file', onclick: (e) => this.uploadFile(e, key) }, '📷 点击上传 (' + hint + ')'),
        url ? m('div', { class: 'BjxyField-file-preview' }, [
          m('div', null, '✓ 已上传: ' + url),
          (key.indexOf('banner') >= 0 || key.indexOf('logo') >= 0 || key.indexOf('image') >= 0)
            ? m('div', null, m('img', { src: url, alt: '' }))
            : null,
        ]) : null,
      ]),
    ]);
  }

  // v0.1.8 section header 包装 — 跟 ziven-core .ziven-core-section-header 1:1 风格
  // icon + title + 右侧 hint (可选) + 右侧 toggle 开关 (可选, v0.1.15 加)
  // v0.1.15 改: 加 sectionKey 参数, 如果传了就在 header 右侧渲染 toggle 开关
  //   关闭时 this.sectionVisible[key] = false, 前台对应 section 不展示
  //   10 个 section tab 都用, bg 全局设置没有 key (不参与可见性控制)
  sectionHead(icon, title, hint, sectionKey) {
    return (
      <div className="bjxy-section-header">
        <div className="bjxy-section-header-main">
          <i>{icon}</i>
          {title}
          {hint ? <span className="bjxy-section-hint">{hint}</span> : null}
        </div>
        {sectionKey ? this.renderVisibilityToggle(sectionKey) : null}
      </div>
    );
  }

  // v0.1.15: 渲染 section 可见性 toggle 开关 (右上角)
  //   走 vendor Switch 组件 (flarum/admin/components/Switch) 视觉一致
  //   onchange 改 this.sectionVisible[key] + m.redraw() (实时反映, save() 时持久化)
  //   关闭时 toggle 显示 OFF, 前台对应 section 不展示
  renderVisibilityToggle(sectionKey) {
    const on = this.sectionVisible[sectionKey] !== false;  // 默认 true
    return (
      <label className={`bjxy-visibility-toggle ${on ? 'on' : 'off'}`} title={on ? '已开启 (前端展示)' : '已关闭 (前端隐藏)'}>
        <span className="bjxy-visibility-toggle-label">{on ? '已开启' : '已关闭'}</span>
        <button
          type="button"
          className="bjxy-visibility-toggle-btn"
          onclick={(e) => { e.preventDefault(); this.toggleSectionVisibility(sectionKey); }}
          aria-pressed={on}
        >
          <span className="bjxy-visibility-toggle-knob" />
        </button>
      </label>
    );
  }

  // v0.1.15: 切换 section 可见性 (走 this.sectionVisible 状态)
  toggleSectionVisibility(sectionKey) {
    const cur = this.sectionVisible[sectionKey] !== false;
    this.sectionVisible[sectionKey] = !cur;
    m.redraw();
  }

  // ================== 11 个 section 渲染方法 ==================
  // 每个 renderXxxSection 走 ziven-core 1:1 结构:
  //   <div class="bjxy-section glass-card">
  //     <div class="bjxy-section-header">icon + title + hint</div>
  //     <div class="bjxy-section-content">内部 field / fileField / array / sortable</div>
  //   </div>

  // Tab 1: 品牌
  renderBrandSection() {
    return (
      <div className="bjxy-section glass-card">
        {this.sectionHead('🏔', '品牌信息 (全局)', null, 'brand')}
        <div className="bjxy-section-content">
          {this.field('品牌名', 'bjxy_brand_name', '北极雪屿')}
          {this.field('品牌副标', 'bjxy_brand_slogan', '室内滑雪 · 全国连锁')}
          {this.fileField('Logo 图片', 'bjxy_brand_logo_url', 'logo.svg / png (走 ziven-core COS)')}
        </div>
      </div>
    );
  }

  // Tab 2: 背景渐变 (浅深双版)
  // v0.1.0m: 渐变背景 4 色
  // v0.1.0z: 加 2 个背景图 fileField, 走 ziven-core COS 上传
  //   有图 → background: url(...), 渐变不生效
  //   没图 → 4 色渐变生效 (v0.1.0j+y 视差 fixed viewport)
  renderBgSection() {
    return (
      <div className="bjxy-section glass-card">
        {this.sectionHead('🎨', '背景渐变 (浅深双版)', null, 'bg')}
        <div className="bjxy-section-content">
          {this.colorField('浅色模式 - 起始色', 'bjxy_bg_gradient_light_start', '#E0EBF8')}
          {this.colorField('浅色模式 - 结束色', 'bjxy_bg_gradient_light_end', '#F7FAFC')}
          {this.colorField('深色模式 - 起始色', 'bjxy_bg_gradient_dark_start', '#0F1419')}
          {this.colorField('深色模式 - 结束色', 'bjxy_bg_gradient_dark_end', '#1A202C')}
          {this.fileField('浅色模式 - 背景图', 'bjxy_bg_image_light_url', '1920×1080 推荐, 留空用渐变')}
          {this.fileField('深色模式 - 背景图', 'bjxy_bg_image_dark_url', '1920×1080 推荐, 留空用渐变')}
        </div>
      </div>
    );
  }

  // Tab 3: Hero 区域
  renderHeroSection() {
    return (
      <div className="bjxy-section glass-card">
        {this.sectionHead('🖼', 'Hero 区域', null, 'hero')}
        <div className="bjxy-section-content">
          {this.field('主标题', 'bjxy_hero_title', '探索极致的滑雪体验。')}
          {this.field('副标题', 'bjxy_hero_subtitle', '专注滑雪领域的全国连锁机构...')}
          {this.fileField('浅色模式 banner', 'bjxy_hero_banner_light', '1920×600 推荐')}
          {this.fileField('深色模式 banner', 'bjxy_hero_banner_dark', '1920×600 推荐')}
          {this.field('CTA 文字', 'bjxy_hero_cta_text', '立即咨询')}
          {this.field('CTA 链接', 'bjxy_hero_cta_link', '#contact')}
        </div>
      </div>
    );
  }

  // Tab 4: 关于我们
  renderAboutSection() {
    return (
      <div className="bjxy-section glass-card">
        {this.sectionHead('📖', '关于我们', null, 'about')}
        <div className="bjxy-section-content">
          {this.field('小标题', 'bjxy_about_sub', 'ABOUT US')}
          {this.field('主标题', 'bjxy_about_title', '关于北极雪屿')}
          {this.textareaField('描述', 'bjxy_about_desc', '北极雪屿室内滑雪成立于 2024 年...')}
          {this.field('数据 1 - 数字', 'bjxy_about_stat_1_num', '10+')}
          {this.field('数据 1 - 标签', 'bjxy_about_stat_1_label', '年教学经验')}
          {this.field('数据 2 - 数字', 'bjxy_about_stat_2_num', '50+')}
          {this.field('数据 2 - 标签', 'bjxy_about_stat_2_label', '专业教练')}
          {this.field('数据 3 - 数字', 'bjxy_about_stat_3_num', '1000+')}
          {this.field('数据 3 - 标签', 'bjxy_about_stat_3_label', '毕业学员')}
        </div>
      </div>
    );
  }

  // Tab 5: 办学特色 (6 个卡片)
  // v0.1.0w 改: 删 "特色卡片" label, 改 class BjxyField-features
  renderFeaturesSection() {
    return (
      <div className="bjxy-section glass-card">
        {this.sectionHead('✨', '办学特色 (6 个卡片)', null, 'features')}
        <div className="bjxy-section-content">
          <div className="BjxyField-array BjxyField-features">
            {this.features.map((f, i) => m('div', { class: 'BjxyField-array-row', key: 'f' + i }, [
              m('div', { class: 'ic-mini' }, f.icon || '★'),
              m('input', { value: f.title, oninput: (e) => { f.title = e.target.value; } }),
              m('input', { value: f.icon, oninput: (e) => { f.icon = e.target.value; } }),
              m('input', { value: f.desc, oninput: (e) => { f.desc = e.target.value; } }),
              m('button', { class: 'del', onclick: () => { this.features.splice(i, 1); m.redraw(); } }, '×'),
            ]))}
            <div className="BjxyField-array-add" onclick={() => { this.features.push({ icon: '★', title: '新特色', desc: '' }); m.redraw(); }}>
              + 添加特色
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Tab 6: 教学体系
  // v0.1.0s 改: 教学体系类型任意多 (boards array)
  //   - 每个 board 是 {name, levels: [...]}, 用户可增删 board
  //   - 每个 board 内 levels 可增删改 (v0.1.0r 实现)
  renderCurriculumSection() {
    return (
      <div className="bjxy-section glass-card">
        {this.sectionHead('📚', '教学体系 (' + this.boards.length + ' 种类型 / 共 ' + this.boards.reduce((s, b) => s + b.levels.length, 0) + ' 级)', null, 'curriculum')}
        <div className="bjxy-section-content">
          {this.boards.map((board, bi) => m('div', { class: 'BjxyField-board', key: 'board' + bi }, [
            m('div', { class: 'BjxyField-board-head' }, [
              m('input', {
                class: 'BjxyField-board-name',
                value: board.name,
                placeholder: '类型名 (单板/双板/雪橇/冰球...)',
                oninput: (e) => { board.name = e.target.value; },
              }),
              m('span', { class: 'BjxyField-board-count' }, board.levels.length + ' 级'),
              m('button', {
                class: 'del',
                onclick: () => { if (confirm('删除类型 ' + board.name + ' 及其所有等级?')) { this.boards.splice(bi, 1); m.redraw(); } },
              }, '× 删除类型'),
            ]),
            m('div', { class: 'BjxyField-array' }, [
              board.levels.map((l, i) => m('div', { class: 'BjxyField-array-row', key: 'b' + bi + 'l' + i }, [
                m('div', { class: 'ic-mini' }, i + 1),
                m('input', {
                  class: 'BjxyField-level-input',
                  value: l.level,
                  placeholder: '等级 (PRIMARY/初级/...)',
                  oninput: (e) => { l.level = e.target.value; },
                }),
                m('input', { value: l.name, oninput: (e) => { l.name = e.target.value; } }),
                m('input', { value: l.desc, oninput: (e) => { l.desc = e.target.value; } }),
                m('button', { class: 'del', onclick: () => { board.levels.splice(i, 1); m.redraw(); } }, '×'),
              ])),
              m('div', {
                class: 'BjxyField-array-add',
                onclick: () => { board.levels.push({ level: '初级', name: '新等级', desc: '' }); m.redraw(); },
              }, '+ 添加等级'),
            ]),
          ]))}
          <div className="BjxyField-board-add" onclick={() => { this.boards.push({ name: '新类型', levels: [{ level: 'PRIMARY', name: '新等级', desc: '' }] }); m.redraw(); }}>
            + 添加类型 (雪橇 / 冰球 / 自由式...)
          </div>
        </div>
      </div>
    );
  }

  // Tab 7: 教练展示
  renderCoachSection() {
    return (
      <div className="bjxy-section glass-card">
        {this.sectionHead('👥', '教练展示', null, 'coach')}
        <div className="bjxy-section-content">
          <div className="BjxyField-label">选择用户组 (多选)</div>
          <div className="BjxyField-group-select">
            {this.allGroups.length === 0 ? <div className="BjxyField-hint">加载中...</div> : null}
            {this.allGroups.map(g => {
              const on = this.coachGroupIds.indexOf(g.id) >= 0;
              return m('div', {
                class: 'opt' + (on ? ' on' : ''),
                onclick: () => this.toggleGroup(g.id),
              }, [
                m('span', { class: 'ck' }, on ? '✓' : ''),
                g.nameSingular + ' (' + (g.userCount || 0) + ' 人)',
              ]);
            })}
            {this.coachGroupIds.length > 0
              ? m('div', { class: 'BjxyField-group-pick', onclick: () => this.openGroupModal() }, '🎯 弹 modal 选用户 + 编辑详情 (v0.1.5)')
              : null}
            {this.coachUserIds.length > 0
              ? m('div', { class: 'BjxyField-hint' }, '✅ 已选 ' + this.coachUserIds.length + ' 个用户作为教练 (前台展示用). 拖拽排序顺序. 已填详情: ' + Object.keys(this.coachDetails).filter(uid => this.coachDetails[uid] && (this.coachDetails[uid].bio || this.coachDetails[uid].achievements || this.coachDetails[uid].specialties)).length + ' / ' + this.coachUserIds.length + ' (头像自动用用户自己的)')
              : m('div', { class: 'BjxyField-hint' }, '💡 选中用户组 + 弹 modal 选用户 (拖拽排序) + 编辑简介 后, 这些用户将作为教练展示. 头像自动用用户自己的系统头像.')}
          </div>
        </div>
      </div>
    );
  }

  // Tab 8: 学员评价 (结构化 JSON, 多图)
  // v0.1.6 + v0.1.6a
  renderReviewsSection() {
    return (
      <div className="bjxy-section glass-card">
        {this.sectionHead('💬', '学员评价 (结构化 JSON, 多图)', null, 'reviews')}
        <div className="bjxy-section-content">
          <div
            className="BjxyField-array BjxyField-array-wide BjxyField-sortable"
            oncreate={(vnode) => this.initSortable(vnode, 'reviews')}
            onremove={() => this.destroySortable('reviews')}
          >
            {this.reviews.map((r, i) => m('div', { class: 'BjxyField-array-card', key: 'r' + i }, [
              m('div', { class: 'BjxyField-array-card-head' }, [
                m('span', { class: 'BjxyField-array-card-num' }, '评价 #' + (i + 1)),
                m('button', {
                  class: 'del',
                  onclick: () => { this.reviews.splice(i, 1); m.redraw(); },
                }, '× 删除'),
              ]),
              m('div', { class: 'BjxyField-array-card-body' }, [
                m('div', { class: 'BjxyField-row' }, [
                  m('div', { class: 'BjxyField-label' }, '作者昵称'),
                  m('input', {
                    class: 'BjxyField-input',
                    value: r.author,
                    placeholder: '王同学',
                    oninput: (e) => { r.author = e.target.value; },
                  }),
                ]),
                m('div', { class: 'BjxyField-row' }, [
                  m('div', { class: 'BjxyField-label' }, '评分 (1-5)'),
                  m('input', {
                    class: 'BjxyField-input',
                    type: 'number',
                    min: '1',
                    max: '5',
                    value: r.rating,
                    oninput: (e) => { r.rating = Math.max(1, Math.min(5, parseInt(e.target.value) || 5)); },
                  }),
                ]),
                m('div', { class: 'BjxyField-row' }, [
                  m('div', { class: 'BjxyField-label' }, '评价文字'),
                  m('textarea', {
                    class: 'BjxyField-textarea',
                    value: r.text,
                    placeholder: '教练很专业, 学到了很多...',
                    rows: '3',
                    oninput: (e) => { r.text = e.target.value; },
                  }),
                ]),
                m('div', { class: 'BjxyField-row' }, [
                  m('div', { class: 'BjxyField-label' }, '日期 (可选)'),
                  m('input', {
                    class: 'BjxyField-input',
                    value: r.date,
                    placeholder: '2026-08-03',
                    oninput: (e) => { r.date = e.target.value; },
                  }),
                ]),
                // v0.1.6a: 评价多图 (大众点评风格 缩略图墙)
                m('div', { class: 'BjxyField-row' }, [
                  m('div', { class: 'BjxyField-label' }, '评价图片 (多图)'),
                  m('div', null, [
                    r.photos && r.photos.length > 0 ? m('div', { class: 'BjxyField-photos-grid' },
                      r.photos.map((url, pi) => m('div', { class: 'BjxyField-photo-item', key: 'rp' + i + 'p' + pi }, [
                        m('img', { src: url, alt: '' }),
                        m('button', {
                          class: 'BjxyField-photo-del',
                          onclick: () => { r.photos.splice(pi, 1); m.redraw(); },
                        }, '×'),
                      ]))
                    ) : null,
                    m('div', { class: 'BjxyField-file', onclick: (e) => this.uploadPhotoToArray(e, this.reviews, i) }, '📷 添加图片 (' + (r.photos ? r.photos.length : 0) + ' 张)'),
                  ]),
                ]),
              ]),
            ]))}
            <div className="BjxyField-array-add" onclick={() => { this.reviews.push({ author: '', rating: 5, text: '', date: '', photos: [] }); m.redraw(); }}>
              + 添加评价
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Tab 9: 活动展示 (swiper 轮播)
  // v0.1.6 + v0.1.6a + v0.1.6d (URL 字段) + v0.1.6g (autoplay 间隔)
  renderEventsSection() {
    return (
      <div className="bjxy-section glass-card">
        {this.sectionHead('🎯', '活动展示 (swiper 轮播多图)', null, 'events')}
        <div className="bjxy-section-content">
          {/* v0.1.6g: 活动 swiper 自动轮播间隔设置 */}
          <div className="BjxyField-row">
            <div className="BjxyField-label">轮播间隔 (毫秒)</div>
            <input
              className="BjxyField-input"
              type="number"
              min="500"
              max="60000"
              step="100"
              value={this.eventsAutoplayMs}
              placeholder="3000"
              oninput={(e) => { this.eventsAutoplayMs = parseInt(e.target.value, 10) || 3000; }}
            />
            <div className="BjxyField-hint">默认 3000, 范围 500-60000</div>
          </div>
          <div
            className="BjxyField-array BjxyField-array-wide BjxyField-sortable"
            oncreate={(vnode) => this.initSortable(vnode, 'students')}
            onremove={() => this.destroySortable('students')}
          >
            {this.students.map((s, i) => m('div', { class: 'BjxyField-array-card', key: 's' + i }, [
              m('div', { class: 'BjxyField-array-card-head' }, [
                m('span', { class: 'BjxyField-array-card-num' }, '活动 #' + (i + 1)),
                m('button', {
                  class: 'del',
                  onclick: () => { this.students.splice(i, 1); m.redraw(); },
                }, '× 删除'),
              ]),
              m('div', { class: 'BjxyField-array-card-body' }, [
                m('div', { class: 'BjxyField-row' }, [
                  m('div', { class: 'BjxyField-label' }, '活动名称'),
                  m('input', {
                    class: 'BjxyField-input',
                    value: s.name,
                    placeholder: '春节滑雪冬令营',
                    oninput: (e) => { s.name = e.target.value; },
                  }),
                ]),
                m('div', { class: 'BjxyField-row' }, [
                  m('div', { class: 'BjxyField-label' }, '副标题 (例: 时间/地点)'),
                  m('input', {
                    class: 'BjxyField-input',
                    value: s.level,
                    placeholder: '2026.02 · 崇礼万龙',
                    oninput: (e) => { s.level = e.target.value; },
                  }),
                ]),
                m('div', { class: 'BjxyField-row' }, [
                  m('div', { class: 'BjxyField-label' }, '活动介绍'),
                  m('textarea', {
                    class: 'BjxyField-textarea',
                    value: s.achievement,
                    placeholder: '5 天 4 晚, 单板 + 双板, 适合 8-15 岁',
                    rows: '2',
                    oninput: (e) => { s.achievement = e.target.value; },
                  }),
                ]),
                // v0.1.6d: URL 字段
                m('div', { class: 'BjxyField-row' }, [
                  m('div', { class: 'BjxyField-label' }, '跳转 URL (可选)'),
                  m('input', {
                    class: 'BjxyField-input',
                    value: s.url || '',
                    placeholder: '留空不跳转 / 内部: /dressUp / 外部: https://example.com',
                    oninput: (e) => { s.url = e.target.value; },
                  }),
                ]),
                // v0.1.6a: 活动多图
                m('div', { class: 'BjxyField-row' }, [
                  m('div', { class: 'BjxyField-label' }, '活动图片 (多图)'),
                  m('div', null, [
                    s.photos && s.photos.length > 0 ? m('div', { class: 'BjxyField-photos-grid' },
                      s.photos.map((url, pi) => m('div', { class: 'BjxyField-photo-item', key: 'sp' + i + 'p' + pi }, [
                        m('img', { src: url, alt: '' }),
                        m('button', {
                          class: 'BjxyField-photo-del',
                          onclick: () => { s.photos.splice(pi, 1); m.redraw(); },
                        }, '×'),
                      ]))
                    ) : null,
                    m('div', { class: 'BjxyField-file', onclick: (e) => this.uploadPhotoToArray(e, this.students, i) }, '📷 添加图片 (' + (s.photos ? s.photos.length : 0) + ' 张)'),
                  ]),
                ]),
              ]),
            ]))}
            <div className="BjxyField-array-add" onclick={() => { this.students.push({ name: '', level: '', achievement: '', photos: [], url: '' }); m.redraw(); }}>
              + 添加活动
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Tab 10: 联系我们
  renderContactSection() {
    return (
      <div className="bjxy-section glass-card">
        {this.sectionHead('📞', '联系我们', null, 'contact')}
        <div className="bjxy-section-content">
          {this.field('地址', 'bjxy_contact_address', '北京市朝阳区滑雪场路 88 号')}
          {this.field('电话', 'bjxy_contact_phone', '400-888-8888')}
          {this.field('微信', 'bjxy_contact_wechat', 'bjxy_ski')}
          {this.field('邮箱', 'bjxy_contact_email', 'hi@bjxy.com')}
        </div>
      </div>
    );
  }

  // Tab 11: 页脚 / 备案号
  // v0.1.0ab: footer 备案号改后台可设置
  // v0.1.2: 加公安备案号 + 网安链接
  renderFooterSection() {
    return (
      <div className="bjxy-section glass-card">
        {this.sectionHead('🦶', '页脚 / 备案号', null, 'footer')}
        <div className="bjxy-section-content">
          {this.field('ICP 备案号', 'bjxy_icp_number', '2026xxxxxx')}
          {this.field('公安备案号', 'bjxy_police_number', '11010102000000')}
          {this.field('网安链接', 'bjxy_police_link', 'http://www.beian.gov.cn/portal/registerSystemInfo')}
        </div>
      </div>
    );
  }

  // v0.1.8 active tab → 对应 render method 映射
  // v0.1.12 改: 删 'bg' case (bg 拿到独立区域, 永远在主页面顶部显示)
  // v0.1.14 改: 删 'bg' case (bg 已经独立到 .bjxy-global-section 区域, 走 renderActiveGlobalSection 切换)
  //   主 10 个可拖 tab 对应 section 走这里
  renderActiveSection() {
    switch (this.activeTab) {
      case 'brand':      return this.renderBrandSection();
      case 'hero':       return this.renderHeroSection();
      case 'about':      return this.renderAboutSection();
      case 'features':   return this.renderFeaturesSection();
      case 'curriculum': return this.renderCurriculumSection();
      case 'coach':      return this.renderCoachSection();
      case 'reviews':    return this.renderReviewsSection();
      case 'events':     return this.renderEventsSection();
      case 'contact':    return this.renderContactSection();
      case 'footer':     return this.renderFooterSection();
      default:           return this.renderBrandSection();
    }
  }

  // Flarum 2.0 ExtensionPage content() — 走 vendor sections().toArray() 框架
  // v0.1.8 重构: 从 8 section 全堆 改成 11 tab 切换, 走 ziven-core 同款结构
  content() {
    if (this.loading) {
      return m('div', { class: 'bjxy-settings' }, m('p', null, '加载中...'));
    }

    return (
      <div className="ExtensionPage bjxy-settings">
        <div className="container">
          {/* 顶部标题 */}
          <div className="bjxy-settings-intro">
            <h2><i className="fas fa-snowflake"></i> 北极雪屿官网配置</h2>
            <p className="desc">配置 /bjxy 页面所有内容 (顶部独立全局设置区 + 下面 10 个可拖 section tab + 后台上传走 ziven-core COS)</p>
          </div>

          {/* v0.1.14: 独立全局设置区 (跟主 tab bar 完全分开, 永远是顶部独立 card)
              辉哥 16:25 拍板: "把颜色渐变做成个tab放到另一个区域里，不要跟那些section的tab放到一起"
              bg tab 走 .bjxy-global-tab-btn (独立样式, 跟主 .bjxy-tab-btn 视觉一致但 class 不同)
              bg section 容器永远在 .bjxy-global-section-content 里 (跟主 .bjxy-section-container 分开) */}
          {this.renderGlobalSection()}

          {/* v0.1.14: 主 section 区 (10 个可拖 tab + 当前 active section 容器) */}
          <div className="bjxy-section-tab-area">
            {this.renderTabBar()}

            {/* 当前 tab 对应的 section */}
            <div className="bjxy-section-container">
              {this.renderActiveSection()}
            </div>
          </div>

          {/* 保存栏 — sticky bottom */}
          <div className="BjxySavebar">
            <button className="btn-secondary" onclick={() => m.redraw()}>取消</button>
            <button
              className="btn-primary"
              onclick={() => this.save()}
              disabled={this.saving}
            >
              {this.saving ? '保存中...' : '保存全部'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ================== 拖拽排序 (v0.1.7 评价/活动) ==================
  // v0.1.7: 评价 / 活动 拖拽排序 (复用 v0.1.4 GroupPickerModal sortablejs 模式)
  //   which: 'reviews' 或 'students', 排序哪个 array
  //   Sortable.create() 创建, onEnd 互换 splice 顺序, m.redraw() 重渲
  initSortable(vnode, which) {
    if (this[`${which}Sortable`]) this[`${which}Sortable`].destroy();
    this[`${which}Sortable`] = Sortable.create(vnode.dom, {
      animation: 150,
      handle: '.BjxyField-array-card-head',  // 拖拽手柄 = 卡片头部 (含 #序号 + 删除按钮)
      ghostClass: 'BjxyField-sortable-ghost',  // 拖拽时 ghost 元素 class
      chosenClass: 'BjxyField-sortable-chosen',  // 选中元素 class
      dragClass: 'BjxyField-sortable-drag',  // 拖拽中元素 class
      onEnd: (e) => {
        if (e.oldIndex === e.newIndex) return;
        const arr = this[which];
        const moved = arr.splice(e.oldIndex, 1)[0];
        arr.splice(e.newIndex, 0, moved);
        m.redraw();
      },
    });
  }

  // 销毁 sortable 实例 (ExtensionPage 切走时 onremove 触发)
  destroySortable(which) {
    if (this[`${which}Sortable`]) {
      this[`${which}Sortable`].destroy();
      this[`${which}Sortable`] = null;
    }
  }

  // ================== 数据加载 ==================
  async loadSettings() {
    try {
      const data = await app.request({
        method: 'GET',
        url: app.forum.attribute('apiUrl') + '/bjxy/settings',
      });
      this.data = data.settings || {};
      // v0.1.15: 读 10 个 section 可见性 setting (bjxy_section_visible_<key>)
      //   旧部署缺这些 setting 时, 默认全部 true (跟 oninit 默认一致, 自动兼容)
      const sectionKeys = ['brand', 'hero', 'about', 'events', 'features', 'curriculum', 'coach', 'reviews', 'contact', 'footer'];
      sectionKeys.forEach(k => {
        const v = this.data['bjxy_section_visible_' + k];
        // '1' / 'true' / true 都算可见; 缺省 / '0' / 'false' 算隐藏
        this.sectionVisible[k] = (v === undefined || v === '' || v === '1' || v === 'true' || v === true);
      });
      // v0.1.9: 读 bjxy_section_order_json 同步 tab 顺序
      //   防御: 解析失败 / 不是数组 / 数组里 key 跟 BJXY_TABS 不匹配时 fallback 到默认
      // v0.1.12 改: 兼容旧 11 个 key 数组 (含 'bg'), filter 掉 'bg' 后用剩下 10 个
      //   旧版本存的 11 key 数组: ['brand','bg','hero','about','events','features','curriculum','coach','reviews','contact','footer']
      //   现状只接收 10 key, 移掉 'bg' 后还能用, 不清空用户的拖拽顺序
      if (this.data.bjxy_section_order_json) {
        try {
          const parsed = JSON.parse(this.data.bjxy_section_order_json);
          if (Array.isArray(parsed)) {
            const validKeys = BJXY_TABS.map(t => t.key);
            // 过滤掉 'bg' + 任何不在 BJXY_TABS 里的 key (v0.1.12 加 'bg' filter)
            const filtered = parsed.filter(k => k !== 'bg' && validKeys.indexOf(k) >= 0);
            // 长度匹配 + 没有重复时采用
            if (filtered.length === DEFAULT_TAB_ORDER.length &&
                new Set(filtered).size === filtered.length) {
              this.tabOrder = filtered;
            }
          }
        } catch (e) {}
      }
      if (this.data.bjxy_features_json) {
        try { this.features = JSON.parse(this.data.bjxy_features_json); } catch (e) {}
      }
      if (this.data.bjxy_curriculum_boards_json) {
        try {
          const parsed = JSON.parse(this.data.bjxy_curriculum_boards_json);
          if (Array.isArray(parsed) && parsed.length > 0) this.boards = parsed;
        } catch (e) {}
      } else if (this.data.bjxy_curriculum_single_json || this.data.bjxy_curriculum_double_json) {
        // 旧数据迁移: 单板/双板 → boards array
        this.boards = [
          { name: '单板', levels: (() => { try { return JSON.parse(this.data.bjxy_curriculum_single_json) || []; } catch (e) { return []; } })() },
          { name: '双板', levels: (() => { try { return JSON.parse(this.data.bjxy_curriculum_double_json) || []; } catch (e) { return []; } })() },
        ];
      }
      if (this.data.bjxy_coach_group_ids) {
        try { this.coachGroupIds = JSON.parse(this.data.bjxy_coach_group_ids); } catch (e) {}
      }
      if (this.data.bjxy_coach_user_ids) {
        try { this.coachUserIds = JSON.parse(this.data.bjxy_coach_user_ids); } catch (e) {}
      }
      if (this.data.bjxy_coach_details) {
        try {
          const arr = JSON.parse(this.data.bjxy_coach_details);
          if (Array.isArray(arr)) {
            this.coachDetails = {};
            arr.forEach(d => {
              if (d && d.userId) {
                // v0.1.10 改: 忽略 photoUrl 字段 (辉哥 15:22 拍板, 教练头像统一用用户自己的)
                this.coachDetails[d.userId] = {
                  bio: d.bio || '',
                  achievements: d.achievements || '',
                  specialties: d.specialties || '',
                };
              }
            });
          }
        } catch (e) {}
      }
      if (this.data.bjxy_reviews) {
        try {
          const arr = JSON.parse(this.data.bjxy_reviews);
          if (Array.isArray(arr)) {
            this.reviews = arr.map(r => ({
              author: r.author || '',
              rating: r.rating || 5,
              text: r.text || '',
              date: r.date || '',
              photos: Array.isArray(r.photos) ? r.photos : (r.photoUrl ? [r.photoUrl] : []),
            }));
          }
        } catch (e) {}
      }
      if (this.data.bjxy_students) {
        try {
          const arr = JSON.parse(this.data.bjxy_students);
          if (Array.isArray(arr)) {
            this.students = arr.map(s => ({
              name: s.name || '',
              level: s.level || '',
              achievement: s.achievement || '',
              photos: Array.isArray(s.photos) ? s.photos : (s.photoUrl ? [s.photoUrl] : []),
              url: s.url || '',
            }));
          }
        } catch (e) {}
      }
      if (this.data.bjxy_events_autoplay_ms) {
        const n = parseInt(this.data.bjxy_events_autoplay_ms, 10);
        if (!isNaN(n) && n >= 500 && n <= 60000) this.eventsAutoplayMs = n;
      }
      const grpData = await app.request({
        method: 'GET',
        url: app.forum.attribute('apiUrl') + '/groups',
        params: { page: { limit: 50 } },
      });
      this.allGroups = (grpData.data || []).map(g => ({
        id: g.id,
        nameSingular: g.attributes.nameSingular,
        userCount: g.attributes.userCount || 0,
      }));
    } catch (e) {
      console.error('bjxy settings load failed', e);
    }
    this.loading = false;
    m.redraw();
  }

  // ================== 教练 user / group ==================
  toggleGroup(id) {
    const idx = this.coachGroupIds.indexOf(id);
    if (idx >= 0) this.coachGroupIds.splice(idx, 1);
    else this.coachGroupIds.push(id);
    m.redraw();
  }

  // v0.1.3 改: 弹真正的 mithril Modal (GroupPickerModal) 替代 v0.1.0f 留的 alert 占位
  // v0.1.3a 修: 弹 modal 前保存 scrollY, modal 关闭后恢复
  // v0.1.4 改: modal 展示的是所选 group 内的 user (不是 group)
  // v0.1.5 改: 回调 onSelect 接收 {userIds, details}, 一起更新
  openGroupModal() {
    const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
    app.modal.show(GroupPickerModal, {
      groupIds: this.coachGroupIds,
      selectedUserIds: this.coachUserIds,
      details: this.coachDetails,
      onSelect: (result) => {
        if (Array.isArray(result)) {
          this.coachUserIds = result;
        } else if (result && Array.isArray(result.userIds)) {
          this.coachUserIds = result.userIds;
          this.coachDetails = result.details || {};
        }
        m.redraw();
      },
      onhide: () => {
        requestAnimationFrame(() => {
          window.scrollTo(0, scrollY);
        });
      },
    });
  }

  // ================== 上传 (v0.1.7 错误处理修复) ==================
  // v0.1.7 修 (重要, 辉哥 11:00 反馈): 之前 `err.message` 是 undefined
  //   vendor RequestError 没 message 属性, 只有 status / responseText / response
  //   修法: 从 err.responseText 解析 server error 字段
  async uploadFile(e, key) {
    e.preventDefault();
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.onchange = async (ev) => {
      const file = ev.target.files[0];
      if (!file) return;
      const form = new FormData();
      form.append('file', file);
      form.append('key', key);
      try {
        // v0.1.0g 修: 删 `headers: { 'Content-Type': null }` (Flarum 2.0 mithril request
        // 把 null 转字符串 "null" 而不是移除 header, server 拿到 Content-Type: null
        // 不会自动转 multipart/form-data, 然后拿不到 form fields → "missing key" 400.
        // 正确做法: 完全不传 headers, 让 app.request 默认行为
        const r = await app.request({
          method: 'POST',
          url: app.forum.attribute('apiUrl') + '/bjxy/upload',
          body: form,
        });
        if (r.ok) {
          this.data[key] = r.url;
          app.alerts.show({ type: 'success' }, '上传成功');
          m.redraw();
        } else {
          app.alerts.show({ type: 'error' }, r.error || '上传失败');
        }
      } catch (err) {
        let errMsg = '上传异常';
        if (err && err.responseText) {
          try {
            const parsed = JSON.parse(err.responseText);
            if (parsed && parsed.error) {
              errMsg = parsed.error;
            } else {
              errMsg = err.responseText;
            }
          } catch (e) {
            errMsg = err.responseText;
          }
        } else if (err && err.status) {
          errMsg = `HTTP ${err.status} 错误`;
        }
        app.alerts.show({ type: 'error' }, errMsg);
      }
    };
    fileInput.click();
  }

  // v0.1.6: 给 array 元素上传文件 (评价 photoUrl / 学员 photoUrl)
  async uploadFileForArray(e, arr, i, field) {
    e.preventDefault();
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.onchange = async (ev) => {
      const file = ev.target.files[0];
      if (!file) return;
      const form = new FormData();
      form.append('file', file);
      form.append('key', 'bjxy_' + (arr === this.reviews ? 'review' : 'student') + '_' + field + '_' + i);
      try {
        const r = await app.request({
          method: 'POST',
          url: app.forum.attribute('apiUrl') + '/bjxy/upload',
          body: form,
        });
        if (r.ok && r.url) {
          arr[i][field] = r.url;
          app.alerts.show({ type: 'success' }, '上传成功');
          m.redraw();
        } else {
          app.alerts.show({ type: 'error' }, r.error || '上传失败');
        }
      } catch (err) {
        let errMsg = '上传异常';
        if (err && err.responseText) {
          try {
            const parsed = JSON.parse(err.responseText);
            if (parsed && parsed.error) errMsg = parsed.error;
            else errMsg = err.responseText;
          } catch (e) {
            errMsg = err.responseText;
          }
        } else if (err && err.status) {
          errMsg = `HTTP ${err.status} 错误`;
        }
        app.alerts.show({ type: 'error' }, errMsg);
      }
    };
    fileInput.click();
  }

  // v0.1.6a: 给 array 元素的 photos 数组追加图片 (评价/活动 多图上传)
  async uploadPhotoToArray(e, arr, i) {
    e.preventDefault();
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.onchange = async (ev) => {
      const file = ev.target.files[0];
      if (!file) return;
      const form = new FormData();
      form.append('file', file);
      const kind = arr === this.reviews ? 'review' : 'event';
      form.append('key', 'bjxy_' + kind + '_photo_' + i + '_' + Date.now());
      try {
        const r = await app.request({
          method: 'POST',
          url: app.forum.attribute('apiUrl') + '/bjxy/upload',
          body: form,
        });
        if (r.ok && r.url) {
          if (!Array.isArray(arr[i].photos)) arr[i].photos = [];
          arr[i].photos.push(r.url);
          app.alerts.show({ type: 'success' }, '图片上传成功 (' + arr[i].photos.length + ' 张)');
          m.redraw();
        } else {
          app.alerts.show({ type: 'error' }, r.error || '上传失败');
        }
      } catch (err) {
        let errMsg = '上传异常';
        if (err && err.responseText) {
          try {
            const parsed = JSON.parse(err.responseText);
            if (parsed && parsed.error) errMsg = parsed.error;
            else errMsg = err.responseText;
          } catch (e) {
            errMsg = err.responseText;
          }
        } else if (err && err.status) {
          errMsg = `HTTP ${err.status} 错误`;
        }
        app.alerts.show({ type: 'error' }, errMsg);
      }
    };
    fileInput.click();
  }

  // ================== 保存 ==================
  async save() {
    this.saving = true;
    m.redraw();
    const payload = Object.assign({}, this.data);
    // v0.1.9: tab 顺序持久化 (前台 BjxyPage.jsx 读这个 settings 渲染 8 主体 section 顺序)
    payload.bjxy_section_order_json = JSON.stringify(this.tabOrder);
    // v0.1.15: 10 个 section 可见性持久化 (前台 BjxyPage.jsx 读这些 settings 过滤掉 visible=false 的)
    //   '1' = 展示, '0' = 隐藏, 前台 getSectionOrder() 过滤 + footer 单独判断
    const sectionKeys = ['brand', 'hero', 'about', 'events', 'features', 'curriculum', 'coach', 'reviews', 'contact', 'footer'];
    sectionKeys.forEach(k => {
      payload['bjxy_section_visible_' + k] = this.sectionVisible[k] !== false ? '1' : '0';
    });
    payload.bjxy_features_json = JSON.stringify(
      this.features.filter(f => f && f.title && f.title.trim() && f.desc && f.desc.trim())
    );
    payload.bjxy_curriculum_boards_json = JSON.stringify(this.boards);
    payload.bjxy_coach_group_ids = JSON.stringify(this.coachGroupIds);
    payload.bjxy_coach_user_ids = JSON.stringify(this.coachUserIds);
    payload.bjxy_coach_details = JSON.stringify(
      // v0.1.10 改: 删 photoUrl 字段, 只存 bio/achievements/specialties
      this.coachUserIds
        .filter(uid => this.coachDetails[uid] && (this.coachDetails[uid].bio || this.coachDetails[uid].achievements || this.coachDetails[uid].specialties))
        .map(uid => ({
          userId: uid,
          bio: this.coachDetails[uid].bio,
          achievements: this.coachDetails[uid].achievements,
          specialties: this.coachDetails[uid].specialties,
        }))
    );
    payload.bjxy_reviews = JSON.stringify(
      this.reviews.filter(r => r.author || r.text || (r.photos && r.photos.length > 0))
        .map(r => ({ author: r.author, rating: r.rating, text: r.text, date: r.date, photos: r.photos || [] }))
    );
    payload.bjxy_students = JSON.stringify(
      this.students.filter(s => s.name || (s.photos && s.photos.length > 0))
        .map(s => ({ name: s.name, level: s.level, achievement: s.achievement, photos: s.photos || [], url: s.url || '' }))
    );
    const ms = parseInt(this.eventsAutoplayMs, 10);
    payload.bjxy_events_autoplay_ms = (!isNaN(ms) && ms >= 500 && ms <= 60000) ? String(ms) : '3000';
    try {
      await app.request({
        method: 'POST',
        url: app.forum.attribute('apiUrl') + '/bjxy/settings',
        body: payload,
      });
      app.alerts.show({ type: 'success' }, '保存成功');
    } catch (e) {
      app.alerts.show({ type: 'error' }, '保存失败: ' + e.message);
    }
    this.saving = false;
    m.redraw();
  }
}
