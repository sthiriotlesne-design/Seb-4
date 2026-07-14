import React, { useState, useMemo } from "react";
import {
  Plus, Search, Users, History, Settings, Coffee, Beer, Wine,
  Sparkles, Martini, CupSoda, ArrowLeft, X, Minus, CheckCircle2,
  CreditCard, Banknote, FileCheck2, Clock
} from "lucide-react";

// ============================================================
// CAMP'ARDOISE - Version simplifiée et 100% fonctionnelle
// ============================================================

const toCents = (euros) => Math.round(euros * 100);
const fromCents = (cents) => cents / 100;
const fmt = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });
const money = (cents) => fmt.format(fromCents(cents));

const uid = (prefix) => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

const SEED = {
  categories: [
    { id: "cocktails", name: "Cocktails", displayOrder: 0 },
    { id: "beers", name: "Bières", displayOrder: 1 },
    { id: "wines", name: "Vins", displayOrder: 2 },
    { id: "softs", name: "Softs", displayOrder: 3 },
  ],
  products: [
    { id: "c-mojito", categoryId: "cocktails", name: "Mojito", priceCents: 800 },
    { id: "c-spritz", categoryId: "cocktails", name: "Spritz", priceCents: 800 },
    { id: "b-heineken", categoryId: "beers", name: "Heineken Pinte", priceCents: 700 },
    { id: "b-affligem", categoryId: "beers", name: "Affligem", priceCents: 800 },
    { id: "v-verre", categoryId: "wines", name: "Verre de vin", priceCents: 300 },
    { id: "so-limonade", categoryId: "softs", name: "Limonade", priceCents: 250 },
  ],
  clientNotes: [],
};

// ============================================================
function App() {
  const [password, setPassword] = useState("");
  const [bar, setBar] = useState(null);
  const [tab, setTab] = useState("notes");
  const [view, setView] = useState({ screen: "list" });
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState({});
  const [error, setError] = useState("");

  // --- AUTH ---
  const handleCreate = () => {
    const pwd = password.trim();
    if (!pwd) return setError("Mot de passe requis");
    const data = { ...SEED, password: pwd };
    localStorage.setItem(`campardoise_${pwd}`, JSON.stringify(data));
    setBar(data);
  };

  const handleJoin = () => {
    const pwd = password.trim();
    if (!pwd) return setError("Mot de passe requis");
    const raw = localStorage.getItem(`campardoise_${pwd}`);
    if (!raw) return setError("Aucun bar trouvé");
    setBar(JSON.parse(raw));
  };

  // --- ACTIONS ---
  const updateBar = (updater) => {
    setBar(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      if (next) localStorage.setItem(`campardoise_${next.password}`, JSON.stringify(next));
      return next;
    });
  };

  const activeNotes = useMemo(() => (bar?.clientNotes || []).filter(n => n.status === "active"), [bar]);
  const filteredNotes = useMemo(() => {
    const q = search.trim().toLowerCase();
    return activeNotes.filter(n => n.name.toLowerCase().includes(q));
  }, [activeNotes, search]);

  const createNote = (name) => {
    if (!name.trim()) return;
    updateBar(prev => ({
      ...prev,
      clientNotes: [...prev.clientNotes, { 
        id: uid("note"), name: name.trim(), status: "active", 
        createdAt: new Date().toISOString(), orders: [], totalAmountCents: 0 
      }]
    }));
    setSearch("");
  };

  const addToCart = (productId) => {
    setCart(prev => ({ ...prev, [productId]: (prev[productId] || 0) + 1 }));
  };

  const validateOrder = () => {
    const products = bar?.products || [];
    const total = Object.entries(cart).reduce((sum, [id, qty]) => {
      const p = products.find(pr => pr.id === id);
      return sum + (p?.priceCents || 0) * qty;
    }, 0);

    const items = Object.entries(cart).map(([id, qty]) => {
      const p = products.find(pr => pr.id === id);
      return { productId: id, productName: p?.name || "", quantity: qty, priceCents: p?.priceCents || 0 };
    });

    updateBar(prev => ({
      ...prev,
      clientNotes: prev.clientNotes.map(n => 
        n.id === view.noteId ? {
          ...n,
          orders: [...n.orders, { items, timestamp: new Date().toISOString() }],
          totalAmountCents: n.totalAmountCents + total
        } : n
      )
    }));
    setCart({});
    setView({ screen: "detail", noteId: view.noteId });
  };

  const closeNote = (method) => {
    updateBar(prev => ({
      ...prev,
      clientNotes: prev.clientNotes.map(n => 
        n.id === view.noteId ? { ...n, status: "paye", closedAt: new Date().toISOString(), paymentMethod: method } : n
      )
    }));
    setView({ screen: "list" });
  };

  // --- RENDU ---
  if (!bar) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white">
        <div className="w-full max-w-sm bg-slate-900 p-6 rounded-3xl border border-slate-800">
          <h1 className="text-3xl font-bold text-center mb-6">Camp'Ardoise</h1>
          <input
            className="w-full h-12 px-4 rounded-2xl bg-slate-800 border border-slate-700 mb-3 focus:border-indigo-500 outline-none"
            placeholder="Mot de passe bar"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
          <button onClick={handleCreate} className="w-full h-12 bg-indigo-600 rounded-2xl font-bold mb-3">Créer un Bar</button>
          <button onClick={handleJoin} className="w-full h-12 bg-slate-800 rounded-2xl font-bold">Rejoindre</button>
        </div>
      </div>
    );
  }

  // --- VUES ---
  return (
    <div className="min-h-screen bg-slate-950 text-white pb-20 font-sans">
      <style>{`.no-scrollbar::-webkit-scrollbar{display:none}`}</style>

      {tab === "notes" && view.screen === "list" && (
        <>
          <div className="sticky top-0 bg-slate-950 p-4 border-b border-slate-800 z-10 flex justify-between">
            <h1 className="text-xl font-bold">Ardoises</h1>
            <span className="text-indigo-300">{activeNotes.length} actives</span>
          </div>
          <div className="px-4 mb-4">
            <input className="w-full h-12 px-4 rounded-2xl bg-slate-900 border border-slate-800 outline-none" placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="px-4 grid gap-3">
            {filteredNotes.map(n => (
              <button key={n.id} onClick={() => setView({ screen: "detail", noteId: n.id })} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-left flex justify-between items-center">
                <div>
                  <div className="font-bold text-lg">{n.name}</div>
                  <div className="text-indigo-400 text-sm">{money(n.totalAmountCents)}</div>
                </div>
                <div className="text-slate-500"><ArrowLeft className="w-5 h-5 rotate-180" /></div>
              </button>
            ))}
          </div>
          <button onClick={() => { const name = prompt("Nom du client ?"); if(name) createNote(name); }} className="fixed bottom-24 right-5 w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg">
            <Plus className="w-8 h-8" />
          </button>
        </>
      )}

      {tab === "notes" && view.screen === "detail" && (
        <div className="p-4">
          <button onClick={() => setView({ screen: "list" })} className="flex items-center gap-2 text-slate-400 mb-4"><ArrowLeft className="w-4 h-4" /> Retour</button>
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center mb-4">
            <p className="text-5xl font-extrabold text-emerald-400">{money(bar.clientNotes.find(n => n.id === view.noteId)?.totalAmountCents || 0)}</p>
          </div>
          <div className="flex gap-3 mb-6">
            <button onClick={() => setView({ screen: "order", noteId: view.noteId })} className="flex-1 h-14 bg-indigo-600 rounded-2xl font-bold">Ajouter</button>
            <button onClick={() => closeNote("Espèces")} className="flex-1 h-14 bg-slate-800 rounded-2xl font-bold border border-slate-700">Clôturer</button>
          </div>
          <div className="space-y-2">
            {bar.clientNotes.find(n => n.id === view.noteId)?.orders.slice().reverse().map(o => (
              <div key={o.timestamp} className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                {o.items.map((it, i) => <div key={i} className="flex justify-between text-sm py-1 border-b border-slate-800 last:border-0"><span>{it.quantity}x {it.productName}</span><span>{money(it.priceCents * it.quantity)}</span></div>)}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "notes" && view.screen === "order" && (
        <div className="p-4 pb-40">
          <button onClick={() => setView({ screen: "detail", noteId: view.noteId })} className="text-slate-400 mb-4 flex items-center gap-2"><ArrowLeft className="w-4 h-4" /> Retour</button>
          <div className="grid grid-cols-2 gap-3">
            {bar.products.map(p => (
              <button key={p.id} onClick={() => addToCart(p.id)} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-left relative">
                <div className="font-bold">{p.name}</div>
                <div className="text-slate-400 text-sm">{money(p.priceCents)}</div>
                {cart[p.id] > 0 && <span className="absolute -top-2 -right-2 bg-indigo-600 w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold">{cart[p.id]}</span>}
              </button>
            ))}
          </div>
          {Object.keys(cart).length > 0 && (
            <div className="fixed bottom-20 left-0 right-0 p-4 bg-slate-900 border-t border-slate-800">
              <div className="max-h-40 overflow-auto mb-3 space-y-2">
                {Object.entries(cart).map(([id, qty]) => {
                  const p = bar.products.find(pr => pr.id === id);
                  return <div key={id} className="flex justify-between bg-slate-800 p-2 rounded-xl"><span>{qty}x {p?.name}</span><span>{money((p?.priceCents||0) * qty)}</span></div>;
                })}
              </div>
              <button onClick={validateOrder} className="w-full h-14 bg-emerald-600 rounded-3xl text-xl font-bold">Valider la note</button>
            </div>
          )}
        </div>
      )}

      {tab === "admin" && (
        <div className="p-4">
          <h1 className="text-xl font-bold mb-4">La Carte</h1>
          <div className="space-y-4">
            {bar.categories.map(c => (
              <div key={c.id}>
                <h3 className="text-slate-400 text-sm uppercase font-bold mb-2">{c.name}</h3>
                <div className="space-y-2">
                  {bar.products.filter(p => p.categoryId === c.id).map(p => (
                    <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex justify-between">
                      <span className="font-bold">{p.name}</span>
                      <span className="text-slate-400">{money(p.priceCents)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "history" && (
        <div className="p-4">
          <h1 className="text-xl font-bold mb-4">Historique</h1>
          <div className="space-y-2">
            {bar.clientNotes.filter(n => n.status === "paye").map(n => (
              <div key={n.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex justify-between">
                <div><div className="font-bold">{n.name}</div><div className="text-slate-500 text-xs">{n.paymentMethod}</div></div>
                <div className="text-emerald-400 font-bold">{money(n.totalAmountCents)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-slate-950 border-t border-slate-800 flex p-2">
        {[{ id: "notes", label: "Ardoises", icon: Users }, { id: "admin", label: "Carte", icon: Settings }, { id: "history", label: "Historique", icon: History }].map(item => (
          <button key={item.id} onClick={() => { setTab(item.id); setView({ screen: "list" }); }} className={`flex-1 flex flex-col items-center py-2 ${tab === item.id ? "text-indigo-400" : "text-slate-500"}`}>
            <item.icon className="w-6 h-6 mb-1" />
            <span className="text-xs">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default App;
