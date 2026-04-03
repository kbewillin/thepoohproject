import { useState } from 'react';
import MainPage from './MainPage';

function App() {
  const [answer, setAnswer] = useState('');
  const [status, setStatus] = useState({ message: '', color: '' });
  const [isAuth, setIsAuth] = useState(false);

  const handleSubmit = async () => {
    try {
      const res = await fetch('http://127.0.0.1:3000/api/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer: answer.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setStatus({ message: data.message, color: 'text-emerald-600' });
        setTimeout(() => setIsAuth(true), 1000);
      } else {
        setStatus({ message: data.message, color: 'text-rose-500' });
      }
    } catch (err) {
      setStatus({ message: "Backend is taking a nap...", color: 'text-amber-600' });
    }
  };

  if (!isAuth) {
    return (
      <div className="min-h-screen bg-[#ffdae3] flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white/40 backdrop-blur-xl border-4 border-white p-10 rounded-[3rem] shadow-2xl text-center space-y-8">
          <h1 className="text-4xl font-black text-rose-900 italic">The Pink Gate</h1>
          <p className="text-rose-700 font-medium">"The best colour to exist?"</p>
          <input 
            type="text" value={answer} placeholder="Type it here..."
            className="w-full bg-white/50 border-2 border-rose-200 rounded-2xl p-4 text-rose-900 text-center font-bold"
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />
          <button onClick={handleSubmit} className="w-full bg-white text-rose-400 font-black py-4 rounded-2xl shadow-lg hover:bg-rose-400 hover:text-white transition-all">Unlock Memories</button>
          <p className={`${status.color} font-bold animate-pulse`}>{status.message}</p>
        </div>
      </div>
    );
  }
  return <MainPage />;
}
export default App;