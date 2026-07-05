import { useState, useEffect } from 'react';

// Temporarily disabling the API_BASE unused warning if you aren't using it yet, 
// though it IS used in the fetch calls below!
const API_BASE = import.meta.env.VITE_API_URL || 'https://management-t0be.onrender.com';

function App() {
  const [currentView, setCurrentView] = useState(() => localStorage.getItem('token') ? 'portal' : 'login');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') !== 'light');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  
  const [notices, setNotices] = useState([]);
  const [systemUsers, setSystemUsers] = useState([]); 
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [department, setDepartment] = useState(''); 

  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');

  // --- EFFECTS ---
  useEffect(() => {
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // FIX: Using an async wrapper inside the effect prevents the "cascading render" warning
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
          console.error("Notice fetch error:", error); // FIX: Actually utilizing the error variable
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
            console.error("User fetch error:", error);
            setSystemUsers([]);
          }
        }
      }
    };

    initializePortal();
  }, [currentView]);

  // Helper functions for manual updates (like after submitting a notice)
  const fetchNotices = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/notices`);
      const data = await response.json();
      setNotices(Array.isArray(data) ? data : []);
    } catch (error) { 
      console.error(error);
      setNotices([]); 
    }
  };

  const fetchSystemUsers = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/users`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (Array.isArray(data)) setSystemUsers(data);
    } catch (error) { 
      console.error(error);
      setSystemUsers([]); 
    }
  };

  // --- HANDLERS ---
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
    } catch (error) { 
      console.error(error);
      setCurrentView('login'); 
    }
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
    } catch (error) { 
      console.error(error);
      setCurrentView('register'); 
    }
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

  const submitNewNotice = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE}/api/notices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ title: noticeTitle, content: noticeContent })
      });
      if (response.ok) {
        alert("Notice published successfully!");
        setNoticeTitle('');
        setNoticeContent('');
        fetchNotices(); 
      }
    } catch (error) { 
      console.error(error);
      alert("Network error while publishing."); 
    }
  };

  const assignRole = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE}/api/admin/assign-role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ email: e.target.elements.targetEmail.value, newRole: e.target.elements.assignedRole.value })
      });
      const result = await response.json();
      alert(result.message);
      if (response.ok) { e.target.reset(); fetchSystemUsers(); }
    } catch (error) { 
      console.error(error);
      alert("Failed to reach security server."); 
    }
  };

  // --- GLASSMORPHISM THEME ---
  const theme = {
    bg: darkMode 
      ? 'linear-gradient(135deg, #0f2027, #203a43, #2c5364)' 
      : 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    glassBg: darkMode ? 'rgba(15, 23, 42, 0.4)' : 'rgba(255, 255, 255, 0.4)',
    glassBorder: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.5)',
    glassShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
    text: darkMode ? '#ffffff' : '#1e293b',
    textMuted: darkMode ? '#cbd5e1' : '#475569',
    primary: '#6366f1',
    inputBg: darkMode ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)',
  };

  // --- UPGRADED LOADING SCREEN ---
  if (currentView === 'loading') {
    return (
      <div style={{height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: theme.bg}}>
        <style>{`
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          .glass-spinner { border: 4px solid ${theme.glassBorder}; border-top: 4px solid ${theme.primary}; border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; margin-bottom: 20px; }
        `}</style>
        <div className="glass-spinner"></div>
        <h3 style={{ color: theme.text, fontFamily: "'Segoe UI', sans-serif", fontWeight: '500' }}>Authenticating...</h3>
      </div>
    );
  }

  // Render Auth
  if (currentView === 'login' || currentView === 'register') {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', background: theme.bg }}>
        
        <style>{`
          #root { width: 100%; max-width: none !important; margin: 0 !important; padding: 0 !important; text-align: left !important; }
          body { margin: 0; padding: 0; overflow: hidden; }
          * { box-sizing: border-box; font-family: 'Segoe UI', sans-serif; }
          input, select, textarea {
            background-color: ${theme.inputBg} !important;
            color: ${theme.text} !important;
            border: 1px solid ${theme.glassBorder} !important;
            backdrop-filter: blur(4px);
            outline: none;
          }
          input::placeholder { color: ${theme.textMuted} !important; }
        `}</style>

        <div style={{ 
          background: theme.glassBg, 
          backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
          padding: '50px 40px', borderRadius: '24px', 
          boxShadow: theme.glassShadow, 
          width: '100%', maxWidth: '420px', margin: '20px', 
          border: `1px solid ${theme.glassBorder}` 
        }}>
          <h2 style={{ textAlign: 'center', marginBottom: '30px', color: theme.text, fontSize: '2.2rem', textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            {currentView === 'login' ? 'Welcome Back' : 'Create Account'}
          </h2>
          
          <form onSubmit={currentView === 'login' ? handleLogin : handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ padding: '14px', borderRadius: '12px' }} />
            
            {currentView === 'register' && (
              <>
                <input type="text" placeholder="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} required style={{ padding: '14px', borderRadius: '12px' }} />
                <input type="text" placeholder="Student ID" value={studentId} onChange={(e) => setStudentId(e.target.value)} required style={{ padding: '14px', borderRadius: '12px' }} />
                <select value={department} onChange={(e) => setDepartment(e.target.value)} required style={{ padding: '14px', borderRadius: '12px' }}>
                  <option value="" disabled>Select Dept...</option>
                  <option value="SWE">SWE</option>
                  <option value="CSE">CSE</option>
                </select>
              </>
            )}
            
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ padding: '14px', borderRadius: '12px' }} />
            <button type="submit" style={{ padding: '14px', borderRadius: '12px', background: theme.primary, color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem', marginTop: '10px', boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)' }}>
              {currentView === 'login' ? 'Sign In' : 'Register'}
            </button>
          </form>
          
          <p style={{ textAlign: 'center', marginTop: '25px', fontSize: '0.95rem', cursor: 'pointer', color: theme.text, fontWeight: 'bold' }} onClick={() => setCurrentView(currentView === 'login' ? 'register' : 'login')}>
            {currentView === 'login' ? 'Create an account' : 'Already have an account? Login'}
          </p>
        </div>
      </div>
    );
  }

  // Render Full-Screen Portal
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, height: '100vh', width: '100vw', background: theme.bg, display: 'flex', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", overflow: 'hidden' }}>
      
      <style>{`
        #root { width: 100%; max-width: none !important; margin: 0 !important; padding: 0 !important; }
        body { margin: 0; padding: 0; overflow: hidden; }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.3); border-radius: 4px; }
        
        input, select, textarea { background-color: ${theme.inputBg} !important; color: ${theme.text} !important; border: 1px solid ${theme.glassBorder} !important; outline: none; backdrop-filter: blur(4px); }
        input::placeholder, textarea::placeholder { color: ${theme.textMuted} !important; }
        
        /* Custom Pill Toggle Switch */
        .toggle-switch { position: relative; display: inline-block; width: 40px; height: 22px; }
        .toggle-switch input { opacity: 0; width: 0; height: 0; }
        .toggle-slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: ${darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}; transition: .4s; border-radius: 30px; border: 1px solid ${theme.glassBorder}; }
        .toggle-slider:before { position: absolute; content: ""; height: 14px; width: 14px; left: 3px; bottom: 3px; background-color: ${darkMode ? '#fff' : '#fff'}; transition: .4s; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.2); }
        .toggle-switch input:checked + .toggle-slider { background-color: ${theme.primary}; }
        .toggle-switch input:checked + .toggle-slider:before { transform: translateX(18px); }
        
        /* Expanding Dashboard Grid */
        .dashboard-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 24px; width: 100%; }

        /* Menu Item Hover */
        .menu-item:hover { background: rgba(255,255,255,0.1); }
      `}</style>

      {/* GLASS SIDEBAR */}
      <div style={{ width: '280px', height: '100vh', flexShrink: 0, background: theme.glassBg, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderRight: `1px solid ${theme.glassBorder}`, boxShadow: theme.glassShadow, color: theme.text, display: 'flex', flexDirection: 'column', padding: '30px 20px', zIndex: 10 }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px', padding: '0 10px' }}>
          <div style={{ background: 'rgba(255,255,255,0.2)', padding: '10px', borderRadius: '12px', fontSize: '20px', backdropFilter: 'blur(4px)' }}>🎓</div>
          {/* UPDATED TITLE */}
          <h2 style={{ margin: 0, fontSize: '1.4rem', color: theme.text, textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>Student Manager</h2>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div onClick={() => setActiveTab('dashboard')} style={{ padding: '14px 20px', borderRadius: '12px', cursor: 'pointer', background: activeTab === 'dashboard' ? 'rgba(255,255,255,0.2)' : 'transparent', color: theme.text, fontWeight: activeTab === 'dashboard' ? 'bold' : 'normal', transition: '0.2s', border: activeTab === 'dashboard' ? `1px solid ${theme.glassBorder}` : '1px solid transparent' }}>
            📊 Dashboard
          </div>
          
          {localStorage.getItem('userRole') === 'Admin' && (
            <div onClick={() => setActiveTab('admin')} style={{ padding: '14px 20px', borderRadius: '12px', cursor: 'pointer', background: activeTab === 'admin' ? 'rgba(255,255,255,0.2)' : 'transparent', color: theme.text, fontWeight: activeTab === 'admin' ? 'bold' : 'normal', transition: '0.2s', border: activeTab === 'admin' ? `1px solid ${theme.glassBorder}` : '1px solid transparent' }}>
              🛡️ Admin Panel
            </div>
          )}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', color: theme.text }}>
        
        {/* GLASS HEADER */}
        <div style={{ height: '80px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 40px', background: theme.glassBg, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderBottom: `1px solid ${theme.glassBorder}`, zIndex: 99 }}>
          <div style={{ textAlign: 'right', marginRight: '15px' }}>
            <strong style={{ display: 'block', fontSize: '1rem', color: theme.text }}>{localStorage.getItem('userName')}</strong>
            <span style={{ fontSize: '0.85rem', color: theme.textMuted }}>{localStorage.getItem('userDept')} | {localStorage.getItem('userRole')}</span>
          </div>
          
          {/* INTERACTIVE PROFILE AVATAR & DROPDOWN */}
          <div style={{ position: 'relative' }}>
            <div 
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: `1px solid ${theme.glassBorder}`, color: theme.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 'bold', backdropFilter: 'blur(4px)', cursor: 'pointer', transition: '0.2s', boxShadow: isProfileMenuOpen ? `0 0 0 2px ${theme.primary}` : 'none' }}
            >
              {localStorage.getItem('userName')?.charAt(0) || 'U'}
            </div>

            {/* DROPDOWN MENU */}
            {isProfileMenuOpen && (
              <div style={{ position: 'absolute', top: '55px', right: '0', width: '220px', background: theme.glassBg, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: `1px solid ${theme.glassBorder}`, borderRadius: '16px', boxShadow: theme.glassShadow, padding: '10px', display: 'flex', flexDirection: 'column', gap: '5px', zIndex: 100 }}>
                
                <div className="menu-item" style={{ padding: '12px 15px', borderRadius: '10px', cursor: 'pointer', color: theme.text, display: 'flex', alignItems: 'center', gap: '12px', fontWeight: '500', transition: '0.2s' }} onClick={() => setIsProfileMenuOpen(false)}>
                  👤 Profile
                </div>
                
                <div className="menu-item" style={{ padding: '12px 15px', borderRadius: '10px', cursor: 'pointer', color: theme.text, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: '500', transition: '0.2s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    🌗 Dark Mode
                  </div>
                  <label className="toggle-switch">
                    <input type="checkbox" checked={darkMode} onChange={() => setDarkMode(!darkMode)} />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                
                <div className="menu-item" style={{ padding: '12px 15px', borderRadius: '10px', cursor: 'pointer', color: theme.text, display: 'flex', alignItems: 'center', gap: '12px', fontWeight: '500', transition: '0.2s' }} onClick={() => setIsProfileMenuOpen(false)}>
                  ⚙️ Settings
                </div>

                <div style={{ height: '1px', background: theme.glassBorder, margin: '5px 0' }}></div>

                <div className="menu-item" onClick={handleLogout} style={{ padding: '12px 15px', borderRadius: '10px', cursor: 'pointer', color: darkMode ? '#fca5a5' : '#ef4444', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 'bold', transition: '0.2s' }}>
                  🚪 Log Out
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SCROLLABLE PAGE CONTENT */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '40px' }} onClick={() => isProfileMenuOpen && setIsProfileMenuOpen(false)}>
          
          {/* HERO BANNER WITH DEFAULT AVATAR */}
          <div style={{ background: `linear-gradient(135deg, ${theme.primary}, #9333ea)`, borderRadius: '24px', padding: '40px', color: 'white', marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 15px 35px rgba(99, 102, 241, 0.3)' }}>
            <div>
              <h1 style={{ margin: '0 0 10px 0', fontSize: '2.4rem', textShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>Welcome back, {localStorage.getItem('userName')?.split(' ')[0]}!</h1>
              <p style={{ margin: 0, opacity: 0.9, fontSize: '1.1rem' }}>Always stay updated in your student manager.</p>
            </div>
            
            {/* HERO PROFILE PICTURE */}
            <div style={{ width: '90px', height: '90px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: '4px solid rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', fontWeight: 'bold', color: 'white', backdropFilter: 'blur(10px)', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
              {localStorage.getItem('userName')?.charAt(0) || 'U'}
            </div>
          </div>

          <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
            {activeTab === 'dashboard' && (
              <div>
                <h3 style={{ marginBottom: '20px', color: theme.text, fontSize: '1.6rem', textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>Daily Notices</h3>
                <div className="dashboard-grid">
                  {/* FIX: Using the mapping index instead of Math.random() to satisfy React strict purity */}
                  {notices.map((n, index) => (
                    <div key={n._id || `notice-${index}`} style={{ background: theme.glassBg, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', padding: '25px', borderRadius: '20px', border: `1px solid ${theme.glassBorder}`, boxShadow: theme.glassShadow }}>
                      <strong style={{ display: 'block', fontSize: '1.3rem', color: theme.text, marginBottom: '10px' }}>{n.title}</strong>
                      <p style={{ margin: '0 0 20px 0', fontSize: '1.05rem', lineHeight: '1.6', color: theme.textMuted }}>{n.content}</p>
                      <div style={{ fontSize: '0.85rem', color: theme.textMuted, fontWeight: 'bold', background: 'rgba(255,255,255,0.1)', padding: '5px 10px', borderRadius: '8px', display: 'inline-block' }}>
                        {n.authorName ? `From: ${n.authorName}` : 'System Admin'}
                      </div>
                    </div>
                  ))}
                  {notices.length === 0 && <p style={{ color: theme.textMuted, fontSize: '1.2rem' }}>No new notices broadcasted yet.</p>}
                </div>
              </div>
            )}

            {activeTab === 'admin' && localStorage.getItem('userRole') === 'Admin' && (
              <div>
                <h3 style={{ marginBottom: '20px', color: theme.text, fontSize: '1.6rem', textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>Administrative Controls</h3>
                
                <div className="dashboard-grid" style={{ marginBottom: '40px' }}>
                  {/* GLASS CARD: ROLE */}
                  <div style={{ background: theme.glassBg, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', padding: '30px', borderRadius: '20px', border: `1px solid ${theme.glassBorder}`, boxShadow: theme.glassShadow }}>
                    <h4 style={{ margin: '0 0 20px 0', color: theme.text, fontSize: '1.3rem' }}>👥 Assign System Role</h4>
                    <form onSubmit={assignRole} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      <input type="email" name="targetEmail" placeholder="student-id@diu.edu.bd" required style={{ width: '100%', padding: '14px', borderRadius: '12px' }} />
                      <select name="assignedRole" required style={{ width: '100%', padding: '14px', borderRadius: '12px' }}>
                        <option value="" disabled>Select Permission Level...</option>
                        <option value="Student">Student Access</option>
                        <option value="CR">CR (Class Representative)</option>
                        <option value="Admin">System Administrator</option>
                      </select>
                      <button type="submit" style={{ padding: '14px', borderRadius: '12px', background: '#10b981', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)' }}>Apply Changes</button>
                    </form>
                  </div>

                  {/* GLASS CARD: NOTICE */}
                  <div style={{ background: theme.glassBg, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', padding: '30px', borderRadius: '20px', border: `1px solid ${theme.glassBorder}`, boxShadow: theme.glassShadow }}>
                    <h4 style={{ margin: '0 0 20px 0', color: theme.text, fontSize: '1.3rem' }}>📢 Broadcast Notice</h4>
                    <form onSubmit={submitNewNotice} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      <input type="text" placeholder="Notice Title" value={noticeTitle} onChange={(e) => setNoticeTitle(e.target.value)} required style={{ width: '100%', padding: '14px', borderRadius: '12px' }} />
                      <textarea placeholder="Write the announcement..." value={noticeContent} onChange={(e) => setNoticeContent(e.target.value)} required style={{ width: '100%', padding: '14px', borderRadius: '12px', resize: 'vertical', minHeight: '100px' }} />
                      <button type="submit" style={{ padding: '14px', borderRadius: '12px', background: theme.primary, color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem', boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)' }}>Publish Notice</button>
                    </form>
                  </div>
                </div>

                {/* GLASS CARD: DIRECTORY TABLE */}
                <div style={{ background: theme.glassBg, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', padding: '30px', borderRadius: '20px', border: `1px solid ${theme.glassBorder}`, boxShadow: theme.glassShadow, overflowX: 'auto', width: '100%' }}>
                  <h4 style={{ margin: '0 0 20px 0', color: theme.text, fontSize: '1.3rem' }}>📇 System User Directory</h4>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '1.05rem' }}>
                    <thead>
                      <tr style={{ borderBottom: `2px solid ${theme.glassBorder}` }}>
                        <th style={{ padding: '16px 12px', color: theme.text }}>Full Name</th>
                        <th style={{ padding: '16px 12px', color: theme.text }}>University Email</th>
                        <th style={{ padding: '16px 12px', color: theme.text }}>Department</th>
                        <th style={{ padding: '16px 12px', color: theme.text }}>System Role</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* FIX: Using mapping index instead of Math.random() */}
                      {systemUsers.map((user, index) => (
                        <tr key={user._id || `user-${index}`} style={{ borderBottom: `1px solid ${theme.glassBorder}` }}>
                          <td style={{ padding: '16px 12px', color: theme.text, fontWeight: '500' }}>{user.fullName}</td>
                          <td style={{ padding: '16px 12px', color: theme.textMuted }}>{user.email}</td>
                          <td style={{ padding: '16px 12px', color: theme.textMuted }}>{user.department}</td>
                          <td style={{ padding: '16px 12px' }}>
                            <span style={{ 
                              padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold',
                              background: user.role === 'Admin' ? 'rgba(99, 102, 241, 0.2)' : user.role === 'CR' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                              color: user.role === 'Admin' ? (darkMode ? '#a5b4fc' : theme.primary) : user.role === 'CR' ? (darkMode ? '#6ee7b7' : '#10b981') : theme.text,
                              border: `1px solid ${theme.glassBorder}`
                            }}>
                              {user.role}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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