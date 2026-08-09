<?php

namespace App\Services;

/**
 * Makes a logo's background transparent.
 *
 * Works by flood-filling inward from the image border through pixels close to
 * the border colour. Filling from the border (rather than matching colour
 * globally) means white *inside* the artwork — the page of a book in a crest,
 * a white star, text — is preserved, because the fill can't reach it.
 *
 * Deliberately conservative: if the border isn't a reasonably uniform colour,
 * the image is left untouched. A photographic or textured backdrop needs real
 * subject/background separation, and a naive key would eat into the artwork.
 * Better to leave such a logo alone than to damage it.
 *
 * Memory matters here: a 1700x1700 upload holds ~2.9M pixels, and naive
 * per-pixel PHP structures blow past the default 128M limit. So the working
 * image is capped at MAX_EDGE, colour is packed into one array, and the masks
 * are byte strings rather than arrays.
 */
class LogoBackgroundRemover
{
    /**
     * Longest edge of the processed image. Logos render at =96px in this app,
     * so this is already heavily oversampled; anything larger is downscaled,
     * which also keeps page weight sane.
     */
    private const MAX_EDGE = 1200;

    /**
     * Max RGB spread across the border ring for it to count as "solid".
     * A flat background sits near 0; JPEG ringing on white pushes it into the
     * low teens; a photographic backdrop lands well above this.
     */
    private const BORDER_UNIFORMITY = 18.0;

    /** Base colour distance treated as "same as background". */
    private const MIN_TOLERANCE = 30.0;
    private const MAX_TOLERANCE = 72.0;

    /**
     * Refuse the result if it would erase essentially the whole image. Set high
     * because legitimately sparse logos — thin text across a wide canvas — are
     * mostly background and can exceed 97%.
     */
    private const MAX_REMOVED_RATIO = 0.995;

    private string $currentPath = '';

    /**
     * Processes the image in place. Because the output is always PNG, a source
     * with a different extension is rewritten alongside and the original
     * removed — `path` reports where the image ended up.
     *
     * @return array{changed: bool, reason: string, removed: float, path: string}
     */
    public function process(string $absolutePath): array
    {
        $this->currentPath = $absolutePath;

        $raw = @file_get_contents($absolutePath);
        if ($raw === false) {
            return $this->result(false, 'unreadable');
        }

        // SVG is vector — it has no raster background to strip.
        if (str_contains(substr($raw, 0, 512), '<svg')) {
            return $this->result(false, 'vector');
        }

        $src = @imagecreatefromstring($raw);
        unset($raw);
        if (!$src) {
            return $this->result(false, 'undecodable');
        }

        // Palette images (PNG colour type 3, GIF) return a palette *index* from
        // imagecolorat(), not a packed colour. Promote first or every pixel
        // read below is garbage.
        if (!imageistruecolor($src)) {
            imagepalettetotruecolor($src);
        }

        $src = $this->capSize($src);
        imagealphablending($src, false);
        imagesavealpha($src, true);

        $w = imagesx($src);
        $h = imagesy($src);
        $n = $w * $h;

        [$rgb, $hasAlpha] = $this->readPixels($src, $w, $h, $n);

        if ($hasAlpha) {
            imagedestroy($src);
            return $this->result(false, 'already-transparent');
        }

        $border = $this->borderStats($rgb, $w, $h);
        if ($border['spread'] > self::BORDER_UNIFORMITY) {
            imagedestroy($src);
            return $this->result(false, 'background-not-uniform');
        }

        $tolerance = min(
            self::MAX_TOLERANCE,
            max(self::MIN_TOLERANCE, $border['spread'] * 3.0)
        );

        $mask = $this->floodFromBorder($rgb, $w, $h, $n, $border, $tolerance);
        $removed = (substr_count($mask, "\x00")) / $n;

        if ($removed >= self::MAX_REMOVED_RATIO) {
            imagedestroy($src);
            return $this->result(false, 'would-erase-everything', $removed);
        }

        $mask = $this->feather($mask, $w, $h);

        // Output is always PNG (JPEG/GIF can't carry an alpha channel), so a
        // source with another extension is rewritten as .png and the original
        // deleted — otherwise the file would be served with the wrong MIME type.
        $target = preg_replace('/\.[^.\/\\\\]+$/', '', $absolutePath) . '.png';
        $this->writePng($target, $rgb, $mask, $w, $h);
        imagedestroy($src);

        if ($target !== $absolutePath && file_exists($absolutePath)) {
            @unlink($absolutePath);
        }
        $this->currentPath = $target;

        return $this->result(true, 'ok', $removed);
    }

    // ─── steps ──────────────────────────────────────────────────────────────

    /** Downscales so the longest edge is at most MAX_EDGE. */
    private function capSize(\GdImage $src): \GdImage
    {
        $w = imagesx($src);
        $h = imagesy($src);
        $longest = max($w, $h);

        if ($longest <= self::MAX_EDGE) {
            return $src;
        }

        $scale = self::MAX_EDGE / $longest;
        $nw = max(1, (int) round($w * $scale));
        $nh = max(1, (int) round($h * $scale));

        $out = imagecreatetruecolor($nw, $nh);
        imagealphablending($out, false);
        imagesavealpha($out, true);
        imagecopyresampled($out, $src, 0, 0, 0, 0, $nw, $nh, $w, $h);
        imagedestroy($src);

        return $out;
    }

    /**
     * Reads colour into a single packed array and reports whether the source
     * already carries meaningful transparency.
     *
     * @return array{0: \SplFixedArray, 1: bool}
     */
    private function readPixels(\GdImage $src, int $w, int $h, int $n): array
    {
        $rgb = new \SplFixedArray($n);
        $clear = 0;

        for ($y = 0, $i = 0; $y < $h; $y++) {
            for ($x = 0; $x < $w; $x++, $i++) {
                $c = imagecolorat($src, $x, $y);
                if ((($c >> 24) & 0x7F) > 100) {
                    $clear++;
                }
                $rgb[$i] = $c & 0xFFFFFF;
            }
        }

        return [$rgb, ($clear / $n) > 0.02];
    }

    /** Mean colour and spread of the 1px border ring. */
    private function borderStats(\SplFixedArray $rgb, int $w, int $h): array
    {
        $idx = [];
        for ($x = 0; $x < $w; $x++) { $idx[] = $x; $idx[] = ($h - 1) * $w + $x; }
        for ($y = 0; $y < $h; $y++) { $idx[] = $y * $w; $idx[] = $y * $w + $w - 1; }

        $sr = $sg = $sb = 0;
        foreach ($idx as $i) {
            $c = $rgb[$i];
            $sr += ($c >> 16) & 0xFF;
            $sg += ($c >> 8) & 0xFF;
            $sb += $c & 0xFF;
        }
        $count = count($idx);
        $mr = $sr / $count; $mg = $sg / $count; $mb = $sb / $count;

        $sum = 0.0;
        foreach ($idx as $i) {
            $c = $rgb[$i];
            $sum += sqrt(
                ((($c >> 16) & 0xFF) - $mr) ** 2
                + ((($c >> 8) & 0xFF) - $mg) ** 2
                + (($c & 0xFF) - $mb) ** 2
            );
        }

        return ['r' => $mr, 'g' => $mg, 'b' => $mb, 'spread' => $sum / $count];
    }

    /**
     * 4-connected flood from every border pixel within tolerance.
     * Returns a byte-string mask: "\xFF" keep, "\x00" transparent.
     */
    private function floodFromBorder(
        \SplFixedArray $rgb, int $w, int $h, int $n, array $bg, float $tolerance
    ): string {
        $mask = str_repeat("\xFF", $n);
        $tol2 = $tolerance * $tolerance;
        $mr = $bg['r']; $mg = $bg['g']; $mb = $bg['b'];

        // Manual ring buffer — SplQueue/array stacks cost ~100 bytes a node,
        // which is what exhausts memory on large images.
        $queue = new \SplFixedArray($n);
        $head = 0;
        $tail = 0;

        for ($i = 0; $i < $n; $i++) {
            $x = $i % $w;
            $y = intdiv($i, $w);
            if ($x !== 0 && $y !== 0 && $x !== $w - 1 && $y !== $h - 1) {
                continue;
            }
            if ($mask[$i] === "\x00") {
                continue;
            }
            $c = $rgb[$i];
            $d = ((($c >> 16) & 0xFF) - $mr) ** 2
               + ((($c >> 8) & 0xFF) - $mg) ** 2
               + (($c & 0xFF) - $mb) ** 2;
            if ($d > $tol2) {
                continue;
            }
            $mask[$i] = "\x00";
            $queue[$tail++] = $i;
        }

        while ($head < $tail) {
            $i = $queue[$head++];
            $x = $i % $w;
            $y = intdiv($i, $w);

            foreach ([
                $x > 0 ? $i - 1 : -1,
                $x < $w - 1 ? $i + 1 : -1,
                $y > 0 ? $i - $w : -1,
                $y < $h - 1 ? $i + $w : -1,
            ] as $j) {
                if ($j < 0 || $mask[$j] === "\x00") {
                    continue;
                }
                $c = $rgb[$j];
                $d = ((($c >> 16) & 0xFF) - $mr) ** 2
                   + ((($c >> 8) & 0xFF) - $mg) ** 2
                   + (($c & 0xFF) - $mb) ** 2;
                if ($d > $tol2) {
                    continue;
                }
                $mask[$j] = "\x00";
                $queue[$tail++] = $j;
            }
        }

        return $mask;
    }

    /** Single 3x3 average pass on boundary pixels only, to soften the cut. */
    private function feather(string $mask, int $w, int $h): string
    {
        $out = $mask;
        for ($y = 1; $y < $h - 1; $y++) {
            $row = $y * $w;
            for ($x = 1; $x < $w - 1; $x++) {
                $i = $row + $x;
                $sum = ord($mask[$i - $w - 1]) + ord($mask[$i - $w]) + ord($mask[$i - $w + 1])
                     + ord($mask[$i - 1])      + ord($mask[$i])      + ord($mask[$i + 1])
                     + ord($mask[$i + $w - 1]) + ord($mask[$i + $w]) + ord($mask[$i + $w + 1]);
                $avg = intdiv($sum, 9);
                if ($avg > 0 && $avg < 255) {
                    $out[$i] = chr($avg);
                }
            }
        }

        return $out;
    }

    private function writePng(string $path, \SplFixedArray $rgb, string $mask, int $w, int $h): void
    {
        $dst = imagecreatetruecolor($w, $h);
        imagealphablending($dst, false);
        imagesavealpha($dst, true);

        for ($y = 0, $i = 0; $y < $h; $y++) {
            for ($x = 0; $x < $w; $x++, $i++) {
                $c = $rgb[$i];
                // GD alpha is inverted: 0 = opaque, 127 = fully clear.
                $a = 127 - intdiv(ord($mask[$i]) * 127, 255);
                imagesetpixel($dst, $x, $y, imagecolorallocatealpha(
                    $dst, ($c >> 16) & 0xFF, ($c >> 8) & 0xFF, $c & 0xFF, $a
                ));
            }
        }

        imagepng($dst, $path, 9);
        imagedestroy($dst);
    }

    private function result(bool $changed, string $reason, float $removed = 0.0): array
    {
        return [
            'changed' => $changed,
            'reason'  => $reason,
            'removed' => $removed,
            'path'    => $this->currentPath,
        ];
    }
}
