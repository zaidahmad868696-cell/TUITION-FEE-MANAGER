// App.js — Professional Tuition Fee SaaS
// Stack: React + Firebase Auth + Firestore + Vercel Analytics

import { useState, useEffect, useRef } from "react";
import { Analytics } from "@vercel/analytics/react";

// ─── Firebase ───────────────────────────────────────────
import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC-kfPtXdvMuWjUekCLsWGYo225IGIUwzg",
  authDomain: "fee-manager-ca441.firebaseapp.com",
  projectId: "fee-manager-ca441",
  storageBucket: "fee-manager-ca441.firebasestorage.app",
  messagingSenderId: "309022745318",
  appId: "1:309022745318:web:860b85bd0bc3a0b2775127",
  measurementId: "G-F0NY7VH0EY",
};

const firebaseApp = initializeApp(firebaseConfig);
const auth       = getAuth(firebaseApp);
const db         = getFirestore(firebaseApp);

// ─── Constants ──────────────────────────────────────────
const CHERRY = "#D2042D";
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const SHORT_MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const PALETTE = [
  { base:"#b45309", light:"#fffbeb", mid:"#fde68a", dark:"#78350f" },
  { base:"#3730a3", light:"#eff0ff", mid:"#c7d2fe", dark:"#1e1a6e" },
  { base:"#0e7490", light:"#ecfeff", mid:"#a5f3fc", dark:"#083344" },
  { base:"#7c3aed", light:"#f5f3ff", mid:"#ddd6fe", dark:"#3b1080" },
  { base:"#c2410c", light:"#fff7ed", mid:"#fed7aa", dark:"#7c2d12" },
  { base:"#065f46", light:"#ecfdf5", mid:"#a7f3d0", dark:"#022c22" },
];
const getP = (idx) => PALETTE[Math.abs(idx ?? 0) % PALETTE.length];

const vibrate = (p = 10) => { try { navigator.vibrate && navigator.vibrate(p); } catch {} };

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
};

const fmtDate = (d) => {
  if (!d) return "";
  const [y, m, dy] = d.split("-");
  return `${parseInt(dy)} ${SHORT_MONTHS[parseInt(m)-1]} ${y}`;
};

const waLink = (phone, name, month) => {
  const n = "91" + phone.replace(/\D/g,"").slice(-10);
  return `https://wa.me/${n}?text=${encodeURIComponent(`Hello, this is a reminder regarding the tuition fee for ${name} for the month of ${month}.`)}`;
};

// ─── Styles ─────────────────────────────────────────────
const C = {
  card:     { background:"#fff", borderRadius:20, border:"1.5px solid rgba(0,0,0,0.07)", boxShadow:"0 2px 18px rgba(0,0,0,0.06)" },
  navBtn:   { width:36, height:36, borderRadius:11, border:"1.5px solid rgba(0,0,0,0.09)", background:"#fff", cursor:"pointer", fontSize:17, color:"#555", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"inherit" },
  ghostBtn: { padding:"9px 16px", background:"rgba(0,0,0,0.05)", border:"none", borderRadius:12, fontWeight:700, cursor:"pointer", color:"#555", fontFamily:"inherit", fontSize:13 },
};

// ─── GravityCard ────────────────────────────────────────
function GravityCard({ children, delay = 0 }) {
  const ref     = useRef(null);
  const frame   = useRef(null);
  const c       = useRef({ y:80, sc:0.82, o:0, vy:0, vsc:0, vo:0 });
  const t       = useRef({ y:80, sc:0.82, o:0 });
  const visible = useRef(false);
  const running = useRef(false);
  const STIFF = 0.32, DAMP = 0.58, GRAV = 0.06;

  const startLoop = (el) => {
    if (running.current) return;
    running.current = true;
    const tick = () => {
      const s = c.current, g = t.current;
      const falling = g.y > s.y;
      s.vy  = (s.vy  + (g.y  - s.y)  * STIFF + (falling ? GRAV : 0)) * DAMP;
      s.y  += s.vy;
      s.vsc = (s.vsc + (g.sc - s.sc) * STIFF) * DAMP;
      s.sc += s.vsc;
      s.vo  = (s.vo  + (g.o  - s.o)  * STIFF) * DAMP;
      s.o  += s.vo;
      el.style.transform = `translateY(${s.y.toFixed(2)}px) scale(${s.sc.toFixed(4)})`;
      el.style.opacity   = Math.max(0, Math.min(1, s.o)).toFixed(3);
      const settled = Math.abs(s.vy)<0.01 && Math.abs(s.y-g.y)<0.1 && Math.abs(s.vsc)<0.0001 && Math.abs(s.sc-g.sc)<0.001 && Math.abs(s.vo)<0.001 && Math.abs(s.o-g.o)<0.005;
      if (settled) {
        s.y=g.y; s.sc=g.sc; s.o=g.o; s.vy=0; s.vsc=0; s.vo=0;
        el.style.transform=`translateY(${g.y}px) scale(${g.sc})`; el.style.opacity=String(g.o);
        running.current=false; return;
      }
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    const el = ref.current; if (!el) return;
    el.style.transform="translateY(80px) scale(0.82)"; el.style.opacity="0";
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !visible.current) {
        visible.current = true;
        setTimeout(() => { t.current={y:0,sc:1,o:1}; startLoop(el); }, delay);
      } else if (!entry.isIntersecting && visible.current) {
        visible.current=false; cancelAnimationFrame(frame.current); running.current=false;
        c.current={y:80,sc:0.82,o:0,vy:0,vsc:0,vo:0}; t.current={y:80,sc:0.82,o:0};
        el.style.transform="translateY(80px) scale(0.82)"; el.style.opacity="0";
      }
    }, { threshold: 0.06 });
    obs.observe(el);
    return () => { obs.disconnect(); cancelAnimationFrame(frame.current); };
  }, [delay]);

  return <div ref={ref} style={{ willChange:"transform,opacity", transformOrigin:"center bottom" }}>{children}</div>;
}

// ─── Auth Screen ─────────────────────────────────────────
function AuthScreen({ onAuth }) {
  const [mode,    setMode]    = useState("login"); // "login" | "signup"
  const [email,   setEmail]   = useState("");
  const [pass,    setPass]    = useState("");
  const [name,    setName]    = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const submit = async () => {
    setError(""); setLoading(true);
    try {
      if (mode === "signup") {
        if (!name.trim()) { setError("Please enter your name."); setLoading(false); return; }
        const cred = await createUserWithEmailAndPassword(auth, email, pass);
        onAuth(cred.user);
      } else {
        const cred = await signInWithEmailAndPassword(auth, email, pass);
        onAuth(cred.user);
      }
    } catch (e) {
      const msg = e.code === "auth/user-not-found" ? "No account found. Please sign up."
        : e.code === "auth/wrong-password" ? "Incorrect password."
        : e.code === "auth/email-already-in-use" ? "Email already registered. Please log in."
        : e.code === "auth/weak-password" ? "Password must be at least 6 characters."
        : e.code === "auth/invalid-email" ? "Invalid email address."
        : "Something went wrong. Try again.";
      setError(msg);
    }
    setLoading(false);
  };

  const inp = (val, set, type="text", ph="") => (
    <input type={type} placeholder={ph} value={val} onChange={e=>set(e.target.value)}
      style={{ width:"100%", padding:"14px 16px", borderRadius:14, border:`1.5px solid ${val?"#D2042D66":"rgba(0,0,0,0.1)"}`, background:"#fafafa", fontSize:14, fontWeight:600, outline:"none", boxSizing:"border-box", color:"#111", fontFamily:"inherit", transition:"border-color .2s" }} />
  );

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(160deg,#fff5f6,#fff,#f8f8ff)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:20, fontFamily:"'Inter',-apple-system,sans-serif" }}>
      <Analytics />
      {/* Logo */}
      <div style={{ marginBottom:32, textAlign:"center" }}>
        <div style={{ width:64, height:64, borderRadius:20, background:`linear-gradient(135deg,${CHERRY},#ff1744)`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px", boxShadow:`0 8px 24px ${CHERRY}44` }}>
          <span style={{ fontSize:28 }}>🎓</span>
        </div>
        <div style={{ fontSize:10, fontWeight:700, color:CHERRY, letterSpacing:2.5, textTransform:"uppercase" }}>Fee Management</div>
        <div style={{ fontSize:26, fontWeight:900, color:"#111", letterSpacing:-.8, marginTop:4 }}>Tuition Fees</div>
        <div style={{ fontSize:13, color:"#aaa", marginTop:6 }}>Manage your students, track fees effortlessly.</div>
      </div>

      {/* Card */}
      <div style={{ background:"#fff", borderRadius:24, padding:"28px 24px", width:"100%", maxWidth:380, boxShadow:"0 12px 48px rgba(0,0,0,0.1)", border:"1.5px solid rgba(0,0,0,0.06)" }}>
        {/* Tabs */}
        <div style={{ display:"flex", background:"rgba(0,0,0,0.05)", borderRadius:12, padding:4, marginBottom:24 }}>
          {["login","signup"].map(m => (
            <button key={m} onClick={()=>{ setMode(m); setError(""); }}
              style={{ flex:1, padding:"10px", background:mode===m?"#fff":"transparent", border:"none", borderRadius:10, fontWeight:700, fontSize:13, cursor:"pointer", color:mode===m?"#111":"#aaa", boxShadow:mode===m?"0 2px 8px rgba(0,0,0,0.1)":"none", transition:"all .2s", fontFamily:"inherit" }}>
              {m === "login" ? "Log In" : "Sign Up"}
            </button>
          ))}
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {mode === "signup" && inp(name, setName, "text", "Your Name")}
          {inp(email, setEmail, "email", "Email Address")}
          {inp(pass,  setPass,  "password", "Password (min 6 chars)")}
        </div>

        {error && (
          <div style={{ background:"#fff0f2", border:"1.5px solid #fecdd3", borderRadius:10, padding:"10px 14px", marginTop:14, fontSize:12, color:CHERRY, fontWeight:600 }}>
            {error}
          </div>
        )}

        <button onClick={submit} disabled={loading}
          style={{ width:"100%", marginTop:20, padding:"15px", background:loading?"#ccc":CHERRY, border:"none", borderRadius:14, fontWeight:800, fontSize:15, cursor:loading?"not-allowed":"pointer", color:"#fff", fontFamily:"inherit", boxShadow:loading?"none":`0 6px 20px ${CHERRY}44`, transition:"all .2s" }}>
          {loading ? "Please wait…" : mode === "login" ? "Log In →" : "Create Account →"}
        </button>

        <div style={{ textAlign:"center", marginTop:16, fontSize:12, color:"#aaa" }}>
          {mode === "login" ? "Don't have an account? " : "Already have an account? "}
          <span onClick={()=>{ setMode(mode==="login"?"signup":"login"); setError(""); }}
            style={{ color:CHERRY, fontWeight:700, cursor:"pointer" }}>
            {mode === "login" ? "Sign Up" : "Log In"}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Student Card ────────────────────────────────────────
function StudentCard({ s, idx, pending, viewMonth, onClick }) {
  const p = getP(idx);
  const initials = s.name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
  return (
    <div onClick={onClick}
      style={{ background:"#fff", borderRadius:22, overflow:"hidden", cursor:"pointer", border:"1.5px solid rgba(0,0,0,0.07)", boxShadow:"0 2px 18px rgba(0,0,0,0.07)", transition:"transform .18s ease, box-shadow .18s ease" }}
      onMouseEnter={e=>{ e.currentTarget.style.transform="scale(1.018)"; e.currentTarget.style.boxShadow="0 10px 36px rgba(0,0,0,0.13)"; }}
      onMouseLeave={e=>{ e.currentTarget.style.transform="scale(1)"; e.currentTarget.style.boxShadow="0 2px 18px rgba(0,0,0,0.07)"; }}>
      <div style={{ height:8, background:`linear-gradient(90deg,${p.base},${p.dark})` }} />
      <div style={{ padding:"18px 20px 16px" }}>
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:16 }}>
          <div style={{ display:"flex", alignItems:"center", gap:13 }}>
            <div style={{ width:50, height:50, borderRadius:16, background:`linear-gradient(135deg,${p.light},${p.mid})`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, border:`1.5px solid ${p.mid}` }}>
              <span style={{ fontSize:18, fontWeight:900, color:p.base }}>{initials}</span>
            </div>
            <div>
              <div style={{ fontSize:16, fontWeight:800, color:"#111", letterSpacing:-0.3, lineHeight:1.2 }}>{s.name}</div>
              <div style={{ fontSize:12, color:"#888", marginTop:3, fontWeight:500 }}>{s.cls}</div>
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:5, background:pending?"#fff0f2":"#f0fdf4", borderRadius:20, padding:"5px 11px", border:`1.5px solid ${pending?"#fecdd3":"#bbf7d0"}`, flexShrink:0 }}>
            <div style={{ width:7, height:7, borderRadius:"50%", background:pending?CHERRY:"#16a34a", boxShadow:pending?`0 0 6px ${CHERRY}88`:"0 0 6px #16a34a88" }} />
            <span style={{ fontSize:11, fontWeight:700, color:pending?CHERRY:"#16a34a" }}>{pending?"PENDING":"PAID"}</span>
          </div>
        </div>
        <div style={{ height:1, background:"rgba(0,0,0,0.055)", marginBottom:14 }} />
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
          <div style={{ background:p.light, borderRadius:12, padding:"10px 12px", border:`1px solid ${p.mid}` }}>
            <div style={{ fontSize:9, fontWeight:700, color:p.base, letterSpacing:1, textTransform:"uppercase", marginBottom:3 }}>Fee/mo</div>
            <div style={{ fontSize:18, fontWeight:900, color:p.base }}>₹{s.fee}</div>
          </div>
          <div style={{ background:"#fafafa", borderRadius:12, padding:"10px 12px", border:"1px solid rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize:9, fontWeight:700, color:"#bbb", letterSpacing:1, textTransform:"uppercase", marginBottom:3 }}>Joined</div>
            <div style={{ fontSize:11, fontWeight:700, color:"#444", lineHeight:1.3 }}>{fmtDate(s.joined)}</div>
          </div>
          <div style={{ background:pending?"#fff0f2":"#f0fdf4", borderRadius:12, padding:"10px 12px", border:`1px solid ${pending?"#fecdd3":"#bbf7d0"}` }}>
            <div style={{ fontSize:9, fontWeight:700, color:pending?CHERRY:"#16a34a", letterSpacing:1, textTransform:"uppercase", marginBottom:3 }}>{MONTHS[viewMonth].slice(0,3)}</div>
            <div style={{ fontSize:13, fontWeight:800, color:pending?CHERRY:"#16a34a" }}>{pending?"Due":"Cleared"}</div>
          </div>
        </div>
      </div>
      <div style={{ background:`linear-gradient(90deg,${p.base}12,${p.base}1a)`, borderTop:`1px solid ${p.mid}`, padding:"9px 20px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ fontSize:10, fontWeight:600, color:"#aaa" }}>Tap to manage →</span>
        <span style={{ fontSize:11, fontWeight:800, color:pending?CHERRY:"#16a34a" }}>{pending?`₹${s.fee} due`:`✓ ${MONTHS[viewMonth].slice(0,3)} paid`}</span>
      </div>
    </div>
  );
}

// ─── Student Form Modal (Add + Edit) ────────────────────
function StudentFormModal({ onClose, onSave, existing }) {
  const isEdit = !!existing;
  const [form, setForm] = useState({
    name:  existing?.name  || "",
    cls:   existing?.cls   || "",
    fee:   existing?.fee   ? String(existing.fee) : "",
    phone: existing?.phone || "",
  });
  const [saving, setSaving] = useState(false);
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
  const valid = form.name.trim() && form.cls.trim() && form.fee && form.phone.trim().length >= 10;

  const submit = async () => {
    if (!valid || saving) return;
    vibrate([10,30,10]); setSaving(true);
    await onSave({
      ...(isEdit ? existing : { joined: todayStr() }),
      name:  form.name.trim(),
      cls:   form.cls.trim(),
      fee:   parseInt(form.fee),
      phone: form.phone.trim().replace(/\D/g,"").slice(-10),
    });
    setSaving(false); onClose();
  };

  return (
    <div style={{ position:"fixed", inset:0, zIndex:200, display:"flex", alignItems:"flex-end", justifyContent:"center", background:"rgba(0,0,0,0.48)", backdropFilter:"blur(8px)", WebkitBackdropFilter:"blur(8px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background:"#fff", borderRadius:"26px 26px 0 0", width:"100%", maxWidth:520, padding:"10px 24px 48px", boxShadow:"0 -16px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ width:40, height:4, background:"rgba(0,0,0,0.12)", borderRadius:99, margin:"14px auto 24px" }} />
        <div style={{ fontSize:21, fontWeight:900, color:"#111", marginBottom:4 }}>{isEdit?"Edit Student":"Add New Student"}</div>
        <div style={{ fontSize:13, color:"#aaa", marginBottom:22 }}>{isEdit?"Update the student's details below.":"Fill in the details to register a student."}</div>
        <div style={{ display:"flex", flexDirection:"column", gap:13 }}>
          {[
            { k:"name",  t:"text",   label:"Full Name",           ph:"e.g. Zaid Ahmad" },
            { k:"cls",   t:"text",   label:"Class / Section",     ph:"e.g. Class 9-A" },
            { k:"fee",   t:"number", label:"Monthly Fee (₹)",     ph:"e.g. 500" },
            { k:"phone", t:"tel",    label:"WhatsApp (10 digits)", ph:"e.g. 9876543210" },
          ].map(({ k, t, label, ph }) => (
            <div key={k}>
              <div style={{ fontSize:11, fontWeight:700, color:"#777", letterSpacing:0.8, textTransform:"uppercase", marginBottom:5 }}>{label}</div>
              <input type={t} placeholder={ph} value={form[k]} onChange={set(k)}
                style={{ width:"100%", padding:"13px 16px", borderRadius:14, border:`1.5px solid ${form[k]?CHERRY+"66":"rgba(0,0,0,0.1)"}`, background:"#fafafa", fontSize:14, fontWeight:600, outline:"none", boxSizing:"border-box", color:"#111", fontFamily:"inherit", transition:"border-color .2s" }} />
            </div>
          ))}
        </div>
        <div style={{ fontSize:11, color:"#ccc", marginTop:10, marginBottom:22 }}>+91 is added automatically for WhatsApp links.</div>
        <div style={{ display:"flex", gap:12 }}>
          <button onClick={onClose} style={{ flex:1, padding:"14px", background:"rgba(0,0,0,0.06)", border:"none", borderRadius:14, fontWeight:700, fontSize:14, cursor:"pointer", color:"#555", fontFamily:"inherit" }}>Cancel</button>
          <button onClick={submit} disabled={!valid||saving}
            style={{ flex:2, padding:"14px", background:valid&&!saving?CHERRY:"#e0e0e0", border:"none", borderRadius:14, fontWeight:800, fontSize:14, cursor:valid&&!saving?"pointer":"not-allowed", color:"#fff", fontFamily:"inherit", boxShadow:valid?`0 6px 20px ${CHERRY}44`:"none", transition:"all .2s" }}>
            {saving?"Saving…":isEdit?"Save Changes ✓":"Add Student →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Confirm Modal ───────────────────────────────────────
function ConfirmModal({ title, desc, onCancel, onConfirm, confirmLabel="Confirm" }) {
  return (
    <div style={{ position:"fixed", inset:0, zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(0,0,0,0.42)", backdropFilter:"blur(6px)", WebkitBackdropFilter:"blur(6px)", padding:20 }}>
      <div style={{ background:"#fff", borderRadius:24, padding:"28px 24px", width:"100%", maxWidth:300, textAlign:"center", boxShadow:"0 24px 64px rgba(0,0,0,0.22)" }}>
        <div style={{ fontSize:18, fontWeight:800, color:"#111", marginBottom:10 }}>{title}</div>
        <div style={{ fontSize:13, color:"#666", marginBottom:24, lineHeight:1.65 }} dangerouslySetInnerHTML={{ __html:desc }} />
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={onCancel}  style={{ flex:1, padding:"13px", background:"rgba(0,0,0,0.06)", border:"none", borderRadius:12, fontWeight:700, cursor:"pointer", color:"#555", fontFamily:"inherit", fontSize:13 }}>Cancel</button>
          <button onClick={onConfirm} style={{ flex:1, padding:"13px", background:CHERRY, border:"none", borderRadius:12, fontWeight:800, cursor:"pointer", color:"#fff", fontFamily:"inherit", fontSize:13, boxShadow:`0 4px 16px ${CHERRY}55` }}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main App ────────────────────────────────────────────
export default function App() {
  const [authUser,    setAuthUser]   = useState(undefined); // undefined = loading
  const [students,    setStudents]   = useState([]);
  const [payments,    setPayments]   = useState({});
  const [tab,         setTab]        = useState("home");
  const [selected,    setSelected]   = useState(null);
  const [detailIn,    setDetailIn]   = useState(false);
  const [showAdd,     setShowAdd]    = useState(false);
  const [editStudent, setEditStudent]= useState(null);
  const [payModal,    setPayModal]   = useState(null);
  const [delModal,    setDelModal]   = useState(false);
  const [toast,       setToast]      = useState(null);
  const [loading,     setLoading]    = useState(false);

  const now = new Date();
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [viewYear,  setViewYear]  = useState(now.getFullYear());
  const curM = now.getMonth(), curY = now.getFullYear();
  const isNow = viewMonth === curM && viewYear === curY;

  // ── Auth listener ──
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, user => setAuthUser(user || null));
    return unsub;
  }, []);

  // ── Load data from Firestore when user logs in ──
  useEffect(() => {
    if (!authUser) { setStudents([]); setPayments({}); return; }
    fetchAll();
  }, [authUser]);

  const fetchAll = async () => {
    if (!authUser) return;
    setLoading(true);
    try {
      // Students
      const sq = query(collection(db,"students"), where("uid","==",authUser.uid));
      const ss = await getDocs(sq);
      const studs = ss.docs.map(d => ({ firestoreId: d.id, ...d.data() }));
      setStudents(studs);

      // Payments
      const pq = query(collection(db,"payments"), where("uid","==",authUser.uid));
      const ps = await getDocs(pq);
      const pays = {};
      ps.docs.forEach(d => { pays[d.data().key] = { firestoreId: d.id, ...d.data() }; });
      setPayments(pays);
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  const toast$ = (msg, color=CHERRY) => { setToast({msg,color}); setTimeout(()=>setToast(null),2400); };

  const pk = (id,m,y) => `${id}_${y}_${m}`;
  const isPaid  = (id,m,y) => !!payments[pk(id,m,y)];
  const pending = (id)     => !isPaid(id, viewMonth, viewYear);

  const shiftMonth = dir => {
    vibrate(6);
    let nm=viewMonth+dir, ny=viewYear;
    if (nm<0){nm=11;ny--;} if(nm>11){nm=0;ny++;}
    if (ny>curY||(ny===curY&&nm>curM)) return;
    setViewMonth(nm); setViewYear(ny);
  };

  // ── Add Student ──
  const addStudent = async (data) => {
    const doc_ = await addDoc(collection(db,"students"), { uid: authUser.uid, ...data, createdAt: serverTimestamp() });
    const s = { firestoreId: doc_.id, uid: authUser.uid, ...data };
    setStudents(p => [...p, s]);
    toast$(`✓ ${data.name} added!`,"#16a34a");
  };

  // ── Edit Student ──
  const saveEdit = async (data) => {
    await updateDoc(doc(db,"students", data.firestoreId), {
      name: data.name, cls: data.cls, fee: data.fee, phone: data.phone,
    });
    setStudents(p => p.map(x => x.firestoreId===data.firestoreId ? { ...x, ...data } : x));
    if (selected?.firestoreId === data.firestoreId) setSelected(s => ({ ...s, ...data }));
    toast$(`✓ ${data.name} updated!`,"#16a34a");
  };

  // ── Delete Student ──
  const deleteStudent = async () => {
    await deleteDoc(doc(db,"students", selected.firestoreId));
    // delete all payments for this student
    const toDelete = Object.values(payments).filter(p => p.studentId === selected.firestoreId);
    await Promise.all(toDelete.map(p => deleteDoc(doc(db,"payments", p.firestoreId))));
    setStudents(p => p.filter(x => x.firestoreId !== selected.firestoreId));
    const np = { ...payments };
    Object.keys(np).forEach(k => { if (np[k].studentId === selected.firestoreId) delete np[k]; });
    setPayments(np);
    setDelModal(false); closeDetail(); toast$("Student removed.");
  };

  // ── Mark Paid ──
  const markPaid = async () => {
    if (!payModal||!selected) return;
    vibrate([10,30,10]);
    const key = pk(selected.firestoreId, payModal.m, payModal.y);
    const timestamp = new Date().toISOString();
    const docRef = await addDoc(collection(db,"payments"), {
      uid: authUser.uid, studentId: selected.firestoreId,
      key, month: payModal.m, year: payModal.y, paidAt: timestamp,
    });
    setPayments(p => ({ ...p, [key]: { firestoreId: docRef.id, uid: authUser.uid, studentId: selected.firestoreId, key, month: payModal.m, year: payModal.y, paidAt: timestamp } }));
    setPayModal(null); toast$(`✓ ${MONTHS[payModal.m]} marked Paid!`,"#16a34a");
  };

  const openDetail  = s => { vibrate(8); setSelected(s); setTimeout(()=>setDetailIn(true),10); };
  const closeDetail = () => { vibrate(8); setDetailIn(false); setTimeout(()=>{ setSelected(null); setDelModal(false); },300); };

  const handleLogout = async () => { await signOut(auth); setAuthUser(null); };

  // ── Stats ──
  const paidCount = students.filter(s=>!pending(s.firestoreId)).length;
  const totalExp  = students.reduce((a,s)=>a+s.fee,0);
  const totalCol  = students.filter(s=>!pending(s.firestoreId)).reduce((a,s)=>a+s.fee,0);
  const rate      = totalExp>0?Math.round((totalCol/totalExp)*100):0;

  const last6 = Array.from({length:6},(_,i)=>{
    const d=new Date(curY,curM-5+i,1), m=d.getMonth(), y=d.getFullYear();
    const tot=students.reduce((a,s)=>a+s.fee,0);
    const col=students.filter(s=>isPaid(s.firestoreId,m,y)).reduce((a,s)=>a+s.fee,0);
    return { label:SHORT_MONTHS[m], tot, col, pct:tot>0?Math.round((col/tot)*100):0, isCur:m===curM&&y===curY };
  });
  const maxBar=Math.max(...last6.map(x=>x.tot),1);

  // ── Loading state ──
  if (authUser === undefined) {
    return (
      <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"linear-gradient(160deg,#fff5f6,#fff)", fontFamily:"Inter,sans-serif" }}>
        <div style={{ textAlign:"center" }}>
          <div style={{ width:48, height:48, border:`3px solid ${CHERRY}`, borderTop:"3px solid transparent", borderRadius:"50%", animation:"spin 0.8s linear infinite", margin:"0 auto 16px" }} />
          <div style={{ color:"#aaa", fontSize:13, fontWeight:600 }}>Loading…</div>
        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (!authUser) return <AuthScreen onAuth={setAuthUser} />;

  const MonthNav = (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18 }}>
      <button onClick={()=>shiftMonth(-1)} style={C.navBtn}>‹</button>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:15, fontWeight:800, color:"#1a1a2e" }}>{MONTHS[viewMonth]} {viewYear}</div>
        {!isNow&&<div style={{ fontSize:10, color:CHERRY, fontWeight:700, marginTop:2 }}>viewing past month</div>}
      </div>
      <button onClick={()=>shiftMonth(1)} disabled={isNow} style={{ ...C.navBtn, color:isNow?"#ccc":"#555", cursor:isNow?"default":"pointer" }}>›</button>
    </div>
  );

  // ── Home ──
  const Home = (
    <div style={{ padding:"0 16px 80px", maxWidth:520, margin:"0 auto" }}>
      {MonthNav}
      <div style={{ display:"flex", gap:10, marginBottom:22 }}>
        {[["Paid",paidCount,"#16a34a","linear-gradient(135deg,#f0fdf4,#dcfce7)","#bbf7d0"],
          ["Pending",students.length-paidCount,CHERRY,"linear-gradient(135deg,#fff0f2,#ffe4e6)","#fecdd3"],
          ["Total",students.length,"#3730a3","linear-gradient(135deg,#eff0ff,#e0e7ff)","#c7d2fe"],
        ].map(([l,v,c,bg,br])=>(
          <div key={l} style={{ flex:1, background:bg, borderRadius:16, padding:"13px 12px", border:`1.5px solid ${br}`, textAlign:"center" }}>
            <div style={{ fontSize:24, fontWeight:900, color:c, lineHeight:1 }}>{v}</div>
            <div style={{ fontSize:10, color:c, fontWeight:700, opacity:.8, marginTop:4, letterSpacing:.5 }}>{l.toUpperCase()}</div>
          </div>
        ))}
      </div>
      {loading ? (
        <div style={{ textAlign:"center", padding:40, color:"#bbb" }}>
          <div style={{ width:36, height:36, border:`3px solid ${CHERRY}`, borderTop:"3px solid transparent", borderRadius:"50%", animation:"spin 0.8s linear infinite", margin:"0 auto 12px" }} />
          <div style={{ fontSize:13 }}>Loading students…</div>
        </div>
      ) : students.length===0 ? (
        <div style={{ textAlign:"center", padding:"48px 20px", color:"#bbb" }}>
          <div style={{ fontSize:40, marginBottom:12 }}>🎓</div>
          <div style={{ fontSize:15, fontWeight:600 }}>No students yet</div>
          <div style={{ fontSize:13, marginTop:4 }}>Tap "+ Add Student" to get started.</div>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          {students.map((s,i)=>(
            <GravityCard key={s.firestoreId} delay={i*40}>
              <StudentCard s={s} idx={i} pending={pending(s.firestoreId)} viewMonth={viewMonth} onClick={()=>openDetail(s)} />
            </GravityCard>
          ))}
        </div>
      )}
    </div>
  );

  // ── Dashboard ──
  const Dashboard = (
    <div style={{ padding:"0 16px 80px", maxWidth:520, margin:"0 auto" }}>
      {MonthNav}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:16 }}>
        {[["Expected","₹"+totalExp.toLocaleString(),"#3730a3","linear-gradient(135deg,#eff0ff,#e0e7ff)","#c7d2fe"],
          ["Collected","₹"+totalCol.toLocaleString(),"#16a34a","linear-gradient(135deg,#f0fdf4,#dcfce7)","#bbf7d0"],
          ["Pending","₹"+(totalExp-totalCol).toLocaleString(),CHERRY,"linear-gradient(135deg,#fff0f2,#ffe4e6)","#fecdd3"],
        ].map(([l,v,c,bg,br])=>(
          <div key={l} style={{ background:bg, borderRadius:16, padding:"13px 10px", textAlign:"center", border:`1.5px solid ${br}` }}>
            <div style={{ fontSize:13, fontWeight:900, color:c }}>{v}</div>
            <div style={{ fontSize:9, fontWeight:700, color:c, opacity:.75, marginTop:3, letterSpacing:.8 }}>{l.toUpperCase()}</div>
          </div>
        ))}
      </div>
      <GravityCard delay={0}>
        <div style={{ ...C.card, padding:"18px 20px", marginBottom:14 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:12 }}>
            <span style={{ fontWeight:800, fontSize:14, color:"#1a1a2e" }}>Collection Rate</span>
            <span style={{ fontWeight:900, fontSize:17, color:"#16a34a" }}>{rate}%</span>
          </div>
          <div style={{ height:10, background:"rgba(0,0,0,.07)", borderRadius:99, overflow:"hidden" }}>
            <div style={{ height:"100%", width:`${rate}%`, background:"linear-gradient(90deg,#16a34a,#22c55e)", borderRadius:99, transition:"width .9s cubic-bezier(.4,0,.2,1)" }} />
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", marginTop:8, fontSize:11, color:"#aaa" }}>
            <span>{students.filter(s=>!pending(s.firestoreId)).length} paid</span>
            <span>{students.filter(s=>pending(s.firestoreId)).length} pending</span>
          </div>
        </div>
      </GravityCard>
      <GravityCard delay={70}>
        <div style={{ ...C.card, padding:"18px 18px", marginBottom:14 }}>
          <div style={{ fontWeight:800, fontSize:14, color:"#1a1a2e", marginBottom:18 }}>Last 6 Months</div>
          <div style={{ display:"flex", alignItems:"flex-end", gap:8, height:100 }}>
            {last6.map((m,i)=>(
              <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:3 }}>
                <div style={{ fontSize:9, fontWeight:700, color:m.col>0?"#16a34a":"#e5e5e5" }}>{m.pct>0?`${m.pct}%`:""}</div>
                <div style={{ width:"100%", position:"relative", borderRadius:"6px 6px 0 0", height:`${Math.round((m.tot/maxBar)*78)}px`, background:"rgba(0,0,0,.05)" }}>
                  <div style={{ position:"absolute", bottom:0, width:"100%", height:`${m.pct}%`, background:"linear-gradient(180deg,#16a34a,#22c55e)", borderRadius:"6px 6px 0 0", transition:"height .9s ease" }} />
                </div>
                <div style={{ fontSize:9, fontWeight:700, color:m.isCur?CHERRY:"#aaa" }}>{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      </GravityCard>
      {students.filter(s=>pending(s.firestoreId)).length>0&&(
        <GravityCard delay={140}>
          <div style={{ ...C.card, padding:"16px 18px" }}>
            <div style={{ fontWeight:800, fontSize:14, color:"#1a1a2e", marginBottom:14 }}>Pending This Month</div>
            {students.filter(s=>pending(s.firestoreId)).map((s,i,arr)=>(
              <div key={s.firestoreId} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", paddingBottom:i<arr.length-1?12:0, marginBottom:i<arr.length-1?12:0, borderBottom:i<arr.length-1?"1px solid rgba(0,0,0,.05)":"none" }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ width:34, height:34, borderRadius:11, background:"#fff0f2", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <span style={{ fontWeight:800, color:CHERRY, fontSize:13 }}>{s.name[0]}</span>
                  </div>
                  <div>
                    <div style={{ fontWeight:700, fontSize:13, color:"#1a1a2e" }}>{s.name}</div>
                    <div style={{ fontSize:11, color:"#aaa" }}>{s.cls}</div>
                  </div>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontWeight:800, color:CHERRY, fontSize:13 }}>₹{s.fee}</span>
                  <a href={waLink(s.phone,s.name,MONTHS[viewMonth])} target="_blank" rel="noopener noreferrer"
                    onClick={()=>vibrate(8)} style={{ background:"#25D366", color:"#fff", borderRadius:9, padding:"5px 11px", fontSize:11, fontWeight:700, textDecoration:"none" }}>WA</a>
                </div>
              </div>
            ))}
          </div>
        </GravityCard>
      )}
    </div>
  );

  // ── Detail ──
  const Detail = selected&&(
    <div style={{ position:"fixed", inset:0, zIndex:100, overflowY:"auto", background:"#f2f2f5", transform:detailIn?"translateY(0)":"translateY(100%)", opacity:detailIn?1:0, transition:"transform .32s cubic-bezier(.4,0,.2,1), opacity .25s ease", fontFamily:"'Inter',-apple-system,sans-serif" }}>
      <div style={{ maxWidth:480, margin:"0 auto", padding:"0 16px 72px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"20px 0 14px" }}>
          <button onClick={closeDetail} style={C.ghostBtn}>‹ Back</button>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={()=>{ vibrate(8); setEditStudent(selected); }} style={{ ...C.ghostBtn, color:"#3730a3", background:"rgba(55,48,163,.07)", border:`1px solid rgba(55,48,163,.2)` }}>Edit</button>
            <button onClick={()=>{ vibrate(8); setDelModal(true); }} style={{ ...C.ghostBtn, color:CHERRY, background:"rgba(210,4,45,.07)", border:`1px solid rgba(210,4,45,.2)` }}>Remove</button>
          </div>
        </div>
        {(()=>{
          const idx=students.findIndex(s=>s.firestoreId===selected.firestoreId);
          const p=getP(idx);
          const initials=selected.name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
          const pend=pending(selected.firestoreId);
          return (
            <div style={{ ...C.card, overflow:"hidden", marginBottom:14 }}>
              <div style={{ height:8, background:`linear-gradient(90deg,${p.base},${p.dark})` }} />
              <div style={{ padding:"20px 20px 18px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:18 }}>
                  <div style={{ width:56, height:56, borderRadius:18, background:`linear-gradient(135deg,${p.light},${p.mid})`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, border:`2px solid ${p.mid}` }}>
                    <span style={{ fontSize:22, fontWeight:900, color:p.base }}>{initials}</span>
                  </div>
                  <div>
                    <div style={{ fontSize:21, fontWeight:900, color:"#111", letterSpacing:-.5 }}>{selected.name}</div>
                    <div style={{ fontSize:13, color:"#888", marginTop:2 }}>{selected.cls} · Joined {fmtDate(selected.joined)}</div>
                  </div>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                  <div style={{ background:p.light, borderRadius:14, padding:"13px 16px", border:`1.5px solid ${p.mid}` }}>
                    <div style={{ fontSize:10, color:p.base, fontWeight:700, letterSpacing:1, textTransform:"uppercase", marginBottom:4 }}>Monthly Fee</div>
                    <div style={{ fontSize:24, fontWeight:900, color:p.base }}>₹{selected.fee}</div>
                  </div>
                  <div style={{ background:pend?"#fff0f2":"#f0fdf4", borderRadius:14, padding:"13px 16px", border:`1.5px solid ${pend?"#fecdd3":"#bbf7d0"}` }}>
                    <div style={{ fontSize:10, color:pend?CHERRY:"#16a34a", fontWeight:700, letterSpacing:1, textTransform:"uppercase", marginBottom:4 }}>{MONTHS[viewMonth].slice(0,3)} Status</div>
                    <div style={{ fontSize:17, fontWeight:900, color:pend?CHERRY:"#16a34a" }}>{pend?"PENDING":"PAID ✓"}</div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
          <button onClick={()=>shiftMonth(-1)} style={C.navBtn}>‹</button>
          <span style={{ fontSize:14, fontWeight:800, color:"#1a1a2e" }}>{MONTHS[viewMonth]} {viewYear}</span>
          <button onClick={()=>shiftMonth(1)} disabled={isNow} style={{ ...C.navBtn, color:isNow?"#ccc":"#555", cursor:isNow?"default":"pointer" }}>›</button>
        </div>
        {pending(selected.firestoreId)&&(
          <button onClick={()=>{ vibrate(12); setPayModal({m:viewMonth,y:viewYear}); }}
            style={{ width:"100%", background:`linear-gradient(135deg,${CHERRY},#ff1744)`, color:"#fff", border:"none", borderRadius:16, padding:"15px", fontWeight:800, fontSize:15, cursor:"pointer", marginBottom:16, boxShadow:`0 6px 24px ${CHERRY}44`, fontFamily:"inherit" }}>
            ✓ Mark {MONTHS[viewMonth]} as Paid
          </button>
        )}
        <div style={{ fontSize:10, fontWeight:700, color:"#bbb", letterSpacing:1.5, textTransform:"uppercase", marginBottom:10 }}>Payment History — {viewYear}</div>
        <div style={{ ...C.card, overflow:"hidden", padding:0 }}>
          {MONTHS.map((m,i)=>{
            const key=pk(selected.firestoreId,i,viewYear);
            const paid=!!payments[key];
            const ts=payments[key]?.paidAt;
            const fut=viewYear===curY&&i>curM;
            const isCur=i===viewMonth&&viewYear===curY;
            const dt=ts?new Date(ts):null;
            return (
              <div key={i} style={{ display:"flex", alignItems:"center", padding:"12px 18px", borderBottom:i<11?"1px solid rgba(0,0,0,.045)":"none", opacity:fut?.35:1, background:isCur?(paid?"rgba(22,163,74,.05)":"rgba(210,4,45,.04)"):"transparent" }}>
                <div style={{ width:34, height:34, borderRadius:11, background:paid?"rgba(22,163,74,.12)":fut?"rgba(0,0,0,.04)":"rgba(210,4,45,.08)", display:"flex", alignItems:"center", justifyContent:"center", marginRight:14, flexShrink:0, border:isCur&&!paid?`2px solid ${CHERRY}`:"2px solid transparent" }}>
                  <span style={{ fontSize:11, fontWeight:800, color:paid?"#16a34a":fut?"#ccc":CHERRY }}>{i+1}</span>
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:13, color:"#111", display:"flex", alignItems:"center", gap:6 }}>
                    {m}{isCur&&<span style={{ fontSize:9, background:CHERRY, color:"#fff", borderRadius:5, padding:"1px 6px", fontWeight:700 }}>NOW</span>}
                  </div>
                  {paid&&dt&&<div style={{ fontSize:11, color:"#aaa", marginTop:1 }}>{dt.toLocaleDateString()} {dt.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</div>}
                </div>
                {paid
                  ? <span style={{ fontSize:11, fontWeight:800, color:"#16a34a", background:"rgba(22,163,74,.12)", padding:"4px 10px", borderRadius:8 }}>PAID</span>
                  : fut
                    ? <span style={{ fontSize:11, color:"#ddd" }}>–</span>
                    : <button onClick={()=>{ vibrate(8); setPayModal({m:i,y:viewYear}); }}
                        style={{ fontSize:11, fontWeight:800, color:CHERRY, background:"rgba(210,4,45,.08)", border:`1px solid rgba(210,4,45,.2)`, padding:"4px 10px", borderRadius:8, cursor:"pointer", fontFamily:"inherit" }}>
                        PENDING
                      </button>
                }
              </div>
            );
          })}
        </div>
        <div style={{ ...C.card, padding:"18px 20px", marginTop:14 }}>
          <div style={{ fontSize:10, fontWeight:700, color:"#bbb", letterSpacing:1.5, textTransform:"uppercase", marginBottom:12 }}>Contact Parent</div>
          <a href={waLink(selected.phone,selected.name,MONTHS[viewMonth])} target="_blank" rel="noopener noreferrer"
            onClick={()=>vibrate(10)} style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10, background:"#25D366", color:"#fff", borderRadius:14, padding:"14px", fontWeight:700, fontSize:14, textDecoration:"none", boxShadow:"0 4px 16px rgba(37,211,102,.35)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            Send WhatsApp Reminder
          </a>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(160deg,#f8f8fb,#f0f0f4)", fontFamily:"'Inter',-apple-system,BlinkMacSystemFont,sans-serif" }}>
      <Analytics />

      {/* Header */}
      <div style={{ background:"rgba(255,255,255,.94)", backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)", borderBottom:"1px solid rgba(0,0,0,.07)", padding:"18px 20px 0", position:"sticky", top:0, zIndex:30 }}>
        <div style={{ maxWidth:520, margin:"0 auto" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
            <div>
              <div style={{ fontSize:10, fontWeight:700, color:CHERRY, letterSpacing:2.5, textTransform:"uppercase" }}>Fee Management</div>
              <div style={{ fontSize:22, fontWeight:900, color:"#111", letterSpacing:-.8, lineHeight:1.1 }}>Tuition Fees</div>
            </div>
            <div style={{ display:"flex", gap:8, alignItems:"center" }}>
              {tab==="home"&&(
                <button onClick={()=>{ vibrate(8); setShowAdd(true); }}
                  style={{ background:CHERRY, color:"#fff", border:"none", borderRadius:12, padding:"10px 18px", fontWeight:800, fontSize:14, cursor:"pointer", boxShadow:`0 4px 16px ${CHERRY}44`, fontFamily:"inherit" }}>
                  + Add
                </button>
              )}
              <button onClick={handleLogout}
                style={{ background:"rgba(0,0,0,.06)", border:"none", borderRadius:10, padding:"9px 13px", fontWeight:700, fontSize:12, cursor:"pointer", color:"#666", fontFamily:"inherit" }}>
                Logout
              </button>
            </div>
          </div>
          <div style={{ display:"flex" }}>
            {[["home","Students"],["dashboard","Dashboard"]].map(([t,l])=>(
              <button key={t} onClick={()=>{ vibrate(6); setTab(t); }}
                style={{ flex:1, padding:"10px 0", background:"none", border:"none", borderBottom:`2.5px solid ${tab===t?CHERRY:"transparent"}`, fontWeight:tab===t?800:600, fontSize:14, color:tab===t?CHERRY:"#bbb", cursor:"pointer", transition:"all .18s", fontFamily:"inherit" }}>
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ paddingTop:18 }}>{tab==="home"?Home:Dashboard}</div>

      {Detail}
      {showAdd&&<StudentFormModal onClose={()=>setShowAdd(false)} onSave={addStudent} />}
      {editStudent&&<StudentFormModal existing={editStudent} onClose={()=>setEditStudent(null)} onSave={saveEdit} />}
      {payModal&&<ConfirmModal title="Confirm Payment" desc={`Mark <b>${MONTHS[payModal.m]}</b> · <b style="color:${CHERRY}">₹${selected?.fee}</b> as Paid for <b>${selected?.name}</b>?`} onCancel={()=>setPayModal(null)} onConfirm={markPaid} confirmLabel="Confirm ✓" />}
      {delModal&&<ConfirmModal title={`Remove ${selected?.name}?`} desc={`All payment records for <b>${selected?.name}</b> will be permanently deleted.`} onCancel={()=>setDelModal(false)} onConfirm={deleteStudent} confirmLabel="Remove" />}

      {toast&&(
        <div style={{ position:"fixed", bottom:30, left:"50%", transform:"translateX(-50%)", background:toast.color, color:"#fff", padding:"12px 22px", borderRadius:28, fontWeight:700, fontSize:13, boxShadow:"0 8px 32px rgba(0,0,0,.18)", zIndex:300, whiteSpace:"nowrap", animation:"fu .25s ease" }}>
          {toast.msg}
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        *{-webkit-tap-highlight-color:transparent;box-sizing:border-box;}
        input:focus{border-color:${CHERRY}!important;outline:none;box-shadow:0 0 0 3px ${CHERRY}22;}
        @keyframes fu{from{opacity:0;transform:translateX(-50%) translateY(10px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>
    </div>
  );
}