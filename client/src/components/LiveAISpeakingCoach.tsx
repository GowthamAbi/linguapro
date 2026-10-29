import { useEffect, useRef, useState } from "react";
import { BarChart3, Mic, MicOff, Send, Sparkles, Volume2 } from "lucide-react";
type Props = { apiBase:string; authToken:string; authenticated:boolean; level:"Basic"|"Intermediate"|"Advanced" };
type Turn = { id?:string; transcript:string; correctedSentence:string; explanation:string; coachReply:string; grammarIssues:string[]; vocabularySuggestions:string[]; createdAt?:string };
type Report = { current:{turns:number;words:number;corrections:number}; previous:{turns:number;words:number;corrections:number}; daily:Array<{date:string;turns:number;words:number;corrections:number}>; recent:Turn[] };
type Recognition = { lang:string; continuous:boolean; interimResults:boolean; onresult:((event:{resultIndex:number;results:ArrayLike<ArrayLike<{transcript:string;isFinal?:boolean}>>})=>void)|null; onerror:((event:{error?:string})=>void)|null; onend:(()=>void)|null; start:()=>void; stop:()=>void };
type RecognitionWindow = Window & { SpeechRecognition?:new()=>Recognition; webkitSpeechRecognition?:new()=>Recognition };
export default function LiveAISpeakingCoach({apiBase,authToken,authenticated,level}:Props) {
 const [active,setActive]=useState(false),[busy,setBusy]=useState(false),[liveText,setLiveText]=useState(""),[draft,setDraft]=useState(""),[turns,setTurns]=useState<Turn[]>([]),[error,setError]=useState(""),[period,setPeriod]=useState<"day"|"week">("week"),[report,setReport]=useState<Report|null>(null);
 const recognitionRef=useRef<Recognition|null>(null),activeRef=useRef(false),busyRef=useRef(false),sessionIdRef=useRef("live-"+Date.now());
 useEffect(()=>{activeRef.current=active},[active]);
 useEffect(()=>{if(authenticated&&apiBase) void loadReport()},[authenticated,apiBase,period]);
 useEffect(()=>()=>{activeRef.current=false;recognitionRef.current?.stop()},[]);
 async function loadReport(){
  try{const r=await fetch(apiBase+"/live-speaking/report?period="+period,{credentials:"include",headers:authToken?{Authorization:"Bearer "+authToken}:{}});const p=await r.json() as {message?:string;data?:Report};if(!r.ok)throw new Error(p.message??"Could not load report.");if(p.data){setReport(p.data);setTurns(p.data.recent.slice().reverse())}}
  catch(e){setError(e instanceof Error?e.message:"Could not load report.")}
 }
 async function sendTranscript(text:string){
  const transcript=text.trim();if(!transcript||busyRef.current)return;
  if(!authenticated||!apiBase){setDraft(transcript);setError("Sign in to save conversations and view reports.");return}
  busyRef.current=true;setBusy(true);setError("");setDraft("");
  try{const r=await fetch(apiBase+"/live-speaking/turn",{method:"POST",credentials:"include",headers:{"Content-Type":"application/json",...(authToken?{Authorization:"Bearer "+authToken}:{})},body:JSON.stringify({transcript,sessionId:sessionIdRef.current,level})});const p=await r.json() as {message?:string;data?:Turn};if(!r.ok||!p.data)throw new Error(p.message??"AI feedback could not be loaded.");setTurns(old=>[...old,{...p.data!,transcript}]);setLiveText("");if("speechSynthesis"in window){window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(p.data.coachReply);u.lang="en-IN";u.rate=.95;window.speechSynthesis.speak(u)}void loadReport()}
  catch(e){setError(e instanceof Error?e.message:"AI feedback failed.");setDraft(transcript)}
  finally{busyRef.current=false;setBusy(false)}
 }
 function startListening(){
  setError("");const browser=window as RecognitionWindow;const API=browser.SpeechRecognition??browser.webkitSpeechRecognition;
  if(!API){setError("Live speech recognition is not supported here. Use Chrome and allow microphone access.");return}
  try{const recognition=new API();recognition.lang="en-IN";recognition.continuous=true;recognition.interimResults=true;
   recognition.onresult=(event)=>{let interim="";const finals:string[]=[];for(let i=event.resultIndex;i<event.results.length;i++){const result=event.results[i];const phrase=result?.[0]?.transcript?.trim()??"";if(result?.[0]?.isFinal){if(phrase)finals.push(phrase)}else interim+=phrase+" "}if(interim.trim())setLiveText(interim.trim());if(finals.length){const phrase=finals.join(" ").trim();setLiveText(phrase);void sendTranscript(phrase)}};
   recognition.onerror=(event)=>{if(event.error!=="no-speech"&&event.error!=="aborted")setError("Microphone error: "+(event.error??"please try again"))};
   recognition.onend=()=>{if(activeRef.current){try{recognition.start()}catch{/* recognizer is still closing */}}};
   recognitionRef.current=recognition;sessionIdRef.current="live-"+Date.now();activeRef.current=true;setActive(true);recognition.start()
  }catch{setError("Could not start the microphone. Check browser permission.");setActive(false)}
 }
 function stopListening(){activeRef.current=false;setActive(false);recognitionRef.current?.stop();recognitionRef.current=null;if("speechSynthesis"in window)window.speechSynthesis.cancel()}
 const current=report?.current,previous=report?.previous;
 const change=(now:number,before:number)=>before===0?(now===0?"—":"New"):(now>=before?"+":"")+Math.round((now-before)/before*100)+"%";
 return <section className="surface-card live-speaking-card">
  <div className="card-heading"><div><span className="tag"><Sparkles size={12}/> LIVE AI CONVERSATION</span><h3>Talk naturally with your AI coach</h3><p>Speak in English. Get corrections, explanations, and a follow-up question.</p></div><span className={"live-status "+(active?"is-live":"")}>{active?"Listening live":"Mic off"}</span></div>
  {!authenticated&&<div className="inline-message">Please sign in first. Your history and reports are saved to your account.</div>}
  <div className="live-controls"><button className={"button "+(active?"button-outline":"button-primary")} onClick={active?stopListening:startListening} disabled={!authenticated||busy}>{active?<><MicOff size={16}/> Stop conversation</>:<><Mic size={16}/> Start live speaking</>}</button><button className="button button-outline" onClick={()=>{setDraft(liveText);setLiveText("")}} disabled={!liveText.trim()}>Use transcript</button><span className="muted-small">{busy?"AI is thinking…":active?"Speak naturally; pause between thoughts.":"Start the mic and say a sentence."}</span></div>
  {liveText&&<div className="example-box"><span>LIVE TRANSCRIPT</span><p>{liveText}</p></div>}
  <form className="live-compose" onSubmit={e=>{e.preventDefault();void sendTranscript(draft)}}><label>Your sentence<textarea rows={2} maxLength={2000} value={draft} onChange={e=>setDraft(e.target.value)} placeholder="Or type what you want to say…"/></label><button className="button button-primary" disabled={busy||!draft.trim()}><Send size={15}/>{busy?"Checking…":"Send to AI coach"}</button></form>
  {error&&<div className="inline-message">{error}</div>}
  <div className="live-turn-list"><div className="section-heading"><div><h3>Conversation & corrections</h3><p>Your saved speaking practice.</p></div><button className="button button-outline" onClick={()=>void loadReport()}><BarChart3 size={15}/> Refresh</button></div>
   {turns.slice(-8).map((turn,index)=><article className="live-turn" key={turn.id??index}><span className="tag">YOU SAID</span><p className="live-original">{turn.transcript}</p><span className="tag">CORRECTED ENGLISH</span><p className="live-corrected">{turn.correctedSentence}</p><p>{turn.explanation}</p>{turn.vocabularySuggestions.length>0&&<p><strong>Try these phrases:</strong> {turn.vocabularySuggestions.join(" · ")}</p>}<div className="live-coach-reply"><Volume2 size={15}/><span>{turn.coachReply}</span><button className="inline-link" onClick={()=>{const u=new SpeechSynthesisUtterance(turn.coachReply);u.lang="en-IN";window.speechSynthesis.speak(u)}}>Listen</button></div></article>)}
   {!turns.length&&<p className="muted-small">Your first conversation will appear here after you send a sentence.</p>}
  </div>
  <div className="live-report"><div className="section-heading"><div><h3>Progress comparison</h3><p>Compare this period with the previous {period==="day"?"day":"7 days"}.</p></div><div className="report-toggle"><button className={period==="day"?"active":""} onClick={()=>setPeriod("day")}>Daily</button><button className={period==="week"?"active":""} onClick={()=>setPeriod("week")}>Weekly</button></div></div>
   <div className="stats-grid live-stats"><div className="stat-card"><div><span>Speaking turns</span><strong>{current?.turns??0}</strong><small>Previous: {previous?.turns??0} · {change(current?.turns??0,previous?.turns??0)}</small></div></div><div className="stat-card"><div><span>Words spoken</span><strong>{current?.words??0}</strong><small>Previous: {previous?.words??0} · {change(current?.words??0,previous?.words??0)}</small></div></div><div className="stat-card"><div><span>Corrections</span><strong>{current?.corrections??0}</strong><small>Previous: {previous?.corrections??0} · {change(current?.corrections??0,previous?.corrections??0)}</small></div></div></div>
   {report?.daily.length?<div className="live-daily-list">{report.daily.map(day=><div key={day.date}><span>{new Date(day.date+"T00:00:00").toLocaleDateString(undefined,{weekday:"short",month:"short",day:"numeric"})}</span><span>{day.turns} turns · {day.words} words · {day.corrections} corrections</span></div>)}</div>:<p className="muted-small">Speak today to start building your report.</p>}
  </div>
  <p className="notice">Transcript text and AI feedback are saved to your account. Raw microphone audio is not stored. Speech recognition varies by browser.</p>
 </section>
}
