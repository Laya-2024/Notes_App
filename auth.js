// Authentication functionality
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');

    // Handle login
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            // Simple authentication (in real app, use proper backend)
            const users = JSON.parse(localStorage.getItem('notesUsers') || '[]');
            const user = users.find(u => u.email === email && u.password === password);
            
            if (user) {
                localStorage.setItem('notesUser', JSON.stringify(user));
                window.location.href = 'dashboard.html';
            } else {
                alert('Invalid email or password');
            }
        });
    }

    // Handle signup
    if (signupForm) {
        signupForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            const users = JSON.parse(localStorage.getItem('notesUsers') || '[]');
            
            if (users.find(u => u.email === email)) {
                alert('Email already exists');
                return;
            }
            
            const newUser = { id: Date.now(), name, email, password };
            users.push(newUser);
            localStorage.setItem('notesUsers', JSON.stringify(users));
            localStorage.setItem('notesUser', JSON.stringify(newUser));
            
            window.location.href = 'dashboard.html';
        });
    }
});