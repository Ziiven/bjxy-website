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
        // v0.1.7 修 (重要, 辉哥 11:00 反馈): 详细错误码, 不再统一报 "no file uploaded"
        //   之前一律 400 + "no file uploaded", 用户看不到是文件太大还是其他
        //   实际 PHP 上传失败有 5 种错误码 (UPLOAD_ERR_*):
        //   - UPLOAD_ERR_INI_SIZE (1) = 超过 upload_max_filesize (默认 2M)
        //   - UPLOAD_ERR_FORM_SIZE (2) = 超过 form MAX_FILE_SIZE
        //   - UPLOAD_ERR_PARTIAL (3) = 文件只上传了一部分
        //   - UPLOAD_ERR_NO_FILE (4) = 没有文件被上传
        //   - UPLOAD_ERR_NO_TMP_DIR (6) = 缺少临时文件夹
        //   - UPLOAD_ERR_CANT_WRITE (7) = 写入磁盘失败
        //   - UPLOAD_ERR_EXTENSION (8) = PHP 扩展阻止了上传
        //   修复: 区分错误码, 返回具体错误信息, 帮用户知道是文件太大还是其他
        if (!$file) {
            return new JsonResponse(['error' => 'no file uploaded (前端没传 file 字段)'], 400);
        }
        if ($file->getError() === UPLOAD_ERR_INI_SIZE) {
            $maxSize = ini_get('upload_max_filesize');
            return new JsonResponse([
                'error' => "文件超过 PHP upload_max_filesize 限制 ({$maxSize}). 请压缩图片到 {$maxSize} 以下, 或联系管理员调大 php.ini",
            ], 400);
        }
        if ($file->getError() === UPLOAD_ERR_FORM_SIZE) {
            return new JsonResponse(['error' => '文件超过 form MAX_FILE_SIZE 限制'], 400);
        }
        if ($file->getError() === UPLOAD_ERR_PARTIAL) {
            return new JsonResponse(['error' => '文件只上传了一部分, 请重新上传'], 400);
        }
        if ($file->getError() === UPLOAD_ERR_NO_FILE) {
            return new JsonResponse(['error' => '没有选择文件, 请重新选择'], 400);
        }
        if ($file->getError() === UPLOAD_ERR_NO_TMP_DIR) {
            return new JsonResponse(['error' => '服务器缺少临时文件夹, 联系管理员'], 500);
        }
        if ($file->getError() === UPLOAD_ERR_CANT_WRITE) {
            return new JsonResponse(['error' => '服务器写入文件失败, 联系管理员'], 500);
        }
        if ($file->getError() === UPLOAD_ERR_EXTENSION) {
            return new JsonResponse(['error' => 'PHP 扩展阻止了上传, 联系管理员'], 500);
        }
        if ($file->getError() !== UPLOAD_ERR_OK) {
            return new JsonResponse(['error' => '上传失败 (未知错误码 ' . $file->getError() . ')'], 400);
        }
        // v0.1.6a 修: 允许数字 (uploadPhotoToArray 用 bjxy_review_photo_0_1785505949137
        //   包含 array index + Date.now() timestamp, 原来 ^[a-z_]+$ 严格不接受)
        if (!preg_match('/^bjxy_[a-z0-9_]+$/', $key)) {
            return new JsonResponse(['error' => 'invalid key (must be bjxy_*)'], 400);
        }

        try {
            $cos = new TencentCOSService($this->settings);

            if (!$cos->isEnabled()) {
                return new JsonResponse(['error' => 'COS not enabled (ziven-core.cos_enabled=0)'], 400);
            }

            $ext = pathinfo($file->getClientFilename() ?? 'img', PATHINFO_EXTENSION) ?: 'png';
            $ext = preg_replace('/[^a-z0-9]/i', '', strtolower($ext));
            $cosKey = 'bjxy/' . $key . '_' . time() . '_' . substr(md5(uniqid()), 0, 6) . '.' . $ext;

            // 读 PSR-7 stream 到临时文件
            $tmp = tempnam(sys_get_temp_dir(), 'bjxy_up_');
            $file->moveTo($tmp);

            // v0.1.0g 修: ziven-core v0.4.8 重构了 TencentCOSService API
            // 旧 API upload($tmp, $filename) 不存在, 改用 uploadContent($cosKey, $content, $contentType)
            // 返 COS key (不是 URL), 需要 getFileUrl() 转完整 URL
            $content = file_get_contents($tmp);
            $contentType = mime_content_type($tmp) ?: 'image/jpeg';
            $uploadedKey = $cos->uploadContent($cosKey, $content, $contentType);
            @unlink($tmp);

            if (!$uploadedKey) {
                return new JsonResponse(['error' => 'cos upload failed'], 500);
            }

            $url = $cos->getFileUrl($uploadedKey);
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
