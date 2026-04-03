import { useState, useEffect } from 'react';
import PoemPage from './PoemPage';
import DiaryPage from './DiaryPage';
import PostPage from './PostPage';

const FallingHearts = () => {
  const hearts = Array.from({ length: 25 });
  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      {hearts.map((_, i) => (
        <div key={i} className="animate-heart absolute text-rose-400/40"
          style={{
            left: `${Math.random() * 100}%`, top: `-50px`,
            animationDuration: `${Math.random() * 12 + 8}s`,
            animationDelay: `${Math.random() * 10}s`,
            fontSize: `${Math.random() * 24 + 12}px`,
          }}>❤️</div>
      ))}
    </div>
  );
};

export default function MainPage() {
  const [posts, setPosts] = useState([]);
  const [activeTab, setActiveTab] = useState('Home'); // Control which page is visible
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetch('http://127.0.0.1:3000/api/gallery')
      .then(res => res.json())
      .then(data => setPosts(data))
      .catch(err => console.error("Fetch error:", err));
  }, []);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("This photo is a bit too big! Please pick one under 5MB. 🌸");
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const res = await fetch('http://127.0.0.1:3000/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            image_data: reader.result, 
            caption: "Memory", 
            date: new Date().toLocaleDateString('en-GB') 
          })
        });

        if (res.ok) {
          alert("Memory saved to the jar! 🍯");
          window.location.reload(); 
        } else {
          const msg = await res.text();
          alert(`Upload failed: ${msg}`);
        }
      } catch (err) {
        alert("Lost connection to the backend!");
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateCaption = async (post, newCaption) => {
    try {
      const res = await fetch('http://127.0.0.1:3000/api/update-caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...post, caption: newCaption })
      });

      if (res.ok) {
        setPosts(posts.map(p => 
          p.image_data === post.image_data ? { ...p, caption: newCaption } : p
        ));
      }
    } catch (err) {
      alert("Could not update caption.");
    }
  };

  const handleDelete = async (postToDelete) => {
    if (!window.confirm("Remove this memory forever? 🥺")) return;

    try {
      const res = await fetch('http://127.0.0.1:3000/api/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postToDelete)
      });

      if (res.ok) {
        setPosts(posts.filter(p => p.image_data !== postToDelete.image_data));
      }
    } catch (err) {
      alert("Could not delete memory.");
    }
  };

  return (
    <div className="bg-[#ffeef2] text-rose-900 font-serif min-h-screen">
      <FallingHearts />

      {/* FIXED HEADER: Now with buttons that work */}
      <nav className="fixed top-0 left-0 w-full flex justify-center space-x-12 py-6 bg-white/30 backdrop-blur-md z-[100] border-b border-rose-200">
        <button 
          onClick={() => setActiveTab('Home')}
          className={`text-sm font-bold uppercase tracking-widest transition-colors ${activeTab === 'Home' ? 'text-rose-400 border-b-2 border-rose-400' : 'text-rose-700 hover:text-rose-400'}`}
        >
          Home
        </button>
        <button 
          onClick={() => setActiveTab('Poem')}
          className={`text-sm font-bold uppercase tracking-widest transition-colors ${activeTab === 'Poem' ? 'text-rose-400 border-b-2 border-rose-400' : 'text-rose-700 hover:text-rose-400'}`}
        >
          Poem
        </button>
        <button 
          onClick={() => setActiveTab('Daily Diary')}
          className={`text-sm font-bold uppercase tracking-widest transition-colors ${activeTab === 'Daily Diary' ? 'text-rose-400 border-b-2 border-rose-400' : 'text-rose-700 hover:text-rose-400'}`}
        >
          Daily Diary
        </button>
        <button 
          onClick={() => setActiveTab('Post')}
          className={`text-sm font-bold uppercase tracking-widest transition-colors ${activeTab === 'Post' ? 'text-rose-400 border-b-2 border-rose-400' : 'text-rose-700 hover:text-rose-400'}`}
        >
          Post
        </button>
      </nav>

      {/* PAGE CONTENT SWITCHER */}
      {activeTab === 'Poem' ? (
        <PoemPage />
      ) : activeTab === 'Daily Diary' ? (
        <DiaryPage />
     ) : activeTab === 'Post' ? (
        <PostPage />
      ) : (
        <>
          {/* Hero Section */}
          <section className="h-screen flex flex-col items-center justify-center bg-rose-200 pt-20">
            <h1 className="text-6xl md:text-8xl font-black text-white drop-shadow-lg text-center px-4">
              THE <span className="text-rose-400">POOH</span> WEBSITE
            </h1>
            <p className="text-rose-500 italic mt-4 text-xl font-medium tracking-wide">(Portfolio of us)</p>
          </section>

          {/* Floating Action Button for Upload */}
          <label className="fixed bottom-10 right-10 z-[10000] cursor-pointer bg-white p-5 rounded-full shadow-2xl border-2 border-rose-100 hover:scale-110 transition-transform">
            <span className="text-2xl">{isUploading ? "⏳" : "📸"}</span>
            <input type="file" className="hidden" accept="image/*" onChange={handleUpload} />
          </label>

          {/* Photo Stream */}
          {posts.map((post, index) => (
            <section key={index} className="h-screen w-full flex items-center justify-center sticky top-0 bg-[#ffeef2] pt-20">
              <div className="relative group w-full max-w-4xl h-[70vh] rounded-[3rem] overflow-hidden border-[12px] border-white shadow-2xl">
               
<button 
  onClick={(e) => { 
    e.stopPropagation(); 
    handleDelete(post); 
  }}
  className="absolute top-4 left-4 z-50 bg-black/20 hover:bg-rose-500/80 text-white w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center text-xl font-light shadow-sm"
>
  ×
</button>
                <img src={post.image_data} className="w-full h-full object-cover" alt="Memory" />
                <div 
                  className="absolute bottom-6 right-6 bg-white px-8 py-3 rounded-2xl shadow-md border border-rose-50 border-l-8 border-l-rose-300 cursor-pointer min-w-[200px]"
                  onClick={() => {
                    const newCaption = window.prompt("Update your caption:", post.caption);
                    if (newCaption !== null && newCaption !== post.caption) {
                      handleUpdateCaption(post, newCaption);
                    }
                  }}
                >
                  <p className="text-rose-400 font-black tracking-tight text-xl italic hover:text-rose-600 transition-colors">
                    {post.caption || "Click to add caption..."}
                  </p>
                </div>
              </div>
            </section>
          ))}

          {/* Proposal Section */}
          <section className="h-screen bg-[#ffdae3] flex flex-col items-center justify-center space-y-12 pt-20">
            <h2 className="text-6xl md:text-8xl font-black text-white drop-shadow-md text-center">
              Will you be my <br/>
              <span className="text-rose-500">Valentine?</span> 🌹
            </h2>
            <div className="flex gap-8">
              <button onClick={() => alert("Yay! ❤️")} className="bg-white text-rose-500 px-14 py-5 rounded-full font-black text-3xl shadow-2xl hover:scale-110 transition-transform active:scale-95 cursor-pointer relative z-[60]">
                YES!
              </button>
              <button 
                onMouseEnter={(e) => { 
                  e.target.style.position = 'fixed'; 
                  e.target.style.left = Math.random() * 80 + '%'; 
                  e.target.style.top = Math.random() * 80 + '%'; 
                }}
                className="bg-rose-200 text-rose-400 px-10 py-4 rounded-full font-bold text-xl opacity-80"
              >
                No
              </button>
            </div>
          </section>
        </>
      )}
    </div>
  );
}