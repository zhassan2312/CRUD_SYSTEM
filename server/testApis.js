#!/usr/bin/env node

/**
 * Comprehensive API Testing Script
 * 
 * This script tests all API endpoints without authentication using JSON format
 * Run with: node testApis.js
 * 
 * Make sure your server is running on http://localhost:5000
 * Note: All requests use application/json content type instead of form-data
 */

import axios from 'axios';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { resolve } from 'path';
// import FormData from 'form-data'; // Removed - using JSON instead

const BASE_URL = 'http://localhost:5000/api';
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

class ApiTester {
  constructor() {
    this.results = [];
    this.axios = axios.create({
      baseURL: BASE_URL,
      timeout: 10000,
      validateStatus: () => true, // Accept all status codes
      headers: {
        'Content-Type': 'application/json' // Use JSON for all requests
      }
    });
  }

  log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  async test(method, endpoint, data = null, headers = {}, description = '') {
    const startTime = Date.now();
    try {
      const config = {
        method,
        url: endpoint,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        ...(data && { data })
      };

      const response = await this.axios(config);
      const duration = Date.now() - startTime;
      const success = response.status >= 200 && response.status < 400;
      
      const result = {
        method,
        endpoint,
        description,
        status: response.status,
        success,
        duration,
        data: response.data,
        error: null
      };

      this.results.push(result);
      
      const statusColor = success ? 'green' : 'red';
      this.log(`${method.toUpperCase().padEnd(6)} ${endpoint.padEnd(40)} ${response.status.toString().padEnd(3)} ${duration}ms - ${description}`, statusColor);
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const result = {
        method,
        endpoint,
        description,
        status: error.response?.status || 0,
        success: false,
        duration,
        data: null,
        error: error.message
      };

      this.results.push(result);
      this.log(`${method.toUpperCase().padEnd(6)} ${endpoint.padEnd(40)} ERR ${duration}ms - ${description} (${error.message})`, 'red');
      
      return result;
    }
  }

  async testFileUpload(endpoint, projectData, description = '') {
    // For testing purposes, we'll send project data without actual file
    // In real scenarios, you would handle file uploads differently
    const testData = {
      ...projectData,
      // Simulate file data as base64 string or file metadata
      projectImage: null // No actual file for testing
    };

    return this.test('POST', endpoint, testData, {}, description);
  }

  async runTests() {
    this.log('\n🚀 Starting Comprehensive API Testing...', 'bold');
    this.log('=' * 80, 'blue');

    // Test server health
    this.log('\n📊 Testing Server Health', 'yellow');
    await this.test('GET', '/health', null, {}, 'Server health check');

    // Test authentication routes (these should work without auth middleware)
    this.log('\n🔐 Testing Authentication Routes', 'yellow');
    await this.test('POST', '/auth/register', {
      fullName: 'Test User',
      email: 'test@example.com',
      password: 'TestPassword123!',
      gender: 'male',
      age: 25
    }, {}, 'User registration');

    await this.test('POST', '/auth/login', {
      email: 'test@example.com',
      password: 'TestPassword123!'
    }, {}, 'User login');

    await this.test('POST', '/auth/forgot-password', {
      email: 'test@example.com'
    }, {}, 'Forgot password');

    // Test user routes
    this.log('\n👤 Testing User Routes', 'yellow');
    await this.test('GET', '/users/profile', null, {}, 'Get user profile');
    await this.test('PUT', '/users/profile', {
      fullName: 'Updated Test User',
      email: 'updated@example.com',
      profilePicture: null // No file upload for JSON testing
    }, {}, 'Update user profile (JSON format)');
    await this.test('PUT', '/users/change-password', {
      currentPassword: 'TestPassword123!',
      newPassword: 'NewPassword123!'
    }, {}, 'Change password');
    await this.test('GET', '/users/stats', null, {}, 'Get user stats');

    // Test teacher routes
    this.log('\n👨‍🏫 Testing Teacher Routes', 'yellow');
    await this.test('GET', '/teachers', null, {}, 'Get all teachers');
    await this.test('POST', '/teachers', {
      name: 'Dr. John Doe',
      email: 'john.doe@university.edu',
      department: 'Computer Science',
      specialization: 'AI and Machine Learning'
    }, {}, 'Create teacher (JSON format)');
    
    // Get teachers to get an ID for further tests
    const teachersResponse = await this.test('GET', '/teachers', null, {}, 'Get teachers for ID');
    const teacherId = teachersResponse.success && teachersResponse.data?.teachers?.length > 0 
      ? teachersResponse.data.teachers[0].id 
      : 'test-teacher-id';

    await this.test('GET', `/teachers/${teacherId}`, null, {}, 'Get teacher by ID');
    await this.test('PUT', `/teachers/${teacherId}`, {
      name: 'Dr. John Smith',
      department: 'Updated Department'
    }, {}, 'Update teacher');

    // Test project routes
    this.log('\n📋 Testing Project Routes', 'yellow');
    await this.test('GET', '/projects', null, {}, 'Get user projects');
    await this.test('GET', '/projects/admin', null, {}, 'Get all projects (admin)');
    await this.test('GET', '/projects/search', null, {}, 'Search projects');
    await this.test('GET', '/projects/search/filters', null, {}, 'Get search filters');

    // Create a project using JSON format
    const projectData = {
      title: 'Test Project',
      description: 'This is a test project for API testing',
      students: [
        { name: 'Student 1', email: 'student1@example.com' },
        { name: 'Student 2', email: 'student2@example.com' }
      ],
      supervisorId: teacherId,
      sustainability: 'This project promotes environmental sustainability through innovative technology solutions.',
      projectImage: null // No file upload for JSON testing
    };

    const createProjectResponse = await this.test('POST', '/projects', projectData, {}, 'Create project (JSON format)');
    const projectId = createProjectResponse.success && createProjectResponse.data?.project?.id 
      ? createProjectResponse.data.project.id 
      : 'test-project-id';

    // Test project management
    await this.test('PUT', `/projects/${projectId}/status`, {
      status: 'approved',
      reviewComment: 'Excellent project proposal!'
    }, {}, 'Update project status');

    await this.test('DELETE', `/projects/${projectId}`, null, {}, 'Delete project');

    // Test file management
    this.log('\n📁 Testing File Management Routes', 'yellow');
    // Note: File upload tests use JSON format (actual file uploads would require multipart/form-data)
    await this.test('GET', `/projects/${projectId}/files`, null, {}, 'Get project files');
    await this.test('GET', '/projects/admin/file-statistics', null, {}, 'Get file statistics');

    // Test notification routes
    this.log('\n🔔 Testing Notification Routes', 'yellow');
    await this.test('GET', '/notifications', null, {}, 'Get notifications');
    await this.test('GET', '/notifications?recent=2025-07-30T10:00:00.000Z', null, {}, 'Get recent notifications');
    await this.test('PUT', '/notifications/mark-all-read', null, {}, 'Mark all notifications as read');
    await this.test('GET', '/notifications/preferences', null, {}, 'Get notification preferences');
    await this.test('PUT', '/notifications/preferences', {
      preferences: {
        emailNotifications: true,
        pushNotifications: false
      }
    }, {}, 'Update notification preferences');

    // Generate test report
    this.generateReport();
  }

  generateReport() {
    this.log('\n📊 Test Results Summary', 'bold');
    this.log('=' * 80, 'blue');

    const total = this.results.length;
    const successful = this.results.filter(r => r.success).length;
    const failed = this.results.filter(r => !r.success).length;
    const avgDuration = this.results.reduce((sum, r) => sum + r.duration, 0) / total;

    this.log(`\nTotal Tests: ${total}`, 'blue');
    this.log(`Successful: ${successful}`, 'green');
    this.log(`Failed: ${failed}`, 'red');
    this.log(`Success Rate: ${((successful / total) * 100).toFixed(1)}%`, successful === total ? 'green' : 'yellow');
    this.log(`Average Response Time: ${avgDuration.toFixed(0)}ms`, 'blue');

    // Show failed tests
    const failedTests = this.results.filter(r => !r.success);
    if (failedTests.length > 0) {
      this.log('\n❌ Failed Tests:', 'red');
      failedTests.forEach(test => {
        this.log(`  ${test.method.toUpperCase()} ${test.endpoint} - ${test.description} (Status: ${test.status})`, 'red');
        if (test.error) {
          this.log(`    Error: ${test.error}`, 'red');
        }
      });
    }

    // Save detailed results to file
    const reportFile = `api-test-results-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    fs.writeFileSync(reportFile, JSON.stringify(this.results, null, 2));
    this.log(`\n📄 Detailed results saved to: ${reportFile}`, 'blue');

    this.log('\n✅ API Testing Complete!', 'bold');
  }
}

// Run tests if this file is executed directly
console.log('Script loaded...');

// Convert paths to normalize them for comparison
const currentFile = fileURLToPath(import.meta.url);
const executedFile = resolve(process.argv[1]);

console.log('Current file:', currentFile);
console.log('Executed file:', executedFile);

if (currentFile === executedFile) {
  console.log('Running tests...');
  const tester = new ApiTester();
  tester.runTests().catch(console.error);
} else {
  console.log('Script imported as module, not running tests automatically');
}

export default ApiTester;
