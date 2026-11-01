import assert from 'node:assert/strict';
import {SignalPuzzle} from './signal-puzzle.mjs';
for(const chapter of [1,2,3,4,5]){
 const start=new SignalPuzzle(chapter),states=[{s:start,plan:[]}],ids=new Map([[start.key(),0]]),incoming=[[]];let solution;
 for(let i=0;i<states.length;i++){
  const {s,plan}=states[i];if(s.done&&s.at==='entry'){solution??=plan;continue;}
  const next=[];for(const to of ['entry','west','east','north','south','vault']){const n=s.clone();if(to!==s.at&&n.walk(to))next.push({s:n,plan:[...plan,{walk:to}]});}const n=s.clone();if(n.act())next.push({s:n,plan:[...plan,{act:s.at}]});
  for(const candidate of next){const k=candidate.s.key();if(!ids.has(k)){ids.set(k,states.length);states.push(candidate);incoming.push([]);}incoming[ids.get(k)].push(i);}
 }
 const wins=states.flatMap(({s},i)=>s.done&&s.at==='entry'?[i]:[]),canWin=new Set(wins);for(let i=0;i<wins.length;i++)for(const prev of incoming[wins[i]])if(!canWin.has(prev)){canWin.add(prev);wins.push(prev);}
 assert(solution);assert.equal(canWin.size,states.length,'Every reachable state must have a route to completion');assert(solution.length>=10);console.log(JSON.stringify({chapter,states:states.length,actions:solution.length,solution}));
}
