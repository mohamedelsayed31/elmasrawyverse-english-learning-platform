<?php

namespace App\Http\Controllers;

use App\Models\Instructor;
use Illuminate\Http\Request;

class InstructorController extends Controller
{
    public function index()
    {
        $instructors = Instructor::withCount('courses')
            ->latest()
            ->get();

        return response()->json([
            'instructors' => $instructors
        ]);
    }


    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:instructors,email',
            'specialization' => 'required|string|max:255',
            'status' => 'required|in:Available,Unavailable',
            'experience' => 'required|integer|min:0',
            'phone' => 'required|string|max:20',
        ]);

        $instructor = Instructor::create([
            'name' => $request->name,
            'email' => $request->email,
            'specialization' => $request->specialization,
            'status' => $request->status,
            'experience' => $request->experience,
            'phone' => $request->phone,
        ]);

        return response()->json([
            'message' => 'Instructor created successfully',
            'instructor' => $instructor
        ], 201);
    }


    public function show($id)
    {
        $instructor = Instructor::with('courses')->find($id);

        if (!$instructor) {
            return response()->json([
                'message' => 'Instructor not found'
            ], 404);
        }

        return response()->json([
            'instructor' => $instructor
        ]);
    }


    public function update(Request $request, $id)
    {
        $instructor = Instructor::find($id);

        if (!$instructor) {
            return response()->json([
                'message' => 'Instructor not found'
            ], 404);
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:instructors,email,' . $instructor->id,
            'specialization' => 'required|string|max:255',
            'status' => 'required|in:Available,Unavailable',
            'experience' => 'required|integer|min:0',
            'phone' => 'required|string|max:20',
        ]);

        $instructor->update([
            'name' => $request->name,
            'email' => $request->email,
            'specialization' => $request->specialization,
            'status' => $request->status,
            'experience' => $request->experience,
            'phone' => $request->phone,
        ]);

        return response()->json([
            'message' => 'Instructor updated successfully',
            'instructor' => $instructor
        ]);
    }


    public function destroy($id)
    {
        $instructor = Instructor::withCount('courses')
            ->find($id);
    
        if (!$instructor) {
            return response()->json([
                'message' => 'Instructor not found'
            ], 404);
        }
    
        if ($instructor->courses_count > 0) {
            return response()->json([
                'message' =>
                    'Cannot delete instructor because they have assigned courses.'
            ], 409);
        }
    
        $instructor->delete();
    
        return response()->json([
            'message' => 'Instructor deleted successfully'
        ]);
    }
}