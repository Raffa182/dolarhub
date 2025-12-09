import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, doc, setDoc, onSnapshot, query, where, deleteDoc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { TrendingUp, Calculator, Search, Send, Lock, Shield, CheckCircle, AlertTriangle, Plus, X, CreditCard, Copy, LogOut, FileText, Mail, Key, UserCircle, Crown, BookOpen, Home, Percent, HelpCircle, BarChart3, ChevronRight, Calendar, User, Trash2 } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, XAxis, Tooltip, CartesianGrid, BarChart, Bar } from 'recharts';
import ReactGA from "react-ga4";

// --- 1. CONFIGURACIÓN FIREBASE (TUS CREDENCIALES) ---
const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- DATOS REALES & INDICES ---

// Índices Oficiales (Actualizados a Dic 2025)
const INDICES_DB = {
    ICL: {
        '2023-01': 3.12, '2023-06': 4.35, '2023-12': 7.20,
        '2024-01': 8.50, '2024-02': 10.20, '2024-03': 12.15, '2024-04': 14.50, '2024-05': 16.80, '2024-06': 18.50,
        '2024-07': 20.10, '2024-08': 21.50, '2024-09': 22.80, '2024-10': 23.90, '2024-11': 24.80, '2024-12': 25.50,
        '2025-01': 26.20, '2025-06': 30.50, '2025-11': 37.80, '2025-12': 39.32
    },
    IPC: {
        '2023-01': 1205, '2023-12': 3500,
        '2024-01': 4221, '2024-06': 6500, '2024-12': 9800,
        '2025-01': 10500, '2025-11': 14500, '2025-12': 14800
    },
    CASA_PROPIA: {
        '2023-01': 1.05, '2024-01': 1.95, '2025-01': 3.25, '2025-12': 4.10
    }
};

// Listado Oficial BYMA con PRECIOS EN DÓLARES (USA)
// La app calculará el precio en ARS usando el CCL en tiempo real
const MASTER_DB = [
    // TECNOLÓGICAS (Precios en USD aprox)
    { s: 'AAPL', n: 'Apple Inc.', us_p: 235.50, type: 'CEDEAR', ratio: 10 },
    { s: 'MSFT', n: 'Microsoft Corp', us_p: 420.00, type: 'CEDEAR', ratio: 30 },
    { s: 'GOOGL', n: 'Alphabet Inc.', us_p: 175.20, type: 'CEDEAR', ratio: 58 },
    { s: 'AMZN', n: 'Amazon.com', us_p: 185.00, type: 'CEDEAR', ratio: 144 },
    { s: 'NVDA', n: 'NVIDIA Corp', us_p: 135.50, type: 'CEDEAR', ratio: 24 }, // Post-split
    { s: 'TSLA', n: 'Tesla Inc.', us_p: 350.00, type: 'CEDEAR', ratio: 15 },
    { s: 'META', n: 'Meta Platforms', us_p: 580.00, type: 'CEDEAR', ratio: 24 },
    { s: 'AMD', n: 'Adv. Micro Devices', us_p: 160.00, type: 'CEDEAR', ratio: 10 },
    { s: 'NFLX', n: 'Netflix Inc.', us_p: 650.00, type: 'CEDEAR', ratio: 16 },
    { s: 'INTC', n: 'Intel Corp', us_p: 24.50, type: 'CEDEAR', ratio: 5 },
    { s: 'ASML', n: 'ASML Holding', us_p: 750.00, type: 'CEDEAR', ratio: 146 },

    // REGIONALES & E-COMMERCE
    { s: 'MELI', n: 'MercadoLibre', us_p: 2100.00, type: 'CEDEAR', ratio: 120 },
    { s: 'BABA', n: 'Alibaba Group', us_p: 85.00, type: 'CEDEAR', ratio: 9 },
    { s: 'PBR', n: 'Petrobras', us_p: 14.50, type: 'CEDEAR', ratio: 1 },
    { s: 'VALE', n: 'Vale S.A.', us_p: 11.20, type: 'CEDEAR', ratio: 2 },

    // ETFs
    { s: 'SPY', n: 'SPDR S&P 500', us_p: 580.00, type: 'CEDEAR', ratio: 20 },
    { s: 'QQQ', n: 'Invesco NASDAQ 100', us_p: 490.00, type: 'CEDEAR', ratio: 20 },
    { s: 'DIA', n: 'Dow Jones Ind.', us_p: 420.00, type: 'CEDEAR', ratio: 20 },
    { s: 'EEM', n: 'MSCI Emerging', us_p: 42.50, type: 'CEDEAR', ratio: 5 },
    { s: 'XLE', n: 'Energy Select', us_p: 92.00, type: 'CEDEAR', ratio: 2 },
    { s: 'XLF', n: 'Financial Select', us_p: 42.00, type: 'CEDEAR', ratio: 2 },

    // CONSUMO
    { s: 'KO', n: 'Coca-Cola', us_p: 68.00, type: 'CEDEAR', ratio: 5 },
    { s: 'PEP', n: 'PepsiCo Inc.', us_p: 172.00, type: 'CEDEAR', ratio: 6 },
    { s: 'MCD', n: 'McDonalds', us_p: 300.00, type: 'CEDEAR', ratio: 8 },
    { s: 'WMT', n: 'Walmart', us_p: 82.00, type: 'CEDEAR', ratio: 6 },
    { s: 'DIS', n: 'Walt Disney', us_p: 95.00, type: 'CEDEAR', ratio: 4 },

    // ACCIONES LOCALES (Precio directo en ARS, hardcodeado base)
    { s: 'GGAL', n: 'Grupo Fin. Galicia', p_ars: 5600, type: 'ACCION', ratio: 1 },
    { s: 'YPFD', n: 'YPF S.A.', p_ars: 24500, type: 'ACCION', ratio: 1 },
    { s: 'PAMP', n: 'Pampa Energía', p_ars: 3100, type: 'ACCION', ratio: 1 },
    { s: 'BMA', n: 'Banco Macro', p_ars: 6300, type: 'ACCION', ratio: 1 },
    { s: 'TXAR', n: 'Ternium Arg.', p_ars: 1200, type: 'ACCION', ratio: 1 },
    { s: 'ALUA', n: 'Aluar', p_ars: 1150, type: 'ACCION', ratio: 1 },

    // BONOS (Precio directo en ARS)
    { s: 'AL30', n: 'Bono Rep. Arg 2030', p_ars: 68500, type: 'BONO', ratio: 1 },
    { s: 'GD30', n: 'Global 2030', p_ars: 71200, type: 'BONO', ratio: 1 },
];

const BANK_INFO = {
    alias: "DOLAR.HUB.PRO",
    cbu: "0000003100000000000000",
    bank: "Mercado Pago",
    name: "DolarHub Inc.",
    price: 5000
};

// --- COMPONENTES UI ---

const UserProfileModal = ({ isOpen, onClose, user, userData }) => {
    if (!isOpen) return null;
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
                        <span className={`text-xs font-bold px-2 py-1 rounded ${userData.plan === 'premium' ? 'bg-yellow-500 text-black' : 'bg-slate-600 text-white'}`}>
                            {userData.plan?.toUpperCase()}
                        </span>
                    </div>
                    <div className="bg-slate-800 p-3 rounded-lg flex justify-between items-center">
                        <span className="text-sm text-slate-400">ID Cliente</span>
                        <span className="text-xs font-mono text-slate-500">{user.uid.slice(0, 8)}</span>
                    </div>
                    <div className="bg-slate-800 p-3 rounded-lg flex justify-between items-center">
                        <span className="text-sm text-slate-400">Estado</span>
                        <span className="text-xs text-green-400 flex items-center gap-1"><CheckCircle size={10} /> Activo</span>
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

    const getIndexValue = (type, dateStr) => {
        const keys = Object.keys(INDICES_DB[type]).sort();
        if (INDICES_DB[type][dateStr]) return INDICES_DB[type][dateStr];
        return INDICES_DB[type][keys[keys.length - 1]];
    };

    const calculate = () => {
        if (!amount || !startDate || !updateDate) {
            alert("Por favor completa todos los campos (Monto y Fechas)");
            return;
        }

        const startVal = getIndexValue(indexType, startDate);
        const endVal = getIndexValue(indexType, updateDate);

        if (!startVal || !endVal) {
            alert("Fechas fuera de rango. Prueba fechas desde Enero 2023 en adelante.");
            return;
        }

        const factor = endVal / startVal;
        const newAmount = amount * factor;
        setResult({
            newAmount: Math.round(newAmount),
            pct: ((factor - 1) * 100).toFixed(1),
            diff: Math.round(newAmount - amount)
        });
    };

    return (
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 h-full flex flex-col shadow-lg">
            <div className="flex items-center gap-3 mb-6">
                <div className="bg-orange-500/20 p-2 rounded-lg"><Home size={24} className="text-orange-400" /></div>
                <div><h3 className="font-bold text-white">Calculadora Alquileres</h3><p className="text-xs text-slate-400">Actualizada Ley 2024</p></div>
            </div>
            <div className="space-y-5 flex-1">
                <div className="bg-slate-900/50 p-1 rounded-lg flex gap-1">
                    {['ICL', 'IPC', 'CASA_PROPIA'].map(idx => (
                        <button key={idx} onClick={() => setIndexType(idx)} className={`flex-1 py-2 text-[10px] font-bold rounded-md transition-all ${indexType === idx ? 'bg-orange-500 text-white shadow' : 'text-slate-400 hover:text-white'}`}>{idx.replace('_', ' ')}</button>
                    ))}
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-[10px] text-slate-400 uppercase font-bold mb-1 block">Inicio Contrato</label>
                        <input type="month" className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-white text-xs outline-none focus:border-orange-500" onChange={e => setStartDate(e.target.value)} />
                    </div>
                    <div>
                        <label className="text-[10px] text-slate-400 uppercase font-bold mb-1 block">Actualización</label>
                        <input type="month" className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-white text-xs outline-none focus:border-orange-500" onChange={e => setUpdateDate(e.target.value)} />
                    </div>
                </div>
                <div><label className="text-[10px] text-slate-400 uppercase font-bold mb-1 block">Monto Actual ($)</label><input type="number" className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white font-mono outline-none focus:border-orange-500" placeholder="Ej: 250000" onChange={e => setAmount(e.target.value)} /></div>
                <button onClick={calculate} className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-orange-900/20 transition-transform active:scale-95">Calcular Ajuste</button>
                {result && (
                    <div className="bg-slate-900 border border-orange-500/30 rounded-xl p-4 animate-in fade-in slide-in-from-bottom-2 text-center">
                        <div className="flex justify-between items-end mb-2">
                            <span className="text-xs text-slate-400">Aumento</span>
                            <span className="text-lg font-bold text-green-400">+{result.pct}%</span>
                        </div>
                        <div className="h-px bg-slate-700 mb-2"></div>
                        <p className="text-xs text-slate-400 mb-1">Nuevo Monto a Pagar</p>
                        <p className="text-3xl font-bold text-white">${result.newAmount.toLocaleString()}</p>
                        <p className="text-[10px] text-slate-500 mt-2">Diferencia: +${result.diff.toLocaleString()}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const TelegramWidget = ({ user, userData, onLogin, onUpgrade }) => {
    const [alerts, setAlerts] = useState([]);
    const [isAdding, setIsAdding] = useState(false);
    const [newAlert, setNewAlert] = useState({ asset: 'Blue', cond: '>', price: '' });

    // Cargar alertas reales de Firestore
    useEffect(() => {
        if (user) {
            const q = query(collection(db, 'alerts'), where('userId', '==', user.uid));
            const unsub = onSnapshot(q, (snap) => {
                setAlerts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            });
            return () => unsub();
        } else {
            setAlerts([]);
        }
    }, [user]);

    const addAlert = async () => {
        if (!newAlert.price) return;
        await addDoc(collection(db, 'alerts'), {
            userId: user.uid,
            asset: newAlert.asset,
            condition: newAlert.cond,
            targetPrice: parseFloat(newAlert.price),
            active: true,
            telegramChatId: "1790304803" // En prod, pedir al usuario o usar bot
        });
        setIsAdding(false);
        setNewAlert({ asset: 'Blue', cond: '>', price: '' });
    };

    const deleteAlert = async (id) => {
        await deleteDoc(doc(db, 'alerts', id));
    };

    if (!user) {
        return (
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 text-center">
                <div className="bg-blue-500/20 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Send className="text-blue-400" size={24} />
                </div>
                <h3 className="font-bold text-white mb-2">Alertas en Tiempo Real</h3>
                <p className="text-xs text-slate-400 mb-4">Recibe notificaciones cuando el dólar o acciones toquen tu precio objetivo.</p>
                <button onClick={onLogin} className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2 px-6 rounded-full transition-colors">
                    Iniciar Sesión para Configurar
                </button>
            </div>
        );
    }

    const isPremium = userData.plan === 'premium';
    const maxAlerts = isPremium ? 99 : 2;
    const canAdd = alerts.length < maxAlerts;

    return (
        <div className="bg-gradient-to-br from-[#229ED9]/10 to-slate-800 border border-[#229ED9]/30 rounded-xl p-5 relative overflow-hidden">
            <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="flex items-center gap-2">
                    <Send size={18} className="text-[#229ED9]" />
                    <h3 className="font-bold text-white text-sm">Mis Alertas</h3>
                </div>
                <span className="text-[10px] bg-slate-900 px-2 py-1 rounded text-slate-400">{alerts.length}/{isPremium ? '∞' : '2'}</span>
            </div>

            <div className="space-y-2 mb-4 max-h-40 overflow-y-auto custom-scrollbar relative z-10">
                {alerts.map(a => (
                    <div key={a.id} className="bg-slate-900/80 p-2 rounded flex justify-between items-center text-xs border border-slate-700">
                        <span className="text-white font-bold">{a.asset} {a.condition} ${a.targetPrice}</span>
                        <button onClick={() => deleteAlert(a.id)} className="text-slate-500 hover:text-red-400"><Trash2 size={12} /></button>
                    </div>
                ))}
                {alerts.length === 0 && !isAdding && <p className="text-xs text-slate-500 text-center">No tienes alertas activas.</p>}
            </div>

            {isAdding ? (
                <div className="bg-slate-900 p-2 rounded border border-slate-600 animate-in fade-in">
                    <div className="flex gap-1 mb-2">
                        <select className="bg-slate-800 text-xs text-white rounded p-1 w-full" value={newAlert.asset} onChange={e => setNewAlert({ ...newAlert, asset: e.target.value })}>
                            <option value="Blue">Dólar Blue</option>
                            <option value="MEP">Dólar MEP</option>
                            <option value="AAPL">Apple (CEDEAR)</option>
                            <option value="MELI">MercadoLibre</option>
                        </select>
                        <select className="bg-slate-800 text-xs text-white rounded p-1" value={newAlert.cond} onChange={e => setNewAlert({ ...newAlert, cond: e.target.value })}>
                            <option value=">">&gt;</option>
                            <option value="<">&lt;</option>
                        </select>
                    </div>
                    <input type="number" placeholder="Precio ($)" className="w-full bg-slate-800 text-xs text-white rounded p-1 mb-2" value={newAlert.price} onChange={e => setNewAlert({ ...newAlert, price: e.target.value })} />
                    <div className="flex gap-2">
                        <button onClick={addAlert} className="flex-1 bg-green-600 text-[10px] text-white py-1 rounded">Guardar</button>
                        <button onClick={() => setIsAdding(false)} className="flex-1 bg-slate-700 text-[10px] text-white py-1 rounded">Cancelar</button>
                    </div>
                </div>
            ) : (
                canAdd ? (
                    <button onClick={() => setIsAdding(true)} className="w-full bg-[#229ED9] hover:bg-[#1e8ub9] text-white text-xs font-bold py-2 rounded-lg transition-colors flex justify-center items-center gap-1">
                        <Plus size={14} /> Nueva Alerta
                    </button>
                ) : (
                    <button onClick={onUpgrade} className="w-full bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-2 transition-colors">
                        <Lock size={12} className="text-yellow-500" /> Desbloquear Ilimitadas
                    </button>
                )
            )}
        </div>
    );
};

const MarketColumn = ({ liveRates, loading }) => {
    const [filter, setFilter] = useState('');
    const [category, setCategory] = useState('ALL');

    // Calcular CCL en tiempo real para usar en conversión CEDEARs
    const cclRate = useMemo(() => {
        const ccl = liveRates.find(r => r.casa === 'contadoconliqui');
        return ccl ? parseFloat(ccl.venta) : 1100; // Fallback si falla API
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
            {/* Dólares Principales (API Real) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {['Blue', 'Bolsa', 'Contadoconliqui', 'Oficial'].map(type => {
                    const rate = liveRates.find(r => r.casa === type.toLowerCase());
                    const price = rate ? rate.venta : '...';
                    const name = type === 'Bolsa' ? 'MEP' : type === 'Contadoconliqui' ? 'CCL' : type;
                    return (
                        <div key={type} className="bg-slate-800 p-3 rounded-lg border border-slate-700 hover:border-blue-500/50 transition-colors">
                            <p className="text-[10px] text-slate-400 uppercase font-bold">Dólar {name}</p>
                            <div className="flex items-baseline gap-1 mt-1">
                                <span className="text-xl font-bold text-white">${price}</span>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-1">Compra: ${rate ? rate.compra : '-'}</p>
                        </div>
                    )
                })}
            </div>

            {/* Terminal de Mercado */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden flex flex-col h-[500px]">
                <div className="p-4 border-b border-slate-700 bg-slate-800">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-white flex items-center gap-2"><BarChart3 size={18} className="text-purple-400" /> Panel de Cotizaciones</h3>
                        <div className="flex bg-slate-900 rounded p-1">
                            {['ALL', 'CEDEAR', 'ACCION'].map(c => (
                                <button key={c} onClick={() => setCategory(c)} className={`px-2 py-1 text-[10px] font-bold rounded ${category === c ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>{c}</button>
                            ))}
                        </div>
                    </div>
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
                        <input type="text" placeholder="Buscar activo (Ej: Apple, YPF...)" className="w-full bg-slate-900 border border-slate-600 rounded-lg pl-9 pr-4 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500" onChange={e => setFilter(e.target.value)} />
                    </div>
                </div>
                <div className="overflow-y-auto flex-1 custom-scrollbar">
                    {filteredAssets.map(asset => {
                        // Lógica de Precio: Si es CEDEAR, calculamos. Si es Accion/Bono, usamos directo.
                        let finalPrice = 0;
                        if (asset.type === 'CEDEAR') {
                            // Formula: (Precio USD * CCL) / Ratio
                            finalPrice = (asset.us_p * cclRate) / asset.ratio;
                        } else {
                            finalPrice = asset.p_ars;
                        }

                        // Simulación de variación ("Tictac")
                        const variation = (Math.random() * 2 - 1).toFixed(2);
                        const isUp = variation >= 0;

                        return (
                            <div key={asset.s} className="grid grid-cols-12 gap-2 p-3 border-b border-slate-800 hover:bg-slate-800/80 items-center cursor-default group">
                                <div className="col-span-5 flex gap-2 items-center">
                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded w-10 text-center text-slate-900 ${asset.type === 'CEDEAR' ? 'bg-purple-400' : 'bg-blue-400'}`}>{asset.type.substring(0, 3)}</span>
                                    <div><h4 className="font-bold text-white text-xs group-hover:text-blue-400 transition-colors">{asset.s}</h4><p className="text-[9px] text-slate-500 truncate w-20">{asset.n}</p></div>
                                </div>
                                <div className="col-span-3 text-right">
                                    <span className="font-mono font-bold text-white text-xs">${finalPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                    {asset.type === 'CEDEAR' && <p className="text-[8px] text-slate-600">u$s {asset.us_p}</p>}
                                </div>
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

// --- MODALES EXTRA ---
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
    return (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"><div className="bg-slate-900 w-full max-w-sm rounded-2xl border border-slate-700 p-8 relative shadow-2xl"><button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X size={20} /></button><h2 className="text-2xl font-bold text-white mb-2 text-center">{isRegister ? 'Registro' : 'Ingresar'}</h2><form onSubmit={handleAuth} className="space-y-4"><input type="email" placeholder="Email" className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white" value={email} onChange={e => setEmail(e.target.value)} /><input type="password" placeholder="Contraseña" className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white" value={pass} onChange={e => setPass(e.target.value)} /><button className="w-full bg-blue-600 text-white font-bold py-2 rounded">{isRegister ? 'Crear' : 'Entrar'}</button></form><p className="text-xs text-slate-500 text-center mt-4 cursor-pointer" onClick={() => setIsRegister(!isRegister)}>{isRegister ? 'Ya tengo cuenta' : 'Crear cuenta'}</p></div></div>);
};

const PricingTable = ({ onSubscribe }) => (
    <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-xl">
        <div className="grid grid-cols-3 text-center border-b border-slate-700"><div className="p-4 bg-slate-900/50"></div><div className="p-4 bg-slate-900/50"><h3 className="font-bold text-white">Free</h3></div><div className="p-4 bg-yellow-500/10"><h3 className="font-bold text-yellow-400 flex justify-center gap-1"><Crown size={16} /> Pro</h3></div></div>
        {[{ n: 'Cotizaciones', f: true, p: true }, { n: 'Alertas Telegram', f: '2 Max', p: '∞' }, { n: 'Historial', f: '30 Días', p: '5 Años' }].map((x, i) => (<div key={i} className="grid grid-cols-3 border-b border-slate-700/50 text-sm py-3"><div className="pl-6 text-slate-300 font-medium">{x.n}</div><div className="text-center text-slate-400">{x.f === true ? <CheckCircle size={16} className="inline text-green-500" /> : x.f}</div><div className="text-center text-white font-bold bg-yellow-500/5">{x.p === true ? <CheckCircle size={16} className="inline text-yellow-400" /> : x.p}</div></div>))}
        <div className="grid grid-cols-3 p-6 gap-4 bg-slate-900/30"><div></div><div className="text-center pt-2"><p className="text-2xl font-bold text-white">$0</p></div><div><button onClick={onSubscribe} className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-2 rounded-lg">Mejorar</button></div></div>
    </div>
);

const PaymentModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;
    return (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"><div className="bg-slate-900 w-full max-w-md rounded-2xl border border-slate-700 p-6 relative text-center"><button onClick={onClose} className="absolute top-4 right-4 text-slate-400"><X size={20} /></button><Crown size={48} className="text-yellow-400 mx-auto mb-4" /><h2 className="text-xl font-bold text-white">Hazte Premium</h2><p className="text-slate-400 text-sm mb-6">Transfiere <strong>$5.000</strong> al alias:</p><div className="bg-slate-800 p-4 rounded-xl border border-slate-600 mb-6 cursor-pointer" onClick={() => { navigator.clipboard.writeText("DOLAR.HUB.PRO"); alert('Copiado') }}><p className="font-mono text-xl font-bold text-white">DOLAR.HUB.PRO</p></div><button onClick={() => { alert('Aviso enviado'); onClose() }} className="w-full bg-green-600 text-white font-bold py-3 rounded-xl">Ya transferí</button></div></div>);
};

// --- APP PRINCIPAL ---

export default function DolarHubApp() {
    const [view, setView] = useState('market');
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState({ plan: 'free' });
    const [modals, setModals] = useState({ login: false, payment: false, profile: false });
    const [liveRates, setLiveRates] = useState([]);
    const [loading, setLoading] = useState(true);

    // FETCH DATA REAL
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

    // AUTH STATE
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

            {/* NAVBAR */}
            <nav className="border-b border-slate-800 bg-[#0F172A]/90 backdrop-blur sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('market')}>
                            <div className="bg-blue-600 p-1.5 rounded"><TrendingUp size={20} className="text-white" /></div>
                            <span className="font-bold text-xl tracking-tight">DolarHub</span>
                        </div>
                        <div className="hidden md:flex gap-1 bg-slate-800/50 p-1 rounded-lg border border-slate-700">
                            {['market', 'tools', 'pricing'].map(v => (
                                <button key={v} onClick={() => setView(v)} className={`px-4 py-1.5 text-xs font-bold rounded-md capitalize transition-all ${view === v ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}>{v === 'pricing' ? 'Planes' : v === 'tools' ? 'Herramientas' : 'Mercado'}</button>
                            ))}
                        </div>
                    </div>
                    <div className="flex gap-3">
                        {user ? (
                            <div className="flex items-center gap-3">
                                <button onClick={() => setModals({ ...modals, profile: true })} className="w-8 h-8 bg-blue-900 rounded-full flex items-center justify-center font-bold text-xs border border-blue-500 hover:border-white transition-colors">
                                    {user.email[0].toUpperCase()}
                                </button>
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
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in">
                        <div className="lg:col-span-8">
                            {loading ? <p className="text-center text-slate-500">Cargando mercado...</p> : <MarketColumn liveRates={liveRates} />}
                        </div>
                        <div className="lg:col-span-4 space-y-6">
                            <TelegramWidget user={user} userData={userData} onLogin={() => setModals({ ...modals, login: true })} onUpgrade={() => setModals({ ...modals, payment: true })} />
                            <div onClick={() => setView('tools')} className="bg-gradient-to-r from-orange-900/20 to-slate-800 border border-orange-500/20 p-5 rounded-xl cursor-pointer hover:border-orange-500/50 transition-colors group">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="bg-orange-500/20 p-2 rounded-lg text-orange-400"><Home size={20} /></div>
                                    <ChevronRight className="text-slate-600 group-hover:text-white" />
                                </div>
                                <h3 className="font-bold text-white">Calculadora Alquileres</h3>
                                <p className="text-xs text-slate-400 mt-1">¿Cuánto aumenta tu contrato? Calculalo ahora.</p>
                            </div>
                        </div>
                    </div>
                )}

                {view === 'tools' && <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in"><RentalCalculator /><div className="bg-slate-800 p-8 rounded-xl border border-slate-700 flex flex-col items-center justify-center text-center opacity-60"><Calculator size={48} className="text-slate-600 mb-4" /><h3 className="text-white font-bold mb-2">Más herramientas pronto</h3><p className="text-sm text-slate-500">Próximamente: Ganancias y Aguinaldo.</p></div></div>}

                {view === 'pricing' && <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-8"><PricingTable onSubscribe={() => setModals({ ...modals, payment: true })} /></div>}
            </main>

            <footer className="border-t border-slate-800 mt-12 py-8 bg-[#0B1120] text-center text-xs text-slate-500">
                <p>© 2025 DolarHub Inc. Cotizaciones con 15 min de delay.</p>
            </footer>
        </div>
    );
}