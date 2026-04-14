import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { mlAPI } from '../../services/api';
import DashboardLayout from '../layout/DashboardLayout';
import './DashboardPage.css';

function Sparkline({ data, color='#3AAFA9', height=48 }) {
  if (!data||data.length<2) return <div style={{height,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,color:'#bbb'}}>No data yet</div>;
  const min=Math.min(...data),max=Math.max(...data),range=max-min||1,w=160;
  const pts=data.map((v,i)=>`${(i/(data.length-1))*w},${height-((v-min)/range)*(height-6)-3}`).join(' ');
  return <svg width="100%" viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" style={{display:'block'}}><polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
function Donut({pct,color='#3AAFA9',size=80,label}) {
  const r=30,circ=2*Math.PI*r,offset=circ-((pct||0)/100)*circ;
  return <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:2}}>
    <svg width={size} height={size} viewBox="0 0 80 80">
      <circle cx="40" cy="40" r={r} fill="none" stroke="#e8e8e8" strokeWidth="8"/>
      <circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="8" strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" transform="rotate(-90 40 40)"/>
      <text x="40" y="44" textAnchor="middle" fontSize="11" fill="#333" fontWeight="600">{Math.round(pct||0)}%</text>
    </svg>
    {label&&<span style={{fontSize:9,color:'#888',textAlign:'center'}}>{label}</span>}
  </div>;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [farms,setFarms]=useState([]);
  const [activeFarm,setFarm]=useState(null);
  const [readings,setReadings]=useState([]);
  const [latest,setLatest]=useState(null);
  const [alerts,setAlerts]=useState([]);
  const [actions,setActions]=useState([]);
  const [weather,setWeather]=useState(null);
  const [community,setCommunity]=useState(null);
  const [disease,setDisease]=useState(null);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    Promise.all([
      mlAPI.getFarms(),
      mlAPI.getWeather('nairobi').catch(()=>({data:null})),
      mlAPI.getCommunityDashboard().catch(()=>({data:null})),
      mlAPI.getDiseaseHistory().catch(()=>({data:[]})),
    ]).then(([farmRes,wxRes,commRes,diseaseRes])=>{
      setFarms(farmRes.data);
      setWeather(wxRes.data);
      setCommunity(commRes.data);
      setDisease(diseaseRes.data?.[0]||null);
      if(farmRes.data[0]) setFarm(farmRes.data[0]);
    }).catch(()=>{}).finally(()=>setLoading(false));
  },[]);

  useEffect(()=>{
    if(!activeFarm)return;
    mlAPI.getReadings(activeFarm.id).then(({data})=>{setReadings(data);setLatest(data[0]||null);}).catch(()=>{});
    mlAPI.getAlerts({farm:activeFarm.id}).then(({data})=>setAlerts(data.slice(0,5))).catch(()=>{});
    mlAPI.getActions(activeFarm.id).then(({data})=>setActions(data)).catch(()=>{});
  },[activeFarm]);

  const series=(key)=>readings.map(r=>r[key]).filter(v=>v!=null).reverse();
  const irr=actions.find(a=>a.action_type==='irrigation');
  const ph=actions.find(a=>a.action_type==='ph_adjustment');
  const pes=actions.find(a=>a.action_type==='pesticide');
  const cur=weather?.current;

  return (
    <DashboardLayout>
      <div className="db-page">
        <h1 className="db-welcome">Welcome, {user?.first_name} {user?.last_name}!</h1>
        {loading&&<div style={{textAlign:'center',padding:'2rem',color:'#888'}}>Loading live data…</div>}
        {!loading&&(
          <div className="db-grid">
            {/* Weather */}
            <div className="db-card weather-card">
              <div className="weather-header"><span className="card-title">Weather</span></div>
              {cur?(<>
                <div className="weather-main"><div className="weather-temp">{cur.temperature}°C</div><div style={{flex:1}}><div className="weather-cond">{cur.description}</div><div style={{fontSize:10,color:'#aaa'}}>Feels {cur.feels_like}°C</div></div></div>
                <div className="weather-details">
                  <div className="weather-pill"><span>Humidity</span><strong>{cur.humidity}%</strong></div>
                  <div className="weather-pill"><span>Wind</span><strong>{cur.wind_speed}km/h</strong></div>
                </div>
              </>):<div style={{fontSize:11,color:'#aaa',padding:'8px 0'}}>Loading weather…</div>}
            </div>

            {/* Real Time Monitoring */}
            <div className="db-card rtm-card">
              <div className="card-title-row">
                <span className="card-title">Real Time Monitoring</span>
                {latest&&<span style={{fontSize:9,color:'#3AAFA9',background:'#DEF2F1',padding:'2px 7px',borderRadius:100}}>● LIVE</span>}
              </div>
              {latest?(<>
                <div className="rtm-sensors">
                  {[{label:'Soil pH',val:latest.soil_ph?.toFixed(1)},{label:'Humidity',val:latest.humidity?`${latest.humidity.toFixed(0)}%`:null},{label:'Temperature',val:latest.temperature?`${latest.temperature.toFixed(1)}°C`:null},{label:'Pesticide',val:latest.pesticide_level?`${latest.pesticide_level.toFixed(2)} mg/L`:null}].map(s=>(<div key={s.label} className="rtm-sensor-row"><span className="rtm-sensor-label">{s.label}</span><span className="rtm-sensor-value">{s.val||'—'}</span></div>))}
                </div>
                <div className="rtm-chart"><Sparkline data={series('humidity')} color="#3AAFA9"/><Sparkline data={series('temperature')} color="#9B59B6" height={40}/></div>
                <div style={{fontSize:9,color:'#aaa',marginTop:4}}>Updated: {new Date(latest.timestamp).toLocaleString('en-KE',{timeStyle:'short',dateStyle:'short'})}</div>
              </>):<div style={{fontSize:11,color:'#aaa',padding:'8px 0'}}>No sensor readings yet.</div>}
            </div>

            {/* Data Logging */}
            <div className="db-card dla-card">
              <span className="card-title">Data Logging and Analysis</span>
              <div className="dla-grid">
                <div className="dla-section"><h4>System Status</h4>{['Humidity Sensor','Soil pH Sensor','Pesticide Sensor'].map(s=>(<div key={s} className="dla-status-row"><span>{s}</span><span className={`status-badge ${latest?'active':''}`}>{latest?'Active':'No data'}</span></div>))}</div>
                <div className="dla-section"><h4>Environmental</h4><div className="dla-cond-item">Temp: {latest?.temperature?.toFixed(1)??'—'}°C</div><div className="dla-cond-item">Humidity: {latest?.humidity?.toFixed(0)??'—'}%</div></div>
                <div className="dla-section"><h4>Soil</h4><div className="dla-cond-item">Moisture: {latest?.soil_moisture?.toFixed(0)??'—'}%</div><div className="dla-cond-item">pH: {latest?.soil_ph?.toFixed(1)??'—'}</div></div>
              </div>
              <div className="dla-bottom">
                <div className="dla-actions-col"><h4>Recent Alerts</h4>{alerts.length===0?<div className="dla-action-item" style={{color:'#aaa',fontStyle:'italic'}}>No alerts</div>:alerts.map(a=>(<div key={a.id} className="dla-action-item"><strong style={{fontSize:8,display:'block'}}>{a.alert_type?.replace(/_/g,' ').toUpperCase()}</strong>{a.title}</div>))}</div>
                <div className="dla-donut-col"><h4>Readings</h4><Donut pct={Math.min(100,readings.length*10)} color="#3AAFA9" size={70} label={`${readings.length} total`}/></div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="db-card rec-card">
              <div className="rec-header"><span className="card-title">Recommendations</span></div>
              {disease&&!disease.is_healthy?(<div style={{padding:'8px 0'}}><div style={{fontSize:10,color:'#E53935',fontWeight:600,marginBottom:4}}>⚠ {disease.predicted_class?.replace(/_/g,' ')} — {(disease.confidence*100).toFixed(0)}%</div><div style={{fontSize:10,color:'#333',lineHeight:1.5}}>{disease.recommendation}</div></div>):(latest&&latest.soil_ph&&(latest.soil_ph<6||latest.soil_ph>6.8)?<div style={{fontSize:10,color:'#E65100',padding:'8px 0',lineHeight:1.5}}>Soil pH {latest.soil_ph.toFixed(1)} outside optimal range (6.0–6.8).</div>:<div className="rec-empty"><p>No recommendations at this time</p></div>)}
            </div>

            {/* Plant Activity Monitor */}
            <div className="db-card pam-card">
              <div className="card-title-row"><span className="card-title">Plant Activity Monitor</span>{activeFarm&&<span style={{fontSize:9,color:'#888'}}>{activeFarm.name}</span>}</div>
              <div className="pam-grid">
                <div className="pam-status"><h4>Current Status</h4>{latest?(<div className="pam-metrics">{[['Soil Moisture',latest.soil_moisture?`${latest.soil_moisture.toFixed(0)}%`:'—'],['pH Level',latest.soil_ph?.toFixed(1)??'—'],['Nitrogen',latest.nitrogen?`${latest.nitrogen.toFixed(0)}`:'—'],['Phosphorus',latest.phosphorus?`${latest.phosphorus.toFixed(0)}`:'—'],['Potassium',latest.potassium?`${latest.potassium.toFixed(0)}`:'—']].map(([k,v])=>(<div key={k} className="pam-metric-row" style={{display:'flex',justifyContent:'space-between'}}><span style={{fontSize:8,color:'#888'}}>{k}</span><span style={{fontSize:9,fontWeight:600,color:'#17252A'}}>{v}</span></div>))}</div>):<div style={{fontSize:10,color:'#aaa',padding:'8px 0'}}>No data</div>}</div>
                <div className="pam-env"><h4>Environment</h4><div className="pam-cond">Temp: {latest?.temperature?.toFixed(1)??'—'}°C</div><div className="pam-cond">Humidity: {latest?.humidity?.toFixed(0)??'—'}%</div>{cur&&<div className="pam-cond" style={{marginTop:4,color:'#3AAFA9'}}>{cur.description}</div>}</div>
                <div className="pam-recs"><h4>Recommendations</h4><p className="pam-no-rec">{disease&&!disease.is_healthy?`${disease.predicted_class?.replace(/_/g,' ')} detected`:'No issues detected'}</p></div>
              </div>
              <div className="pam-chart"><Sparkline data={series('soil_moisture')} color="#3AAFA9" height={56}/><Sparkline data={series('soil_ph').map(v=>v*10)} color="#F5A623" height={56}/></div>
            </div>

            {/* Community Hub */}
            <div className="db-card community-card">
              <span className="card-title">Community Hub</span>
              <div style={{margin:'6px 0',fontSize:10,color:'#888'}}>{community?.top_contributors?.length||0} contributors · {community?.recent_posts?.length||0} discussions</div>
              <div className="community-label">Training/Resources</div>
              {(community?.resources||[]).slice(0,4).map(r=>(<div key={r.id} className="resource-item"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>{r.title}</div>))}
              {(!community?.resources||community.resources.length===0)&&<div style={{fontSize:9,color:'#bbb',padding:'4px 0'}}>No resources yet</div>}
              <div className="community-donut-row"><Donut pct={community?.top_contributors?.length?45:0} color="#3AAFA9" size={60}/><Donut pct={community?.recent_posts?.length?70:0} color="#27AE60" size={60}/></div>
              <div className="community-label">Top Contributors</div>
              {(community?.top_contributors||[]).slice(0,3).map(c=>(<div key={c.user} className="contributor-item">{c.user_name} — {c.total} contributions</div>))}
            </div>

            {/* Automated Actions */}
            <div className="db-card actions-card">
              <span className="card-title">Automated Actions</span>
              <div className="actions-grid">
                {[{label:'Irrigation',action:irr},{label:'pH Balance',action:ph},{label:'Pesticide',action:pes}].map(({label,action})=>(<div key={label} className="action-col"><div className="action-col-title">{label}</div><div className="action-row"><span>Automation</span><span className={`automation-badge ${action?.is_enabled?'on':'off'}`}>{action?(action.is_enabled?'Enabled':'Disabled'):'Not set'}</span></div><div className="level-row"><div className="level-label-row"><span>Level</span><span>{action?.current_level!=null?`${action.current_level}%`:'0%'}</span></div><div className="level-bar-track"><div className="level-bar-fill" style={{width:`${action?.current_level||0}%`}}/></div></div></div>))}
              </div>
              <div className="manual-override">
                <div className="override-title">Manual Override Controls</div>
                <div className="override-cols">
                  {[{title:'Irrigation Controls',type:'irrigation',s:'Start Irrigation',e:'Stop Irrigation'},{title:'Fertilizer Controls',type:'ph_adjustment',s:'Start Fertilizer',e:'Stop Fertilizer'},{title:'Pesticide Controls',type:'pesticide',s:'Start Pesticide',e:'Stop Pesticide'}].map(col=>{
                    const act=actions.find(a=>a.action_type===col.type);
                    const refresh=()=>activeFarm&&mlAPI.getActions(activeFarm.id).then(({data})=>setActions(data));
                    return(<div key={col.title} className="override-col"><div className="override-col-title">{col.title}</div><button className="override-btn start" onClick={()=>act&&mlAPI.manualOverride(act.id,'start').then(refresh)}>{col.s}</button><button className="override-btn stop" onClick={()=>act&&mlAPI.manualOverride(act.id,'stop').then(refresh)}>{col.e}</button></div>);
                  })}
                </div>
              </div>
              <div className="actions-bar-chart">{readings.slice(0,12).map((r,i)=>(<div key={i} className="bar-item" style={{height:`${Math.min(95,Math.max(5,((r.soil_moisture||0)/100)*95))}%`,background:i%2===0?'#3AAFA9':'#27AE60'}}/>))}{readings.length===0&&Array.from({length:12}).map((_,i)=>(<div key={i} className="bar-item" style={{height:'5%',background:'#e8e8e8'}}/>))}</div>
            </div>

            {/* Detector */}
            <div className="db-card detector-card">
              <div className="detector-header"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3AAFA9" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg><span className="card-title">Plant Pesticide Detector</span></div>
              <p className="detector-desc">Upload a clear leaf photo to detect diseases using AI.</p>
              {disease&&<div style={{background:disease.is_healthy?'#E8F5E9':'#FFEBEE',borderRadius:8,padding:'8px 10px',marginBottom:6,fontSize:9}}><strong style={{color:disease.is_healthy?'#2E7D32':'#B71C1C'}}>{disease.predicted_class?.replace(/_/g,' ')}</strong><div style={{color:'#666',marginTop:2}}>Confidence: {(disease.confidence*100).toFixed(0)}%</div></div>}
              <div className="detector-dropzone"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="1.5"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg><span>Drag &amp; drop image here</span></div>
              <div className="detector-actions"><button className="detector-remove">Remove</button><button style={{background:'#3AAFA9',color:'white',border:'none',borderRadius:6,padding:'5px 16px',fontSize:'0.78rem',cursor:'pointer'}}>Analyse</button></div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
