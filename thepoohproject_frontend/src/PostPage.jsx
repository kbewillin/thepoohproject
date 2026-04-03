import { useState, useEffect, useRef } from 'react';

export default function PostPage() {
  const [livePosts, setLivePosts] = useState([]);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    fetch('http://127.0.0.1:3000/api/live-posts')
      .then(res => res.json())
      .then(setLivePosts)
      .catch(err => console.error("Error fetching live posts:", err));
  }, []);

  const startCamera = async () => {
    try {
      setIsCameraOpen(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      alert("Please allow camera access to take live moments! 📸");
    }
  };

  const takePhoto = () => {
    const context = canvasRef.current.getContext('2d');
    // We capture at the size of the video element
    context.drawImage(videoRef.current, 0, 0, 640, 480);
    setCapturedImage(canvasRef.current.toDataURL('image/jpeg'));
  };

  const savePost = async () => {
    const now = new Date();
    const timestamp = `${now.toLocaleDateString('en-GB')} | ${now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true })}`;
    
    const response = await fetch('http://127.0.0.1:3000/api/live-posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        image_data: capturedImage, 
        caption: "Live Moment", 
        timestamp: timestamp 
      })
    });

    if (response.ok) {
      setCapturedImage(null);
      // Refresh local list
      const updated = await fetch('http://127.0.0.1:3000/api/live-posts').then(r => r.json());
      setLivePosts(updated);
    }
  };

  return (
    <div className="min-h-screen bg-[#fffafa] pt-32 pb-10 font-serif overflow-hidden">
      <div className="max-w-6xl mx-auto px-6">
        
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-rose-800 italic">Live Feed 📸</h1>
          <p className="text-rose-400 text-sm mt-1 uppercase tracking-widest font-bold">Captured in the Moment</p>
        </header>

        {/* CAMERA VIEWPORT */}
        <div className="flex justify-center mb-12">
          <div className="w-full max-w-md bg-white p-3 rounded-[2.5rem] shadow-2xl border-4 border-white relative">
            {!isCameraOpen ? (
              <button onClick={startCamera} className="w-full h-64 bg-rose-50 rounded-[2rem] text-rose-300 font-bold flex flex-col items-center justify-center gap-2 hover:bg-rose-100 transition-colors">
                <span className="text-4xl">📷</span>
                Open Viewfinder
              </button>
            ) : (
              <div className="relative group overflow-hidden rounded-[2rem]">
                <video ref={videoRef} autoPlay playsInline className="w-full h-64 object-cover" />
                <button 
                  onClick={takePhoto} 
                  className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 text-rose-500 w-14 h-14 rounded-full shadow-lg flex items-center justify-center border-4 border-rose-100 active:scale-90 transition-transform"
                >
                  <div className="w-8 h-8 rounded-full border-2 border-rose-500" />
                </button>
              </div>
            )}
            
            <canvas ref={canvasRef} width="640" height="480" className="hidden" />
            
            {/* Capture Preview Overlay */}
            {capturedImage && (
              <div className="absolute inset-0 bg-white rounded-[2.5rem] p-3 flex flex-col items-center z-10">
                <img src={capturedImage} className="w-full h-48 object-cover rounded-[1.5rem] border-2 border-rose-50" />
                <div className="flex gap-4 mt-4">
                  <button onClick={() => setCapturedImage(null)} className="text-rose-300 font-bold text-sm underline">Retake</button>
                  <button onClick={savePost} className="bg-rose-400 text-white px-6 py-2 rounded-full font-bold shadow-md hover:bg-rose-500">Post Live</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* HORIZONTAL GALLERY (The Film Strip) */}
        <div className="w-full">
          <h2 className="text-rose-800 font-bold mb-4 ml-2">Recent Captures</h2>
          
          <div className="flex space-x-6 overflow-x-auto pb-8 snap-x no-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {livePosts.length === 0 ? (
              <div className="w-full text-center py-10 text-rose-200 italic">No live moments captured yet...</div>
            ) : (
              livePosts.slice().reverse().map((post, i) => (
                <div key={i} className="flex-none w-72 bg-white p-4 rounded-[2rem] shadow-sm border border-rose-50 snap-center hover:shadow-md transition-shadow">
                  <div className="w-full h-48 overflow-hidden rounded-[1.5rem] mb-4 bg-rose-50">
                    <img src={post.image_data} className="w-full h-full object-cover" alt="Captured" />
                  </div>
                  <p className="text-[10px] font-bold text-rose-300 uppercase tracking-widest mb-1">{post.timestamp}</p>
                  <p className="text-rose-800 text-sm italic font-medium">✨ Real-time Capture</p>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}