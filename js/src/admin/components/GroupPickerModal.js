// v0.1.5: 弹 modal 选用户 + 编辑详情
//   - 复用 v0.1.4 的 modal pattern (继承 Modal, onhide/onremove 钩子 + scrollY 保留)
//   - 复用 v0.1.4 的 sortablejs 拖拽 (按 selectedUserIds 顺序排)
//   - 新加: 每个选中的 user 可填 3 个详情 (bio / achievements / specialties)
//   - 返回: { userIds, details: { userId: {bio, achievements, specialties} } }
//
// 跟 v0.1.4 的区别:
//   - v0.1.4: 只选 user, 不填详情, onSelect(userIds) 回调
//   - v0.1.5: 选 user + 填详情, onSelect({userIds, details}) 回调
//
// v0.1.10 改: 删 photoUrl 字段 + uploadPhoto 方法
//   辉哥 15:22 拍板: "photoUrl可以去掉，只用用户头像"
//   教练展示统一用 user 自己的系统头像 (vendor User::getAvatarUrlAttribute() accessor 拼 URL)
//   列表/详情 form avatar 走 u.avatarUrl (GroupUsersController 已走 User model accessor)
//   旧 bjxy_coach_details setting 里 photoUrl 字段保留不读 (兼容旧数据)

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
    // v0.1.5: details map (userId -> {bio, achievements, specialties})
    this.details = {};
    if (vnode.attrs.details && typeof vnode.attrs.details === 'object') {
      Object.keys(vnode.attrs.details).forEach(uid => {
        const d = vnode.attrs.details[uid];
        // v0.1.10 改: 忽略 photoUrl 字段 (兼容旧数据, 不读)
        this.details[uid] = {
          bio: d.bio || '',
          achievements: d.achievements || '',
          specialties: d.specialties || '',
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
    return '选择用户 + 编辑教练简介';
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
          ① 左边拖拽调整顺序 + 勾选用户, ② 右边填教练简介 (bio/成就/专长, 头像自动用用户自己的), ③ 确认后保存
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
                    {/* v0.1.10 改: 永远用 user 自己的系统头像 (u.avatarUrl 走 GroupUsersController User model accessor) */}
                    {u.avatarUrl ? (
                      <img src={u.avatarUrl} alt="" />
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
    // v0.1.10 改: 删 photoUrl 字段, 只剩 bio/achievements/specialties
    if (!this.details[uid]) {
      this.details[uid] = { bio: '', achievements: '', specialties: '' };
    }
    const d = this.details[uid];

    return (
      <div className="GroupPickerModal-detail-form">
        <div className="GroupPickerModal-detail-head">
          <span className="GroupPickerModal-detail-avatar">
            {/* v0.1.10 改: 永远用 user 自己的系统头像 (u.avatarUrl 走 GroupUsersController User model accessor) */}
            {u.avatarUrl ? <img src={u.avatarUrl} alt="" /> : (u.displayName || u.username).substring(0, 1)}
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
        {/* v0.1.10 删: 照片上传字段 (辉哥 15:22 拍板, 只用用户自己的系统头像) */}
      </div>
    );
  }

  // v0.1.10 删: getPhotoForUser() (photoUrl 字段已删, 直接用 u.avatarUrl 即可)
  //   之前这个方法被列表 avatar 渲染 + detail-head avatar 调用
  //   都已经改成直接读 u.avatarUrl (GroupUsersController 已走 User model accessor 拼 URL)

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

  // v0.1.10 删: uploadPhoto() 方法 (辉哥 15:22 拍板, 教练头像统一用用户自己的系统头像)
  //   之前走 /api/bjxy/upload 上传到 ziven-core COS, 现在不需要了

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
