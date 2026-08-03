// v0.1.5: 弹 modal 选用户 + 编辑详情
//   - 复用 v0.1.4 的 modal pattern (继承 Modal, onhide/onremove 钩子 + scrollY 保留)
//   - 复用 v0.1.4 的 sortablejs 拖拽 (按 selectedUserIds 顺序排)
//   - 新加: 每个选中的 user 可填 4 个详情 (bio / achievements / specialties / photoUrl)
//   - 返回: { userIds, details: { userId: {bio, achievements, specialties, photoUrl} } }
//
// 跟 v0.1.4 的区别:
//   - v0.1.4: 只选 user, 不填详情, onSelect(userIds) 回调
//   - v0.1.5: 选 user + 填详情, onSelect({userIds, details}) 回调
//   - photo 走 ziven-core COS (跟其他 bjxy fileField 一致, uploadFile 通过 bjxy/upload 接口)

import app from 'flarum/admin/app';
import Modal from 'flarum/common/components/Modal';
import Button from 'flarum/common/components/Button';
import Sortable from 'sortablejs';

export default class GroupPickerModal extends Modal {
  static isDismissibleViaBackdropClick = true;
  static isDismissibleViaCloseButton = true;

  oninit(vnode) {
    super.oninit(vnode);
    // vnode.attrs: { groupIds, selectedUserIds, details, onSelect, onhide }
    this.groupIds = vnode.attrs.groupIds || [];
    this.selectedUserIds = (vnode.attrs.selectedUserIds || []).slice();
    this.onSelect = vnode.attrs.onSelect || (() => {});
    this.attrsOnhide = vnode.attrs.onhide || null;
    // v0.1.5: details map (userId -> {bio, achievements, specialties, photoUrl})
    this.details = {};
    if (vnode.attrs.details && typeof vnode.attrs.details === 'object') {
      Object.keys(vnode.attrs.details).forEach(uid => {
        const d = vnode.attrs.details[uid];
        this.details[uid] = {
          bio: d.bio || '',
          achievements: d.achievements || '',
          specialties: d.specialties || '',
          photoUrl: d.photoUrl || '',
        };
      });
    }
    // 当前选中的 user (右侧详情 form 显示哪个 user)
    this.activeUserId = this.selectedUserIds.length > 0 ? this.selectedUserIds[0] : null;

    this.allUsers = [];
    this.loading = true;
    this.sortable = null;
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
    return 'Modal--large GroupPickerModal';
  }

  title() {
    return '选择用户 + 编辑教练详情';
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
          ① 左边拖拽调整顺序 + 勾选用户, ② 右边填教练详情 (bio/成就/专长/照片), ③ 确认后保存
        </div>
        <div className="GroupPickerModal-body">
          {/* 左列: user 列表 */}
          <div className="GroupPickerModal-list" oncreate={(vnode) => this.initSortable(vnode)}>
            {this.allUsers.map(u => {
              const on = this.selectedUserIds.indexOf(u.id) >= 0;
              const isActive = this.activeUserId === u.id;
              return (
                <div
                  className={'GroupPickerModal-item' + (on ? ' on' : '') + (isActive ? ' active' : '')}
                  key={'u' + u.id}
                  data-uid={u.id}
                  onclick={() => this.selectUser(u.id)}
                >
                  <span className="GroupPickerModal-item-handle">⋮⋮</span>
                  <input
                    type="checkbox"
                    checked={on}
                    onchange={(e) => {
                      e.stopPropagation();
                      this.toggle(u.id);
                    }}
                    onclick={(e) => e.stopPropagation()}
                  />
                  <span className="GroupPickerModal-item-avatar">
                    {this.getPhotoForUser(u.id) ? (
                      <img src={this.getPhotoForUser(u.id)} alt="" />
                    ) : (
                      (u.displayName || u.username).substring(0, 1)
                    )}
                  </span>
                  <span className="GroupPickerModal-item-name">{u.displayName || u.username}</span>
                  <span className="GroupPickerModal-item-username">@{u.username}</span>
                </div>
              );
            })}
          </div>

          {/* 右列: 详情 form */}
          <div className="GroupPickerModal-details">
            {this.activeUserId !== null && this.selectedUserIds.indexOf(this.activeUserId) >= 0 ? (
              this.renderDetailForm(this.activeUserId)
            ) : (
              <div className="GroupPickerModal-details-empty">
                👈 勾选左边用户后, 在这里填教练详情
              </div>
            )}
          </div>
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

  renderDetailForm(uid) {
    const u = this.allUsers.find(x => x.id === uid);
    if (!u) return null;
    // v0.1.5 修: this.details[uid] 不存在时新建, 同时写回 this.details
    //   之前只创建本地 d 但不写回, oninput 改 d.bio 不会同步到 this.details,
    //   确认时 this.details 仍是空, 永远保存不到
    if (!this.details[uid]) {
      this.details[uid] = { bio: '', achievements: '', specialties: '', photoUrl: '' };
    }
    const d = this.details[uid];

    return (
      <div className="GroupPickerModal-detail-form">
        <div className="GroupPickerModal-detail-head">
          <span className="GroupPickerModal-detail-avatar">
            {d.photoUrl ? <img src={d.photoUrl} alt="" /> : (u.displayName || u.username).substring(0, 1)}
          </span>
          <div>
            <div className="GroupPickerModal-detail-name">{u.displayName || u.username}</div>
            <div className="GroupPickerModal-detail-username">@{u.username}</div>
          </div>
        </div>

        <div className="GroupPickerModal-field">
          <label>个人简介 (bio)</label>
          <textarea
            className="GroupPickerModal-textarea"
            value={d.bio}
            placeholder="例如: 10 年单板教学经验, 持证教练, 擅长零基础到刻滑"
            rows="3"
            oninput={(e) => { d.bio = e.target.value; }}
          />
        </div>

        <div className="GroupPickerModal-field">
          <label>成就 (achievements, 逗号分隔)</label>
          <input
            className="GroupPickerModal-input"
            value={d.achievements}
            placeholder="例如: 国家滑雪指导员资格证, 2018 全国滑雪锦标赛前 10"
            oninput={(e) => { d.achievements = e.target.value; }}
          />
        </div>

        <div className="GroupPickerModal-field">
          <label>专长 (specialties, 逗号分隔)</label>
          <input
            className="GroupPickerModal-input"
            value={d.specialties}
            placeholder="例如: 单板, 自由式, 刻滑"
            oninput={(e) => { d.specialties = e.target.value; }}
          />
        </div>

        <div className="GroupPickerModal-field">
          <label>照片 (走 ziven-core COS)</label>
          <div className="GroupPickerModal-photo-row">
            <input
              className="GroupPickerModal-input"
              value={d.photoUrl}
              placeholder="https://geek.ski/uploads/coach-photo.jpg"
              oninput={(e) => { d.photoUrl = e.target.value; }}
            />
            <Button
              className="Button Button--secondary"
              onclick={() => this.uploadPhoto(uid)}
            >
              📷 上传
            </Button>
          </div>
          {d.photoUrl ? (
            <div className="GroupPickerModal-photo-preview">
              <img src={d.photoUrl} alt="" />
              <span>✓ 已上传</span>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  getPhotoForUser(uid) {
    const d = this.details[uid];
    if (d && d.photoUrl) return d.photoUrl;
    const u = this.allUsers.find(x => x.id === uid);
    if (u && u.avatarUrl) return u.avatarUrl;
    return null;
  }

  toggle(id) {
    const idx = this.selectedUserIds.indexOf(id);
    if (idx >= 0) {
      this.selectedUserIds.splice(idx, 1);
      if (this.activeUserId === id) {
        // 取消选中, active 切到下一个
        this.activeUserId = this.selectedUserIds.length > 0 ? this.selectedUserIds[0] : null;
      }
    } else {
      this.selectedUserIds.push(id);
      this.activeUserId = id;
    }
    m.redraw();
  }

  selectUser(id) {
    if (this.selectedUserIds.indexOf(id) >= 0) {
      this.activeUserId = id;
      m.redraw();
    }
  }

  initSortable(vnode) {
    if (this.sortable) this.sortable.destroy();
    this.sortable = Sortable.create(vnode.dom, {
      animation: 150,
      handle: '.GroupPickerModal-item-handle',
      onEnd: (e) => {
        const moved = this.allUsers.splice(e.oldIndex, 1)[0];
        this.allUsers.splice(e.newIndex, 0, moved);
        // selectedUserIds 顺序跟着 allUsers 排
        this.selectedUserIds = this.allUsers
          .filter(u => this.selectedUserIds.indexOf(u.id) >= 0)
          .map(u => u.id);
        m.redraw();
      },
    });
  }

  async uploadPhoto(uid) {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.onchange = async (ev) => {
      const file = ev.target.files[0];
      if (!file) return;
      const form = new FormData();
      form.append('file', file);
      form.append('key', 'bjxy_coach_photo_' + uid);
      try {
        const r = await app.request({
          method: 'POST',
          url: app.forum.attribute('apiUrl') + '/bjxy/upload',
          body: form,
        });
        if (r.ok && r.url) {
          this.details[uid] = this.details[uid] || { bio: '', achievements: '', specialties: '', photoUrl: '' };
          this.details[uid].photoUrl = r.url;
          app.alerts.show({ type: 'success' }, '照片上传成功');
          m.redraw();
        } else {
          app.alerts.show({ type: 'error' }, r.error || '上传失败');
        }
      } catch (err) {
        app.alerts.show({ type: 'error' }, '上传异常: ' + err.message);
      }
    };
    fileInput.click();
  }

  confirm() {
    // v0.1.5 返回 { userIds, details } (兼容 v0.1.4 只传 userIds)
    this.onSelect({
      userIds: this.selectedUserIds.slice(),
      details: JSON.parse(JSON.stringify(this.details)),
    });
    this.hide();
  }

  onhide() {
    if (this.attrsOnhide) this.attrsOnhide();
  }

  onremove() {
    if (this.sortable) {
      this.sortable.destroy();
      this.sortable = null;
    }
    if (this.attrsOnhide) this.attrsOnhide();
  }
}
