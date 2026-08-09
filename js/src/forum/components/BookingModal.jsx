// BookingModal.jsx — 预约体验 modal (辉哥 2026-08-09 8:14 反馈)
//   v0.2.0 跟 BjxyCoachModal 同模式: extends vendor Modal, className/title/content 三件套
//
// 6 字段表单:
//   1. 名字 (name) - 必填, max 100
//   2. 电话 (phone) - 必填, max 50
//   3. 年龄 (age) - 可选, 1-150
//   4. 是否有滑雪基础 (has_ski_experience) - 是/否 radio
//   5. 体验类型 (experience_type) - 单板/双板 radio (跟 server Booking::EXPERIENCE_TYPES 对应)
//   6. 预约日期 (booking_date) - HTML5 native <input type="date">, 不要时间
//
// 提交:
//   POST /api/bjxy/bookings
//   成功后 this.success = true → 切 "成功" 视图 (保留 modal, 用户手动关闭)
//   错误处理: 字段错误显示在 .BookingModal-Error 区, 不抛 vendor alert
//
// 限流 (server 端): 同 IP 1 分钟 1 条, 第二次 POST 返 ValidationException rate_limited,
//   BookingModal 捕获 + 显示 .BookingModal-Error 红条
//
// 国际化: 走 vendor app.translator.trans() 翻译, key 路径:
//   ziiven-bjxy-website.forum.booking_modal.<key>
import app from 'flarum/forum/app';
import Modal from 'flarum/common/components/Modal';
// mithril 走 vendor 注入的 global m

export default class BookingModal extends Modal {
  // 跟 BjxyCoachModal 同款 className, 视觉 1:1
  className() {
    return 'BookingModal Modal Modal--small';
  }

  oninit(vnode) {
    super.oninit(vnode);
    this.success = false;
    this.submitting = false;
    // form 字段 state (跟 v0.1.33 bjxy settings field helper 同款, 但 this.form 而非 this.data)
    this.form = {
      name: '',
      phone: '',
      age: '',
      has_ski_experience: false,
      experience_type: 'single',
      booking_date: '',
    };
    this.fieldErrors = {};  // server 端 ValidationException 字段错误
    this.formError = '';    // 通用错误 (rate_limited / 网络异常)
  }

  // 翻译 helper
  _t(key, fallback) {
    try {
      const v = app.translator.trans(`ziiven-bjxy-website.forum.booking_modal.${key}`);
      // vendor translator 找不到 key 时返原 key 字符串, fallback 给默认值
      if (v && v !== `ziiven-bjxy-website.forum.booking_modal.${key}`) return v;
    } catch (e) {}
    return fallback;
  }

  title() {
    return this._t('title', '预约体验');
  }

  // 成功视图: 隐藏表单, 显示成功消息, 让用户手动关闭 modal
  content() {
    if (this.success) {
      return (
        <div class="BookingModal-success">
          <div class="BookingModal-success-icon">✅</div>
          <h3>{this._t('success', '预约提交成功, 我们工作人员会尽快联系您')}</h3>
          <div class="BookingModal-success-actions">
            <button
              type="button"
              class="Button Button--primary"
              onclick={() => this.hide()}
            >
              {this._t('close', '关闭')}
            </button>
          </div>
        </div>
      );
    }

    return (
      <form class="BookingModal-form" onsubmit={(e) => { e.preventDefault(); this.submit(); }}>
        {/* 通用错误 (限流 / 网络) */}
        {this.formError ? (
          <div class="BookingModal-Error BookingModal-Error--global">{this.formError}</div>
        ) : null}

        {/* 1. 名字 (必填) */}
        <div class="BookingModal-field">
          <label class="BookingModal-label">
            {this._t('field_name', '名字')} <span class="BookingModal-required">*</span>
          </label>
          <input
            type="text"
            class="BookingModal-input"
            maxlength="100"
            required
            value={this.form.name}
            oninput={(e) => { this.form.name = e.target.value; }}
          />
          {this.fieldErrors.name ? (
            <div class="BookingModal-Error">{this.fieldErrors.name}</div>
          ) : null}
        </div>

        {/* 2. 电话 (必填) */}
        <div class="BookingModal-field">
          <label class="BookingModal-label">
            {this._t('field_phone', '电话')} <span class="BookingModal-required">*</span>
          </label>
          <input
            type="tel"
            class="BookingModal-input"
            maxlength="50"
            required
            value={this.form.phone}
            oninput={(e) => { this.form.phone = e.target.value; }}
          />
          {this.fieldErrors.phone ? (
            <div class="BookingModal-Error">{this.fieldErrors.phone}</div>
          ) : null}
        </div>

        {/* 3. 年龄 (可选) */}
        <div class="BookingModal-field">
          <label class="BookingModal-label">{this._t('field_age', '年龄 (可选)')}</label>
          <input
            type="number"
            class="BookingModal-input"
            min="1"
            max="150"
            value={this.form.age}
            oninput={(e) => { this.form.age = e.target.value; }}
          />
          {this.fieldErrors.age ? (
            <div class="BookingModal-Error">{this.fieldErrors.age}</div>
          ) : null}
        </div>

        {/* 4. 是否有滑雪基础 (是/否 radio) */}
        <div class="BookingModal-field">
          <label class="BookingModal-label">{this._t('field_has_ski_experience', '是否有滑雪基础')}</label>
          <div class="BookingModal-radio-group">
            <label class="BookingModal-radio">
              <input
                type="radio"
                name="has_ski_experience"
                value="true"
                checked={this.form.has_ski_experience === true}
                onchange={() => { this.form.has_ski_experience = true; }}
              />
              {' '}{this._t('yes', '是')}
            </label>
            <label class="BookingModal-radio">
              <input
                type="radio"
                name="has_ski_experience"
                value="false"
                checked={this.form.has_ski_experience === false}
                onchange={() => { this.form.has_ski_experience = false; }}
              />
              {' '}{this._t('no', '否')}
            </label>
          </div>
        </div>

        {/* 5. 体验类型 (单板/双板 radio) */}
        <div class="BookingModal-field">
          <label class="BookingModal-label">{this._t('field_experience_type', '体验类型')}</label>
          <div class="BookingModal-radio-group">
            <label class="BookingModal-radio">
              <input
                type="radio"
                name="experience_type"
                value="single"
                checked={this.form.experience_type === 'single'}
                onchange={() => { this.form.experience_type = 'single'; }}
              />
              {' '}{this._t('type_single', '单板体验')}
            </label>
            <label class="BookingModal-radio">
              <input
                type="radio"
                name="experience_type"
                value="double"
                checked={this.form.experience_type === 'double'}
                onchange={() => { this.form.experience_type = 'double'; }}
              />
              {' '}{this._t('type_double', '双板体验')}
            </label>
          </div>
        </div>

        {/* 6. 预约日期 (HTML5 native date picker, 不要时间) */}
        <div class="BookingModal-field">
          <label class="BookingModal-label">
            {this._t('field_booking_date', '预约日期')} <span class="BookingModal-required">*</span>
          </label>
          <input
            type="date"
            class="BookingModal-input"
            required
            value={this.form.booking_date}
            oninput={(e) => { this.form.booking_date = e.target.value; }}
          />
          {this.fieldErrors.booking_date ? (
            <div class="BookingModal-Error">{this.fieldErrors.booking_date}</div>
          ) : null}
        </div>

        {/* 提交按钮 + 取消按钮 */}
        <div class="BookingModal-actions">
          <button
            type="button"
            class="Button Button--secondary"
            onclick={() => this.hide()}
            disabled={this.submitting}
          >
            {this._t('cancel', '取消')}
          </button>
          <button
            type="submit"
            class="Button Button--primary"
            disabled={this.submitting}
          >
            {this.submitting ? this._t('submitting', '提交中...') : this._t('submit', '提交预约')}
          </button>
        </div>
      </form>
    );
  }

  async submit() {
    if (this.submitting) return;

    // 前端基础验证 (跟 server ValidationException 字段对齐)
    this.fieldErrors = {};
    this.formError = '';
    if (!this.form.name || !this.form.name.trim()) this.fieldErrors.name = this._t('error_required', '请填写必填字段');
    if (!this.form.phone || !this.form.phone.trim()) this.fieldErrors.phone = this._t('error_required', '请填写必填字段');
    if (!this.form.booking_date) this.fieldErrors.booking_date = this._t('error_required', '请填写必填字段');
    if (Object.keys(this.fieldErrors).length > 0) {
      m.redraw();
      return;
    }

    this.submitting = true;
    m.redraw();

    try {
      // SOP 126: m.request 走 vendor, Flarum 2.0 forum API base + path
      const body = {
        name: this.form.name.trim(),
        phone: this.form.phone.trim(),
        // age 空字符串 → null (server filter_var null 直接过)
        age: this.form.age !== '' ? Number(this.form.age) : null,
        has_ski_experience: this.form.has_ski_experience === true,
        experience_type: this.form.experience_type,
        booking_date: this.form.booking_date,
      };

      const r = await app.request({
        method: 'POST',
        url: app.forum.attribute('apiUrl') + '/bjxy/bookings',
        body,
      });

      if (r && r.ok) {
        this.success = true;
        m.redraw();
      } else {
        this.formError = (r && r.error) || '提交失败';
        m.redraw();
      }
    } catch (err) {
      // vendor RequestError 没 message, 走 responseText 解析 (SOP 175 同款)
      let errMsg = '提交异常';
      if (err && err.responseText) {
        try {
          const parsed = JSON.parse(err.responseText);
          if (parsed && parsed.errors) {
            // Flarum ValidationException: {errors: {field: msg, ...}}
            this.fieldErrors = parsed.errors;
            errMsg = '';
            // rate_limited 单独显示
            if (parsed.errors.rate_limited) {
              this.formError = parsed.errors.rate_limited;
            } else {
              // 至少有一个字段错误, 不显示全局错误
              this.formError = '';
            }
          } else if (parsed && parsed.error) {
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
      this.formError = this.formError || errMsg;
      m.redraw();
    } finally {
      this.submitting = false;
      m.redraw();
    }
  }
}
