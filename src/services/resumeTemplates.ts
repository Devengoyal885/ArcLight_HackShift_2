/**
 * resumeTemplates.ts
 * ─────────────────────────────────────────────────────────────────────────
 * 5 visually distinct resume templates rendered as HTML strings.
 * Each template accepts a ResumeData object and a ThemeConfig and returns
 * a full print-ready HTML string (injected via dangerouslySetInnerHTML).
 *
 * Templates:
 *   1. latex      — Academic/clean monospace header (classic SDE)
 *   2. modern     — Blue accent sidebar (TCS/Infosys style)
 *   3. creative   — Bold gradient header (design + tech roles)
 *   4. minimal    — Pure whitespace, Times-like serif (MBB consulting)
 *   5. executive  — Dark sidebar with ivory body (senior roles)
 */

export interface ResumeData {
    name: string;
    headline: string;
    email: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    github?: string;
    website?: string;
    summary?: string;
    skills: string[];
    experience: { title: string; company: string; dates: string; bullets: string[] }[];
    projects: { name: string; tech: string; description: string; link?: string }[];
    education: { degree: string; institution: string; dates: string; gpa?: string }[];
    certifications: { name: string; issuer: string; date?: string }[];
}

export interface ThemeConfig {
    accentColor: string;   // hex
    fontFamily: string;    // CSS font-family string
    fontSize: number;      // base px (10–14)
}

export const DEFAULT_THEME: ThemeConfig = {
    accentColor: '#2563eb',
    fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
    fontSize: 11,
};

export type TemplateId = 'latex' | 'modern' | 'creative' | 'minimal' | 'executive';

export interface TemplateDefinition {
    id: TemplateId;
    name: string;
    description: string;
    tags: string[];
    previewGradient: string;
    accentDefault: string;
}

export const TEMPLATES: TemplateDefinition[] = [
    {
        id: 'latex',
        name: 'LaTeX Classic',
        description: 'Clean academic style — perfect for SDE & research roles',
        tags: ['Engineering', 'Academia', 'Conservative'],
        previewGradient: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        accentDefault: '#1e3a5f',
    },
    {
        id: 'modern',
        name: 'Modern Pro',
        description: 'Blue sidebar layout — standard corporate & FAANG format',
        tags: ['FAANG', 'Corporate', 'Tech'],
        previewGradient: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
        accentDefault: '#2563eb',
    },
    {
        id: 'creative',
        name: 'Creative Bold',
        description: 'Gradient header with strong typography — design & product roles',
        tags: ['Design', 'Product', 'Startup'],
        previewGradient: 'linear-gradient(135deg, #faf5ff 0%, #ede9fe 100%)',
        accentDefault: '#7c3aed',
    },
    {
        id: 'minimal',
        name: 'Minimal Serif',
        description: 'Pure whitespace, serif elegance — MBB consulting & finance',
        tags: ['Consulting', 'Finance', 'MBA'],
        previewGradient: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
        accentDefault: '#92400e',
    },
    {
        id: 'executive',
        name: 'Executive Dark',
        description: 'Dark sidebar, ivory body — senior & leadership positions',
        tags: ['Senior', 'Leadership', 'CXO'],
        previewGradient: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
        accentDefault: '#f59e0b',
    },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function esc(s: string) {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function skillPills(skills: string[], accent: string) {
    return skills.map(s =>
        `<span style="display:inline-block;background:${accent}18;color:${accent};border:1px solid ${accent}33;
        border-radius:4px;padding:2px 8px;font-size:9px;font-weight:600;margin:2px;">${esc(s)}</span>`
    ).join('');
}

function bullets(pts: string[]) {
    return pts.map(p => `<li style="margin-bottom:3px;">${esc(p)}</li>`).join('');
}

// ── Template 1: LaTeX Classic ─────────────────────────────────────────────────

function renderLatex(data: ResumeData, theme: ThemeConfig): string {
    const { accentColor: acc, fontFamily: ff, fontSize: fs } = theme;
    return `
<div style="font-family:${ff};font-size:${fs}px;color:#1a1a1a;max-width:760px;margin:0 auto;padding:32px 40px;background:#fff;line-height:1.5;">
  <!-- Header -->
  <div style="text-align:center;border-bottom:2px solid ${acc};padding-bottom:12px;margin-bottom:16px;">
    <h1 style="font-size:22px;font-weight:800;margin:0;letter-spacing:1px;color:${acc};">${esc(data.name)}</h1>
    <p style="margin:4px 0 0;font-size:12px;color:#334155;">${esc(data.headline)}</p>
    <p style="margin:4px 0 0;font-size:10px;color:#64748b;">
      ${esc(data.email)}${data.phone ? ' · ' + esc(data.phone) : ''}${data.location ? ' · ' + esc(data.location) : ''}${data.linkedin ? ' · linkedin.com/in/' + esc(data.linkedin) : ''}${data.github ? ' · github.com/' + esc(data.github) : ''}
    </p>
  </div>

  ${data.summary ? `
  <!-- Summary -->
  <div style="margin-bottom:14px;">
    <h2 style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:${acc};margin:0 0 6px;border-bottom:1px solid ${acc}40;padding-bottom:3px;">Summary</h2>
    <p style="margin:0;color:#334155;line-height:1.6;">${esc(data.summary)}</p>
  </div>` : ''}

  ${data.skills.length > 0 ? `
  <!-- Skills -->
  <div style="margin-bottom:14px;">
    <h2 style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:${acc};margin:0 0 6px;border-bottom:1px solid ${acc}40;padding-bottom:3px;">Skills</h2>
    <p style="margin:0;">${data.skills.map(s => `<span style="margin-right:8px;">• ${esc(s)}</span>`).join('')}</p>
  </div>` : ''}

  ${data.experience.length > 0 ? `
  <!-- Experience -->
  <div style="margin-bottom:14px;">
    <h2 style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:${acc};margin:0 0 8px;border-bottom:1px solid ${acc}40;padding-bottom:3px;">Experience</h2>
    ${data.experience.map(e => `
    <div style="margin-bottom:10px;">
      <div style="display:flex;justify-content:space-between;align-items:baseline;">
        <strong style="font-size:12px;">${esc(e.title)} — ${esc(e.company)}</strong>
        <span style="font-size:10px;color:#64748b;">${esc(e.dates)}</span>
      </div>
      <ul style="margin:4px 0 0 16px;padding:0;color:#334155;">${bullets(e.bullets)}</ul>
    </div>`).join('')}
  </div>` : ''}

  ${data.projects.length > 0 ? `
  <!-- Projects -->
  <div style="margin-bottom:14px;">
    <h2 style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:${acc};margin:0 0 8px;border-bottom:1px solid ${acc}40;padding-bottom:3px;">Projects</h2>
    ${data.projects.map(p => `
    <div style="margin-bottom:8px;">
      <div style="display:flex;justify-content:space-between;align-items:baseline;">
        <strong style="font-size:12px;">${esc(p.name)}</strong>
        <span style="font-size:10px;color:#64748b;">${esc(p.tech)}</span>
      </div>
      <p style="margin:3px 0 0;color:#334155;">${esc(p.description)}</p>
    </div>`).join('')}
  </div>` : ''}

  ${data.education.length > 0 ? `
  <!-- Education -->
  <div style="margin-bottom:14px;">
    <h2 style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:${acc};margin:0 0 8px;border-bottom:1px solid ${acc}40;padding-bottom:3px;">Education</h2>
    ${data.education.map(e => `
    <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4px;">
      <span><strong>${esc(e.degree)}</strong> — ${esc(e.institution)}${e.gpa ? ` · GPA: ${esc(e.gpa)}` : ''}</span>
      <span style="font-size:10px;color:#64748b;">${esc(e.dates)}</span>
    </div>`).join('')}
  </div>` : ''}

  ${data.certifications.length > 0 ? `
  <!-- Certifications -->
  <div>
    <h2 style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:${acc};margin:0 0 6px;border-bottom:1px solid ${acc}40;padding-bottom:3px;">Certifications</h2>
    ${data.certifications.map(c => `<p style="margin:2px 0;">• <strong>${esc(c.name)}</strong> — ${esc(c.issuer)}${c.date ? ' (' + esc(c.date) + ')' : ''}</p>`).join('')}
  </div>` : ''}
</div>`;
}

// ── Template 2: Modern Pro (sidebar) ─────────────────────────────────────────

function renderModern(data: ResumeData, theme: ThemeConfig): string {
    const { accentColor: acc, fontFamily: ff, fontSize: fs } = theme;
    return `
<div style="font-family:${ff};font-size:${fs}px;color:#1a1a1a;max-width:760px;margin:0 auto;background:#fff;display:flex;min-height:900px;">
  <!-- Sidebar -->
  <div style="width:220px;flex-shrink:0;background:${acc};color:#fff;padding:28px 18px;">
    <div style="text-align:center;margin-bottom:24px;">
      <div style="width:64px;height:64px;border-radius:50%;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:800;margin:0 auto 10px;">
        ${esc(data.name.split(' ').map(w => w[0]).slice(0,2).join(''))}
      </div>
      <h1 style="font-size:15px;font-weight:700;margin:0;line-height:1.2;">${esc(data.name)}</h1>
      <p style="font-size:10px;opacity:0.8;margin:4px 0 0;">${esc(data.headline)}</p>
    </div>

    <div style="margin-bottom:20px;">
      <h3 style="font-size:9px;text-transform:uppercase;letter-spacing:1.5px;opacity:0.6;margin:0 0 8px;">Contact</h3>
      <p style="font-size:10px;margin:0 0 4px;word-break:break-all;">${esc(data.email)}</p>
      ${data.phone ? `<p style="font-size:10px;margin:0 0 4px;">${esc(data.phone)}</p>` : ''}
      ${data.location ? `<p style="font-size:10px;margin:0 0 4px;">${esc(data.location)}</p>` : ''}
      ${data.linkedin ? `<p style="font-size:10px;margin:0;">linkedin: ${esc(data.linkedin)}</p>` : ''}
    </div>

    ${data.skills.length > 0 ? `
    <div style="margin-bottom:20px;">
      <h3 style="font-size:9px;text-transform:uppercase;letter-spacing:1.5px;opacity:0.6;margin:0 0 8px;">Skills</h3>
      ${data.skills.map(s => `<div style="background:rgba(255,255,255,0.15);border-radius:4px;padding:3px 8px;margin-bottom:4px;font-size:10px;">${esc(s)}</div>`).join('')}
    </div>` : ''}

    ${data.certifications.length > 0 ? `
    <div>
      <h3 style="font-size:9px;text-transform:uppercase;letter-spacing:1.5px;opacity:0.6;margin:0 0 8px;">Certifications</h3>
      ${data.certifications.map(c => `<p style="font-size:10px;margin:0 0 4px;opacity:0.9;">• ${esc(c.name)}</p>`).join('')}
    </div>` : ''}
  </div>

  <!-- Body -->
  <div style="flex:1;padding:28px 24px;">
    ${data.summary ? `
    <div style="margin-bottom:18px;">
      <h2 style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:${acc};border-bottom:2px solid ${acc};padding-bottom:4px;margin:0 0 8px;">Profile</h2>
      <p style="color:#334155;line-height:1.6;margin:0;">${esc(data.summary)}</p>
    </div>` : ''}

    ${data.experience.length > 0 ? `
    <div style="margin-bottom:18px;">
      <h2 style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:${acc};border-bottom:2px solid ${acc};padding-bottom:4px;margin:0 0 10px;">Experience</h2>
      ${data.experience.map(e => `
      <div style="margin-bottom:12px;">
        <div style="display:flex;justify-content:space-between;align-items:baseline;">
          <strong style="font-size:12px;color:#0f172a;">${esc(e.title)}</strong>
          <span style="font-size:10px;color:#64748b;background:#f1f5f9;padding:1px 6px;border-radius:4px;">${esc(e.dates)}</span>
        </div>
        <p style="color:${acc};font-size:11px;margin:2px 0 4px;font-weight:600;">${esc(e.company)}</p>
        <ul style="margin:0 0 0 16px;padding:0;color:#334155;">${bullets(e.bullets)}</ul>
      </div>`).join('')}
    </div>` : ''}

    ${data.projects.length > 0 ? `
    <div style="margin-bottom:18px;">
      <h2 style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:${acc};border-bottom:2px solid ${acc};padding-bottom:4px;margin:0 0 10px;">Projects</h2>
      ${data.projects.map(p => `
      <div style="margin-bottom:10px;padding:8px 10px;background:#f8fafc;border-left:3px solid ${acc};border-radius:0 6px 6px 0;">
        <div style="display:flex;justify-content:space-between;">
          <strong style="font-size:12px;">${esc(p.name)}</strong>
          <span style="font-size:10px;color:${acc};">${esc(p.tech)}</span>
        </div>
        <p style="margin:3px 0 0;color:#334155;font-size:10px;">${esc(p.description)}</p>
      </div>`).join('')}
    </div>` : ''}

    ${data.education.length > 0 ? `
    <div>
      <h2 style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:${acc};border-bottom:2px solid ${acc};padding-bottom:4px;margin:0 0 10px;">Education</h2>
      ${data.education.map(e => `
      <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
        <div>
          <strong style="font-size:12px;">${esc(e.degree)}</strong>
          <p style="margin:1px 0 0;color:#64748b;font-size:10px;">${esc(e.institution)}${e.gpa ? ' · GPA ' + esc(e.gpa) : ''}</p>
        </div>
        <span style="font-size:10px;color:#94a3b8;">${esc(e.dates)}</span>
      </div>`).join('')}
    </div>` : ''}
  </div>
</div>`;
}

// ── Template 3: Creative Bold ─────────────────────────────────────────────────

function renderCreative(data: ResumeData, theme: ThemeConfig): string {
    const { accentColor: acc, fontFamily: ff, fontSize: fs } = theme;
    return `
<div style="font-family:${ff};font-size:${fs}px;color:#1a1a1a;max-width:760px;margin:0 auto;background:#fff;">
  <!-- Gradient Header -->
  <div style="background:linear-gradient(135deg,${acc} 0%,${acc}cc 100%);padding:32px 40px;color:#fff;">
    <h1 style="font-size:28px;font-weight:900;margin:0;letter-spacing:-0.5px;">${esc(data.name)}</h1>
    <p style="font-size:14px;margin:6px 0 0;opacity:0.85;">${esc(data.headline)}</p>
    <div style="margin-top:12px;display:flex;flex-wrap:wrap;gap:16px;font-size:11px;opacity:0.8;">
      <span>✉ ${esc(data.email)}</span>
      ${data.phone ? `<span>📞 ${esc(data.phone)}</span>` : ''}
      ${data.location ? `<span>📍 ${esc(data.location)}</span>` : ''}
      ${data.github ? `<span>⬡ github.com/${esc(data.github)}</span>` : ''}
    </div>
  </div>

  <div style="padding:28px 40px;">
    ${data.skills.length > 0 ? `
    <div style="margin-bottom:20px;">
      <div style="display:flex;flex-wrap:wrap;gap:6px;">${skillPills(data.skills, acc)}</div>
    </div>` : ''}

    ${data.summary ? `
    <div style="margin-bottom:20px;padding:14px 16px;background:${acc}0d;border-radius:10px;border-left:4px solid ${acc};">
      <p style="margin:0;color:#334155;line-height:1.7;">${esc(data.summary)}</p>
    </div>` : ''}

    ${data.experience.length > 0 ? `
    <div style="margin-bottom:20px;">
      <h2 style="font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:2px;color:${acc};margin:0 0 12px;">Experience</h2>
      ${data.experience.map(e => `
      <div style="margin-bottom:14px;padding:12px 14px;border:1px solid ${acc}22;border-radius:10px;">
        <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:2px;">
          <strong style="font-size:13px;">${esc(e.title)}</strong>
          <span style="font-size:10px;color:#94a3b8;">${esc(e.dates)}</span>
        </div>
        <p style="margin:0 0 6px;color:${acc};font-size:11px;font-weight:700;">${esc(e.company)}</p>
        <ul style="margin:0 0 0 14px;padding:0;color:#475569;font-size:10px;">${bullets(e.bullets)}</ul>
      </div>`).join('')}
    </div>` : ''}

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
      ${data.projects.length > 0 ? `
      <div>
        <h2 style="font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:2px;color:${acc};margin:0 0 12px;">Projects</h2>
        ${data.projects.map(p => `
        <div style="margin-bottom:10px;">
          <strong style="font-size:11px;">${esc(p.name)}</strong>
          <span style="font-size:9px;color:${acc};margin-left:6px;">${esc(p.tech)}</span>
          <p style="margin:3px 0 0;font-size:10px;color:#475569;">${esc(p.description)}</p>
        </div>`).join('')}
      </div>` : ''}

      <div>
        ${data.education.length > 0 ? `
        <h2 style="font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:2px;color:${acc};margin:0 0 12px;">Education</h2>
        ${data.education.map(e => `
        <div style="margin-bottom:8px;">
          <strong style="font-size:11px;">${esc(e.degree)}</strong>
          <p style="margin:2px 0 0;font-size:10px;color:#64748b;">${esc(e.institution)} · ${esc(e.dates)}</p>
        </div>`).join('')}` : ''}

        ${data.certifications.length > 0 ? `
        <h2 style="font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:2px;color:${acc};margin:16px 0 12px;">Certifications</h2>
        ${data.certifications.map(c => `<p style="font-size:10px;margin:0 0 4px;">• <strong>${esc(c.name)}</strong> — ${esc(c.issuer)}</p>`).join('')}` : ''}
      </div>
    </div>
  </div>
</div>`;
}

// ── Template 4: Minimal Serif ─────────────────────────────────────────────────

function renderMinimal(data: ResumeData, theme: ThemeConfig): string {
    const { accentColor: acc, fontSize: fs } = theme;
    return `
<div style="font-family:'Georgia','Times New Roman',serif;font-size:${fs}px;color:#111;max-width:720px;margin:0 auto;padding:48px 56px;background:#fffff8;line-height:1.6;">
  <!-- Name -->
  <div style="border-bottom:3px double ${acc};padding-bottom:16px;margin-bottom:20px;text-align:center;">
    <h1 style="font-size:26px;font-weight:bold;margin:0;letter-spacing:2px;text-transform:uppercase;color:${acc};">${esc(data.name)}</h1>
    <p style="font-size:12px;margin:6px 0 0;color:#555;font-style:italic;">${esc(data.headline)}</p>
    <p style="font-size:10px;margin:6px 0 0;color:#777;">${esc(data.email)}${data.location ? ' | ' + esc(data.location) : ''}${data.linkedin ? ' | ' + esc(data.linkedin) : ''}</p>
  </div>

  ${data.summary ? `<p style="font-size:${fs}px;line-height:1.8;color:#333;margin-bottom:20px;font-style:italic;">${esc(data.summary)}</p>` : ''}

  ${data.experience.length > 0 ? `
  <div style="margin-bottom:20px;">
    <h2 style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:${acc};font-weight:bold;margin:0 0 12px;font-family:'Georgia',serif;">Professional Experience</h2>
    ${data.experience.map(e => `
    <div style="margin-bottom:14px;">
      <div style="display:flex;justify-content:space-between;">
        <span><strong>${esc(e.title)}</strong>, <em>${esc(e.company)}</em></span>
        <span style="font-size:10px;color:#666;">${esc(e.dates)}</span>
      </div>
      <ul style="margin:6px 0 0 20px;padding:0;color:#333;">${bullets(e.bullets)}</ul>
    </div>`).join('')}
  </div>` : ''}

  ${data.education.length > 0 ? `
  <div style="margin-bottom:20px;">
    <h2 style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:${acc};font-weight:bold;margin:0 0 12px;font-family:'Georgia',serif;">Education</h2>
    ${data.education.map(e => `
    <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
      <span><strong>${esc(e.degree)}</strong>, ${esc(e.institution)}${e.gpa ? ` — GPA ${esc(e.gpa)}` : ''}</span>
      <span style="font-size:10px;color:#666;">${esc(e.dates)}</span>
    </div>`).join('')}
  </div>` : ''}

  ${data.skills.length > 0 ? `
  <div style="margin-bottom:20px;">
    <h2 style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:${acc};font-weight:bold;margin:0 0 8px;font-family:'Georgia',serif;">Core Competencies</h2>
    <p style="color:#333;">${data.skills.join(' · ')}</p>
  </div>` : ''}

  ${data.projects.length > 0 ? `
  <div style="margin-bottom:20px;">
    <h2 style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:${acc};font-weight:bold;margin:0 0 12px;font-family:'Georgia',serif;">Selected Projects</h2>
    ${data.projects.map(p => `
    <div style="margin-bottom:8px;">
      <strong>${esc(p.name)}</strong> <em style="font-size:10px;color:#666;">(${esc(p.tech)})</em>
      <p style="margin:3px 0 0;color:#444;">${esc(p.description)}</p>
    </div>`).join('')}
  </div>` : ''}
</div>`;
}

// ── Template 5: Executive Dark ────────────────────────────────────────────────

function renderExecutive(data: ResumeData, theme: ThemeConfig): string {
    const { accentColor: acc, fontFamily: ff, fontSize: fs } = theme;
    const dark = '#1e293b';
    return `
<div style="font-family:${ff};font-size:${fs}px;max-width:760px;margin:0 auto;background:#fff;display:flex;min-height:900px;">
  <!-- Dark Sidebar -->
  <div style="width:200px;flex-shrink:0;background:${dark};color:#f8fafc;padding:32px 16px;">
    <div style="margin-bottom:28px;padding-bottom:20px;border-bottom:1px solid #334155;">
      <h1 style="font-size:14px;font-weight:800;margin:0;color:#f1f5f9;line-height:1.3;">${esc(data.name)}</h1>
      <p style="font-size:9px;margin:6px 0 0;color:${acc};font-weight:600;text-transform:uppercase;letter-spacing:1px;">${esc(data.headline)}</p>
    </div>

    <div style="margin-bottom:20px;">
      <h3 style="font-size:8px;text-transform:uppercase;letter-spacing:2px;color:#94a3b8;margin:0 0 8px;">Contact</h3>
      <p style="font-size:9px;margin:0 0 5px;word-break:break-all;color:#cbd5e1;">${esc(data.email)}</p>
      ${data.phone ? `<p style="font-size:9px;margin:0 0 5px;color:#cbd5e1;">${esc(data.phone)}</p>` : ''}
      ${data.location ? `<p style="font-size:9px;margin:0 0 5px;color:#cbd5e1;">${esc(data.location)}</p>` : ''}
      ${data.linkedin ? `<p style="font-size:9px;margin:0;color:${acc};">in/${esc(data.linkedin)}</p>` : ''}
    </div>

    ${data.skills.length > 0 ? `
    <div style="margin-bottom:20px;">
      <h3 style="font-size:8px;text-transform:uppercase;letter-spacing:2px;color:#94a3b8;margin:0 0 8px;">Expertise</h3>
      ${data.skills.map(s => `
      <div style="margin-bottom:5px;">
        <span style="font-size:9px;color:#e2e8f0;">${esc(s)}</span>
        <div style="height:2px;background:#334155;border-radius:2px;margin-top:2px;">
          <div style="height:2px;background:${acc};border-radius:2px;width:75%;"></div>
        </div>
      </div>`).join('')}
    </div>` : ''}

    ${data.certifications.length > 0 ? `
    <div>
      <h3 style="font-size:8px;text-transform:uppercase;letter-spacing:2px;color:#94a3b8;margin:0 0 8px;">Certifications</h3>
      ${data.certifications.map(c => `<p style="font-size:9px;margin:0 0 4px;color:#cbd5e1;">• ${esc(c.name)}</p>`).join('')}
    </div>` : ''}
  </div>

  <!-- Ivory Body -->
  <div style="flex:1;padding:32px 28px;background:#fffff8;">
    ${data.summary ? `
    <div style="margin-bottom:20px;padding:12px 16px;background:${acc}12;border-left:4px solid ${acc};border-radius:0 8px 8px 0;">
      <p style="margin:0;color:#1e293b;line-height:1.7;font-size:11px;">${esc(data.summary)}</p>
    </div>` : ''}

    ${data.experience.length > 0 ? `
    <div style="margin-bottom:20px;">
      <h2 style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:${acc};margin:0 0 12px;border-bottom:1px solid ${acc}30;padding-bottom:4px;">Professional Experience</h2>
      ${data.experience.map(e => `
      <div style="margin-bottom:14px;">
        <div style="display:flex;justify-content:space-between;align-items:baseline;">
          <strong style="font-size:13px;color:#0f172a;">${esc(e.title)}</strong>
          <span style="font-size:9px;color:#94a3b8;background:#f1f5f9;padding:1px 8px;border-radius:4px;">${esc(e.dates)}</span>
        </div>
        <p style="margin:2px 0 5px;font-size:11px;color:${acc};font-weight:600;">${esc(e.company)}</p>
        <ul style="margin:0 0 0 14px;padding:0;color:#334155;font-size:10px;">${bullets(e.bullets)}</ul>
      </div>`).join('')}
    </div>` : ''}

    ${data.projects.length > 0 ? `
    <div style="margin-bottom:20px;">
      <h2 style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:${acc};margin:0 0 12px;border-bottom:1px solid ${acc}30;padding-bottom:4px;">Key Projects</h2>
      ${data.projects.map(p => `
      <div style="margin-bottom:10px;padding:8px;background:#fff;border:1px solid #e2e8f0;border-radius:6px;">
        <div style="display:flex;justify-content:space-between;">
          <strong style="font-size:11px;">${esc(p.name)}</strong>
          <span style="font-size:9px;color:${acc};font-weight:600;">${esc(p.tech)}</span>
        </div>
        <p style="margin:3px 0 0;font-size:10px;color:#475569;">${esc(p.description)}</p>
      </div>`).join('')}
    </div>` : ''}

    ${data.education.length > 0 ? `
    <div>
      <h2 style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:${acc};margin:0 0 10px;border-bottom:1px solid ${acc}30;padding-bottom:4px;">Education</h2>
      ${data.education.map(e => `
      <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
        <span><strong style="font-size:12px;">${esc(e.degree)}</strong> — <span style="color:#64748b;font-size:11px;">${esc(e.institution)}</span>${e.gpa ? `<span style="color:#94a3b8;font-size:10px;"> · GPA ${esc(e.gpa)}</span>` : ''}</span>
        <span style="font-size:10px;color:#94a3b8;">${esc(e.dates)}</span>
      </div>`).join('')}
    </div>` : ''}
  </div>
</div>`;
}

// ── Main render dispatcher ─────────────────────────────────────────────────────

export function renderTemplate(
    id: TemplateId,
    data: ResumeData,
    theme: ThemeConfig,
): string {
    switch (id) {
        case 'latex':     return renderLatex(data, theme);
        case 'modern':    return renderModern(data, theme);
        case 'creative':  return renderCreative(data, theme);
        case 'minimal':   return renderMinimal(data, theme);
        case 'executive': return renderExecutive(data, theme);
        default:          return renderLatex(data, theme);
    }
}

/** Build a ResumeData object from profile + capabilities + projects */
export function buildResumeData(
    profile: any,
    capabilities: any[],
    projects: any[],
    certifications: any[] = [],
): ResumeData {
    return {
        name: profile?.name || '',
        headline: profile?.headline || '',
        email: profile?.email || '',
        phone: profile?.phone || '',
        location: profile?.location || '',
        linkedin: profile?.linkedin || '',
        github: profile?.github || '',
        website: profile?.website || '',
        summary: profile?.resumeText || '',
        skills: capabilities.map(c => c.skill || c.name).filter(Boolean),
        experience: (profile?.experience || []).map((e: any) => ({
            title: e.title || '',
            company: e.company || '',
            dates: e.dates || '',
            bullets: e.bullets || [e.description || ''],
        })),
        projects: projects.map(p => ({
            name: p.name || '',
            tech: (p.techStack || p.tech || []).join(', '),
            description: p.description || '',
            link: p.link || '',
        })),
        education: (profile?.education || []).map((e: any) => ({
            degree: e.degree || '',
            institution: e.institution || '',
            dates: e.dates || '',
            gpa: e.gpa || '',
        })),
        certifications: certifications.map(c => ({
            name: c.name || '',
            issuer: c.issuer || c.issuedBy || '',
            date: c.date || c.issuedDate || '',
        })),
    };
}
