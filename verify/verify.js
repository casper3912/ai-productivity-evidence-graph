const {JSDOM}=require('jsdom');
const fs=require('fs');
const path=require('path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const dom=new JSDOM(html,{runScripts:"dangerously",pretendToBeVisual:true});
const w=dom.window;
w.addEventListener('error',e=>{console.error("PAGE ERROR:",e.message);process.exitCode=1});

setTimeout(()=>{
  try{
    if(typeof w.__runTests!=="function"){console.error("FAIL: __runTests not exposed");process.exit(1)}
    const res=w.__runTests();
    for(const r of res.results){
      console.log((r.pass?"PASS":"FAIL")+"  "+r.name+(r.pass?"":"   ["+r.detail+"]"));
    }
    console.log("----");
    console.log(`SUITE: ${res.passed}/${res.total}`);
    // external structural assertions (belt & suspenders, independent of embedded suite)
    const doc=w.document;
    const extra=[
      ["standalone: no <link> tags", doc.querySelectorAll("link").length===0],
      ["standalone: no external script src", [...doc.querySelectorAll("script[src]")].length===0],
      ["26 study nodes in DOM", doc.querySelectorAll("#graph g.node").length===26],
      ["30 edges in DOM", doc.querySelectorAll("#graph > g:not(.axis):not(.lanes) > line").length===30],
      ["test status badge shows PASS", (doc.getElementById("teststatus").textContent||"").includes("PASS")]
    ];
    let ok=res.passed===res.total;
    for(const [n,p] of extra){console.log((p?"PASS":"FAIL")+"  EXT "+n); ok=ok&&p}
    console.log(ok?"VERDICT: ALL GREEN":"VERDICT: FAILURES PRESENT");
    process.exit(ok?0:1);
  }catch(e){console.error("HARNESS ERROR:",e.stack);process.exit(1)}
},1500);
