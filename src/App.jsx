import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, doc, setDoc, onSnapshot, query, where, deleteDoc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { TrendingUp, Calculator, Search, Send, Lock, Shield, CheckCircle, AlertTriangle, Plus, X, CreditCard, Copy, LogOut, FileText, Mail, Key, UserCircle, Crown, BookOpen, Percent, HelpCircle, BarChart3, ChevronRight, User, Trash2, ArrowLeft, Lightbulb, Check } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, XAxis, Tooltip, CartesianGrid } from 'recharts';

// --- 1. CONFIGURACIÓN FIREBASE (TUS DATOS REALES) ---
const firebaseConfig = {
    apiKey: "AIzaSyAklVMPIfx51CBy9YRNcwdm5kj1fxtoWtw",
    authDomain: "dolarhub.firebaseapp.com",
    projectId: "dolarhub",
    storageBucket: "dolarhub.firebasestorage.app",
    messagingSenderId: "485763287482",
    appId: "1:485763287482:web:650bb451766fa568073583",
    measurementId: "G-H68JM26166"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- 2. BASE DE DATOS DE MERCADO (CEDEARS & ACCIONES) ---
const MASTER_DB = [
    // TECH
    { s: 'AAPL', n: 'Apple Inc.', us_p: 235.50, type: 'CEDEAR', ratio: 10 },
    { s: 'MSFT', n: 'Microsoft Corp', us_p: 420.00, type: 'CEDEAR', ratio: 30 },
    { s: 'GOOGL', n: 'Alphabet Inc.', us_p: 175.20, type: 'CEDEAR', ratio: 58 },
    { s: 'AMZN', n: 'Amazon.com', us_p: 185.00, type: 'CEDEAR', ratio: 144 },
    { s: 'NVDA', n: 'NVIDIA Corp', us_p: 135.50, type: 'CEDEAR', ratio: 24 },
    { s: 'TSLA', n: 'Tesla Inc.', us_p: 350.00, type: 'CEDEAR', ratio: 15 },
    { s: 'META', n: 'Meta Platforms', us_p: 580.00, type: 'CEDEAR', ratio: 24 },
    { s: 'AMD', n: 'Adv. Micro Devices', us_p: 160.00, type: 'CEDEAR', ratio: 10 },
    { s: 'NFLX', n: 'Netflix Inc.', us_p: 650.00, type: 'CEDEAR', ratio: 16 },
    { s: 'INTC', n: 'Intel Corp', us_p: 24.50, type: 'CEDEAR', ratio: 5 },
    // REGIONAL
    { s: 'MELI', n: 'MercadoLibre', us_p: 2100.00, type: 'CEDEAR', ratio: 120 },
    { s: 'BABA', n: 'Alibaba Group', us_p: 85.00, type: 'CEDEAR', ratio: 9 },
    { s: 'PBR', n: 'Petrobras', us_p: 14.50, type: 'CEDEAR', ratio: 1 },
    { s: 'VALE', n: 'Vale S.A.', us_p: 11.20, type: 'CEDEAR', ratio: 2 },
    { s: 'GLOB', n: 'Globant', us_p: 180.00, type: 'CEDEAR', ratio: 18 },
    // ETFs
    { s: 'SPY', n: 'SPDR S&P 500', us_p: 580.00, type: 'CEDEAR', ratio: 20 },
    { s: 'QQQ', n: 'Invesco NASDAQ', us_p: 490.00, type: 'CEDEAR', ratio: 20 },
    { s: 'DIA', n: 'Dow Jones', us_p: 420.00, type: 'CEDEAR', ratio: 20 },
    { s: 'EEM', n: 'MSCI Emerging', us_p: 42.50, type: 'CEDEAR', ratio: 5 },
    { s: 'XLE', n: 'Energy Select', us_p: 92.00, type: 'CEDEAR', ratio: 2 },
    { s: 'XLF', n: 'Financial Select', us_p: 42.00, type: 'CEDEAR', ratio: 2 },
    // CONSUMO
    { s: 'KO', n: 'Coca-Cola', us_p: 68.00, type: 'CEDEAR', ratio: 5 },
    { s: 'PEP', n: 'PepsiCo Inc.', us_p: 172.00, type: 'CEDEAR', ratio: 6 },
    { s: 'MCD', n: 'McDonalds', us_p: 300.00, type: 'CEDEAR', ratio: 8 },
    { s: 'WMT', n: 'Walmart', us_p: 82.00, type: 'CEDEAR', ratio: 6 },
    { s: 'DIS', n: 'Walt Disney', us_p: 95.00, type: 'CEDEAR', ratio: 4 },
    // FINANCIERO
    { s: 'JPM', n: 'JPMorgan Chase', us_p: 195.00, type: 'CEDEAR', ratio: 5 },
    { s: 'V', n: 'Visa Inc.', us_p: 275.00, type: 'CEDEAR', ratio: 18 },
    { s: 'MA', n: 'Mastercard', us_p: 450.00, type: 'CEDEAR', ratio: 33 },
    // LOCALES & BONOS
    { s: 'GGAL', n: 'Grupo Galicia', p_ars: 5600, type: 'ACCION', ratio: 1 },
    { s: 'YPFD', n: 'YPF S.A.', p_ars: 24500, type: 'ACCION', ratio: 1 },
    { s: 'AL30', n: 'Bono 2030', p_ars: 68500, type: 'BONO', ratio: 1 },
    { s: 'GD30', n: 'Global 2030', p_ars: 71200, type: 'BONO', ratio: 1 },
];

const ACADEMY_ARTICLES = [
    { id: 1, title: 'Guía de CEDEARs', cat: 'Básico', readTime: '3 min', content: '...' },
    { id: 2, title: 'Entendiendo el MEP', cat: 'Intermedio', readTime: '4 min', content: '...' },
];

const BANK_INFO = { alias: "DOLAR.HUB.PRO", cbu: "0000003100000000000000", bank: "Mercado Pago", name: "DolarHub Inc.", price: 5000 };

// --- 3. COMPONENTES UI ---

const CedearConversionCalculator = () => {
    const [selectedTicker, setSelectedTicker] = useState('AAPL');
    const [ownedCedears, setOwnedCedears] = useState(1);

    // Filtrar solo CEDEARs
    const cedears = useMemo(() => MASTER_DB.filter(x => x.type === 'CEDEAR'), []);
    const selectedAsset = cedears.find(x => x.s === selectedTicker) || cedears[0];

    // Cálculos
    const ratio = selectedAsset.ratio;
    const underlyingShares = (ownedCedears / ratio).toFixed(2);
    const remainder = ownedCedears % ratio;
    const missingForNext = remainder === 0 ? 0 : ratio - remainder;
    const nextFullShare = Math.floor(ownedCedears / ratio) + 1;

    return (
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg h-full flex flex-col">
            <div className="flex items-center gap-3 mb-6">
                <div className="bg-blue-600/20 p-2 rounded-lg text-blue-400"><Calculator size={24} /></div>
                <div>
                    <h3 className="font-bold text-white">Calculadora de Conversión</h3>
                    <p className="text-xs text-slate-400">CEDEARs a Acciones Reales (USA)</p>
                </div>
            </div>

            <div className="space-y-6 flex-1">

                {/* Selector de Activo */}
                <div>
                    <label className="text-[10px] text-slate-400 uppercase font-bold mb-2 block">Empresa / Ticker</label>
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-3 text-slate-500" />
                        <select
                            className="w-full bg-slate-900 border border-slate-600 rounded-xl pl-10 pr-4 py-3 text-white text-sm outline-none focus:border-blue-500 appearance-none"
                            value={selectedTicker}
                            onChange={(e) => setSelectedTicker(e.target.value)}
                        >
                            {cedears.map(c => (
                                <option key={c.s} value={c.s}>{c.s} - {c.n}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Input Cantidad */}
                <div>
                    <label className="text-[10px] text-slate-400 uppercase font-bold mb-2 block">CEDEARs en Cartera</label>
                    <input
                        type="number"
                        min="0"
                        className="w-full bg-slate-900 border border-slate-600 rounded-xl p-3 text-white text-lg font-mono outline-none focus:border-blue-500"
                        value={ownedCedears}
                        onChange={(e) => setOwnedCedears(Math.max(0, parseInt(e.target.value) || 0))}
                    />
                </div>

                {/* Resultado Conversión */}
                <div className="bg-slate-900/50 rounded-xl p-5 border border-slate-700/50 space-y-4">

                    <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-300">Ratio de Conversión</span>
                        <span className="text-xs font-mono bg-slate-800 px-2 py-1 rounded text-blue-400 border border-slate-700">
                            {ratio}:1
                        </span>
                    </div>

                    <div className="text-center py-2 border-t border-b border-slate-700/50">
                        <p className="text-xs text-slate-500 uppercase font-bold mb-1">Equivale a</p>
                        <p className="text-4xl font-bold text-white tracking-tight">{underlyingShares}</p>
                        <p className="text-xs text-slate-400 mt-1">Acciones en Wall Street</p>
                    </div>

                    {/* Feedback de Compra */}
                    {missingForNext > 0 ? (
                        <div className="flex items-start gap-3 bg-yellow-500/10 p-3 rounded-lg border border-yellow-500/20">
                            <Lightbulb size={18} className="text-yellow-500 shrink-0 mt-0.5" />
                            <div className="text-xs text-slate-300">
                                Te faltan comprar <strong className="text-white">{missingForNext} CEDEARs</strong> más para completar tu acción número <strong className="text-white">{nextFullShare}</strong>.
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 bg-green-500/10 p-3 rounded-lg border border-green-500/20 justify-center">
                            <CheckCircle size={18} className="text-green-500" />
                            <span className="text-xs font-bold text-green-400">¡Tienes acciones completas!</span>
                        </div>
                    )}

                </div>

            </div>
        </div>
    );
};

const EnhancedPricingTable = ({ onSubscribe }) => {
    return (
        <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-white mb-2">Planes Transparentes</h2>
                <p className="text-slate-400">Elige las herramientas que necesitas para operar mejor.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Plan Free */}
                <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8 flex flex-col relative overflow-hidden">
                    <div className="mb-6">
                        <h3 className="text-xl font-bold text-white">Plan Inicial</h3>
                        <p className="text-slate-400 text-sm mt-1">Para quienes recién empiezan.</p>
                    </div>
                    <div className="mb-6">
                        <span className="text-4xl font-bold text-white">$0</span>
                        <span className="text-slate-500 text-sm"> /mes</span>
                    </div>
                    <ul className="space-y-4 mb-8 flex-1">
                        <li className="flex items-center gap-3 text-sm text-slate-300">
                            <CheckCircle size={16} className="text-slate-500" /> Cotizaciones en vivo
                        </li>
                        <li className="flex items-center gap-3 text-sm text-slate-300">
                            <CheckCircle size={16} className="text-slate-500" /> Calculadora de CEDEARs
                        </li>
                        <li className="flex items-center gap-3 text-sm text-slate-300">
                            <CheckCircle size={16} className="text-slate-500" /> Alertas Limitadas (2 máx)
                        </li>
                        <li className="flex items-center gap-3 text-sm text-slate-500 line-through decoration-slate-600">
                            <X size={16} /> Gráficos Históricos (5 años)
                        </li>
                        <li className="flex items-center gap-3 text-sm text-slate-500 line-through decoration-slate-600">
                            <X size={16} /> Soporte Prioritario
                        </li>
                    </ul>
                    <button className="w-full py-3 rounded-xl border border-slate-600 text-white font-bold hover:bg-slate-700 transition-colors">
                        Tu Plan Actual
                    </button>
                </div>

                {/* Plan Premium */}
                <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl border border-yellow-500/50 p-8 flex flex-col relative shadow-2xl shadow-yellow-900/10 transform md:-translate-y-4">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 to-orange-500"></div>
                    <div className="absolute top-4 right-4">
                        <span className="bg-yellow-500 text-black text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">Recomendado</span>
                    </div>

                    <div className="mb-6">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <Crown size={20} className="text-yellow-400" /> Trader Pro
                        </h3>
                        <p className="text-slate-400 text-sm mt-1">Herramientas de nivel profesional.</p>
                    </div>
                    <div className="mb-6">
                        <span className="text-4xl font-bold text-white">$5.000</span>
                        <span className="text-slate-500 text-sm"> /mes</span>
                    </div>
                    <ul className="space-y-4 mb-8 flex-1">
                        <li className="flex items-center gap-3 text-sm text-white">
                            <CheckCircle size={16} className="text-yellow-500" /> <strong>Todo lo del plan Free</strong>
                        </li>
                        <li className="flex items-center gap-3 text-sm text-white">
                            <CheckCircle size={16} className="text-yellow-500" /> Alertas Ilimitadas Telegram
                        </li>
                        <li className="flex items-center gap-3 text-sm text-white">
                            <CheckCircle size={16} className="text-yellow-500" /> Gráficos Históricos Full
                        </li>
                        <li className="flex items-center gap-3 text-sm text-white">
                            <CheckCircle size={16} className="text-yellow-500" /> Sin Publicidad
                        </li>
                        <li className="flex items-center gap-3 text-sm text-white">
                            <CheckCircle size={16} className="text-yellow-500" /> Soporte Directo WhatsApp
                        </li>
                    </ul>
                    <button onClick={onSubscribe} className="w-full py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold hover:shadow-lg hover:shadow-orange-500/20 transition-all">
                        Mejorar Ahora
                    </button>
                </div>
            </div>
        </div>
    );
};

// ... [Resto de componentes: UserProfileModal, AuthModal, PaymentModal, TelegramWidget, MarketColumn, AcademyViewer se mantienen] ...
// Incluyo versiones compactas para que el código sea funcional al copiar.
const UserProfileModal = ({ isOpen, onClose, user, userData }) => { if (!isOpen) return null; return (<div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"><div className="bg-slate-900 w-full max-w-md rounded-2xl border border-slate-700 p-6 relative"><button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X size={20} /></button><div className="flex items-center gap-3 mb-6 border-b border-slate-800 pb-4"><div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl">{user.email ? user.email[0].toUpperCase() : 'U'}</div><div><h2 className="text-lg font-bold text-white">Mi Perfil</h2><p className="text-xs text-slate-400">{user.email}</p></div></div><div className="space-y-4 mb-6"><div className="bg-slate-800 p-3 rounded-lg flex justify-between items-center"><span className="text-sm text-slate-400">Plan</span><span className={`text-xs font-bold px-2 py-1 rounded ${userData?.plan === 'premium' ? 'bg-yellow-500 text-black' : 'bg-slate-600 text-white'}`}>{userData?.plan?.toUpperCase() || 'FREE'}</span></div></div><button onClick={() => { signOut(auth); onClose(); }} className="w-full border border-red-500/30 text-red-400 hover:bg-red-500/10 font-bold py-2 rounded-lg">Cerrar Sesión</button></div></div>); };
const AuthModal = ({ isOpen, onClose }) => { const [isRegister, setIsRegister] = useState(false); const [email, setEmail] = useState(''); const [pass, setPass] = useState(''); const [error, setError] = useState(''); if (!isOpen) return null; const handleAuth = async (e) => { e.preventDefault(); try { if (isRegister) { const u = await createUserWithEmailAndPassword(auth, email, pass); await setDoc(doc(db, 'users', u.user.uid), { email, plan: 'free', createdAt: new Date().toISOString() }); } else await signInWithEmailAndPassword(auth, email, pass); onClose(); } catch (e) { setError(e.message); } }; return (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"><div className="bg-slate-900 w-full max-w-sm rounded-2xl border border-slate-700 p-8 relative shadow-2xl"><button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X size={20} /></button><h2 className="text-2xl font-bold text-white mb-2 text-center">{isRegister ? 'Registro' : 'Ingresar'}</h2><form onSubmit={handleAuth} className="space-y-4"><input className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white" placeholder="Email" onChange={e => setEmail(e.target.value)} /><input className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white" type="password" placeholder="Contraseña" onChange={e => setPass(e.target.value)} /><button className="w-full bg-blue-600 text-white font-bold py-2 rounded">{isRegister ? 'Crear' : 'Entrar'}</button></form><p className="text-xs text-slate-500 text-center mt-4 cursor-pointer" onClick={() => setIsRegister(!isRegister)}>{isRegister ? 'Ya tengo cuenta' : 'Crear cuenta'}</p></div></div>); };
const PaymentModal = ({ isOpen, onClose }) => { if (!isOpen) return null; return (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"><div className="bg-slate-900 w-full max-w-md rounded-2xl border border-slate-700 p-6 relative text-center"><button onClick={onClose} className="absolute top-4 right-4 text-slate-400"><X size={20} /></button><Crown size={48} className="text-yellow-400 mx-auto mb-4" /><h2 className="text-xl font-bold text-white">Hazte Premium</h2><p className="text-slate-400 text-sm mb-6">Transfiere <strong>${BANK_INFO.price}</strong> al alias:</p><div className="bg-slate-800 p-4 rounded-xl border border-slate-600 mb-6 cursor-pointer" onClick={() => { navigator.clipboard.writeText(BANK_INFO.alias); alert('Copiado') }}><p className="font-mono text-xl font-bold text-white">{BANK_INFO.alias}</p></div><button onClick={() => { alert('Aviso enviado'); onClose() }} className="w-full bg-green-600 text-white font-bold py-3 rounded-xl">Ya transferí</button></div></div>); };
const AcademyViewer = ({ onBack }) => { const [selectedArticle, setSelectedArticle] = useState(null); if (selectedArticle) { return (<div className="animate-in fade-in slide-in-from-right-4"><button onClick={() => setSelectedArticle(null)} className="flex items-center gap-2 text-slate-400 hover:text-white mb-6"><ArrowLeft size={18} /> Volver</button><div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 max-w-3xl mx-auto shadow-2xl"><div className="flex items-center gap-3 mb-6"><span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 uppercase tracking-wider">{selectedArticle.cat}</span><span className="text-xs text-slate-500 flex items-center gap-1"><Lightbulb size={12} /> {selectedArticle.readTime} lectura</span></div><h1 className="text-3xl font-bold text-white mb-6">{selectedArticle.title}</h1><div className="prose prose-invert prose-slate max-w-none text-slate-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: selectedArticle.content }}></div></div></div>); } return (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in">{ACADEMY_ARTICLES.map(art => (<div key={art.id} onClick={() => setSelectedArticle(art)} className="bg-slate-800 border border-slate-700 p-6 rounded-xl hover:border-blue-500/50 hover:shadow-lg transition-all cursor-pointer group flex flex-col h-full"><div className="flex justify-between items-start mb-4"><div className="bg-slate-700/50 p-2 rounded-lg group-hover:bg-blue-600 transition-colors"><BookOpen size={20} className="text-slate-400 group-hover:text-white" /></div><span className="text-[10px] text-slate-500 font-bold uppercase">{art.cat}</span></div><h3 className="text-lg font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">{art.title}</h3><div className="mt-auto pt-4 flex justify-between items-center border-t border-slate-700/50"><span className="text-xs text-slate-500">{art.readTime}</span><ChevronRight size={16} className="text-slate-600 group-hover:text-white" /></div></div>))}</div>); };
const TelegramWidget = ({ user, userData, onLogin, onUpgrade }) => { const [alerts, setAlerts] = useState([]); const [isAdding, setIsAdding] = useState(false); const [newAlert, setNewAlert] = useState({ asset: 'Blue', cond: '>', price: '' }); useEffect(() => { if (user) { const q = query(collection(db, 'alerts'), where('userId', '==', user.uid)); const unsub = onSnapshot(q, (snap) => setAlerts(snap.docs.map(d => ({ id: d.id, ...d.data() })))); return () => unsub(); } else setAlerts([]); }, [user]); const addAlert = async () => { if (!newAlert.price) return; await addDoc(collection(db, 'alerts'), { userId: user.uid, asset: newAlert.asset, condition: newAlert.cond, targetPrice: parseFloat(newAlert.price), active: true, telegramChatId: "1790304803" }); setIsAdding(false); setNewAlert({ asset: 'Blue', cond: '>', price: '' }); }; const deleteAlert = async (id) => await deleteDoc(doc(db, 'alerts', id)); if (!user) return (<div className="bg-slate-800 border border-slate-700 rounded-xl p-6 text-center"><Send className="text-blue-400 mx-auto mb-3" /><h3 className="font-bold text-white mb-2">Alertas</h3><button onClick={onLogin} className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2 px-6 rounded-full">Iniciar Sesión</button></div>); const isPremium = userData?.plan === 'premium'; const canAdd = alerts.length < (isPremium ? 99 : 2); return (<div className="bg-gradient-to-br from-[#229ED9]/10 to-slate-800 border border-[#229ED9]/30 rounded-xl p-5 relative overflow-hidden"> <div className="flex items-center justify-between mb-4 relative z-10"><div className="flex items-center gap-2"><Send size={18} className="text-[#229ED9]" /><h3 className="font-bold text-white text-sm">Mis Alertas</h3></div><span className="text-[10px] bg-slate-900 px-2 py-1 rounded text-slate-400">{alerts.length}/{isPremium ? '∞' : '2'}</span></div> <div className="space-y-2 mb-4 max-h-40 overflow-y-auto custom-scrollbar relative z-10">{alerts.map(a => (<div key={a.id} className="bg-slate-900/80 p-2 rounded flex justify-between items-center text-xs border border-slate-700"><span className="text-white font-bold">{a.asset} {a.condition} ${a.targetPrice}</span><button onClick={() => deleteAlert(a.id)} className="text-slate-500 hover:text-red-400"><Trash2 size={12} /></button></div>))} {alerts.length === 0 && !isAdding && <p className="text-xs text-slate-500 text-center">No tienes alertas activas.</p>}</div> {isAdding ? (<div className="bg-slate-900 p-2 rounded border border-slate-600 animate-in fade-in"><div className="flex gap-1 mb-2"><select className="bg-slate-800 text-xs text-white rounded p-1 w-full" value={newAlert.asset} onChange={e => setNewAlert({ ...newAlert, asset: e.target.value })}><option value="Blue">Dólar Blue</option><option value="MEP">Dólar MEP</option><option value="AAPL">Apple</option><option value="MELI">MeLi</option></select><select className="bg-slate-800 text-xs text-white rounded p-1" value={newAlert.cond} onChange={e => setNewAlert({ ...newAlert, cond: e.target.value })}><option value=">">&gt;</option><option value="<">&lt;</option></select></div><input type="number" placeholder="$" className="w-full bg-slate-800 text-xs text-white rounded p-1 mb-2" value={newAlert.price} onChange={e => setNewAlert({ ...newAlert, price: e.target.value })} /><div className="flex gap-2"><button onClick={addAlert} className="flex-1 bg-green-600 text-[10px] text-white py-1 rounded">Guardar</button><button onClick={() => setIsAdding(false)} className="flex-1 bg-slate-700 text-[10px] text-white py-1 rounded">Cancelar</button></div></div>) : (canAdd ? <button onClick={() => setIsAdding(true)} className="w-full bg-[#229ED9] hover:bg-[#1e8ub9] text-white text-xs font-bold py-2 rounded-lg flex justify-center items-center gap-1"><Plus size={14} /> Nueva</button> : <button onClick={onUpgrade} className="w-full bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-2"><Lock size={12} className="text-yellow-500" /> Desbloquear</button>)} </div>); };
const MarketColumn = ({ liveRates }) => { const [filter, setFilter] = useState(''); const [yahooPrices, setYahooPrices] = useState({}); useEffect(() => { const unsub = onSnapshot(doc(db, "market_data", "live_prices"), (doc) => { if (doc.exists()) setYahooPrices(doc.data()); }); return () => unsub(); }, []); const cclRate = useMemo(() => { const ccl = liveRates.find(r => r.casa === 'contadoconliqui'); return ccl ? parseFloat(ccl.venta) : 1150; }, [liveRates]); const filtered = MASTER_DB.filter(a => a.s.toLowerCase().includes(filter.toLowerCase()) || a.n.toLowerCase().includes(filter.toLowerCase())); return (<div className="space-y-6"> <div className="grid grid-cols-2 sm:grid-cols-4 gap-3"> {['Blue', 'Bolsa', 'Contadoconliqui', 'Oficial'].map(type => { const r = liveRates.find(x => x.casa === type.toLowerCase()); return (<div key={type} className="bg-slate-800 p-3 rounded-lg border border-slate-700 hover:border-blue-500/50"><p className="text-[10px] text-slate-400 uppercase font-bold">Dólar {type === 'bolsa' ? 'MEP' : type === 'contadoconliqui' ? 'CCL' : type}</p><div className="flex items-baseline gap-1 mt-1"><span className="text-xl font-bold text-white">${r ? r.venta : '...'}</span></div></div>) })} </div> <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden flex flex-col h-[500px]"> <div className="p-4 border-b border-slate-700 bg-slate-800"><div className="relative"><Search size={14} className="absolute left-3 top-2.5 text-slate-500" /><input className="w-full bg-slate-900 border border-slate-600 rounded-lg pl-9 pr-4 py-1.5 text-xs text-white" placeholder="Buscar activo..." onChange={e => setFilter(e.target.value)} /></div></div> <div className="overflow-y-auto flex-1 custom-scrollbar"> {filtered.map(a => { const live = yahooPrices[a.s]; let price = 0; if (a.type === 'CEDEAR') price = (live || a.us_p) * cclRate / a.ratio; else price = a.p_ars || 0; return (<div key={a.s} className="flex justify-between items-center p-3 border-b border-slate-800 hover:bg-slate-700/50"><div><p className="text-white font-bold text-xs">{a.s}</p><p className="text-[9px] text-slate-500">{a.n}</p></div><div className="text-right"><p className="text-white font-mono text-xs">${price.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>{a.type === 'CEDEAR' && <p className="text-[8px] text-slate-600">u$s {live || a.us_p}</p>}</div></div>) })} </div> </div> </div>); };

// --- 4. APP PRINCIPAL ---

export default function DolarHubApp() {
    const [view, setView] = useState('market');
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState({ plan: 'free' });
    const [modals, setModals] = useState({ login: false, payment: false, profile: false });
    const [liveRates, setLiveRates] = useState([]);

    useEffect(() => {
        fetch('https://dolarapi.com/v1/dolares').then(r => r.json()).then(setLiveRates).catch(console.error);
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
                        {userData?.plan !== 'premium' && <button onClick={() => setModals({ ...modals, payment: true })} className="hidden sm:flex text-xs font-bold px-3 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-black rounded items-center gap-1 hover:shadow-lg hover:shadow-orange-500/20 transition-all"><Crown size={14} /> PREMIUM</button>}
                        {user ? <button onClick={() => setModals({ ...modals, profile: true })} className="w-8 h-8 bg-blue-900 rounded-full flex items-center justify-center font-bold text-xs border border-blue-500 hover:border-white transition-colors">{user.email[0].toUpperCase()}</button> : <button onClick={() => setModals({ ...modals, login: true })} className="text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-700 transition-colors flex items-center gap-2"><UserCircle size={16} /> Entrar</button>}
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 pt-8 flex-1">
                {view === 'market' && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in">
                        <div className="lg:col-span-8"><MarketColumn liveRates={liveRates} /></div>
                        <div className="lg:col-span-4 space-y-6">
                            <TelegramWidget user={user} userData={userData} onLogin={() => setModals({ ...modals, login: true })} onUpgrade={() => setModals({ ...modals, payment: true })} />
                            <div onClick={() => setView('tools')} className="bg-gradient-to-r from-orange-900/20 to-slate-800 border border-orange-500/20 p-5 rounded-xl cursor-pointer hover:border-orange-500/50 transition-colors group"><div className="flex justify-between items-start mb-2"><div className="bg-orange-500/20 p-2 rounded-lg text-orange-400"><Home size={20} /></div><ChevronRight className="text-slate-600 group-hover:text-white" /></div><h3 className="font-bold text-white">Calculadora Conversión</h3><p className="text-xs text-slate-400 mt-1">Transforma CEDEARs en Acciones USA.</p></div>
                        </div>
                    </div>
                )}
                {view === 'tools' && <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in"><CedearConversionCalculator /><EnhancedPricingTable onSubscribe={() => setModals({ ...modals, payment: true })} /></div>}
                {view === 'academy' && <AcademyViewer />}
                {view === 'pricing' && <EnhancedPricingTable onSubscribe={() => setModals({ ...modals, payment: true })} />}
            </main>

            <footer className="border-t border-slate-800 mt-12 py-8 bg-[#0B1120] text-center text-xs text-slate-500"><p>© 2025 DolarHub Inc. Cotizaciones con 15 min de delay.</p></footer>
        </div>
    );
}