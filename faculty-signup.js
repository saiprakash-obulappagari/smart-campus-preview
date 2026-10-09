const signupForm = document.getElementById('facultySignup');
signupForm.addEventListener('submit', async event => {
    event.preventDefault();
    const button = document.getElementById('signupButton');
    const message = document.getElementById('signupMessage');
    if (button.disabled) return;
    const fields = new FormData(signupForm);
    const password = fields.get('password');
    message.className = 'danger';
    if (password !== document.getElementById('confirmPassword').value) {
        message.textContent = 'Passwords do not match.';
        return;
    }
    const payload = { role: 'FACULTY', name: fields.get('name').trim(), facultyId: fields.get('facultyId').trim(), email: fields.get('email').trim(), department: fields.get('department'), password };
    if (!payload.name || !payload.facultyId) { message.textContent = 'Name and faculty ID are required.'; return; }
    button.disabled = true; button.textContent = 'Creating account...'; message.textContent = '';
    try {
        const response = await fetch((location.port==='5500'?'http://localhost:5000':location.origin)+'/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || 'Could not create account. Please try again.');
        signupForm.reset(); message.className = 'good'; message.textContent = 'Faculty application submitted. Your administrator must verify and approve your account before you can log in.';
    } catch (error) { message.textContent = error instanceof TypeError ? 'Cannot reach the server. Please try again when the backend is running.' : error.message; }
    finally { button.disabled = false; button.textContent = 'Create Faculty Account'; }
});
