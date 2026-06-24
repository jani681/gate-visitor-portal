import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, doc, updateDoc } from 'firebase/firestore';

// Firebase Configuration (Active keys)
const firebaseConfig = {
  apiKey: "AIzaSyBuYYn6V3jqUs47fnVfW1OlCywfyDX6ix0",
  authDomain: "gatepass-saas.firebaseapp.com",
  projectId: "gatepass-saas",
  storageBucket: "gatepass-saas.firebasestorage.app",
  messagingSenderId: "788886920648",
  appId: "1:788886920648:web:acf750800bf8a5b0b4f4fd"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

interface VisitorLog {
  id?: string;
  name: string;
  cnic: string;
  purpose: string;
  status: string;
  timestamp: any;
}

export default function App() {
  // Navigation View Switcher State
  const [isOwner, setIsOwner] = useState(false);

  // Visitor Portal States
  const [visitorName, setVisitorName] = useState('');
  const [cnic, setCnic] = useState('');
  const [purpose, setPurpose] = useState('');
  const [logs, setLogs] = useState<VisitorLog[]>([]);
  const [loading, setLoading] = useState(false);

  // URL Query Parameter Check (?role=owner)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('role') === 'owner') {
      setIsOwner(true);
    }
  }, []);

  // Real-time listener database sync ke liye
  useEffect(() => {
    const q = query(collection(db, "visitor_logs"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logsData: VisitorLog[] = [];
      snapshot.forEach((doc) => {
        logsData.push({ id: doc.id, ...doc.data() } as VisitorLog);
      });
      setLogs(logsData);
    });
    return () => unsubscribe();
  }, []);

  // Check-in Request Handler (Visitor)
  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorName || !cnic) return alert('Name aur CNIC zaroori hain!');
    
    setLoading(true);
    try {
      await addDoc(collection(db, "visitor_logs"), {
        name: visitorName,
        cnic: cnic,
        purpose: purpose || 'General Visit',
        status: 'Pending',
        timestamp: new Date()
      });
      setVisitorName('');
      setCnic('');
      setPurpose('');
      alert('Check-in request send ho gayi hai!');
    } catch (error) {
      console.error("Error adding document: ", error);
    }
    setLoading(false);
  };

  // Approval/Rejection Handler (Owner)
  const handleUpdateStatus = async (logId: string, newStatus: 'Approved' | 'Rejected') => {
    try {
      const docRef = doc(db, "visitor_logs", logId);
      await updateDoc(docRef, {
        status: newStatus
      });
    } catch (error) {
      console.error("Error updating status: ", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-black text-white p-4 flex flex-col items-center justify-center font-sans antialiased relative">
      
      {/* 🛠️ Testing Toggle Button (Siddha click kar ke switch karne ke liye) */}
      <div className="absolute top-4 right-4 z-50">
        <button 
          onClick={() => setIsOwner(!isOwner)}
          className="text-xs bg-white/10 hover:bg-white/20 border border-white/10 text-slate-300 px-3 py-1.5 rounded-xl transition-all"
        >
          Switch to {isOwner ? 'Visitor View' : 'Owner View'}
        </button>
      </div>

      {/* Frosted Glass Main Card */}
      <div className="w-full max-w-5xl backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6 md:p-8 shadow-2xl space-y-8">
        
        {/* ==============================================
            Condition 1: VISITOR VIEW (isOwner === false)
           ============================================== */}
        {!isOwner ? (
          <>
            {/* Header */}
            <div className="text-center space-y-2">
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500 dropping-shadow-md">
                Gate Visitor Portal
              </h1>
              <p className="text-sm text-slate-300">Secure Digital Entry & Verification System</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column: Form */}
              <div className="backdrop-blur-md bg-black/20 p-6 rounded-2xl border border-white/10">
                <h2 className="text-xl font-bold mb-4 text-cyan-400">New Visitor Entry</h2>
                <form onSubmit={handleCheckIn} className="space-y-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Visitor Name</label>
                    <input 
                      type="text" 
                      value={visitorName}
                      onChange={(e) => setVisitorName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors"
                      placeholder="Enter full name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">CNIC / ID Number</label>
                    <input 
                      type="text" 
                      value={cnic}
                      onChange={(e) => setCnic(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors"
                      placeholder="35201-XXXXXXX-X"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Purpose of Visit</label>
                    <input 
                      type="text" 
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors"
                      placeholder="Meeting, Delivery, Maintenance..."
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 font-bold py-3 rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
                  >
                    {loading ? 'Processing...' : 'Request Gate Pass'}
                  </button>
                </form>
              </div>

              {/* Right Column: Live Logs Sync Status */}
              <div className="backdrop-blur-md bg-black/20 p-6 rounded-2xl border border-white/10 flex flex-col h-[350px]">
                <h2 className="text-xl font-bold mb-4 text-blue-400 flex justify-between items-center">
                  <span>Live Monitor</span>
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                </h2>
                <div className="overflow-y-auto flex-1 space-y-3 pr-1 custom-scrollbar">
                  {logs.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center my-auto">No recent check-ins found.</p>
                  ) : (
                    logs.map((log) => (
                      <div key={log.id} className="p-3 bg-white/5 rounded-xl border border-white/5 flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-sm">{log.name}</p>
                          <p className="text-xs text-slate-400">{log.cnic} • {log.purpose}</p>
                        </div>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          log.status === 'Approved' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                          log.status === 'Rejected' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                          'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                        }`}>
                          {log.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          /* ==============================================
              Condition 2: OWNER VIEW (isOwner === true)
             ============================================== */
          <>
            {/* Owner Header */}
            <div className="text-center space-y-2">
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-orange-500 dropping-shadow-md">
                Owner Security Dashboard
              </h1>
              <p className="text-sm text-slate-300">Real-time Gate Access Control & Approvals</p>
            </div>

            {/* Main Command Monitor */}
            <div className="backdrop-blur-md bg-black/20 p-6 rounded-2xl border border-white/10 flex flex-col min-h-[400px]">
              <h2 className="text-xl font-bold mb-6 text-amber-400 flex justify-between items-center">
                <span>Active Gate Requests</span>
                <span className="text-xs bg-amber-500/10 text-amber-400 px-3 py-1 rounded-full border border-amber-500/20 font-mono">
                  {logs.filter(l => l.status === 'Pending').length} Pending
                </span>
              </h2>

              {/* Dynamic Scroll List */}
              <div className="space-y-4 overflow-y-auto max-h-[480px] pr-1 custom-scrollbar">
                {logs.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center my-auto">No entry requests found in database.</p>
                ) : (
                  logs.map((log) => (
                    <div key={log.id} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all hover:bg-white/10">
                      <div>
                        <div className="flex items-center gap-3">
                          <p className="font-bold text-base text-white">{log.name}</p>
                          <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                            log.status === 'Approved' ? 'bg-green-500/20 text-green-400 border border-green-500/20' :
                            log.status === 'Rejected' ? 'bg-red-500/20 text-red-400 border border-red-500/20' :
                            'bg-yellow-500/20 text-yellow-400 border border-yellow-500/20'
                          }`}>
                            {log.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 mt-1">
                          <span className="text-slate-400 font-medium">CNIC:</span> {log.cnic} | <span className="text-slate-400 font-medium">Purpose:</span> {log.purpose}
                        </p>
                      </div>

                      {/* Action Interface (Sirf PENDING logs par buttons show honge) */}
                      {log.status === 'Pending' && log.id ? (
                        <div className="flex gap-2 w-full sm:w-auto">
                          <button 
                            onClick={() => handleUpdateStatus(log.id!, 'Rejected')}
                            className="flex-1 sm:flex-none bg-red-600/30 hover:bg-red-600 border border-red-500/40 text-red-200 hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition-all transform active:scale-95"
                          >
                            Deny Entry
                          </button>
                          <button 
                            onClick={() => handleUpdateStatus(log.id!, 'Approved')}
                            className="flex-1 sm:flex-none bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md transition-all transform active:scale-95"
                          >
                            Approve Access
                          </button>
                        </div>
                      ) : (
                        <div className="text-xs text-slate-500 italic px-2">
                          Handled
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
