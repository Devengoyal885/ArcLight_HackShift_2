const fs = require('fs');
const file = 'src/pages/candidate/CodolioProfilePage.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Add "identity" to layoutOrder initial state
code = code.replace(/useState<string\[\]>\(\['stats', 'capabilities', 'projects', 'certifications'\]\)/, "useState<string[]>(['identity', 'stats', 'capabilities', 'resume', 'projects', 'certifications'])");

// 2. Change cp-content to bento-grid
code = code.replace(/<div className="cp-content">/g, '<div className="bento-grid">');

// 3. Transform cp-sidebar into bento-item bento-2x2 bento-identity
code = code.replace(/<aside className="cp-sidebar">/, `<div className="bento-item bento-2x2" style={{ order: layoutOrder.indexOf('identity') !== -1 ? layoutOrder.indexOf('identity') : 0 }}>
    <div className="bento-identity bento-content">
        <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 8, zIndex: 50 }}>
            {isEditMode && (
                <>
                    <button className="cp-btn-edit-toggle" style={{ padding: '4px 8px' }} onClick={() => moveSection(layoutOrder.indexOf('identity'), 'up')}><ArrowUp size={14}/></button>
                    <button className="cp-btn-edit-toggle" style={{ padding: '4px 8px' }} onClick={() => moveSection(layoutOrder.indexOf('identity'), 'down')}><ArrowDown size={14}/></button>
                </>
            )}
        </div>
`);

// Find </aside> and replace with </div></div>
code = code.replace(/<\/aside>/, '</div></div>');

// Remove cp-main wrapper
code = code.replace(/<main className="cp-main" style=\{\{ display: 'flex', flexDirection: 'column' \}\}>/, '');
code = code.replace(/<\/main>/, '');

// Convert sections to bento items
code = code.replace(/<section className="cp-section" style=\{\{ order: layoutOrder\.indexOf\('stats'\) [^>]+}}>/, '<div className="bento-item bento-4x1" style={{ order: layoutOrder.indexOf(\'stats\') !== -1 ? layoutOrder.indexOf(\'stats\') : 1 }}><div className="bento-content">');
code = code.replace(/<section className="cp-section" style=\{\{ order: layoutOrder\.indexOf\('capabilities'\) [^>]+}}>/, '<div className="bento-item bento-2x2" style={{ order: layoutOrder.indexOf(\'capabilities\') !== -1 ? layoutOrder.indexOf(\'capabilities\') : 2 }}><div className="bento-content">');
code = code.replace(/<section className="cp-section" style=\{\{ order: layoutOrder\.indexOf\('resume'\) [^>]+}}>/, '<div className="bento-item bento-2x2" style={{ order: layoutOrder.indexOf(\'resume\') !== -1 ? layoutOrder.indexOf(\'resume\') : 3 }}><div className="bento-content">');
code = code.replace(/<section className="cp-section" style=\{\{ order: layoutOrder\.indexOf\('projects'\) [^>]+}}>/, '<div className="bento-item bento-4x2" style={{ order: layoutOrder.indexOf(\'projects\') !== -1 ? layoutOrder.indexOf(\'projects\') : 4 }}><div className="bento-content" style={{ overflowY: \'auto\' }}>');
code = code.replace(/<section className="cp-section" style=\{\{ order: layoutOrder\.indexOf\('certifications'\) [^>]+}}>/, '<div className="bento-item bento-2x2" style={{ order: layoutOrder.indexOf(\'certifications\') !== -1 ? layoutOrder.indexOf(\'certifications\') : 5 }}><div className="bento-content" style={{ overflowY: \'auto\' }}>');

code = code.replace(/<\/section>/g, '</div></div>');

// The cp-page wrapper should now have a theme class. For example, theme-glass.
code = code.replace(/<div className="cp-page">/, '<div className="cp-page theme-glass">');

fs.writeFileSync(file, code);
console.log("Refactored to Bento Grid successfully.");
