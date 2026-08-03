// v0.1.3: 弹 modal 选用户组 (Flarum 2.0 mithril Modal pattern)
//   替代 v0.1.0f 留的 alert 占位, 现在 admin 可以弹真正的 mithril Modal
//   列出所有用户组, 多选复选框, 确认后回调 onSelect(ids)
//
// 参考: ziven-dress-up/js/src/admin/components/EditGroupLimitModal.js
//   `import Modal from 'flarum/common/components/Modal'`
//   `class extends Modal` + oninit/className/title/content
//
// Flarum 2.0 ModalManager.show(modalClass, attrs) 调用:
//   attrs 会通过 vnode.attrs 传给 modal 实例
//   关闭时 modal.hide() 触发 onhide 回调
import app from 'flarum/admin/app';
import Modal from 'flarum/common/components/Modal';
import Button from 'flarum/common/components/Button';

export default class GroupPickerModal extends Modal {
  static isDismissibleViaBackdropClick = true;
  static isDismissibleViaCloseButton = true;

  oninit(vnode) {
    super.oninit(vnode);
    // vnode.attrs: { allGroups, selectedIds, onSelect }
    this.allGroups = (vnode.attrs.allGroups || []).slice();
    this.selectedIds = (vnode.attrs.selectedIds || []).slice();
    this.onSelect = vnode.attrs.onSelect || (() => {});
  }

  className() {
    return 'Modal--small GroupPickerModal';
  }

  title() {
    return '选择用户组 (作为教练展示)';
  }

  content() {
    return (
      <div className="Modal-body">
        <div className="GroupPickerModal-list">
          {this.allGroups.length === 0 ? (
            <div className="GroupPickerModal-empty">没有可用的用户组</div>
          ) : (
            this.allGroups.map(g => {
              const on = this.selectedIds.indexOf(g.id) >= 0;
              return (
                <label className={'GroupPickerModal-item' + (on ? ' on' : '')} key={'g' + g.id}>
                  <input
                    type="checkbox"
                    checked={on}
                    onchange={() => this.toggle(g.id)}
                  />
                  <span className="GroupPickerModal-item-name">{g.nameSingular || g.namePlural || ('Group ' + g.id)}</span>
                  <span className="GroupPickerModal-item-count">{g.userCount || 0} 人</span>
                </label>
              );
            })
          )}
        </div>
        <div className="GroupPickerModal-footer">
          <Button className="Button Button--secondary" onclick={() => this.hide()}>
            取消
          </Button>
          <Button
            className="Button Button--primary"
            onclick={() => this.confirm()}
            disabled={this.selectedIds.length === 0}
          >
            确认 ({this.selectedIds.length})
          </Button>
        </div>
      </div>
    );
  }

  toggle(id) {
    const idx = this.selectedIds.indexOf(id);
    if (idx >= 0) this.selectedIds.splice(idx, 1);
    else this.selectedIds.push(id);
    // mithril 重新渲染
    if (typeof m !== 'undefined' && m.redraw) m.redraw();
  }

  confirm() {
    this.onSelect(this.selectedIds.slice());
    this.hide();
  }
}
