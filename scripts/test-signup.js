(async ()=>{
  try {
    const res = await fetch('http://localhost:3001/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Node Tester', email: 'node-check@example.com', phone: '9123456789' }),
      // no credentials needed for signup
    });
    console.log('STATUS', res.status);
    const text = await res.text();
    console.log('BODY', text);
  } catch (e) {
    console.error('ERROR', e);
    process.exitCode = 1;
  }
})();
