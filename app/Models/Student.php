<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Student extends Model
{
    use HasFactory, SoftDeletes;

    protected $primaryKey = 'student_id';

    protected $fillable = [
        'school_id',
        'name',
        'ic_number',
        'gender',
        'address',
        'street_address',
        'city',
        'state',
        'postcode',
        'country',
        'email',
        'phone_num',
        'class',
        'profile_pic_path',
        'father_name',
        'father_ic',
        'father_phone_num',
        'mother_name',
        'mother_ic',
        'mother_phone_num',
        'emergency_name',
        'emergency_phone_num',
        'emergency_relation',
        'is_active',

        // APDM Student Identity & Enrolment Attributes
        'id_murid',
        'jenis_pengenalan',
        'tarikh_lahir',
        'status_pengajian',
        'tarikh_masuk_sekolah',
        'tarikh_masuk_kelas',
        'tahun_tingkatan',
        'status_dlp',
        'jenis_kelas',
        'keterangan_aliran',
        'keterangan_bidang',
        'nama_guru_kelas',
        'kaum',
        'agama',
        'warganegara',
        'negara_asal',
        'status_asrama',
        'nama_asrama',
        'status_oku',
        'tarikh_sah_oku',
        'no_pendaftaran_oku',
        'tarikh_daftar_oku',
        'tarikh_kad_oku',
        'kategori_ketidakupayaan',
        'subkategori_ketidakupayaan',
        'status_yatim',
        'no_akaun_bank',
        'nama_bank',

        // APDM Guardian 1 Details
        'penjaga_1_name',
        'penjaga_1_ic',
        'penjaga_1_jenis_ic',
        'penjaga_1_hubungan',
        'penjaga_1_pekerjaan',
        'penjaga_1_status_kerja',
        'penjaga_1_majikan',
        'penjaga_1_pendapatan',
        'penjaga_1_tel_pejabat',
        'penjaga_1_tel_bimbit',
        'tanggungan',

        // APDM Guardian 2 Details
        'penjaga_2_name',
        'penjaga_2_ic',
        'penjaga_2_jenis_ic',
        'penjaga_2_hubungan',
        'penjaga_2_pekerjaan',
        'penjaga_2_status_kerja',
        'penjaga_2_majikan',
        'penjaga_2_pendapatan',
        'penjaga_2_tel_pejabat',
        'penjaga_2_tel_bimbit',

        // APDM Address Breakdown
        'alamat_1',
        'alamat_2',
        'alamat_3',
        'daerah',

        // Full Raw JSON
        'apdm_raw',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'apdm_raw' => 'array',
    ];

    public function school()
    {
        return $this->belongsTo(School::class, 'school_id', 'school_id');
    }

    public function enrollments()
    {
        return $this->hasMany(Enrollment::class, 'student_id', 'student_id');
    }

    /**
     * Helper method to get the student's enrollment for a specific session
     */
    public function getEnrollmentForSession($sessionId)
    {
        return $this->enrollments()->where('school_session_id', $sessionId)->first();
    }

    public function coCurriculars()
    {
        return $this->belongsToMany(CoCurricular::class, 'co_curricular_student', 'student_id', 'co_curricular_id')
                    ->withPivot('school_session_id')
                    ->withTimestamps();
    }

    public function sportHouses()
    {
        return $this->belongsToMany(SportHouse::class, 'sport_house_student', 'student_id', 'sport_house_id')
                    ->withPivot('school_session_id', 'school_id')
                    ->withTimestamps();
    }
}
