// Test script to verify authentication works
const testAuth = async () => {
    const baseURL = 'http://localhost:3000/api';
    
    try {
        // Test 1: Check if login works with existing user
        console.log('Testing login...');
        const loginResponse = await fetch(`${baseURL}/user/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include', // Include cookies
            body: JSON.stringify({
                email: 'admin@example.com', // Replace with actual email
                password: 'admin123' // Replace with actual password
            })
        });
        
        const loginData = await loginResponse.json();
        console.log('Login Response:', loginData);
        
        if (loginResponse.ok) {
            // Test 2: Check authentication with the cookie
            console.log('Testing checkAuth...');
            const authResponse = await fetch(`${baseURL}/user/checkAuth`, {
                method: 'GET',
                credentials: 'include' // Include cookies
            });
            
            const authData = await authResponse.json();
            console.log('Auth Check Response:', authData);
            
            if (authResponse.ok) {
                console.log('✅ Authentication is working correctly!');
                console.log('User data:', authData);
            } else {
                console.log('❌ Auth check failed:', authData);
            }
        } else {
            console.log('❌ Login failed:', loginData);
        }
        
    } catch (error) {
        console.error('Test failed:', error);
    }
};

// Run the test
testAuth();
