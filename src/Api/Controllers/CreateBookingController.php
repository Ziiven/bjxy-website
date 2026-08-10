<?php

/*
 * This file is part of ziiven/bjxy-website.
 *
 * Copyright (c) 2026 Ziven.
 *
 * v0.2.0 (辉哥 2026-08-09 8:14 反馈): POST /api/bjxy/bookings
 *   公共接口 (无需登录), 6 字段预约体验表单提交
 *   流程:
 *     1) 解析 + 验证 6 字段
 *     2) 限流: 同 IP 1 分钟内 1 条 (SOP 126 必查 vendor rate limit, 本次简单实现)
 *        查 bjxy_bookings WHERE ip_address = ? AND created_at > NOW() - 1 MINUTE
 *     3) 拿 actor (RequestUtil::getActor), user_id 取 actor->id 或 null
 *     4) 拿 client IP (走 server REMOTE_ADDR, vendor middleware 标准化)
 *     5) 存 Booking
 *     6) 发邮件给 admin (admin user id=1, 或 bjxy_booking_notify_email setting 覆盖)
 *        走 queue + vendor SendInformationalEmailJob (SOP 126)
 *     7) 返 {ok: true, id: $booking->id}
 *   错误处理:
 *     - 字段验证失败: ValidationException 422 + 字段错误
 *     - 限流命中: ValidationException 422 'rate_limited' (跟现有 bjxy 控制器一致)
 *     - 邮件发送失败: log warning, 不阻塞预约主流程
 */

namespace Ziiven\BjxyWebsite\Api\Controllers;

use Carbon\Carbon;
use Flarum\Foundation\ValidationException;
use Flarum\Http\RequestUtil;
use Flarum\Mail\Job\SendInformationalEmailJob;
use Flarum\Settings\SettingsRepositoryInterface;
use Flarum\User\User;
use Illuminate\Contracts\Queue\Queue;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;
use Laminas\Diactoros\Response\JsonResponse;
use Ziiven\BjxyWebsite\Booking;

class CreateBookingController implements RequestHandlerInterface
{
    public function __construct(
        protected SettingsRepositoryInterface $settings,
        protected Queue $queue
    ) {}

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $body = $request->getParsedBody() ?? [];
        if (!is_array($body)) $body = [];

        // 1) 字段验证
        $errors = [];

        $name = trim((string)($body['name'] ?? ''));
        if ($name === '') $errors['name'] = '名字必填';
        elseif (mb_strlen($name) > 100) $errors['name'] = '名字最长 100 字符';

        $phone = trim((string)($body['phone'] ?? ''));
        if ($phone === '') $errors['phone'] = '电话必填';
        elseif (mb_strlen($phone) > 50) $errors['phone'] = '电话最长 50 字符';

        $ageRaw = $body['age'] ?? null;
        $age = null;
        if ($ageRaw !== null && $ageRaw !== '') {
            $age = filter_var($ageRaw, FILTER_VALIDATE_INT);
            if ($age === false || $age < 1 || $age > 150) {
                $errors['age'] = '年龄需 1-150 之间';
            }
        }

        $hasSkiExperience = filter_var($body['has_ski_experience'] ?? false, FILTER_VALIDATE_BOOLEAN);

        $experienceType = (string)($body['experience_type'] ?? '');
        if (!array_key_exists($experienceType, Booking::EXPERIENCE_TYPES)) {
            $errors['experience_type'] = '体验类型必须为 single 或 double';
        }

        $bookingDateRaw = (string)($body['booking_date'] ?? '');
        $bookingDate = null;
        if ($bookingDateRaw === '') {
            $errors['booking_date'] = '预约日期必填';
        } else {
            try {
                $bookingDate = Carbon::createFromFormat('Y-m-d', $bookingDateRaw)->startOfDay();
            } catch (\Throwable $e) {
                $errors['booking_date'] = '预约日期格式错误 (YYYY-MM-DD)';
            }
            if ($bookingDate && $bookingDate->lt(Carbon::today())) {
                $errors['booking_date'] = '预约日期不能早于今天';
            }
        }

        if (!empty($errors)) {
            throw new ValidationException($errors);
        }

        // 2) 限流: 同 IP 1 分钟 N 次 (辉哥 2026-08-11 06:45 反馈, v0.2.0i 改可配置)
        //   之前 v0.1.5 硬编码 "1 分钟 1 次" (SOP 126), 辉哥想放开限制
        //   改: 读 bjxy_booking_rate_limit_per_minute setting (默认 3, 范围 1-60, admin 通用设置 tab 可改)
        //   防御: 设 0 负数 fallback 3 (跟 extend.php serializeToForum default 一致)
        //   拿 client IP: 优先 X-Forwarded-For (Flarum 反代场景), fallback REMOTE_ADDR
        $ipAddress = $this->getClientIp($request);

        $rateLimitPerMinute = (int) $this->settings->get('bjxy_booking_rate_limit_per_minute', 3);
        if ($rateLimitPerMinute < 1) $rateLimitPerMinute = 3;

        $oneMinuteAgo = Carbon::now()->subMinute();
        $recentCount = Booking::query()
            ->where('ip_address', $ipAddress)
            ->where('created_at', '>', $oneMinuteAgo)
            ->count();

        // v0.2.0i 改: > 改 >= (硬编码时 > 0 实际是 1 次, 可配置时 >= N 是 N 次, 跟硬编码行为兼容)
        //   硬编码 1 次时: recentCount >= 1 (即 > 0) 触发限流, 跟原逻辑等价
        //   可配置 N 次时: recentCount >= N 触发限流, 允许 N-1 次正常提交
        if ($recentCount >= $rateLimitPerMinute) {
            throw new ValidationException([
                'rate_limited' => "1 分钟内同 IP 最多可提交 {$rateLimitPerMinute} 次, 请稍后再试",
            ]);
        }

        // 3) 拿 actor (公开提交时 actor 是 guest, id=0)
        $actor = RequestUtil::getActor($request);
        $userId = $actor->id ?? null;
        if ($userId === 0) $userId = null;

        // 4) 5) 存数据库
        $booking = new Booking();
        $booking->name = $name;
        $booking->phone = $phone;
        $booking->age = $age;
        $booking->has_ski_experience = $hasSkiExperience;
        $booking->experience_type = $experienceType;
        $booking->booking_date = $bookingDate ? $bookingDate->toDateString() : null;
        $booking->ip_address = $ipAddress;
        $booking->user_id = $userId;
        $booking->created_at = Carbon::now();
        $booking->save();

        // 6) 发邮件给 admin (走 queue + vendor SendInformationalEmailJob, SOP 126)
        //   收件人: bjxy_booking_notify_email 优先, 留空 fallback admin user id=1 的 email
        $this->dispatchNotificationEmail($booking);

        return new JsonResponse(['ok' => true, 'id' => $booking->id]);
    }

    /**
     * 拿 client IP. 优先 X-Forwarded-For (反代/负载均衡), fallback REMOTE_ADDR
     * 注意: 直接信任 X-Forwarded-For 有 spoofing 风险, 但 bjxy 是公开预约表单,
     *   严格 1 分钟 1 IP 防滥用, 即使有 spoofing 也不影响核心功能
     */
    protected function getClientIp(ServerRequestInterface $request): string
    {
        $serverParams = $request->getServerParams();
        $forwarded = $request->getHeaderLine('X-Forwarded-For');
        if ($forwarded) {
            // X-Forwarded-For: client, proxy1, proxy2; 取最左 client
            $parts = explode(',', $forwarded);
            $ip = trim($parts[0]);
            if ($ip !== '' && strlen($ip) <= 45) return $ip;
        }
        return $serverParams['REMOTE_ADDR'] ?? '0.0.0.0';
    }

    /**
     * 发邮件给 admin (SOP 126 实战: 走 queue + vendor SendInformationalEmailJob)
     * 收件人: bjxy_booking_notify_email setting 优先, fallback admin user id=1 的 email
     *   找不到 admin 时 log warning 不阻塞预约主流程
     */
    protected function dispatchNotificationEmail(Booking $booking): void
    {
        try {
            $notifyEmail = trim((string)$this->settings->get('bjxy_booking_notify_email'));
            if ($notifyEmail === '' || !filter_var($notifyEmail, FILTER_VALIDATE_EMAIL)) {
                // fallback: admin user id=1
                $admin = User::query()->find(1);
                if (!$admin || empty($admin->email)) {
                    \error_log('[bjxy booking] No admin email configured (bjxy_booking_notify_email empty AND admin user id=1 missing)');
                    return;
                }
                $notifyEmail = $admin->email;
                $displayName = $admin->display_name ?? $admin->username ?? 'Admin';
            } else {
                $displayName = 'Admin';
            }

            $forumTitle = (string)$this->settings->get('forum_title') ?: 'Forum';
            $hasSkiText = $booking->has_ski_experience ? '是' : '否';
            $experienceTypeText = Booking::EXPERIENCE_TYPES[$booking->experience_type] ?? $booking->experience_type;

            $body = "收到新的预约体验:\n\n"
                . "姓名: {$booking->name}\n"
                . "电话: {$booking->phone}\n"
                . "年龄: " . ($booking->age !== null ? $booking->age : '(未填)') . "\n"
                . "是否有滑雪基础: {$hasSkiText}\n"
                . "体验类型: {$experienceTypeText}\n"
                . "预约日期: {$booking->booking_date}\n"
                . "提交时间: {$booking->created_at}\n"
                . "提交 IP: " . ($booking->ip_address ?? '(空)') . "\n"
                . "用户: " . ($booking->user_id !== null ? "Flarum user #{$booking->user_id}" : '公开提交') . "\n\n"
                . "—— Flarum 自动通知";

            $subject = "[预约体验] {$booking->name} - {$booking->booking_date}";

            $this->queue->push(new SendInformationalEmailJob(
                email: $notifyEmail,
                displayName: $displayName,
                subject: $subject,
                body: $body,
                forumTitle: $forumTitle,
            ));
        } catch (\Throwable $e) {
            // 邮件失败不阻塞预约主流程, log warning 让 admin 查 laravel.log
            \error_log('[bjxy booking] Email dispatch failed: ' . $e->getMessage());
        }
    }
}
