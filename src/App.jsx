import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, doc, setDoc, onSnapshot } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { TrendingUp, Calculator, Search, Send, Lock, Shield, CheckCircle, AlertTriangle, Plus, X, CreditCard, Copy, LogOut, FileText, Mail, Key, UserCircle, Crown, BookOpen, Home, Percent, HelpCircle, BarChart3, ChevronRight } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, XAxis, Tooltip, CartesianGrid, BarChart, Bar } from 'recharts';
import ReactGA from "react-ga4";

// --- 1. CONFIGURACIÓN FIREBASE (PEGA TUS DATOS AQUÍ) ---
const firebaseConfig = {
    apiKey: "AIzaSyAklVMPIfx51CBy9YRNcwdm5kj1fxtoWtw",
    authDomain: "dolarhub.firebaseapp.com",
    projectId: "dolarhub",
    storageBucket: "dolarhub.firebasestorage.app",
    messagingSenderId: "485763287482",
    appId: "1:485763287482:web:650bb451766fa568073583",
    measurementId: "G-H68JM26166"
};

// Inicializar solo si hay config válida (evita crash en build si está vacío)
const app = Object.keys(firebaseConfig).length > 0 ? initializeApp(firebaseConfig) : null;
const auth = app ? getAuth(app) : null;
const db = app ? getFirestore(app) : null;

// Inicializar Analytics (Opcional)
// ReactGA.initialize("G-TU_ID_REAL");

// --- CONSTANTES DE NEGOCIO ---
const BANK_INFO = {
    alias: "DOLAR.HUB.PRO",
    cbu: "0000003100000000000000",
    bank: "Mercado Pago",
    name: "DolarHub Inc.",
    price: 5000
};

const INDICES_DB = {
    ICL: { '2023-01': 3.15, '2023-06': 4.15, '2024-01': 8.50, '2024-06': 18.5, '2025-01': 26.2 },
    IPC: { '2023-01': 1205, '2024-01': 4200, '2025-01': 10500 },
    CASA_PROPIA: { '2023-01': 1.05, '2024-01': 1.95, '2025-01': 3.25 }
};

const ACADEMY_CONTENT = [
    { id: 1, title: '¿Qué es una Acción?', cat: 'Básico', text: 'Una acción representa una fracción de la propiedad de una empresa. Al comprarla, te conviertes en socio y puedes ganar por la subida del precio o por dividendos.' },
    { id: 2, title: 'CEDEARs Explicados', cat: 'Intermedio', text: 'Son certificados que cotizan en pesos en Argentina pero representan acciones de empresas extranjeras (como Apple o Tesla). Te protegen del tipo de cambio.' },
    { id: 3, title: 'Plazo Fijo vs. Caución', cat: 'Conservador', text: 'El Plazo Fijo inmoviliza tu dinero por 30 días. La Caución Bursátil es similar pero puedes hacerla por 1, 7 o los días que quieras, ofreciendo mayor liquidez.' },
    { id: 4, title: 'Obligaciones Negociables', cat: 'Renta Fija', text: 'Son bonos de deuda emitidos por empresas privadas. Básicamente, le prestas plata a una empresa (como YPF) y te devuelven interés en dólares.' },
];

// --- COMPONENTES UI ---

const RentalCalculator = () => {
    const [amount, setAmount] = useState('');
    const [indexType, setIndexType] = useState('ICL');
    const [startDate, setStartDate] = useState('');
    const [updateDate, setUpdateDate] = useState('');
    const [result, setResult] = useState(null);

    const calculate = () => {
        if (!amount || !startDate || !updateDate) return;
        const startVal = INDICES_DB[indexType][startDate] || 3.15; // Fallback demo
        const endVal = INDICES_DB[indexType][updateDate] || 18.5; // Fallback demo

        const factor = endVal / startVal;
        const newAmount = amount * factor;
        setResult({ newAmount: Math.round(newAmount), pct: ((factor - 1) * 100).toFixed(1) });
    };

    return (
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 h-full flex flex-col shadow-lg">
            <div className="flex items-center gap-3 mb-6">
                <div className="bg-orange-500/20 p-2 rounded-lg"><Home size={24} className="text-orange-400" /></div>
                <div><h3 className="font-bold text-white">Calculadora Alquileres</h3><p className="text-xs text-slate-400">Actualiza según ICL/IPC</p></div>
            </div>
            <div className="space-y-5 flex-1">
                <div className="bg-slate-900/50 p-1 rounded-lg flex gap-1">
                    {['ICL', 'IPC', 'CASA_PROPIA'].map(idx => (
                        <button key={idx} onClick={() => setIndexType(idx)} className={`flex-1 py-2 text-[10px] font-bold rounded-md transition-all ${indexType === idx ? 'bg-orange-500 text-white shadow' : 'text-slate-400 hover:text-white'}`}>{idx.replace('_', ' ')}</button>
                    ))}
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-[10px] text-slate-400 uppercase font-bold mb-1 block">Inicio</label><input type="month" className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-white text-xs outline-none focus:border-orange-500" onChange={e => setStartDate(e.target.value)} /></div>
                    <div><label className="text-[10px] text-slate-400 uppercase font-bold mb-1 block">Actualización</label><input type="month" className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-white text-xs outline-none focus:border-orange-500" onChange={e => setUpdateDate(e.target.value)} /></div>
                </div>
                <div><label className="text-[10px] text-slate-400 uppercase font-bold mb-1 block">Monto Actual ($)</label><input type="number" className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white font-mono outline-none focus:border-orange-500" placeholder="150000" onChange={e => setAmount(e.target.value)} /></div>
                <button onClick={calculate} className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-orange-900/20 transition-transform active:scale-95">Calcular</button>
                {result && (
                    <div className="bg-slate-900 border border-orange-500/30 rounded-xl p-4 animate-in fade-in slide-in-from-bottom-2 text-center">
                        <p className="text-xs text-slate-400 mb-1">Nuevo Monto</p>
                        <p className="text-3xl font-bold text-white">${result.newAmount.toLocaleString()}</p>
                        <p className="text-xs text-green-400 mt-1">+{result.pct}% de aumento</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const PricingTable = ({ onSubscribe }) => (
    <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-xl">
        <div className="grid grid-cols-3 text-center border-b border-slate-700">
            <div className="p-4 bg-slate-900/50"></div>
            <div className="p-4 bg-slate-900/50"><h3 className="font-bold text-white">Free</h3></div>
            <div className="p-4 bg-yellow-500/10"><h3 className="font-bold text-yellow-400 flex justify-center gap-1"><Crown size={16} /> Pro</h3></div>
        </div>
        {[{ n: 'Cotizaciones', f: true, p: true }, { n: 'Alertas Telegram', f: '2 Max', p: '∞' }, { n: 'Historial', f: '30 Días', p: '5 Años' }, { n: 'Calculadoras', f: true, p: true }, { n: 'Soporte', f: false, p: true }].map((x, i) => (
            <div key={i} className="grid grid-cols-3 border-b border-slate-700/50 text-sm py-3 hover:bg-slate-700/30 transition-colors">
                <div className="pl-6 text-slate-300 font-medium">{x.n}</div>
                <div className="text-center text-slate-400">{x.f === true ? <CheckCircle size={16} className="inline text-green-500" /> : x.f === false ? <X size={16} className="inline" /> : x.f}</div>
                <div className="text-center text-white font-bold bg-yellow-500/5">{x.p === true ? <CheckCircle size={16} className="inline text-yellow-400" /> : x.p}</div>
            </div>
        ))}
        <div className="grid grid-cols-3 p-6 gap-4 bg-slate-900/30">
            <div></div><div className="text-center pt-2"><p className="text-2xl font-bold text-white">$0</p></div>
            <div><button onClick={onSubscribe} className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:to-orange-400 text-black font-bold py-2 rounded-lg shadow-lg shadow-yellow-500/20 transform hover:-translate-y-1 transition-all">Mejorar</button></div>
        </div>
    </div>
);

const AuthModal = ({ isOpen, onClose }) => {
    const [isRegister, setIsRegister] = useState(false);
    const [email, setEmail] = useState('');
    const [pass, setPass] = useState('');
    const [error, setError] = useState('');

    if (!isOpen) return null;
    const handleAuth = async (e) => {
        e.preventDefault();
        try {
            if (isRegister) {
                const u = await createUserWithEmailAndPassword(auth, email, pass);
                await setDoc(doc(db, 'users', u.user.uid), { email, plan: 'free', createdAt: new Date().toISOString() });
            } else await signInWithEmailAndPassword(auth, email, pass);
            onClose();
        } catch (e) { setError(e.message.replace('Firebase:', '')); }
    };
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-slate-900 w-full max-w-sm rounded-2xl border border-slate-700 p-8 relative shadow-2xl">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X size={20} /></button>
                <h2 className="text-2xl font-bold text-white mb-2 text-center">{isRegister ? 'Crear Cuenta' : 'Entrar'}</h2>
                <p className="text-xs text-slate-400 text-center mb-6">Accede a tus alertas personalizadas</p>
                <form onSubmit={handleAuth} className="space-y-4">
                    <div className="relative"><Mail className="absolute left-3 top-3 text-slate-500" size={16} /><input type="email" placeholder="Email" className="w-full bg-slate-800 border border-slate-600 rounded-lg pl-10 p-2 text-white outline-none focus:border-blue-500" value={email} onChange={e => setEmail(e.target.value)} /></div>
                    <div className="relative"><Key className="absolute left-3 top-3 text-slate-500" size={16} /><input type="password" placeholder="Contraseña" className="w-full bg-slate-800 border border-slate-600 rounded-lg pl-10 p-2 text-white outline-none focus:border-blue-500" value={pass} onChange={e => setPass(e.target.value)} /></div>
                    {error && <p className="text-xs text-red-400 bg-red-400/10 p-2 rounded">{error}</p>}
                    <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-lg transition-colors">{isRegister ? 'Registrarse' : 'Iniciar Sesión'}</button>
                </form>
                <p className="text-xs text-slate-500 text-center mt-4 cursor-pointer hover:text-blue-400" onClick={() => setIsRegister(!isRegister)}>{isRegister ? '¿Ya tienes cuenta? Entrar' : '¿No tienes cuenta? Regístrate'}</p>
            </div>
        </div>
    );
};

const PaymentModal = ({ isOpen, onClose, user }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in zoom-in-95">
            <div className="bg-slate-900 w-full max-w-md rounded-2xl border border-slate-700 p-0 relative overflow-hidden shadow-2xl">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white z-10"><X size={20} /></button>
                <div className="bg-gradient-to-r from-yellow-600 to-orange-600 p-6 text-center">
                    <Crown size={48} className="text-white mx-auto mb-2 drop-shadow-md" />
                    <h2 className="text-xl font-bold text-white">Hazte Premium</h2>
                    <p className="text-white/80 text-sm">Acceso total inmediato</p>
                </div>
                <div className="p-6">
                    <p className="text-slate-400 text-sm mb-4 text-center">Transfiere <strong>${BANK_INFO.price}</strong> al siguiente alias:</p>
                    <div className="bg-slate-800 p-4 rounded-xl border border-slate-600 mb-6 cursor-pointer hover:bg-slate-750 transition-colors group" onClick={() => { navigator.clipboard.writeText(BANK_INFO.alias); alert('Alias copiado!') }}>
                        <p className="text-xs text-slate-400 mb-1">Alias CBU</p>
                        <div className="flex items-center justify-center gap-2">
                            <p className="font-mono text-xl font-bold text-white tracking-widest">{BANK_INFO.alias}</p>
                            <Copy size={16} className="text-blue-400 group-hover:text-white" />
                        </div>
                    </div>
                    <button onClick={() => { alert('¡Gracias! Hemos recibido tu aviso. En breve verificaremos el pago.'); onClose(); }} className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-green-900/20">
                        Ya transferí, avisar pago
                    </button>
                    <p className="text-[10px] text-slate-500 text-center mt-4">Procesamos pagos manualmente en horario hábil.</p>
                </div>
            </div>
        </div>
    );
};

// --- APP PRINCIPAL ---

export default function DolarHubApp() {
    const [view, setView] = useState('market');
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState({ plan: 'free' });
    const [modals, setModals] = useState({ login: false, payment: false });

    // Mock Market Data (Reemplazar con fetch a API Real o Firestore)
    const RATES = [{ t: 'Blue', p: 1120, v: 0.5 }, { t: 'MEP', p: 1090, v: -0.2 }, { t: 'CCL', p: 1115, v: 0.8 }];

    useEffect(() => {
        // Analytics Pageview
        // ReactGA.send({ hitType: "pageview", page: window.location.pathname });

        if (auth) {
            const unsub = onAuthStateChanged(auth, (u) => {
                if (u) {
                    setUser(u);
                    const ref = doc(db, 'users', u.uid);
                    onSnapshot(ref, (s) => s.exists() ? setUserData(s.data()) : setDoc(ref, { email: u.email, plan: 'free' }));
                } else { setUser(null); setUserData({ plan: 'free' }); }
            });
            return () => unsub();
        }
    }, []);

    return (
        <div className="min-h-screen bg-[#0F172A] font-sans text-white pb-12 flex flex-col selection:bg-blue-500/30">
            <AuthModal isOpen={modals.login} onClose={() => setModals({ ...modals, login: false })} />
            <PaymentModal isOpen={modals.payment} onClose={() => setModals({ ...modals, payment: false })} user={user} />

            <nav className="border-b border-slate-800 bg-[#0F172A]/90 backdrop-blur sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('market')}>
                            <div className="bg-blue-600 p-1.5 rounded shadow-lg shadow-blue-500/20"><TrendingUp size={20} className="text-white" /></div>
                            <span className="font-bold text-xl tracking-tight">DolarHub</span>
                        </div>
                        <div className="hidden md:flex gap-1 bg-slate-800/50 p-1 rounded-lg border border-slate-700">
                            {['market', 'tools', 'academy', 'pricing'].map(v => (
                                <button key={v} onClick={() => setView(v)} className={`px-4 py-1.5 text-xs font-bold rounded-md capitalize transition-all ${view === v ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}>{v === 'pricing' ? 'Planes' : v}</button>
                            ))}
                        </div>
                    </div>
                    <div className="flex gap-3">
                        {userData.plan !== 'premium' && (
                            <button onClick={() => setModals({ ...modals, payment: true })} className="hidden sm:flex text-xs font-bold px-3 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-black rounded items-center gap-1 hover:shadow-lg hover:shadow-orange-500/20 transition-all">
                                <Crown size={14} /> PREMIUM
                            </button>
                        )}
                        {user ? (
                            <div className="flex items-center gap-3">
                                <div className="text-right hidden sm:block">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">Plan</p>
                                    <p className="text-xs font-bold text-white uppercase">{userData.plan}</p>
                                </div>
                                <button onClick={() => signOut(auth)} className="bg-slate-800 hover:bg-slate-700 p-2 rounded-full border border-slate-700 transition-colors" title="Salir"><LogOut size={16} className="text-red-400" /></button>
                            </div>
                        ) : (
                            <button onClick={() => setModals({ ...modals, login: true })} className="text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-700 transition-colors flex items-center gap-2">
                                <UserCircle size={16} /> Entrar
                            </button>
                        )}
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 pt-8 flex-1">
                {view === 'market' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="lg:col-span-2 space-y-6">
                            <div className="grid grid-cols-3 gap-4">
                                {RATES.map(r => (
                                    <div key={r.t} className="bg-slate-800 p-5 rounded-xl border border-slate-700 hover:border-slate-500 transition-colors cursor-default group">
                                        <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">{r.t}</p>
                                        <div className="flex justify-between items-end">
                                            <p className="text-3xl font-bold text-white">${r.p}</p>
                                            <span className={`text-xs font-bold px-2 py-1 rounded ${r.v >= 0 ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'}`}>{r.v > 0 ? '+' : ''}{r.v}%</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 h-80 relative overflow-hidden">
                                <div className="flex justify-between mb-4 relative z-10">
                                    <h3 className="font-bold text-white flex items-center gap-2"><BarChart3 size={18} className="text-blue-400" /> Tendencia Merval</h3>
                                    <div className="flex gap-2"><span className="text-[10px] bg-slate-900 text-slate-400 px-2 py-1 rounded border border-slate-700">1D</span><span className="text-[10px] bg-blue-600/20 text-blue-400 px-2 py-1 rounded border border-blue-500/30">1M</span></div>
                                </div>
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={Array.from({ length: 20 }, (_, i) => ({ v: 1000 + Math.random() * 200 }))}>
                                        <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} /><stop offset="95%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient></defs>
                                        <Area type="monotone" dataKey="v" stroke="#3b82f6" strokeWidth={3} fill="url(#g)" />
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                                        <XAxis hide />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                        <div className="space-y-6">
                            {/* Accesos Directos con Gradientes */}
                            <div onClick={() => setView('tools')} className="bg-gradient-to-br from-orange-500/10 to-slate-800 border border-orange-500/20 p-6 rounded-xl cursor-pointer hover:border-orange-500/50 transition-all hover:shadow-lg hover:shadow-orange-900/10 group">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="bg-orange-500/20 p-2.5 rounded-lg text-orange-400"><Home size={22} /></div>
                                    <ChevronRight className="text-slate-600 group-hover:text-white transition-colors" />
                                </div>
                                <h3 className="font-bold text-white text-lg">Calculadora Alquileres</h3>
                                <p className="text-xs text-slate-400 mt-1 leading-relaxed">Calcula tu ajuste ICL/IPC rápido y fácil. Actualizado a la nueva ley.</p>
                            </div>
                            <div onClick={() => setView('academy')} className="bg-gradient-to-br from-purple-500/10 to-slate-800 border border-purple-500/20 p-6 rounded-xl cursor-pointer hover:border-purple-500/50 transition-all hover:shadow-lg hover:shadow-purple-900/10 group">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="bg-purple-500/20 p-2.5 rounded-lg text-purple-400"><BookOpen size={22} /></div>
                                    <ChevronRight className="text-slate-600 group-hover:text-white transition-colors" />
                                </div>
                                <h3 className="font-bold text-white text-lg">Academia Financiera</h3>
                                <p className="text-xs text-slate-400 mt-1 leading-relaxed">Guías simples para entender CEDEARs, Bonos y cómo ganarle a la inflación.</p>
                            </div>
                        </div>
                    </div>
                )}

                {view === 'tools' && <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in"><RentalCalculator /><div className="bg-slate-800 p-8 rounded-xl border border-slate-700 flex flex-col items-center justify-center text-center opacity-60"><Calculator size={48} className="text-slate-600 mb-4" /><h3 className="text-white font-bold mb-2">Más herramientas pronto</h3><p className="text-sm text-slate-500">Estamos desarrollando la calculadora de Sueldo Neto y Ganancias.</p></div></div>}

                {view === 'academy' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
                        {ACADEMY_CONTENT.map((c, i) => (
                            <div key={i} className="bg-slate-800 border border-slate-700 p-6 rounded-xl hover:border-blue-500/50 transition-all hover:-translate-y-1 hover:shadow-lg group cursor-pointer">
                                <div className="flex justify-between mb-4"><span className="text-[10px] uppercase font-bold bg-slate-700 text-slate-300 px-2 py-1 rounded tracking-wider">{c.cat}</span><ChevronRight className="text-slate-600 group-hover:text-blue-400 transition-colors" /></div>
                                <h3 className="text-xl font-bold text-white mb-2">{c.title}</h3><p className="text-sm text-slate-400 leading-relaxed">{c.text}</p>
                            </div>
                        ))}
                    </div>
                )}

                {view === 'pricing' && <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-8"><div className="text-center mb-10"><h2 className="text-4xl font-bold text-white mb-4">Invierte en tu futuro</h2><p className="text-slate-400">Herramientas profesionales por el precio de un café.</p></div><PricingTable onSubscribe={() => setModals({ ...modals, payment: true })} /></div>}
            </main>

            <footer className="border-t border-slate-800 mt-12 py-8 bg-[#0B1120]">
                <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500">
                    <div className="flex items-center gap-2"><TrendingUp size={16} /><span className="font-bold text-slate-400">DolarHub Inc.</span></div>
                    <div className="flex gap-6"><a href="#" className="hover:text-white transition-colors">Términos</a><a href="#" className="hover:text-white transition-colors">Privacidad</a><span>v7.0.0 Stable</span></div>
                </div>
            </footer>
        </div>
    );
}