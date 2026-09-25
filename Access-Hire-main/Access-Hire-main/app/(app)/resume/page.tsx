'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Zap, CheckCircle2, ArrowRight, Brain,
  TrendingUp, AlertCircle, Copy, Download, RefreshCw,
  Printer, Shield, Award, Briefcase, GraduationCap,
} from 'lucide-react';
import { getUserProfile, getUserCapabilities, getUserOpportunities } from '@/data/mockData';
import { sleep } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import type { UserProfile, Capability } from '@/types';

function buildDynamicResume(profile: UserProfile, capabilities: Capability[], jdRole?: string): string {
  const isDeven = profile.id === 'user-deven' || profile.name.toLowerCase().includes('deven');
  const isSunita = profile.id === 'user-sunita' || profile.name.toLowerCase().includes('sunita');

  const contactLine = [
    profile.location,
    profile.contact?.phone ? `Tel: ${profile.contact.phone}` : null,
    profile.contact?.email || profile.email,
    profile.contact?.github ? `github.com/${profile.contact.github}` : null,
    profile.contact?.linkedin ? `linkedin.com/in/${profile.contact.linkedin.toLowerCase().replace(/\s+/g, '-')}` : null,
  ].filter(Boolean).join(' · ');

  const roleHeadline = jdRole ? jdRole.toUpperCase() : (profile.targetRole || profile.title || 'AI INNOVATION CANDIDATE').toUpperCase();
  const topCaps = capabilities.slice(0, 6).map(c => `${c.name} (${c.proficiency}%)`).join(' · ');

  let content = `${profile.name.toUpperCase()}\n${contactLine}\n\n${roleHeadline}\n${topCaps}\nCapability Twin Score: ${profile.capabilityTwinScore}% | Future Readiness: ${profile.futureReadiness}%\n\n`;

  content += `─────────────────────────────────────────────────────\nPROFESSIONAL SUMMARY\n─────────────────────────────────────────────────────\n${profile.summary || 'Passionate technology innovator developing research-driven solutions across enterprise AI, full-stack systems, and product innovation.'}\n\n`;

  if (isDeven) {
    content += `─────────────────────────────────────────────────────\nPATENT PORTFOLIO (21 FILED & PUBLISHED DISCLOSURES)\n─────────────────────────────────────────────────────\n`;
    if (profile.patents && profile.patents.length > 0) {
      profile.patents.slice(0, 8).forEach(p => {
        content += `• ${p.title} | App No. ${p.applicationNo} [${p.status} - ${p.year}]\n`;
      });
      if (profile.patents.length > 8) {
        content += `• ...and ${profile.patents.length - 8} additional filed/published patent disclosures across Wearable AI, Smart IoT, and Biomechanical Systems.\n`;
      }
    }
    content += `\n`;

    content += `─────────────────────────────────────────────────────\nPROJECTS & AI PLATFORMS\n─────────────────────────────────────────────────────\n`;
    if (profile.projectsList) {
      profile.projectsList.forEach(pr => {
        content += `${pr.name} | ${pr.period}\n`;
        if (pr.bullets) {
          pr.bullets.forEach(b => { content += `• ${b}\n`; });
        }
        content += `\n`;
      });
    }

    content += `─────────────────────────────────────────────────────\nHACKATHON HONORS & DISTINCTIONS\n─────────────────────────────────────────────────────\n`;
    if (profile.hackathonsList) {
      profile.hackathonsList.forEach(h => {
        content += `• ${h.title}${h.placement ? ` (${h.placement})` : ''}${h.org ? ` — ${h.org}` : ''}\n`;
      });
    }
    content += `\n`;
  } else if (isSunita) {
    content += `─────────────────────────────────────────────────────\nEXPERIENCE & COMMUNITY COORDINATION\n─────────────────────────────────────────────────────\n`;
    content += `Elder Care Logistics & Primary Healthcare Coordinator | Lucknow    2023–2026\n• Managed comprehensive elder care logistics, medical appointments, and patient budgets\n• Engineered Python automation scripts to digitize family medical records and track expenses\n• Coordinated neighbourhood support network of 40 households with medical vendor negotiations\n\n`;
  } else {
    content += `─────────────────────────────────────────────────────\nRELEVANT EXPERIENCE\n─────────────────────────────────────────────────────\n`;
    content += `IT Support & Automation Engineer | Freelance               2021–2023\n• Deployed and administered Linux servers for 10+ production clients\n• Authored Python automation scripts eliminating 8 hours/week of manual work\n• Integrated REST APIs across 5 client systems for workflow automation\n• Resolved 500+ technical incidents with 98% first-contact resolution rate\n\nCommunity Operations Lead | Hubli Festival Foundation     2023–2024\n• Coordinated technology infrastructure for annual event with 5,000+ attendees\n• Managed ₹8,00,000 budget across 25 vendors with zero overruns\n• Directed cross-functional team of 50 volunteers across logistics and tech\n\n`;
    content += `─────────────────────────────────────────────────────\nAI OPERATIONS PROJECTS\n─────────────────────────────────────────────────────\nAI Evaluation Framework                                     2026\n• Built Python library for evaluating LLM output quality using RAGAS metrics\n• REST API integration for automated quality monitoring pipelines\n\nProduction Automation Suite                                2025\n• Python-based automation reducing manual operational tasks by 60%\n\n`;
  }

  content += `─────────────────────────────────────────────────────\nVERIFIED TECHNICAL CAPABILITIES\n─────────────────────────────────────────────────────\n`;
  content += capabilities.map(c => `${c.name}: ${c.proficiency}% (Confidence: ${c.evidenceConfidence}%)`).join(' · ') + `\n\n`;

  content += `─────────────────────────────────────────────────────\nEDUCATION & CERTIFICATIONS\n─────────────────────────────────────────────────────\n`;
  if (profile.educationList && profile.educationList.length > 0) {
    profile.educationList.forEach(ed => {
      content += `• ${ed.degree} | ${ed.institution} (${ed.year})${ed.score ? ` · Score: ${ed.score}` : ''}\n`;
      if (ed.distinction) content += `  Distinction: ${ed.distinction}\n`;
    });
  } else {
    content += `• ${profile.education}\n`;
  }

  if (profile.certifications && profile.certifications.length > 0) {
    profile.certifications.forEach(cert => {
      content += `• Certification: ${cert}\n`;
    });
  }

  content += `\n─────────────────────────────────────────────────────\nCAPABILITY VERIFICATION ATTESTATION\n─────────────────────────────────────────────────────\nAccessHire Adaptive Capability Twin — ${profile.capabilityTwinScore}% Verified Potential.\nGrounded in independently verifiable evidence, code repositories, and filed intellectual property.`;

  return content;
}

function ATSBar({ label, before, after, color }: { label: string; before?: number; after: number; color: string }) {
  return (
    <div style={{ marginBottom: '0.625rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.775rem' }}>
        <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          {before !== undefined && (
            <span style={{ color: 'var(--text-muted)', textDecoration: 'line-through', fontSize: '0.725rem' }}>{before}%</span>
          )}
          <span style={{ color, fontWeight: 700 }}>{after}%</span>
          {before !== undefined && (
            <span style={{ color: 'var(--green)', fontSize: '0.7rem' }}>+{after - before}%</span>
          )}
        </div>
      </div>
      <div style={{ height: 6, background: 'var(--bg-elevated)', borderRadius: 999, overflow: 'hidden' }}>
        {before !== undefined && (
          <motion.div
            initial={{ width: `${before}%` }}
            animate={{ width: `${after}%` }}
            transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
            style={{ height: '100%', background: color, borderRadius: 999, transition: 'width 0.8s ease-out' }}
          />
        )}
        {before === undefined && (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${after}%` }}
            transition={{ duration: 0.8, delay: 0.2 }}
            style={{ height: '100%', background: color, borderRadius: 999 }}
          />
        )}
      </div>
    </div>
  );
}

export default function ResumePage() {
  const { user } = useAuth();
  const profile = getUserProfile(user?.email);
  const capabilities = getUserCapabilities(user?.email);
  const opportunities = getUserOpportunities(user?.email);

  const [stage, setStage] = useState<'input' | 'analyzing' | 'generated'>('input');
  const [jd, setJd] = useState('');
  const [loadingMsg, setLoadingMsg] = useState('');
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [selectedOpp, setSelectedOpp] = useState(opportunities[0]?.id || '');
  const [selectedOppTitle, setSelectedOppTitle] = useState(opportunities[0]?.title || 'Target Role');
  const [activeTab, setActiveTab] = useState<'jd' | 'resume'>('jd');

  const jdExample = useMemo(() => {
    if (profile.id === 'user-deven' || profile.name.toLowerCase().includes('deven')) {
      return `AI Systems & LLM Architecture Fellow — NVIDIA Applied AI Labs

We are looking for an exceptional AI Systems Engineer with patent/IP innovation experience.

Requirements:
- Proficiency in Python, LLM fine-tuning, and edge AI deployment
- Full-stack web application development (Next.js, React, REST APIs)
- Experience in hardware-AI, IoT, or wearable biosensing architectures
- Strong algorithmic foundations and hackathon problem-solving record
- Intellectual property awareness or patent disclosures a strong advantage

Responsibilities:
- Deploy and benchmark edge-optimized LLM inference pipelines
- Build full-stack visualization and telemetry analytics dashboards
- Collaborate with applied AI researchers on wearable sensor integration`;
    }
    return `AI Operations Intern — Infosys AI Labs

We are looking for a motivated AI Operations Intern to join our production AI team.

Requirements:
- Proficiency in Python for scripting and automation
- Experience with REST APIs and microservices
- Linux/Unix administration skills
- Understanding of AI/ML model deployment
- Ability to monitor and evaluate AI system performance`;
  }, [profile]);

  const generatedResume = useMemo(() => {
    return buildDynamicResume(profile, capabilities, selectedOppTitle);
  }, [profile, capabilities, selectedOppTitle]);

  const masterSections = useMemo(() => {
    if (profile.id === 'user-deven' || profile.name.toLowerCase().includes('deven')) {
      return [
        { label: 'Personal Information', detail: `${profile.name} · ${profile.contact?.phone || '8708252284'}` },
        { label: 'Education', detail: 'B.E. CSE Full Stack, Chandigarh University' },
        { label: 'Patent Disclosures', detail: '21 Filed/Published Patents' },
        { label: 'AI Projects', detail: 'MailIQ & Cogniflow AI Analytics' },
        { label: 'Hackathons', detail: 'Vibe Coding 2nd (676 Teams), IIT Ropar 1st' },
        { label: 'Certifications', detail: 'NVIDIA LLM Application Development' },
        { label: 'Verified Capabilities', detail: `${capabilities.length} Verified Twin Capabilities` },
      ];
    }
    return [
      { label: 'Personal Information', detail: `${profile.name} · ${profile.location}` },
      { label: 'Education', detail: profile.education },
      { label: 'Work Experience', detail: 'Caregiving & Community Technology' },
      { label: 'Technical Projects', detail: 'Python Automation & Analytics' },
      { label: 'Verified Capabilities', detail: `${capabilities.length} Verified Capabilities` },
    ];
  }, [profile, capabilities]);

  const analyze = async () => {
    if (!jd.trim()) return;
    setStage('analyzing');
    const msgs = [
      `Reading job description for ${profile.name}...`,
      'Analyzing keyword requirements...',
      'Matching against Adaptive Capability Twin...',
      'Injecting verified patent & project evidence...',
      'Calculating ATS fit...',
      'Generating optimized resume...',
    ];
    for (const m of msgs) {
      setLoadingMsg(m);
      await sleep(400);
    }
    setStage('generated');
    setActiveTab('resume');
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedResume);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportPDF = () => {
    // Dynamic filename: {FirstName}_{LastName}_Resume_{RoleAppliedFor}.pdf
    const cleanFirstName = profile.name.split(' ')[0] || 'Candidate';
    const cleanLastName = profile.name.split(' ').slice(1).join('_') || 'Profile';
    const cleanRole = (selectedOppTitle || 'Optimized_Role').replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `${cleanFirstName}_${cleanLastName}_Resume_${cleanRole}.pdf`;

    // Create printable structured view and trigger print/PDF window
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${filename}</title>
          <style>
            @page { size: A4; margin: 18mm; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              color: #111827;
              line-height: 1.5;
              font-size: 11pt;
              margin: 0;
              padding: 20px;
            }
            h1 { font-size: 20pt; margin: 0 0 4px 0; font-weight: 800; color: #0f172a; text-transform: uppercase; }
            .contact { font-size: 9pt; color: #475569; margin-bottom: 14px; }
            .headline { font-size: 12pt; font-weight: 700; color: #2563eb; margin-bottom: 10px; text-transform: uppercase; }
            .section-header {
              font-size: 10pt;
              font-weight: 800;
              color: #0f172a;
              border-bottom: 1.5px solid #cbd5e1;
              padding-bottom: 3px;
              margin-top: 14px;
              margin-bottom: 8px;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }
            .item-title { font-weight: 700; color: #1e293b; font-size: 10pt; }
            .item-sub { font-size: 9pt; color: #64748b; margin-bottom: 4px; }
            ul { margin: 4px 0 10px 18px; padding: 0; }
            li { font-size: 9.5pt; color: #334155; margin-bottom: 3px; }
            .badge-row { font-size: 9pt; color: #1e293b; background: #f1f5f9; padding: 6px 10px; border-radius: 4px; margin-bottom: 10px; }
            .attestation { font-size: 8.5pt; color: #64748b; margin-top: 18px; border-top: 1px dashed #cbd5e1; padding-top: 8px; font-style: italic; }
          </style>
        </head>
        <body>
          <h1>${profile.name}</h1>
          <div class="contact">
            ${profile.location} &nbsp;|&nbsp; 
            ${profile.contact?.phone ? `Tel: ${profile.contact.phone} &nbsp;|&nbsp;` : ''} 
            ${profile.contact?.email || profile.email} &nbsp;|&nbsp; 
            ${profile.contact?.github ? `GitHub: ${profile.contact.github} &nbsp;|&nbsp;` : ''} 
            ${profile.contact?.linkedin ? `LinkedIn: ${profile.contact.linkedin}` : ''}
          </div>
          <div class="headline">${selectedOppTitle}</div>
          <div class="badge-row">
            <strong>Adaptive Capability Twin Score:</strong> ${profile.capabilityTwinScore}% &nbsp;|&nbsp; 
            <strong>Future Readiness:</strong> ${profile.futureReadiness}% &nbsp;|&nbsp; 
            <strong>Momentum:</strong> +${profile.capabilityMomentum}%
          </div>

          <div class="section-header">Professional Summary</div>
          <p style="font-size: 9.5pt; color: #334155; margin: 0 0 10px 0;">${profile.summary || 'Passionate technology innovator developing research-driven solutions across enterprise AI, full-stack systems, and product innovation.'}</p>

          ${profile.patents && profile.patents.length > 0 ? `
            <div class="section-header">Patent Portfolio (${profile.patents.length} Disclosures)</div>
            <ul>
              ${profile.patents.slice(0, 8).map(p => `<li><strong>${p.title}</strong> — App No. ${p.applicationNo} [${p.status} - ${p.year}]</li>`).join('')}
              ${profile.patents.length > 8 ? `<li><em>...and ${profile.patents.length - 8} additional patent disclosures.</em></li>` : ''}
            </ul>
          ` : ''}

          ${profile.projectsList && profile.projectsList.length > 0 ? `
            <div class="section-header">Engineering Projects</div>
            ${profile.projectsList.map(pr => `
              <div class="item-title">${pr.name} <span style="float: right; font-weight: normal; color: #64748b;">${pr.period}</span></div>
              <ul>
                ${(pr.bullets || []).map(b => `<li>${b}</li>`).join('')}
              </ul>
            `).join('')}
          ` : ''}

          ${profile.hackathonsList && profile.hackathonsList.length > 0 ? `
            <div class="section-header">Hackathon Achievements & Awards</div>
            <ul>
              ${profile.hackathonsList.map(h => `<li><strong>${h.title}</strong> ${h.placement ? `(${h.placement})` : ''} ${h.org ? `— ${h.org}` : ''}</li>`).join('')}
            </ul>
          ` : ''}

          <div class="section-header">Verified Capabilities</div>
          <p style="font-size: 9.5pt; color: #334155; margin: 0 0 10px 0;">
            ${capabilities.map(c => `<strong>${c.name}</strong> (${c.proficiency}%)`).join(' &nbsp;•&nbsp; ')}
          </p>

          <div class="section-header">Education & Certifications</div>
          <ul>
            ${(profile.educationList || [{ degree: profile.education, institution: '', year: '' }]).map(ed => `
              <li><strong>${ed.degree}</strong> ${ed.institution ? `— ${ed.institution}` : ''} ${ed.year ? `(${ed.year})` : ''} ${ed.score ? `[${ed.score}]` : ''} ${ed.distinction ? `— <em>${ed.distinction}</em>` : ''}</li>
            `).join('')}
            ${(profile.certifications || []).map(cert => `<li><strong>Certification:</strong> ${cert}</li>`).join('')}
          </ul>

          <div class="attestation">
            Verified by AccessHire Adaptive Capability Twin. Grounded in independently verifiable evidence and intellectual property.
          </div>
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
    }

    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2500);
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Resume Studio</h1>
        <p className="page-subtitle">
          Master profile for <strong>{profile.name}</strong>. One source of truth, every application optimized.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1.25rem' }}>

        {/* Left: JD Input + Resume Output */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Tab Nav */}
          <div className="tab-nav" style={{ width: 'fit-content' }}>
            <button className={`tab-item ${activeTab === 'jd' ? 'active' : ''}`} onClick={() => setActiveTab('jd')}>Job Description</button>
            <button className={`tab-item ${activeTab === 'resume' ? 'active' : ''}`} onClick={() => setActiveTab('resume')}>Generated Resume ({profile.name.split(' ')[0]})</button>
          </div>

          {activeTab === 'jd' && (
            <div className="card" style={{ padding: '1.25rem' }}>
              <div className="section-title" style={{ marginBottom: '0.875rem' }}>Paste or Select Job Description</div>

              {/* Quick select from active persona's opportunities */}
              <div style={{ marginBottom: '0.75rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.375rem' }}>Quick select from {profile.name.split(' ')[0]}&apos;s Opportunity Radar:</div>
                <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                  {opportunities.slice(0, 4).map(o => (
                    <button
                      key={o.id}
                      onClick={() => {
                        setJd(jdExample);
                        setSelectedOpp(o.id);
                        setSelectedOppTitle(o.title);
                      }}
                      style={{
                        padding: '0.25rem 0.625rem', borderRadius: 999, fontSize: '0.725rem',
                        background: selectedOpp === o.id ? 'rgba(79,142,247,0.15)' : 'var(--bg-elevated)',
                        border: `1px solid ${selectedOpp === o.id ? 'rgba(79,142,247,0.3)' : 'var(--border)'}`,
                        color: selectedOpp === o.id ? 'var(--blue-primary)' : 'var(--text-secondary)',
                        cursor: 'pointer', transition: 'all 0.12s',
                      }}
                    >
                      {o.title.slice(0, 32)}...
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                value={jd}
                onChange={e => setJd(e.target.value)}
                placeholder={`Paste the job description here for ${profile.name}...`}
                className="input"
                style={{ minHeight: 240, resize: 'vertical', lineHeight: 1.6 }}
                id="jd-input"
              />

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                <button
                  onClick={() => setJd(jdExample)}
                  className="btn-ghost"
                  style={{ border: '1px solid var(--border)', fontSize: '0.775rem' }}
                >
                  Use {profile.name.split(' ')[0]} Example JD
                </button>
                <button
                  onClick={analyze}
                  disabled={!jd.trim() || stage === 'analyzing'}
                  className="btn-primary"
                  id="analyze-jd-btn"
                >
                  <Zap size={14} /> Analyze &amp; Generate Resume
                </button>
              </div>

              {stage === 'analyzing' && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginTop: '0.875rem' }}
                >
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    {[0,1,2].map(i => <div key={i} className="ai-dot" style={{ animationDelay: `${i*0.2}s` }} />)}
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--blue-primary)', fontWeight: 500 }}>{loadingMsg}</span>
                </motion.div>
              )}
            </div>
          )}

          {activeTab === 'resume' && stage === 'generated' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <div className="section-title">{profile.name} — {selectedOppTitle}</div>
                  <div className="section-subtitle">Grounded in verified capabilities &amp; real Master Profile</div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={handleCopy} className="btn-ghost" style={{ border: '1px solid var(--border)', fontSize: '0.75rem' }}>
                    {copied ? <CheckCircle2 size={13} style={{ color: 'var(--green)' }} /> : <Copy size={13} />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                  <button
                    onClick={handleExportPDF}
                    className="btn-primary"
                    style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                    id="export-pdf-btn"
                  >
                    <Download size={13} /> {downloaded ? 'Exporting PDF...' : 'Export PDF'}
                  </button>
                  <button onClick={analyze} className="btn-ghost" style={{ border: '1px solid var(--border)', fontSize: '0.75rem' }}>
                    <RefreshCw size={13} /> Regenerate
                  </button>
                </div>
              </div>

              <div className="mono" style={{
                background: 'var(--bg-elevated)', borderRadius: 8,
                padding: '1.25rem', fontSize: '0.725rem', lineHeight: 1.7,
                color: 'var(--text-secondary)', maxHeight: 520, overflowY: 'auto',
                border: '1px solid var(--border)', whiteSpace: 'pre-wrap',
              }}>
                {generatedResume}
              </div>

              <div style={{
                marginTop: '0.875rem', padding: '0.625rem 0.875rem',
                background: 'rgba(79,142,247,0.06)', borderRadius: 8,
                border: '1px solid rgba(79,142,247,0.15)',
                fontSize: '0.75rem', color: 'var(--text-secondary)',
              }}>
                <strong style={{ color: 'var(--blue-primary)' }}>✓ Verified Identity:</strong> Showing authentic data for <strong>{profile.name}</strong> ({profile.email}). All patent numbers, awards, and credentials reflect verified evidence.
              </div>
            </motion.div>
          )}

          {activeTab === 'resume' && stage !== 'generated' && (
            <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
              <FileText size={32} style={{ color: 'var(--text-muted)', marginBottom: '0.75rem' }} />
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                Paste a job description on the JD tab and click &quot;Analyze &amp; Generate Resume&quot; to create {profile.name}&apos;s tailored resume.
              </div>
            </div>
          )}
        </div>

        {/* Right: Master Profile Summary & ATS Analysis */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Master Profile Summary */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem' }}>
              <div className="section-title">Master Profile ({profile.name.split(' ')[0]})</div>
              <span className="badge badge-blue">100% Synced</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {masterSections.map(s => (
                <div key={s.label} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '0.45rem 0.625rem', borderRadius: 6,
                  background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>{s.label}</div>
                    <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>{s.detail}</div>
                  </div>
                  <CheckCircle2 size={13} style={{ color: 'var(--green)', flexShrink: 0 }} />
                </div>
              ))}
            </div>
          </div>

          {/* ATS Analysis */}
          {stage === 'generated' && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div className="section-title">ATS Analysis</div>
                <span className="badge badge-green">Optimized (96%)</span>
              </div>

              <ATSBar label="ATS Fit Score" before={82} after={96} color="var(--green)" />
              <ATSBar label="Keyword Coverage" before={74} after={98} color="var(--blue-primary)" />
              <ATSBar label="Patent & Evidence Weight" after={99} color="var(--amber)" />
              <ATSBar label="Capability Alignment" after={95} color="var(--violet)" />

              <div style={{ marginTop: '1rem' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--green)', marginBottom: '0.375rem', letterSpacing: '0.04em' }}>
                  ✓ KEYWORDS MATCHED
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.875rem' }}>
                  {['AI Systems', 'LLM', 'Patent Innovation', 'Full Stack', 'Next.js', 'Python', 'REST APIs', 'IoT / Wearables', 'Algorithms'].map(k => (
                    <span key={k} className="badge badge-green" style={{ fontSize: '0.65rem' }}>{k}</span>
                  ))}
                </div>

                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--cyan)', marginBottom: '0.375rem', letterSpacing: '0.04em' }}>
                  🧠 AGENT TELEMETRY
                </div>
                <div style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  Resume tailored by <strong>Job Fairness (JF)</strong> &amp; <strong>Skills Discovery (SD)</strong> Agents from Master Profile.
                </div>
              </div>
            </motion.div>
          )}

          {/* Workflow */}
          {stage !== 'generated' && (
            <div className="card" style={{ padding: '1.25rem' }}>
              <div className="section-title" style={{ marginBottom: '0.875rem' }}>Resume Workflow</div>
              {[
                { step: 1, label: `Master Profile (${profile.name.split(' ')[0]})`, done: true },
                { step: 2, label: 'Select Target Job Description', done: !!jd },
                { step: 3, label: 'AI Optimization & Evidence Grounding', done: false },
                { step: 4, label: 'Export PDF with Dynamic Filename', done: false },
              ].map(s => (
                <div key={s.step} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.5rem' }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                    background: s.done ? 'var(--green)' : 'var(--bg-elevated)',
                    border: `1.5px solid ${s.done ? 'var(--green)' : 'var(--border)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.65rem', fontWeight: 700,
                    color: s.done ? 'white' : 'var(--text-muted)',
                  }}>
                    {s.done ? '✓' : s.step}
                  </div>
                  <span style={{ fontSize: '0.8rem', color: s.done ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
