// BjxyCoachModal.jsx — 教练详情 modal
import app from 'flarum/forum/app';
import Modal from 'flarum/common/components/Modal';

export default class BjxyCoachModal extends Modal {
  className() {
    return 'bjxy-coach-modal Modal Modal--small';
  }

  title() {
    return '教练详情';
  }

  content() {
    const c = this.props.coach || {};
    const name = c.displayName || c.username || '教练';
    return (
      <div class="bjxy-coach-modal-body">
        <div class="bjxy-coach-modal-av">
          {c.avatarUrl ? <img src={c.avatarUrl} alt={name} /> : name.charAt(0)}
        </div>
        <div class="bjxy-coach-modal-name">{name}</div>
        <div class="bjxy-coach-modal-username">@{c.username || ''}</div>
        <div class="bjxy-coach-modal-bio">
          {c.bio || '专业认证教练, 详细信息稍后完善。'}
        </div>
      </div>
    );
  }
}
