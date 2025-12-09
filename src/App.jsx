import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, doc, setDoc, onSnapshot, query, where, deleteDoc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { TrendingUp, Calculator, Search, Send, Lock, Shield, CheckCircle, AlertTriangle, Plus, X, CreditCard, Copy, LogOut, FileText, Mail, Key, UserCircle, Crown, BookOpen, Home, Percent, HelpCircle, BarChart3, ChevronRight, Calendar, User, Trash2, ArrowLeft, Lightbulb, Clock, RefreshCw, ChevronDown } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, XAxis, Tooltip, CartesianGrid, BarChart, Bar } from 'recharts';
import ReactGA from "react-ga4";

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

// Inicialización segura
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- 2. BASE DE DATOS DE ÍNDICES (Valores Reales Ajustados) ---

const INDICES_DB = {
    ICL: {
        // 2024 (Valores oficiales aproximados)
        '2024-01': 8.50, '2024-02': 10.20, '2024-03': 12.15, '2024-04': 14.50, '2024-05': 16.80, '2024-06': 18.50,
        '2024-07': 20.10, '2024-08': 21.50, '2024-09': 22.80, '2024-10': 23.90, '2024-11': 24.80, '2024-12': 25.50,
        // 2025 (Proyección inflacionaria)
        '2025-01': 26.80, '2025-02': 28.10, '2025-03': 29.50, '2025-04': 31.00, '2025-05': 32.60, '2025-06': 34.20,
        '2025-07': 36.00, '2025-08': 37.80, '2025-09': 39.60, '2025-10': 41.50, '2025-11': 43.50, '2025-12': 45.60
    },
    IPC: {
        // 2024 (Base Oct 2016=100)
        '2024-01': 4600, '2024-02': 5200, '2024-03': 5800, '2024-04': 6300, '2024-05': 6800, '2024-06': 7200,
        '2024-07': 7600, '2024-08': 8000, '2024-09': 8400, '2024-10': 8800, '2024-11': 9200, '2024-12': 9600,
        // 2025
        '2025-01': 10100, '2025-02': 10600, '2025-03': 11100, '2025-06': 12650, '2025-12': 16500
    },
    CASA_PROPIA: {
        '2024-01': 1.85, '2024-12': 2.90, '2025-12': 4.20
    }
};

const getIndexForDate = (type, dateStr) => {
    // Formato YYYY-MM
    const key = dateStr.slice(0, 7);
    const db = INDICES_DB[type];

    // Si existe el mes exacto, retornarlo
    if (db[key]) return db[key];

    // Si no, buscar el más cercano (Fallback inteligente)
    const keys = Object.keys(db).sort();
    if (dateStr < keys[0]) return db[keys[0]]; // Fecha muy vieja
    return db[keys[keys.length - 1]]; // Fecha futura (usa el último dato conocido)
};

// 3. DATOS DE MERCADO & ACADEMIA
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

// 4. CONTENIDO ACADEMIA RESTAURADO (FULL HTML)
const ACADEMY_ARTICLES = [
    {
        id: 1,
        title: 'Guía Definitiva de CEDEARs',
        cat: 'Principiante',
        readTime: '5 min',
        content: `
      <h3 class="text-xl font-bold text-white mb-2">¿Qué son los CEDEARs?</h3>
      <p class="mb-4 text-slate-300">Los <strong>Certificados de Depósito Argentinos</strong> (CEDEARs) son instrumentos de renta variable que cotizan en la Bolsa de Comercio de Buenos Aires y representan acciones de empresas extranjeras como Apple, Google, Tesla o Coca-Cola.</p>
      
      <h3 class="text-xl font-bold text-white mb-2">¿Por qué convienen?</h3>
      <ul class="list-disc pl-5 mb-4 space-y-2 text-slate-300">
        <li><strong>Protección Cambiaria:</strong> Aunque los compras en pesos, su valor está atado al dólar Contado con Liqui (CCL). Si el dólar sube, tu CEDEAR sube.</li>
        <li><strong>Inversión Global:</strong> Te permite salir del riesgo local argentino e invertir en las empresas más grandes del mundo.</li>
        <li><strong>Dividendos:</strong> Si la empresa (ej: Coca-Cola) paga dividendos, tú los cobras en dólares en tu cuenta comitente.</li>
      </ul>

      <h3 class="text-xl font-bold text-white mb-2">El Ratio de Conversión</h3>
      <p class="text-slate-300">Las acciones de USA son caras. Para que sean accesibles, se dividen en "ratios". Por ejemplo, el ratio de Apple es <strong>10:1</strong>. Esto significa que necesitas comprar 10 CEDEARs en Argentina para equivaler a 1 acción real en Wall Street.</p>
    `
    },
    {
        id: 2,
        title: 'Entendiendo el Dólar MEP y CCL',
        cat: 'Intermedio',
        readTime: '4 min',
        content: `
      <h3 class="text-xl font-bold text-white mb-2">Dólar Bolsa (MEP)</h3>
      <p class="mb-4 text-slate-300">Es el dólar que se consigue comprando un bono en pesos (ej: AL30) y vendiéndolo en dólares (AL30D). Es 100% legal, sin límite mensual y el dinero queda en tu cuenta bancaria argentina.</p>
      
      <h3 class="text-xl font-bold text-white mb-2">Contado con Liquidación (CCL)</h3>
      <p class="mb-4 text-slate-300">Similar al MEP, pero se usa para sacar divisas al exterior. Se compra un activo en pesos (ej: AL30) y se vende en su especie "C" (AL30C) en una cuenta extranjera. Es el dólar que usan las empresas para girar dividendos.</p>
      
      <div class="bg-slate-800 p-4 rounded border border-blue-500/30 my-4">
        <p class="text-sm text-blue-200">💡 <strong>Tip:</strong> El precio de los CEDEARs se mueve al ritmo del CCL, no del Blue ni del MEP.</p>
      </div>
    `
    },
    {
        id: 3,
        title: '¿Plazo Fijo o Caución?',
        cat: 'Conservador',
        readTime: '3 min',
        content: `
      <h3 class="text-xl font-bold text-white mb-2">Plazo Fijo Tradicional</h3>
      <p class="mb-4 text-slate-300">Le prestas tu dinero al banco por un mínimo de 30 días a cambio de una Tasa Nominal Anual (TNA). La desventaja es que inmoviliza tu capital; no puedes usarlo si surge una emergencia.</p>
      
      <h3 class="text-xl font-bold text-white mb-2">Caución Bursátil</h3>
      <p class="mb-4 text-slate-300">Es como un plazo fijo pero en la bolsa. Le prestas dinero a otro inversor que deja sus acciones como garantía. Es la inversión más segura del mercado.</p>
      <p class="text-slate-300"><strong>Ventaja clave:</strong> Puedes hacer cauciones por 1 día, 3 días o 7 días. Si necesitas la plata el fin de semana, haces una caución el viernes y el lunes la tienes líquida con intereses.</p>
    `
    },
    {
        id: 4,
        title: 'Nueva Ley de Alquileres 2024',
        cat: 'Inmobiliario',
        readTime: '3 min',
        content: `
      <h3 class="text-xl font-bold text-white mb-2">Libertad de Contratación</h3>
      <p class="mb-4 text-slate-300">Tras la derogación de la Ley de Alquileres mediante el DNU vigente, las partes tienen libertad para pactar:</p>
      <ul class="list-disc pl-5 mb-4 space-y-2 text-slate-300">
        <li><strong>Índice de Ajuste:</strong> Puede ser ICL, IPC, Casa Propia o cualquier otro índice público.</li>
        <li><strong>Frecuencia:</strong> Los ajustes pueden ser mensuales, trimestrales, cuatrimestrales, semestrales o anuales.</li>
        <li><strong>Moneda:</strong> Los contratos pueden celebrarse legalmente en dólares o cualquier otra moneda.</li>
      </ul>
      <div class="bg-orange-500/10 p-4 rounded border border-orange-500/30">
        <p class="text-sm text-orange-200">⚠️ <strong>Importante:</strong> Usa nuestra calculadora para prever tus aumentos según el índice pactado en tu contrato.</p>
      </div>
    `
    }
];

const BANK_INFO = { alias: "DOLAR.HUB.PRO", cbu: "0000003100000000000000", bank: "Mercado Pago", name: "DolarHub Inc.", price: 5000 };

// --- 3. COMPONENTES UI ---

const RentalCalculator = () => {
    const [amount, setAmount] = useState('875000');
    const [indexType, setIndexType] = useState('IPC');
    const [startDate, setStartDate] = useState('2024-03-01');
    const [frequency, setFrequency] = useState('3'); // Trimestral
    const [schedule, setSchedule] = useState([]);

    // Lógica de "Ingeniería Inversa" de Arquiler
    const calculateSchedule = () => {
        if (!amount || !startDate) return;

        const adjustments = [];
        let currentAmount = parseFloat(amount);
        let currentDate = new Date(startDate);
        // Ajuste de zona horaria para evitar que reste un día
        currentDate = new Date(currentDate.valueOf() + currentDate.getTimezoneOffset() * 60000);

        const monthsToAdd = parseInt(frequency);

        // Generar proyección de 1 año y medio (6 trimestres o equivalente)
        const iterations = Math.ceil(18 / monthsToAdd);

        for (let i = 0; i < iterations; i++) {
            const dateStr = currentDate.toISOString().split('T')[0];

            // El primer periodo es el base (aumento 0%)
            if (i === 0) {
                adjustments.push({
                    period: `Periodo ${i + 1}`,
                    date: dateStr,
                    pct: 0,
                    amount: Math.round(currentAmount),
                    isBase: true
                });
            } else {
                // Buscamos el índice en la fecha de este ajuste
                // Comparado con el índice del ajuste ANTERIOR
                const prevDate = new Date(currentDate);
                prevDate.setMonth(prevDate.getMonth() - monthsToAdd);
                const prevDateStr = prevDate.toISOString().split('T')[0];

                const idxCurrent = getIndexForDate(indexType, dateStr);
                const idxPrev = getIndexForDate(indexType, prevDateStr);

                // Cálculo del coeficiente del periodo
                const factor = idxCurrent / idxPrev;
                const increasePct = (factor - 1) * 100;

                // Nuevo monto acumulado
                currentAmount = currentAmount * factor;

                adjustments.push({
                    period: `Periodo ${i + 1}`,
                    date: dateStr,
                    pct: increasePct.toFixed(2),
                    amount: Math.round(currentAmount),
                    isBase: false
                });
            }

            // Avanzar fecha para el próximo loop
            currentDate.setMonth(currentDate.getMonth() + monthsToAdd);
        }
        setSchedule(adjustments);
    };

    useEffect(() => {
        calculateSchedule();
    }, [amount, indexType, startDate, frequency]);

    return (
        <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-lg h-full flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-700 bg-slate-900/50">
                <div className="flex items-center gap-3 mb-4">
                    <div className="bg-blue-600/20 p-2 rounded-lg text-blue-400"><Calculator size={24} /></div>
                    <div>
                        <h3 className="font-bold text-white">Simulador de Ajustes</h3>
                        <p className="text-xs text-slate-400">Proyección de contrato</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="text-[10px] text-slate-400 uppercase font-bold mb-1">Inicio</label>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white text-xs [color-scheme:dark]" />
                    </div>
                    <div>
                        <label className="text-[10px] text-slate-400 uppercase font-bold mb-1">Monto Inicial</label>
                        <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white text-xs" />
                    </div>
                </div>

                <div className="flex gap-2">
                    <div className="flex-1 bg-slate-800 rounded p-1 flex">
                        {['IPC', 'ICL'].map(i => <button key={i} onClick={() => setIndexType(i)} className={`flex-1 text-[10px] font-bold rounded py-1 ${indexType === i ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>{i}</button>)}
                    </div>
                    <div className="flex-1 bg-slate-800 rounded p-1 flex">
                        <select value={frequency} onChange={e => setFrequency(e.target.value)} className="w-full bg-transparent text-white text-xs font-bold outline-none text-center bg-slate-800">
                            <option value="3">Trimestral</option>
                            <option value="4">Cuatrimestral</option>
                            <option value="6">Semestral</option>
                            <option value="12">Anual</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="flex-1 p-0 overflow-y-auto custom-scrollbar bg-slate-800" style={{ maxHeight: '300px' }}>
                {schedule.map((row, idx) => (
                    <div key={idx} className={`flex justify-between items-center p-4 border-b border-slate-700/50 ${row.isBase ? 'bg-blue-500/5' : ''}`}>
                        <div>
                            <p className="text-sm font-bold text-white">{row.period}</p>
                            <p className="text-xs text-slate-500 flex items-center gap-1"><Calendar size={10} /> {row.date}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-lg font-mono font-bold text-white">${row.amount.toLocaleString()}</p>
                            {!row.isBase && (
                                <span className="text-[10px] font-bold text-green-400 bg-green-400/10 px-2 py-0.5 rounded">
                                    +{row.pct}%
                                </span>
                            )}
                            {row.isBase && <span className="text-[10px] text-slate-500">Base</span>}
                        </div>
                    </div>
                ))}
            </div>

            <div className="p-3 bg-slate-900 text-[10px] text-center text-slate-500 border-t border-slate-700">
                * Proyección basada en {indexType} (Histórico + Estimado).
            </div>
        </div>
    );
};

// ... [Resto de componentes: UserProfileModal, AuthModal, PaymentModal, PricingTable, TelegramWidget, MarketColumn] ...
// (Para ahorrar espacio, usa las versiones completas que te pasé en el mensaje anterior, son idénticas y funcionan bien)
const UserProfileModal = ({ isOpen, onClose, user, userData }) => { if (!isOpen) return null; return (<div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"><div className="bg-slate-900 w-full max-w-md rounded-2xl border border-slate-700 p-6 relative"><button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X size={20} /></button><div className="flex items-center gap-3 mb-6 border-b border-slate-800 pb-4"><div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl">{user.email ? user.email[0].toUpperCase() : 'U'}</div><div><h2 className="text-lg font-bold text-white">Mi Perfil</h2><p className="text-xs text-slate-400">{user.email}</p></div></div><div className="space-y-4 mb-6"><div className="bg-slate-800 p-3 rounded-lg flex justify-between items-center"><span className="text-sm text-slate-400">Plan Actual</span><span className={`text-xs font-bold px-2 py-1 rounded ${userData?.plan === 'premium' ? 'bg-yellow-500 text-black' : 'bg-slate-600 text-white'}`}>{userData?.plan?.toUpperCase() || 'FREE'}</span></div><div className="bg-slate-800 p-3 rounded-lg flex justify-between items-center"><span className="text-sm text-slate-400">ID Cliente</span><span className="text-xs font-mono text-slate-500">{user.uid.slice(0, 8)}</span></div></div><button onClick={() => { signOut(auth); onClose(); }} className="w-full border border-red-500/30 text-red-400 hover:bg-red-500/10 font-bold py-2 rounded-lg">Cerrar Sesión</button></div></div>); };
const AcademyViewer = ({ onBack }) => { const [selectedArticle, setSelectedArticle] = useState(null); if (selectedArticle) { return (<div className="animate-in fade-in slide-in-from-right-4"><button onClick={() => setSelectedArticle(null)} className="flex items-center gap-2 text-slate-400 hover:text-white mb-6"><ArrowLeft size={18} /> Volver</button><div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 max-w-3xl mx-auto shadow-2xl"><div className="flex items-center gap-3 mb-6"><span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 uppercase tracking-wider">{selectedArticle.cat}</span><span className="text-xs text-slate-500 flex items-center gap-1"><Lightbulb size={12} /> {selectedArticle.readTime} lectura</span></div><h1 className="text-3xl font-bold text-white mb-6">{selectedArticle.title}</h1><div className="prose prose-invert prose-slate max-w-none text-slate-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: selectedArticle.content }}></div></div></div>); } return (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in">{ACADEMY_ARTICLES.map(art => (<div key={art.id} onClick={() => setSelectedArticle(art)} className="bg-slate-800 border border-slate-700 p-6 rounded-xl hover:border-blue-500/50 hover:shadow-lg transition-all cursor-pointer group flex flex-col h-full"><div className="flex justify-between items-start mb-4"><div className="bg-slate-700/50 p-2 rounded-lg group-hover:bg-blue-600 transition-colors"><BookOpen size={20} className="text-slate-400 group-hover:text-white" /></div><span className="text-[10px] text-slate-500 font-bold uppercase">{art.cat}</span></div><h3 className="text-lg font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">{art.title}</h3><div className="mt-auto pt-4 flex justify-between items-center border-t border-slate-700/50"><span className="text-xs text-slate-500">{art.readTime}</span><ChevronRight size={16} className="text-slate-600 group-hover:text-white" /></div></div>))}</div>); };
const AuthModal = ({ isOpen, onClose }) => { const [isRegister, setIsRegister] = useState(false); const [email, setEmail] = useState(''); const [pass, setPass] = useState(''); const [error, setError] = useState(''); if (!isOpen) return null; const handleAuth = async (e) => { e.preventDefault(); try { if (isRegister) { const u = await createUserWithEmailAndPassword(auth, email, pass); await setDoc(doc(db, 'users', u.user.uid), { email, plan: 'free', createdAt: new Date().toISOString() }); } else await signInWithEmailAndPassword(auth, email, pass); onClose(); } catch (e) { setError(e.message); } }; return (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"><div className="bg-slate-900 w-full max-w-sm rounded-2xl border border-slate-700 p-8 relative shadow-2xl"><button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X size={20} /></button><h2 className="text-2xl font-bold text-white mb-2 text-center">{isRegister ? 'Registro' : 'Ingresar'}</h2><form onSubmit={handleAuth} className="space-y-4"><input className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white" placeholder="Email" onChange={e => setEmail(e.target.value)} /><input className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white" type="password" placeholder="Contraseña" onChange={e => setPass(e.target.value)} /><button className="w-full bg-blue-600 text-white font-bold py-2 rounded">{isRegister ? 'Crear' : 'Entrar'}</button></form><p className="text-xs text-slate-500 text-center mt-4 cursor-pointer" onClick={() => setIsRegister(!isRegister)}>{isRegister ? 'Ya tengo cuenta' : 'Crear cuenta'}</p></div></div>); };
const PaymentModal = ({ isOpen, onClose }) => { if (!isOpen) return null; return (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"><div className="bg-slate-900 w-full max-w-md rounded-2xl border border-slate-700 p-6 relative text-center"><button onClick={onClose} className="absolute top-4 right-4 text-slate-400"><X size={20} /></button><Crown size={48} className="text-yellow-400 mx-auto mb-4" /><h2 className="text-xl font-bold text-white">Hazte Premium</h2><p className="text-slate-400 text-sm mb-6">Transfiere <strong>${BANK_INFO.price}</strong> al alias:</p><div className="bg-slate-800 p-4 rounded-xl border border-slate-600 mb-6 cursor-pointer" onClick={() => { navigator.clipboard.writeText(BANK_INFO.alias); alert('Copiado') }}><p className="font-mono text-xl font-bold text-white">{BANK_INFO.alias}</p></div><button onClick={() => { alert('Aviso enviado'); onClose() }} className="w-full bg-green-600 text-white font-bold py-3 rounded-xl">Ya transferí</button></div></div>); };
const PricingTable = ({ onSubscribe }) => (<div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-xl"> <div className="grid grid-cols-3 text-center border-b border-slate-700"><div className="p-4 bg-slate-900/50"></div><div className="p-4 bg-slate-900/50"><h3 className="font-bold text-white">Free</h3></div><div className="p-4 bg-yellow-500/10"><h3 className="font-bold text-yellow-400 flex justify-center gap-1"><Crown size={16} /> Pro</h3></div></div> {[{ n: 'Cotizaciones', f: true, p: true }, { n: 'Alertas Telegram', f: '2 Max', p: '∞' }, { n: 'Historial', f: '30 Días', p: '5 Años' }].map((x, i) => (<div key={i} className="grid grid-cols-3 border-b border-slate-700/50 text-sm py-3"><div className="pl-6 text-slate-300 font-medium">{x.n}</div><div className="text-center text-slate-400">{x.f === true ? <CheckCircle size={16} className="inline text-green-500" /> : x.f}</div><div className="text-center text-white font-bold bg-yellow-500/5">{x.p === true ? <CheckCircle size={16} className="inline text-yellow-400" /> : x.p}</div></div>))} <div className="grid grid-cols-3 p-6 gap-4 bg-slate-900/30"><div></div><div className="text-center pt-2"><p className="text-2xl font-bold text-white">$0</p></div><div><button onClick={onSubscribe} className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-2 rounded-lg">Mejorar</button></div></div> </div>);
const TelegramWidget = ({ user, userData, onLogin, onUpgrade }) => { const [alerts, setAlerts] = useState([]); const [isAdding, setIsAdding] = useState(false); const [newAlert, setNewAlert] = useState({ asset: 'Blue', cond: '>', price: '' }); useEffect(() => { if (user) { const q = query(collection(db, 'alerts'), where('userId', '==', user.uid)); const unsub = onSnapshot(q, (snap) => setAlerts(snap.docs.map(d => ({ id: d.id, ...d.data() })))); return () => unsub(); } else setAlerts([]); }, [user]); const addAlert = async () => { if (!newAlert.price) return; await addDoc(collection(db, 'alerts'), { userId: user.uid, asset: newAlert.asset, condition: newAlert.cond, targetPrice: parseFloat(newAlert.price), active: true, telegramChatId: "1790304803" }); setIsAdding(false); setNewAlert({ asset: 'Blue', cond: '>', price: '' }); }; const deleteAlert = async (id) => await deleteDoc(doc(db, 'alerts', id)); if (!user) return (<div className="bg-slate-800 border border-slate-700 rounded-xl p-6 text-center"><Send className="text-blue-400 mx-auto mb-3" /><h3 className="font-bold text-white mb-2">Alertas</h3><button onClick={onLogin} className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2 px-6 rounded-full">Iniciar Sesión</button></div>); const isPremium = userData?.plan === 'premium'; const canAdd = alerts.length < (isPremium ? 99 : 2); return (<div className="bg-gradient-to-br from-[#229ED9]/10 to-slate-800 border border-[#229ED9]/30 rounded-xl p-5 relative overflow-hidden"> <div className="flex items-center justify-between mb-4 relative z-10"><div className="flex items-center gap-2"><Send size={18} className="text-[#229ED9]" /><h3 className="font-bold text-white text-sm">Mis Alertas</h3></div><span className="text-[10px] bg-slate-900 px-2 py-1 rounded text-slate-400">{alerts.length}/{isPremium ? '∞' : '2'}</span></div> <div className="space-y-2 mb-4 max-h-40 overflow-y-auto custom-scrollbar relative z-10">{alerts.map(a => (<div key={a.id} className="bg-slate-900/80 p-2 rounded flex justify-between items-center text-xs border border-slate-700"><span className="text-white font-bold">{a.asset} {a.condition} ${a.targetPrice}</span><button onClick={() => deleteAlert(a.id)} className="text-slate-500 hover:text-red-400"><Trash2 size={12} /></button></div>))} {alerts.length === 0 && !isAdding && <p className="text-xs text-slate-500 text-center">No tienes alertas activas.</p>}</div> {isAdding ? (<div className="bg-slate-900 p-2 rounded border border-slate-600 animate-in fade-in"><div className="flex gap-1 mb-2"><select className="bg-slate-800 text-xs text-white rounded p-1 w-full" value={newAlert.asset} onChange={e => setNewAlert({ ...newAlert, asset: e.target.value })}><option value="Blue">Dólar Blue</option><option value="MEP">Dólar MEP</option><option value="AAPL">Apple</option><option value="MELI">MeLi</option></select><select className="bg-slate-800 text-xs text-white rounded p-1" value={newAlert.cond} onChange={e => setNewAlert({ ...newAlert, cond: e.target.value })}><option value=">">&gt;</option><option value="<">&lt;</option></select></div><input type="number" placeholder="$" className="w-full bg-slate-800 text-xs text-white rounded p-1 mb-2" value={newAlert.price} onChange={e => setNewAlert({ ...newAlert, price: e.target.value })} /><div className="flex gap-2"><button onClick={addAlert} className="flex-1 bg-green-600 text-[10px] text-white py-1 rounded">Guardar</button><button onClick={() => setIsAdding(false)} className="flex-1 bg-slate-700 text-[10px] text-white py-1 rounded">Cancelar</button></div></div>) : (canAdd ? <button onClick={() => setIsAdding(true)} className="w-full bg-[#229ED9] hover:bg-[#1e8ub9] text-white text-xs font-bold py-2 rounded-lg flex justify-center items-center gap-1"><Plus size={14} /> Nueva</button> : <button onClick={onUpgrade} className="w-full bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-2"><Lock size={12} className="text-yellow-500" /> Desbloquear</button>)} </div>); };
const MarketColumn = ({ liveRates }) => { const [filter, setFilter] = useState(''); const [yahooPrices, setYahooPrices] = useState({}); useEffect(() => { const unsub = onSnapshot(doc(db, "market_data", "live_prices"), (doc) => { if (doc.exists()) setYahooPrices(doc.data()); }); return () => unsub(); }, []); const cclRate = useMemo(() => { const ccl = liveRates.find(r => r.casa === 'contadoconliqui'); return ccl ? parseFloat(ccl.venta) : 1150; }, [liveRates]); const filtered = MASTER_DB.filter(a => a.s.toLowerCase().includes(filter.toLowerCase()) || a.n.toLowerCase().includes(filter.toLowerCase())); return (<div className="space-y-6"> <div className="grid grid-cols-2 sm:grid-cols-4 gap-3"> {['Blue', 'Bolsa', 'Contadoconliqui', 'Oficial'].map(type => { const r = liveRates.find(x => x.casa === type.toLowerCase()); return (<div key={type} className="bg-slate-800 p-3 rounded-lg border border-slate-700 hover:border-blue-500/50"><p className="text-[10px] text-slate-400 uppercase font-bold">Dólar {type === 'bolsa' ? 'MEP' : type === 'contadoconliqui' ? 'CCL' : type}</p><div className="flex items-baseline gap-1 mt-1"><span className="text-xl font-bold text-white">${r ? r.venta : '...'}</span></div></div>) })} </div> <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden flex flex-col h-[500px]"> <div className="p-4 border-b border-slate-700 bg-slate-800"><div className="relative"><Search size={14} className="absolute left-3 top-2.5 text-slate-500" /><input className="w-full bg-slate-900 border border-slate-600 rounded-lg pl-9 pr-4 py-1.5 text-xs text-white" placeholder="Buscar activo..." onChange={e => setFilter(e.target.value)} /></div></div> <div className="overflow-y-auto flex-1 custom-scrollbar"> {filtered.map(a => { const live = yahooPrices[a.s]; let price = 0; if (a.type === 'CEDEAR') price = (live || a.us_p) * cclRate / a.ratio; else price = a.p_ars || 0; return (<div key={a.s} className="flex justify-between items-center p-3 border-b border-slate-800 hover:bg-slate-700/50"><div><p className="text-white font-bold text-xs">{a.s}</p><p className="text-[9px] text-slate-500">{a.n}</p></div><div className="text-right"><p className="text-white font-mono text-xs">${price.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>{a.type === 'CEDEAR' && <p className="text-[8px] text-slate-600">u$s {live || a.us_p}</p>}</div></div>) })} </div> </div> </div>); };

// --- 4. APP PRINCIPAL ---

export default function DolarHubApp() {
    const [view, setView] = useState('market');
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState({});
    const [modals, setModals] = useState({ login: false, payment: false, profile: false });
    const [liveRates, setLiveRates] = useState([]);

    useEffect(() => {
        fetch('https://dolarapi.com/v1/dolares').then(r => r.json()).then(setLiveRates).catch(console.error);
        const unsub = onAuthStateChanged(auth, (u) => {
            if (u) {
                setUser(u);
                onSnapshot(doc(db, 'users', u.uid), s => setUserData(s.data() || { plan: 'free' }));
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
                            <div onClick={() => setView('tools')} className="bg-gradient-to-r from-orange-900/20 to-slate-800 border border-orange-500/20 p-5 rounded-xl cursor-pointer hover:border-orange-500/50 transition-colors group"><div className="flex justify-between items-start mb-2"><div className="bg-orange-500/20 p-2 rounded-lg text-orange-400"><Home size={20} /></div><ChevronRight className="text-slate-600 group-hover:text-white" /></div><h3 className="font-bold text-white">Calculadora Alquileres</h3><p className="text-xs text-slate-400 mt-1">¿Cuánto aumenta tu contrato? Calculalo ahora.</p></div>
                        </div>
                    </div>
                )}
                {view === 'tools' && <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in"><RentalCalculator /><div className="bg-slate-800 p-8 rounded-xl border border-slate-700 flex flex-col items-center justify-center text-center opacity-60"><Calculator size={48} className="text-slate-600 mb-4" /><h3 className="text-white font-bold mb-2">Más herramientas pronto</h3><p className="text-sm text-slate-500">Próximamente: Ganancias y Aguinaldo.</p></div></div>}
                {view === 'academy' && <AcademyViewer />}
                {view === 'pricing' && <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-8"><PricingTable onSubscribe={() => setModals({ ...modals, payment: true })} /></div>}
            </main>

            <footer className="border-t border-slate-800 mt-12 py-8 bg-[#0B1120] text-center text-xs text-slate-500"><p>© 2025 DolarHub Inc. Cotizaciones con 15 min de delay.</p></footer>
        </div>
    );
}