
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { TranscriptPair, Language, User, UserRole, ConversationLog } from './types';
import { APP_CONFIG, LANGUAGES, getSystemInstruction } from './constants';
import { decode, decodeAudioData, createBlob } from './services/audioUtils';

// --- Authentication Components ---

const Login: React.FC<{ onLogin: (user: User) => void; onSwitchToSignup: () => void }> = ({ onLogin, onSwitchToSignup }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const storedUsers = JSON.parse(localStorage.getItem('syncvibe_users') || '[]');
    const registeredUser = storedUsers.find((u: any) => u.username === username && u.password === password);

    if (username === 'admin' && password === 'admin123') {
      onLogin({ username: 'Administrator', role: 'admin' });
    } else if (username === 'user' && password === 'user123') {
      onLogin({ username: 'Cloud Engineer', role: 'user' });
    } else if (registeredUser) {
      onLogin({ username: registeredUser.username, role: registeredUser.role });
    } else {
      setError('Invalid username or password.');
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-lg mx-auto bg-white border-x border-slate-200 shadow-2xl overflow-hidden relative font-sans items-center justify-center px-8">
      <div className="w-full space-y-8 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mx-auto shadow-xl shadow-indigo-200">
            <i className="fa-solid fa-bolt text-2xl"></i>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">SyncVibe</h1>
          <p className="text-slate-500 font-medium text-sm">Cloud MSP Technical Interpreter</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Username</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-700 font-medium" 
              placeholder="admin or user"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-700 font-medium" 
              placeholder="••••••••"
              required
            />
          </div>
          {error && <p className="text-red-500 text-xs font-bold px-1">{error}</p>}
          <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-[0.98] mt-4">
            Sign In
          </button>
        </form>

        <div className="text-center">
          <button onClick={onSwitchToSignup} className="text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors">
            Don't have an account? Sign up
          </button>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <p className="text-[10px] text-slate-400 font-bold uppercase text-center mb-2 tracking-tighter">Demo Accounts</p>
          <div className="flex justify-between text-[11px] font-medium text-slate-500">
            <span>Admin: admin / admin123</span>
            <span>User: user / user123</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const Signup: React.FC<{ onSignupSuccess: () => void; onSwitchToLogin: () => void }> = ({ onSignupSuccess, onSwitchToLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('user');
  const [error, setError] = useState('');

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.length < 3) { setError('Username must be at least 3 characters.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    const storedUsers = JSON.parse(localStorage.getItem('syncvibe_users') || '[]');
    if (storedUsers.find((u: any) => u.username === username)) { setError('Username already exists.'); return; }
    const newUser = { username, password, role };
    storedUsers.push(newUser);
    localStorage.setItem('syncvibe_users', JSON.stringify(storedUsers));
    alert('Registration successful! Please login.');
    onSignupSuccess();
  };

  return (
    <div className="flex flex-col h-screen max-w-lg mx-auto bg-white border-x border-slate-200 shadow-2xl overflow-hidden relative font-sans items-center justify-center px-8">
      <div className="w-full space-y-8 animate-in fade-in slide-in-from-right-10 duration-500">
        <button onClick={onSwitchToLogin} className="flex items-center gap-2 text-slate-400 hover:text-slate-600 transition-colors group">
          <i className="fa-solid fa-arrow-left group-hover:-translate-x-1 transition-transform"></i>
          <span className="text-sm font-bold">Back to Login</span>
        </button>
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white mx-auto shadow-xl">
            <i className="fa-solid fa-user-plus text-2xl"></i>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Create Account</h1>
          <p className="text-slate-500 font-medium text-sm">Join the Cloud MSP Network</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Username</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-700 font-medium" 
              placeholder="Pick a unique username"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-700 font-medium" 
              placeholder="At least 6 characters"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Account Type</label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setRole('user')} className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all border ${role === 'user' ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-500'}`}>Engineer</button>
              <button type="button" onClick={() => setRole('admin')} className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all border ${role === 'admin' ? 'bg-slate-900 border-slate-900 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-500'}`}>Manager</button>
            </div>
          </div>
          {error && <p className="text-red-500 text-xs font-bold px-1">{error}</p>}
          <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-[0.98] mt-4">Create Account</button>
        </form>
      </div>
    </div>
  );
};

// --- History Component ---

const HistoryView: React.FC<{ user: User; onClose: () => void }> = ({ user, onClose }) => {
  const [logs, setLogs] = useState<ConversationLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<ConversationLog | null>(null);

  useEffect(() => {
    const allLogs = JSON.parse(localStorage.getItem('syncvibe_logs') || '[]');
    if (user.role === 'admin') {
      setLogs(allLogs);
    } else {
      setLogs(allLogs.filter((l: ConversationLog) => l.username === user.username));
    }
  }, [user]);

  return (
    <div className="absolute inset-0 z-40 bg-white flex flex-col animate-in slide-in-from-bottom duration-300">
      <header className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => selectedLog ? setSelectedLog(null) : onClose()} className="w-10 h-10 flex items-center justify-center bg-slate-50 rounded-full text-slate-500">
            <i className={`fa-solid ${selectedLog ? 'fa-chevron-left' : 'fa-xmark'}`}></i>
          </button>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            {selectedLog ? 'Conversation Details' : 'Interpretation Logs'}
          </h2>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        {selectedLog ? (
          <div className="space-y-6 pb-12">
            <div className="bg-indigo-50 p-4 rounded-2xl space-y-1">
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Metadata</p>
              <div className="flex justify-between text-xs font-bold text-indigo-600">
                <span>{new Date(selectedLog.timestamp).toLocaleString()}</span>
                <span>{selectedLog.username}</span>
              </div>
            </div>
            {selectedLog.transcripts.map((pair) => (
              <div key={pair.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase">{selectedLog.sourceLang}</p>
                  <p className="text-sm text-slate-600 italic leading-relaxed">{pair.original}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-indigo-500 uppercase">{selectedLog.targetLang}</p>
                  <p className="text-md font-bold text-slate-900 leading-tight">{pair.translated}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {logs.length === 0 ? (
              <div className="text-center py-20 opacity-30 space-y-4">
                <i className="fa-solid fa-box-open text-5xl"></i>
                <p className="font-bold">No logs found</p>
              </div>
            ) : (
              logs.map((log) => (
                <button 
                  key={log.id} 
                  onClick={() => setSelectedLog(log)}
                  className="w-full text-left bg-white border border-slate-100 p-5 rounded-3xl shadow-sm hover:shadow-md transition-all flex items-center justify-between group"
                >
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-indigo-600">{new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    <p className="text-slate-900 font-bold">{log.sourceLang} → {log.targetLang}</p>
                    <p className="text-[10px] text-slate-400 font-medium">Engineer: {log.username} • {log.transcripts.length} exchanges</p>
                  </div>
                  <i className="fa-solid fa-chevron-right text-slate-200 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all"></i>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// --- Main App Component ---

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [isActive, setIsActive] = useState(false);
  const [transcripts, setTranscripts] = useState<TranscriptPair[]>([]);
  const [sourceLang, setSourceLang] = useState<Language>(LANGUAGES[0]);
  const [targetLang, setTargetLang] = useState<Language>(LANGUAGES[1]);
  const [error, setError] = useState<string | null>(null);
  const [showLangPicker, setShowLangPicker] = useState<'source' | 'target' | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  
  const [streamingInput, setStreamingInput] = useState('');
  const [streamingOutput, setStreamingOutput] = useState('');

  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  const currentInputRef = useRef<string>('');
  const currentOutputRef = useRef<string>('');

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts, streamingInput, streamingOutput]);

  const saveConversation = (finalTranscripts: TranscriptPair[]) => {
    if (finalTranscripts.length === 0 || !user) return;
    const newLog: ConversationLog = {
      id: Math.random().toString(36).substr(2, 9),
      username: user.username,
      timestamp: new Date().toISOString(),
      sourceLang: sourceLang.label,
      targetLang: targetLang.label,
      transcripts: finalTranscripts,
    };
    const storedLogs = JSON.parse(localStorage.getItem('syncvibe_logs') || '[]');
    storedLogs.unshift(newLog); // Newest first
    localStorage.setItem('syncvibe_logs', JSON.stringify(storedLogs));
  };

  const startSession = async () => {
    try {
      if (!process.env.API_KEY) { throw new Error("API Key is missing."); }
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: APP_CONFIG.INPUT_SAMPLE_RATE });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: APP_CONFIG.OUTPUT_SAMPLE_RATE });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const sessionPromise = ai.live.connect({
        model: APP_CONFIG.MODEL_NAME,
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: targetLang.voice } } },
          systemInstruction: getSystemInstruction(sourceLang, targetLang),
          outputAudioTranscription: {},
          inputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            const source = audioContextRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContextRef.current!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.outputTranscription) {
              currentOutputRef.current += message.serverContent.outputTranscription.text;
              setStreamingOutput(currentOutputRef.current);
            } else if (message.serverContent?.inputTranscription) {
              currentInputRef.current += message.serverContent.inputTranscription.text;
              setStreamingInput(currentInputRef.current);
            }
            if (message.serverContent?.turnComplete) {
              const newPair: TranscriptPair = {
                id: Math.random().toString(36).substr(2, 9),
                original: currentInputRef.current.trim(),
                translated: currentOutputRef.current.trim(),
                timestamp: new Date(),
                sender: 'user',
              };
              if (newPair.original || newPair.translated) {
                setTranscripts(prev => [...prev, newPair]);
              }
              currentInputRef.current = ''; currentOutputRef.current = '';
              setStreamingInput(''); setStreamingOutput('');
            }
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && outputAudioContextRef.current) {
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContextRef.current.currentTime);
              const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContextRef.current, APP_CONFIG.OUTPUT_SAMPLE_RATE, 1);
              const source = outputAudioContextRef.current.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputAudioContextRef.current.destination);
              source.addEventListener('ended', () => sourcesRef.current.delete(source));
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }
            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e) => { setError('Session error occurred.'); setIsActive(false); },
          onclose: () => { setIsActive(false); },
        }
      });
      sessionRef.current = await sessionPromise;
      setIsActive(true); setError(null);
    } catch (err: any) { setError(err.message || 'Failed to start.'); setIsActive(false); }
  };

  const stopSession = () => {
    if (sessionRef.current && typeof sessionRef.current.close === 'function') { sessionRef.current.close(); }
    setIsActive(false);
    if (audioContextRef.current) audioContextRef.current.close();
    if (outputAudioContextRef.current) outputAudioContextRef.current.close();
    saveConversation(transcripts);
    setStreamingInput(''); setStreamingOutput('');
  };

  const toggleSession = () => isActive ? stopSession() : startSession();

  const handleLogout = () => {
    stopSession(); setUser(null); setTranscripts([]); setAuthMode('login');
  };

  if (!user) {
    return authMode === 'login' 
      ? <Login onLogin={setUser} onSwitchToSignup={() => setAuthMode('signup')} />
      : <Signup onSignupSuccess={() => setAuthMode('login')} onSwitchToLogin={() => setAuthMode('login')} />;
  }

  return (
    <div className="flex flex-col h-screen max-w-lg mx-auto bg-[#F9FAFB] border-x border-slate-200 shadow-2xl overflow-hidden relative font-sans">
      {showHistory && <HistoryView user={user} onClose={() => setShowHistory(false)} />}
      
      {/* Header */}
      <header className="bg-white px-6 pt-6 pb-4 border-b border-slate-100 sticky top-0 z-20">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
              <i className="fa-solid fa-bolt text-sm"></i>
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">SyncVibe</h1>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowHistory(true)}
              className="w-8 h-8 flex items-center justify-center bg-slate-50 rounded-full text-slate-400 hover:text-indigo-600 transition-colors"
            >
              <i className="fa-solid fa-clock-rotate-left text-xs"></i>
            </button>
            <div className="flex flex-col items-end gap-0.5 ml-1">
              <div className="flex items-center gap-1 bg-green-50 px-2 py-0.5 rounded-md">
                <span className="w-1 h-1 bg-green-500 rounded-full"></span>
                <span className="text-[9px] font-bold text-green-600 uppercase">{user.role}</span>
              </div>
              <span className="text-[10px] font-bold text-slate-400">{user.username}</span>
            </div>
            <button onClick={handleLogout} className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-full text-slate-400 hover:text-red-500 transition-colors ml-1">
              <i className="fa-solid fa-right-from-bracket text-xs"></i>
            </button>
          </div>
        </div>

        {/* Language Selector */}
        <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-2xl border border-slate-200 shadow-sm">
          <button onClick={() => setShowLangPicker('source')} className="flex-1 flex items-center justify-center gap-2 py-3 bg-white rounded-xl shadow-sm border border-slate-100">
            <span className="text-lg">{sourceLang.flag}</span>
            <span className="text-sm font-bold text-slate-700">{sourceLang.nativeLabel}</span>
          </button>
          <button onClick={() => { if (isActive) stopSession(); setSourceLang(targetLang); setTargetLang(sourceLang); }} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-500"><i className="fa-solid fa-right-left text-xs"></i></button>
          <button onClick={() => setShowLangPicker('target')} className="flex-1 flex items-center justify-center gap-2 py-3 bg-white rounded-xl shadow-sm border border-slate-100">
            <span className="text-lg">{targetLang.flag}</span>
            <span className="text-sm font-bold text-slate-700">{targetLang.nativeLabel}</span>
          </button>
        </div>
      </header>

      {/* Main Conversation Area */}
      <main className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {transcripts.length === 0 && !isActive && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-6 opacity-60">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-inner border border-slate-100">
              <i className="fa-solid fa-microphone-lines text-4xl text-indigo-300"></i>
            </div>
            <div className="space-y-2 px-10">
              <p className="text-lg font-bold text-slate-800 leading-tight tracking-tight">MSP Expert Sync</p>
              <p className="text-sm text-slate-500 leading-relaxed">Bridge your cloud engineering teams with real-time interpretation.</p>
            </div>
          </div>
        )}

        {transcripts.map((pair) => (
          <div key={pair.id} className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-1.5 h-4 bg-slate-300 rounded-full"></span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{sourceLang.label}</span>
            </div>
            <p className="text-slate-500 text-sm italic leading-relaxed mb-4">{pair.original}</p>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-1.5 h-4 bg-indigo-500 rounded-full"></span>
              <span className="text-[10px] font-black text-indigo-500 uppercase tracking-tighter">{targetLang.label}</span>
            </div>
            <p className="text-slate-900 text-lg font-bold leading-tight">{pair.translated}</p>
          </div>
        ))}

        {(streamingInput || streamingOutput) && (
          <div className="bg-indigo-50/50 rounded-3xl p-5 border border-indigo-100 border-dashed animate-pulse">
            {streamingInput && <p className="text-slate-400 text-sm italic mb-2">{streamingInput}</p>}
            {streamingOutput && <p className="text-indigo-600 text-lg font-bold">{streamingOutput}</p>}
          </div>
        )}
        <div ref={transcriptEndRef} className="h-4" />
      </main>

      {/* Footer Controls */}
      <footer className="bg-white p-8 border-t border-slate-50 relative z-10">
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={toggleSession}
            className={`relative w-24 h-24 rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-90 ${
              isActive ? 'bg-red-500 text-white ring-8 ring-red-50' : 'bg-indigo-600 text-white ring-8 ring-indigo-50 hover:bg-indigo-700'
            }`}
          >
            {isActive ? (
              <div className="flex gap-1.5"><div className="w-1.5 h-6 bg-white rounded-full animate-bounce"></div><div className="w-1.5 h-6 bg-white rounded-full animate-bounce [animation-delay:0.1s]"></div><div className="w-1.5 h-6 bg-white rounded-full animate-bounce [animation-delay:0.2s]"></div></div>
            ) : <i className="fa-solid fa-microphone text-3xl"></i>}
          </button>
          <div className="text-center">
            <p className={`text-[10px] font-black uppercase tracking-[0.25em] ${isActive ? 'text-red-500' : 'text-slate-400'}`}>
              {isActive ? 'Technical Sync Active' : 'Begin Cloud Interpretation'}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
