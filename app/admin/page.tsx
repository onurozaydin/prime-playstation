"use client";
import { useState, useEffect } from "react";
import { db } from "../../firebase"; 
import { collection, onSnapshot, doc, updateDoc, deleteDoc, query, orderBy } from "firebase/firestore";

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  
  const [pending, setPending] = useState<any[]>([]);
  const [approved, setApproved] = useState<any[]>([]);

  // Sayfa açıldığında daha önce giriş yapılmış mı diye kontrol et
  useEffect(() => {
    const authStatus = sessionStorage.getItem("admin_auth");
    if (authStatus === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  // Belirleyeceğiniz Yönetici Şifresi (Buradan dilediğiniz gibi değiştirebilirsiniz)
  const ADMIN_PASSWORD = "TRABZON61"; 

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem("admin_auth", "true");
    } else {
      alert("Hatalı Şifre!");
      setPasswordInput("");
    }
  };

  // Veritabanını Canlı Olarak Dinle (Real-time) ve BİLDİRİM VER
  useEffect(() => {
    if (!isAuthenticated) return;

    const q = query(collection(db, "matches"), orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "modified") {
          const matchData = change.doc.data();
          if (matchData.status === "matched") {
            alert(`🔔 YENİ EŞLEŞME VAR!\n\n${matchData.p1} ile ${matchData.p2} eşleşti!\nOyun: ${matchData.game}\nSaat: ${matchData.time}\n\nLütfen oyuncuları karşılamak için hazırlanın.`);
          }
        }
      });

      const pendingMatches: any[] = [];
      const approvedMatches: any[] = [];
      
      snapshot.forEach((doc) => {
        const data: any = { id: doc.id, ...doc.data() };
        if (data.status === "pending") {
          pendingMatches.push(data);
        } else if (data.status === "approved" || data.status === "matched") {
          approvedMatches.push(data);
        }
      });
      
      setPending(pendingMatches);
      setApproved(approvedMatches);
    });

    return () => unsubscribe();
  }, [isAuthenticated]);

  const handleApprove = async (id: string) => {
    try {
      const matchRef = doc(db, "matches", id);
      await updateDoc(matchRef, { status: "approved" });
    } catch (error) {
      console.error("Onaylama hatası:", error);
      alert("İşlem başarısız oldu.");
    }
  };

  const handleReject = async (id: string) => {
    if (window.confirm("Bu kaydı kalıcı olarak silmek istediğinize emin misiniz?")) {
      try {
        await deleteDoc(doc(db, "matches", id));
      } catch (error) {
        console.error("Silme hatası:", error);
      }
    }
  };

  // EĞER GİRİŞ YAPILMADIYSA ŞİFRE EKRANINI GÖSTER
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-brand-dark text-white flex items-center justify-center p-4">
        <div className="bg-brand-card p-8 border border-white/10 w-full max-w-md rounded-lg shadow-2xl">
          <div className="flex items-center justify-center gap-2 text-brand-primary mb-6">
            <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24"><path d="M21.58 10.74l-9.14-5.28a1 1 0 00-1 0l-9.14 5.28a1 1 0 00-.5.87v4a1 1 0 00.5.87l9.14 5.28a1 1 0 001 0l9.14-5.28a1 1 0 00.5-.87v-4a1 1 0 00-.5-.87zm-9.64 4.14v-5.76l4.98 2.88-4.98 2.88zm-1.88 0l-4.98-2.88 4.98-2.88v5.76z" /></svg>
          </div>
          <h1 className="text-2xl font-bold uppercase tracking-wider text-center mb-2">Yönetici Girişi</h1>
          <p className="text-gray-400 text-center text-sm mb-6">Prime Playstation Panel Koruması</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">Admin Şifresi</label>
              <input 
                type="password" 
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Şifrenizi girin..."
                className="w-full bg-black/50 border border-white/10 rounded px-4 py-3 text-white focus:outline-none focus:border-brand-primary"
                autoFocus
              />
            </div>
            <button 
              type="submit"
              className="w-full py-3 bg-brand-primary text-white font-bold uppercase tracking-wider rounded hover:bg-red-700 transition"
            >
              Giriş Yap
            </button>
          </form>
        </div>
      </div>
    );
  }

  // GİRİŞ YAPILDIYSA NORMAL ADMIN PANELİNİ GÖSTER
  return (
    <div className="min-h-screen bg-brand-dark text-white flex flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-brand-card border-r border-white/10 flex flex-col">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-2 text-brand-primary">
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M21.58 10.74l-9.14-5.28a1 1 0 00-1 0l-9.14 5.28a1 1 0 00-.5.87v4a1 1 0 00.5.87l9.14 5.28a1 1 0 001 0l9.14-5.28a1 1 0 00.5-.87v-4a1 1 0 00-.5-.87zm-9.64 4.14v-5.76l4.98 2.88-4.98 2.88zm-1.88 0l-4.98-2.88 4.98-2.88v5.76z" /></svg>
            <span className="font-bold text-xl tracking-tight text-white">PRIME<span className="font-light text-gray-400">ADMIN</span></span>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-2 flex flex-col justify-between">
          <a href="#" className="flex items-center gap-3 px-4 py-3 bg-red-950/30 text-brand-primary rounded border border-red-900/50 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
            <span className="font-semibold uppercase tracking-wider text-sm">Dashboard</span>
          </a>
          <button 
            onClick={() => {
              sessionStorage.removeItem("admin_auth");
              setIsAuthenticated(false);
            }}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded text-xs uppercase tracking-wider transition text-left"
          >
            Çıkış Yap
          </button>
        </nav>
      </aside>

      <main className="flex-1 p-6 lg:p-10 overflow-y-auto">
        <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <h1 className="text-3xl font-bold uppercase tracking-wider text-white">Salon Yönetimi</h1>
            <p className="text-gray-400 mt-2">Bekleyen eşleşmeleri onaylayın ve salon doluluğunu yönetin.</p>
          </div>
          <div className="flex-shrink-0">
            <img src="/logo.jpeg" alt="Prime Playstation Logo" className="h-12 md:h-16 w-auto drop-shadow-[0_0_8px_rgba(220,38,38,0.5)]" />
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div className="bg-brand-card p-6 border border-white/10 border-l-4 border-l-brand-primary">
            <p className="text-sm text-gray-400 uppercase tracking-widest mb-1">Bekleyen İstek</p>
            <p className="text-3xl font-bold text-white">{pending.length}</p>
          </div>
          <div className="bg-brand-card p-6 border border-white/10 border-l-4 border-l-green-500">
            <p className="text-sm text-gray-400 uppercase tracking-widest mb-1">Onaylanan (Masa Ayrıldı)</p>
            <p className="text-3xl font-bold text-white">{approved.length}</p>
          </div>
        </div>

        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold uppercase tracking-wider text-brand-primary flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-primary animate-pulse"></span>
              Onay Bekleyenler
            </h2>
          </div>
          
          <div className="bg-brand-card border border-white/10 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-black/50 text-gray-400 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-semibold">Oyuncu Adı</th>
                  <th className="px-6 py-4 font-semibold">Oyun</th>
                  <th className="px-6 py-4 font-semibold">Tarih / Saat</th>
                  <th className="px-6 py-4 font-semibold text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {pending.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">Şu an bekleyen eşleşme isteği bulunmuyor.</td>
                  </tr>
                ) : (
                  pending.map((match) => (
                    <tr key={match.id} className="hover:bg-white/5 transition">
                      <td className="px-6 py-4 font-medium text-white">{match.p1}</td>
                      <td className="px-6 py-4 text-gray-300 font-bold">{match.game}</td>
                      <td className="px-6 py-4">
                        <span className="bg-white/10 px-2 py-1 rounded text-xs mr-2">{match.date}</span>
                        {match.time}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleApprove(match.id)} className="px-4 py-2 bg-green-600/20 text-green-500 border border-green-600/50 hover:bg-green-600 hover:text-white transition text-xs font-bold uppercase tracking-wider">
                            Onayla
                          </button>
                          <button onClick={() => handleReject(match.id)} className="px-4 py-2 bg-red-600/20 text-brand-primary border border-red-600/50 hover:bg-red-600 hover:text-white transition text-xs font-bold uppercase tracking-wider">
                            Reddet
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold uppercase tracking-wider text-green-500 mb-6">
            Kesinleşen Randevular
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {approved.length === 0 ? (
              <p className="text-gray-500">Henüz onaylanmış randevu yok.</p>
            ) : (
              approved.map((match) => (
                <div key={match.id} className="bg-brand-card p-5 border border-white/10 relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
                  
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg text-white">
                        {match.p1} {match.p2 ? <span className="text-gray-500 mx-1">VS</span> : ""} {match.p2}
                      </h3>
                      <p className="text-brand-primary text-sm font-semibold mt-1">{match.game}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400 uppercase">{match.date}</p>
                      <p className="text-lg font-bold text-white">{match.time}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2 pt-4 border-t border-white/5">
                    <span className="flex items-center gap-2 text-xs text-gray-400">
                      <span className="w-2 h-2 rounded-full bg-green-500"></span> Masa Ayrıldı
                    </span>
                    <button 
                      onClick={() => handleReject(match.id)} 
                      className="text-red-500 hover:text-red-400 text-xs font-bold uppercase tracking-wider transition-colors"
                    >
                      SİL
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
