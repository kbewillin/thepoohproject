import { useState, useEffect } from 'react';

export default function DiaryPage() {
  const [entries, setEntries] = useState([]);
  const [text, setText] = useState('');

  useEffect(() => {
    fetch('http://127.0.0.1:3000/api/diary')
      .then(res => res.json())
      .then(setEntries);
  }, []);

  // --- THE DELETE FUNCTION (Ensure it is inside the export function) ---
  const handleDelete = async (entryToDelete) => {
    if (!window.confirm("Delete this entry forever? 🥺")) return;

    try {
      const res = await fetch('http://127.0.0.1:3000/api/delete-diary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entryToDelete)
      });

      if (res.ok) {
        // UI Update: Filters out the deleted entry immediately
        setEntries(prev => prev.filter(e => 
          !(e.date === entryToDelete.date && e.content === entryToDelete.content)
        ));
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const handleSave = async () => {
    if (!text) return;
    const now = new Date();
    const timestamp = `${now.toLocaleDateString('en-GB')} | ${now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true })}`;

    await fetch('http://127.0.0.1:3000/api/diary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: timestamp, content: text })
    });
    setText('');
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-[#fffafa] pt-32 px-10 font-serif">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-rose-800 mb-8 italic">Dear Diary...</h1>
        
        {/* Writing Area */}
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-rose-100 mb-10">
          <textarea 
            className="w-full h-32 outline-none text-rose-900 resize-none bg-transparent"
            placeholder="How was your day?"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button onClick={handleSave} className="mt-4 bg-rose-400 text-white px-6 py-2 rounded-full font-bold">
            Save Today
          </button>
        </div>

        {/* Display Entries */}
        <div className="space-y-6 pb-20">
          {entries.slice().reverse().map((entry, i) => (
            <div key={i} className="relative group bg-white p-8 rounded-3xl shadow-sm border border-rose-50 hover:shadow-md transition-all">
              
              {/* THE REMOVE BUTTON - Should now light up in your editor */}
              <button 
                onClick={() => handleDelete(entry)}
                className="absolute top-4 right-4 text-rose-200 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity text-xl"
              >
                ×
              </button>

              <span className="text-xs font-bold text-rose-300 uppercase tracking-widest block mb-3">
                {entry.date}
              </span>
              <p className="text-rose-900 italic leading-relaxed whitespace-pre-wrap">
                {entry.content}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}