import { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'https://management-t0be.onrender.com';

function App() {
  const [currentView, setCurrentView] = useState(() => localStorage.getItem('token') ? 'portal' : 'login');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') !== 'light');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 
  
  const [notices, setNotices] = useState([]);
  const [systemUsers, setSystemUsers] = useState([]); 
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [department, setDepartment] = useState(''); 

  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');

  // --- INITIALIZATION ---
  useEffect(() => {
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    const initializePortal = async () => {
      if (currentView === 'portal') {
        if (!localStorage.getItem('token')) {
          setCurrentView('login');
          return;
        }
        
        try {
          const noticeRes = await fetch(`${API_BASE}/api/notices`);
          const noticeData = await noticeRes.json();
          setNotices(Array.isArray(noticeData) ? noticeData : []);
        } catch (error) { 
          setNotices([]); 
        }

        if (localStorage.getItem('userRole') === 'Admin') {
          try {
            const userRes = await fetch(`${API_BASE}/api/admin/users`, {
              headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const userData = await userRes.json();
            if (Array.isArray(userData)) setSystemUsers(userData);
          } catch (error) {
            setSystemUsers([]);
          }
        }
      }
    };
    initializePortal();
  }, [currentView]);

  const fetchNotices = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/notices`);
      const data = await response.json();
      setNotices(Array.isArray(data) ? data : []);
    } catch (error) { console.error(error); setNotices([]); }
  };

  const fetchSystemUsers = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/users`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (Array.isArray(data)) setSystemUsers(data);
    } catch (error) { console.error(error); setSystemUsers([]); }
  };

  // --- AUTHENTICATION HANDLERS ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setCurrentView('loading');
    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }) 
      });
      const data = await response.json();

      if (response.ok && data.token) {
        localStorage.setItem('token', data.token); 
        localStorage.setItem('userName', data.user?.name || 'Student');
        localStorage.setItem('userDept', data.user?.department || 'General');
        localStorage.setItem('userRole', data.user?.role || 'Student'); 
        
        setActiveTab('dashboard');
        setCurrentView('portal');
      } else {
        alert(data.message || "Login failed");
        setCurrentView('login');
      }
    } catch (error) { console.error(error); setCurrentView('login'); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!email.endsWith('@diu.edu.bd')) return alert("Restricted to DIU university mail only.");
    setCurrentView('loading');
    try {
      const response = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, fullName, studentId, department, password })
      });
      if (response.ok) {
        alert("Registration Success! Please login.");
        setCurrentView('login');
      } else setCurrentView('register');
    } catch (error) { console.error(error); setCurrentView('register'); }
  };

  const handleDemoLogin = (role) => {
    setCurrentView('loading');
    setTimeout(() => {
      localStorage.setItem('token', `demo-token-${role.toLowerCase()}`); 
      if (role === 'Admin') {
        localStorage.setItem('userName', 'Demo Admin');
        localStorage.setItem('userDept', 'SWE');
        localStorage.setItem('userRole', 'Admin'); 
        setActiveTab('admin');
      } else {
        localStorage.setItem('userName', 'Demo Student');
        localStorage.setItem('userDept', 'CSE');
        localStorage.setItem('userRole', 'Student'); 
        setActiveTab('dashboard');
      }
      setCurrentView('portal');
    }, 800);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    localStorage.removeItem('userDept');
    localStorage.removeItem('userRole');
    setEmail('');
    setPassword('');
    setIsProfileMenuOpen(false);
    setCurrentView('login');
  };

  // --- ADMIN HANDLERS ---
  const submitNewNotice = async (e) => {
    e.preventDefault();
    if (localStorage.getItem('token')?.startsWith('demo-token')) {
      alert("Notice Published! (Demo Mode: Not saved to database)");
      setNoticeTitle('');
      setNoticeContent('');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/notices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ title: noticeTitle, content: noticeContent })
      });
      if (response.ok) {
        setNoticeTitle('');
        setNoticeContent('');
        fetchNotices(); 
      } else {
        const data = await response.json();
        alert(`Backend Error: ${data.message}`);
      }
    } catch (error) { console.error(error); alert("Network error."); }
  };

  const assignRole = async (e) => {
    e.preventDefault();
    if (localStorage.getItem('token')?.startsWith('demo-token')) {
      alert("Role Updated! (Demo Mode: Changes not saved to database)");
      e.target.reset();
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/admin/assign-role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ email: e.target.elements.targetEmail.value, newRole: e.target.elements.assignedRole.value })
      });
      const result = await response.json();
      alert(result.message);
      if (response.ok) { e.target.reset(); fetchSystemUsers(); }
    } catch (error) { console.error(error); alert("Failed to reach server."); }
  };

  // --- THEME ENGINE ---
  const theme = {
    // Exact requested color for light mode background
    bg: darkMode ? 'linear-gradient(135deg, #0f2027, #203a43, #2c5364)' : '#D2D5DC',
    glassBg: darkMode ? 'rgba(15, 23, 42, 0.45)' : 'rgba(255, 255, 255, 0.6)',
    containerBorder: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.7)',
    glassShadow: darkMode ? '0 8px 32px 0 rgba(0, 0, 0, 0.3)' : '0 4px 20px 0 rgba(0, 0, 0, 0.05)',
    text: darkMode ? '#f8fafc' : '#1e293b',
    textMuted: darkMode ? '#94a3b8' : '#475569',
    primary: '#4f46e5',
    inputBg: darkMode ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.85)',
    menuBg: darkMode ? 'rgba(30, 41, 59, 0.85)' : 'rgba(255, 255, 255, 0.95)',
    listHover: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.4)',
  };

  const noticeColors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];

  // --- LOADING UI ---
  if (currentView === 'loading') {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: theme.bg, zIndex: 9999 }}>
        <style>{`
          body { margin: 0; padding: 0; overflow: hidden; }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          .glass-spinner { border: 3px solid ${theme.containerBorder}; border-top: 3px solid ${theme.primary}; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin-bottom: 20px; }
        `}</style>
        <div className="glass-spinner"></div>
        <h3 style={{ color: theme.text, fontFamily: "'Segoe UI', sans-serif", fontWeight: '500', fontSize: '1.1rem' }}>Authenticating...</h3>
      </div>
    );
  }

  // --- AUTHENTICATION UI ---
  if (currentView === 'login' || currentView === 'register') {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', background: theme.bg }}>
        <style>{`
          #root { width: 100%; max-width: none !important; margin: 0 !important; padding: 0 !important; text-align: left !important; }
          body { margin: 0; padding: 0; overflow: hidden; }
          * { box-sizing: border-box; font-family: 'Segoe UI', sans-serif; }
          input, select, textarea { background-color: ${theme.inputBg} !important; color: ${theme.text} !important; border: 1px solid ${darkMode ? theme.containerBorder : '#e2e8f0'} !important; outline: none; transition: 0.2s; font-size: 0.95rem !important;}
          input:focus, select:focus { border-color: ${theme.primary} !important; box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.15); }
          input::placeholder { color: ${theme.textMuted} !important; }
          .demo-btn { flex: 1; padding: 10px; border-radius: 8px; border: 1px solid ${darkMode ? theme.containerBorder : '#e2e8f0'}; background: ${theme.inputBg}; color: ${theme.text}; font-weight: 600; cursor: pointer; transition: 0.2s; font-size: 0.9rem; }
          .demo-btn:hover { background: ${theme.listHover}; transform: translateY(-1px); }
        `}</style>
        
        <div style={{ background: theme.glassBg, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', padding: '35px', borderRadius: '16px', boxShadow: theme.glassShadow, width: '90%', maxWidth: '400px', border: `1px solid ${theme.containerBorder}`, maxHeight: '95vh', overflowY: 'auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '25px' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🎓</div>
            <h2 style={{ margin: 0, color: theme.text, fontSize: '1.6rem', fontWeight: '600' }}>{currentView === 'login' ? 'Student Manager' : 'Create Account'}</h2>
          </div>
          
          <form onSubmit={currentView === 'login' ? handleLogin : handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input type="email" placeholder="University Email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ padding: '12px', borderRadius: '8px' }} />
            {currentView === 'register' && (
              <>
                <input type="text" placeholder="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} required style={{ padding: '12px', borderRadius: '8px' }} />
                <input type="text" placeholder="Student ID" value={studentId} onChange={(e) => setStudentId(e.target.value)} required style={{ padding: '12px', borderRadius: '8px' }} />
                <select value={department} onChange={(e) => setDepartment(e.target.value)} required style={{ padding: '12px', borderRadius: '8px' }}>
                  <option value="" disabled>Select Dept...</option>
                  <option value="SWE">SWE</option>
                  <option value="CSE">CSE</option>
                </select>
              </>
            )}
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ padding: '12px', borderRadius: '8px' }} />
            <button type="submit" style={{ padding: '12px', borderRadius: '8px', background: theme.primary, color: 'white', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '1rem', marginTop: '4px', transition: '0.2s' }}>
              {currentView === 'login' ? 'Sign In' : 'Register'}
            </button>
          </form>

          {currentView === 'login' && (
            <div style={{ marginTop: '20px' }}>
              <div style={{ textAlign: 'center', fontSize: '0.75rem', color: theme.textMuted, marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }}>Or explore demo</div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" className="demo-btn" onClick={() => handleDemoLogin('Admin')}>🛡️ Admin</button>
                <button type="button" className="demo-btn" onClick={() => handleDemoLogin('Student')}>👤 Student</button>
              </div>
            </div>
          )}
          
          <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.85rem', cursor: 'pointer', color: theme.textMuted, fontWeight: '500' }} onClick={() => setCurrentView(currentView === 'login' ? 'register' : 'login')}>
            {currentView === 'login' ? 'Need an account? Register here' : 'Already have an account? Sign in'}
          </p>
        </div>
      </div>
    );
  }

  // --- DASHBOARD UI ---
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, height: '100vh', width: '100vw', background: theme.bg, display: 'flex', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", overflow: 'hidden' }}>
      
      <style>{`
        #root { width: 100%; max-width: none !important; margin: 0 !important; padding: 0 !important; }
        body { margin: 0; padding: 0; overflow: hidden; }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'}; border-radius: 4px; }
        
        input, select, textarea { background-color: ${theme.inputBg} !important; color: ${theme.text} !important; border: 1px solid ${darkMode ? theme.containerBorder : '#e2e8f0'} !important; outline: none; transition: border-color 0.2s; font-size: 0.95rem; }
        input:focus, select:focus, textarea:focus { border-color: ${theme.primary} !important; box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.15); }
        input::placeholder, textarea::placeholder { color: ${theme.textMuted} !important; }
        
        .toggle-switch { position: relative; display: inline-block; width: 36px; height: 20px; margin: 0; }
        .toggle-switch input { opacity: 0; width: 0; height: 0; }
        .toggle-slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: ${darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}; transition: .3s; border-radius: 30px; }
        .toggle-slider:before { position: absolute; content: ""; height: 14px; width: 14px; left: 3px; bottom: 3px; background-color: #fff; transition: .3s; border-radius: 50%; }
        .toggle-switch input:checked + .toggle-slider { background-color: ${theme.primary}; }
        .toggle-switch input:checked + .toggle-slider:before { transform: translateX(16px); }
        
        .pro-menu-item { padding: 10px 16px; border-radius: 6px; cursor: pointer; color: ${theme.text}; display: flex; align-items: center; gap: 10px; font-weight: 500; font-size: 0.9rem; transition: background 0.2s ease; }
        .pro-menu-item:hover { background: ${theme.listHover}; }
        
        .notice-row:hover { background: ${theme.listHover} !important; }

        .sidebar-container { width: 260px; transition: transform 0.3s ease; z-index: 100; }
        .mobile-overlay { display: none; }
        .hamburger { display: none; cursor: pointer; font-size: 1.2rem; color: ${theme.text}; padding: 10px; margin-right: auto; }
        
        @media (max-width: 768px) {
          .sidebar-container { position: absolute; height: 100%; transform: translateX(-100%); }
          .sidebar-container.open { transform: translateX(0); }
          .mobile-overlay.open { display: block; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 90; backdrop-filter: blur(4px); }
          .hamburger { display: block; }
          .header-nav { padding: 0 15px !important; }
          .main-scroll-area { padding: 15px !important; }
          .hero-banner { padding: 20px !important; flex-direction: column-reverse; align-items: flex-start !important; gap: 15px; }
        }
      `}</style>

      {/* Sidebar Section */}
      <div className={`mobile-overlay ${isSidebarOpen ? 'open' : ''}`} onClick={() => setIsSidebarOpen(false)}></div>
      <div className={`sidebar-container ${isSidebarOpen ? 'open' : ''}`} style={{ flexShrink: 0, background: theme.glassBg, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderRight: `1px solid ${theme.containerBorder}`, display: 'flex', flexDirection: 'column', padding: '25px 15px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '35px', padding: '0 10px' }}>
          <div style={{ background: theme.inputBg, padding: '8px', borderRadius: '8px', fontSize: '18px', border: `1px solid ${darkMode ? theme.containerBorder : '#e2e8f0'}` }}>🎓</div>
          <h2 style={{ margin: 0, fontSize: '1.2rem', color: theme.text, fontWeight: '600' }}>Student Manager</h2>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }} style={{ padding: '12px 16px', borderRadius: '8px', cursor: 'pointer', background: activeTab === 'dashboard' ? theme.listHover : 'transparent', color: theme.text, fontWeight: activeTab === 'dashboard' ? '600' : '500', fontSize: '0.95rem', transition: '0.2s' }}>
            📊 Dashboard
          </div>
          
          {localStorage.getItem('userRole') === 'Admin' && (
            <div onClick={() => { setActiveTab('admin'); setIsSidebarOpen(false); }} style={{ padding: '12px 16px', borderRadius: '8px', cursor: 'pointer', background: activeTab === 'admin' ? theme.listHover : 'transparent', color: theme.text, fontWeight: activeTab === 'admin' ? '600' : '500', fontSize: '0.95rem', transition: '0.2s' }}>
              🛡️ Admin Panel
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        
        {/* Top Header */}
        <div className="header-nav" style={{ height: '70px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 30px', background: theme.glassBg, backdropFilter: 'blur(16px)', borderBottom: `1px solid ${theme.containerBorder}`, zIndex: 50 }}>
          <div className="hamburger" onClick={() => setIsSidebarOpen(true)}>☰</div>
          <div style={{ textAlign: 'right', marginRight: '15px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <strong style={{ fontSize: '0.9rem', color: theme.text, lineHeight: '1.2' }}>{localStorage.getItem('userName')}</strong>
            <span style={{ fontSize: '0.75rem', color: theme.textMuted }}>{localStorage.getItem('userDept')} | {localStorage.getItem('userRole')}</span>
          </div>
          
          <div style={{ position: 'relative' }}>
            <div 
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              style={{ width: '40px', height: '40px', borderRadius: '50%', background: theme.inputBg, border: `1px solid ${isProfileMenuOpen ? theme.primary : (darkMode ? theme.containerBorder : '#e2e8f0')}`, color: theme.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s', userSelect: 'none' }}
            >
              {localStorage.getItem('userName')?.charAt(0) || 'U'}
            </div>

            {/* Profile Dropdown */}
            {isProfileMenuOpen && (
              <div style={{ position: 'absolute', top: '48px', right: '0', width: '200px', background: theme.menuBg, backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: `1px solid ${theme.containerBorder}`, borderRadius: '12px', boxShadow: theme.glassShadow, padding: '6px', display: 'flex', flexDirection: 'column', gap: '2px', zIndex: 9999 }}>
                <div className="pro-menu-item" style={{ justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span>🌗</span> Dark Mode
                  </div>
                  <label className="toggle-switch">
                    <input type="checkbox" checked={darkMode} onChange={() => setDarkMode(!darkMode)} />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                <div style={{ height: '1px', background: darkMode ? theme.containerBorder : '#e2e8f0', margin: '6px' }}></div>
                <div className="pro-menu-item" onClick={handleLogout} style={{ color: darkMode ? '#fca5a5' : '#ef4444' }}>
                  <span>🚪</span> Log Out
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Workspace */}
        <div className="main-scroll-area" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '30px' }} onClick={() => { if(isProfileMenuOpen) setIsProfileMenuOpen(false); }}>
          
          {/* Welcome Hero */}
          <div className="hero-banner" style={{ background: theme.glassBg, backdropFilter: 'blur(16px)', border: `1px solid ${theme.containerBorder}`, boxShadow: theme.glassShadow, borderRadius: '12px', padding: '24px 30px', marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ margin: '0 0 4px 0', fontSize: '1.4rem', color: theme.text, fontWeight: '600' }}>Welcome back, {localStorage.getItem('userName')?.split(' ')[0]}!</h1>
              <p style={{ margin: 0, color: theme.textMuted, fontSize: '0.9rem' }}>Here is the latest from your student manager.</p>
            </div>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: theme.primary, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold', boxShadow: `0 4px 15px ${theme.primary}40` }}>
              {localStorage.getItem('userName')?.charAt(0) || 'U'}
            </div>
          </div>

          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            
            {/* Dashboard Tab */}
            {activeTab === 'dashboard' && (
              <div style={{ background: theme.glassBg, backdropFilter: 'blur(24px)', borderRadius: '12px', border: `1px solid ${theme.containerBorder}`, boxShadow: theme.glassShadow, overflow: 'hidden' }}>
                <div style={{ padding: '16px 24px', borderBottom: `1px solid ${darkMode ? theme.containerBorder : 'rgba(0,0,0,0.08)'}`, background: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.2rem' }}>📌</span>
                  <h3 style={{ margin: 0, color: theme.text, fontSize: '1.05rem', fontWeight: '600' }}>Notice Board</h3>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {notices.map((n, index) => {
                    const accentColor = noticeColors[index % noticeColors.length];
                    return (
                      <div key={n._id || `notice-${index}`} className="notice-row" style={{ display: 'flex', padding: '24px', borderBottom: index === notices.length - 1 ? 'none' : `1px solid ${darkMode ? theme.containerBorder : 'rgba(0,0,0,0.06)'}`, position: 'relative', transition: 'background 0.2s', cursor: 'default' }}>
                        <div style={{ width: '4px', background: accentColor, position: 'absolute', left: 0, top: '16px', bottom: '16px', borderRadius: '0 4px 4px 0' }}></div>
                        
                        <div style={{ flex: 1, paddingLeft: '16px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', flexWrap: 'wrap', gap: '10px' }}>
                            <strong style={{ fontSize: '1rem', color: theme.text, fontWeight: '600' }}>{n.title}</strong>
                            <div style={{ fontSize: '0.8rem', color: theme.textMuted, display: 'flex', alignItems: 'center', gap: '6px', background: theme.inputBg, padding: '4px 10px', borderRadius: '6px', border: `1px solid ${darkMode ? theme.containerBorder : 'rgba(0,0,0,0.05)'}`, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                              <span>👤</span> {n.authorName || 'System Admin'}
                            </div>
                          </div>
                          
                          {/* FIX: Explicit left alignment and word-break for long test strings */}
                          <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.6', color: theme.textMuted, textAlign: 'left', wordBreak: 'break-word' }}>
                            {n.content}
                          </p>
                          
                        </div>
                      </div>
                    );
                  })}
                  {notices.length === 0 && <div style={{ padding: '40px', textAlign: 'center', color: theme.textMuted, fontSize: '0.9rem' }}>No new notices broadcasted yet.</div>}
                </div>
              </div>
            )}

            {/* Admin Tab */}
            {activeTab === 'admin' && localStorage.getItem('userRole') === 'Admin' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                  
                  <div style={{ background: theme.glassBg, backdropFilter: 'blur(16px)', padding: '24px', borderRadius: '12px', border: `1px solid ${theme.containerBorder}`, boxShadow: theme.glassShadow }}>
                    <h4 style={{ margin: '0 0 16px 0', color: theme.text, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}><span>👥</span> Assign Role</h4>
                    <form onSubmit={assignRole} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <input type="email" name="targetEmail" placeholder="student-id@diu.edu.bd" required style={{ width: '100%', padding: '10px 12px', borderRadius: '8px' }} />
                      <select name="assignedRole" required style={{ width: '100%', padding: '10px 12px', borderRadius: '8px' }}>
                        <option value="" disabled>Select Role...</option>
                        <option value="Student">Student Access</option>
                        <option value="CR">CR (Class Rep)</option>
                        <option value="Admin">System Administrator</option>
                      </select>
                      <button type="submit" style={{ padding: '10px', borderRadius: '8px', background: '#10b981', color: 'white', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '0.95rem' }}>Apply Changes</button>
                    </form>
                  </div>

                  <div style={{ background: theme.glassBg, backdropFilter: 'blur(16px)', padding: '24px', borderRadius: '12px', border: `1px solid ${theme.containerBorder}`, boxShadow: theme.glassShadow }}>
                    <h4 style={{ margin: '0 0 16px 0', color: theme.text, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}><span>📢</span> Broadcast Notice</h4>
                    <form onSubmit={submitNewNotice} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <input type="text" placeholder="Notice Title" value={noticeTitle} onChange={(e) => setNoticeTitle(e.target.value)} required style={{ width: '100%', padding: '10px 12px', borderRadius: '8px' }} />
                      <textarea placeholder="Write the announcement..." value={noticeContent} onChange={(e) => setNoticeContent(e.target.value)} required style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', resize: 'vertical', minHeight: '80px', fontFamily: 'inherit' }} />
                      <button type="submit" style={{ padding: '10px', borderRadius: '8px', background: theme.primary, color: 'white', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '0.95rem' }}>Publish</button>
                    </form>
                  </div>
                </div>

                <div style={{ background: theme.glassBg, backdropFilter: 'blur(16px)', borderRadius: '12px', border: `1px solid ${theme.containerBorder}`, boxShadow: theme.glassShadow, overflow: 'hidden' }}>
                  <div style={{ padding: '16px 20px', borderBottom: `1px solid ${darkMode ? theme.containerBorder : '#e2e8f0'}`, background: darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}>
                    <h4 style={{ margin: 0, color: theme.text, fontSize: '1rem', fontWeight: '600' }}>📇 System User Directory</h4>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem', minWidth: '600px' }}>
                      <thead>
                        <tr style={{ borderBottom: `2px solid ${darkMode ? theme.containerBorder : '#e2e8f0'}` }}>
                          <th style={{ padding: '12px 20px', color: theme.textMuted, fontWeight: '600' }}>Name</th>
                          <th style={{ padding: '12px 20px', color: theme.textMuted, fontWeight: '600' }}>Email</th>
                          <th style={{ padding: '12px 20px', color: theme.textMuted, fontWeight: '600' }}>Dept</th>
                          <th style={{ padding: '12px 20px', color: theme.textMuted, fontWeight: '600' }}>Role</th>
                        </tr>
                      </thead>
                      <tbody>
                        {systemUsers.map((user, index) => (
                          <tr key={user._id || `user-${index}`} className="notice-row" style={{ borderBottom: `1px solid ${darkMode ? theme.containerBorder : '#e2e8f0'}`, transition: 'background 0.2s' }}>
                            <td style={{ padding: '12px 20px', color: theme.text, fontWeight: '500' }}>{user.fullName}</td>
                            <td style={{ padding: '12px 20px', color: theme.textMuted }}>{user.email}</td>
                            <td style={{ padding: '12px 20px', color: theme.textMuted }}>{user.department}</td>
                            <td style={{ padding: '12px 20px' }}>
                              <span style={{ padding: '4px 10px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600', background: user.role === 'Admin' ? 'rgba(99, 102, 241, 0.1)' : user.role === 'CR' ? 'rgba(16, 185, 129, 0.1)' : theme.inputBg, color: user.role === 'Admin' ? (darkMode ? '#a5b4fc' : theme.primary) : user.role === 'CR' ? (darkMode ? '#6ee7b7' : '#10b981') : theme.textMuted, border: `1px solid ${darkMode ? theme.containerBorder : '#e2e8f0'}` }}>
                                {user.role}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;