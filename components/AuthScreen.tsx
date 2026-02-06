import React, { useState, useEffect } from 'react';
import { Lock, Mail, User, ArrowRight, Shield, Check, X, Key } from 'lucide-react';
import { User as UserType, AccessRequest } from '../types';

interface AuthScreenProps {
  onLogin: (user: UserType) => void;
}

// Simulated Database in LocalStorage
const ADMIN_EMAIL = 'lpaciaroni@gmail.com';
const STORAGE_USERS_KEY = 'ats_users';
const STORAGE_REQUESTS_KEY = 'ats_requests';

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [view, setView] = useState<'login' | 'request'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Admin Dashboard State
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [generatedCreds, setGeneratedCreds] = useState<{email: string, pass: string} | null>(null);

  useEffect(() => {
    // Initialize Admin if not exists
    const users = JSON.parse(localStorage.getItem(STORAGE_USERS_KEY) || '[]');
    if (!users.find((u: UserType) => u.email === ADMIN_EMAIL)) {
      users.push({ email: ADMIN_EMAIL, password: 'admin', role: 'admin', name: 'Admin' });
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    const users = JSON.parse(localStorage.getItem(STORAGE_USERS_KEY) || '[]');
    const user = users.find((u: UserType) => u.email.toLowerCase() === email.toLowerCase() && u.password === password);

    if (user) {
      if (user.role === 'admin') {
        setIsAdminLoggedIn(true);
        loadRequests();
      } else {
        onLogin(user);
      }
    } else {
      setError('Credenciales inválidas. Verifica tu correo y contraseña.');
    }
  };

  const handleRequestAccess = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const requests = JSON.parse(localStorage.getItem(STORAGE_REQUESTS_KEY) || '[]');
    const users = JSON.parse(localStorage.getItem(STORAGE_USERS_KEY) || '[]');

    if (users.find((u: UserType) => u.email === email)) {
      setError('Este correo ya tiene una cuenta activa.');
      return;
    }
    
    if (requests.find((r: AccessRequest) => r.email === email && r.status === 'pending')) {
      setError('Ya existe una solicitud pendiente para este correo.');
      return;
    }

    const newRequest: AccessRequest = {
      id: Math.random().toString(36).substr(2, 9),
      email,
      name,
      date: new Date().toLocaleDateString(),
      status: 'pending'
    };

    localStorage.setItem(STORAGE_REQUESTS_KEY, JSON.stringify([...requests, newRequest]));
    setSuccessMsg(`Solicitud enviada a ${ADMIN_EMAIL}. Recibirás tus credenciales por correo cuando seas aprobado.`);
    setEmail('');
    setName('');
  };

  const loadRequests = () => {
    const reqs = JSON.parse(localStorage.getItem(STORAGE_REQUESTS_KEY) || '[]');
    setRequests(reqs.filter((r: AccessRequest) => r.status === 'pending'));
  };

  const generatePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$";
    let pass = "";
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
  };

  const approveRequest = (req: AccessRequest) => {
    const newPassword = generatePassword();
    
    // Create User
    const users = JSON.parse(localStorage.getItem(STORAGE_USERS_KEY) || '[]');
    const newUser: UserType = { email: req.email, password: newPassword, role: 'user', name: req.name };
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify([...users, newUser]));

    // Update Request
    const allRequests = JSON.parse(localStorage.getItem(STORAGE_REQUESTS_KEY) || '[]');
    const updatedRequests = allRequests.map((r: AccessRequest) => 
      r.id === req.id ? { ...r, status: 'approved' } : r
    );
    localStorage.setItem(STORAGE_REQUESTS_KEY, JSON.stringify(updatedRequests));

    // Show Creds to Admin
    setGeneratedCreds({ email: req.email, pass: newPassword });
    loadRequests();
  };

  const rejectRequest = (id: string) => {
    const allRequests = JSON.parse(localStorage.getItem(STORAGE_REQUESTS_KEY) || '[]');
    const updatedRequests = allRequests.map((r: AccessRequest) => 
      r.id === id ? { ...r, status: 'rejected' } : r
    );
    localStorage.setItem(STORAGE_REQUESTS_KEY, JSON.stringify(updatedRequests));
    loadRequests();
  };

  if (isAdminLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-100 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Shield className="text-blue-600" /> Panel de Administración
            </h1>
            <button onClick={() => { setIsAdminLoggedIn(false); setView('login'); }} className="text-sm text-red-600 hover:underline">
              Cerrar Sesión
            </button>
          </div>

          {generatedCreds && (
            <div className="mb-8 bg-green-50 border border-green-200 p-6 rounded-xl shadow-lg animate-bounce-in">
              <h3 className="text-green-800 font-bold text-lg mb-2 flex items-center gap-2">
                <Check size={24} /> Usuario Aprobado con Éxito
              </h3>
              <p className="text-green-700 mb-4">
                El sistema ha generado automáticamente las credenciales. 
                <br /><strong>Por favor, copia esta información y envíala a {generatedCreds.email}:</strong>
              </p>
              <div className="bg-white p-4 rounded border border-green-200 font-mono text-slate-700">
                <p>Usuario: <strong>{generatedCreds.email}</strong></p>
                <p>Contraseña: <strong className="bg-yellow-100 px-2 rounded text-black select-all">{generatedCreds.pass}</strong></p>
              </div>
              <button 
                onClick={() => setGeneratedCreds(null)}
                className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Entendido, cerrar
              </button>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h2 className="font-bold text-slate-700">Solicitudes de Acceso Pendientes</h2>
            </div>
            {requests.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                No hay solicitudes pendientes.
              </div>
            ) : (
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500">
                  <tr>
                    <th className="p-4">Fecha</th>
                    <th className="p-4">Nombre</th>
                    <th className="p-4">Email</th>
                    <th className="p-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {requests.map(req => (
                    <tr key={req.id} className="hover:bg-slate-50">
                      <td className="p-4">{req.date}</td>
                      <td className="p-4 font-medium text-slate-800">{req.name}</td>
                      <td className="p-4">{req.email}</td>
                      <td className="p-4 flex justify-end gap-2">
                        <button 
                          onClick={() => approveRequest(req)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                          <Key size={14} /> Aprobar
                        </button>
                        <button 
                          onClick={() => rejectRequest(req.id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-slate-200 text-slate-600 rounded hover:bg-slate-300 transition-colors"
                        >
                          <X size={14} /> Rechazar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          
          <div className="mt-8 text-center text-xs text-slate-400">
            Logueado como {ADMIN_EMAIL}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100">
        <div className="p-8 pb-6 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600 mb-6">
                <Lock size={32} />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">ATS Master Pro</h1>
            <p className="text-slate-500 text-sm">Plataforma profesional de optimización de talento.</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100">
            <button 
                onClick={() => { setView('login'); setError(null); setSuccessMsg(null); }}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${view === 'login' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
                Iniciar Sesión
            </button>
            <button 
                onClick={() => { setView('request'); setError(null); setSuccessMsg(null); }}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${view === 'request' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
                Solicitar Acceso
            </button>
        </div>

        <div className="p-8">
            {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
                    <Shield size={16} /> {error}
                </div>
            )}
             {successMsg && (
                <div className="mb-4 p-3 bg-green-50 text-green-700 text-sm rounded-lg border border-green-100">
                    {successMsg}
                </div>
            )}

            {view === 'login' ? (
                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Correo Electrónico</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 text-slate-400" size={18} />
                            <input 
                                type="email" 
                                required
                                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                placeholder="tu@empresa.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
                            <input 
                                type="password" 
                                required
                                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>
                    <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all shadow-lg shadow-blue-200 mt-2 flex justify-center items-center gap-2">
                        Ingresar <ArrowRight size={18} />
                    </button>
                </form>
            ) : (
                <form onSubmit={handleRequestAccess} className="space-y-4">
                    <p className="text-xs text-slate-500 mb-4 bg-slate-50 p-3 rounded">
                        Las solicitudes son revisadas manualmente por el administrador ({ADMIN_EMAIL}).
                    </p>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Completo</label>
                        <div className="relative">
                            <User className="absolute left-3 top-3 text-slate-400" size={18} />
                            <input 
                                type="text" 
                                required
                                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                placeholder="Juan Pérez"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Correo Profesional</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 text-slate-400" size={18} />
                            <input 
                                type="email" 
                                required
                                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                placeholder="tu@empresa.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>
                    <button type="submit" className="w-full py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg transition-all mt-2">
                        Enviar Solicitud
                    </button>
                </form>
            )}
        </div>
        <div className="bg-slate-50 p-4 text-center text-xs text-slate-400 border-t border-slate-100">
            &copy; {new Date().getFullYear()} ATS Master Pro. Acceso Restringido.
        </div>
      </div>
    </div>
  );
};