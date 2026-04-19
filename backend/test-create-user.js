async function test() {
  try {
    // 1. Login
    const loginRes = await fetch('http://localhost:3001/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@example.com', password: 'elpa1234' })
    });
    const loginData = await loginRes.json();
    const token = loginData.token;
    console.log('Login successful');

    // 2. Create User
    const createRes = await fetch('http://localhost:3001/api/v1/users', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({
        user_name: 'Test Name',
        email: 'test@example.com',
        role_code: 'member',
        employee_code: 'T0001',
        department_name: 'IT'
      })
    });
    const createData = await createRes.json();
    console.log('Create user successful:', createRes.status, createData);
  } catch (err) {
    console.error('Error:', err);
  }
}

test();
