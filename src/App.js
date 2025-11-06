import React, { useEffect, useState } from 'react';
import { ADMIN_PASSWORD, USE_FIREBASE, FIRESTORE_COLLECTION } from './config';


// If firebase is enabled, lazy-load it
let db = null;
if (USE_FIREBASE) {
  try {
    // dynamic import for modular sdk
    // Note: in this simple template we use compat to simplify calls (firebase v9 compat)
    // but since firebase is installed as dependency, require will work in the bundler.
    const firebase = require('firebase/compat/app');
    require('firebase/compat/firestore');
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    db = firebase.firestore();
  } catch (e) {
    console.warn('Firebase init failed — check firebaseConfig and USE_FIREBASE in src/config.js', e);
  }
}

function padNumber(n) { return n.toString().padStart(2,'0'); }
function generateAllNumbers() { const arr=[]; for(let i=0;i<100;i++) arr.push(padNumber(i)); return arr; }

export default function App() {
  const [numbers, setNumbers] = useState(() => {
    const obj = {};
    for(const n of generateAllNumbers()) obj[n] = null;
    return obj;
  });
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [nameInput, setNameInput] = useState('');
  const [adminMode, setAdminMode] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (USE_FIREBASE && db) {
      const unsubscribe = db.collection(FIRESTORE_COLLECTION).onSnapshot((snap) => {
        const newState = {};
        for(const n of generateAllNumbers()) newState[n] = null;
        snap.forEach(doc => {
          const data = doc.data();
          if (data && data.name) newState[doc.id] = { name: data.name, time: data.time?.toDate ? data.time.toDate() : (data.time || null) };
        });
        setNumbers(newState);
        setLoading(false);
      }, (err) => {
        console.error('Firestore error', err);
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      // load from localStorage
      const raw = localStorage.getItem('rifa_numbers_v1');
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          const newState = {};
          for(const n of generateAllNumbers()) newState[n] = parsed[n] || null;
          setNumbers(newState);
        } catch (e) {
          console.warn('localStorage parse error', e);
        }
      }
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!USE_FIREBASE) {
      localStorage.setItem('rifa_numbers_v1', JSON.stringify(numbers));
    }
  }, [numbers]);

  function openPicker(num) {
    if (numbers[num]) {
      setMessage(`El número ${num} ya fue elegido por ${numbers[num].name}`);
      setTimeout(()=>setMessage(''),3000);
      return;
    }
    setSelected(num);
    setNameInput('');
  }

  async function reserveNumber(num, participantName) {
    if (!participantName || participantName.trim().length === 0) {
      setMessage('Introduce un nombre válido');
      return;
    }
    const nameTrim = participantName.trim();
    if (USE_FIREBASE && db) {
      try {
        const docRef = db.collection(FIRESTORE_COLLECTION).doc(num);
        await db.runTransaction(async (tx) => {
          const doc = await tx.get(docRef);
          if (doc.exists && doc.data() && doc.data().name) {
            throw new Error('Ya fue reservado');
          }
          tx.set(docRef, { name: nameTrim, time: new Date() });
        });
        setMessage(`Número ${num} reservado para ${nameTrim}`);
      } catch (e) {
        setMessage(e.message || 'Error al reservar');
      }
    } else {
      setNumbers(prev => {
        if (prev[num]) {
          setMessage(`El número ${num} ya fue elegido por ${prev[num].name}`);
          return prev;
        }
        const copy = { ...prev, [num]: { name: nameTrim, time: new Date().toISOString() } };
        setMessage(`Número ${num} reservado para ${nameTrim}`);
        return copy;
      });
    }
    setSelected(null);
    setTimeout(()=>setMessage(''),4000);
  }

  function exportCSV() {
    const rows = [['number','name','time']];
    for(const n of generateAllNumbers()) {
      const v = numbers[n];
      rows.push([n, v ? v.name : '', v ? v.time : '']);
    }
    const csv = rows.map(r => r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'rifa_export.csv'; a.click(); URL.revokeObjectURL(url);
  }

  function resetAll() {
    if (!window.confirm('¿Seguro quieres reiniciar la rifa y borrar todas las reservas? Esto es irreversible.')) return;
    if (USE_FIREBASE && db) {
      const batch = db.batch();
      db.collection(FIRESTORE_COLLECTION).get().then(snap => {
        snap.forEach(doc => batch.delete(doc.ref));
        return batch.commit();
      }).then(()=> setMessage('Rifa reiniciada en Firestore'));
    } else {
      const obj = {};
      for(const n of generateAllNumbers()) obj[n] = null;
      setNumbers(obj);
      setMessage('Rifa reiniciada (local)');
    }
  }

  function handleAdminToggle() {
    const attempt = window.prompt('Introduce la contraseña de Admin:');
    if (attempt === null) return; // cancel
    if (attempt === ADMIN_PASSWORD) {
      setAdminMode(true);
    } else {
      alert('Contraseña incorrecta');
    }
  }

  const freeCount = Object.values(numbers).filter(v=>!v).length;

  return (
    <div className="container">
      <header>
        <h1>Rifa 00–99</h1>
        <div className="topline">
          <div>Libres: <strong>{freeCount}</strong></div>
          <div style={{marginLeft:10}}>
            {!adminMode ? (
              <button className="btn" onClick={handleAdminToggle}>Modo Admin</button>
            ) : (
              <button className="btn" onClick={()=>setAdminMode(false)}>Salir Admin</button>
            )}
          </div>
        </div>
      </header>

      {message && <div style={{background:'#fff7c2', padding:8, borderRadius:6, marginBottom:10}}>{message}</div>}

      <div className="grid" role="grid" aria-label="Tablero de rifa">
        {generateAllNumbers().map(num => {
          const taken = numbers[num];
          return (
            <div
              key={num}
              className={`cell ${taken ? 'taken' : ''}`}
              onClick={() => !taken && openPicker(num)}
              title={taken ? `Reservado por ${taken.name}` : `Reservar ${num}`}
            >
              <div style={{fontSize:16}}>{num}</div>
              {taken && <div style={{fontSize:12, marginTop:6}}>{taken.name}</div>}
            </div>
          );
        })}
      </div>

      {selected && (
        <div className="modal-back">
          <div className="modal">
            <h3>Reservar {selected}</h3>
            <input style={{width:'100%', padding:8, marginTop:8, marginBottom:10}} placeholder="Tu nombre" value={nameInput} onChange={(e)=>setNameInput(e.target.value)} />
            <div style={{display:'flex', justifyContent:'flex-end', gap:8}}>
              <button className="btn" onClick={()=>setSelected(null)}>Cancelar</button>
              <button className="btn btn-primary" onClick={()=>reserveNumber(selected, nameInput)}>Reservar</button>
            </div>
          </div>
        </div>
      )}

      {adminMode && (
        <div className="admin-panel">
          <h3>Panel Admin</h3>
          <div style={{display:'flex', gap:8, marginTop:8, marginBottom:8}}>
            <button className="btn" onClick={exportCSV}>Exportar CSV</button>
            <button className="btn" onClick={resetAll}>Reiniciar rifa</button>
          </div>

          <div style={{display:'flex', gap:20}}>
            <div style={{flex:1}}>
              <p>Total reservados: <strong>{100 - freeCount}</strong></p>
              <p>Disponibles: <strong>{freeCount}</strong></p>
            </div>
            <div style={{flex:2}}>
              <div style={{maxHeight:260, overflow:'auto', border:'1px solid #eee', borderRadius:6, padding:6, background:'#fbfbfb'}}>
                <table>
                  <thead><tr><th>Número</th><th>Nombre</th><th>Hora</th></tr></thead>
                  <tbody>
                    {generateAllNumbers().map(n => (
                      <tr key={n}>
                        <td>{n}</td>
                        <td>{numbers[n] ? numbers[n].name : ''}</td>
                        <td>{numbers[n] ? (numbers[n].time?.toString ? numbers[n].time.toString() : numbers[n].time) : ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      <footer style={{marginTop:16, fontSize:13, color:'#555'}}>
        <p>Backend: {USE_FIREBASE ? 'Firebase Firestore' : 'Local (localStorage)'} — Para múltiples usuarios activa Firebase en <code>src/config.js</code>.</p>
      </footer>
    </div>
  );
}
