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
 *
 * v0.2.0e 改: bio 字段优先 fof-user-bio (user->bio, 辉哥 13:01 反馈, 跟 v0.2.0d 装 fof-user-bio 配套)
 *   优先级: fof-user-bio users.bio (admin 在 /u/Ziven 写的 bio) > bjxy_coach_details.bio (admin 在 bjxy 后台设的)
 *   achievements + specialties 还是 bjxy_coach_details (fof-user-bio 没这俩字段, 走 bjxy 单独配置)
 *   photoUrl + avatar 走 bjxy_coach_details.photoUrl 优先 (v0.1.10 模式不变)
 *   后续如果 fof-user-bio 加 achievements + specialties 字段, 同样逻辑加
 *
 * v0.2.0f 改: fof-user-bio 写了时, achievements + specialties 强制空 (辉哥 13:21 反馈)
 *   "写了 fof user bio 后, 专业教练那块的专长和特长也要去掉, 右侧那块只展示 fof user bio 中的内容"
 *   行为: fof-user-bio 有 → bio 优先 + achievements/specialties 强制空 (右侧 info 段只显示 fof user bio)
 *         fof-user-bio 空 → 走 bjxy_coach_details 全部 (bio + achievements + specialties, v0.2.0e 行为)
 *   photoUrl + avatar 走 bjxy_coach_details.photoUrl 优先 (不变)
 *   admin 后台 bjxy_coach_details.specialties/achievements 字段照常保存, 但当用户写了 fof-user-bio 时前端不显示
 *   后续如想恢复: 用户删 fof-user-bio (no bio → 走 bjxy 全部)
 *
 * v0.2.0g 改: 加 bio_from_fof_user_bio 标记 (辉哥 13:33 反馈)
 *   "还有个分割线的残留, 如果填了 fof user bio 的话这个分割线也去掉吧"
 *   行为: 加 'bio_from_fof_user_bio' bool 字段, 告诉前端 bio 来源是 fof-user-bio
 *         前端走 .bjxy-coach--has-fof-user-bio 修饰符, 配合 less 条件式选择器
 *         隐藏 .bjxy-coach-bio 的 border-top 分割线 (之前 v0.1.0o 时代加, 分隔 bio 跟 specialties/achievements)
 *         fof-user-bio 写了时: bio 下面没 specialties/achievements, 分割线没意义, 隐藏
 *         fof-user-bio 没写时: 走 bjxy 全部字段, 分割线分隔 bio 跟 specialties/achievements 有意义, 保留
 *   photoUrl + avatar / bio / achievements / specialties 优先级跟 v0.2.0e + v0.2.0f 一致, 不变
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
                // v0.2.0f 改: fof-user-bio 写了时, achievements + specialties 强制空 (辉哥 13:21 反馈)
                //   右侧 info 段只显示 fof user bio 内容, 专长/成就也去掉
                // v0.2.0g 改: 把 $hasFofUserBio 抽变量, 复用 3 个字段 + 新加 bio_from_fof_user_bio 标记
                $hasFofUserBio = !empty($user->bio);
                return [
                    'id' => (int) $user->id,
                    'username' => $user->username,
                    'displayName' => $user->display_name ?: $user->username,
                    // v0.1.10 改: 优先 details.photoUrl (后台上传教练照), 没设 fallback 到 user.avatar_url (用户自己的系统头像)
                    //   user->avatar_url 走 vendor User::getAvatarUrlAttribute() accessor, 自动拼 https://geek.ski/assets/avatars/<filename>
                    'avatarUrl' => (!empty($d['photoUrl'])) ? $d['photoUrl'] : $user->avatar_url,
                    'avatarSrcset' => $user->avatar_srcset,
                    // v0.2.0e 改: bio 优先 user.bio (fof-user-bio, /u/<user> 个人页 bio), fallback 到 bjxy_coach_details.bio
                    //   !empty() 同时检查 null / '' / 0, 让 fof-user-bio 有值时直接 override bjxy 老 bio
                    // v0.2.0f 改: 当 fof-user-bio 写了时, achievements + specialties 强制空 (跟 bio 一起 override bjxy 全部 info 字段)
                    //   没 fof-user-bio 时, 走 bjxy_coach_details 全部 (bio + achievements + specialties)
                    'bio' => $hasFofUserBio ? $user->bio : ($d['bio'] ?? ''),
                    'achievements' => $hasFofUserBio ? '' : ($d['achievements'] ?? ''),
                    'specialties' => $hasFofUserBio ? '' : ($d['specialties'] ?? ''),
                    // v0.2.0g 新: bio_from_fof_user_bio 标记, 告诉前端 bio 来源是 fof-user-bio
                    //   前端走 .bjxy-coach--has-fof-user-bio 修饰符, 配合 less 条件式选择器
                    //   隐藏 .bjxy-coach-bio 的 border-top 分割线 (v0.1.0o 时代加, 分隔 bio 跟 specialties/achievements)
                    //   字段名走 snake_case (跟 v0.2.0d bjxy_about_desc 等 server API 一致)
                    'bio_from_fof_user_bio' => $hasFofUserBio,
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
            // v0.2.0f 改: fof-user-bio 写了时, achievements + specialties 强制空 (跟主路径一致, 辉哥 13:21 反馈)
            // v0.2.0g 改: 跟主路径一致, 加 bio_from_fof_user_bio 标记
            $hasFofUserBio = !empty($user->bio);
            return [
                'id' => (int) $user->id,
                'username' => $user->username,
                'displayName' => $user->display_name ?: $user->username,
                'avatarUrl' => (!empty($d['photoUrl'])) ? $d['photoUrl'] : $user->avatar_url,
                'avatarSrcset' => $user->avatar_srcset,
                // v0.2.0e 改: bio 优先 user.bio (fof-user-bio), fallback bjxy_coach_details.bio
                // v0.2.0f 改: fof-user-bio 写了时, achievements + specialties 强制空 (跟主路径一致)
                'bio' => $hasFofUserBio ? $user->bio : ($d['bio'] ?? ''),
                'achievements' => $hasFofUserBio ? '' : ($d['achievements'] ?? ''),
                'specialties' => $hasFofUserBio ? '' : ($d['specialties'] ?? ''),
                // v0.2.0g 新: bio_from_fof_user_bio 标记 (跟主路径一致, 辉哥 13:33 反馈)
                'bio_from_fof_user_bio' => $hasFofUserBio,
            ];
        })->values()->all();

        return new JsonResponse(['coaches' => $coaches]);
    }
}
