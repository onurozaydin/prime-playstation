"use client";
import { useState, useEffect } from "react";
import { db, auth, googleProvider } from "../firebase"; 
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  where, 
  getDocs, 
  limit, 
  updateDoc, 
  doc, 
  onSnapshot, 
  orderBy 
} from "firebase/firestore";
import { signInWithPopup, signOut, onAuthStateChanged, User } from "firebase/auth";

interface MatchData {
  id: string;
  p1: string;
  p2: string;
  p1_id?: string;
  p2_id?: string;
  game: string;
  time: string;
  status: string;
}

interface ChatMessage {
  id: string;
  senderName: string;
  senderId: string;
  text: string;
  createdAt: any;
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Aktif Eşleşme ve Sohbet State'leri
  const [activeMatch, setActiveMatch] = useState<MatchData | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Kullanıcı oturumunu dinle
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Kullanıcının aktif eşleşmesini dinle
  useEffect(() => {
    if (!user) {
      setActiveMatch(null);
      return;
    }

    const q = query(
      collection(db, "matches"),
      where("status", "==", "matched")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const matchedDoc = snapshot.docs.find(d => {
        const data = d.data();
        return data.p1_id === user.uid || data.p2_id === user.uid;
      });

      if (matchedDoc) {
        setActiveMatch({ id: matchedDoc.id, ...matchedDoc.data() } as MatchData);
        setIsChatOpen(true);
      }
    });

    return () => unsubscribe();
  }, [user]);

  // Sohbet mesajlarını dinle
  useEffect(() => {
    if (!activeMatch) return;

    const messagesRef = collection(db, "matches", activeMatch.id, "messages");
    const q = query(messagesRef, orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: ChatMessage[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ChatMessage));
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [activeMatch]);

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Giriş Hatası:", error);
      alert("Giriş yapılırken bir hata oluştu.");
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setActiveMatch(null);
    setIsChatOpen(false);
  };

  const handleMatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("Eşleşme bulabilmek için önce giriş yapmalısınız!");
      handleGoogleLogin();
      return;
    }

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
          p2: user.displayName || "Oyuncu 2",
          p2_id: user.uid,
          status: "matched"
        });

        alert(`🔥 EŞLEŞME BULUNDU! ${matchData.p1} ile eşleştiniz. Sohbet kutusundan taktikleri konuşabilirsiniz!`);
      } else {
        await addDoc(matchesRef, {
          p1: user.displayName || "Oyuncu 1",
          p1_id: user.uid,
          p2: "",
          p2_id: "",
          game: selectedGame,
          time: selectedTime,
          status: "pending",
          date: "Bugün",
          createdAt: serverTimestamp()
        });

        alert("Talebiniz alındı! Uygun bir rakip bulunduğunda anında eşleşeceksiniz.");
      }
      
      setIsModalOpen(false);
      setSelectedGame("");
      setSelectedTime("");
    } catch (error) {
      console.error("Hata:", error);
      alert("Bir hata oluştu. Lütfen bağlantınızı kontrol edin.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeMatch || !user) return;

    try {
      const messagesRef = collection(db, "matches", activeMatch.id, "messages");
      await addDoc(messagesRef, {
        senderId: user.uid,
        senderName: user.displayName || "Oyuncu",
        text: newMessage.trim(),
        createdAt: serverTimestamp()
      });
      setNewMessage("");
    } catch (error) {
      console.error("Mesaj gönderme hatası:", error);
    }
  };

  return (
    <div className="antialiased min-h-screen flex flex-col relative overflow-x-hidden scroll-smooth bg-black text-white">
      {/* Arkaplan Parıltıları */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[120px] -z-10 pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-white/5 rounded-full blur-[120px] -z-10 pointer-events-none"></div>

      {/* Navigasyon */}
      <nav className="fixed w-full z-50 glass-nav transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
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
            
            <div className="flex items-center gap-6">
              <div className="hidden md:flex space-x-6">
                <a href="#nasil-calisir" className="text-sm font-medium text-gray-400 hover:text-white transition">Nasıl Çalışır?</a>
                <a href="#oyunlar" className="text-sm font-medium text-gray-400 hover:text-white transition">Oyunlar</a>
              </div>

              {/* Kullanıcı Giriş/Profil Alanı */}
              {user ? (
                <div className="flex items-center gap-3 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                  {user.photoURL && (
                    <img src={user.photoURL} alt="Profil" className="w-7 h-7 rounded-full border border-red-500" />
                  )}
                  <span className="text-xs font-bold text-gray-300 hidden sm:inline">{user.displayName}</span>
                  <button 
                    onClick={handleLogout}
                    className="text-xs text-red-500 hover:text-red-400 font-semibold"
                  >
                    Çıkış
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleGoogleLogin}
                  className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold py-2 px-4 rounded border border-white/20 transition flex items-center gap-2"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M12.24 10.285V13.4h6.887C18.2 15.6 16.2 17.1 12.24 17.1c-3.1 0-5.7-2.6-5.7-5.7s2.6-5.7 5.7-5.7c1.4 0 2.7.5 3.7 1.4l2.4-2.4C16.8 3.2 14.6 2.5 12.24 2.5 7.1 2.5 3 6.6 3 11.75s4.1 9.25 9.24 9.25c5.3 0 8.8-3.7 8.8-8.95 0-.6-.1-1.2-.2-1.75h-8.6z"/>
                  </svg>
                  GİRİŞ YAP
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
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
              onClick={() => {
                if (!user) {
                  alert("Eşleşme bulmak için lütfen önce giriş yapın.");
                  handleGoogleLogin();
                } else {
                  setIsModalOpen(true);
                }
              }}
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

      {/* Oyunlar */}
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

      {/* Footer */}
      <footer className="py-8 border-t border-white/10 text-center text-gray-500 text-sm relative z-10 bg-brand-card">
        <p>&copy; 2026 Prime Playstation. Tüm hakları saklıdır.</p>
      </footer>

      {/* EŞLEŞME FORMU MODALI */}
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
              ✕
            </button>
            <h2 className="text-2xl font-bold uppercase mb-6 text-white tracking-wider">Eşleşme <span className="text-brand-primary">Oluştur</span></h2>
            
            <form onSubmit={handleMatchSubmit}>
              <div className="mb-4">
                <p className="text-xs text-gray-400">Giriş Yapılan Oyuncu:</p>
                <p className="text-sm font-bold text-white">{user?.displayName}</p>
              </div>

              <div className="mb-6">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Oyun Seçiniz</label>
                <select 
                  required 
                  value={selectedGame}
                  onChange={(e) => setSelectedGame(e.target.value)}
                  className="w-full bg-black border border-white/20 text-white px-4 py-3 rounded-none focus:outline-none focus:border-brand-primary transition-colors"
                >
                  <option value="" disabled>Oyun seçin...</option>
                  <option value="FIFA 27">FIFA 27</option>
                  <option value="PES 21">PES 21</option>
                  <option value="Mortal Kombat 1">Mortal Kombat 1</option>
                  <option value="Mortal Kombat 11">Mortal Kombat 11</option>
                  <option value="Overcooked 2">Overcooked 2</option>
                </select>
              </div>

              <div className="mb-8">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Saat Belirleyiniz</label>
                <input 
                  type="time" 
                  required 
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="w-full bg-black border border-white/20 text-white px-4 py-3 rounded-none focus:outline-none focus:border-brand-primary transition-colors" 
                />
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-brand-primary hover:bg-brand-primary_hover disabled:bg-gray-700 text-white font-bold py-4 px-8 rounded-none border-2 border-brand-primary shadow-[0_0_15px_rgba(220,38,38,0.4)] transition-all uppercase tracking-wider"
              >
                {isSubmitting ? "GÖNDERİLİYOR..." : "EŞLEŞMEYİ BAŞLAT"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CANLI SOHBET KUTUSU (EŞLEŞİNCE AÇILIR) */}
      {activeMatch && (
        <div className="fixed bottom-4 right-4 z-50 w-80 sm:w-96 bg-zinc-950 border border-red-600/40 shadow-2xl rounded-lg overflow-hidden flex flex-col">
          {/* Sohbet Başlığı */}
          <div 
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="bg-brand-primary text-white p-3 flex justify-between items-center cursor-pointer select-none"
          >
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse"></span>
              <span className="text-xs font-bold uppercase tracking-wider">
                Eşleşme Odası ({activeMatch.game})
              </span>
            </div>
            <button className="text-xs font-bold">{isChatOpen ? "▼" : "▲"}</button>
          </div>

          {/* Sohbet Gövdesi */}
          {isChatOpen && (
            <div className="flex flex-col h-80 bg-zinc-900/90">
              <div className="p-2 bg-black/40 border-b border-white/5 text-[11px] text-gray-400 text-center">
                Rakip: <strong className="text-white">{activeMatch.p1_id === user?.uid ? activeMatch.p2 : activeMatch.p1}</strong> | Saat: <strong className="text-white">{activeMatch.time}</strong>
              </div>

              {/* Mesaj Listesi */}
              <div className="flex-1 p-3 overflow-y-auto space-y-2">
                {messages.length === 0 ? (
                  <p className="text-xs text-center text-gray-500 mt-6">Henüz mesaj yok. Rakibinize selam verin!</p>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.senderId === user?.uid;
                    return (
                      <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                        <span className="text-[10px] text-gray-500 mb-0.5">{msg.senderName}</span>
                        <div className={`p-2 rounded max-w-[80%] text-xs ${isMe ? "bg-red-600 text-white" : "bg-zinc-800 text-gray-200"}`}>
                          {msg.text}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Mesaj Gönderme Formu */}
              <form onSubmit={handleSendMessage} className="p-2 border-t border-white/10 flex gap-2 bg-black">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Mesaj yazın..."
                  className="flex-1 bg-zinc-900 border border-white/20 text-white px-3 py-1.5 text-xs rounded focus:outline-none focus:border-red-500"
                />
                <button
                  type="submit"
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 text-xs font-bold rounded"
                >
                  Gönder
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}