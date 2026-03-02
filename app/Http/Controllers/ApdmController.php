<?php

namespace App\Http\Controllers;

use App\Models\Student;
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

        $file = $request->file('file');
        $path = $file->getRealPath();

        // 2. Read the CSV File
        $data = array_map('str_getcsv', file($path));
        
        if (count($data) < 2) {
            return response()->json(['message' => 'The file is empty or invalid.'], 400);
        }

        // 3. Extract Headers and map their index positions
        $header = array_shift($data);
        $headerMap = [];
        foreach ($header as $index => $colName) {
            // Convert to lowercase and trim spaces to ensure matching is safe
            $headerMap[trim(strtolower($colName))] = $index;
        }

        // 4. Verify APDM Format
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

        // 5. Process and Insert Data
        $schoolId = auth()->check() ? auth()->user()->school_id : 1;
        $importedCount = 0;

        DB::beginTransaction();
        try {
            foreach ($data as $row) {
                if (empty(array_filter($row))) continue; // Skip empty rows

                $icNumber = $row[$headerMap['student mykid / ic']] ?? null;
                $name = $row[$headerMap['student name']] ?? null;

                if (!$icNumber || !$name) continue; // Skip if core identity is missing

                // updateOrCreate prevents duplicate entries from crashing the system
                Student::updateOrCreate(
                    ['ic_number' => trim($icNumber)], 
                    [
                        'school_id' => $schoolId,
                        'name' => trim($name),
                        'class' => $request->class,
                        'father_ic' => $row[$headerMap['father / guardian 1 ic']] ?? null,
                        'father_name' => $row[$headerMap['father / guardian 1 name']] ?? null,
                        'mother_ic' => $row[$headerMap['mother / guardian 2 ic']] ?? null,
                        'mother_name' => $row[$headerMap['mother / guardian 2 name']] ?? null,
                    ]
                );
                $importedCount++;
            }
            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'An error occurred while saving to the database.'], 500);
        }

        return response()->json([
            'success' => true, 
            'message' => "Successfully imported {$importedCount} students to " . strtoupper($request->class)
        ]);
    }
}