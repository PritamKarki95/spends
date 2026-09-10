// Run against an isolated Chrome profile with --remote-debugging-port=9223.
// All API calls are intercepted in the browser; no real account data is changed.
import assert from 'node:assert/strict'
const tabs = await (await fetch('http://127.0.0.1:9223/json/list')).json()
const ws = new WebSocket(tabs.find(t => t.type === 'page').webSocketDebuggerUrl)
await new Promise(resolve => ws.addEventListener('open', resolve))
let id = 0
const pending = new Map()
const errors = []
ws.addEventListener('message', event => {
  const message = JSON.parse(event.data)
  if (message.id) { pending.get(message.id)?.(message); pending.delete(message.id) }
  else if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.exception?.description)
})
const call = (method, params = {}) => new Promise(resolve => {
  const next = ++id; pending.set(next, resolve); ws.send(JSON.stringify({ id: next, method, params }))
})
async function evaluate(expression) {
  const result = (await call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result
  assert.ok(!result.exceptionDetails, JSON.stringify(result.exceptionDetails))
  return result.result.value
}
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
async function navigate(path) {
  await call('Page.navigate', { url: `http://localhost:5173${path}` }); await sleep(650)
}
const button = text => `[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===${JSON.stringify(text)})`

await call('Page.enable'); await call('Runtime.enable')
await call('Page.addScriptToEvaluateOnNewDocument', { source: `
localStorage.setItem('token','test-only');localStorage.setItem('theme','light');
window.calls=[];window.fail=false;window.slow=0;window.empty=false;
window.rows=[{id:1,date:'2026-08-31',description:'STARBUCKS',merchant:'Cafe',amount:30,type:'debit',category:'Food'},{id:2,date:'2026-07-15',description:'Salary',merchant:'Work',amount:1000,type:'credit',category:'Income'},{id:3,date:'2026-08-01',description:'Shopping',merchant:'Store',amount:80,type:'debit',category:'Shopping'}];
window.fetch=async(url,opts={})=>{
 const path=new URL(url,location.origin).pathname;const method=opts.method||'GET';calls.push({path,method});
 if(window.slow)await new Promise(r=>setTimeout(r,window.slow));
 if(window.fail)return new Response(JSON.stringify({detail:'Test failure'}),{status:500});
 let data=[];
 if(path==='/auth/me')data={id:1,email:'tester@example.com'};
 else if(path==='/auth/login')data={access_token:'test-only'};
 else if(path==='/auth/register')return new Response('{}',{status:201});
 else if(path==='/transactions/all'){rows=[];data={deleted_count:3};}
 else if(path==='/transactions'&&method==='POST'){data={id:4,category:'Food',...JSON.parse(opts.body)};rows.push(data);return new Response(JSON.stringify(data),{status:201});}
 else if(path.startsWith('/transactions/')&&method==='PATCH'){data={...rows.find(t=>t.id===Number(path.split('/').at(-1))),...JSON.parse(opts.body)};rows=rows.map(t=>t.id===data.id?data:t);}
 else if(path.startsWith('/transactions/')&&method==='DELETE'){rows=rows.filter(t=>t.id!==Number(path.split('/').at(-1)));return new Response(null,{status:204});}
 else if(path==='/transactions')data=window.empty?[]:rows;
 else if(path.includes('/merchant/'))data=[rows[0]];
 else if(path.includes('/category/')){const category=decodeURIComponent(path.split('/').at(-1));if(category==='Food')await new Promise(r=>setTimeout(r,250));data={category,merchants:[{category:category==='Food'?'Cafe':'Store',change:10}]};}
 else if(path.startsWith('/comparisons/'))data={current_total:110,total_change:10,total_percent_change:10,categories:[{category:'Food',current_amount:30,previous_amount:20,change:10,percent_change:50},{category:'Shopping',current_amount:80,previous_amount:80,change:0,percent_change:0}]};
 else if(path==='/forecast')data={forecast:{projection:null}};
 else if(path==='/statements/upload')data={statement_id:1,transactions:rows};
 else if(path==='/subscriptions/detect')data={detected_count:0};
 return new Response(JSON.stringify(data),{status:200,headers:{'Content-Type':'application/json'}});
};
window.fill=(selector,value)=>{const el=document.querySelector(selector);const proto=el.tagName==='SELECT'?HTMLSelectElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(el,value);el.dispatchEvent(new Event(el.tagName==='SELECT'?'change':'input',{bubbles:true}));};
` })

let checks = 0
try {
  for (const width of [375, 390, 1280]) {
    await call('Emulation.setDeviceMetricsOverride', { width, height: 844, deviceScaleFactor: 1, mobile: width < 500 })
    for (const path of ['/', '/about', '/login', '/register', '/dashboard', '/transactions', '/comparison', '/upload', '/subscriptions']) {
      await navigate(path)
      assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true, `Overflow ${path} ${width}`)
      assert.equal(await evaluate('!!document.querySelector("h1,h2")'), true, `No content ${path}`)
      if (path === '/about') assert.equal(await evaluate('document.querySelectorAll("article").length'), 6)
      if (path === '/login' || path === '/register') {
        assert.equal(await evaluate('getComputedStyle(document.querySelector("#root>div>div")).display'), width < 1024 ? 'none' : 'flex')
      }
      await evaluate('document.documentElement.classList.add("dark")')
      await sleep(250)
      assert.equal(await evaluate('getComputedStyle(document.querySelector("#root>div")).backgroundColor'), 'rgb(10, 31, 46)')
      checks++
    }
  }
  await navigate('/transactions')
  await evaluate(`fill('select','Food')`); await sleep(80)
  assert.equal(await evaluate('document.querySelectorAll("tbody tr").length'), 1)
  await evaluate(`${button('Reset filters')}.click()`); await sleep(80)
  await evaluate(`fill('input[type=date]','2026-08-15')`); await sleep(80)
  assert.equal(await evaluate('document.querySelectorAll("tbody tr").length'), 1)
  await evaluate(`${button('Reset filters')}.click()`); await sleep(80)
  await evaluate(`window.confirm=()=>false;${button('Clear all transaction data')}.click()`); await sleep(80)
  assert.equal(await evaluate('calls.some(c=>c.path==="/transactions/all")'), false)
  await evaluate(`${button('Edit')}.click()`); await sleep(80)
  await evaluate(`${button('Save')}.click()`); await sleep(80)
  assert.equal(await evaluate('document.querySelector(".fixed[role=status]").textContent.includes("updated")'), true)
  await evaluate(`${button('Delete')}.click()`); await sleep(80)
  assert.equal(await evaluate('document.querySelectorAll("tbody tr").length'), 2)
  await evaluate(`window.fail=true;window.confirm=()=>true;${button('Clear all transaction data')}.click()`); await sleep(80)
  assert.equal(await evaluate('document.querySelectorAll("tbody tr").length'), 2)
  await evaluate(`window.fail=false;${button('Clear all transaction data')}.click()`); await sleep(80)
  assert.equal(await evaluate('document.querySelectorAll("tbody tr").length'), 0)
  checks += 7

  await navigate('/comparison')
  await evaluate(`document.querySelectorAll('button[aria-expanded]')[1].click()`); await sleep(30)
  await evaluate(`document.querySelectorAll('button[aria-expanded]')[2].click()`); await sleep(400)
  assert.equal(await evaluate('document.body.textContent.includes("Store") && !document.body.textContent.includes("Cafe")'), true, 'Stale category response')
  checks++

  await navigate('/upload')
  await evaluate(`(()=>{const dt=new DataTransfer();dt.items.add(new File(['fixture'],'sample.pdf',{type:'application/pdf'}));const el=document.querySelector('input[type=file]');el.files=dt.files;el.dispatchEvent(new Event('change',{bubbles:true}));})()`); await sleep(80)
  await evaluate(`document.querySelector('form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}))`); await sleep(100)
  assert.equal(await evaluate('document.querySelector("[aria-current=step]").textContent'), 'Review')
  await evaluate(`[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Confirm Import')).click()`); await sleep(100)
  assert.equal(await evaluate('document.querySelector("[aria-current=step]").textContent'), 'Complete')
  checks += 2

  await navigate('/dashboard')
  await evaluate(`fill('section[aria-label="Spending charts"] select','2026-07')`); await sleep(100)
  assert.equal(await evaluate('document.querySelector("section[aria-label=\\"Spending charts\\"]").textContent.includes("No spending this month")'), true)
  await evaluate(`document.querySelector('[aria-label="Toggle dark mode"]').click()`); await sleep(100)
  assert.equal(await evaluate('localStorage.getItem("theme")'), 'dark')
  await evaluate(`localStorage.removeItem('token');history.pushState({},'','/transactions');dispatchEvent(new PopStateEvent('popstate'))`); await sleep(150)
  assert.equal(await evaluate('location.pathname'), '/login')
  checks += 3
  assert.deepEqual(errors, [])
  console.log(`PASS: ${checks} browser scenarios; responsive layouts, dark mode, public pages, filters, edit/delete/clear, confirmations, error preservation, comparison race, upload, charts, and protected redirect. No runtime exceptions.`)
} finally {
  await call('Browser.close'); ws.close()
}
