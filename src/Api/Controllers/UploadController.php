<?php

namespace Ziiven\BjxyWebsite\Api\Controllers;

use Flarum\Http\RequestUtil;
use Flarum\Settings\SettingsRepositoryInterface;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Message\UploadedFileInterface;
use Psr\Http\Server\RequestHandlerInterface;
use Laminas\Diactoros\Response\JsonResponse;
use Ziven\Community\Core\Services\TencentCOSService;

/**
 * 接收后台图片上传, 调 ziven-core TencentCOSService 上传到 COS, 返回 CDN URL, 存到 settings
 * POST /api/bjxy/upload
 * multipart: file=@logo.png, key=bjxy_brand_logo_url
 */
class UploadController implements RequestHandlerInterface
{
    public function __construct(
        protected SettingsRepositoryInterface $settings
    ) {}

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $actor = RequestUtil::getActor($request);
        $actor->assertAdmin();

        $body = $request->getParsedBody();
        $key = $body['key'] ?? null;
        $file = $request->getUploadedFiles()['file'] ?? null;

        if (!$key) {
            return new JsonResponse(['error' => 'missing key'], 400);
        }
        if (!$file || $file->getError() !== UPLOAD_ERR_OK) {
            return new JsonResponse(['error' => 'no file uploaded'], 400);
        }
        if (!preg_match('/^bjxy_[a-z_]+$/', $key)) {
            return new JsonResponse(['error' => 'invalid key (must be bjxy_*)'], 400);
        }

        try {
            $cos = new TencentCOSService($this->settings);
            $ext = pathinfo($file->getClientFilename() ?? 'img', PATHINFO_EXTENSION) ?: 'png';
            $ext = preg_replace('/[^a-z0-9]/i', '', strtolower($ext));
            $filename = 'bjxy/' . $key . '_' . time() . '_' . substr(md5(uniqid()), 0, 6) . '.' . $ext;

            // 读 PSR-7 stream 到临时文件
            $tmp = tempnam(sys_get_temp_dir(), 'bjxy_up_');
            $file->moveTo($tmp);

            $url = $cos->upload($tmp, $filename);
            @unlink($tmp);

            if (!$url) {
                return new JsonResponse(['error' => 'cos upload failed'], 500);
            }

            $this->settings->set($key, $url);

            return new JsonResponse([
                'ok' => true,
                'key' => $key,
                'url' => $url,
            ]);
        } catch (\Throwable $e) {
            return new JsonResponse([
                'error' => 'upload exception: ' . $e->getMessage(),
            ], 500);
        }
    }
}
