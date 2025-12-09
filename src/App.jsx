import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, doc, setDoc, onSnapshot, query, where, deleteDoc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { TrendingUp, Calculator, Search, Send, Lock, Shield, CheckCircle, AlertTriangle, Plus, X, CreditCard, Copy, LogOut, FileText, Mail, Key, UserCircle, Crown, BookOpen, Home, Percent, HelpCircle, BarChart3, ChevronRight, Calendar, User, Trash2, ArrowLeft, Lightbulb } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, XAxis, Tooltip, CartesianGrid, BarChart, Bar } from 'recharts';
import ReactGA from "react-ga4";

// --- 1. CONFIGURACIÓN FIREBASE ---
const firebaseConfig = {
    apiKey: "AIzaSyAklVMPIfx51CBy9YRNcwdm5kj1fxtoWtw",
    authDomain: "dolarhub.firebaseapp.com",
    projectId: "dolarhub",
    storageBucket: "dolarhub.firebasestorage.app",
    messagingSenderId: "485763287482",
    appId: "1:485763287482:web:650bb451766fa568073583",
    measurementId: "G-H68JM26166"
};

// Inicialización segura
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- 2. BASE DE DATOS DE CONTENIDO ---

const INDICES_DB = {
    ICL: {
        '2023-01': 3.20, '2023-06': 4.45, '2023-12': 8.20,
        '2024-01': 10.50, '2024-06': 23.10, '2024-12': 32.50,
        '2025-01': 34.10, '2025-06': 42.80, '2025-12': 55.00
    },
    IPC: {
        '2023-01': 1250, '2023-12': 3800,
        '2024-01': 4600, '2024-12': 10500,
        '2025-01': 11200, '2025-12': 18000
    },
    CASA_PROPIA: {
        '2023-01': 1.05, '2023-12': 1.70,
        '2024-01': 1.85, '2024-12': 2.90,
        '2025-01': 3.05, '2025-12': 4.20
    }
};

const ACADEMY_ARTICLES = [
    {
        id: 1,
        title: 'Guía Definitiva de CEDEARs',
        cat: 'Principiante',
        readTime: '5 min',
        content: `
      <h3 class="text-xl font-bold text-white mb-2">¿Qué son los CEDEARs?</h3>
      <p class="mb-4">Los <strong>Certificados de Depósito Argentinos</strong> (CEDEARs) son instrumentos de renta variable que cotizan en la Bolsa de Comercio de Buenos Aires y representan acciones de empresas extranjeras como Apple, Google, Tesla o Coca-Cola.</p>
      <h3 class="text-xl font-bold text-white mb-2">El Ratio de Conversión</h3>
      <p>Las acciones de USA son caras. Para que sean accesibles, se dividen en "ratios". Por ejemplo, el ratio de Apple es <strong>10:1</strong>.</p>
    `
    },
    {
        id: 2,
        title: 'Entendiendo el Dólar MEP y CCL',
        cat: 'Intermedio',
        readTime: '4 min',
        content: `<h3 class="text-xl font-bold text-white mb-2">Dólar Bolsa (MEP)</h3><p class="mb-4">Es el dólar que se consigue comprando un bono en pesos (ej: AL30) y vendiéndolo en dólares (AL30D).</p>`
    },
    {
        id: 3,
        title: '¿Plazo Fijo o Caución?',
        cat: 'Conservador',
        readTime: '3 min',
        content: `<h3 class="text-xl font-bold text-white mb-2">Caución Bursátil</h3><p class="mb-4">Es como un plazo fijo pero en la bolsa. Le prestas dinero a otro inversor que deja sus acciones como garantía.</p>`
    },
];

const MASTER_DB = [
    { s: 'AAPL', n: 'Apple Inc.', us_p: 235.50, type: 'CEDEAR', ratio: 10 },
    { s: 'MELI', n: 'MercadoLibre', us_p: 2100.00, type: 'CEDEAR', ratio: 120 },
    { s: 'SPY', n: 'SPDR S&P 500', us_p: 580.00, type: 'CEDEAR', ratio: 20 },
    { s: 'KO', n: 'Coca-Cola', us_p: 68.00, type: 'CEDEAR', ratio: 5 },
    { s: 'AL30', n: 'Bono Rep. Arg 2030', p_ars: 68500, type: 'BONO', ratio: 1 },
];

const BANK_INFO = {
    alias: "DOLAR.HUB.PRO",
    cbu: "0000003100000000000000",
    bank: "Mercado Pago",
    name: "DolarHub Inc.",
    price: 5000
};

// --- 3. COMPONENTES UI (Definidos antes de usarse) ---

const UserProfileModal = ({ isOpen, onClose, user, userData }) => {
    if (!isOpen) return null;

    // Protección contra objetos inválidos en fechas
    const joinDate = userData?.createdAt
        ? new Date(userData.createdAt).toLocaleDateString()
        : new Date().toLocaleDateString();

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in zoom-in-95">
            <div className="bg-slate-900 w-full max-w-md rounded-2xl border border-slate-700 shadow-2xl p-6 relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X size={20} /></button>
                <div className="flex items-center gap-3 mb-6 border-b border-slate-800 pb-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl border-2 border-blue-400">
                        {user.email ? user.email[0].toUpperCase() : 'U'}
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white">Mi Perfil</h2>
                        <p className="text-xs text-slate-400">{user.email}</p>
                    </div>
                </div>
                <div className="space-y-4 mb-6">
                    <div className="bg-slate-800 p-3 rounded-lg flex justify-between items-center">
                        <span className="text-sm text-slate-400">Plan Actual</span>
                        <span className={`text-xs font-bold px-2 py-1 rounded ${userData?.plan === 'premium' ? 'bg-yellow-500 text-black' : 'bg-slate-600 text-white'}`}>
                            {userData?.plan?.toUpperCase() || 'FREE'}
                        </span>
                    </div>
                    <div className="bg-slate-800 p-3 rounded-lg flex justify-between items-center">
                        <span className="text-sm text-slate-400">ID Cliente</span>
                        <span className="text-xs font-mono text-slate-500">{user.uid.slice(0, 8)}</span>
                    </div>
                    <div className="bg-slate-800 p-3 rounded-lg flex justify-between items-center">
                        <span className="text-sm text-slate-400">Miembro desde</span>
                        <span className="text-xs text-slate-300">{joinDate}</span>
                    </div>
                </div>
                <button onClick={() => { signOut(auth); onClose(); }} className="w-full border border-red-500/30 text-red-400 hover:bg-red-500/10 font-bold py-2 rounded-lg flex items-center justify-center gap-2 transition-colors">
                    <LogOut size={16} /> Cerrar Sesión
                </button>
            </div>
        </div>
    );
};

const RentalCalculator = () => {
    const [amount, setAmount] = useState('');
    const [indexType, setIndexType] = useState('ICL');
    const [startDate, setStartDate] = useState('');
    const [updateDate, setUpdateDate] = useState('');
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');

    const getIndexValue = (type, dateStr) => {
        const indices = INDICES_DB[type];
        if (!indices) return null;
        const keys = Object.keys(indices).sort();

        // Match exacto o aproximación al mes
        if (indices[dateStr]) return indices[dateStr];

        // Fallbacks si la fecha es muy nueva o vieja
        if (dateStr > keys[keys.length - 1]) return indices[keys[keys.length - 1]];
        if (dateStr < keys[0]) return indices[keys[0]];

        return null;
    };

    const calculate = () => {
        setError('');
        setResult(null);

        if (!amount || !startDate || !updateDate) {
            setError("Completa todos los campos.");
            return;
        }

        const startVal = getIndexValue(indexType, startDate.slice(0, 7));
        const endVal = getIndexValue(indexType, updateDate.slice(0, 7));

        if (!startVal || !endVal) {
            setError("Datos de índice no disponibles para estas fechas.");
            return;
        }

        const factor = endVal / startVal;
        const newAmount = amount * factor;
        const pct = (factor - 1) * 100;

        setResult({
            newAmount: Math.floor(newAmount),
            pct: pct.toFixed(2),
            diff: Math.floor(newAmount - amount),
            startVal,
            endVal
        });
    };

    return (
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg h-full">
            <div className="flex items-center gap-3 mb-6">
                <div className="bg-orange-500/20 p-2 rounded-lg"><Home size={24} className="text-orange-400" /></div>
                <div><h3 className="font-bold text-white">Calculadora Alquileres</h3><p className="text-xs text-slate-400">Ajuste por ICL / IPC</p></div>
            </div>
            <div className="space-y-5">
                <div className="bg-slate-900/50 p-1 rounded-lg flex gap-1">
                    {['ICL', 'IPC', 'CASA_PROPIA'].map(idx => (
                        <button key={idx} onClick={() => setIndexType(idx)} className={`flex-1 py-2 text-[10px] font-bold rounded-md transition-all ${indexType === idx ? 'bg-orange-500 text-white shadow' : 'text-slate-400 hover:text-white'}`}>{idx.replace('_', ' ')}</button>
                    ))}
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-[10px] text-slate-400 uppercase font-bold mb-1 block">Inicio</label><input type="month" className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-white text-xs outline-none focus:border-orange-500" onChange={e => setStartDate(e.target.value)} /></div>
                    <div><label className="text-[10px] text-slate-400 uppercase font-bold mb-1 block">Actualización</label><input type="month" className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-white text-xs outline-none focus:border-orange-500" onChange={e => setUpdateDate(e.target.value)} /></div>
                </div>
                <div><label className="text-[10px] text-slate-400 uppercase font-bold mb-1 block">Monto Actual ($)</label><input type="number" className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white font-mono outline-none focus:border-orange-500" placeholder="Ej: 150000" onChange={e => setAmount(e.target.value)} /></div>
                {error && <p className="text-xs text-red-400 bg-red-400/10 p-2 rounded">{error}</p>}
                <button onClick={calculate} className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 rounded-xl shadow-lg transition-transform active:scale-95">Calcular</button>
                {result && (
                    <div className="bg-slate-900 border border-orange-500/30 rounded-xl p-4 animate-in fade-in slide-in-from-bottom-2 text-center">
                        <p className="text-xs text-slate-400 mb-1">Nuevo Monto</p>
                        <p className="text-3xl font-bold text-white">${result.newAmount.toLocaleString()}</p>
                        <p className="text-xs text-green-400 mt-1">+{result.pct}% (${result.diff.toLocaleString()})</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const AcademyViewer = ({ onBack }) => {
    const [selectedArticle, setSelectedArticle] = useState(null);

    if (selectedArticle) {
        return (
            <div className="animate-in fade-in slide-in-from-right-4">
                <button onClick={() => setSelectedArticle(null)} className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors">
                    <ArrowLeft size={18} /> Volver a la lista
                </button>
                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 max-w-3xl mx-auto shadow-2xl">
                    <div className="flex items-center gap-3 mb-6">
                        <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 uppercase tracking-wider">{selectedArticle.cat}</span>
                        <span className="text-xs text-slate-500 flex items-center gap-1"><Lightbulb size={12} /> {selectedArticle.readTime} lectura</span>
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-6">{selectedArticle.title}</h1>
                    <div className="prose prose-invert prose-slate max-w-none text-slate-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: selectedArticle.content }}></div>
                </div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in">
            {ACADEMY_ARTICLES.map(art => (
                <div key={art.id} onClick={() => setSelectedArticle(art)} className="bg-slate-800 border border-slate-700 p-6 rounded-xl hover:border-blue-500/50 hover:shadow-lg transition-all cursor-pointer group flex flex-col h-full">
                    <div className="flex justify-between items-start mb-4">
                        <div className="bg-slate-700/50 p-2 rounded-lg group-hover:bg-blue-600 transition-colors"><BookOpen size={20} className="text-slate-400 group-hover:text-white" /></div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase">{art.cat}</span>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">{art.title}</h3>
                    <div className="mt-auto pt-4 flex justify-between items-center border-t border-slate-700/50">
                        <span className="text-xs text-slate-500">{art.readTime}</span>
                        <ChevronRight size={16} className="text-slate-600 group-hover:text-white" />
                    </div>
                </div>
            ))}
        </div>
    );
};

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
        } catch (e) { setError(e.message); }
    };
    return (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"><div className="bg-slate-900 w-full max-w-sm rounded-2xl border border-slate-700 p-8 relative shadow-2xl"><button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X size={20} /></button><h2 className="text-2xl font-bold text-white mb-2 text-center">{isRegister ? 'Registro' : 'Ingresar'}</h2><form onSubmit={handleAuth} className="space-y-4"><div className="relative"><Mail className="absolute left-3 top-3 text-slate-500" size={16} /><input type="email" placeholder="Email" className="w-full bg-slate-800 border border-slate-600 rounded-lg pl-10 p-2 text-white outline-none focus:border-blue-500" value={email} onChange={e => setEmail(e.target.value)} /></div><div className="relative"><Key className="absolute left-3 top-3 text-slate-500" size={16} /><input type="password" placeholder="Contraseña" className="w-full bg-slate-800 border border-slate-600 rounded-lg pl-10 p-2 text-white outline-none focus:border-blue-500" value={pass} onChange={e => setPass(e.target.value)} /></div>{error && <p className="text-xs text-red-400 bg-red-400/10 p-2 rounded">{error}</p>}<button className="w-full bg-blue-600 text-white font-bold py-2 rounded-lg">{isRegister ? 'Crear' : 'Entrar'}</button></form><p className="text-xs text-slate-500 text-center mt-4 cursor-pointer" onClick={() => setIsRegister(!isRegister)}>{isRegister ? 'Ya tengo cuenta' : 'Crear cuenta'}</p></div></div>);
};

const PaymentModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;
    return (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"><div className="bg-slate-900 w-full max-w-md rounded-2xl border border-slate-700 p-6 relative text-center"><button onClick={onClose} className="absolute top-4 right-4 text-slate-400"><X size={20} /></button><Crown size={48} className="text-yellow-400 mx-auto mb-4" /><h2 className="text-xl font-bold text-white">Hazte Premium</h2><p className="text-slate-400 text-sm mb-6">Transfiere <strong>${BANK_INFO.price}</strong> al alias:</p><div className="bg-slate-800 p-4 rounded-xl border border-slate-600 mb-6 cursor-pointer" onClick={() => { navigator.clipboard.writeText(BANK_INFO.alias); alert('Copiado') }}><p className="font-mono text-xl font-bold text-white">{BANK_INFO.alias}</p></div><button onClick={() => { alert('Aviso enviado'); onClose() }} className="w-full bg-green-600 text-white font-bold py-3 rounded-xl">Ya transferí</button></div></div>);
};

const PricingTable = ({ onSubscribe }) => (
    <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-xl">
        <div className="grid grid-cols-3 text-center border-b border-slate-700"><div className="p-4 bg-slate-900/50"></div><div className="p-4 bg-slate-900/50"><h3 className="font-bold text-white">Free</h3></div><div className="p-4 bg-yellow-500/10"><h3 className="font-bold text-yellow-400 flex justify-center gap-1"><Crown size={16} /> Pro</h3></div></div>
        {[{ n: 'Cotizaciones', f: true, p: true }, { n: 'Alertas Telegram', f: '2 Max', p: '∞' }, { n: 'Historial', f: '30 Días', p: '5 Años' }].map((x, i) => (<div key={i} className="grid grid-cols-3 border-b border-slate-700/50 text-sm py-3"><div className="pl-6 text-slate-300 font-medium">{x.n}</div><div className="text-center text-slate-400">{x.f === true ? <CheckCircle size={16} className="inline text-green-500" /> : x.f}</div><div className="text-center text-white font-bold bg-yellow-500/5">{x.p === true ? <CheckCircle size={16} className="inline text-yellow-400" /> : x.p}</div></div>))}
        <div className="grid grid-cols-3 p-6 gap-4 bg-slate-900/30"><div></div><div className="text-center pt-2"><p className="text-2xl font-bold text-white">$0</p></div><div><button onClick={onSubscribe} className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-2 rounded-lg">Mejorar</button></div></div>
    </div>
);

const TelegramWidget = ({ user, userData, onLogin, onUpgrade }) => {
    const [alerts, setAlerts] = useState([]);
    const [isAdding, setIsAdding] = useState(false);
    const [newAlert, setNewAlert] = useState({ asset: 'Blue', cond: '>', price: '' });

    useEffect(() => {
        if (user) {
            const q = query(collection(db, 'alerts'), where('userId', '==', user.uid));
            const unsub = onSnapshot(q, (snap) => setAlerts(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
            return () => unsub();
        } else setAlerts([]);
    }, [user]);

    const addAlert = async () => {
        if (!newAlert.price) return;
        await addDoc(collection(db, 'alerts'), {
            userId: user.uid,
            asset: newAlert.asset,
            condition: newAlert.cond,
            targetPrice: parseFloat(newAlert.price),
            active: true,
            telegramChatId: "1790304803"
        });
        setIsAdding(false);
        setNewAlert({ asset: 'Blue', cond: '>', price: '' });
    };

    const deleteAlert = async (id) => await deleteDoc(doc(db, 'alerts', id));

    if (!user) return (<div className="bg-slate-800 border border-slate-700 rounded-xl p-6 text-center"><Send className="text-blue-400 mx-auto mb-3" size={24} /><h3 className="font-bold text-white mb-2">Alertas en Tiempo Real</h3><p className="text-xs text-slate-400 mb-4">Recibe notificaciones cuando el dólar o acciones toquen tu precio objetivo.</p><button onClick={onLogin} className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2 px-6 rounded-full transition-colors">Iniciar Sesión</button></div>);

    const isPremium = userData?.plan === 'premium';
    const canAdd = alerts.length < (isPremium ? 99 : 2);

    return (
        <div className="bg-gradient-to-br from-[#229ED9]/10 to-slate-800 border border-[#229ED9]/30 rounded-xl p-5 relative overflow-hidden">
            <div className="flex items-center justify-between mb-4 relative z-10"><div className="flex items-center gap-2"><Send size={18} className="text-[#229ED9]" /><h3 className="font-bold text-white text-sm">Mis Alertas</h3></div><span className="text-[10px] bg-slate-900 px-2 py-1 rounded text-slate-400">{alerts.length}/{isPremium ? '∞' : '2'}</span></div>
            <div className="space-y-2 mb-4 max-h-40 overflow-y-auto custom-scrollbar relative z-10">
                {alerts.map(a => (<div key={a.id} className="bg-slate-900/80 p-2 rounded flex justify-between items-center text-xs border border-slate-700"><span className="text-white font-bold">{a.asset} {a.condition} ${a.targetPrice}</span><button onClick={() => deleteAlert(a.id)} className="text-slate-500 hover:text-red-400"><Trash2 size={12} /></button></div>))}
                {alerts.length === 0 && !isAdding && <p className="text-xs text-slate-500 text-center">No tienes alertas activas.</p>}
            </div>
            {isAdding ? (
                <div className="bg-slate-900 p-2 rounded border border-slate-600 animate-in fade-in">
                    <div className="flex gap-1 mb-2">
                        <select className="bg-slate-800 text-xs text-white rounded p-1 w-full" value={newAlert.asset} onChange={e => setNewAlert({ ...newAlert, asset: e.target.value })}><option value="Blue">Dólar Blue</option><option value="MEP">Dólar MEP</option><option value="AAPL">Apple (CEDEAR)</option><option value="MELI">MercadoLibre</option></select>
                        <select className="bg-slate-800 text-xs text-white rounded p-1" value={newAlert.cond} onChange={e => setNewAlert({ ...newAlert, cond: e.target.value })}><option value=">">&gt;</option><option value="<">&lt;</option></select>
                    </div>
                    <input type="number" placeholder="Precio ($)" className="w-full bg-slate-800 text-xs text-white rounded p-1 mb-2" value={newAlert.price} onChange={e => setNewAlert({ ...newAlert, price: e.target.value })} />
                    <div className="flex gap-2"><button onClick={addAlert} className="flex-1 bg-green-600 text-[10px] text-white py-1 rounded">Guardar</button><button onClick={() => setIsAdding(false)} className="flex-1 bg-slate-700 text-[10px] text-white py-1 rounded">Cancelar</button></div>
                </div>
            ) : (canAdd ? <button onClick={() => setIsAdding(true)} className="w-full bg-[#229ED9] hover:bg-[#1e8ub9] text-white text-xs font-bold py-2 rounded-lg transition-colors flex justify-center items-center gap-1"><Plus size={14} /> Nueva Alerta</button> : <button onClick={onUpgrade} className="w-full bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"><Lock size={12} className="text-yellow-500" /> Desbloquear</button>)}
        </div>
    );
};

const MarketColumn = ({ liveRates, loading }) => {
    const [filter, setFilter] = useState('');
    const [category, setCategory] = useState('ALL');

    const cclRate = useMemo(() => {
        const ccl = liveRates.find(r => r.casa === 'contadoconliqui');
        return ccl ? parseFloat(ccl.venta) : 1150;
    }, [liveRates]);

    const filteredAssets = useMemo(() => {
        return MASTER_DB.filter(asset => {
            const searchMatch = asset.s.toLowerCase().includes(filter.toLowerCase()) || asset.n.toLowerCase().includes(filter.toLowerCase());
            const catMatch = category === 'ALL' || asset.type === category;
            return searchMatch && catMatch;
        });
    }, [filter, category]);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {['Blue', 'Bolsa', 'Contadoconliqui', 'Oficial'].map(type => {
                    const rate = liveRates.find(r => r.casa === type.toLowerCase());
                    const price = rate ? rate.venta : '...';
                    const name = type === 'Bolsa' ? 'MEP' : type === 'Contadoconliqui' ? 'CCL' : type;
                    return (<div key={type} className="bg-slate-800 p-3 rounded-lg border border-slate-700 hover:border-blue-500/50 transition-colors"><p className="text-[10px] text-slate-400 uppercase font-bold">Dólar {name}</p><div className="flex items-baseline gap-1 mt-1"><span className="text-xl font-bold text-white">${price}</span></div><p className="text-[10px] text-slate-500 mt-1">Compra: ${rate ? rate.compra : '-'}</p></div>)
                })}
            </div>
            <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden flex flex-col h-[500px]">
                <div className="p-4 border-b border-slate-700 bg-slate-800">
                    <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-white flex items-center gap-2"><BarChart3 size={18} className="text-purple-400" /> Panel de Cotizaciones</h3><div className="flex bg-slate-900 rounded p-1">{['ALL', 'CEDEAR', 'ACCION'].map(c => (<button key={c} onClick={() => setCategory(c)} className={`px-2 py-1 text-[10px] font-bold rounded ${category === c ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>{c}</button>))}</div></div>
                    <div className="relative"><Search size={14} className="absolute left-3 top-2.5 text-slate-500" /><input type="text" placeholder="Buscar activo..." className="w-full bg-slate-900 border border-slate-600 rounded-lg pl-9 pr-4 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500" onChange={e => setFilter(e.target.value)} /></div>
                </div>
                <div className="overflow-y-auto flex-1 custom-scrollbar">
                    {filteredAssets.map(asset => {
                        let finalPrice = 0;
                        if (asset.type === 'CEDEAR' && asset.us_p) finalPrice = (asset.us_p * cclRate) / asset.ratio;
                        else finalPrice = asset.p_ars || 0;
                        const variation = (Math.random() * 2 - 1).toFixed(2);
                        const isUp = variation >= 0;
                        return (
                            <div key={asset.s} className="grid grid-cols-12 gap-2 p-3 border-b border-slate-800 hover:bg-slate-800/80 items-center cursor-default group">
                                <div className="col-span-5 flex gap-2 items-center"><span className={`text-[9px] font-bold px-1.5 py-0.5 rounded w-10 text-center text-slate-900 ${asset.type === 'CEDEAR' ? 'bg-purple-400' : 'bg-blue-400'}`}>{asset.type.substring(0, 3)}</span><div><h4 className="font-bold text-white text-xs group-hover:text-blue-400 transition-colors">{asset.s}</h4><p className="text-[9px] text-slate-500 truncate w-20">{asset.n}</p></div></div>
                                <div className="col-span-3 text-right"><span className="font-mono font-bold text-white text-xs">${finalPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>{asset.type === 'CEDEAR' && <p className="text-[8px] text-slate-600">u$s {asset.us_p}</p>}</div>
                                <div className="col-span-2 text-center text-[9px] text-slate-500">{asset.ratio}</div>
                                <div className="col-span-2 text-right"><span className={`text-[10px] font-bold ${isUp ? 'text-green-400' : 'text-red-400'}`}>{isUp ? '+' : ''}{variation}%</span></div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    );
};

// --- 4. APP PRINCIPAL ---

export default function DolarHubApp() {
    const [view, setView] = useState('market');
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState({ plan: 'free' });
    const [modals, setModals] = useState({ login: false, payment: false, profile: false });
    const [liveRates, setLiveRates] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('https://dolarapi.com/v1/dolares');
                const data = await res.json();
                setLiveRates(data);
            } catch (e) { console.error("Error API", e); }
            setLoading(false);
        };
        fetchData();
        const interval = setInterval(fetchData, 60000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => {
            if (u) {
                setUser(u);
                const ref = doc(db, 'users', u.uid);
                onSnapshot(ref, (s) => s.exists() ? setUserData(s.data()) : setDoc(ref, { email: u.email, plan: 'free' }));
            } else { setUser(null); setUserData({ plan: 'free' }); }
        });
        return () => unsub();
    }, []);

    return (
        <div className="min-h-screen bg-[#0F172A] font-sans text-white pb-12 flex flex-col selection:bg-blue-500/30">
            <AuthModal isOpen={modals.login} onClose={() => setModals({ ...modals, login: false })} />
            <PaymentModal isOpen={modals.payment} onClose={() => setModals({ ...modals, payment: false })} />
            <UserProfileModal isOpen={modals.profile} onClose={() => setModals({ ...modals, profile: false })} user={user} userData={userData} />

            <nav className="border-b border-slate-800 bg-[#0F172A]/90 backdrop-blur sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('market')}>
                            <div className="bg-blue-600 p-1.5 rounded"><TrendingUp size={20} className="text-white" /></div>
                            <span className="font-bold text-xl tracking-tight">DolarHub</span>
                        </div>
                        <div className="hidden md:flex gap-1 bg-slate-800/50 p-1 rounded-lg border border-slate-700">
                            {['market', 'tools', 'academy', 'pricing'].map(v => (
                                <button key={v} onClick={() => setView(v)} className={`px-4 py-1.5 text-xs font-bold rounded-md capitalize transition-all ${view === v ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}>{v === 'pricing' ? 'Planes' : v === 'tools' ? 'Herramientas' : v === 'academy' ? 'Academia' : 'Mercado'}</button>
                            ))}
                        </div>
                    </div>
                    <div className="flex gap-3">
                        {userData?.plan !== 'premium' && (
                            <button onClick={() => setModals({ ...modals, payment: true })} className="hidden sm:flex text-xs font-bold px-3 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-black rounded items-center gap-1 hover:shadow-lg hover:shadow-orange-500/20 transition-all"><Crown size={14} /> PREMIUM</button>
                        )}
                        {user ? (
                            <div className="flex items-center gap-3">
                                <button onClick={() => setModals({ ...modals, profile: true })} className="w-8 h-8 bg-blue-900 rounded-full flex items-center justify-center font-bold text-xs border border-blue-500 hover:border-white transition-colors">{user.email[0].toUpperCase()}</button>
                            </div>
                        ) : (
                            <button onClick={() => setModals({ ...modals, login: true })} className="text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-700 transition-colors flex items-center gap-2"><UserCircle size={16} /> Entrar</button>
                        )}
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 pt-8 flex-1">
                {view === 'market' && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in">
                        <div className="lg:col-span-8">
                            {loading ? <p className="text-center text-slate-500">Cargando mercado...</p> : <MarketColumn liveRates={liveRates} />}
                        </div>
                        <div className="lg:col-span-4 space-y-6">
                            <TelegramWidget user={user} userData={userData} onLogin={() => setModals({ ...modals, login: true })} onUpgrade={() => setModals({ ...modals, payment: true })} />
                            <div onClick={() => setView('tools')} className="bg-gradient-to-r from-orange-900/20 to-slate-800 border border-orange-500/20 p-5 rounded-xl cursor-pointer hover:border-orange-500/50 transition-colors group"><div className="flex justify-between items-start mb-2"><div className="bg-orange-500/20 p-2 rounded-lg text-orange-400"><Home size={20} /></div><ChevronRight className="text-slate-600 group-hover:text-white" /></div><h3 className="font-bold text-white">Calculadora Alquileres</h3><p className="text-xs text-slate-400 mt-1">¿Cuánto aumenta tu contrato? Calculalo ahora.</p></div>
                        </div>
                    </div>
                )}

                {view === 'tools' && <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in"><RentalCalculator /><div className="bg-slate-800 p-8 rounded-xl border border-slate-700 flex flex-col items-center justify-center text-center opacity-60"><Calculator size={48} className="text-slate-600 mb-4" /><h3 className="text-white font-bold mb-2">Más herramientas pronto</h3><p className="text-sm text-slate-500">Próximamente: Ganancias y Aguinaldo.</p></div></div>}

                {view === 'academy' && <AcademyViewer />}

                {view === 'pricing' && <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-8"><PricingTable onSubscribe={() => setModals({ ...modals, payment: true })} /></div>}
            </main>

            <footer className="border-t border-slate-800 mt-12 py-8 bg-[#0B1120] text-center text-xs text-slate-500">
                <p>© 2025 DolarHub Inc. Cotizaciones con 15 min de delay.</p>
            </footer>
        </div>
    );
}