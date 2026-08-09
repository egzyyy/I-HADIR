<?php

namespace App\Http\Controllers;

use App\Models\School;
use App\Models\SystemSetting;
use App\Services\LogoBackgroundRemover;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

/**
 * Manages the two brand logos that appear side by side across the app.
 *
 * Left slot  — dynamic. The school's own logo on school-scoped pages, or the
 *              I-HADIR system logo where no school context exists (general
 *              landing, login).
 * Right slot — the UMPSA Fakulti Komputeran logo. Static, shipped as a frontend
 *              asset, and deliberately NOT editable here.
 */
class BrandingController extends Controller
{
    private const SYSTEM_LOGO_KEY = 'system_logo_path';

    /** Keep in sync with MAX_BYTES in Components/admin/LogoUploader.tsx. */
    private const MAX_KB = 10240; // 10 MB
    private const RULES = 'required|image|mimes:png,jpg,jpeg,webp,svg|max:' . self::MAX_KB;

    /**
     * The system logo is shared by every school, so only the System
     * Administrator may change it — a Co-Administrator cannot. Both carry the
     * Admin role, so the distinction has to come from `position`.
     */
    private const SYSTEM_ADMIN_POSITION = 'system administrator';

    /**
     * Public. Resolves whatever the caller can see without authenticating:
     * always the system logo, plus a school logo when ?slug= is supplied or a
     * session exists.
     */
    public function show(Request $request)
    {
        $school = null;

        if ($request->filled('slug')) {
            $school = School::where('slug', $request->slug)->first();
        } elseif (auth()->check()) {
            $school = School::find(auth()->user()->school_id);
        } else {
            // Logged-out pages with no school in the URL — the login screen in
            // particular — still need a crest. Resolve it only when the system
            // hosts a single school; with several, guessing would brand the
            // page as the wrong one, so the frontend default is used instead.
            $active = School::where('is_active', true)->limit(2)->get();
            $school = $active->count() === 1 ? $active->first() : null;
        }

        return response()->json([
            'success' => true,
            'data'    => [
                'system_logo' => $this->url(SystemSetting::getValue(self::SYSTEM_LOGO_KEY)),
                'school_logo' => $this->url($school?->logo_path),
                'school_name' => $school?->name,
                // Lets the admin UI hide the system-logo controls it can't use.
                'can_manage_system_logo' => $this->isSystemAdmin(),
                // Real ceiling, so the UI never promises more than PHP accepts.
                'max_upload_mb' => $this->effectiveMaxUploadMb(),
            ],
        ]);
    }

    // ─── School logo (per-school, admin) ────────────────────────────────────

    public function uploadSchoolLogo(Request $request)
    {
        if ($tooLarge = $this->denyIfPostDiscarded($request)) {
            return $tooLarge;
        }

        $request->validate(['logo' => self::RULES]);

        $school = School::findOrFail(auth()->user()->school_id);

        $this->deleteIfManaged($school->logo_path);
        $stored = $request->file('logo')->store('logos/schools', 'public');
        [$stored, $bg] = $this->maybeRemoveBackground($stored, $request);

        $school->logo_path = $stored;
        $school->save();

        return response()->json([
            'success'    => true,
            'message'    => 'School logo updated.' . $this->backgroundNote($bg),
            'background' => $bg,
            'data'       => ['school_logo' => $this->url($stored)],
        ]);
    }

    public function resetSchoolLogo()
    {
        $school = School::findOrFail(auth()->user()->school_id);

        $this->deleteIfManaged($school->logo_path);
        $school->logo_path = null;
        $school->save();

        return response()->json([
            'success' => true,
            'message' => 'School logo reset to the built-in default.',
            'data'    => ['school_logo' => null],
        ]);
    }

    // ─── System logo (global, admin) ────────────────────────────────────────

    public function uploadSystemLogo(Request $request)
    {
        if ($denied = $this->denySystemLogoChange()) {
            return $denied;
        }

        if ($tooLarge = $this->denyIfPostDiscarded($request)) {
            return $tooLarge;
        }

        $request->validate(['logo' => self::RULES]);

        $this->deleteIfManaged(SystemSetting::getValue(self::SYSTEM_LOGO_KEY));
        $path = $request->file('logo')->store('logos/system', 'public');
        [$path, $bg] = $this->maybeRemoveBackground($path, $request);

        SystemSetting::setValue(self::SYSTEM_LOGO_KEY, $path);

        return response()->json([
            'success'    => true,
            'message'    => 'System logo updated.' . $this->backgroundNote($bg),
            'background' => $bg,
            'data'       => ['system_logo' => $this->url($path)],
        ]);
    }

    public function resetSystemLogo()
    {
        if ($denied = $this->denySystemLogoChange()) {
            return $denied;
        }

        $this->deleteIfManaged(SystemSetting::getValue(self::SYSTEM_LOGO_KEY));
        SystemSetting::setValue(self::SYSTEM_LOGO_KEY, null);

        return response()->json([
            'success' => true,
            'message' => 'System logo reset to the built-in default.',
            'data'    => ['system_logo' => null],
        ]);
    }

    // ─── Background removal ─────────────────────────────────────────────────

    /**
     * Strips a solid background from the freshly stored logo unless the caller
     * opted out. Returns the (possibly renamed) storage-relative path plus the
     * remover's verdict.
     *
     * @return array{0: string, 1: array}
     */
    private function maybeRemoveBackground(string $storedPath, Request $request): array
    {
        if (!$request->boolean('remove_background', true)) {
            return [$storedPath, ['changed' => false, 'reason' => 'disabled']];
        }

        $disk = Storage::disk('public');
        $result = app(LogoBackgroundRemover::class)->process($disk->path($storedPath));

        if (!$result['changed']) {
            return [$storedPath, $result];
        }

        // The remover always writes PNG, so the extension may have changed.
        $newPath = dirname($storedPath) . '/' . basename($result['path']);

        return [str_replace('\\', '/', $newPath), $result];
    }

    /** Only worth mentioning when the admin asked for removal and didn't get it. */
    private function backgroundNote(array $bg): string
    {
        if ($bg['changed'] ?? false) {
            return ' Background made transparent.';
        }

        return match ($bg['reason'] ?? '') {
            'already-transparent'     => ' It already had a transparent background.',
            'background-not-uniform'  => ' The background was too detailed to remove automatically, so it was left as-is.',
            'would-erase-everything'  => ' Automatic background removal was skipped — it would have erased the logo.',
            'vector'                  => '',
            'disabled'                => '',
            default                   => ' The background could not be removed automatically.',
        };
    }

    // ─── Helpers ────────────────────────────────────────────────────────────

    /**
     * When a request body exceeds PHP's `post_max_size`, PHP discards it before
     * Laravel runs — $_POST and $_FILES arrive empty, so plain validation would
     * report a misleading "logo is required". Detect that and say what actually
     * happened.
     */
    private function denyIfPostDiscarded(Request $request)
    {
        $length = (int) $request->server('CONTENT_LENGTH', 0);
        $discarded = $length > 0 && empty($_POST) && empty($_FILES);

        if (!$discarded) {
            return null;
        }

        return response()->json([
            'success' => false,
            'message' => 'That file is too large for the server to accept. '
                . 'The limit is currently ' . ini_get('post_max_size')
                . ' per request (post_max_size in php.ini).',
        ], 413);
    }

    /**
     * The app allows MAX_KB, but PHP rejects oversized bodies before Laravel's
     * validator ever runs (post_max_size / upload_max_filesize, enforced by
     * ValidatePostSize). Report whichever is smallest so the UI states a limit
     * that actually holds — and self-corrects if php.ini is raised later.
     */
    private function effectiveMaxUploadMb(): float
    {
        $limits = [self::MAX_KB / 1024];

        foreach (['post_max_size', 'upload_max_filesize'] as $key) {
            $mb = $this->iniToMb((string) ini_get($key));
            if ($mb > 0) {
                $limits[] = $mb;
            }
        }

        return round(min($limits), 1);
    }

    /** Converts a php.ini shorthand size ("8M", "512K", "1G") to megabytes. */
    private function iniToMb(string $value): float
    {
        $value = trim($value);
        if ($value === '' || $value === '-1') {
            return 0.0;
        }

        $unit = strtolower(substr($value, -1));
        $num = (float) $value;

        return match ($unit) {
            'g' => $num * 1024,
            'm' => $num,
            'k' => $num / 1024,
            default => $num / 1048576, // plain bytes
        };
    }

    private function isSystemAdmin(): bool
    {
        $position = auth()->user()?->position;

        return $position !== null
            && strtolower(trim($position)) === self::SYSTEM_ADMIN_POSITION;
    }

    /** Returns a 403 response when the caller may not touch the system logo. */
    private function denySystemLogoChange()
    {
        if ($this->isSystemAdmin()) {
            return null;
        }

        return response()->json([
            'success' => false,
            'message' => 'Only the System Administrator can change the I-HADIR system logo.',
        ], 403);
    }

    /** Null path means "no upload — the frontend falls back to its bundled default". */
    private function url(?string $path): ?string
    {
        return $path ? Storage::url($path) : null;
    }

    /**
     * Only removes files this controller wrote. Seeded defaults are stored as
     * plain public/ filenames (no "logos/" prefix) and must survive a reset.
     */
    private function deleteIfManaged(?string $path): void
    {
        if ($path && str_starts_with($path, 'logos/')) {
            Storage::disk('public')->delete($path);
        }
    }
}
