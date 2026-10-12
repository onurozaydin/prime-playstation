"use client";
import { useState } from "react";
import { db } from "../firebase"; 
import { collection, addDoc, serverTimestamp, query, where, getDocs, limit, updateDoc, doc } from "firebase/firestore";

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [playerName, setPlayerName] = useState("");
  const [selectedGame, setSelectedGame] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleMatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const matchesRef = collection(db, "matches");
      
      const q = query(
        matchesRef,
        where("game", "==", selectedGame),
        where("time", "==", selectedTime),
        where("status", "==", "pending"),
        limit(1)
      );

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const matchDoc = querySnapshot.docs[0];
        const matchData = matchDoc.data();

        await updateDoc(doc(db, "matches", matchDoc.id), {
          p2: playerName,
          status: "matched"
        });

        alert(`🔥 EŞLEŞME BULUNDU! ${matchData.p1} adlı oyuncu ile eşleştiniz. Saat ${selectedTime}'da salona bekleniyorsunuz!`);
      } else {
        await addDoc(matchesRef, {
          p1: playerName,
          p2: "",
          game: selectedGame,
          time: selectedTime,
          status: "pending",
          date: "Bugün",
          createdAt: serverTimestamp()
        });

        alert("Talebiniz alındı! Sizinle aynı saatte bu oyunu oynamak isteyen biri olduğunda sistem sizi eşleştirecektir.");
      }
      
      setIsModalOpen(false);
      setPlayerName("");
      setSelectedGame("");
      setSelectedTime("");
    } catch (error) {
      console.error("Veritabanı Hatası:", error);
      alert("Bir hata oluştu. Lütfen bağlantınızı kontrol edin.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="antialiased min-h-screen flex flex-col relative overflow-x-hidden scroll-smooth bg-black text-white">
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[120px] -z-10 pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-white/5 rounded-full blur-[120px] -z-10 pointer-events-none"></div>

      {/* Navigasyon */}
      <nav className="fixed w-full z-50 glass-nav transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            
            {/* LOGO VE MARKA ADI BİR ARADA */}
            <div className="flex items-center gap-3 cursor-pointer">
              <img 
                src="/logo.jpeg" 
                alt="Prime Playstation Logo" 
                className="h-11 w-auto rounded drop-shadow-[0_0_8px_rgba(220,38,38,0.5)]" 
              />
              <span className="font-extrabold text-lg sm:text-xl tracking-wider text-white">
                PRIME <span className="text-brand-primary">PLAYSTATION</span>
              </span>
            </div>
            
            <div className="hidden md:flex space-x-8">
              <a href="#nasil-calisir" className="text-sm font-medium text-gray-400 hover:text-white transition">Nasıl Çalışır?</a>
              <a href="#oyunlar" className="text-sm font-medium text-gray-400 hover:text-white transition">Oyunlar</a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Bölümü */}
      <main className="flex-grow flex flex-col justify-center pt-32 pb-16 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-950/30 border border-red-600/30 text-red-500 text-xs font-bold mb-6 tracking-wide">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
            EŞLEŞTİRME SİSTEMİ AKTİF
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight uppercase">
            Oyun Arkadaşını Bul <br />
            <span className="gradient-text">Rekabete Katıl.</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Oynamak istediğin oyunu ve saati seç, seninle aynı heyecanı paylaşan rakiplerinle eşleş. Prime Playstation salonunda koltuğun hazır.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-brand-primary hover:bg-brand-primary_hover text-white font-bold py-4 px-8 rounded-none border-2 border-brand-primary shadow-[0_0_15px_rgba(220,38,38,0.4)] transition-all transform hover:-translate-y-1 uppercase tracking-wider"
            >
              HEMEN EŞLEŞME BUL
            </button>
            <a href="#oyunlar" className="inline-flex justify-center items-center bg-transparent hover:bg-white/5 border-2 border-white/20 text-white font-bold py-4 px-8 rounded-none transition-all uppercase tracking-wider">
              OYUNLARI İNCELE
            </a>
          </div>
        </div>
      </main>

      {/* Oyunlar Bölümü */}
      <section id="oyunlar" className="py-20 border-t border-white/10 relative z-10 bg-[#050505]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold mb-4 uppercase tracking-wider text-white">
              OYUN <span className="text-brand-primary">KATALOĞU</span>
            </h2>
            <p className="text-gray-400">Salondaki favori oyunlarımız. Ekibini topla, rekabete başla.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
            <div className="feature-card bg-brand-card border border-white/10 p-3 flex flex-col justify-between group rounded-lg hover:border-brand-primary transition">
              <div className="aspect-[3/4] bg-black relative mb-4 overflow-hidden rounded-md border border-white/5">
                <img src="/images/fifa27.jpg" alt="FIFA 27" className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
              </div>
              <div className="text-left px-1">
                <h3 className="font-bold text-white text-base uppercase tracking-wide">FIFA 27</h3>
                <p className="text-xs text-gray-500 mt-1">Spor / Futbol</p>
              </div>
            </div>
            
            <div className="feature-card bg-brand-card border border-white/10 p-3 flex flex-col justify-between group rounded-lg hover:border-brand-primary transition">
              <div className="aspect-[3/4] bg-black relative mb-4 overflow-hidden rounded-md border border-white/5">
                <img src="/images/pes21.jpg" alt="PES 21" className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
              </div>
              <div className="text-left px-1">
                <h3 className="font-bold text-white text-base uppercase tracking-wide">PES 21</h3>
                <p className="text-xs text-gray-500 mt-1">Spor / Futbol</p>
              </div>
            </div>

            <div className="feature-card bg-brand-card border border-white/10 p-3 flex flex-col justify-between group rounded-lg hover:border-brand-primary transition">
              <div className="aspect-[3/4] bg-black relative mb-4 overflow-hidden rounded-md border border-white/5">
                <img src="/images/mk1.jpg" alt="Mortal Kombat 1" className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
              </div>
              <div className="text-left px-1">
                <h3 className="font-bold text-white text-base uppercase tracking-wide">Mortal Kombat 1</h3>
                <p className="text-xs text-gray-500 mt-1">Dövüş</p>
              </div>
            </div>

            <div className="feature-card bg-brand-card border border-white/10 p-3 flex flex-col justify-between group rounded-lg hover:border-brand-primary transition">
              <div className="aspect-[3/4] bg-black relative mb-4 overflow-hidden rounded-md border border-white/5">
                <img src="/images/mk11.jpg" alt="Mortal Kombat 11" className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
              </div>
              <div className="text-left px-1">
                <h3 className="font-bold text-white text-base uppercase tracking-wide">Mortal Kombat 11</h3>
                <p className="text-xs text-gray-500 mt-1">Dövüş</p>
              </div>
            </div>

            <div className="feature-card bg-brand-card border border-white/10 p-3 flex flex-col justify-between group rounded-lg hover:border-brand-primary transition">
              <div className="aspect-[3/4] bg-black relative mb-4 overflow-hidden rounded-md border border-white/5">
                <img src="/images/overcooked2.jpg" alt="Overcooked 2" className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
              </div>
              <div className="text-left px-1">
                <h3 className="font-bold text-white text-base uppercase tracking-wide">Overcooked 2</h3>
                <p className="text-xs text-gray-500 mt-1">Co-op / Eğlence</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Nasıl Çalışır Bölümü */}
      <section id="nasil-calisir" className="py-20 border-t border-white/10 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4 uppercase tracking-wider">Nasıl Çalışır?</h2>
            <p className="text-gray-400">Sadece 3 adımda oyun arkadaşını bul ve salona gel.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="feature-card bg-brand-card rounded-none p-8 border border-white/10 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-brand-primary"></div>
              <div className="w-12 h-12 bg-red-950/50 flex items-center justify-center mb-6 text-brand-primary font-bold text-xl border border-red-900/50">1</div>
              <h3 className="text-xl font-bold mb-3 uppercase">Oyununu Seç</h3>
              <p className="text-gray-400 text-sm leading-relaxed">FIFA 27, PES 21, Mortal Kombat ve Overcooked 2. Oynamak istediğin favori oyununu katalogdan belirle.</p>
            </div>
            <div className="feature-card bg-brand-card rounded-none p-8 border border-white/10 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-white"></div>
              <div className="w-12 h-12 bg-white/5 flex items-center justify-center mb-6 text-white font-bold text-xl border border-white/10">2</div>
              <h3 className="text-xl font-bold mb-3 uppercase">Saatini Belirle</h3>
              <p className="text-gray-400 text-sm leading-relaxed">Sana en uygun zaman dilimini seç. Eşleştirme algoritması seninle aynı saatte oynamak isteyenleri bulsun.</p>
            </div>
            <div className="feature-card bg-brand-card rounded-none p-8 border border-white/10 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-brand-primary"></div>
              <div className="w-12 h-12 bg-red-950/50 flex items-center justify-center mb-6 text-brand-primary font-bold text-xl border border-red-900/50">3</div>
              <h3 className="text-xl font-bold mb-3 uppercase">Salona Gel</h3>
              <p className="text-gray-400 text-sm leading-relaxed">Eşleşme bulunduğunda anında bildirim al. Seçtiğin saatte Prime Playstation'a gel ve oyunun tadını çıkar.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-white/10 text-center text-gray-500 text-sm relative z-10 bg-brand-card">
        <p>&copy; 2026 Prime Playstation. Tüm hakları saklıdır.</p>
      </footer>

      {/* MODAL (Eşleşme Formu) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => !isSubmitting && setIsModalOpen(false)}></div>
          <div className="relative bg-brand-card border border-white/10 w-full max-w-lg p-8 shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-1 bg-brand-primary"></div>
            <button
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
              className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h2 className="text-2xl font-bold uppercase mb-6 text-white tracking-wider">Eşleşme <span className="text-brand-primary">Oluştur</span></h2>
            
            <form onSubmit={handleMatchSubmit}>
              <div className="mb-6">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Oyuncu Adı (Rumuz)</label>
                <input 
                  type="text" 
                  required 
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Örn: KralOyuncu99"
                  className="w-full bg-black border border-white/20 text-white px-4 py-3 rounded-none focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors" 
                />
              </div>

              <div className="mb-6">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Oyun Seçiniz</label>
                <div className="relative">
                  <select 
                    required 
                    value={selectedGame}
                    onChange={(e) => setSelectedGame(e.target.value)}
                    className="w-full bg-black border border-white/20 text-white px-4 py-3 rounded-none focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary appearance-none transition-colors"
                  >
                    <option value="" disabled>Oyun seçin...</option>
                    <option value="FIFA 27">FIFA 27</option>
                    <option value="PES 21">PES 21</option>
                    <option value="Mortal Kombat 1">Mortal Kombat 1</option>
                    <option value="Mortal Kombat 11">Mortal Kombat 11</option>
                    <option value="Overcooked 2">Overcooked 2</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Saat Belirleyiniz</label>
                <input 
                  type="time" 
                  required 
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="w-full bg-black border border-white/20 text-white px-4 py-3 rounded-none focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors" 
                />
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-brand-primary hover:bg-brand-primary_hover disabled:bg-gray-700 disabled:shadow-none text-white font-bold py-4 px-8 rounded-none border-2 border-brand-primary shadow-[0_0_15px_rgba(220,38,38,0.4)] transition-all uppercase tracking-wider flex justify-center items-center"
              >
                {isSubmitting ? (
                  <span className="animate-pulse">GÖNDERİLİYOR...</span>
                ) : (
                  "EŞLEŞMEYİ BAŞLAT"
                )}
              </button>
            </form>

          </div>
        </div>
      )}
    </div>
  );
}