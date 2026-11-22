<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\Classroom;
use App\Models\Enrollment;
use App\Models\SchoolSession;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use ZipArchive;

class ApdmController extends Controller
{
    /**
     * Preview parsed records from the uploaded APDM Excel/CSV file before committing.
     */
    public function preview(Request $request)
    {
        $request->validate([
            'file' => 'required|file|max:15360',
        ]);

        try {
            $parsed = $this->parseApdmFile($request->file('file'));
            if (!$parsed['success']) {
                return response()->json(['message' => $parsed['message']], 400);
            }

            $students = $parsed['students'];
            if (empty($students)) {
                return response()->json([
                    'message' => 'No valid student records found in the file. Please ensure rows contain at least NAMA and NO. PENGENALAN.'
                ], 400);
            }

            $classes = array_values(array_unique(array_filter(array_column($students, 'class_name'))));

            return response()->json([
                'success' => true,
                'total_count' => count($students),
                'classes' => $classes,
                'students' => $students,
            ]);
        } catch (\Throwable $e) {
            Log::error('APDM Preview Error: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json([
                'message' => 'Failed to preview APDM file: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Import students from APDM CSV or Excel file.
     * Supports both the official 61-column MOE APDM format ("Keseluruhan Murid")
     * and direct import of previously previewed students.
     */
    public function import(Request $request)
    {
        $request->validate([
            'classroom_id' => 'nullable|string',
            'file' => 'nullable|file|max:15360',
            'students' => 'nullable|array',
        ]);

        $schoolId = auth()->check() ? auth()->user()->school_id : 1;

        // Fetch active school session
        $activeSession = SchoolSession::where('school_id', $schoolId)->where('is_active', true)->first();
        if (!$activeSession) {
            $activeSession = SchoolSession::where('school_id', $schoolId)->latest('school_session_id')->first();
        }
        if (!$activeSession) {
            return response()->json([
                'message' => 'No active school session found. Please set up a school session first.'
            ], 400);
        }

        // Determine destination classroom if explicitly selected
        $defaultClassroom = null;
        if ($request->filled('classroom_id') && is_numeric($request->classroom_id)) {
            $defaultClassroom = Classroom::where('school_id', $schoolId)
                ->where('classroom_id', (int)$request->classroom_id)
                ->first();

            if (!$defaultClassroom) {
                return response()->json([
                    'message' => 'The selected class does not exist or belongs to another school.'
                ], 400);
            }
        }

        // Retrieve student data either from JSON array or by parsing file
        $students = [];
        if ($request->has('students') && is_array($request->students) && count($request->students) > 0) {
            $students = $request->students;
        } elseif ($request->hasFile('file')) {
            $parsed = $this->parseApdmFile($request->file('file'));
            if (!$parsed['success']) {
                return response()->json(['message' => $parsed['message']], 400);
            }
            $students = $parsed['students'];
        } else {
            return response()->json(['message' => 'No student data or file provided for import.'], 400);
        }

        if (empty($students)) {
            return response()->json(['message' => 'No student records to import.'], 400);
        }

        $classroomCache = [];
        if ($defaultClassroom) {
            $classroomCache[strtoupper($defaultClassroom->name)] = $defaultClassroom;
        }

        $importedCount = 0;
        $classesAssigned = [];

        DB::beginTransaction();
        try {
            foreach ($students as $s) {
                $icNumber = preg_replace('/[^0-9A-Za-z]/', '', $s['ic_number'] ?? '');
                $name = trim($s['name'] ?? '');

                if (empty($icNumber) || empty($name)) {
                    continue;
                }

                // Core identity & contact
                $gender = $s['gender'] ?? null;
                $fatherName = $s['father_name'] ?? null;
                $fatherIc = $s['father_ic'] ?? null;
                $fatherPhone = $s['father_phone'] ?? null;

                $motherName = $s['mother_name'] ?? null;
                $motherIc = $s['mother_ic'] ?? null;
                $motherPhone = $s['mother_phone'] ?? null;

                $emergencyName = $s['emergency_name'] ?? null;
                $emergencyPhone = $s['emergency_phone'] ?? null;
                $emergencyRel = $s['emergency_rel'] ?? null;

                $streetAddress = $s['street_address'] ?? null;
                $postcode = $s['postcode'] ?? null;
                $city = $s['city'] ?? null;
                $state = $s['state'] ?? null;
                $country = $s['country'] ?? 'Malaysia';

                // Save or update Student with ALL 61 APDM attributes
                $studentData = [
                    'name' => $name,
                    'gender' => $gender,
                    'street_address' => $streetAddress,
                    'city' => $city,
                    'state' => $state,
                    'postcode' => $postcode,
                    'country' => $country,
                    'father_name' => $fatherName,
                    'father_ic' => $fatherIc,
                    'father_phone_num' => $fatherPhone,
                    'mother_name' => $motherName,
                    'mother_ic' => $motherIc,
                    'mother_phone_num' => $motherPhone,
                    'emergency_name' => $emergencyName,
                    'emergency_phone_num' => $emergencyPhone,
                    'emergency_relation' => $emergencyRel,
                    'is_active' => true,

                    // All specific APDM columns
                    'id_murid' => $s['id_murid'] ?? null,
                    'jenis_pengenalan' => $s['jenis_pengenalan'] ?? null,
                    'tarikh_lahir' => $s['tarikh_lahir'] ?? null,
                    'status_pengajian' => $s['status_pengajian'] ?? null,
                    'tarikh_masuk_sekolah' => $s['tarikh_masuk_sekolah'] ?? null,
                    'tarikh_masuk_kelas' => $s['tarikh_masuk_kelas'] ?? null,
                    'tahun_tingkatan' => $s['tahun_tingkatan'] ?? ($s['tahun'] ?? null),
                    'status_dlp' => $s['status_dlp'] ?? null,
                    'jenis_kelas' => $s['jenis_kelas'] ?? null,
                    'keterangan_aliran' => $s['keterangan_aliran'] ?? null,
                    'keterangan_bidang' => $s['keterangan_bidang'] ?? null,
                    'nama_guru_kelas' => $s['nama_guru_kelas'] ?? null,
                    'kaum' => $s['kaum'] ?? null,
                    'agama' => $s['agama'] ?? null,
                    'warganegara' => $s['warganegara'] ?? null,
                    'negara_asal' => $s['negara_asal'] ?? null,
                    'status_asrama' => $s['status_asrama'] ?? null,
                    'nama_asrama' => $s['nama_asrama'] ?? null,
                    'status_oku' => $s['status_oku'] ?? null,
                    'tarikh_sah_oku' => $s['tarikh_sah_oku'] ?? null,
                    'no_pendaftaran_oku' => $s['no_pendaftaran_oku'] ?? null,
                    'tarikh_daftar_oku' => $s['tarikh_daftar_oku'] ?? null,
                    'tarikh_kad_oku' => $s['tarikh_kad_oku'] ?? null,
                    'kategori_ketidakupayaan' => $s['kategori_ketidakupayaan'] ?? null,
                    'subkategori_ketidakupayaan' => $s['subkategori_ketidakupayaan'] ?? null,
                    'status_yatim' => $s['status_yatim'] ?? null,
                    'no_akaun_bank' => $s['no_akaun_bank'] ?? null,
                    'nama_bank' => $s['nama_bank'] ?? null,

                    // Penjaga 1
                    'penjaga_1_name' => $s['penjaga_1_name'] ?? null,
                    'penjaga_1_ic' => $s['penjaga_1_ic'] ?? null,
                    'penjaga_1_jenis_ic' => $s['penjaga_1_jenis_ic'] ?? null,
                    'penjaga_1_hubungan' => $s['penjaga_1_hubungan'] ?? null,
                    'penjaga_1_pekerjaan' => $s['penjaga_1_pekerjaan'] ?? null,
                    'penjaga_1_status_kerja' => $s['penjaga_1_status_kerja'] ?? null,
                    'penjaga_1_majikan' => $s['penjaga_1_majikan'] ?? null,
                    'penjaga_1_pendapatan' => $s['penjaga_1_pendapatan'] ?? null,
                    'penjaga_1_tel_pejabat' => $s['penjaga_1_tel_pejabat'] ?? null,
                    'penjaga_1_tel_bimbit' => $s['penjaga_1_tel_bimbit'] ?? null,
                    'tanggungan' => $s['tanggungan'] ?? null,

                    // Penjaga 2
                    'penjaga_2_name' => $s['penjaga_2_name'] ?? null,
                    'penjaga_2_ic' => $s['penjaga_2_ic'] ?? null,
                    'penjaga_2_jenis_ic' => $s['penjaga_2_jenis_ic'] ?? null,
                    'penjaga_2_hubungan' => $s['penjaga_2_hubungan'] ?? null,
                    'penjaga_2_pekerjaan' => $s['penjaga_2_pekerjaan'] ?? null,
                    'penjaga_2_status_kerja' => $s['penjaga_2_status_kerja'] ?? null,
                    'penjaga_2_majikan' => $s['penjaga_2_majikan'] ?? null,
                    'penjaga_2_pendapatan' => $s['penjaga_2_pendapatan'] ?? null,
                    'penjaga_2_tel_pejabat' => $s['penjaga_2_tel_pejabat'] ?? null,
                    'penjaga_2_tel_bimbit' => $s['penjaga_2_tel_bimbit'] ?? null,

                    // Address breakdown
                    'alamat_1' => $s['alamat_1'] ?? null,
                    'alamat_2' => $s['alamat_2'] ?? null,
                    'alamat_3' => $s['alamat_3'] ?? null,
                    'daerah' => $s['daerah'] ?? null,

                    // Raw APDM dictionary
                    'apdm_raw' => $s['raw_map'] ?? $s,
                ];

                $student = Student::updateOrCreate(
                    [
                        'school_id' => $schoolId,
                        'ic_number' => $icNumber,
                    ],
                    array_filter($studentData, fn($v) => !is_null($v))
                );

                // Determine Classroom assignment
                $assignedClassroom = null;
                if ($defaultClassroom) {
                    $assignedClassroom = $defaultClassroom;
                } else {
                    $rowClassName = trim($s['class_name'] ?? '');
                    if ($rowClassName !== '') {
                        $classKey = strtoupper($rowClassName);
                        if (!isset($classroomCache[$classKey])) {
                            $classroomCache[$classKey] = Classroom::firstOrCreate(
                                [
                                    'school_id' => $schoolId,
                                    'name' => $rowClassName,
                                ],
                                [
                                    'school_session_id' => $activeSession->school_session_id,
                                    'is_active' => true,
                                ]
                            );
                        }
                        $assignedClassroom = $classroomCache[$classKey];
                    }
                }

                // Enroll student into the classroom
                if ($assignedClassroom) {
                    Enrollment::updateOrCreate(
                        [
                            'student_id' => $student->student_id,
                            'school_session_id' => $activeSession->school_session_id,
                        ],
                        [
                            'classroom_id' => $assignedClassroom->classroom_id,
                        ]
                    );

                    $classesAssigned[$assignedClassroom->name] = true;
                }

                $importedCount++;
            }

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('APDM Import Error: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json([
                'message' => 'An error occurred while importing data: ' . $e->getMessage()
            ], 500);
        }

        $classCount = count($classesAssigned);
        $classList = implode(', ', array_keys($classesAssigned));
        $message = "Successfully imported {$importedCount} student(s)";
        if ($classCount > 0) {
            $message .= " across {$classCount} class(es): {$classList}.";
        } else {
            $message .= ".";
        }

        return response()->json([
            'success' => true,
            'message' => $message,
            'imported_count' => $importedCount,
            'classes' => array_keys($classesAssigned),
        ]);
    }

    /**
     * Download the blank APDM template in CSV or XLSX format.
     */
    public function downloadTemplate(Request $request)
    {
        $format = strtolower($request->query('format', 'csv'));
        $filename = $format === 'xlsx' ? 'apdm_template.xlsx' : 'apdm_template.csv';
        $path = public_path("templates/{$filename}");

        if (!file_exists($path)) {
            return response()->json(['message' => 'Template file not found.'], 404);
        }

        $mime = $format === 'xlsx'
            ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            : 'text/csv';

        return response()->download($path, "CBA5089_Keseluruhan_Murid_TEMPLATE.{$format}", [
            'Content-Type' => $mime,
        ]);
    }

    /**
     * Parse the APDM file (CSV or XLSX) and map all 61 headers.
     */
    private function parseApdmFile($file): array
    {
        $ext = strtolower($file->getClientOriginalExtension());
        $validExts = ['csv', 'xlsx', 'txt'];
        if (!in_array($ext, $validExts)) {
            return [
                'success' => false,
                'message' => "Unsupported file type (.{$ext}). Please upload a .csv or .xlsx file."
            ];
        }

        $realPath = $file->getRealPath();
        $rows = $ext === 'xlsx' ? $this->readXlsx($realPath) : $this->readCsv($realPath);

        if (count($rows) < 2) {
            return [
                'success' => false,
                'message' => 'The uploaded file is empty or does not contain data rows.'
            ];
        }

        // Locate header row dynamically
        $headerIndex = -1;
        $headerRow = [];

        foreach ($rows as $idx => $r) {
            $joined = strtolower(implode(' ', array_filter($r)));
            $hasId = str_contains($joined, 'pengenalan') || str_contains($joined, 'mykid') || str_contains($joined, 'ic');
            $hasName = str_contains($joined, 'nama') || str_contains($joined, 'name');

            if ($hasId && $hasName) {
                $headerIndex = $idx;
                $headerRow = $r;
                break;
            }
        }

        if ($headerIndex === -1) {
            return [
                'success' => false,
                'message' => 'Invalid APDM format: could not locate the header row (expected NO. PENGENALAN and NAMA).'
            ];
        }

        // Build header index map
        $headerMap = [];
        foreach ($headerRow as $colIndex => $colName) {
            $cleaned = trim(preg_replace('/\s+/', ' ', strtolower((string)$colName)));
            if ($cleaned !== '') {
                $headerMap[$cleaned] = $colIndex;
            }
        }

        $getValue = function (array $row, ...$keys) use ($headerMap): string {
            foreach ($keys as $k) {
                $norm = trim(preg_replace('/\s+/', ' ', strtolower($k)));
                if (isset($headerMap[$norm])) {
                    $idx = $headerMap[$norm];
                    $val = $row[$idx] ?? '';
                    return trim((string)$val);
                }
            }
            return '';
        };

        $dataRows = array_slice($rows, $headerIndex + 1);
        $students = [];
        $seq = 1;

        foreach ($dataRows as $row) {
            if (empty(array_filter($row))) {
                continue;
            }

            // Student IC
            $rawIc = $getValue(
                $row,
                'no. pengenalan',
                'no pengenalan',
                'student mykid / ic',
                'no. mykad',
                'no mykad',
                'ic',
                'id murid'
            );
            $icNumber = preg_replace('/[^0-9A-Za-z]/', '', $rawIc);

            // Student Name
            $name = $getValue($row, 'nama', 'student name', 'nama murid');
            if (empty($icNumber) || empty($name)) {
                continue;
            }

            // Gender
            $rawGender = strtoupper($getValue($row, 'jantina', 'gender'));
            $gender = match ($rawGender) {
                'LELAKI', 'L', 'MALE', 'M' => 'Male',
                'PEREMPUAN', 'P', 'FEMALE', 'F' => 'Female',
                default => $rawGender ?: null,
            };

            // Class Name
            $className = $getValue($row, 'nama kelas', 'kelas', 'tingkatan / kelas', 'class');
            $tahun = $getValue($row, 'tahun / tingkatan', 'tahun/tingkatan', 'tahun', 'tingkatan');

            // Guardian 1
            $g1Name  = $getValue($row, 'penjaga 1', 'nama penjaga 1', 'father / guardian 1 name', 'nama bapa', 'nama penjaga');
            $g1RawIc = $getValue($row, 'no. pengenalan penjaga 1', 'no pengenalan penjaga 1', 'father / guardian 1 ic', 'no. ic bapa');
            $g1Ic    = preg_replace('/[^0-9A-Za-z]/', '', $g1RawIc) ?: null;
            $g1Jenis = $getValue($row, 'jns. pengenalan penjaga 1', 'jns pengenalan penjaga 1', 'jenis pengenalan penjaga 1');
            $g1Rel   = strtoupper($getValue($row, 'hubungan penjaga 1', 'hubungan', 'pertalian penjaga 1'));
            $g1Job   = $getValue($row, 'pekerjaan penjaga 1');
            $g1JobStatus = $getValue($row, 'status kerja penjaga 1');
            $g1Majikan = $getValue($row, 'nama majikan penjaga 1');
            $g1Income = $getValue($row, 'pendapatan penjaga 1');
            $g1OfficeTel = $getValue($row, 'no. tel. pejabat penjaga 1', 'no tel pejabat penjaga 1');
            $g1Phone = $getValue($row, 'no. tel. bimbit penjaga 1', 'no tel bimbit penjaga 1', 'no. telefon penjaga 1') ?: null;
            $tanggungan = $getValue($row, 'tanggungan');

            // Guardian 2
            $g2Name  = $getValue($row, 'penjaga 2', 'nama penjaga 2', 'mother / guardian 2 name', 'nama ibu');
            $g2RawIc = $getValue($row, 'no. pengenalan penjaga 2', 'no pengenalan penjaga 2', 'mother / guardian 2 ic', 'no. ic ibu');
            $g2Ic    = preg_replace('/[^0-9A-Za-z]/', '', $g2RawIc) ?: null;
            $g2Jenis = $getValue($row, 'jns. pengenalan penjaga 2', 'jns pengenalan penjaga 2', 'jenis pengenalan penjaga 2');
            $g2Rel   = strtoupper($getValue($row, 'hubungan penjaga 2', 'hubungan 2', 'pertalian penjaga 2'));
            $g2Job   = $getValue($row, 'pekerjaan penjaga 2');
            $g2JobStatus = $getValue($row, 'status kerja penjaga 2');
            $g2Majikan = $getValue($row, 'nama majikan penjaga 2');
            $g2Income = $getValue($row, 'pendapatan penjaga 2');
            $g2OfficeTel = $getValue($row, 'no. tel. pejabat penjaga 2', 'no tel pejabat penjaga 2');
            $g2Phone = $getValue($row, 'no. tel. bimbit penjaga 2', 'no tel bimbit penjaga 2', 'no. telefon penjaga 2') ?: null;

            $fatherName = null; $fatherIc = null; $fatherPhone = null;
            $motherName = null; $motherIc = null; $motherPhone = null;
            $emergencyName = null; $emergencyPhone = null; $emergencyRel = null;

            if (str_contains($g1Rel, 'BAPA') || str_contains($g1Rel, 'FATHER') || str_contains($g1Rel, 'AYAH')) {
                $fatherName = $g1Name; $fatherIc = $g1Ic; $fatherPhone = $g1Phone;
            } elseif (str_contains($g1Rel, 'IBU') || str_contains($g1Rel, 'MOTHER') || str_contains($g1Rel, 'EMAK') || str_contains($g1Rel, 'MAMA')) {
                $motherName = $g1Name; $motherIc = $g1Ic; $motherPhone = $g1Phone;
            } else {
                $emergencyName = $g1Name ?: null;
                $emergencyPhone = $g1Phone ?: null;
                $emergencyRel = $g1Rel ?: null;
            }

            if (str_contains($g2Rel, 'IBU') || str_contains($g2Rel, 'MOTHER') || str_contains($g2Rel, 'EMAK') || str_contains($g2Rel, 'MAMA')) {
                $motherName = $g2Name; $motherIc = $g2Ic; $motherPhone = $g2Phone;
            } elseif (str_contains($g2Rel, 'BAPA') || str_contains($g2Rel, 'FATHER') || str_contains($g2Rel, 'AYAH')) {
                if (!$fatherName) {
                    $fatherName = $g2Name; $fatherIc = $g2Ic; $fatherPhone = $g2Phone;
                }
            } elseif ($g2Name) {
                if (!$emergencyName) {
                    $emergencyName = $g2Name;
                    $emergencyPhone = $g2Phone;
                    $emergencyRel = $g2Rel ?: null;
                }
            }

            if (!$fatherName && !$motherName && ($g1Name || $g2Name)) {
                $fatherName = $g1Name ?: null; $fatherIc = $g1Ic; $fatherPhone = $g1Phone;
                $motherName = $g2Name ?: null; $motherIc = $g2Ic; $motherPhone = $g2Phone;
            }

            // Address
            $alamat1 = $getValue($row, 'alamat 1', 'alamat');
            $alamat2 = $getValue($row, 'alamat 2');
            $alamat3 = $getValue($row, 'alamat 3');
            $addrParts = array_filter([$alamat1, $alamat2, $alamat3]);
            $streetAddress = !empty($addrParts) ? implode(', ', $addrParts) : null;
            $postcode = $getValue($row, 'poskod', 'postcode') ?: null;
            $city = $getValue($row, 'bandar', 'city') ?: null;
            $daerah = $getValue($row, 'daerah') ?: null;
            $state = $getValue($row, 'negeri', 'state') ?: null;
            $country = $getValue($row, 'warganegara', 'negara asal') ?: 'Malaysia';

            $fullAddress = implode(', ', array_filter([$streetAddress, $postcode, $city ?: $daerah, $state]));

            // Raw map with all exact header names for this row
            $rawMap = [];
            foreach ($headerMap as $hName => $hIdx) {
                $rawMap[$hName] = trim((string)($row[$hIdx] ?? ''));
            }

            $students[] = [
                // 1. BIL.
                'bil' => $getValue($row, 'bil.') ?: (string)$seq++,
                // 2. ID MURID
                'id_murid' => $getValue($row, 'id murid', 'id_murid'),
                // 3. NAMA
                'name' => $name,
                // 4. NO. PENGENALAN
                'ic_number' => $icNumber,
                'raw_ic' => $rawIc,
                // 5. JENIS PENGENALAN
                'jenis_pengenalan' => $getValue($row, 'jenis pengenalan'),
                // 6. TARIKH LAHIR
                'tarikh_lahir' => $getValue($row, 'tarikh lahir'),
                // 7. STATUS PENGAJIAN
                'status_pengajian' => $getValue($row, 'status pengajian'),
                // 8. TARIKH MASUK SEKOLAH
                'tarikh_masuk_sekolah' => $getValue($row, 'tarikh masuk sekolah'),
                // 9. TARIKH MASUK KELAS
                'tarikh_masuk_kelas' => $getValue($row, 'tarikh masuk kelas'),
                // 10. TAHUN / TINGKATAN
                'tahun_tingkatan' => $tahun,
                'tahun' => $tahun,
                // 11. NAMA KELAS
                'class_name' => $className,
                // 12. STATUS DLP
                'status_dlp' => $getValue($row, 'status dlp'),
                // 13. JENIS KELAS
                'jenis_kelas' => $getValue($row, 'jenis kelas'),
                // 14. KETERANGAN ALIRAN
                'keterangan_aliran' => $getValue($row, 'keterangan aliran'),
                // 15. KETERANGAN BIDANG
                'keterangan_bidang' => $getValue($row, 'keterangan bidang'),
                // 16. NAMA GURU KELAS
                'nama_guru_kelas' => $getValue($row, 'nama guru kelas'),
                // 17. JANTINA
                'gender' => $gender,
                'raw_gender' => $rawGender,
                // 18. KAUM
                'kaum' => $getValue($row, 'kaum'),
                // 19. AGAMA
                'agama' => $getValue($row, 'agama'),
                // 20. WARGANEGARA
                'warganegara' => $getValue($row, 'warganegara'),
                // 21. NEGARA ASAL
                'negara_asal' => $getValue($row, 'negara asal'),
                // 22. STATUS ASRAMA
                'status_asrama' => $getValue($row, 'status asrama'),
                // 23. NAMA ASRAMA
                'nama_asrama' => $getValue($row, 'nama asrama'),
                // 24. STATUS OKU
                'status_oku' => $getValue($row, 'status oku'),
                // 25. TARIKH SAH OKU
                'tarikh_sah_oku' => $getValue($row, 'tarikh sah oku'),
                // 26. NO. PENDAFTARAN OKU
                'no_pendaftaran_oku' => $getValue($row, 'no. pendaftaran oku', 'no pendaftaran oku'),
                // 27. TARIKH DAFTAR OKU
                'tarikh_daftar_oku' => $getValue($row, 'tarikh daftar oku'),
                // 28. TARIKH KAD OKU
                'tarikh_kad_oku' => $getValue($row, 'tarikh kad oku'),
                // 29. KATEGORI KETIDAKUPAYAAN
                'kategori_ketidakupayaan' => $getValue($row, 'kategori ketidakupayaan'),
                // 30. SUBKATEGORI KETIDAKUPAYAAN
                'subkategori_ketidakupayaan' => $getValue($row, 'subkategori ketidakupayaan'),
                // 31. STATUS YATIM
                'status_yatim' => $getValue($row, 'status yatim'),
                // 32. NO. AKAUN BANK
                'no_akaun_bank' => $getValue($row, 'no. akaun bank', 'no akaun bank'),
                // 33. NAMA BANK
                'nama_bank' => $getValue($row, 'nama bank'),
                // 34-43. PENJAGA 1
                'penjaga_1_name' => $g1Name,
                'penjaga_1_ic' => $g1Ic,
                'penjaga_1_jenis_ic' => $g1Jenis,
                'penjaga_1_hubungan' => $g1Rel,
                'penjaga_1_pekerjaan' => $g1Job,
                'penjaga_1_status_kerja' => $g1JobStatus,
                'penjaga_1_majikan' => $g1Majikan,
                'penjaga_1_pendapatan' => $g1Income,
                'penjaga_1_tel_pejabat' => $g1OfficeTel,
                'penjaga_1_tel_bimbit' => $g1Phone,
                // 44. TANGGUNGAN
                'tanggungan' => $tanggungan,
                // 45-54. PENJAGA 2
                'penjaga_2_name' => $g2Name,
                'penjaga_2_ic' => $g2Ic,
                'penjaga_2_jenis_ic' => $g2Jenis,
                'penjaga_2_hubungan' => $g2Rel,
                'penjaga_2_pekerjaan' => $g2Job,
                'penjaga_2_status_kerja' => $g2JobStatus,
                'penjaga_2_majikan' => $g2Majikan,
                'penjaga_2_pendapatan' => $g2Income,
                'penjaga_2_tel_pejabat' => $g2OfficeTel,
                'penjaga_2_tel_bimbit' => $g2Phone,
                // 55-61. ALAMAT
                'alamat_1' => $alamat1,
                'alamat_2' => $alamat2,
                'alamat_3' => $alamat3,
                'poskod' => $postcode,
                'bandar' => $city,
                'daerah' => $daerah,
                'negeri' => $state,
                'country' => $country,
                'street_address' => $streetAddress,
                'full_address' => $fullAddress,

                // Normalized relations
                'father_name' => $fatherName,
                'father_ic' => $fatherIc,
                'father_phone' => $fatherPhone,
                'mother_name' => $motherName,
                'mother_ic' => $motherIc,
                'mother_phone' => $motherPhone,
                'emergency_name' => $emergencyName,
                'emergency_phone' => $emergencyPhone,
                'emergency_rel' => $emergencyRel,

                'raw_map' => $rawMap,
            ];
        }

        return [
            'success' => true,
            'students' => $students,
        ];
    }

    /**
     * Parse CSV / TXT files handling UTF-8 BOM and common delimiters (, ; \t).
     */
    private function readCsv(string $filePath): array
    {
        $content = file_get_contents($filePath);
        if ($content === false || trim($content) === '') {
            return [];
        }

        $content = preg_replace('/^\xEF\xBB\xBF/', '', $content);
        $lines = preg_split('/\r\n|\r|\n/', $content);
        $lines = array_filter($lines, fn($l) => trim($l) !== '');

        if (empty($lines)) {
            return [];
        }

        $delimiter = ',';
        $sample = implode("\n", array_slice($lines, 0, 10));
        $semicolons = substr_count($sample, ';');
        $commas = substr_count($sample, ',');
        $tabs = substr_count($sample, "\t");

        if ($tabs > $commas && $tabs > $semicolons) {
            $delimiter = "\t";
        } elseif ($semicolons > $commas) {
            $delimiter = ';';
        }

        $rows = [];
        foreach ($lines as $line) {
            $parsed = str_getcsv($line, $delimiter);
            $rows[] = $parsed;
        }

        return $rows;
    }

    /**
     * Parse XLSX using native PHP ZipArchive and SimpleXML without external dependencies.
     */
    private function readXlsx(string $filePath): array
    {
        $zip = new ZipArchive();
        if ($zip->open($filePath) !== true) {
            return [];
        }

        $sharedStrings = [];
        $stringsXml = $zip->getFromName('xl/sharedStrings.xml');
        if ($stringsXml) {
            $sXml = simplexml_load_string($stringsXml);
            if ($sXml && isset($sXml->si)) {
                foreach ($sXml->si as $si) {
                    $text = '';
                    if (isset($si->t)) {
                        $text = (string)$si->t;
                    } elseif (isset($si->r)) {
                        foreach ($si->r as $r) {
                            $text .= (string)$r->t;
                        }
                    }
                    $sharedStrings[] = $text;
                }
            }
        }

        $sheetXml = $zip->getFromName('xl/worksheets/sheet1.xml');
        if (!$sheetXml) {
            $zip->close();
            return [];
        }

        $sXml = simplexml_load_string($sheetXml);
        if (!$sXml || !isset($sXml->sheetData->row)) {
            $zip->close();
            return [];
        }

        $rows = [];
        foreach ($sXml->sheetData->row as $row) {
            $rowData = [];
            $colIdx = 0;
            foreach ($row->c as $c) {
                preg_match('/([A-Z]+)/', (string)$c['r'], $matches);
                $colLetter = $matches[1] ?? 'A';
                $targetCol = $this->columnLetterToIndex($colLetter);

                while ($colIdx < $targetCol) {
                    $rowData[] = '';
                    $colIdx++;
                }

                $type = (string)($c['t'] ?? '');
                $val = (string)($c->v ?? '');
                if ($type === 's' && isset($sharedStrings[(int)$val])) {
                    $val = $sharedStrings[(int)$val];
                } elseif ($type === 'inlineStr' && isset($c->is->t)) {
                    $val = (string)$c->is->t;
                }

                $rowData[] = $val;
                $colIdx++;
            }
            $rows[] = $rowData;
        }

        $zip->close();
        return $rows;
    }

    private function columnLetterToIndex(string $letter): int
    {
        $num = 0;
        $len = strlen($letter);
        for ($i = 0; $i < $len; $i++) {
            $num = $num * 26 + (ord($letter[$i]) - ord('A') + 1);
        }
        return $num - 1;
    }
}
