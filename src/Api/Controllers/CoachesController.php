<?php

namespace Ziiven\BjxyWebsite\Api\Controllers;

use Flarum\Http\RequestUtil;
use Flarum\Settings\SettingsRepositoryInterface;
use Flarum\User\User;
use Psr\Http\Message\ServerRequestInterface;
use Laminas\Diactoros\Response\JsonResponse;

/**
 * GET /api/bjxy/coaches
 * 返回 bjxy_coach_group_ids (JSON array) 指定 group 下的所有用户 (排序按 join_time)
 * 字段: id, username, displayName, avatarUrl, joinedAt, groupName
 */
class CoachesController
{
    public function __construct(protected SettingsRepositoryInterface $settings) {}

    public function handle(ServerRequestInterface $request): JsonResponse
    {
        $actor = RequestUtil::getActor($request);
        // 任何登录用户都能看 (前台公开)
        $actor->assertRegistered();

        $raw = $this->settings->get('bjxy_coach_group_ids');
        $groupIds = $raw ? json_decode($raw, true) : [];
        if (!is_array($groupIds) || empty($groupIds)) {
            return new JsonResponse(['coaches' => []]);
        }

        $coaches = User::query()
            ->whereIn('id', function ($q) use ($groupIds) {
                $q->select('user_id')
                    ->from('group_user')
                    ->whereIn('group_id', $groupIds);
            })
            ->orderBy('joined_at', 'asc')
            ->get(['id', 'username', 'display_name', 'avatar_url', 'joined_at'])
            ->map(function ($u) {
                return [
                    'id' => (int) $u->id,
                    'username' => $u->username,
                    'displayName' => $u->display_name,
                    'avatarUrl' => $u->avatar_url,
                    'joinedAt' => $u->joined_at?->toIso8601String(),
                ];
            });

        return new JsonResponse(['coaches' => $coaches->toArray()]);
    }
}
