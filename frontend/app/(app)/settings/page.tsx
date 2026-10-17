'use client';
export default function SettingsPage() {
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Account, privacy, and AI provider configuration</p>
      </div>
      <div className="card" style={{ padding: '1.5rem' }}>
        <div className="section-title" style={{ marginBottom: '1rem' }}>Privacy & Data</div>
        {[
          { label: 'Capability data is stored locally and encrypted', value: 'Enabled' },
          { label: 'AI providers receive only anonymized context', value: 'Enabled' },
          { label: 'Context Capsule sharing requires explicit approval', value: 'Enabled' },
          { label: 'Workforce data is organization-scoped only', value: 'Enabled' },
        ].map(item => (
          <div key={item.label} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '0.75rem 0', borderBottom: '1px solid var(--border-subtle)',
            fontSize: '0.825rem',
          }}>
            <span style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
            <span style={{ color: 'var(--green)', fontWeight: 700, fontSize: '0.75rem' }}>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
