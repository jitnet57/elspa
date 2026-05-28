// 테스트: 프론트엔드의 정확한 로그인 flow 시뮬레이션
const API_BASE_URL = 'http://localhost:8000';

async function testLogin() {
  console.log('🧪 Testing login flow...\n');

  try {
    console.log('1️⃣  Making POST request to /api/auth/login');
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@elspa.com',
        password: 'admin123'
      }),
    });

    console.log(`   Status: ${response.status}`);
    console.log(`   Headers: ${JSON.stringify([...response.headers.entries()])}\n`);

    const data = await response.json();

    if (!response.ok) {
      console.log('❌ Login failed!');
      console.log(`   Error: ${JSON.stringify(data, null, 2)}`);
      process.exit(1);
    }

    console.log('✅ Login successful!\n');
    console.log('2️⃣  Checking response structure:');
    console.log(`   - access_token: ${data.access_token ? '✅' : '❌'}`);
    console.log(`   - refresh_token: ${data.refresh_token ? '✅' : '❌'}`);
    console.log(`   - user: ${data.user ? '✅' : '❌'}`);

    if (data.user) {
      console.log(`\n   User details:`);
      console.log(`   - user_id: ${data.user.user_id}`);
      console.log(`   - email: ${data.user.email}`);
      console.log(`   - name: ${data.user.name}`);
      console.log(`   - role: ${data.user.role}`);
    }

    console.log('\n✨ All tests passed! Login flow is working correctly.');
    process.exit(0);
  } catch (error) {
    console.log('❌ Error during login:');
    console.log(`   ${error.message}`);
    process.exit(1);
  }
}

testLogin();
