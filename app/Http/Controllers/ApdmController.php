<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\Classroom;
use App\Models\Enrollment;
use App\Models\SchoolSession;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ApdmController extends Controller
{
    public function import(Request $request)
    {
        // 1. Validate request
        $request->validate([
            'class' => 'required|string',
            'file' => 'required|file|mimes:csv,txt|max:5120', // Max 5MB CSV
        ]);

        $schoolId = auth()->check() ? auth()->user()->school_id : 1;

        // 2. GET ACTIVE SESSION
        // We MUST have an active session to enroll students into
        $activeSession = SchoolSession::where('school_id', $schoolId)->where('is_active', true)->first();
        
        if (!$activeSession) {
            return response()->json(['message' => 'No active school session found. Please set up a school session first.'], 400);
        }

        // 3. GET OR CREATE CLASSROOM
        // If the class doesn't exist in the database yet, this will safely create it
        $classroom = Classroom::firstOrCreate(
            ['school_id' => $schoolId, 'name' => $request->class],
            ['is_active' => true]
        );

        $file = $request->file('file');
        $path = $file->getRealPath();

        // 4. Read the CSV File
        $data = array_map('str_getcsv', file($path));
        
        if (count($data) < 2) {
            return response()->json(['message' => 'The file is empty or invalid.'], 400);
        }

        // 5. Extract Headers and map their index positions
        $header = array_shift($data);
        $headerMap = [];
        foreach ($header as $index => $colName) {
            $headerMap[trim(strtolower($colName))] = $index;
        }

        // 6. Verify APDM Format
        $requiredHeaders = [
            'student mykid / ic',
            'student name',
            'father / guardian 1 ic',
            'father / guardian 1 name',
            'mother / guardian 2 ic',
            'mother / guardian 2 name'
        ];

        foreach ($requiredHeaders as $req) {
            if (!isset($headerMap[$req])) {
                return response()->json(['message' => "Invalid APDM format. Missing column: '{$req}'"], 400);
            }
        }

        // 7. Process and Insert Data
        $importedCount = 0;

        DB::beginTransaction();
        try {
            foreach ($data as $row) {
                if (empty(array_filter($row))) continue; // Skip empty rows

                $icNumber = $row[$headerMap['student mykid / ic']] ?? null;
                $name = $row[$headerMap['student name']] ?? null;

                if (!$icNumber || !$name) continue; 

                // A. Save Core Student Identity (Notice: No 'class' column here anymore!)
                $student = Student::updateOrCreate(
                    ['ic_number' => trim($icNumber)], 
                    [
                        'school_id' => $schoolId,
                        'name' => trim($name),
                        'father_ic' => $row[$headerMap['father / guardian 1 ic']] ?? null,
                        'father_name' => $row[$headerMap['father / guardian 1 name']] ?? null,
                        'mother_ic' => $row[$headerMap['mother / guardian 2 ic']] ?? null,
                        'mother_name' => $row[$headerMap['mother / guardian 2 name']] ?? null,
                    ]
                );

                // B. Create the Enrollment (The Bridge)
                // We use updateOrCreate so if the admin uploads the APDM twice in the same year, 
                // it just updates their class instead of creating duplicate enrollments!
                Enrollment::updateOrCreate(
                    [
                        'student_id' => $student->student_id,
                        'school_session_id' => $activeSession->school_session_id,
                    ],
                    [
                        'classroom_id' => $classroom->classroom_id
                    ]
                );

                $importedCount++;
            }
            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            // Log the actual error to your laravel.log file for debugging if needed
            \Illuminate\Support\Facades\Log::error('APDM Import Error: ' . $e->getMessage());
            return response()->json(['message' => 'An error occurred while saving to the database.'], 500);
        }

        return response()->json([
            'success' => true, 
            'message' => "Successfully imported {$importedCount} students to " . strtoupper($request->class)
        ]);
    }
}