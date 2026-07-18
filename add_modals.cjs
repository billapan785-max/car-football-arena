const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

const vipModal = `                  </div>
                )}

                {/* VIP */}
                {renderedActiveModal === 'vip' && (
                  <div style={{ textTransform: 'uppercase', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', padding: '10px' }}>
                    <Trophy style={{ width: '42px', height: '42px', color: '#ffd32a' }} />
                    <strong>VIP Stadium Pass Benefits</strong>
                    <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.78rem', width: '100%' }}>
                      <div>⭐ Unlock and drive any premium car model (Vision GT, Titan) instantly.</div>
                      <div>⭐ Custom exclusive paints and decal sliders enabled.</div>
                      <div>⭐ Double currency drop multiplier after every online or solo match!</div>
                    </div>
                    <button 
                      onClick={() => setActiveModal(null)}
                      style={{ background: '#ffd32a', border: 'none', color: '#0a1329', padding: '10px 24px', borderRadius: '30px', fontWeight: 900, letterSpacing: '1px', cursor: 'pointer', marginTop: '10px' }}
                    >
                      Awesome!
                    </button>
                  </div>
                )}`;

const newModals = `

                {renderedActiveModal === 'terms' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px' }}>
                    <h3 style={{ color: '#43f5ff', margin: 0, fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Terms & Services</h3>
                    <p style={{ fontSize: '0.85rem', color: '#c4d1eb', lineHeight: '1.6' }}>
                      Welcome to BoostBall! By playing this game, you agree to our terms. 
                      This game is in development. Your stats and data may be wiped during beta phases. 
                      Do not use any unauthorized third-party mods, hacks, or cheats that alter gameplay.
                    </p>
                    <p style={{ fontSize: '0.85rem', color: '#c4d1eb', lineHeight: '1.6' }}>
                      Respect other players in chat. We reserve the right to ban accounts for toxic behavior.
                    </p>
                    <button onClick={() => setRenderedActiveModal('settings')} style={{ background: 'linear-gradient(135deg, #00d2ff, #43f5ff)', border: 'none', color: '#0a1329', padding: '12px', borderRadius: '8px', fontWeight: 900, cursor: 'pointer', marginTop: '10px', textTransform: 'uppercase' }}>BACK TO SETTINGS</button>
                  </div>
                )}

                {renderedActiveModal === 'privacy' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px' }}>
                    <h3 style={{ color: '#43f5ff', margin: 0, fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Privacy Policy</h3>
                    <p style={{ fontSize: '0.85rem', color: '#c4d1eb', lineHeight: '1.6' }}>
                      We collect basic player data including your chosen display name, linked email, and match statistics to provide matchmaking and leaderboards. 
                      Your email is never shared publicly.
                    </p>
                    <button onClick={() => setRenderedActiveModal('settings')} style={{ background: 'linear-gradient(135deg, #00d2ff, #43f5ff)', border: 'none', color: '#0a1329', padding: '12px', borderRadius: '8px', fontWeight: 900, cursor: 'pointer', marginTop: '10px', textTransform: 'uppercase' }}>BACK TO SETTINGS</button>
                  </div>
                )}

                {renderedActiveModal === 'permissions' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px' }}>
                    <h3 style={{ color: '#43f5ff', margin: 0, fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Game Permissions</h3>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(67, 245, 255, 0.15)' }}>
                       <div>
                         <strong style={{ color: '#ffffff' }}>Storage / Gallery</strong>
                         <div style={{ fontSize: '0.75rem', color: '#8fa2c4', marginTop: '4px' }}>Required to save recorded match highlights locally.</div>
                       </div>
                       <span style={{ color: '#00e575', fontWeight: 900, fontSize: '0.8rem' }}>GRANTED</span>
                    </div>
                    <button onClick={() => setRenderedActiveModal('settings')} style={{ background: 'linear-gradient(135deg, #00d2ff, #43f5ff)', border: 'none', color: '#0a1329', padding: '12px', borderRadius: '8px', fontWeight: 900, cursor: 'pointer', marginTop: '10px', textTransform: 'uppercase' }}>BACK TO SETTINGS</button>
                  </div>
                )}

                {renderedActiveModal === 'delete_account' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px', textAlign: 'center' }}>
                    <h3 style={{ color: '#ef4444', margin: 0, fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Delete Account</h3>
                    <p style={{ fontSize: '0.85rem', color: '#c4d1eb', lineHeight: '1.6' }}>
                      Are you sure you want to permanently delete your account? All your cars, stats, and VIP passes will be lost forever. This action cannot be undone.
                    </p>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                      <button onClick={() => setRenderedActiveModal('settings')} style={{ flex: 1, background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '12px', borderRadius: '8px', fontWeight: 900, cursor: 'pointer', textTransform: 'uppercase' }}>CANCEL</button>
                      <button onClick={() => { auth.currentUser?.delete().then(() => setRenderedActiveModal(null)).catch(e => { alert(e.message); setRenderedActiveModal('settings'); }); }} style={{ flex: 1, background: '#ef4444', border: 'none', color: '#fff', padding: '12px', borderRadius: '8px', fontWeight: 900, cursor: 'pointer', textTransform: 'uppercase' }}>PERMANENT DELETE</button>
                    </div>
                  </div>
                )}`;

if (app.includes("renderedActiveModal === 'vip'")) {
  app = app.replace(vipModal, vipModal + newModals);
  fs.writeFileSync('src/App.tsx', app, 'utf8');
  console.log("Successfully added modals");
} else {
  console.error("Could not find vip modal");
}
