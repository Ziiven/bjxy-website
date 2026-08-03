// v0.1.4: 弹 modal 选用户 (从所选 group 来的) + 拖拽排序
//   之前 v0.1.3 弹 modal 选 group, 现在改: 后台选 group (已存在) → 弹 modal 展示 group 内的 user
//   admin 可以多选/取消 user + 拖拽排序 + 保存到 bjxy_coach_user_ids
//
// 复用 v0.1.3 的 Modal pattern (继承 flarum/common/components/Modal, onhide/onremove 钩子)
// sortablejs 是 Flarum 2.0 vendor 自带 (v1.14.0), 直接 import

import app from 'flarum/admin/app';
import Modal from 'flarum/common/components/Modal';
import Button from 'flarum/common/components/Button';
import Sortable from 'sortablejs';

export default class GroupPickerModal extends Modal {
  static isDismissibleViaBackdropClick = true;
  static isDismissibleViaCloseButton = true;

  oninit(vnode) {
    super.oninit(vnode);
    // vnode.attrs: { groupIds, selectedUserIds, onSelect, onhide }
    this.groupIds = vnode.attrs.groupIds || [];
    this.selectedUserIds = (vnode.attrs.selectedUserIds || []).slice();
    this.onSelect = vnode.attrs.onSelect || (() => {});
    this.attrsOnhide = vnode.attrs.onhide || null;
    // 用户列表 (从 /api/bjxy/group-users 拿)
    this.allUsers = [];
    this.loading = true;
    // sortablejs 实例 (onremove 时销毁)
    this.sortable = null;
    // 加载用户列表
    this.loadUsers();
  }

  async loadUsers() {
    this.loading = true;
    m.redraw();
    try {
      const r = await app.request({
        method: 'GET',
        url: app.forum.attribute('apiUrl') + '/bjxy/group-users',
        params: { ids: this.groupIds.join(',') },
      });
      if (r && Array.isArray(r.users)) {
        this.allUsers = r.users;
      }
    } catch (err) {
      app.alerts.show({ type: 'error' }, '加载用户列表失败: ' + (err.message || err));
    }
    this.loading = false;
    m.redraw();
  }

  className() {
    return 'Modal--medium GroupPickerModal';
  }

  title() {
    return '选择用户 (作为教练展示)';
  }

  content() {
    if (this.loading) {
      return (
        <div className="Modal-body">
          <div className="GroupPickerModal-loading">加载用户列表中...</div>
        </div>
      );
    }

    if (this.allUsers.length === 0) {
      return (
        <div className="Modal-body">
          <div className="GroupPickerModal-empty">
            所选用户组内没有用户, 请先在论坛后台给这些组添加用户
          </div>
          <div className="GroupPickerModal-footer">
            <Button className="Button Button--secondary" onclick={() => this.hide()}>
              关闭
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="Modal-body">
        <div className="GroupPickerModal-hint">
          拖拽调整顺序, 勾选/取消选择用户, 确认后保存
        </div>
        <div className="GroupPickerModal-list" oncreate={(vnode) => this.initSortable(vnode)}>
          {this.allUsers.map(u => {
            const on = this.selectedUserIds.indexOf(u.id) >= 0;
            return (
              <div
                className={'GroupPickerModal-item' + (on ? ' on' : '')}
                key={'u' + u.id}
                data-uid={u.id}
              >
                <span className="GroupPickerModal-item-handle">⋮⋮</span>
                <input
                  type="checkbox"
                  checked={on}
                  onchange={() => this.toggle(u.id)}
                />
                <span className="GroupPickerModal-item-avatar">
                  {u.avatarUrl ? <img src={u.avatarUrl} alt="" /> : (u.displayName || u.username).substring(0, 1)}
                </span>
                <span className="GroupPickerModal-item-name">{u.displayName || u.username}</span>
                <span className="GroupPickerModal-item-username">@{u.username}</span>
              </div>
            );
          })}
        </div>
        <div className="GroupPickerModal-footer">
          <span className="GroupPickerModal-count">已选 {this.selectedUserIds.length} / {this.allUsers.length}</span>
          <div className="GroupPickerModal-actions">
            <Button className="Button Button--secondary" onclick={() => this.hide()}>
              取消
            </Button>
            <Button
              className="Button Button--primary"
              onclick={() => this.confirm()}
            >
              确认
            </Button>
          </div>
        </div>
      </div>
    );
  }

  initSortable(vnode) {
    // sortablejs 拖拽初始化, 拖动 .GroupPickerModal-item 元素
    if (this.sortable) this.sortable.destroy();
    this.sortable = Sortable.create(vnode.dom, {
      animation: 150,
      handle: '.GroupPickerModal-item-handle',
      onEnd: (e) => {
        // 拖拽后更新 allUsers 顺序
        const moved = this.allUsers.splice(e.oldIndex, 1)[0];
        this.allUsers.splice(e.newIndex, 0, moved);
        // 同时调整 selectedUserIds 顺序 (因为保存时 selectedUserIds 数组顺序就是渲染顺序)
        this.selectedUserIds = this.allUsers
          .filter(u => this.selectedUserIds.indexOf(u.id) >= 0)
          .map(u => u.id);
        m.redraw();
      },
    });
  }

  toggle(id) {
    const idx = this.selectedUserIds.indexOf(id);
    if (idx >= 0) this.selectedUserIds.splice(idx, 1);
    else this.selectedUserIds.push(id);
    m.redraw();
  }

  confirm() {
    // selectedUserIds 顺序 = allUsers 顺序 (拖拽后的顺序)
    this.onSelect(this.selectedUserIds.slice());
    this.hide();
  }

  // v0.1.3a 修: 多个关闭钩子确保父级 onhide 一定被触发
  onhide() {
    if (this.attrsOnhide) this.attrsOnhide();
  }

  // 兜底: mithril vnode 从 DOM 移除时也触发
  onremove() {
    if (this.sortable) {
      this.sortable.destroy();
      this.sortable = null;
    }
    if (this.attrsOnhide) this.attrsOnhide();
  }
}
