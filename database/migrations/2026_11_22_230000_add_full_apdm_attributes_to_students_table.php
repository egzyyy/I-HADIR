<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // First convert some existing address / descriptive columns to TEXT to free up InnoDB row size buffer
        DB::statement("ALTER TABLE `students` ROW_FORMAT=DYNAMIC");

        Schema::table('students', function (Blueprint $table) {
            $cols = [
                'id_murid' => 'string:100',
                'jenis_pengenalan' => 'string:50',
                'tarikh_lahir' => 'string:50',
                'status_pengajian' => 'string:100',
                'tarikh_masuk_sekolah' => 'string:50',
                'tarikh_masuk_kelas' => 'string:50',
                'tahun_tingkatan' => 'string:50',
                'status_dlp' => 'string:50',
                'jenis_kelas' => 'string:100',
                'keterangan_aliran' => 'text',
                'keterangan_bidang' => 'text',
                'nama_guru_kelas' => 'string:150',
                'kaum' => 'string:100',
                'agama' => 'string:100',
                'warganegara' => 'string:100',
                'negara_asal' => 'string:100',
                'status_asrama' => 'string:100',
                'nama_asrama' => 'string:150',
                'status_oku' => 'string:50',
                'tarikh_sah_oku' => 'string:50',
                'no_pendaftaran_oku' => 'string:100',
                'tarikh_daftar_oku' => 'string:50',
                'tarikh_kad_oku' => 'string:50',
                'kategori_ketidakupayaan' => 'string:150',
                'subkategori_ketidakupayaan' => 'string:150',
                'status_yatim' => 'string:100',
                'no_akaun_bank' => 'string:100',
                'nama_bank' => 'string:150',
                'penjaga_1_name' => 'string:150',
                'penjaga_1_ic' => 'string:50',
                'penjaga_1_jenis_ic' => 'string:50',
                'penjaga_1_hubungan' => 'string:100',
                'penjaga_1_pekerjaan' => 'string:150',
                'penjaga_1_status_kerja' => 'string:100',
                'penjaga_1_majikan' => 'string:150',
                'penjaga_1_pendapatan' => 'string:50',
                'penjaga_1_tel_pejabat' => 'string:50',
                'penjaga_1_tel_bimbit' => 'string:50',
                'tanggungan' => 'string:50',
                'penjaga_2_name' => 'string:150',
                'penjaga_2_ic' => 'string:50',
                'penjaga_2_jenis_ic' => 'string:50',
                'penjaga_2_hubungan' => 'string:100',
                'penjaga_2_pekerjaan' => 'string:150',
                'penjaga_2_status_kerja' => 'string:100',
                'penjaga_2_majikan' => 'string:150',
                'penjaga_2_pendapatan' => 'string:50',
                'penjaga_2_tel_pejabat' => 'string:50',
                'penjaga_2_tel_bimbit' => 'string:50',
                'alamat_1' => 'text',
                'alamat_2' => 'text',
                'alamat_3' => 'text',
                'daerah' => 'string:100',
                'apdm_raw' => 'json',
            ];

            foreach ($cols as $colName => $colDef) {
                if (!Schema::hasColumn('students', $colName)) {
                    if ($colDef === 'text') {
                        $table->text($colName)->nullable();
                    } elseif ($colDef === 'json') {
                        $table->json($colName)->nullable();
                    } elseif (str_starts_with($colDef, 'string:')) {
                        $len = (int)str_replace('string:', '', $colDef);
                        $table->string($colName, $len)->nullable();
                    } else {
                        $table->string($colName)->nullable();
                    }
                }
            }
        });
    }

    public function down(): void
    {
        // Keep columns safe on rollback
    }
};
