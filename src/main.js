import { createClient } from '@supabase/supabase-js'
import './style.css'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
const configured = SUPABASE_URL && SUPABASE_KEY
const supabase = configured ? createClient(SUPABASE_URL, SUPABASE_KEY) : null
const app = document.querySelector('#app')
const statuses=['Waiting for Documents','Documents Complete','Medical','Visa Processing','Ready to Travel','Sent to Saudi Arabia','Cancelled']

const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))
const statusOptions=s=>statuses.map(x=>`<option ${x===s?'selected':''}>${x}</option>`).join('')

function setupScreen(){
 app.innerHTML=`<main class="setup"><section class="authcard"><h1>🇸🇦 Saudi Worker Tracker</h1><p>This app is ready, but it needs your Supabase connection details before it can go online.</p><ol><li>Create a Supabase project.</li><li>Copy the Project URL and Publishable key.</li><li>Put them in <code>.env</code> using the included <code>.env.example</code>.</li></ol><p class="small">After deployment, your sister can create the one account she will use.</p></section></main>`
}

function loginScreen(){
 app.innerHTML=`<main class="auth"><section class="authcard"><h1>🇸🇦 Worker Tracker</h1><p>Private agency dashboard</p>
 <form id="login"><input id="email" type="email" placeholder="Email" required><input id="password" type="password" placeholder="Password" minlength="6" required><button>Sign in</button></form>
<div class="divider">or</div>

<div id="signupBox">
  <input id="signupEmail" type="email" placeholder="Email for the private account">
  <input id="signupPassword" type="password" placeholder="Choose a password (minimum 6 characters)" minlength="6">
  <button type="button" class="secondary" id="signup">Create the private account</button>
</div>
 <p id="msg" class="msg"></p></section></main>`
 document.querySelector('#login').onsubmit=async e=>{
  e.preventDefault()
  setMsg('Signing in...')

  const email = document.querySelector('#email').value
  const password = document.querySelector('#password').value

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if(error) {
    setMsg(error.message, true)
  } else {
    await boot()
  }
}
 
const signupButton = document.querySelector('#signup')

signupButton.addEventListener('click', async (e) => {
  e.preventDefault()

  const email = document.querySelector('#signupEmail').value.trim()
  const password = document.querySelector('#signupPassword').value

  if (!email || !password) {
    setMsg('Please enter an email and password.', true)
    return
  }

  if (password.length < 6) {
    setMsg('Password must be at least 6 characters.', true)
    return
  }

  setMsg('Creating account...')

  const { error } = await supabase.auth.signUp({
    email,
    password
  })

  if (error) {
    setMsg(error.message, true)
  } else {
    setMsg('Account created! You can now sign in.')
  }
})

signupButton.addEventListener('click', async (e) => {
  e.preventDefault()

  alert('Signup button is working')

  const email = prompt('Enter the email your sister will use:')
  if (!email) return

  const password = prompt('Choose a password (at least 6 characters):')
  if (!password) return

  setMsg('Creating account...')

  const { error } = await supabase.auth.signUp({
    email: email,
    password: password
  })

  if (error) {
    setMsg(error.message, true)
  } else {
    setMsg('Account created successfully! Check the email inbox if confirmation is required.')
  }
})
}
function setMsg(t,bad=false){const el=document.querySelector('#msg');if(el){el.textContent=t;el.className='msg '+(bad?'bad':'')}}

let workers=[], filter=''
async function dashboard(){
 app.innerHTML=`<header><div><h1>🇸🇦 Saudi Worker Tracker</h1><p id="who"></p></div><div class="headBtns"><button class="secondary" id="logout">Log out</button><button id="add">+ Add Person</button></div></header>
 <main class="container"><section class="stats">
 <article><span>Total People</span><strong id="total">0</strong></article><article><span>Processing</span><strong id="processing">0</strong></article><article><span>Visa</span><strong id="visa">0</strong></article><article><span>Ready</span><strong id="ready">0</strong></article><article><span>Sent</span><strong id="sent">0</strong></article></section>
 <section class="toolbar"><input id="search" placeholder="Search name..."><select id="filter"><option value="">All statuses</option>${statusOptions('')}</select></section>
 <section class="tablecard"><div class="scroll"><table><thead><tr><th>Name</th><th>Status</th><th>Date</th><th>Notes</th><th></th></tr></thead><tbody id="rows"></tbody></table></div><div id="empty" class="empty">No people added yet.</div></section></main>
 <div id="modal" class="modal"></div>`
 const {data:{user}}=await supabase.auth.getUser()
 document.querySelector('#who').textContent=user?.email||''
 document.querySelector('#logout').onclick=async()=>{await supabase.auth.signOut();loginScreen()}
 document.querySelector('#add').onclick=()=>openModal()
 document.querySelector('#search').oninput=e=>{filter=e.target.value.toLowerCase();renderRows()}
 document.querySelector('#filter').onchange=renderRows
 await loadWorkers()
}
async function loadWorkers(){
 const {data,error}=await supabase.from('workers').select('*').order('created_at',{ascending:false})
 if(error){alert(error.message);return}
 workers=data||[];renderRows()
}
function renderRows(){
 const sf=document.querySelector('#filter')?.value||''
 const list=workers.filter(w=>(!sf||w.status===sf)&&(`${w.full_name}`).toLowerCase().includes(filter))
 document.querySelector('#rows').innerHTML=list.map(w=>`<tr><td><b>${esc(w.full_name)}</b></td><td><span class="badge">${esc(w.status)}</span></td><td>${new Date(w.created_at).toLocaleDateString()}</td><td>${esc(w.notes)}</td><td class="actions"><button class="edit" data-edit="${w.id}">Edit</button><button class="danger" data-del="${w.id}">Delete</button></td></tr>`).join('')
 document.querySelector('#empty').style.display=list.length?'none':'block'
 const count=s=>workers.filter(w=>s.includes(w.status)).length
 total.textContent=workers.length;processing.textContent=count(['Waiting for Documents','Documents Complete','Medical']);visa.textContent=count(['Visa Processing']);ready.textContent=count(['Ready to Travel']);sent.textContent=count(['Sent to Saudi Arabia'])
 document.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>openModal(workers.find(w=>w.id===b.dataset.edit)))
 document.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>removeWorker(b.dataset.del))
}
function openModal(w=null){
 modal.className='modal show';modal.innerHTML=`<section class="modalbox"><div class="modalhead"><h2>${w?'Edit':'Add'} Person</h2><button class="secondary" id="close">×</button></div>
 <form id="workerform"><div class="grid"><label>Full name*<input name="full_name" required value="${esc(w?.full_name)}"></label><label>Status<select name="status">${statusOptions(w?.status||statuses[0])}</select></label><label class="full">Notes<textarea name="notes">${esc(w?.notes)}</textarea></label></div><div class="modalactions"><button type="button" class="secondary" id="cancel">Cancel</button><button>Save</button></div></form></section>`
 close.onclick=cancel.onclick=()=>modal.className='modal'
 workerform.onsubmit=async e=>{e.preventDefault();const fd=new FormData(workerform);const payload=Object.fromEntries(fd.entries());let error
  if(w)({error}=await supabase.from('workers').update(payload).eq('id',w.id));else({error}=await supabase.from('workers').insert(payload))
  if(error)alert(error.message);else{modal.className='modal';await loadWorkers()}
 }
}
async function removeWorker(id){if(confirm('Delete this person?')){const {error}=await supabase.from('workers').delete().eq('id',id);if(error)alert(error.message);else await loadWorkers()}}
async function boot(){
 if(!configured)return setupScreen()
 const {data:{session}}=await supabase.auth.getSession()
 if(session)dashboard();else loginScreen()
}
boot()
