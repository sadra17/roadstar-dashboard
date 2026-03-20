import { useState, useEffect } from 'react'
import { verifyToken } from './api.js'
import LoginPage from './LoginPage.jsx'
import RoadstarDashboard from './RoadstarDashboard.jsx'

export default function App() {
  const [authed, setAuthed] = useState(null) // null = loading

  useEffect(() => {
    verifyToken().then(valid => setAuthed(valid))
  }, [])

  if (authed === null) return (
    <div style={{ minHeight:'100vh', background:'#080c14', display:'flex',
      alignItems:'center', justifyContent:'center', color:'#94A3B8',
      fontFamily:'Inter, sans-serif', fontSize:14 }}>
      Checking authentication...
    </div>
  )

  if (!authed) return <LoginPage onLogin={() => setAuthed(true)} />
  return <RoadstarDashboard onLogout={() => setAuthed(false)} />
}
