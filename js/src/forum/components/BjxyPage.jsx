// BjxyPage.jsx — /bjxy 页面 (10 section + 浅深双版) — v0.1.0 渐进式加回
import app from 'flarum/forum/app';
import Component from 'flarum/common/Component';
// mithril 走 vendor 注入的 global m (zct 同款, 不 import)

const DEFAULT_BRAND = '北极雪屿';
const DEFAULT_SLOGAN = '室内滑雪 · 全国连锁';
const DEFAULT_ELITE = 'ELITE';

export default class BjxyPage extends Component {
  init() {
    this.coaches = [];
    this.activeTab = 'single';
  }

  view() {
    return m('div', { class: 'bjxy-page' }, [
      m('h1', null, '北极雪屿 v0.1.0 — 17 级教学 + 6 特色 + 8 section'),
      m('p', null, '这里是 8 section 后台可配官网。Logo / 品牌名 / Hero / 关于 / 特色 / 教学体系 / 教练 / 评价 / 学员展示 / 联系 都在后台配置。'),
    ]);
  }

  oncreate(vnode) {
    this.loadCoaches();
  }

  loadCoaches() {
    m.request({
      method: 'GET',
      url: app.forum.attribute('apiUrl') + '/bjxy/coaches',
    }).then(data => {
      this.coaches = data.coaches || [];
      m.redraw();
    }).catch(err => {
      console.error('bjxy load coaches failed', err);
    });
  }
}
