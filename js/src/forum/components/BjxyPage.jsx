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
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';

const DEFAULT_BRAND = '北极雪屿';
const DEFAULT_SLOGAN = '室内滑雪 · 全国连锁';

export default class BjxyPage extends Component {
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
  initSwiper(vnode) {
    if (!vnode || !vnode.dom) return;
    if (this.swiper) this.swiper.destroy(true, true);
    this.swiper = new Swiper(vnode.dom, {
      // v0.1.6c: 必须传 modules, 不传 swiper 11 navigation/pagination 不会 attach
      modules: [Navigation, Pagination],
      loop: true,
      slidesPerView: 1,
      spaceBetween: 16,
      pagination: { el: vnode.dom.querySelector('.swiper-pagination'), clickable: true },
      navigation: {
        nextEl: vnode.dom.querySelector('.swiper-button-next'),
        prevEl: vnode.dom.querySelector('.swiper-button-prev'),
      },
    });
  }

  // 销毁 swiper
  destroySwiper() {
    if (this.swiper) {
      this.swiper.destroy(true, true);
      this.swiper = null;
    }
  }

  // 组件销毁时清理
  onremove() {
    this.destroySwiper();
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
    const reviewsHtml = s('bjxy_reviews_html', '');
    const studentsHtml = s('bjxy_students_html', '');
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

      // ===== 公告条 =====
      // v0.1.0q 修: 删 ELITE badge (辉哥反馈品牌信息 section 中 elite 文字要去掉)
      //   公告条布局调整: badge 删了, slogan 文字移到最左, 链接 + arrow 仍最右
      m('div', { class: 'bjxy-announce' }, [
        m('span', null, s('bjxy_brand_slogan', DEFAULT_SLOGAN) + ' · ' + curriculum.boards.reduce((sum, b) => sum + b.levels.length, 0) + ' 级教学体系 · ' + features.length + ' 大特色'),
        m('a', { href: '#contact', class: 'bjxy-announce-link' }, '📞 立即咨询'),
        m('span', { class: 'bjxy-announce-arrow' }, '→'),
      ]),

      // ===== 导航 =====
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
        m('div', { class: 'bjxy-nav-links' }, [
          m('a', { href: '#about' }, '关于'),
          // v0.1.6b 改: nav 顺序跟着 section 顺序调 — 活动移到关于下
          m('a', { href: '#events' }, '活动'),
          m('a', { href: '#features' }, '特色'),
          m('a', { href: '#curriculum' }, '教学'),
          m('a', { href: '#coaches' }, '教练'),
          m('a', { href: '#reviews' }, '评价'),
          m('a', { href: '#contact' }, '联系'),
        ]),
        m('div', { class: 'bjxy-nav-right' }, [
          m('a', { href: '#contact', class: 'bjxy-btn bjxy-btn-primary' }, s('bjxy_hero_cta_text', '立即咨询')),
        ]),
      ]),

      // ===== Hero =====
      m('section', { class: 'bjxy-hero', id: 'hero' }, [
        m('div', { class: 'bjxy-hero-text' }, [
          m('h1', null, [
            s('bjxy_hero_title', '探索极致的滑雪体验。'),
          ]),
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
          // v0.1.1 改: banner light + dark 都空时, 显示 fallback 渐变 + 品牌名 + slogan
          //   复用 less 里的 .bjxy-hero-banner-fallback 样式 (v0.1.0 留的 dead code)
          //   浅色: 浅蓝→店照蓝渐变; 深色: 深蓝→蓝黑渐变
          (!s('bjxy_hero_banner_light') && !s('bjxy_hero_banner_dark')) ? m('div', { class: 'bjxy-hero-banner-fallback' }, [
            m('div', { class: 'bjxy-hero-banner-fallback-name' }, s('bjxy_brand_name', DEFAULT_BRAND)),
            m('div', { class: 'bjxy-hero-banner-fallback-slogan' }, s('bjxy_brand_slogan', DEFAULT_SLOGAN)),
          ]) : null,
        ]),
      ]),

      // ===== 关于 =====
      m('section', { class: 'bjxy-section', id: 'about' }, [
        m('div', { class: 'bjxy-sub' }, s('bjxy_about_sub', 'ABOUT US')),
        m('h2', null, s('bjxy_about_title', '关于北极雪屿')),
        m('p', null, s('bjxy_about_desc', '北极雪屿室内滑雪成立于 2024 年, 专注滑雪领域的全国连锁机构...')),
        m('div', { class: 'bjxy-stats' }, [
          m('div', { class: 'bjxy-stat' }, [m('div', { class: 'bjxy-stat-num' }, s('bjxy_about_stat_1_num', '10+')), m('div', { class: 'bjxy-stat-label' }, s('bjxy_about_stat_1_label', '年教学经验'))]),
          m('div', { class: 'bjxy-stat' }, [m('div', { class: 'bjxy-stat-num' }, s('bjxy_about_stat_2_num', '50+')), m('div', { class: 'bjxy-stat-label' }, s('bjxy_about_stat_2_label', '专业教练'))]),
          m('div', { class: 'bjxy-stat' }, [m('div', { class: 'bjxy-stat-num' }, s('bjxy_about_stat_3_num', '1000+')), m('div', { class: 'bjxy-stat-label' }, s('bjxy_about_stat_3_label', '毕业学员'))]),
        ]),
      ]),

      // ===== 活动展示 (v0.1.6b: 从尾部移到关于下方) =====
      //   辉哥 12:22 反馈: 活动展示是亮点 (春节冬令营/周末进阶班 实物图), 应该紧跟关于介绍之后,
      //   之前放在最后显得不重要. 同步调整 nav 顺序.
      //   swiper 11 CSS 完整 base 样式 (button/pagination/scrollbar) 在 v0.1.6b 补全
      // v0.1.6d 改: 活动展示支持点击跳转 URL (辉哥 13:08 需求)
      //   - 后台每个活动可填 url 字段 (留空 = 不跳转, 跟之前一样点开 fancybox)
      //   - 内部链接 (以 / 开头, 例如 /dressUp, /t/123-slug) 走 m.route 软路由
      //   - 外部链接 (http:// / https://) target=_blank 新窗口打开
      //   - 软路由 link 标签加 bjxy-event-link class (less 加 cursor: pointer + hover 高亮)
      //   - 跳转 link 包活动 info 整个 (名字 + 副标题 + 介绍 + N 张)
      m('section', { class: 'bjxy-section bjxy-section-alt', id: 'events' }, [
        m('div', { class: 'bjxy-sub' }, 'EVENTS'),
        m('h2', null, '活动展示'),
        events.length > 0
          ? m('div', { class: 'bjxy-event-swiper swiper', oncreate: (vnode) => this.initSwiper(vnode) }, [
              m('div', { class: 'swiper-wrapper' },
                events.map((ev, i) => {
                  const photos = Array.isArray(ev.photos) ? ev.photos : (ev.photoUrl ? [ev.photoUrl] : []);
                  const firstPhoto = photos[0];
                  // v0.1.6d: 判断 url 是不是 Flarum 内部 (以 / 开头, 不带 protocol)
                  const url = (ev.url || '').trim();
                  const isInternal = url.startsWith('/') && !url.startsWith('//');
                  const hasUrl = url.length > 0;
                  return m('div', { class: 'swiper-slide bjxy-event-slide', key: 'ev' + i }, [
                    // v0.1.6d: 活动主图包不包 a 标签, 看 url 类型
                    //   - 有 url 内部 → 包 a + onclick m.route 跳转 (阻止默认)
                    //   - 有 url 外部 → 包 a + href + target=_blank (新窗口)
                    //   - 无 url → 包 a + onclick 触发 fancybox gallery (跟之前一样)
                    firstPhoto
                      ? (hasUrl
                          ? (isInternal
                              ? m('a', {
                                  class: 'bjxy-event-photo',
                                  style: { backgroundImage: 'url(' + firstPhoto + ')' },
                                  href: url,
                                  // v0.1.6d 修: mithril 软路由 API 是 m.route.set(path), 不是 m.route(path)
                                  //   (之前 v0.1.6d 写错 m.route(url) → 抛 "Cannot convert undefined" 错误)
                                  //   m.route.set 是 ziven-dress-up 用的同款 (SeedreamHistoryPage.js / EquipmentPage.js)
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
                    // v0.1.6d: 活动 info card 也包 link (如果填了 url)
                    //   让用户点 info 也能跳转 (不仅是主图)
                    hasUrl
                      ? (isInternal
                          ? m('a', {
                              class: 'bjxy-event-info bjxy-event-link',
                              href: url,
                              // v0.1.6d 修: mithril 软路由用 m.route.set (同 ziven-dress-up)
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
              m('div', { class: 'swiper-button-prev' }),
              m('div', { class: 'swiper-button-next' }),
              m('div', { class: 'swiper-pagination' }),
            ])
          : studentsHtml
            ? m('div', { class: 'bjxy-student-grid', oncreate: ({ dom }) => { dom.innerHTML = studentsHtml; } })
            : m('p', null, '（暂无活动展示, 请在后台添加）'),
      ]),

      // ===== 特色 =====
      m('section', { class: 'bjxy-section', id: 'features' }, [
        m('div', { class: 'bjxy-sub' }, 'FEATURES'),
        m('h2', null, '办学特色'),
        m('div', { class: 'bjxy-feature-grid' }, features.map((f, i) => m('div', { class: 'bjxy-feature', key: 'f' + i }, [
          m('div', { class: 'bjxy-feature-icon' }, f.icon || '★'),
          m('h3', null, f.title || ''),
          m('p', null, f.desc || ''),
        ]))),
      ]),

      // ===== 教学体系 =====
      // v0.1.0s 改: 教学体系类型任意多 (boards 数组), tabs 从 boards 动态渲染
      //   之前 hard-coded 单板/双板, 现在可以是雪橇/冰球/自由式等任意类型
      //   兼容旧 {single, double} data (没 boards 字段时自动转 2 个 board)
      // v0.1.6b 改: curriculum 从 normal → alt (因为活动移走后 顺序变了, 保持 alt/normal 交替)
      m('section', { class: 'bjxy-section bjxy-section-alt', id: 'curriculum' }, [
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
            m('div', { class: 'bjxy-level-num' }, i + 1),
            m('div', { class: 'bjxy-level-lvl' }, l.level || ''),
            m('div', { class: 'bjxy-level-name' }, l.name || ''),
            m('div', { class: 'bjxy-level-desc' }, l.desc || ''),
          ]))
        ),
      ]),

      // ===== 教练 =====
      // v0.1.5 改: 教练卡片加 bio + achievements + specialties + photoUrl (从 /api/bjxy/coaches 返回)
      //   之前只显示头像 + 名字, 现在展示完整信息
      // v0.1.6b 改: coaches 从 alt → normal (curriculum 占了 alt)
      m('section', { class: 'bjxy-section', id: 'coaches' }, [
        m('div', { class: 'bjxy-sub' }, 'COACHES'),
        m('h2', null, '专业教练'),
        this.loadingCoaches
          ? m('p', null, '加载中...')
          : this.coaches.length === 0
            ? m('p', null, '（暂无教练, 请在后台选择用户组）')
            : m('div', { class: 'bjxy-coach-grid' }, this.coaches.map((c, i) => {
                const hasDetail = c.bio || c.achievements || c.specialties;
                return m('div', { class: 'bjxy-coach' + (hasDetail ? ' bjxy-coach-detailed' : ''), key: 'c' + i }, [
                  m('div', { class: 'bjxy-coach-avatar' }, [
                    c.avatarUrl ? m('img', { src: c.avatarUrl, alt: c.displayName }) : (c.displayName || '?').charAt(0),
                  ]),
                  m('div', { class: 'bjxy-coach-info' }, [
                    m('div', { class: 'bjxy-coach-name' }, c.displayName || ''),
                    c.username ? m('div', { class: 'bjxy-coach-username' }, '@' + c.username) : null,
                    // v0.1.5 详情: bio / achievements / specialties
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
                ]);
              })),
      ]),

      // ===== 评价 (v0.1.6a: 大众点评风格 评价+图片) =====
      // 优先级: 新 bjxy_reviews (array, 带 photos 多图) > 老 bjxy_reviews_html (fallback 兼容旧部署)
      // v0.1.6b 改: 评价 section 从 normal → alt (因为活动移走后 顺序变了, 保持 alt/normal 交替)
      m('section', { class: 'bjxy-section bjxy-section-alt', id: 'reviews' }, [
        m('div', { class: 'bjxy-sub' }, 'REVIEWS'),
        m('h2', null, '学员评价'),
        reviews.length > 0
          ? m('div', { class: 'bjxy-review-grid' }, reviews.map((r, i) => {
              // v0.1.6a: photos 数组 (兼容老的 photoUrl 字符串)
              const photos = Array.isArray(r.photos) ? r.photos : (r.photoUrl ? [r.photoUrl] : []);
              return m('div', { class: 'bjxy-review', key: 'r' + i }, [
                m('div', { class: 'bjxy-review-stars' }, this.renderStars(r.rating || 5)),
                m('div', { class: 'bjxy-review-quote' }, r.text || ''),
                m('div', { class: 'bjxy-review-author' }, [
                  m('span', { class: 'bjxy-review-author-av' }, (r.author || '?').charAt(0)),
                  m('span', null, r.author || '匿名'),
                  r.date ? m('span', { class: 'bjxy-review-date' }, ' · ' + r.date) : null,
                ]),
                // v0.1.6a: 大众点评风格 缩略图墙 (4 列 grid, click → fancybox gallery)
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
          : reviewsHtml
            ? m('div', { class: 'bjxy-reviews-html', oncreate: ({ dom }) => { dom.innerHTML = reviewsHtml; } })
            : m('p', null, '（暂无评价, 请在后台添加）'),
      ]),

      // v0.1.6b 改: 活动展示 section 已移到关于下方 (上面), 这里删了
      //   老的活动 section 渲染逻辑 (swiper 容器 + 4 slide + prev/next + pagination) 完整保留
      //   在 about 之后的位置, 方便后续调整时复用

      // ===== 联系 =====
      m('section', { class: 'bjxy-section', id: 'contact' }, [
        m('div', { class: 'bjxy-sub' }, 'CONTACT'),
        m('h2', null, '联系我们'),
        m('div', { class: 'bjxy-contact-grid' }, [
          m('div', { class: 'bjxy-contact-item' }, [m('div', { class: 'bjxy-contact-label' }, '📍 地址'), m('div', { class: 'bjxy-contact-value' }, s('bjxy_contact_address', '北京市朝阳区滑雪场路 88 号'))]),
          m('div', { class: 'bjxy-contact-item' }, [m('div', { class: 'bjxy-contact-label' }, '📞 电话'), m('div', { class: 'bjxy-contact-value' }, s('bjxy_contact_phone', '400-888-8888'))]),
          m('div', { class: 'bjxy-contact-item' }, [m('div', { class: 'bjxy-contact-label' }, '💬 微信'), m('div', { class: 'bjxy-contact-value' }, s('bjxy_contact_wechat', 'bjxy_ski'))]),
          m('div', { class: 'bjxy-contact-item' }, [m('div', { class: 'bjxy-contact-label' }, '✉ 邮箱'), m('div', { class: 'bjxy-contact-value' }, s('bjxy_contact_email', 'hi@bjxy.com'))]),
        ]),
      ]),

      // ===== footer =====
      // v0.1.0ab 改: 备案号从 bjxy_icp_number setting 读 (后台可设)
      //   留空时 fallback 到默认 '2026xxxxxx' (跟之前 hard-coded 一致, 兼容旧部署)
      // v0.1.2 改: 加 公安备案号 + 网安链接 (国家规定中国大陆站点 footer 必须有)
      //   留空时不渲染公安备案行 (避免显示空链接)
      m('footer', { class: 'bjxy-footer' }, [
        m('div', { class: 'bjxy-footer-line' }, '© ' + new Date().getFullYear() + ' ' + s('bjxy_brand_name', DEFAULT_BRAND) + ' · ICP 备 ' + (s('bjxy_icp_number', '2026xxxxxx') || '2026xxxxxx') + ' 号'),
        s('bjxy_police_number') ? m('div', { class: 'bjxy-footer-line' }, [
          m('img', { class: 'bjxy-footer-police-icon', src: 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="14" height="14"><path fill="#fff" d="M10 1l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V4l8-3zm0 2.2L4 5.4V10c0 4 2.7 6.8 6 7.3 3.3-.5 6-3.3 6-7.3V5.4l-6-2.2zM7 8h6v1H7V8zm0 2h6v1H7v-1zm0 2h4v1H7v-1z"/></svg>'), alt: '公安备案' }),
          ' ',
          m('a', { href: s('bjxy_police_link', 'http://www.beian.gov.cn/portal/registerSystemInfo') || 'http://www.beian.gov.cn/portal/registerSystemInfo', target: '_blank', rel: 'noopener noreferrer', class: 'bjxy-footer-link' }, '京公网安备 ' + s('bjxy_police_number', '') + ' 号'),
        ]) : null,
      ]),
      ]),
    ];
  }

  oncreate(vnode) {
    this.loadCoaches();
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
