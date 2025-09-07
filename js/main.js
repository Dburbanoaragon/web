// Main JS para Aqua-GT (menú, año, scroll, modales, carrito, filtros+paginación, detalle de producto)
document.addEventListener("DOMContentLoaded", () => {
  /* ========================
     Helpers / Config
  ======================== */
  const CART_KEY = "carritoAGT";
  const q  = (sel, ctx = document) => ctx.querySelector(sel);
  const qa = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const formatQ = (n) => `Q${Number(n).toFixed(2)}`;

  function getCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
    catch { return []; }
  }
  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartCount();
    window.dispatchEvent(new CustomEvent("cart:updated"));
  }

  /* ========================
     1) Menú responsive
  ======================== */
  const navToggle = q(".nav-toggle");
  const menu = q("#menu");
  if (navToggle && menu) {
    const openMenu = () => navToggle.setAttribute("aria-expanded", "true");
    const closeMenu = () => navToggle.setAttribute("aria-expanded", "false");
    const isOpen = () => navToggle.getAttribute("aria-expanded") === "true";

    navToggle.addEventListener("click", () => (isOpen() ? closeMenu() : openMenu()));
    document.addEventListener("click", (e) => {
      const clickInside = menu.contains(e.target) || navToggle.contains(e.target);
      if (!clickInside && isOpen()) closeMenu();
    });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && isOpen()) closeMenu(); });
    menu.addEventListener("click", (e) => {
      if (e.target.tagName === "A" && window.innerWidth < 768) closeMenu();
    });
  }

  /* ========================
     2) Año automático footer
  ======================== */
  const anio = q("#anio");
  if (anio) anio.textContent = new Date().getFullYear();

  /* ========================
     3) Scroll suave interno
  ======================== */
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  qa('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (e) => {
      const id = link.getAttribute("href");
      if (!id || id === "#" || id.length < 2) return;
      const destino = q(id);
      if (!destino) return;
      e.preventDefault();
      destino.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth", block: "start" });
      destino.setAttribute("tabindex", "-1");
      destino.focus({ preventScroll: true });
      setTimeout(() => destino.removeAttribute("tabindex"), 1000);
    });
  });

  /* ========================
     4) Modal de ficha de pez (galería de la galería, no de tienda)
  ======================== */
  const backdrop = q("[data-modal-backdrop]");
  const modal = q(".modal");
  const btnCerrar = modal?.querySelector(".modal-cerrar");
  if (modal && backdrop) {
    const el = (id) => document.getElementById(id);
    const M = {
      titulo: el("modal-titulo"),
      cientifico: el("modal-cientifico"),
      tamanio: el("modal-tamanio"),
      habitat: el("modal-habitat"),
      parametros: el("modal-parametros"),
      alimentacion: el("modal-alimentacion"),
      comportamiento: el("modal-comportamiento"),
      img: el("modal-img"),
    };
    let ultimoFoco = null;

    const abrirModal = (data) => {
      M.titulo.textContent = data.nombre || "";
      M.cientifico.textContent = data.cientifico || "";
      M.tamanio.textContent = data.tamanio || "";
      M.habitat.textContent = data.habitat || "";
      M.parametros.textContent = data.parametros || "";
      M.alimentacion.textContent = data.alimentacion || "";
      M.comportamiento.textContent = data.comportamiento || "";
      M.img.src = data.img || "";
      M.img.alt = data.nombre ? `Imagen de ${data.nombre}` : "Imagen de pez";
      modal.hidden = false; backdrop.hidden = false; document.body.classList.add("no-scroll");
      ultimoFoco = document.activeElement; btnCerrar?.focus();
    };
    const cerrarModal = () => {
      modal.hidden = true; backdrop.hidden = true; document.body.classList.remove("no-scroll");
      if (ultimoFoco) ultimoFoco.focus();
    };
    qa(".btn--info").forEach((btn) => {
      btn.addEventListener("click", () => {
        const d = btn.dataset;
        abrirModal({
          nombre: d.nombre, cientifico: d.cientifico, tamanio: d.tamanio, habitat: d.habitat,
          parametros: d.parametros, alimentacion: d.alimentacion, comportamiento: d.comportamiento, img: d.img,
        });
      });
    });
    backdrop.addEventListener("click", cerrarModal);
    btnCerrar?.addEventListener("click", cerrarModal);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !modal.hidden) cerrarModal(); });
  }

  /* ========================
     5) Carrito (localStorage)
  ======================== */
  function addToCart(item) {
    const cart = getCart();
    const idx = cart.findIndex((p) => p.id === item.id);
    if (idx >= 0) cart[idx].qty += 1;
    else cart.push({ ...item, qty: 1 });
    saveCart(cart);
  }

  qa(".card-prod .btn-add-cart").forEach((btn) => {
    btn.addEventListener("click", () => {
      const card = btn.closest(".card-prod");
      if (!card) return;
      const item = { id: card.dataset.id, nombre: card.dataset.nombre, precio: Number(card.dataset.precio), img: card.dataset.img };
      addToCart(item);
      // feedback
      btn.disabled = true; const original = btn.textContent; btn.textContent = "¡Agregado!";
      setTimeout(() => { btn.disabled = false; btn.textContent = original; }, 900);
    });
  });

  // Render en carrito.html
  const cartList = q("#cart-list");
  if (cartList) {
    const totalEl = q("#cart-total");
    const notesEl = q("#cart-notes");
    const btnVaciar = q("#btn-vaciar");
    const btnWhats = q("#btn-whatsapp");

    const render = () => {
      const cart = getCart();
      cartList.innerHTML = "";
      let total = 0;
      if (!cart.length) { cartList.innerHTML = `<p>No hay productos en el carrito.</p>`; totalEl.textContent = "Q0.00"; return; }
      cart.forEach((p) => {
        const subtotal = p.precio * p.qty; total += subtotal;
        const row = document.createElement("div");
        row.className = "cart-item"; row.dataset.id = p.id;
        row.innerHTML = `
          <img src="${p.img}" alt="${p.nombre}">
          <div class="cart-nombre">${p.nombre}</div>
          <div class="cart-precio">${formatQ(p.precio)}</div>
          <div class="cart-qty">
            <div class="qty">
              <button data-act="dec" title="Disminuir">-</button>
              <input type="text" value="${p.qty}" inputmode="numeric" aria-label="Cantidad">
              <button data-act="inc" title="Aumentar">+</button>
            </div>
          </div>
          <div class="cart-subtotal">${formatQ(subtotal)}</div>
          <div class="cart-del">
            <button class="btn btn--sm btn--outline" data-act="del">Quitar</button>
          </div>`;
        cartList.appendChild(row);
      });
      totalEl.textContent = formatQ(total);
    };

    cartList.addEventListener("click", (e) => {
      const btn = e.target.closest("button"); if (!btn) return;
      const row = e.target.closest(".cart-item"); if (!row) return;
      const id = row.dataset.id; const cart = getCart(); const idx = cart.findIndex((p) => p.id === id); if (idx < 0) return;
      const act = btn.dataset.act;
      if (act === "inc") cart[idx].qty += 1;
      else if (act === "dec") cart[idx].qty = Math.max(1, cart[idx].qty - 1);
      else if (act === "del") cart.splice(idx, 1);
      saveCart(cart); render();
    });
    cartList.addEventListener("input", (e) => {
      const input = e.target; if (input.tagName !== "INPUT") return;
      const row = input.closest(".cart-item"); if (!row) return;
      const id = row.dataset.id; const cart = getCart(); const idx = cart.findIndex((p) => p.id === id); if (idx < 0) return;
      const val = parseInt(input.value.replace(/\D/g, ""), 10); cart[idx].qty = Math.max(1, isNaN(val) ? 1 : val);
      saveCart(cart); render();
    });
    btnVaciar?.addEventListener("click", () => { saveCart([]); render(); });
    btnWhats?.addEventListener("click", () => {
      const cart = getCart(); if (!cart.length) return alert("Tu carrito está vacío.");
      const total = cart.reduce((acc, p) => acc + p.precio * p.qty, 0);
      const lineas = cart.map((p) => `• ${p.qty} x ${p.nombre} @ ${formatQ(p.precio)} = ${formatQ(p.precio * p.qty)}`);
      const notas = (notesEl?.value || "").trim();
      const mensaje = ["🧾 *Pedido Aqua-GT*", ...lineas, `*Total:* ${formatQ(total)}`, notas ? `*Notas:* ${notas}` : ""].filter(Boolean).join("\n");
      window.open("https://wa.me/50242285137?text=" + encodeURIComponent(mensaje), "_blank");
    });
    render();
    window.addEventListener("cart:updated", render);
  }

  

  /* ========================
     6) Contador en el header
  ======================== */
  const cartCountEl = q("#cart-count");
  function updateCartCount() {
    if (!cartCountEl) return;
    const c = getCart().reduce((n, p) => n + (Number(p.qty) || 0), 0);
    cartCountEl.textContent = c; cartCountEl.style.display = c > 0 ? "grid" : "none";
  }
  updateCartCount();
  window.addEventListener("storage", (e) => { if (e.key === CART_KEY) updateCartCount(); });
  window.addEventListener("cart:updated", updateCartCount);

  /* ========================
     8) Filtros + Paginación en Tienda (con estado en URL)
  ======================== */
  const gridTienda = document.querySelector(".grid-tienda");
  if (gridTienda) {
    const cards = Array.from(gridTienda.querySelectorAll(".card-prod"));
    const dataOriginal = cards.map((el, idx) => ({
      el, idx,
      nombre: (el.dataset.nombre || "").toLowerCase(),
      precio: Number(el.dataset.precio || 0),
    }));
    const fBuscar = q("#f-buscar"), fMin = q("#f-min"), fMax = q("#f-max"),
          fOrden = q("#f-orden"), fForm = q("#filtros-tienda"), fPorPag = q("#f-porpagina");
    const resRange = q("#res-range"), resTotal = q("#res-total"), paginacion = q("#paginacion");

    const LS_KEY = "agt_tienda_state";
    const readURL = () => new URLSearchParams(location.search);
    const writeURL = (obj) => {
      const params = new URLSearchParams(location.search);
      ["q","min","max","ord","page","per"].forEach(k => {
        const v = obj[k];
        if (v === undefined || v === null || v === "" || (k!=="q" && Number.isNaN(v))) params.delete(k);
        else params.set(k, String(v));
      });
      history.replaceState(null, "", `${location.pathname}?${params.toString()}`);
      try { localStorage.setItem(LS_KEY, JSON.stringify(obj)); } catch {}
    };
    const readLS = () => { try { return JSON.parse(localStorage.getItem(LS_KEY) || "{}"); } catch { return {}; } };

    const state = { q:"", min:null, max:null, orden:"relevancia", page:1, perPage:Number(fPorPag?.value || 8) };

    (function initStateFromURL(){
      const p = readURL(); const ls = readLS();
      const getNum = (k,def=null) => { const v = p.get(k); if (v===null||v==="") return ls[k]??def; const n=Number(v); return Number.isFinite(n)?n:def; };
      const getStr = (k,def="") => { const v = p.get(k); return (v===null||v==="") ? (ls[k]??def) : v; };
      state.q = (getStr("q","")||"").toLowerCase();
      state.min = getNum("min",null); state.max = getNum("max",null);
      state.orden = getStr("ord","relevancia");
      state.page = getNum("page",1)||1; state.perPage = getNum("per", Number(fPorPag?.value||8)) || Number(fPorPag?.value||8);
      if (fBuscar) fBuscar.value = state.q||""; if (fMin) fMin.value = state.min ?? ""; if (fMax) fMax.value = state.max ?? "";
      if (fOrden) fOrden.value = state.orden; if (fPorPag) fPorPag.value = String(state.perPage);
      writeURL({ q:state.q, min:state.min, max:state.max, ord:state.orden, page:state.page, per:state.perPage });
    })();

    function filtrarYOrdenar() {
      let arr = dataOriginal.filter(d => d.nombre.includes(state.q));
      if (state.min != null) arr = arr.filter(d => d.precio >= state.min);
      if (state.max != null) arr = arr.filter(d => d.precio <= state.max);
      switch (state.orden) {
        case "precio-asc":  arr.sort((a,b)=>a.precio-b.precio); break;
        case "precio-desc": arr.sort((a,b)=>b.precio-a.precio); break;
        case "nombre-asc":  arr.sort((a,b)=>a.nombre.localeCompare(b.nombre)); break;
        case "nombre-desc": arr.sort((a,b)=>b.nombre.localeCompare(a.nombre)); break;
        default:            arr.sort((a,b)=>a.idx-b.idx);
      }
      return arr;
    }
    function renderPaginacion(pages){
      if (!paginacion) return;
      if (pages<=1){ paginacion.hidden=true; paginacion.innerHTML=""; return; }
      paginacion.hidden=false;
      const maxBtns=7; let start=Math.max(1, state.page-Math.floor(maxBtns/2));
      let end=Math.min(pages, start+maxBtns-1); start=Math.max(1, end-maxBtns+1);
      const disFirstPrev = state.page===1 ? "disabled" : "";
      const disNextLast  = state.page===pages ? "disabled" : "";
      const parts=[];
      parts.push(`<button type="button" class="pag-btn" data-act="first" ${disFirstPrev} aria-label="Primera">&laquo;</button>`);
      parts.push(`<button type="button" class="pag-btn" data-act="prev" ${disFirstPrev} aria-label="Anterior">&lsaquo;</button>`);
      for(let p=start;p<=end;p++){ const act=p===state.page?"is-active":""; parts.push(`<button type="button" class="pag-btn ${act}" data-page="${p}" aria-label="Página ${p}">${p}</button>`); }
      parts.push(`<button type="button" class="pag-btn" data-act="next" ${disNextLast} aria-label="Siguiente">&rsaquo;</button>`);
      parts.push(`<button type="button" class="pag-btn" data-act="last" ${disNextLast} aria-label="Última">&raquo;</button>`);
      paginacion.innerHTML = parts.join("");
    }
    function render(){
      const full = filtrarYOrdenar(); const total = full.length;
      const pages = Math.max(1, Math.ceil(total / state.perPage));
      if (state.page>pages) state.page=pages; if (state.page<1) state.page=1;
      const start=(state.page-1)*state.perPage; const end=start+state.perPage; const slice=full.slice(start,end);
      gridTienda.innerHTML=""; slice.forEach(d=>gridTienda.appendChild(d.el));
      if (resTotal) resTotal.textContent = String(total);
      if (resRange) resRange.textContent = total ? `${start+1}-${Math.min(end,total)}` : "0-0";
      renderPaginacion(pages);
      writeURL({ q:state.q||"", min:state.min, max:state.max, ord:state.orden, page:state.page, per:state.perPage });
    }
    fBuscar?.addEventListener("input",(e)=>{ state.q=e.target.value.trim().toLowerCase(); state.page=1; render(); });
    fMin?.addEventListener("input",(e)=>{ const v=e.target.value.trim(); state.min=v===""?null:Number(v); state.page=1; render(); });
    fMax?.addEventListener("input",(e)=>{ const v=e.target.value.trim(); state.max=v===""?null:Number(v); state.page=1; render(); });
    fOrden?.addEventListener("change",(e)=>{ state.orden=e.target.value; state.page=1; render(); });
    fPorPag?.addEventListener("change",(e)=>{ state.perPage=Number(e.target.value)||8; state.page=1; render(); });
    fForm?.addEventListener("reset",()=>{ setTimeout(()=>{ state.q=""; state.min=null; state.max=null; state.orden="relevancia"; state.perPage=Number(fPorPag?.value||8); state.page=1; render(); },0); });
    paginacion?.addEventListener("click",(e)=>{
      const b=e.target.closest("button"); if(!b||b.disabled) return;
      const total=Number(resTotal?.textContent||"0"); const pages=Math.max(1, Math.ceil(total/state.perPage));
      if (b.dataset.page) state.page=Number(b.dataset.page);
      else { const act=b.dataset.act; if(act==="first") state.page=1; else if(act==="prev") state.page=Math.max(1,state.page-1);
             else if(act==="next") state.page=Math.min(pages,state.page+1); else if(act==="last") state.page=pages; }
      render();
    });
    render();
  }

  /* ========================
     9) Modal de producto (detalles + galería + qty) - robusto y con delegación
  ======================== */
  const prodBackdrop = document.getElementById("prod-backdrop");
  const prodModal    = document.getElementById("prod-modal");
  if (prodModal && prodBackdrop) {
    const IMG_MAIN  = document.getElementById("prod-img-main");
    const THUMBS    = document.getElementById("prod-thumbs");
    const TITLE     = document.getElementById("prod-titulo");
    const DESC      = document.getElementById("prod-desc");
    const PRICE     = document.getElementById("prod-price");
    const Q_DEC     = document.getElementById("qty-dec");
    const Q_INC     = document.getElementById("qty-inc");
    const Q_INPUT   = document.getElementById("qty-input");
    const BTN_ADD   = document.getElementById("prod-add");
    const BTN_CLOSE = prodModal.querySelector(".modal-prod-close");

    const FALLBACK_IMG = 'data:image/svg+xml;utf8,\
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="100%" height="100%" fill="#eef3f7"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="20" fill="#90a4ae">Imagen no disponible</text></svg>';
    function safeImg(el, src) { el.src = src || FALLBACK_IMG; el.onerror = () => { el.onerror=null; el.src = FALLBACK_IMG; }; }

    let prodActual = null, ultimoFoco = null;

    function renderThumbs(imgs, currentSrc) {
      THUMBS.innerHTML = "";
      const valid = imgs.filter(Boolean);
      valid.forEach((src, i) => {
        const b = document.createElement("button"); b.type = "button";
        b.setAttribute("aria-current", src === currentSrc ? "true" : "false");
        const im = document.createElement("img"); im.alt = `Vista ${i+1}`; safeImg(im, src);
        b.appendChild(im);
        b.addEventListener("click", () => {
          safeImg(IMG_MAIN, src); IMG_MAIN.alt = TITLE.textContent || "Imagen del producto";
          [...THUMBS.children].forEach(ch => ch.setAttribute("aria-current","false"));
          b.setAttribute("aria-current","true");
        });
        THUMBS.appendChild(b);
      });
      THUMBS.style.display = valid.length > 1 ? "" : (valid.length === 0 ? "none" : "");
    }

    function abrirProdModal(card) {
      const d = card.dataset;
      const fallbackDesc = card.querySelector(".detalle")?.textContent?.trim() || "";
      const firstSrc = d.img || card.querySelector("img")?.getAttribute("src") || "";
      const imgs = [firstSrc, d.g2, d.g3].filter(Boolean);

      prodActual = { id: d.id, nombre: d.nombre, precio: Number(d.precio || 0), img: firstSrc };

      TITLE.textContent = d.nombre || "";
      DESC.textContent  = d.desc || fallbackDesc || "";
      PRICE.textContent = formatQ(Number(d.precio || 0));
      Q_INPUT.value     = "1";

      safeImg(IMG_MAIN, firstSrc);
      IMG_MAIN.alt = d.nombre ? `Imagen de ${d.nombre}` : "Imagen del producto";
      renderThumbs(imgs, firstSrc);

      prodModal.hidden = false; prodBackdrop.hidden = false; document.body.classList.add("no-scroll");
      ultimoFoco = document.activeElement; BTN_ADD?.focus();
    }
    function cerrarProdModal() {
      prodModal.hidden = true; prodBackdrop.hidden = true; document.body.classList.remove("no-scroll");
      if (ultimoFoco) ultimoFoco.focus();
    }

    // *** Delegación global: SIEMPRE funciona aunque reordenes/pagines ***
    document.addEventListener("click", (e) => {
      const btn = e.target.closest(".btn-detalles");
      if (!btn) return;
      const card = btn.closest(".card-prod");
      if (card) abrirProdModal(card);
    });

    Q_DEC?.addEventListener("click", () => {
      const v = Math.max(1, (parseInt(Q_INPUT.value.replace(/\D/g,""),10) || 1) - 1); Q_INPUT.value = String(v);
    });
    Q_INC?.addEventListener("click", () => {
      const v = Math.max(1, (parseInt(Q_INPUT.value.replace(/\D/g,""),10) || 1) + 1); Q_INPUT.value = String(v);
    });
    Q_INPUT?.addEventListener("input", () => {
      const v = Math.max(1, parseInt(Q_INPUT.value.replace(/\D/g,""),10) || 1); Q_INPUT.value = String(v);
    });

    BTN_ADD?.addEventListener("click", () => {
      if (!prodActual) return;
      const qty = Math.max(1, parseInt(Q_INPUT.value,10) || 1);
      const cart = getCart();
      const idx = cart.findIndex(p => p.id === prodActual.id);
      if (idx >= 0) cart[idx].qty += qty; else cart.push({ ...prodActual, qty });
      saveCart(cart);
      const original = BTN_ADD.textContent; BTN_ADD.disabled = true; BTN_ADD.textContent = "¡Agregado!";
      setTimeout(() => { BTN_ADD.disabled = false; BTN_ADD.textContent = original; }, 900);
    });

    prodBackdrop?.addEventListener("click", cerrarProdModal);
    prodModal.querySelector(".modal-prod-close")?.addEventListener("click", cerrarProdModal);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !prodModal.hidden) cerrarProdModal(); });
  }
});

const CARD_PLACEHOLDER = 'data:image/svg+xml;utf8,\
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600">\
<rect width="100%" height="100%" fill="#eef3f7"/><text x="50%" y="50%" dominant-baseline="middle" \
text-anchor="middle" font-family="Arial" font-size="18" fill="#90a4ae">Imagen no disponible</text></svg>';

document.querySelectorAll('.card-prod > img').forEach(img => {
  img.addEventListener('error', () => { img.onerror = null; img.src = CARD_PLACEHOLDER; });
});


/* ===== Contacto: Enviar por WhatsApp ===== */
(function setupContactForm(){
  const form = document.getElementById('contact-form');
  if (!form) return;

  const st = document.getElementById('c-status');
  const nameEl = document.getElementById('c-name');
  const waEl   = document.getElementById('c-wa');
  const mailEl = document.getElementById('c-email');
  const msgEl  = document.getElementById('c-msg');

  const WAPP_NUMBER = '50242285137'; // <- cambia aquí si hace falta

  function setStatus(txt, ok=false){
    if (!st) return;
    st.textContent = txt || '';
    st.style.color = ok ? '#0a6c55' : '#0e607c';
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = (nameEl.value || '').trim();
    const wa   = (waEl.value   || '').trim();
    const em   = (mailEl.value || '').trim();
    const msg  = (msgEl.value  || '').trim();

    if (!name) { setStatus('Por favor ingresa tu nombre.'); nameEl.focus(); return; }
    if (!wa && !em) { setStatus('Ingresa WhatsApp (8 dígitos) o correo.'); waEl.focus(); return; }
    if (wa && !/^\d{8}$/.test(wa)) { setStatus('WhatsApp debe tener 8 dígitos (Guatemala).'); waEl.focus(); return; }
    if (em && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) { setStatus('Correo no válido.'); mailEl.focus(); return; }
    if (!msg) { setStatus('Escribe tu mensaje.'); msgEl.focus(); return; }

    const lineas = [
      '📮 *Contacto desde Aqua-GT*',
      `*Nombre:* ${name}`,
      wa ? `*WhatsApp:* +502 ${wa}` : '',
      em ? `*Correo:* ${em}` : '',
      '',
      `*Mensaje:* ${msg}`
    ].filter(Boolean).join('\n');

    const url = 'https://wa.me/' + WAPP_NUMBER + '?text=' + encodeURIComponent(lineas);

    setStatus('Abriendo WhatsApp…', true);
    window.open(url, '_blank');

    // (Opcional) limpiar después de abrir
    form.reset();
    setTimeout(() => setStatus('¡Mensaje preparado en WhatsApp!'), 500);
  });

  // Limpiar estado al escribir
  ['input','change'].forEach(ev => {
    form.addEventListener(ev, () => setStatus(''));
  });
})();

// HEADER fijo: sincroniza la altura real con la variable CSS
(function(){
  const header = document.querySelector('header[role="banner"]');
  if (!header) return;

  const setHeaderHeight = () => {
    const h = header.offsetHeight;
    document.documentElement.style.setProperty('--header-height', h + 'px');
  };

  const onScroll = () => {
    header.classList.toggle('is-scrolled', window.scrollY > 10);
  };

  // Inicializa y escucha cambios
  window.addEventListener('load', () => { setHeaderHeight(); onScroll(); });
  window.addEventListener('resize', setHeaderHeight);
  window.addEventListener('scroll', onScroll, { passive: true });
})();


(function(){
  const modal    = document.getElementById('prod-modal');
  const backdrop = document.getElementById('prod-backdrop');
  if(!modal || !backdrop) return;

  const mainImg  = modal.querySelector('#prod-img-main');
  const thumbsEl = modal.querySelector('#prod-thumbs');
  const titleEl  = modal.querySelector('#prod-titulo');
  const priceEl  = modal.querySelector('#prod-price');
  const descEl   = modal.querySelector('#prod-desc');
  const closeBtn = modal.querySelector('.modal-prod-close');

  function lockScroll(lock){ document.documentElement.classList.toggle('no-scroll', lock); }
  function show(){ modal.hidden = false; backdrop.hidden = false; lockScroll(true); }
  function hide(){ modal.hidden = true;  backdrop.hidden = true;  lockScroll(false); }

  // Rellena modal desde la tarjeta
  function populateFromCard(card){
    const ds = card.dataset;

    titleEl.textContent = ds.nombre || card.querySelector('.titulo')?.textContent || 'Producto';
    priceEl.textContent = 'Q' + Number(ds.precio || 0).toFixed(2);

    // Descripción: usa data-desc o arma lista con dataset extendido
    descEl.innerHTML = ds.desc ? ds.desc : buildDesc(ds);

    // Imágenes
    const imgs = [ds.img, ds.g2, ds.g3].filter(Boolean);
    mainImg.src = imgs[0] || '';
    mainImg.alt = ds.nombre || '';

    thumbsEl.innerHTML = '';
    imgs.forEach((src,i)=>{
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'thumb';
      const im = document.createElement('img');
      im.src = src; im.alt = 'Vista ' + (i+1); im.loading = 'lazy';
      btn.appendChild(im);
      btn.addEventListener('click', ()=>{ mainImg.src = src; });
      thumbsEl.appendChild(btn);
    });
  }

function buildDesc(ds){
  const rows = [];

  // ===== Peces (si existen estos campos) =====
  if(ds.vida)          rows.push(`<li><strong>Vida:</strong> ${ds.vida}</li>`);
  if(ds.temp && !ds.tipo) rows.push(`<li><strong>Temperatura:</strong> ${ds.temp}</li>`);
  if(ds.ph)            rows.push(`<li><strong>pH:</strong> ${ds.ph}</li>`);
  if(ds.alimentacion)  rows.push(`<li><strong>Alimentación:</strong> ${ds.alimentacion}</li>`);
  if(ds.repro)         rows.push(`<li><strong>Reproducción:</strong> ${ds.repro}</li>`);
  if(ds.compat)        rows.push(`<li><strong>Compatibilidad:</strong> ${ds.compat}</li>`);

  // ===== Plantas (cuando data-tipo="planta") =====
  if(ds.tipo === 'planta'){
    if(ds.ilum)        rows.push(`<li><strong>Iluminación:</strong> ${ds.ilum}</li>`);
    if(ds.co2)         rows.push(`<li><strong>CO₂:</strong> ${ds.co2}</li>`);
    if(ds.crec)        rows.push(`<li><strong>Crecimiento:</strong> ${ds.crec}</li>`);
    if(ds.pos)         rows.push(`<li><strong>Posición:</strong> ${ds.pos}</li>`);
    if(ds.dificultad)  rows.push(`<li><strong>Dificultad:</strong> ${ds.dificultad}</li>`);
    if(ds.temp)        rows.push(`<li><strong>Temperatura:</strong> ${ds.temp}</li>`);
    if(ds.ph)          rows.push(`<li><strong>pH:</strong> ${ds.ph}</li>`);
    if(ds.prop)        rows.push(`<li><strong>Propagación:</strong> ${ds.prop}</li>`);
  }

  return rows.length
    ? `<ul class="desc-ul" style="padding-left:1rem;line-height:1.5;margin:.5rem 0 0">${rows.join('')}</ul>`
    : (ds.desc || '');
}


  // Delegación para abrir desde cualquier .btn-detalles
  document.addEventListener('click', (ev)=>{
    const btn = ev.target.closest('.btn-detalles');
    if(btn){
      const card = btn.closest('.card-prod');
      if(card){ populateFromCard(card); show(); }
    }
  });

  // Cerrar: botón, fondo, tecla ESC
  closeBtn?.addEventListener('click', hide);
  backdrop.addEventListener('click', hide);
  document.addEventListener('keydown', (e)=>{
    if(e.key === 'Escape' && !modal.hidden) hide();
  });
})();
// ================= Modal de producto reutilizable (Tienda/Plantas/Index) =================
(() => {
  const backdrop = document.getElementById('prod-backdrop');
  const modal    = document.getElementById('prod-modal');
  const imgMain  = document.getElementById('prod-img-main');
  const thumbs   = document.getElementById('prod-thumbs');

  if (!backdrop || !modal || !imgMain || !thumbs) {
    // La página no tiene el modal de producto; no inicializamos.
    return;
  }

  const titleEl  = document.getElementById('prod-titulo');
  const priceEl  = document.getElementById('prod-price');
  const descEl   = document.getElementById('prod-desc');

  function money(q) {
    if (!q && q !== 0) return '';
    const num = Number(q);
    return Number.isFinite(num) ? `Q${num.toFixed(2)}` : String(q);
  }

  function openModal({ nombre, precio, desc, imgs }) {
    titleEl.textContent = nombre || 'Producto';
    priceEl.textContent = precio ? (String(precio).includes('Q') ? precio : money(precio)) : '';
    descEl.textContent  = desc || '';

    // Galería
    thumbs.innerHTML = '';
    const sources = (imgs && imgs.length ? imgs : []).filter(Boolean);
    imgMain.src = sources[0] || '';
    imgMain.alt = nombre || '';

    sources.forEach((src, i) => {
      const b = document.createElement('button');
      const im = document.createElement('img');
      im.src = src;
      im.alt = `${nombre || 'Imagen'} ${i + 1}`;
      b.appendChild(im);
      b.addEventListener('click', () => { imgMain.src = src; });
      thumbs.appendChild(b);
    });

    // Mostrar
    backdrop.hidden = false;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    backdrop.hidden = true;
    modal.hidden = true;
    document.body.style.overflow = '';
  }

  // Cerrar: fondo, botón X y ESC
  backdrop.addEventListener('click', closeModal);
  modal.querySelector('.modal-prod-close')?.addEventListener('click', closeModal);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.hidden) closeModal();
  });

  // Delegación global para cualquier botón de "Ver detalles"
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('.btn-detalles, [data-action="detalles"], .btn--info');
    if (!trigger) return;

    const card = trigger.closest('.card-prod, .card-plant, [data-id]');
    if (!card) return;

    const nombre = card.dataset.nombre || card.querySelector('.titulo')?.textContent?.trim();
    // Si el precio viene escrito (Q10.00) lo usamos tal cual; si viene solo número, lo formateamos.
    const precioRaw = card.dataset.precio || card.querySelector('.precio')?.textContent?.trim();
    const precio = /^\s*Q/i.test(precioRaw || '') ? precioRaw : (precioRaw || '');

    const desc   = card.dataset.desc || card.querySelector('.detalle')?.textContent?.trim();
    const imgs   = [card.dataset.img, card.dataset.g2, card.dataset.g3].filter(Boolean);

    openModal({ nombre, precio, desc, imgs });
  });
})();
