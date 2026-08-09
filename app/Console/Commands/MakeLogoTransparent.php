<?php

namespace App\Console\Commands;

use App\Services\LogoBackgroundRemover;
use Illuminate\Console\Command;

class MakeLogoTransparent extends Command
{
    protected $signature = 'logo:transparent {path* : Image file(s) to process in place}
                            {--dry-run : Report what would happen without writing}';

    protected $description = 'Strip a solid background from logo image(s), making it transparent';

    public function handle(LogoBackgroundRemover $remover): int
    {
        $failed = 0;

        foreach ($this->argument('path') as $path) {
            if (!file_exists($path)) {
                $this->error("missing: {$path}");
                $failed++;
                continue;
            }

            if ($this->option('dry-run')) {
                $copy = tempnam(sys_get_temp_dir(), 'logo') . '.png';
                copy($path, $copy);
                $r = $remover->process($copy);
                @unlink($copy);
            } else {
                $r = $remover->process($path);
            }

            $this->line(sprintf(
                '%-46s %s  %s%s',
                basename($path),
                $r['changed'] ? '<info>transparent</info>' : '<comment>skipped</comment>',
                $r['reason'],
                $r['removed'] > 0 ? sprintf(' (%.1f%% removed)', $r['removed'] * 100) : ''
            ));
        }

        return $failed > 0 ? self::FAILURE : self::SUCCESS;
    }
}
