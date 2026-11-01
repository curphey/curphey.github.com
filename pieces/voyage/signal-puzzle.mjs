// A reversible, local-control routing puzzle: every dial is reachable from its hub.
export class SignalPuzzle {
 constructor(chapter){this.chapter=chapter;this.reset();}
 reset(){this.at='entry';this.a=0;this.b=0;this.keys=new Set();this.fitted=[false,false];this.done=false;}
 get target(){return [[2,1],[1,2],[2,2],[1,1],[2,1]][this.chapter-1];}
 edges(){return [['entry','west'],['west','east'],['west',['entry','north','south'][this.a]],['east',['south','north','vault'][this.b]],...(this.fitted.every(Boolean)&&this.a===this.target[0]&&this.b===this.target[1]?[['north','vault']]:[])];}
 path(to){const q=[[this.at]],seen=new Set([this.at]);while(q.length){const p=q.shift(),at=p.at(-1);if(at===to)return p;for(const [a,b]of this.edges()){const n=a===at?b:b===at?a:null;if(n&&!seen.has(n)){seen.add(n);q.push([...p,n]);}}}return null;}
 walk(to){const p=this.path(to);if(!p)return false;for(const n of p){if(n==='north'||n==='south')this.keys.add(n);}this.at=to;return true;}
 act(){const i=this.at==='west'?0:this.at==='east'?1:-1;if(i>=0&&!this.fitted[i]&&this.keys.has(i===0?'north':'south')){this.fitted[i]=true;return true;}if(this.at==='west'){this.a=(this.a+1)%3;this.b=(this.b+1)%3;return true;}if(this.at==='east'){this.b=(this.b+1)%3;return true;}if(this.at==='vault'&&this.fitted.every(Boolean)&&this.a===this.target[0]&&this.b===this.target[1]){this.done=true;return true;}return false;}
 actionLabel(){const i=this.at==='west'?0:1;return this.at==='vault'?'Activate the signal beacon':!this.fitted[i]&&this.keys.has(i===0?'north':'south')?'Fit the signal piece':`Turn the ${this.at} signal dial`;}
 status(){return this.done?'Signal restored. Return to the main island to finish the passage.':`Bring the north piece to the west dial and the south piece to the east dial. Then activate the beacon with west dial ${this.target[0]+1} and east dial ${this.target[1]+1}. West turns both bridges. Current: ${this.a+1} / ${this.b+1}; pieces ${this.keys.size}/2, fitted ${this.fitted.filter(Boolean).length}/2.`;}
 clone(){const n=new SignalPuzzle(this.chapter);Object.assign(n,this);n.keys=new Set(this.keys);n.fitted=[...this.fitted];return n;}
 key(){return JSON.stringify([this.at,this.a,this.b,this.fitted,[...this.keys].sort(),this.done]);}
 hint(){const q=[{s:this.clone(),first:null}],seen=new Set([this.key()]);for(let i=0;i<q.length;i++){const {s,first}=q[i];if(s.done&&s.at==='entry')return first||'Return to the main island.';const next=[];for(const to of ['entry','west','east','north','south','vault']){const n=s.clone();if(to!==s.at&&n.walk(to))next.push({s:n,first:first||`Walk to the ${to==='entry'?'island connection':to+' signal quay'}.`});}const n=s.clone();if(n.act())next.push({s:n,first:first|| `${s.actionLabel()}.`});for(const n of next)if(!seen.has(n.s.key())){seen.add(n.s.key());q.push(n);}}return 'Return to the main island.';}
}
