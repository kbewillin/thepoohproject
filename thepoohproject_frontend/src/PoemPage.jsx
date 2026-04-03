import { useState, useEffect } from 'react';

export default function PoemPage() {
  const [poems, setPoems] = useState([]);
  const [selectedPoem, setSelectedPoem] = useState(null);
  const [isWriting, setIsWriting] = useState(false);
  const [newPoem, setNewPoem] = useState({ title: '', content: '' });

  // Fetch poems from the backend
  useEffect(() => {
    fetch('http://127.0.0.1:3000/api/poems')
      .then(res => res.json())
      .then(data => setPoems(data));
  }, []);

  const handleSave = async () => {
    if (!newPoem.title || !newPoem.content) return;
    const res = await fetch('http://127.0.0.1:3000/api/poems', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPoem)
    });
    if (res.ok) window.location.reload();
  };

  return (
    <div className="min-h-screen bg-[#fffafa] flex pt-24 font-serif">
      {/* LEFT SIDE: The Archive List */}
      <div className="w-1/3 border-r border-rose-100 p-8 overflow-y-auto h-[calc(100vh-6rem)]">
        <h2 className="text-2xl font-bold text-rose-800 mb-6 italic border-b border-rose-100 pb-2">Archive</h2>
        
        <button 
          onClick={() => { setIsWriting(true); setSelectedPoem(null); }}
          className="w-full py-3 mb-6 border-2 border-dashed border-rose-200 text-rose-400 rounded-xl hover:bg-rose-50 transition-all font-bold"
        >
          + Pen a New Poem
        </button>
        
        <div className="space-y-3">
          {poems.map((p, i) => (
            <div 
              key={i} 
              onClick={() => { setSelectedPoem(p); setIsWriting(false); }}
              className={`p-4 rounded-xl cursor-pointer transition-all border ${
                selectedPoem?.title === p.title 
                ? 'bg-rose-50 border-rose-200 shadow-sm' 
                : 'hover:bg-rose-50/50 border-transparent'
              }`}
            >
              <h3 className="font-bold text-rose-700 truncate">{p.title}</h3>
              <p className="text-[10px] uppercase tracking-widest text-rose-300">View Manuscript</p>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT SIDE: The Writing/Reading Paper */}
      <div className="w-2/3 p-12 flex justify-center bg-[#fcf8f2]">
        <div className="w-full max-w-2xl bg-[#fffefc] shadow-xl p-16 rounded-sm border-t-[40px] border-rose-100 relative min-h-[70vh] flex flex-col">
          
          {/* Decorative Paper Element */}
          <div className="absolute top-[-20px] left-1/2 -translate-x-1/2 w-20 h-10 bg-rose-50/50 rounded-full blur-xl"></div>

          {isWriting ? (
            <div className="flex flex-col h-full space-y-6">
              <input 
                placeholder="Title of the Poem..."
                className="text-4xl font-bold bg-transparent outline-none text-rose-900 placeholder:text-rose-200"
                onChange={e => setNewPoem({...newPoem, title: e.target.value})}
              />
              <textarea 
                placeholder="Write your heart out here..."
                className="flex-grow bg-transparent outline-none text-xl text-rose-800 leading-relaxed italic placeholder:text-rose-100 resize-none"
                onChange={e => setNewPoem({...newPoem, content: e.target.value})}
              />
              <button 
                onClick={handleSave} 
                className="bg-rose-400 text-white px-10 py-3 rounded-full self-end shadow-lg hover:bg-rose-500 transition-colors font-bold uppercase tracking-widest text-sm"
              >
                Seal with a Kiss 💌
              </button>
            </div>
          ) : selectedPoem ? (
            <div className="animate-fadeIn">
              <h1 className="text-5xl font-black text-rose-900 mb-10 decoration-rose-200 underline underline-offset-8 decoration-2 leading-tight">
                {selectedPoem.title}
              </h1>
              <p className="text-2xl text-rose-800 whitespace-pre-wrap leading-[2.5rem] italic font-medium">
                {selectedPoem.content}
              </p>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-rose-200 italic space-y-4">
               <span className="text-6xl">🖋️</span>
               <p className="text-xl">Select a manuscript from the archive or begin a new one.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}