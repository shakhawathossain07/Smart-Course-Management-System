// Database Schema Test Script
// This script tests the database connection and verifies the schema structure

import { supabase } from './src/lib/supabase';

async function testDatabaseSchema() {
  console.log('🔧 Testing Smart Course Management System Database Schema...\n');

  try {
    // Test 1: Check if we can connect to the database
    console.log('1. Testing database connection...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('profiles')
      .select('count(*)')
      .limit(1);
    
    if (connectionError) {
      console.error('❌ Database connection failed:', connectionError.message);
      return;
    }
    console.log('✅ Database connection successful\n');

    // Test 2: Verify all tables exist
    console.log('2. Verifying table structure...');
    const tables = [
      'profiles',
      'courses', 
      'enrollments',
      'assignments',
      'submissions',
      'attendance_records',
      'notifications',
      'file_uploads'
    ];

    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.error(`❌ Table ${table} not accessible:`, error.message);
        } else {
          console.log(`✅ Table ${table} exists and accessible`);
        }
      } catch (err) {
        console.error(`❌ Error checking table ${table}:`, err);
      }
    }

    // Test 3: Check sample data
    console.log('\n3. Checking sample data...');
    
    const { data: profiles } = await supabase
      .from('profiles')
      .select('name, role')
      .limit(5);
    
    console.log(`📊 Profiles found: ${profiles?.length || 0}`);
    if (profiles?.length) {
      profiles.forEach(profile => {
        console.log(`   - ${profile.name} (${profile.role})`);
      });
    }

    const { data: courses } = await supabase
      .from('courses')
      .select('title, code, instructor_name')
      .limit(5);
    
    console.log(`\n📚 Courses found: ${courses?.length || 0}`);
    if (courses?.length) {
      courses.forEach(course => {
        console.log(`   - ${course.code}: ${course.title} (${course.instructor_name})`);
      });
    }

    const { data: assignments } = await supabase
      .from('assignments')
      .select('title, due_date')
      .limit(5);
    
    console.log(`\n📝 Assignments found: ${assignments?.length || 0}`);
    if (assignments?.length) {
      assignments.forEach(assignment => {
        console.log(`   - ${assignment.title} (Due: ${new Date(assignment.due_date).toLocaleDateString()})`);
      });
    }

    // Test 4: Check RLS policies by testing permissions
    console.log('\n4. Testing Row Level Security...');
    
    // This should work without authentication (public read access for courses)
    const { data: publicCourses, error: publicError } = await supabase
      .from('courses')
      .select('title')
      .limit(1);
    
    if (!publicError) {
      console.log('✅ Public course access works');
    } else {
      console.log('❌ Public course access failed:', publicError.message);
    }

    console.log('\n🎉 Database schema test completed!');

  } catch (error) {
    console.error('💥 Unexpected error during testing:', error);
  }
}

// Run the test
testDatabaseSchema();
