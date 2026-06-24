import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, doc, updateDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBuYYn6V3jqUs47fnVfW1OlCywfyDX6ix0",
  authDomain: "gatepass-saas.firebaseapp.com",
  projectId: "gatepass-saas",
  storageBucket: "gatepass-saas.firebasestorage.app",
  messagingSenderId: "788886920648",
  appId: "1:788886920648:web:acf750800bf8a5b0b4f4fd"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

interface VisitorLog {
  id: string;
  name: string;
  cnic: string;
  purpose: string;
  status: string;
  timestamp: any;
}

export default function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [visitorName, setVisitorName] = useState('');
  const [cnic, setCnic] = useState('');
  const [purpose, setPurpose] = useState('');
  const [logs, setLogs] = useState<VisitorLog[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check URL for ?role=owner
    const params = new URLSearchParams(window.location.search);
    if (params.get('role') === 'owner') setIsAdmin(true);

    const q = query(collection(db, "visitor_logs"), orderBy("timestamp", "desc"));
    return onSnapshot(q, (snapshot) => {
      setLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as VisitorLog)));
    });
  }, []);

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorName || !cnic) return alert('Name & CNIC required!');
    setLoading(true);
    await addDoc(collection(db, "visitor_logs"), { name: visitorName, cnic, purpose: purpose || 'General', status: 'Pending', timestamp: new Date() });
    setVisitorName(''); setCnic(''); setPurpose(''); setLoading(false);
    alert('Request Sent!');
  };

  const updateStatus = async (id: string, status: string) => {
    await updateDoc(doc(db, "visitor_logs", id), { status });
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      {/* Toggle */}
      <button onClick={() => setIsAdmin(!isAdmin)} className="fixed top-2 right-2 text-[10px] bg-white/10 p-1 rounded">Switch View</button>
      
      {!isAdmin ? (
        // VISITOR VIEW
        <div className="max-w-md mx-auto bg-black/30 p-6 rounded-2xl border border-white/10">
          <h1 className="text-2xl font-bold text-cyan-400 mb-6">Visitor Check-In</h1>
          <form onSubmit={handleCheckIn} className="space-y-4">
            <input type="text" placeholder="Name" value={visitorName} onChange={e => setVisitorName(e.target.value)} className="w-full bg-white/5 p-3 rounded" />
            <input type="text" placeholder="CNIC" value={cnic} onChange={e => setCnic(e.target.value)} className="w-full bg-white/5 p-3 rounded" />
            <input type="text" placeholder="Purpose" value={purpose} onChange={e => setPurpose(e.target.value)} className="w-full bg-white/5 p-3 rounded" />
            <button className="w-full bg-cyan-600 p-3 rounded font-bold" disabled={loading}>Submit</button>
          </form>
        </div>
      ) : (
        // OWNER VIEW
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-amber-400 mb-6">Owner Dashboard</h1>
          <div className="space-y-3">
            {logs.map(log => (
              <div key={log.id} className="bg-white/5 p-4 rounded-xl flex justify-between items-center">
                <div><p className="font-bold">{log.name}</p><p className="text-xs text-slate-400">{log.status}</p></div>
                {log.status === 'Pending' && (
                  <div className="space-x-2">
                    <button onClick={() => updateStatus(log.id, 'Approved')} className="bg-green-600 px-3 py-1 rounded text-xs">Approve</button>
                    <button onClick={() => updateStatus(log.id, 'Rejected')} className="bg-red-600 px-3 py-1 rounded text-xs">Reject</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
