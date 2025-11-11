
async function loadJSON(path){ const r = await fetch(path); return await r.json(); }

function formatINR(num){ try{ return new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(num); }catch(e){ return '₹'+num; } }

function qs(sel){ return document.querySelector(sel); }
function qsa(sel){ return [...document.querySelectorAll(sel)]; }

document.addEventListener('DOMContentLoaded', async ()=>{
  // KPIs on home
  if(qs('#kpi-ngos')){
    const ngos = await loadJSON('data/ngos.json');
    qs('#kpi-ngos').textContent = ngos.length;
  }
  if(qs('#kpi-items')){
    const items = await loadJSON('data/items.json');
    qs('#kpi-items').textContent = items.length;
  }
  if(qs('#kpi-donations')){
    const ledger = JSON.parse(localStorage.getItem('sevalink_donations')||'[]');
    const total = ledger.reduce((s,d)=> s + (parseFloat(d.amount)||0), 0);
    qs('#kpi-donations').textContent = formatINR(total);
  }

  // NGOs list
  if(qs('#ngo-table')){
    const data = await loadJSON('data/ngos.json');
    const tbody = qs('#ngo-table tbody');
    function render(){
      const q = (qs('#ngo-q').value||'').toLowerCase();
      const f = (qs('#ngo-focus').value||'').toLowerCase();
      tbody.innerHTML = '';
      data.filter(n=>{
        const okQ = [n.name,n.city,n.focus].join(' ').toLowerCase().includes(q);
        const okF = !f || (n.focus||'').toLowerCase()===f;
        return okQ && okF;
      }).forEach(n=>{
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><a href="ngo.html?id=${encodeURIComponent(n.id)}">${n.name}</a></td>
          <td>${n.city}</td>
          <td><span class="tag">${n.focus}</span></td>
          <td><div class="list"><span class="tag">${n.phone}</span><span class="tag">${n.email}</span></div></td>`;
        tbody.appendChild(tr);
      });
    }
    ['keyup','change'].forEach(evt=>{
      qs('#ngo-q').addEventListener(evt, render);
      qs('#ngo-focus').addEventListener(evt, render);
    });
    render();
  }

  // NGO detail
  if(qs('#ngo-detail')){
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    const data = await loadJSON('data/ngos.json');
    const ngo = data.find(n=> n.id===id);
    const root = qs('#ngo-detail');
    if(!ngo){ root.innerHTML = '<div class="notice">NGO not found.</div>'; return; }
    root.innerHTML = `
      <div class="card">
        <div class="list"><span class="badge">${ngo.focus}</span></div>
        <h1 class="h1" style="margin-top:6px">${ngo.name}</h1>
        <p class="lead">${ngo.city}</p>
        <div class="list" style="margin:10px 0">
          <span class="tag">${ngo.phone}</span>
          <span class="tag">${ngo.email}</span>
          <a class="tag" target="_blank" href="${ngo.website}">Website</a>
        </div>
        <div class="row">
          <a class="button primary col" href="donate.html">Donate to this NGO</a>
          <a class="button linklike col" href="marketplace.html">Shop items supporting ${ngo.name}</a>
        </div>
      </div>`;
  }

  // Populate NGO selects on donate form
  if(qs('#donation-ngo')){
    const data = await loadJSON('data/ngos.json');
    [qs('#donation-ngo'), qs('#item-ngo')].forEach(sel=>{
      sel.innerHTML = '<option value="">Select NGO</option>' + data.map(n=> `<option>${n.name}</option>`).join('');
    });
  }

  // Donate (demo)
  if(qs('#donate-btn')){
    qs('#donate-btn').addEventListener('click', ()=>{
      const entry = {
        name: qs('#donor-name').value.trim(),
        ngo: qs('#donation-ngo').value,
        email: qs('#donor-email').value.trim(),
        amount: qs('#donation-amount').value.trim(),
        ts: new Date().toISOString()
      };
      if(!entry.name || !entry.ngo || !entry.amount){
        qs('#donation-result').innerHTML = '<div class="notice">Please fill name, NGO, and amount.</div>'; return;
      }
      const ledger = JSON.parse(localStorage.getItem('sevalink_donations')||'[]');
      ledger.push(entry);
      localStorage.setItem('sevalink_donations', JSON.stringify(ledger));
      const receipt = `Receipt\n———\nDonor: ${entry.name}\nNGO: ${entry.ngo}\nAmount: ${formatINR(parseFloat(entry.amount)||0)}\nDate: ${new Date(entry.ts).toLocaleString()}`;
      qs('#donation-result').innerHTML = '<div class="card"><pre>'+receipt+'</pre></div>';
      if(qs('#kpi-donations')) qs('#kpi-donations').textContent = ledger.reduce((s,d)=> s + (parseFloat(d.amount)||0), 0);
    });
  }

  // Item donation (demo)
  if(qs('#item-btn')){
    qs('#item-btn').addEventListener('click', ()=>{
      const entry = {
        item: qs('#item-name').value.trim(),
        cond: qs('#item-condition').value.trim(),
        city: qs('#pickup-city').value.trim(),
        ngo: qs('#item-ngo').value,
        ts: new Date().toISOString()
      };
      if(!entry.item || !entry.city || !entry.ngo){
        qs('#item-result').innerHTML = '<div class="notice">Please fill item, city, and NGO.</div>'; return;
      }
      const pledges = JSON.parse(localStorage.getItem('sevalink_items')||'[]');
      pledges.push(entry);
      localStorage.setItem('sevalink_items', JSON.stringify(pledges));
      qs('#item-result').innerHTML = '<div class="card">Thanks! Your pickup request has been recorded (demo).</div>';
    });
  }

  // Marketplace
  if(qs('#item-grid')){
    const items = await loadJSON('data/items.json');
    function render(){
      const q = (qs('#item-q').value||'').toLowerCase();
      const cat = (qs('#item-cat').value||'').toLowerCase();
      qs('#item-grid').innerHTML = '';
      items.filter(it=>{
        const okQ = [it.title,it.ngo,it.category].join(' ').toLowerCase().includes(q);
        const okC = !cat || it.category.toLowerCase()===cat;
        return okQ && okC;
      }).forEach(it=>{
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
          <div class="list"><span class="tag">${it.category}</span><span class="tag">${it.condition}</span></div>
          <h3>${it.title}</h3>
          <div class="kpi"><div class="num">${formatINR(it.price)}</div><div>supports ${it.ngo}</div></div>
          <button class="button primary" onclick="alert('Demo checkout for ${it.title}')">Buy (Demo)</button>
        `;
        qs('#item-grid').appendChild(card);
      });
    }
    ['keyup','change'].forEach(evt=>{
      qs('#item-q').addEventListener(evt, render);
      qs('#item-cat').addEventListener(evt, render);
    });
    render();
  }

  // Funding
  if(qs('#funding-cards')){
    const funds = await loadJSON('data/funding.json');
    const root = qs('#funding-cards');
    funds.forEach(f=>{
      const el = document.createElement('div'); el.className='card';
      el.innerHTML = `
        <div class="list"><span class="badge">${f.status}</span><span class="tag">${f.ministry}</span></div>
        <h3>${f.program}</h3>
        <p class="muted">${f.focus}</p>
        <div class="row">
          <div class="col"><div class="kpi"><div class="num">${f.grant_range}</div><div>Grant range</div></div></div>
          <div class="col"><div class="kpi"><div class="num">${f.deadline}</div><div>Deadline</div></div></div>
        </div>
        <div class="row" style="margin-top:8px">
          <button class="button primary">Apply (Demo)</button>
          <a class="button linklike" href="#">Program details (Demo)</a>
        </div>
      `;
      root.appendChild(el);
    });
  }

  // Contact (demo)
  if(qs('#c-send')){
    qs('#c-send').addEventListener('click', ()=>{
      if(!qs('#c-name').value.trim() || !qs('#c-email').value.trim() || !qs('#c-msg').value.trim()){
        qs('#c-result').innerHTML = '<div class="notice">Please complete all fields.</div>'; return;
      }
      qs('#c-result').innerHTML = '<div class="card">Thanks! We will respond shortly (demo).</div>';
    });
  }
});
