<?php

namespace Ziiven\BjxyWebsite\Api\Controllers;

use Flarum\Http\RequestUtil;
use Flarum\Settings\SettingsRepositoryInterface;
use Flarum\User\User;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;
use Laminas\Diactoros\Response\JsonResponse;

/**
 * GET /api/bjxy/coaches
 * 返回前台展示用的教练列表
 *
 * v0.1.4 改: 优先读 bjxy_coach_user_ids (modal 选 user 后保存), 按 user id 列表直接拿 user
 *   fallback 老的 bjxy_coach_group_ids (group 拉 user, 兼容旧部署)
 *
 * v0.1.5 改: 合并 bjxy_coach_details (JSON: [{userId, bio, achievements, specialties, photoUrl}])
 *   前台每条 coach 拼上 bio/achievements/specialties/photoUrl
 *   photoUrl 优先, 没设 fallback 用 user.avatar_url
 *   没 details 的 user 用空字段 (兼容旧部署)
 *
 * v0.1.10 改: 用 User model 走 avatarUrl accessor (vendor UserResource 行为一致),
 *   之前用 DB::table() 拿裸 avatar_url 字段, 拼成 https://geek.skiE1Xet7eoZjqSVWpF.webp
 *   (域名后没 /assets/avatars/ 路径, 404)
 *   现在用 User::query()->whereIn() 拿 model, 走 User::getAvatarUrlAttribute() accessor
 *   (resolve(Factory::class)->disk('flarum-avatars')->url($value)) 自动拼完整 URL
 *   顺手也拿 srcset (2x/3x) 让 Retina 屏幕显示更清晰
 */
class CoachesController implements RequestHandlerInterface
{
    public function __construct(protected SettingsRepositoryInterface $settings) {}

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        // v0.1.4 优先 user id 列表 (modal 选 user 后保存)
        $userIdsRaw = $this->settings->get('bjxy_coach_user_ids') ?: '[]';
        $userIds = json_decode($userIdsRaw, true);
        if (!is_array($userIds)) $userIds = [];

        // v0.1.5 读 details (key=userId), 前台拼到 coach
        $detailsRaw = $this->settings->get('bjxy_coach_details') ?: '[]';
        $detailsArr = json_decode($detailsRaw, true);
        if (!is_array($detailsArr)) $detailsArr = [];
        $detailsById = [];
        foreach ($detailsArr as $d) {
            if (isset($d['userId'])) $detailsById[(int) $d['userId']] = $d;
        }

        if (!empty($userIds)) {
            // v0.1.10 改: 用 User::query() 走 model (走 avatarUrl/avatarSrcset accessor),
            //   之前用 DB::table() 拿裸 avatar_url 拼错 URL (https://geek.ski<filename> 不是 https://geek.ski/assets/avatars/<filename>)
            $userModels = User::query()
                ->whereIn('id', $userIds)
                ->where('is_email_confirmed', 1)
                ->get()
                ->keyBy('id');

            // 按 userIds 顺序排 (sortablejs 拖拽后的顺序)
            $ordered = [];
            foreach ($userIds as $id) {
                if (isset($userModels[(int) $id])) $ordered[] = $userModels[(int) $id];
            }

            $coaches = array_map(function ($user) use ($detailsById) {
                $d = $detailsById[(int) $user->id] ?? [];
                return [
                    'id' => (int) $user->id,
                    'username' => $user->username,
                    'displayName' => $user->display_name ?: $user->username,
                    // v0.1.10 改: 优先 details.photoUrl (后台上传教练照), 没设 fallback 到 user.avatar_url (用户自己的系统头像)
                    //   user->avatar_url 走 vendor User::getAvatarUrlAttribute() accessor, 自动拼 https://geek.ski/assets/avatars/<filename>
                    'avatarUrl' => (!empty($d['photoUrl'])) ? $d['photoUrl'] : $user->avatar_url,
                    'avatarSrcset' => $user->avatar_srcset,
                    'bio' => $d['bio'] ?? '',
                    'achievements' => $d['achievements'] ?? '',
                    'specialties' => $d['specialties'] ?? '',
                ];
            }, $ordered);

            return new JsonResponse(['coaches' => $coaches]);
        }

        // fallback: 老的 bjxy_coach_group_ids (group 拉 user)
        $idsRaw = $this->settings->get('bjxy_coach_group_ids') ?: '[]';
        $ids = json_decode($idsRaw, true);
        if (!is_array($ids) || empty($ids)) {
            return new JsonResponse(['coaches' => []]);
        }

        // v0.1.10 改: 同样用 User::query() 走 model
        $userModels = User::query()
            ->whereIn('id', function ($query) use ($ids) {
                $query->select('user_id')
                    ->from('group_user')
                    ->whereIn('group_id', $ids);
            })
            ->where('is_email_confirmed', 1)
            ->orderBy('id')
            ->get();

        $coaches = $userModels->map(function ($user) use ($detailsById) {
            $d = $detailsById[(int) $user->id] ?? [];
            return [
                'id' => (int) $user->id,
                'username' => $user->username,
                'displayName' => $user->display_name ?: $user->username,
                'avatarUrl' => (!empty($d['photoUrl'])) ? $d['photoUrl'] : $user->avatar_url,
                'avatarSrcset' => $user->avatar_srcset,
                'bio' => $d['bio'] ?? '',
                'achievements' => $d['achievements'] ?? '',
                'specialties' => $d['specialties'] ?? '',
            ];
        })->values()->all();

        return new JsonResponse(['coaches' => $coaches]);
    }
}
