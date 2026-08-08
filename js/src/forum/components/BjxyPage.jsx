// BjxyPage.jsx — /bjxy 页面 8 section 完整渲染
// v0.1.0i 修: 之前 class 命名跟 less/forum.less 不一致, 全部 grid / card / hover styles 没生效
//   改成跟 less 对齐的命名: .bjxy-section / .bjxy-feature / .bjxy-stat / .bjxy-coach
//   .bjxy-curri-tabs / .bjxy-curri-tab / .bjxy-level-card / .bjxy-section .bjxy-sub
// 8 section settings 走 app.forum.attribute('bjxy_*') (SOP 56)
// 17 级 + 6 特色 走 app.data.bjxyCurriculum / bjxyFeatures (vendor custom payload)
// v0.1.6a: 评价多图 (大众点评风格) + 活动展示 swiper 轮播 + 复用 ziven-core fancybox
//   复用 ziven-core 的 app.fancyboxOpen 跟 window.Fancybox (ziven-core/forum/index.js 静态加载)
//   swiper 走本地 npm install (跟 sortablejs v0.1.4 一样路线)
import app from 'flarum/forum/app';
import Component from 'flarum/common/Component';
// v0.1.6a: 引入 swiper ES module
// v0.1.6c 改: swiper 11 navigation/pagination 是独立 modules, 必须显式 import + 传 modules: [...]
//   之前 v0.1.6a+b 只 import Swiper default, swiper 11 默认不 attach navigation/pagination
//   (modules 数组只有 ['0', '1'] 表示 core + virtual), 按钮 click 没绑 event
//   辉哥 12:55 反馈 "swiper 左右切换箭头点击没效果", 确认 navigation 初始化失败
import Swiper from 'swiper';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';

const DEFAULT_BRAND = '北极雪屿';
const DEFAULT_SLOGAN = '室内滑雪 · 全国连锁';

export default class BjxyPage extends Component {
  // v0.1.22: /bjxy 路径 title 改为品牌名 + 品牌副标 (辉哥 18:38 新需求)
  //   override vendor Page.setTitle() 默认行为 (vendor Page L89-91 / IndexPage L89-92):
  //     app.setTitle(extractText(app.translator.trans('core.forum.index.meta_title_text'))) + setTitleCount(0)
  //   不调 vendor 默认 setTitle, 完全自定义. 走 bjxy_brand_name / bjxy_brand_slogan setting,
  //   后台 '品牌信息' tab 配置 (BjxySettings.jsx L511-519), 留空时 fallback 到 '北极雪屿' + '室内滑雪 · 全国连锁'
  setTitle() {
    const brandName = app.forum.attribute('bjxy_brand_name') || DEFAULT_BRAND;
    const brandSlogan = app.forum.attribute('bjxy_brand_slogan') || DEFAULT_SLOGAN;
    app.setTitle(brandName + ' · ' + brandSlogan);
    app.setTitleCount(0);
  }

  oninit(vnode) {
    super.oninit(vnode);
    this.coaches = [];
    this.loadingCoaches = true;
    // v0.1.0s 改: activeBoard 从 string 'single' 改成 index (0/1/2...)
    //   因为现在 boards 数组任意多类型, 不再固定 2 个
    this.activeBoard = 0;
  }

  // v0.1.6: 评分转 ★☆ 字符串 (1-5 整数)
  renderStars(rating) {
    const r = Math.max(1, Math.min(5, parseInt(rating) || 5));
    return '★'.repeat(r) + '☆'.repeat(5 - r);
  }

  // v0.1.6a: fancybox 多图 gallery 工具
  //   复用 ziven-core 的 window.Fancybox (ziven-core/forum/index.js 静态加载)
  //   直接调 Fancybox.show 不依赖 app.fancyboxOpen (那个只支持单图)
  //   等 window.Fancybox 加载完成 (ziven-core 是静默加载, 可能 page render 时还没好)
  openFancyboxGallery(urls, idx = 0) {
    if (!urls || urls.length === 0) return;
    const doOpen = () => {
      if (window.Fancybox && window.Fancybox.show) {
        window.Fancybox.show(
          urls.map(u => ({ src: u, type: 'image' })),
          {
            startIndex: idx,
            dragToClose: false,
          }
        );
      } else {
        console.warn('Fancybox not loaded yet, retry...');
      }
    };
    if (window.Fancybox && window.Fancybox.show) {
      doOpen();
    } else {
      // 触发 ziven-core 加载, 然后轮询等
      if (app && app.fancyboxOpen) app.fancyboxOpen(urls[0]);
      let attempts = 0;
      const check = setInterval(() => {
        attempts++;
        if (window.Fancybox && window.Fancybox.show) {
          clearInterval(check);
          doOpen();
        } else if (attempts > 50) {
          clearInterval(check);
          console.error('Fancybox load timeout');
        }
      }, 100);
    }
  }

  // v0.1.6a: swiper 初始化 (评价/活动 轮播)
  //   vnode.dom 是 swiper container
  //   onremove 时销毁避免内存泄漏
  // v0.1.6c 改: 加 modules: [Navigation, Pagination]
  // v0.1.6g 改: 加 Autoplay module, delay 从 bjxy_events_autoplay_ms setting 读
  //   delay 默认 3000ms, disableOnInteraction=false 用户操作后继续自动轮播
  initSwiper(vnode) {
    if (!vnode || !vnode.dom) return;
    if (this.swiper) this.swiper.destroy(true, true);
    const autoplayMs = parseInt(app.forum.attribute('bjxy_events_autoplay_ms'), 10) || 3000;
    this.swiper = new Swiper(vnode.dom, {
      // v0.1.6c: 必须传 modules, 不传 swiper 11 navigation/pagination 不会 attach
      // v0.1.6g: 加 Autoplay module (SOP 90)
      modules: [Navigation, Pagination, Autoplay],
      loop: true,
      slidesPerView: 1,
      spaceBetween: 16,
      pagination: { el: vnode.dom.querySelector('.swiper-pagination'), clickable: true },
      // v0.1.6g: 自动轮播配置 (后台 bjxy_events_autoplay_ms, 默认 3000ms)
      autoplay: {
        delay: autoplayMs,
        disableOnInteraction: false,
      },
    });
  }

  // v0.1.30 改: 教练列表 swiper peek carousel (辉哥 11:08 反馈, 11:10 拍板 B 方案)
  //   - 经典 macOS App Store / iOS Music 风格: 1 张完整 + 0.2 张 peek
  //   - 复用 swiper 11 依赖 (v0.1.6 装 events 用), 跟 events section 同款 swiper pattern
  //   - 跟 this.swiper 独立 instance, onremove 各自 destroy
  initCoachSwiper(vnode) {
    if (!vnode || !vnode.dom) return;
    if (this.coachSwiper) this.coachSwiper.destroy(true, true);
    this.coachSwiper = new Swiper(vnode.dom, {
      // 不需要 Autoplay, 教练列表静态展示
      modules: [Navigation, Pagination],
      slidesPerView: 1.2,
      slidesPerGroup: 1,
      spaceBetween: 16,
      // 响应式: desktop 1.2 (1 张完整 + 0.2 张 peek ≈ 100px), mobile 1.1 (1 张完整 + 0.1 张 peek ≈ 30px)
      breakpoints: {
        0:    { slidesPerView: 1.1 },  // mobile
        768:  { slidesPerView: 1.2 },  // tablet/desktop
      },
      pagination: {
        el: vnode.dom.querySelector('.swiper-pagination'),
        clickable: true,
      },
    });
  }

  // 销毁 events swiper
  destroySwiper() {
    if (this.swiper) {
      this.swiper.destroy(true, true);
      this.swiper = null;
    }
  }

  // 销毁教练 swiper
  // v0.1.30 改: 多 swiper instance, coach swiper 独立 destroy
  destroyCoachSwiper() {
    if (this.coachSwiper) {
      this.coachSwiper.destroy(true, true);
      this.coachSwiper = null;
    }
  }

  // 组件销毁时清理
  // v0.1.30 改: 多 swiper instance, events + coach 各自 destroy
  onremove() {
    this.destroySwiper();
    this.destroyCoachSwiper();
  }

  view() {
    // v0.1.0l 修: extend.php 用 Extend\Settings::serializeToForum() 把 bjxy_* 加进
    //   forum.attributes, 前台 app.forum.attribute('bjxy_*') 直接拿到 (跟走 vendor 一样)
    //   之前 v0.1.0k 走 content() payload hack 失败 (container null), 现在用 vendor 正规 API
    const s = (key, fallback) => app.forum.attribute(key) || fallback;
    // v0.1.0s 改: curriculum 从 {single, double} 重构成 boards array
    //   兼容旧 data: 如果没 boards 字段但有 single/double, 自动转成 2 个 board
    const curriculumRaw = (app.data && app.data.bjxyCurriculum) || {};
    const curriculum = {
      boards: Array.isArray(curriculumRaw.boards) ? curriculumRaw.boards : [
        { name: '单板', levels: curriculumRaw.single || [] },
        { name: '双板', levels: curriculumRaw.double || [] },
      ],
    };
    const features = (app.data && app.data.bjxyFeatures) || [];
    // v0.1.6e 改: 过滤空 desc 的特色项, 避免 6+1 布局不平衡 (移动端 2 列变 3+3+1 孤零零)
    //   辉哥 14:04 反馈 "后台办学特色中的内容在移动端右侧出视界了"
    //   根因: 后台"添加特色"按钮会 push 一个空 desc 的占位项, 用户没填就保存, 布局不齐
    //   修法: 前端过滤 title 或 desc 为空的项, 不渲染; 6 项默认 = 桌面 2 行 3 列 + 移动 3 行 2 列 (整齐)
    const visibleFeatures = features.filter(f => f && f.title && f.desc);
    // v0.1.7a 改: 删 bjxy_reviews_html + bjxy_students_html fallback 读取
    //   老的 HTML 自由区字段已经废弃, 评价/活动统一用结构化 JSON
    // v0.1.6: 评价 + 学员结构化 JSON (替代 HTML 自由区)
    //   app.forum.attribute 拿 string, JSON.parse 转 array
    const reviews = (() => {
      const raw = s('bjxy_reviews', '[]');
      if (!raw) return [];
      try { const arr = JSON.parse(raw); return Array.isArray(arr) ? arr : []; } catch (e) { return []; }
    })();
    // v0.1.6a: 学员 → 活动 (仍读 bjxy_students setting, 但展示为"活动")
    const events = (() => {
      const raw = s('bjxy_students', '[]');
      if (!raw) return [];
      try { const arr = JSON.parse(raw); return Array.isArray(arr) ? arr : []; } catch (e) { return []; }
    })();

    // v0.1.0y: 背景渐变从 .bjxy-page block 背景, 抽到内部第一个 .bjxy-page-bg
    //   position: fixed; inset: 0 → 背景永远铺满 viewport (1vh), 不再随 body 拉长
    //   JS 监听 scroll 改 backgroundPositionY 0.1x → 滚动时背景微小视差移动
    //   (辉哥 15:21 反馈 "背景渐变不要从顶部到页面尾部, 维持在可视范围, 滚动时只有微小移动")
    // v0.1.0z: 加 2 个背景图 settings (走 ziven-core COS 上传)
    //   有图 → background: url(...), 渐变不生效 (图片优先级高)
    //   没图 → 4 色渐变生效 (v0.1.0j+y)
    const ls = s('bjxy_bg_gradient_light_start', '#E0EBF8') || '#E0EBF8';
    const le = s('bjxy_bg_gradient_light_end', '#F7FAFC') || '#F7FAFC';
    const ds = s('bjxy_bg_gradient_dark_start', '#0F1419') || '#0F1419';
    const de = s('bjxy_bg_gradient_dark_end', '#1A202C') || '#1A202C';
    const imgLight = s('bjxy_bg_image_light_url', '');
    const imgDark = s('bjxy_bg_image_dark_url', '');

    return [
      // v0.1.0j+y+z+aa: 注入背景 CSS
      //   浅色 / 深色模式分别走 [data-theme^="dark"] selector
      //   v0.1.0y 改: 目标从 .bjxy-page 改成 .bjxy-page-bg (position: fixed)
      //   v0.1.0z 改: 有图用图 (cover + center), 没图用 4 色渐变
      //   v0.1.0aa 改: 渐变方向 135deg → 180deg (top→bottom 垂直)
      //     跟 body 垂直滚动方向一致, 视觉更自然
      //     用 background-image: (而不是 background: 简写) 避免重置 background-size 100% 300vh
      m('style', {
        oncreate: ({ dom }) => {
          // 浅色: 图 > 渐变
          const lightBg = imgLight
            ? `url("${imgLight}") center / cover no-repeat`
            : `linear-gradient(180deg, ${ls}, ${le})`;
          // 深色: 图 > 渐变
          const darkBg = imgDark
            ? `url("${imgDark}") center / cover no-repeat`
            : `linear-gradient(180deg, ${ds}, ${de})`;
          dom.textContent = `
.bjxy-page-bg { background-image: ${lightBg}; }
[data-theme^="dark"] .bjxy-page-bg { background-image: ${darkBg}; }
`;
        },
      }),
      m('div', {
        class: 'bjxy-page',
        // v0.1.0y: 视差背景 div, position: fixed 在 viewport
        // 滚动 scrollY * 0.1 px → 背景 backgroundPositionY 反向微移
        oncreate: ({ dom }) => {
          const bgEl = dom.firstElementChild;
          if (!bgEl || !bgEl.classList.contains('bjxy-page-bg')) return;
          this._bgParallax = () => {
            // v0.1.0aa 改: 渐变图 background-size 100% 300vh (比 viewport 大 3 倍)
            //   视差 0.1x scrollY 让背景从 div 顶部往上推 (Y 变成负值)
            //   viewport 永远看到渐变图 0-33% 区段 (起始色附近), 不会看到结束色
            const offset = window.scrollY * 0.1;
            bgEl.style.backgroundPositionY = `calc(0px - ${offset}px)`;
          };
          window.addEventListener('scroll', this._bgParallax, { passive: true });
          this._bgParallax();
        },
        onremove: () => {
          if (this._bgParallax) {
            window.removeEventListener('scroll', this._bgParallax);
            this._bgParallax = null;
          }
        },
      }, [
        // v0.1.0y: 视差背景 div (固定在 viewport, JS 改 backgroundPositionY)
        m('div', { class: 'bjxy-page-bg' }),

      // ===== 导航 =====
      // v0.1.9: 导航链接顺序也跟着 bjxy_section_order_json 走 (过滤掉 brand/bg/footer)
      //   跟 v0.1.8 之前 hard-coded 顺序 (关于/活动/特色/教学/教练/评价/联系) 保持 fallback 兼容
      m('nav', { class: 'bjxy-nav' }, [
        m('div', { class: 'bjxy-logo' }, [
          s('bjxy_brand_logo_url')
            ? m('img', { class: 'bjxy-logo-img', src: s('bjxy_brand_logo_url'), alt: s('bjxy_brand_name', DEFAULT_BRAND) })
            : m('div', { class: 'bjxy-logo-fallback' }, (s('bjxy_brand_name', DEFAULT_BRAND) || 'BJ').substring(0, 2)),
          m('div', { class: 'bjxy-logo-slogan' }, [
            m('div', null, s('bjxy_brand_name', DEFAULT_BRAND)),
            m('small', null, s('bjxy_brand_slogan', DEFAULT_SLOGAN)),
          ]),
        ]),
        m('div', { class: 'bjxy-nav-links' },
          this.getSectionOrder().map(k => {
            // nav link 跟 section id 一一对应 (复用现有 8 section anchor)
            const navMap = { about: '关于', events: '活动', features: '特色', curriculum: '教学', coach: '教练', reviews: '评价', contact: '联系' };
            return navMap[k] ? m('a', { href: '#' + k, key: 'nav-' + k }, navMap[k]) : null;
          }).filter(Boolean)
        ),
        m('div', { class: 'bjxy-nav-right' }, [
          m('a', { href: '#contact', class: 'bjxy-btn bjxy-btn-primary' }, s('bjxy_hero_cta_text', '立即咨询')),
        ]),
      ]),

      // ===== 8 主体 section (顺序由 bjxy_section_order_json 决定) =====
      // v0.1.9: 重构成 renderXxxSection() 函数 + 按 order 遍历
      //   之前 v0.1.6b 沉淀: hero → about → events → features → curriculum → coach → reviews → contact
      //   现在从 bjxy_section_order_json 读顺序 (后台可拖拽调整)
      //   brand/bg 是全局设置不渲染独立 section, footer 永远最底
      this.getSectionOrder().map(k => this.renderSectionByKey(k, { s, events, reviews, visibleFeatures, curriculum })),

      // ===== footer (永远在最底, 不参与排序) =====
      // v0.1.0ab 改: 备案号从 bjxy_icp_number setting 读 (后台可设)
      //   留空时 fallback 到默认 '2026xxxxxx' (跟之前 hard-coded 一致, 兼容旧部署)
      // v0.1.2 改: 加 公安备案号 + 网安链接 (国家规定中国大陆站点 footer 必须有)
      //   留空时不渲染公安备案行 (避免显示空链接)
      // v0.1.15 改: 走 isSectionVisible('footer') 判断, 关闭时不渲染整个 footer
      this.isSectionVisible('footer') ? m('footer', { class: 'bjxy-footer' }, [
        m('div', { class: 'bjxy-footer-line' }, '© ' + new Date().getFullYear() + ' ' + s('bjxy_brand_name', DEFAULT_BRAND) + ' · ICP 备 ' + (s('bjxy_icp_number', '2026xxxxxx') || '2026xxxxxx') + ' 号'),
        s('bjxy_police_number') ? m('div', { class: 'bjxy-footer-line' }, [
          m('img', { class: 'bjxy-footer-police-icon', src: 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="14" height="14"><path fill="#fff" d="M10 1l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V4l8-3zm0 2.2L4 5.4V10c0 4 2.7 6.8 6 7.3 3.3-.5 6-3.3 6-7.3V5.4l-6-2.2zM7 8h6v1H7V8zm0 2h6v1H7v-1zm0 2h4v1H7v-1z"/></svg>'), alt: '公安备案' }),
          ' ',
          m('a', { href: s('bjxy_police_link', 'http://www.beian.gov.cn/portal/registerSystemInfo') || 'http://www.beian.gov.cn/portal/registerSystemInfo', target: '_blank', rel: 'noopener noreferrer', class: 'bjxy-footer-link' }, '京公网安备 ' + s('bjxy_police_number', '') + ' 号'),
        ]) : null,
      ]) : null,
      ]),
    ];
  }

  // v0.1.9: 读 bjxy_section_order_json 解析成数组, 过滤掉 brand/bg/footer
  //   防御: 解析失败 / 不是数组 / 数组里 key 不对时 fallback 到默认顺序
  // v0.1.15 改: 额外过滤掉 visible=false 的 section (走 bjxy_section_visible_<key> setting)
  //   辉哥 18:19 拍板: "只有在开启时前端对应的section才展示"
  //   footer 单独判断 (走 isSectionVisible('footer') 控制, 不参与主 section 列表)
  getSectionOrder() {
    const DEFAULT_SECTION_ORDER = ['hero', 'about', 'events', 'features', 'curriculum', 'coach', 'reviews', 'contact'];
    const raw = app.forum.attribute('bjxy_section_order_json');
    if (!raw) return DEFAULT_SECTION_ORDER.filter(k => this.isSectionVisible(k));
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // 过滤掉 brand / bg / footer (这 3 个不渲染独立 section) + visible=false 的
        const mainSections = parsed
          .filter(k => k !== 'brand' && k !== 'bg' && k !== 'footer')
          .filter(k => this.isSectionVisible(k));
        // 验证剩下 8 个主体 section key 都有
        if (mainSections.length === DEFAULT_SECTION_ORDER.filter(k => this.isSectionVisible(k)).length) {
          const validKeys = DEFAULT_SECTION_ORDER;
          const allValid = mainSections.every(k => validKeys.indexOf(k) >= 0);
          if (allValid) return mainSections;
        }
      }
    } catch (e) {}
    return DEFAULT_SECTION_ORDER.filter(k => this.isSectionVisible(k));
  }

  // v0.1.15: 判断 section 是否可见 (读 bjxy_section_visible_<key> setting)
  //   默认 true (旧部署缺 setting 时全部展示, 跟开关默认开启一致)
  //   '1' / 'true' / true 算可见; 其他 (含 '0' / 'false' / 缺省) 算可见 (默认)
  isSectionVisible(key) {
    const v = app.forum.attribute('bjxy_section_visible_' + key);
    if (v === '0' || v === 'false' || v === false) return false;
    return true;  // 默认可见 (跟 oninit 默认一致, 兼容旧部署)
  }

  // v0.1.9: 按 key 调用对应 renderXxxSection 方法
  //   跟 v0.1.6b 沉淀的 section class 一致: hero/约/features/curriculum 走 alt, 其他走 normal
  //   保留 v0.1.6b section 顺序: about(events 移走) → events 跟 alt 交替
  //   hero 是 page 顶部特殊 section (跟其他 section 视觉差异大), 不走 bjxy-section/bjxy-section-alt
  renderSectionByKey(key, ctx) {
    const { s, events, reviews, visibleFeatures, curriculum } = ctx;
    switch (key) {
      case 'hero':       return this.renderHeroSection(s);
      case 'about':      return this.renderAboutSection(s);
      case 'events':     return this.renderEventsSection(events, s);
      case 'features':   return this.renderFeaturesSection(visibleFeatures);
      case 'curriculum': return this.renderCurriculumSection(curriculum);
      case 'coach':      return this.renderCoachSection(s);
      case 'reviews':    return this.renderReviewsSection(reviews);
      case 'contact':    return this.renderContactSection(s);
      default: return null;
    }
  }

  // v0.1.9: 8 主体 section 渲染方法 (从 view() 提取)
  //   每个方法返回 1 个 m() 节点, 跟 v0.1.6b 沉淀的 HTML 结构 1:1 一致

  // Hero
  renderHeroSection(s) {
    return m('section', { class: 'bjxy-hero', id: 'hero', key: 'sec-hero' }, [
      m('div', { class: 'bjxy-hero-text' }, [
        m('h1', null, [s('bjxy_hero_title', '探索极致的滑雪体验。')]),
        m('p', null, s('bjxy_hero_subtitle', '专注滑雪领域的全国连锁机构, 17 级渐进教学体系 + 认证教练 + 全国品牌机构。')),
        m('div', { class: 'bjxy-hero-cta-row' }, [
          m('a', { href: s('bjxy_hero_cta_link', '#contact'), class: 'bjxy-btn bjxy-btn-primary' }, s('bjxy_hero_cta_text', '立即咨询')),
        ]),
        m('div', { class: 'bjxy-hero-features' }, [
          m('div', { class: 'bjxy-hero-feature' }, [m('span', { class: 'check' }, '✓'), m('strong', null, s('bjxy_about_stat_1_num', '10+')), ' ' + s('bjxy_about_stat_1_label', '年教学经验')]),
          m('div', { class: 'bjxy-hero-feature' }, [m('span', { class: 'check' }, '✓'), m('strong', null, s('bjxy_about_stat_2_num', '50+')), ' ' + s('bjxy_about_stat_2_label', '专业教练')]),
          m('div', { class: 'bjxy-hero-feature' }, [m('span', { class: 'check' }, '✓'), m('strong', null, s('bjxy_about_stat_3_num', '1000+')), ' ' + s('bjxy_about_stat_3_label', '毕业学员')]),
        ]),
      ]),
      m('div', { class: 'bjxy-hero-banner' }, [
        s('bjxy_hero_banner_light') ? m('img', { class: 'bjxy-hero-banner-light', src: s('bjxy_hero_banner_light'), alt: 'Hero' }) : null,
        s('bjxy_hero_banner_dark') ? m('img', { class: 'bjxy-hero-banner-dark', src: s('bjxy_hero_banner_dark'), alt: 'Hero Dark' }) : null,
        (!s('bjxy_hero_banner_light') && !s('bjxy_hero_banner_dark')) ? m('div', { class: 'bjxy-hero-banner-fallback' }, [
          m('div', { class: 'bjxy-hero-banner-fallback-name' }, s('bjxy_brand_name', DEFAULT_BRAND)),
          m('div', { class: 'bjxy-hero-banner-fallback-slogan' }, s('bjxy_brand_slogan', DEFAULT_SLOGAN)),
        ]) : null,
      ]),
    ]);
  }

  // 关于
  renderAboutSection(s) {
    return m('section', { class: 'bjxy-section', id: 'about', key: 'sec-about' }, [
      m('div', { class: 'bjxy-sub' }, s('bjxy_about_sub', 'ABOUT US')),
      m('h2', null, s('bjxy_about_title', '关于北极雪屿')),
      m('p', null, s('bjxy_about_desc', '北极雪屿室内滑雪成立于 2024 年, 专注滑雪领域的全国连锁机构...')),
      m('div', { class: 'bjxy-stats' }, [
        m('div', { class: 'bjxy-stat' }, [m('div', { class: 'bjxy-stat-num' }, s('bjxy_about_stat_1_num', '10+')), m('div', { class: 'bjxy-stat-label' }, s('bjxy_about_stat_1_label', '年教学经验'))]),
        m('div', { class: 'bjxy-stat' }, [m('div', { class: 'bjxy-stat-num' }, s('bjxy_about_stat_2_num', '50+')), m('div', { class: 'bjxy-stat-label' }, s('bjxy_about_stat_2_label', '专业教练'))]),
        m('div', { class: 'bjxy-stat' }, [m('div', { class: 'bjxy-stat-num' }, s('bjxy_about_stat_3_num', '1000+')), m('div', { class: 'bjxy-stat-label' }, s('bjxy_about_stat_3_label', '毕业学员'))]),
      ]),
    ]);
  }

  // 活动展示
  // v0.1.6b 改: 从尾部移到关于下方 (v0.1.9 现在按 order 决定位置)
  // v0.1.6d: 活动展示支持点击跳转 URL
  renderEventsSection(events, s) {
    return m('section', { class: 'bjxy-section bjxy-section-alt', id: 'events', key: 'sec-events' }, [
      m('div', { class: 'bjxy-sub' }, 'EVENTS'),
      m('h2', null, '活动展示'),
      events.length > 0
        ? m('div', { class: 'bjxy-event-swiper swiper', oncreate: (vnode) => this.initSwiper(vnode) }, [
            m('div', { class: 'swiper-wrapper' },
              events.map((ev, i) => {
                const photos = Array.isArray(ev.photos) ? ev.photos : (ev.photoUrl ? [ev.photoUrl] : []);
                const firstPhoto = photos[0];
                const url = (ev.url || '').trim();
                const isInternal = url.startsWith('/') && !url.startsWith('//');
                const hasUrl = url.length > 0;
                return m('div', { class: 'swiper-slide bjxy-event-slide', key: 'ev' + i }, [
                  firstPhoto
                    ? (hasUrl
                        ? (isInternal
                            ? m('a', {
                                class: 'bjxy-event-photo',
                                style: { backgroundImage: 'url(' + firstPhoto + ')' },
                                href: url,
                                onclick: (e) => { e.preventDefault(); m.route.set(url); },
                              })
                            : m('a', {
                                class: 'bjxy-event-photo',
                                style: { backgroundImage: 'url(' + firstPhoto + ')' },
                                href: url,
                                target: '_blank',
                                rel: 'noopener noreferrer',
                              })
                          )
                        : m('a', {
                            class: 'bjxy-event-photo',
                            style: { backgroundImage: 'url(' + firstPhoto + ')' },
                            onclick: (e) => { e.preventDefault(); this.openFancyboxGallery(photos, 0); },
                          })
                      )
                    : m('div', { class: 'bjxy-event-photo bjxy-event-photo-empty' }),
                  hasUrl
                    ? (isInternal
                        ? m('a', {
                            class: 'bjxy-event-info bjxy-event-link',
                            href: url,
                            onclick: (e) => { e.preventDefault(); m.route.set(url); },
                          }, [
                            m('div', { class: 'bjxy-event-name' }, ev.name || '活动 #' + (i + 1)),
                            ev.level ? m('div', { class: 'bjxy-event-level' }, ev.level) : null,
                            ev.achievement ? m('div', { class: 'bjxy-event-desc' }, ev.achievement) : null,
                            photos.length > 1 ? m('div', { class: 'bjxy-event-photo-count' }, '📷 ' + photos.length + ' 张, 点击查看全部') : null,
                          ])
                        : m('a', {
                            class: 'bjxy-event-info bjxy-event-link',
                            href: url,
                            target: '_blank',
                            rel: 'noopener noreferrer',
                          }, [
                            m('div', { class: 'bjxy-event-name' }, ev.name || '活动 #' + (i + 1)),
                            ev.level ? m('div', { class: 'bjxy-event-level' }, ev.level) : null,
                            ev.achievement ? m('div', { class: 'bjxy-event-desc' }, ev.achievement) : null,
                            photos.length > 1 ? m('div', { class: 'bjxy-event-photo-count' }, '📷 ' + photos.length + ' 张, 点击查看全部') : null,
                          ])
                      )
                    : m('div', { class: 'bjxy-event-info' }, [
                        m('div', { class: 'bjxy-event-name' }, ev.name || '活动 #' + (i + 1)),
                        ev.level ? m('div', { class: 'bjxy-event-level' }, ev.level) : null,
                        ev.achievement ? m('div', { class: 'bjxy-event-desc' }, ev.achievement) : null,
                        photos.length > 1 ? m('div', { class: 'bjxy-event-photo-count' }, '📷 ' + photos.length + ' 张, 点击查看全部') : null,
                      ]),
                ]);
              })
            ),
            m('div', { class: 'swiper-pagination' }),
          ])
        : m('p', null, '（暂无活动展示, 请在后台添加）'),
    ]);
  }

  // 特色
  // v0.1.6h: 改玻璃拟态 (辉哥 16:06 选 A 方案)
  // v0.1.33 改 (辉哥 14:38 反馈):
  //   桌面端改 Bento 网格 (前 2 个 bjxy-feature-large + 后 4 个常规, 6 列 grid span 3 / span 2)
  //   移动端保持 1 列堆叠 (less @phone media query)
  //   每条支持背景图 + 黑色遮罩层 (opacity 走 bjxy_feature_card_overlay_opacity setting, 默认 0.5)
  //   有背景图时文字改白 (黑遮罩后深色文字看不清)
  renderFeaturesSection(visibleFeatures) {
    const overlayOpacity = parseInt(app.forum.attribute('bjxy_feature_card_overlay_opacity') || '50', 10) / 100;
    return m('section', { class: 'bjxy-section bjxy-section-alt bjxy-features-glass', id: 'features', key: 'sec-features' }, [
      m('div', { class: 'bjxy-section-head' }, [
        m('div', { class: 'bjxy-features-eyebrow' }, 'Why Choose Us'),
        m('h2', null, '为什么选择北极雪屿'),
        m('p', { class: 'bjxy-features-sub' }, '从环境到教练, 从课程到装备, 每一个细节都为你精心准备'),
      ]),
      m('div', { class: 'bjxy-feature-grid' }, visibleFeatures.map((f, i) => m('div', {
        class: 'bjxy-feature' + (i < 2 ? ' bjxy-feature-large' : ''),
        key: 'f' + i,
      }, [
        // v0.1.33 改: 背景图 (可选) + 黑色遮罩层 (opacity 走 setting)
        f.bgImageUrl ? m('div', { class: 'bjxy-feature-bg' }, [
          m('img', { src: f.bgImageUrl, alt: '' }),
          m('div', { class: 'bjxy-feature-mask', style: 'opacity: ' + overlayOpacity }),
        ]) : null,
        m('div', { class: 'bjxy-feature-content' }, [
          m('span', { class: 'bjxy-feature-num' }, String(i + 1).padStart(2, '0')),
          m('div', { class: 'bjxy-feature-icon' }, f.icon || '★'),
          m('h3', null, f.title || ''),
          m('p', null, f.desc || ''),
        ]),
      ]))),
    ]);
  }

  // 教学体系
  // v0.1.0s 改: boards 数组任意多类型
  renderCurriculumSection(curriculum) {
    return m('section', { class: 'bjxy-section bjxy-section-alt', id: 'curriculum', key: 'sec-curriculum' }, [
      m('div', { class: 'bjxy-sub' }, 'CURRICULUM'),
      m('h2', null, curriculum.boards.reduce((sum, b) => sum + b.levels.length, 0) + ' 级教学体系'),
      m('div', { class: 'bjxy-curri-tabs' }, [
        curriculum.boards.map((b, i) => m('div', {
          class: 'bjxy-curri-tab' + (this.activeBoard === i ? ' active' : ''),
          onclick: () => { this.activeBoard = i; },
          key: 'tab' + i,
        }, b.name + ' (' + b.levels.length + ' 级)')),
      ]),
      m('div', { class: 'bjxy-curri-list' },
        (curriculum.boards[this.activeBoard] ? curriculum.boards[this.activeBoard].levels : []).map((l, i) => m('div', { class: 'bjxy-level-card', key: 'c' + i }, [
          m('div', { class: 'bjxy-level-num' }, 'Lv ' + (i + 1)),
          m('div', { class: 'bjxy-level-lvl' }, l.level || ''),
          m('div', { class: 'bjxy-level-name' }, l.name || ''),
          m('div', { class: 'bjxy-level-desc' }, l.desc || ''),
        ]))
      ),
    ]);
  }

  // 教练
  // v0.1.5: 加 bio + achievements + specialties + photoUrl
  // v0.1.30 改: 改用 swiper 11 peek carousel (辉哥 11:08 反馈, 11:10 拍板 B 方案)
  //   - 删 v0.1.28/v0.1.29 CSS scroll-snap 容器, 改用 swiper 11 instance (跟 events section 同款 pattern)
  //   - desktop slidesPerView 1.2 (1 张完整 + 0.2 张 peek ≈ 100px), mobile breakpoints 1.1
  //   - 保留 v0.1.27 SOP 155 沉淀: 3 张卡片统一详细样式, alice/bob 没字段不显示空白
  renderCoachSection(s) {
    return m('section', { class: 'bjxy-section', id: 'coach', key: 'sec-coach' }, [
      m('div', { class: 'bjxy-sub' }, 'COACHES'),
      m('h2', null, '专业教练'),
      this.loadingCoaches
        ? m('p', null, '加载中...')
        : this.coaches.length === 0
          ? m('p', null, '（暂无教练, 请在后台选择用户组）')
          : m('div', { class: 'bjxy-coach-swiper swiper', oncreate: (vnode) => this.initCoachSwiper(vnode) }, [
              m('div', { class: 'swiper-wrapper' },
                this.coaches.map((c, i) => m('div', { class: 'swiper-slide bjxy-coach-slide', key: 'c' + i }, [
                  // v0.1.27 改 (A 方案): 删原来的 detail 二分判断, 所有 coach 统一走详细卡片样式
                  //   没字段的字段 (bio/achievements/specialties) 在下方三元判断自动隐藏, 不显示空白
                  m('div', { class: 'bjxy-coach' }, [
                    m('div', { class: 'bjxy-coach-avatar' }, [
                      // v0.1.10 改: 用用户自己的系统头像 (user.avatar_url 走 vendor User::getAvatarUrlAttribute() accessor 拼 URL)
                      //   + srcset 走 2x/3x 让 Retina 屏幕清晰
                      c.avatarUrl
                        ? m('img', { src: c.avatarUrl, srcset: c.avatarSrcset || null, alt: c.displayName, loading: 'lazy' })
                        : (c.displayName || '?').charAt(0),
                    ]),
                    m('div', { class: 'bjxy-coach-info' }, [
                      m('div', { class: 'bjxy-coach-name' }, c.displayName || ''),
                      c.username ? m('div', { class: 'bjxy-coach-username' }, '@' + c.username) : null,
                      c.specialties ? m('div', { class: 'bjxy-coach-specialties' }, [
                        m('span', { class: 'bjxy-coach-label' }, '🏂 专长'),
                        m('span', { class: 'bjxy-coach-text' }, c.specialties),
                      ]) : null,
                      c.achievements ? m('div', { class: 'bjxy-coach-achievements' }, [
                        m('span', { class: 'bjxy-coach-label' }, '🏆 成就'),
                        m('span', { class: 'bjxy-coach-text' }, c.achievements),
                      ]) : null,
                      c.bio ? m('div', { class: 'bjxy-coach-bio' }, c.bio) : null,
                    ]),
                  ]),
                ]))
              ),
              m('div', { class: 'swiper-pagination' }),
            ]),
    ]);
  }

  // 评价
  // v0.1.6a: 大众点评风格 评价+图片
  renderReviewsSection(reviews) {
    return m('section', { class: 'bjxy-section bjxy-section-alt', id: 'reviews', key: 'sec-reviews' }, [
      m('div', { class: 'bjxy-sub' }, 'REVIEWS'),
      m('h2', null, '学员评价'),
      reviews.length > 0
        ? m('div', { class: 'bjxy-review-grid' }, reviews.map((r, i) => {
            const photos = Array.isArray(r.photos) ? r.photos : (r.photoUrl ? [r.photoUrl] : []);
            return m('div', { class: 'bjxy-review', key: 'r' + i }, [
              m('div', { class: 'bjxy-review-stars' }, this.renderStars(r.rating || 5)),
              m('div', { class: 'bjxy-review-quote' }, r.text || ''),
              m('div', { class: 'bjxy-review-author' }, [
                m('span', { class: 'bjxy-review-author-av' }, (r.author || '?').charAt(0)),
                m('span', null, r.author || '匿名'),
                r.date ? m('span', { class: 'bjxy-review-date' }, ' · ' + r.date) : null,
              ]),
              photos.length > 0 ? m('div', { class: 'bjxy-review-photos' },
                photos.map((url, pi) => m('a', {
                  key: 'rp' + i + 'p' + pi,
                  class: 'bjxy-review-photo',
                  style: { backgroundImage: 'url(' + url + ')' },
                  onclick: (e) => { e.preventDefault(); this.openFancyboxGallery(photos, pi); },
                }))
              ) : null,
            ]);
          }))
        : m('p', null, '（暂无评价, 请在后台添加）'),
    ]);
  }

  // 联系
  // v0.1.32 改: 4 字段 → 3 字段 (辉哥 11:48 反馈)
  //   - 地址 改多地址 (1-3 个卡片, 复用 reviews array 模式)
  //   - 微信 改多图 (3 列缩略图墙, 复用 reviews photos 模式)
  //   - 邮箱 完全删 (前台 + 后台都不渲染)
  //   - 电话 保留单值
  //   - 向后兼容: 旧 bjxy_contact_address 单值 → 多地址迁移, 旧 bjxy_contact_wechat 文字值不迁移 (不能当图)
  renderContactSection(s) {
    // 解析多地址 (array of {value} → array of string)
    const addresses = (() => {
      try {
        const raw = s('bjxy_contact_addresses', '[]');
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) {
          return arr.map(a => typeof a === 'string' ? a : (a && a.value) || '').filter(Boolean);
        }
      } catch (e) {}
      // 向后兼容: 旧 bjxy_contact_address 单值 → [old]
      const old = s('bjxy_contact_address', '');
      return old ? [old] : [];
    })();
    // 解析多图微信 (array of URL)
    const wechatImages = (() => {
      try {
        const raw = s('bjxy_contact_wechat_images', '[]');
        const arr = JSON.parse(raw);
        return Array.isArray(arr) ? arr.filter(Boolean) : [];
      } catch (e) { return []; }
    })();
    return m('section', { class: 'bjxy-section', id: 'contact', key: 'sec-contact' }, [
      m('div', { class: 'bjxy-sub' }, 'CONTACT'),
      m('h2', null, '联系我们'),
      m('div', { class: 'bjxy-contact-grid' }, [
        // 地址 (多地址, 每个地址一个卡片, 跟 reviews 列表一样)
        ...addresses.map((addr, i) => m('div', { class: 'bjxy-contact-item', key: 'addr-' + i }, [
          m('div', { class: 'bjxy-contact-label' }, '📍 地址 #' + (i + 1)),
          m('div', { class: 'bjxy-contact-value' }, addr),
        ])),
        // 电话 (单值保留) — 修 v0.1.32.1: 加 key 'phone' 修 mithril "vnodes must either all have keys or none"
        m('div', { class: 'bjxy-contact-item', key: 'phone' }, [
          m('div', { class: 'bjxy-contact-label' }, '📞 电话'),
          m('div', { class: 'bjxy-contact-value' }, s('bjxy_contact_phone', '400-888-8888')),
        ]),
        // 微信 (多图, 3 列缩略图墙, 跟 reviews photos 风格)
        wechatImages.length > 0 ? m('div', { class: 'bjxy-contact-item bjxy-contact-wechat', key: 'wechat' }, [
          m('div', { class: 'bjxy-contact-label' }, '💬 微信'),
          m('div', { class: 'bjxy-contact-wechat-grid' },
            wechatImages.map((url, i) => m('a', {
              class: 'bjxy-contact-wechat-img',
              href: url,
              target: '_blank',
              rel: 'noopener noreferrer',
              key: 'wc-' + i,
            }, m('img', { src: url, alt: '微信二维码 #' + (i + 1) })))
          ),
        ]) : null,
      ].filter(Boolean)),
    ]);
  }

  oncreate(vnode) {
    // v0.1.22: /bjxy 路径 HTML <title> 改为品牌名 + 品牌副标
    //   vendor Page setTitle 默认 setTitle(trans('core.forum.index.meta_title_text')) = '极客雪域'
    //   override 后变成 '北极雪屿 · 室内滑雪 · 全国连锁' (跟后台 '品牌信息' tab 设置联动)
    this.setTitle();
    this.loadCoaches();
    // v0.1.17: 通用设置 - '显示底部 Tab' 开关 (bjxy_show_mobile_tab = '1' 隐藏 mobile tab)
    //   辉哥 19:37+ 拍板: "开启状态时，会在bjxy的前端页面，把下方的mobile tab移除"
    //   acpl-mobile-tab 扩展渲染 <nav className="MobileTab"> 元素
    //   默认 '0' (false) = 显示 mobile tab, '1' (true) = 隐藏
    //   CSS hide 不用改 mobile tab 扩展内部代码, 不动 DOM 避免 mobile tab JS 报错
    // v0.1.18 改: 同步移除 .App.affix 的 padding-bottom: 50px (vendor Flarum core 给 .App.affix 加的
    //   底部 padding 留给 mobile tab 高度, mobile tab 隐藏后这个 padding 仍存在 → 页面下方留白)
    // v0.1.19 改: 还需移除 .App-content 的 padding-bottom: 20px (vendor Flarum core
    //   `#app .App-content { padding-bottom: 20px }` 加的, main/.App-content 底部留 20px 间距)
    //   辉哥 09:12 反馈: "开启移除tab后，前端页面底部还是有间距"
    if (app.forum.attribute('bjxy_show_mobile_tab') === '1') {
      const style = document.createElement('style');
      style.id = 'bjxy-hide-mobile-tab';
      // 同时隐藏 mobile tab + 移除 .App.affix 底部 padding (50px) + 移除 .App-content 底部 padding (20px)
      // 一起干掉, mobile tab 隐藏后页面底部跟 viewport 底完全贴合, 0 间距
      style.textContent = 'nav.MobileTab { display: none !important; } #header {display:none} #app-navigation {display: none !important;} #app { padding-top: 63.8px !important } .App.affix { padding-bottom: 0 !important; } .App-content { padding-bottom: 0 !important; }';
      document.head.appendChild(style);
    }
  }

  loadCoaches() {
    // v0.1.4 改: 优先用 /api/bjxy/coaches (读 bjxy_coach_user_ids setting, 拿具体 user)
    //   fallback 老的 /api/bjxy/coaches (读 bjxy_coach_group_ids setting, 拿 group 内 user)
    //   两个 API 共存兼容旧部署
    m.request({
      method: 'GET',
      url: app.forum.attribute('apiUrl') + '/bjxy/coaches',
    }).then(data => {
      this.coaches = data.coaches || [];
      this.loadingCoaches = false;
      m.redraw();
    }).catch(err => {
      console.error('bjxy load coaches failed', err);
      this.loadingCoaches = false;
      m.redraw();
    });
  }
}
