/* Pousada Capiau — comportamento da página */
(function () {
  "use strict";

  var reduce = false;
  var canHover = window.matchMedia("(hover: hover)").matches;
  var EASE = 0.12; // suavidade: menor = mais "deslizante" (0.06 a 0.2)

  var header = document.getElementById("header");
  var menu = document.getElementById("mobile-menu");
  var toggle = document.getElementById("menu-toggle");

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  // Estrelas
  var star = '<svg class="icon"><use href="#i-star"/></svg>';
  document.querySelectorAll("[data-stars]").forEach(function (el) {
    el.classList.add("stars");
    el.innerHTML = star.repeat(5);
  });

    // ===== WhatsApp: altere só aqui (caixa de dialogo) =====
  var WHATS = {
    numero: "5567992653721",
    mensagem: "Olá, vim pelo site! Gostaria de fazer uma reserva."
  };
  document.querySelectorAll('a[href^="https://wa.me/"]').forEach(function (a) {
    a.href = "https://wa.me/" + WHATS.numero + "?text=" + encodeURIComponent(WHATS.mensagem);
  });
  // ====================================

  // Ano do rodapé
  document.getElementById("year").textContent = new Date().getFullYear();

  // Menu mobile
  function setMenu(open) {
    menu.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", open);
    toggle.innerHTML = '<svg class="icon"><use href="#i-' + (open ? "x" : "menu") + '"/></svg>';
  }
  toggle.addEventListener("click", function () {
    setMenu(!menu.classList.contains("is-open"));
  });
  menu.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", function () { setMenu(false); });
  });

  // Barra de progresso
  var bar = document.createElement("div");
  bar.className = "progress";
  bar.setAttribute("aria-hidden", "true");
  document.body.appendChild(bar);

  // Parallax: speed positivo = fica "atrás", negativo = "na frente"
  var layers = [];
  function addLayer(selector, speed) {
    document.querySelectorAll(selector).forEach(function (el) {
      layers.push({ el: el, speed: speed, top: 0, h: 0 });
    });
  }
  function addOrb(parentSelector, cls, speed) {
    var parent = document.querySelector(parentSelector);
    if (!parent) return;
    var orb = document.createElement("span");
    orb.className = "orb " + cls;
    orb.setAttribute("aria-hidden", "true");
    parent.appendChild(orb);
    layers.push({ el: orb, speed: speed, top: 0, h: 0 });
  }

  addLayer(".hero__bg", 0.2);
  addLayer(".bonito__bg", 0.15);
  addLayer(".float-card", -0.08);
  addLayer(".rooms__img", 0.04);

  addOrb(".hero", "orb--lime", 0.2);
  addOrb(".hero", "orb--teal", -0.12);
  addOrb(".amenities", "orb--lime", 0.12);
  addOrb(".reviews", "orb--teal", -0.12);

  // Direções de entrada
  function mark(selector, cls) {
    document.querySelectorAll(selector).forEach(function (el) { el.classList.add(cls); });
  }
  mark(".about > .reveal:nth-child(1)", "reveal--left");
  mark(".about > .reveal:nth-child(2)", "reveal--right");
  mark(".contact > .reveal:nth-child(1)", "reveal--left");
  mark(".contact > .reveal:nth-child(2)", "reveal--right");
  mark(".rooms__img-wrap", "reveal--left");
  mark(".amenities__grid > .reveal", "reveal--zoom");
  mark(".review", "reveal--zoom");

  // Lista de quartos: cada card se monta sozinho
  var roomsList = document.querySelector(".rooms__list");
  if (roomsList) {
    roomsList.classList.remove("reveal", "reveal--right");
    Array.prototype.forEach.call(roomsList.children, function (c) { c.classList.add("build"); });
  }

  // Títulos palavra por palavra
  document.querySelectorAll(".title, .bonito h2").forEach(function (h) {
    var text = h.textContent.trim();
    var words = text.split(/\s+/);
    h.setAttribute("aria-label", text);
    h.innerHTML = words.map(function (w, i) {
      return '<span class="w" aria-hidden="true" style="--i:' + i + '">' + w + "</span>";
    }).join(" ");
    h.style.setProperty("--n", words.length);
  });

  // Itens que se montam com o scroll
  var items = [];
  document.querySelectorAll(".reveal, .build").forEach(function (el) {
    el.style.transitionDelay = "";
    var staggered = el.parentElement.matches(".amenities__grid, .reviews__grid, .rooms__list");
    var idx = Array.prototype.indexOf.call(el.parentElement.children, el);
    items.push({
      el: el,
      off: staggered ? idx * 50 : 0,
      isReveal: el.classList.contains("reveal"),
      top: 0,
      p: -1
    });
  });

  var heroContent = document.querySelector(".hero__content");
  var heroBg = document.querySelector(".hero__bg");
  var heroSection = document.querySelector(".hero");
  var bonitoBg = document.querySelector(".bonito__bg");
  var bonitoSection = document.querySelector(".bonito");

  var vh = window.innerHeight, vw = window.innerWidth;
  var maxScroll = 1, heroH = vh, bTop = 0, bH = 0;

  // Posição no documento SEM contar transformações (evita o efeito de "tremer")
  function docTop(el) {
    var t = 0;
    while (el) { t += el.offsetTop; el = el.offsetParent; }
    return t;
  }

  function measure() {
    items.forEach(function (it) { it.top = docTop(it.el); });
    layers.forEach(function (l) {
      var pr = l.el.parentElement;
      l.top = docTop(pr);
      l.h = pr.offsetHeight;
    });
    heroH = heroSection ? heroSection.offsetHeight : vh;
    if (bonitoSection) { bTop = docTop(bonitoSection); bH = bonitoSection.offsetHeight; }
    maxScroll = Math.max(document.documentElement.scrollHeight - vh, 1);
  }

  function setP(it, p) {
    if (Math.abs(p - it.p) < 0.002) return;
    it.p = p;
    it.el.style.setProperty("--p", p.toFixed(3));
    if (it.isReveal) it.el.classList.toggle("is-done", p >= 0.999);
  }

  function render(y) {
    bar.style.transform = "scaleX(" + Math.min(y / maxScroll, 1) + ")";

    if (reduce) {
      items.forEach(function (it) { setP(it, 1); });
      return;
    }

    // Montagem (reversível): p sobe ao entrar e desce ao voltar
    for (var k = 0; k < items.length; k++) {
      var it = items[k];
      var p = clamp((vh * 0.92 - (it.top - y) - it.off) / (vh * 0.35), 0, 1);
      p = p * p * (3 - 2 * p);
      setP(it, p);
    }

    // Texto do topo sobe e some
    if (heroContent) {
      var hp = Math.min(y / (vh * 0.8), 1);
      heroContent.style.opacity = (1 - hp).toFixed(3);
      heroContent.style.translate = "0 " + (hp * 40).toFixed(1) + "px";
    }

    // Zoom suave do fundo do topo e da seção Bonito
    if (heroBg) heroBg.style.scale = (1 + clamp(y / heroH, 0, 1) * 0.1).toFixed(3);
    if (bonitoBg) {
      var bt = clamp((vh - (bTop - y)) / (vh + bH), 0, 1);
      bonitoBg.style.scale = (1.15 - bt * 0.1).toFixed(3);
    }

    // Parallax
    for (var i = 0; i < layers.length; i++) {
      var l = layers[i];
      var pt = l.top - y;
      if (pt + l.h < -300 || pt > vh + 300) continue;
      var delta = pt + l.h / 2 - vh / 2;
      l.el.style.translate = "0 " + (-delta * l.speed).toFixed(2) + "px";
    }
  }

  // Rolagem amortecida: o efeito "desliza" até alcançar a posição real
  var cur = window.scrollY, running = false;

  function frame() {
    var target = window.scrollY;
    cur += (target - cur) * EASE;
    if (Math.abs(target - cur) < 0.1) cur = target;
    render(cur);
    if (cur !== target) requestAnimationFrame(frame);
    else running = false;
  }
  function kick() {
    header.classList.toggle("is-scrolled", window.scrollY > 40);
    if (!running) { running = true; requestAnimationFrame(frame); }
  }

  window.addEventListener("scroll", kick, { passive: true });

  // Só refaz as medidas se a tela realmente mudou (ignora a barra do navegador no celular)
  window.addEventListener("resize", function () {
    if (window.innerWidth === vw && Math.abs(window.innerHeight - vh) < 120) return;
    vw = window.innerWidth; vh = window.innerHeight;
    measure(); kick();
  });

  var rt;
  function remeasureLater() {
    clearTimeout(rt);
    rt = setTimeout(function () { measure(); kick(); }, 120);
  }
  if ("ResizeObserver" in window) new ResizeObserver(remeasureLater).observe(document.body);
  window.addEventListener("load", remeasureLater);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(remeasureLater);

  measure();
  render(cur);
  header.classList.toggle("is-scrolled", window.scrollY > 40);

  // Inclinação 3D nos cards dos quartos (só com mouse)
  if (canHover && !reduce) {
    document.querySelectorAll(".room").forEach(function (card) {
      card.addEventListener("mousemove", function (e) {
        var r = card.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5;
        var y = (e.clientY - r.top) / r.height - 0.5;
        card.style.setProperty("--ry", (x * 8).toFixed(2) + "deg");
        card.style.setProperty("--rx", (-y * 8).toFixed(2) + "deg");
      });
      card.addEventListener("mouseleave", function () {
        card.style.setProperty("--rx", "0deg");
        card.style.setProperty("--ry", "0deg");
      });
    });
  }
})();