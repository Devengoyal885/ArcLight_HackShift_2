import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FloatingNavbar } from '../../components/navigation/FloatingNavbar';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronRight, ChevronLeft, Sparkles, Target, FileText, Video, Briefcase, TrendingUp, BookOpen, Zap, CheckCircle2, AlertCircle, Clock, BarChart2, Star, ArrowUpRight, Layers, Award, Navigation, GitBranch, RotateCcw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getCapabilities } from '../../services/profileService';
import { generateTargetRoles } from '../../services/careerService';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { UserCapability } from '../../services/profileService';
import type { TargetRole } from '../../services/careerService';
import './CareerPage.css';

const SALARY_BANDS = { junior:{min:5,max:12,currency:'LPA'}, mid:{min:12,max:25,currency:'LPA'}, senior:{min:25,max:50,currency:'LPA'}, lead:{min:40,max:80,currency:'LPA'}, principal:{min:60,max:120,currency:'LPA'} };
function estimateSalaryBand(r:string){const n=r.toLowerCase();if(n.includes('principal')||n.includes('architect')||n.includes('vp')||n.includes('director'))return SALARY_BANDS.principal;if(n.includes('lead')||n.includes('staff')||n.includes('head'))return SALARY_BANDS.lead;if(n.includes('senior')||n.includes('sr.'))return SALARY_BANDS.senior;if(n.includes('junior')||n.includes('jr.')||n.includes('entry'))return SALARY_BANDS.junior;return SALARY_BANDS.mid;}
function estimateTimeline(gaps:number,avg:number):string{if(gaps===0)return 'Ready now';const m=Math.ceil(gaps*(avg/20)*2);if(m<=1)return '~1 month';if(m<=12)return m+' months';return Math.round(m/12)+'yr'+(m>18?'s':'');}
function getDemandTag(r:string){const n=r.toLowerCase();if(n.includes('ai')||n.includes('ml')||n.includes('data'))return{label:'Highest Demand',color:'#10b981',bg:'rgba(16,185,129,0.09)'};if(n.includes('fullstack')||n.includes('full-stack')||n.includes('backend')||n.includes('cloud'))return{label:'High Demand',color:'#2563eb',bg:'rgba(37,99,235,0.09)'};if(n.includes('frontend')||n.includes('mobile')||n.includes('devops')||n.includes('security'))return{label:'In Demand',color:'#7c3aed',bg:'rgba(124,58,237,0.09)'};return{label:'Steady Demand',color:'#d97706',bg:'rgba(217,119,6,0.09)'};}
const ROLE_COLORS=[{bg:'#18181B',accent:'#2563eb',light:'rgba(37,99,235,0.08)'},{bg:'#1d4ed8',accent:'#1d4ed8',light:'rgba(29,78,216,0.08)'},{bg:'#047857',accent:'#059669',light:'rgba(5,150,105,0.08)'},{bg:'#7c3aed',accent:'#7c3aed',light:'rgba(124,58,237,0.08)'}];
const STAGE_LABELS=['Junior','Mid-Level','Senior','Lead / Principal'];
const STAGE_SALARIES=['₹5–12 LPA','₹12–25 LPA','₹25–50 LPA','₹50+ LPA'];
const STAGE_YEARS=['0–2 yrs','2–5 yrs','5–9 yrs','9+ yrs'];
const STAGE_DESCS=['Build foundations, learn by doing','Own features, gain depth','Lead initiatives, mentor others','Set direction, architect systems'];
const STAGE_COLORS=['#94A3B8','#2563eb','#7c3aed','#f59e0b'];

export default function CareerPage({isEmbedded=false}:{isEmbedded?:boolean}){
  const{user,dbUid,profile}=useAuth();
  const navigate=useNavigate();
  const[capabilities,setCapabilities]=useState<UserCapability[]>([]);
  const[targetRoles,setTargetRoles]=useState<TargetRole[]>([]);
  const[loading,setLoading]=useState(true);
  const[generating,setGenerating]=useState(false);
  const[activeRoleIndex,setActiveRoleIndex]=useState(0);
  const[viewMode,setViewMode]=useState<'excel'|'switch'>('excel');
  useEffect(()=>{if(!user)return;getCapabilities(dbUid!).then(c=>{setCapabilities(c);setLoading(false);}).catch(e=>{console.error(e);setLoading(false);});},[user]);
  const handleGenerateRoles=async(force=false)=>{
    if(!user||!dbUid)return; setGenerating(true);
    try{
      const CK='career_roles_'+dbUid;
      const hash=capabilities.map(c=>c.skill+':'+c.score).sort().join('|');
      if(!force){
        const cs=localStorage.getItem(CK);
        if(cs){try{const cd=JSON.parse(cs);if(cd.capsHash===hash&&cd.roles?.length>0){setTargetRoles(cd.roles);setActiveRoleIndex(0);setGenerating(false);return;}}catch(_){}}
        const dr=doc(db,'users',dbUid,'meta','careerTarget');const sn=await getDoc(dr);
        if(sn.exists()){const d=sn.data();if(d.capsHash===hash&&d.roles?.length>0){setTargetRoles(d.roles);setActiveRoleIndex(0);setGenerating(false);localStorage.setItem(CK,JSON.stringify({roles:d.roles,timestamp:Date.now(),capsHash:hash}));return;}}
      }
      const roles=await generateTargetRoles(profile?.headline||'Software Engineer',capabilities);
      if(roles.length>0){setTargetRoles(roles);setActiveRoleIndex(0);localStorage.setItem(CK,JSON.stringify({roles,timestamp:Date.now(),capsHash:hash}));await setDoc(doc(db,'users',dbUid,'meta','careerTarget'),{roles,capsHash:hash,updatedAt:serverTimestamp()});}else{setTargetRoles([]);}
    }catch(e){console.error(e);}finally{setGenerating(false);}
  };
  useEffect(()=>{if(!loading&&targetRoles.length===0&&!generating)handleGenerateRoles();},[loading]);
  const nextRole=()=>setActiveRoleIndex(p=>(p+1)%targetRoles.length);
  const prevRole=()=>setActiveRoleIndex(p=>(p-1+targetRoles.length)%targetRoles.length);

  if(loading||generating)return(<div className="career-loading-root">{!isEmbedded&&<FloatingNavbar variant="candidate"/>}<div className="career-loading-card"><div className="career-loading-ring"/><h2>{generating?'Mapping your career…':'Loading your profile…'}</h2><p>{generating?'AI analyzing capabilities and plotting trajectories.':'Fetching capability data…'}</p><div className="career-loading-dots">{[0,1,2,3].map(i=><div key={i} className="career-loading-dot"/>)}</div></div></div>);
  if(targetRoles.length===0)return(<div className="career-loading-root">{!isEmbedded&&<FloatingNavbar variant="candidate"/>}<div className="career-empty-card"><div className="career-empty-icon"><Sparkles size={24}/></div><h2>Chart your career</h2><p>AI will analyze your capabilities and map your best-fit trajectories.</p><button className="career-empty-btn" onClick={()=>handleGenerateRoles(true)}><Sparkles size={16}/> Generate Career Map</button></div></div>);

  const activeRole=targetRoles[activeRoleIndex];
  const colorSet=ROLE_COLORS[activeRoleIndex%ROLE_COLORS.length];
  const salaryBand=estimateSalaryBand(activeRole.role);
  const demand=getDemandTag(activeRole.role);
  const calculatedGaps=activeRole.requirements.map(req=>{const uc=capabilities.find(c=>c.skill.toLowerCase().includes(req.skill.toLowerCase())||req.skill.toLowerCase().includes(c.skill.toLowerCase()));const current=uc?uc.score:0;const status:('met'|'gap'|'missing')=current>=req.required?'met':current>0?'gap':'missing';return{id:req.skill,label:req.skill,current,required:req.required,status};});
  const totalReqs=calculatedGaps.length;
  // Weighted proximity: each skill contributes min(current/required,1)*100 — not binary met/not-met
  // So Python 72% vs 75% required = 96% proximity (not 0%)
  const matchPct=totalReqs>0?Math.round(calculatedGaps.reduce((sum,g)=>sum+(g.required>0?Math.min(g.current/g.required,1):1),0)/totalReqs*100):0;
  const numGaps=calculatedGaps.filter(g=>g.status!=='met').length;
  const avgGapSize=numGaps>0?calculatedGaps.filter(g=>g.status!=='met').reduce((a,g)=>a+(g.required-g.current),0)/numGaps:0;
  const timeline=estimateTimeline(numGaps,avgGapSize);
  const matchColor=matchPct>=70?'#10b981':matchPct>=40?'#f59e0b':'#ef4444';
  const matchBg=matchPct>=70?'rgba(16,185,129,0.1)':matchPct>=40?'rgba(245,158,11,0.1)':'rgba(239,68,68,0.1)';
  const matchLabel=matchPct>=70?'Strong Match':matchPct>=40?'Near Match':'Skill Gap';
  const currentStageIdx=(()=>{const r=activeRole.role.toLowerCase();if(r.includes('junior')||r.includes('jr')||r.includes('entry'))return 0;if(r.includes('senior')||r.includes('sr'))return 2;if(r.includes('lead')||r.includes('principal')||r.includes('architect'))return 3;return 1;})();

  return(
    <div className={`career-page ${isEmbedded ? 'is-embedded' : ''}`}>
      {!isEmbedded&&<FloatingNavbar variant="candidate"/>}
      {!isEmbedded&&<div className="career-page-bg"/>}
      <main className="career-main">

        <motion.div className="career-hero" initial={{opacity:0,y:-16}} animate={{opacity:1,y:0}} transition={{duration:0.45,ease:[0.23,1,0.32,1]}}>
          <div className="career-hero-left">
            <span className="career-badge"><Sparkles size={12}/> AI Career Intelligence</span>
            <h1 className="career-title">Your path to<br/><em>{viewMode==='excel'?'Excellence':'New Horizons'}</em></h1>
            <p className="career-sub">{viewMode==='excel'?'Grow deeper in your domain. Close skill gaps and accelerate your trajectory.':'Pivot to a new field. AI maps transferable skills and what to build next.'}</p>
            <div className="career-mode-toggle">
              <button className={'career-mode-btn '+(viewMode==='excel'?'active':'')} onClick={()=>setViewMode('excel')}><TrendingUp size={14}/> Excel in current</button>
              <button className={'career-mode-btn '+(viewMode==='switch'?'active':'')} onClick={()=>setViewMode('switch')}><GitBranch size={14}/> Switch career</button>
            </div>
          </div>
          <div className="career-hero-stats">
            <div className="career-stat-pill"><div className="csp-icon" style={{background:'rgba(37,99,235,0.08)',color:'#2563eb'}}><Target size={16}/></div><div><span className="csp-label">AI Paths Mapped</span><span className="csp-value">{targetRoles.length} Trajectories</span></div></div>
            <div className="career-stat-pill"><div className="csp-icon" style={{background:matchBg,color:matchColor}}><BarChart2 size={16}/></div><div><span className="csp-label">Active Role Match</span><span className="csp-value" style={{color:matchColor}}>{matchPct}% — {matchLabel}</span></div></div>
            <div className="career-stat-pill"><div className="csp-icon" style={{background:'rgba(16,185,129,0.08)',color:'#10b981'}}><Clock size={16}/></div><div><span className="csp-label">Time to Qualify</span><span className="csp-value">{timeline}</span></div></div>
          </div>
        </motion.div>

        <motion.section className="career-trajectories-section" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.1,duration:0.4,ease:[0.23,1,0.32,1]}}>
          <div className="career-traj-header"><div><p className="career-section-eyebrow">Personalized for you</p><h2>Career Trajectories</h2></div><div className="career-traj-controls"><button className="career-regen-btn" onClick={()=>handleGenerateRoles(true)}><RotateCcw size={13}/> Regenerate</button><div className="carousel-nav"><button onClick={prevRole} className="carousel-btn"><ChevronLeft size={18}/></button><button onClick={nextRole} className="carousel-btn"><ChevronRight size={18}/></button></div></div></div>
          <div className="career-roles-track-wrap">
            <div className="career-roles-track" style={{transform:'translateX(calc(-'+activeRoleIndex+' * (300px + 16px)))' }}>
              {targetRoles.map((role,idx)=>{
                const rPct=role.requirements.length>0?Math.round(role.requirements.reduce((sum,req)=>{const uc=capabilities.find(c=>c.skill.toLowerCase().includes(req.skill.toLowerCase())||req.skill.toLowerCase().includes(c.skill.toLowerCase()));const cur=uc?uc.score:0;return sum+(req.required>0?Math.min(cur/req.required,1):1);},0)/role.requirements.length*100):0;
                const ia=idx===activeRoleIndex;
                const rC=ROLE_COLORS[idx%ROLE_COLORS.length];
                const rD=getDemandTag(role.role);const rS=estimateSalaryBand(role.role);
                const rMC=rPct>=70?'#10b981':rPct>=40?'#f59e0b':'#ef4444';
                const rMB=rPct>=70?'rgba(16,185,129,0.1)':rPct>=40?'rgba(245,158,11,0.1)':'rgba(239,68,68,0.1)';
                const rMBo=rPct>=70?'rgba(16,185,129,0.2)':rPct>=40?'rgba(245,158,11,0.2)':'rgba(239,68,68,0.2)';
                const icons=[<Layers size={18} color="white"/>,<TrendingUp size={18} color="white"/>,<Target size={18} color="white"/>,<Star size={18} color="white"/>];
                return(
                  <motion.div key={role.id||idx} onClick={()=>setActiveRoleIndex(idx)} className={'career-role-card'+(ia?' active':'')} initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:idx*0.06,duration:0.35,ease:[0.23,1,0.32,1]}} style={ia?{borderColor:rC.accent,boxShadow:'0 0 0 1px '+rC.accent+', 0 8px 28px -6px '+rC.accent+'30'} as React.CSSProperties:{}}>
                    {ia&&<div className="role-card-accent-bar" style={{background:'linear-gradient(90deg,'+rC.accent+','+rC.accent+'88)'}}/>}
                    <div className="role-card-header"><div className="role-card-icon" style={{background:rC.bg}}>{icons[idx%4]}</div><span className="role-match-badge" style={{background:rMB,color:rMC,border:'1px solid '+rMBo}}>{rPct}% Match</span></div>
                    <h3 className="role-card-title">{role.role}</h3>
                    <div className="role-card-meta"><span className="role-salary-chip">₹{rS.min}–{rS.max} {rS.currency}</span><span className="role-demand-chip" style={{color:rD.color,background:rD.bg}}>{rD.label}</span></div>
                    <div className="role-tags">{role.tags.map(t=><span key={t} className="role-tag" style={{background:ia?rC.light:'#F4F4F5',color:ia?rC.accent:'#52525b',border:ia?'1px solid '+rC.accent+'22':'1px solid transparent'}}>{t}</span>)}</div>
                    <div className="role-card-progress"><div className="role-card-progress-bar"><div className="role-card-progress-fill" style={{width:rPct+'%',background:rMC}}/></div><span className="role-card-progress-label">{rPct}% capability match</span></div>
                  </motion.div>
                );
              })}
            </div>
          </div>
          <div className="career-carousel-dots">{targetRoles.map((_,idx)=><div key={idx} onClick={()=>setActiveRoleIndex(idx)} className={'career-carousel-dot'+(idx===activeRoleIndex?' active':'')} style={{width:idx===activeRoleIndex?'24px':'8px',background:idx===activeRoleIndex?colorSet.accent:undefined}}/>)}</div>
        </motion.section>

        <AnimatePresence mode="wait">
          <motion.div key={activeRole.id} className="career-analysis-bento" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-12}} transition={{duration:0.35,ease:[0.23,1,0.32,1]}}>

            <div className="career-bento-role-overview"><div className="bento-panel">
              <div className="bento-panel-header"><div className="bento-role-icon" style={{background:colorSet.bg}}><Navigation size={20} color="white"/></div><div><h3 className="bento-role-name">{activeRole.role}</h3><p className="bento-role-sub">Active Target Role</p></div></div>
              <div className="role-overview-metrics">
                <div className="rom-item"><span className="rom-label">Salary Range</span><span className="rom-value">₹{salaryBand.min}–{salaryBand.max} <em>{salaryBand.currency}</em></span></div>
                <div className="rom-item"><span className="rom-label">Market Demand</span><span className="rom-value" style={{color:demand.color}}>{demand.label}</span></div>
                <div className="rom-item"><span className="rom-label">Your Match</span><span className="rom-value" style={{color:matchColor}}>{matchPct}%</span></div>
                <div className="rom-item"><span className="rom-label">Ready In</span><span className="rom-value">{timeline}</span></div>
              </div>
              <div className="match-arc-container"><svg viewBox="0 0 200 115" className="match-arc-svg"><path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="rgba(226,232,240,0.8)" strokeWidth="12" strokeLinecap="round"/><path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke={matchColor} strokeWidth="12" strokeLinecap="round" strokeDasharray={(matchPct/100*251.2)+' 251.2'} style={{transition:'stroke-dasharray 0.8s cubic-bezier(0.23,1,0.32,1)'}}/><text x="100" y="86" textAnchor="middle" style={{fontSize:'26px',fontWeight:800,fontFamily:'Outfit,sans-serif',fill:'#18181B'}}>{matchPct}%</text><text x="100" y="103" textAnchor="middle" style={{fontSize:'11px',fontWeight:600,fontFamily:'Outfit,sans-serif',fill:'#94A3B8',letterSpacing:'0.05em'}}>CAPABILITY MATCH</text></svg></div>
              <div className="skill-req-list">{calculatedGaps.map((gap,i)=>(<motion.div key={gap.id} className="skill-req-item" initial={{opacity:0,x:-8}} animate={{opacity:1,x:0}} transition={{delay:0.05+i*0.04}}><div className="sri-top"><div className="sri-name-row">{gap.status==='met'?<CheckCircle2 size={13} color="#10b981"/>:<AlertCircle size={13} color={gap.status==='gap'?'#f59e0b':'#ef4444'}/>}<span className="sri-name">{gap.label}</span></div><span className="sri-scores"><span style={{color:gap.status==='met'?'#10b981':'#18181B',fontWeight:700}}>{gap.current}%</span><span style={{color:'#94A3B8'}}> / {gap.required}%</span></span></div><div className="sri-bar-track"><div className="sri-bar-req" style={{width:gap.required+'%'}}/><div className="sri-bar-current" style={{width:gap.current+'%',background:gap.status==='met'?'#10b981':gap.status==='gap'?'#f59e0b':'#ef4444'}}/></div></motion.div>))}</div>
            </div></div>

            <div className="career-bento-roadmap"><div className="bento-panel">
              <div className="roadmap-header"><div><h3>Transition Roadmap</h3><p className="panel-sub">Step-by-step to {activeRole.role}</p></div><span className="steps-badge" style={{background:colorSet.light,color:colorSet.accent}}>{numGaps===0?'✓ Complete':numGaps+' Steps'}</span></div>
              {numGaps===0?(
                <div className="roadmap-complete-state"><div className="roadmap-complete-icon"><Sparkles size={28} color="white"/></div><h4>You're fully qualified!</h4><p>Your capabilities meet all requirements. Start applying today.</p><Link to="/candidate/opportunities" className="btn-primary-launch" style={{textDecoration:'none',background:'linear-gradient(135deg,#10b981,#0ea5e9)'}}>View Matching Jobs <ArrowRight size={16}/></Link></div>
              ):(
                <><div className="roadmap-timeline">{calculatedGaps.filter(g=>g.status!=='met').map((gap,i,arr)=>{
                  const def=gap.required-gap.current;const eff=def>30?'High':def>15?'Medium':'Low';const ec=def>30?'#ef4444':def>15?'#f59e0b':'#10b981';
                  return(<motion.div key={gap.label} className="roadmap-item" initial={{opacity:0,x:16}} animate={{opacity:1,x:0}} transition={{delay:0.15+i*0.08}}>
                    <div className="roadmap-connector"><div className={'roadmap-dot '+(gap.status==='gap'?'type-improve':'type-learn')}/>{i!==arr.length-1&&<div className="roadmap-line"/>}</div>
                    <div className="roadmap-content"><div className="roadmap-item-header"><span className={'roadmap-type-badge '+(gap.status==='gap'?'type-improve':'type-learn')}><BookOpen size={11}/>{gap.status==='gap'?'IMPROVE':'LEARN'}</span><span className="roadmap-effort" style={{color:ec}}>{eff} effort</span></div>
                    <h4 className="roadmap-step-title">{gap.label}</h4><p className="roadmap-step-desc">{gap.status==='gap'?'Boost from '+gap.current+'% → '+gap.required+'% (+'+def+' pts)':'Build from zero to '+gap.required+'%'}</p>
                    <div className="roadmap-mini-bar"><div className="rmb-track"><div className="rmb-req" style={{width:gap.required+'%'}}/><div className="rmb-current" style={{width:gap.current+'%',background:gap.status==='gap'?'#f59e0b':'#ef4444'}}/></div><span className="rmb-label">{gap.current}% now</span></div></div>
                  </motion.div>);
                })}</div><div className="roadmap-cta"><Link to="/candidate/learning" className="btn-primary-launch" style={{textDecoration:'none'}}><BookOpen size={15}/> Generate AI Learning Path <ArrowRight size={15}/></Link></div></>
              )}
            </div></div>

            <div className="career-bento-path-arc"><div className="bento-panel path-arc-panel">
              <div className="path-arc-header"><h3>Career Progression Arc</h3><p className="panel-sub">Industry milestones for {activeRole.role}</p></div>
              <div className="path-arc-stages">{STAGE_LABELS.map((stage,i)=>{
                const isPast=i<currentStageIdx,isCurrent=i===currentStageIdx,isFuture=i>currentStageIdx;
                return(<div key={stage} className={'path-stage '+(isCurrent?'current':isPast?'past':'future')}>
                  <div className="ps-top-row"><div className="ps-node" style={{background:isCurrent?STAGE_COLORS[i]:isPast?'#10b981':'rgba(226,232,240,0.6)',borderColor:isCurrent?STAGE_COLORS[i]:isPast?'#10b981':'#E2E8F0'}}>{isPast?<CheckCircle2 size={14} color="white"/>:isCurrent?<Star size={14} color="white"/>:<span className="ps-num">{i+1}</span>}</div>{i<3&&<div className="ps-connector" style={{background:isPast?'#10b981':'rgba(226,232,240,0.8)'}}/>}</div>
                  <div className="ps-info"><div className="ps-label-row"><span className="ps-label" style={{color:isCurrent?STAGE_COLORS[i]:isFuture?'#94A3B8':'#10b981'}}>{stage}</span>{isCurrent&&<span className="ps-you-tag" style={{background:STAGE_COLORS[i]+'18',color:STAGE_COLORS[i]}}>← You</span>}</div>
                  <span className="ps-salary">{STAGE_SALARIES[i]}</span><span className="ps-years">{STAGE_YEARS[i]}</span><span className="ps-desc">{STAGE_DESCS[i]}</span></div>
                </div>);
              })}</div>
              <p className="path-arc-note"><Zap size={12}/> India benchmarks for <strong>{activeRole.role}</strong></p>
            </div></div>
          </motion.div>
        </AnimatePresence>

        <motion.section className="career-action-center" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.4,duration:0.4,ease:[0.23,1,0.32,1]}}>
          <div className="action-center-header"><h2>Take Action</h2><p className="panel-sub">Accelerate your path to {activeRole.role}</p></div>
          <div className="career-action-tiles">
            <div className="career-action-tile"><div className="career-action-icon" style={{background:'rgba(22,163,74,0.08)',color:'#16a34a'}}><FileText size={20}/></div><h4 className="career-action-title">Tailor Resume</h4><p className="career-action-desc">Generate a resume aligned with {activeRole.role} requirements.</p><button className="career-action-btn" onClick={()=>{const jd='Target Role: '+activeRole.role+'\nKey Requirements: '+activeRole.requirements.map(r=>r.skill).join(', ');navigate('/candidate/resume',{state:{jdText:jd}});}}>Start tailoring <ArrowUpRight size={13}/></button></div>
            <div className="career-action-tile"><div className="career-action-icon" style={{background:'rgba(2,132,199,0.08)',color:'#0284c7'}}><Video size={20}/></div><h4 className="career-action-title">Mock Interview</h4><p className="career-action-desc">Practice a realistic AI interview for {activeRole.role}.</p><button className="career-action-btn" onClick={()=>navigate('/candidate/interview',{state:{role:activeRole.role}})}>Start practice <ArrowUpRight size={13}/></button></div>
            <div className="career-action-tile"><div className="career-action-icon" style={{background:'rgba(220,38,38,0.08)',color:'#dc2626'}}><Briefcase size={20}/></div><h4 className="career-action-title">Find Jobs</h4><p className="career-action-desc">Browse live openings matching this role profile.</p><button className="career-action-btn" onClick={()=>navigate('/candidate/opportunities',{state:{search:activeRole.role}})}>Search jobs <ArrowUpRight size={13}/></button></div>
            <div className="career-action-tile"><div className="career-action-icon" style={{background:'rgba(124,58,237,0.08)',color:'#7c3aed'}}><Award size={20}/></div><h4 className="career-action-title">Build Skills</h4><p className="career-action-desc">AI-curated paths for {numGaps} skill gap{numGaps!==1?'s':''} holding you back.</p><button className="career-action-btn" onClick={()=>navigate('/candidate/learning')}>Start learning <ArrowUpRight size={13}/></button></div>
          </div>
        </motion.section>
      </main>
    </div>
  );
}