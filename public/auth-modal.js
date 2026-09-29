(function () {
  "use strict";

  var backdrop  = document.getElementById("authBackdrop");
  var modal     = document.getElementById("authModal");
  var openBtn   = document.getElementById("openAuthModal");
  var closeBtn  = document.getElementById("authClose");
  var indicator = modal && modal.querySelector(".auth-tab-indicator");

  /* ─── Open / Close ─── */
  function openModal(tab) {
    if (!backdrop || !modal) return;
    backdrop.classList.add("auth-backdrop-visible");
    modal.classList.remove("auth-modal-exit");
    modal.classList.add("auth-modal-visible");
    document.body.style.overflow = "hidden";
    switchTab(tab || "login", false);
    setTimeout(function () {
      var first = modal.querySelector(".auth-form.active input");
      if (first) first.focus();
    }, 380);
  }

  function closeModal() {
    if (!modal || !backdrop) return;
    modal.classList.remove("auth-modal-visible");
    modal.classList.add("auth-modal-exit");
    setTimeout(function () {
      backdrop.classList.remove("auth-backdrop-visible");
      modal.classList.remove("auth-modal-exit");
      document.body.style.overflow = "";
    }, 350);
  }

  if (openBtn)  openBtn.addEventListener("click", function () { openModal("login"); });
  if (closeBtn) closeBtn.addEventListener("click", closeModal);
  if (backdrop) backdrop.addEventListener("click", function (e) {
    if (e.target === backdrop) closeModal();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && backdrop && backdrop.classList.contains("auth-backdrop-visible")) closeModal();
  });

  /* ─── Tab switching ─── */
  function switchTab(name, animate) {
    if (!modal) return;
    if (animate === undefined) animate = true;
    var tabs  = modal.querySelectorAll(".auth-tab[data-tab]");
    var forms = modal.querySelectorAll(".auth-form");

    tabs.forEach(function (t)  { t.classList.toggle("active", t.dataset.tab === name); });
    forms.forEach(function (f) {
      if (f.dataset.form === name) {
        f.classList.add("active");
        if (animate) {
          f.style.animation = "none";
          void f.offsetHeight;
          f.style.animation = "authFormIn 0.42s cubic-bezier(0.34,1.56,0.64,1) forwards";
        }
      } else {
        f.classList.remove("active");
        f.style.animation = "";
      }
    });
    moveIndicator(name);
    modal.querySelectorAll(".auth-status").forEach(function (s) {
      s.textContent = ""; s.className = "auth-status";
    });
  }

  function moveIndicator(name) {
    var t = modal && modal.querySelector(".auth-tab[data-tab='" + name + "']");
    if (!t || !indicator) return;
    indicator.style.left  = t.offsetLeft + "px";
    indicator.style.width = t.offsetWidth + "px";
  }

  if (modal) {
    modal.querySelectorAll(".auth-tab[data-tab]").forEach(function (t) {
      t.addEventListener("click", function () { switchTab(t.dataset.tab); });
    });
    modal.querySelectorAll(".auth-switch-btn").forEach(function (b) {
      b.addEventListener("click", function () { switchTab(b.dataset.tab); });
    });
  }
  window.addEventListener("resize", function () {
    var a = modal && modal.querySelector(".auth-tab.active");
    if (a) moveIndicator(a.dataset.tab);
  });

  /* ─── SVG eye toggle ─── */
  if (modal) modal.addEventListener("click", function (e) {
    var eye = e.target.closest(".auth-eye");
    if (!eye) return;
    var inp     = document.getElementById(eye.dataset.target);
    var showSvg = eye.querySelector(".eye-show");
    var hideSvg = eye.querySelector(".eye-hide");
    if (!inp) return;
    if (inp.type === "password") {
      inp.type = "text";
      if (showSvg) showSvg.style.display = "none";
      if (hideSvg) hideSvg.style.display = "";
    } else {
      inp.type = "password";
      if (showSvg) showSvg.style.display = "";
      if (hideSvg) hideSvg.style.display = "none";
    }
  });

  /* ─── Password strength ─── */
  var regPw  = document.getElementById("regPassword");
  var pwFill = document.getElementById("pwFill");
  var pwLbl  = document.getElementById("pwLabel");
  var pwWrap = document.getElementById("pwStrength");

  function calcStrength(pw) {
    var s = 0;
    if (pw.length >= 8)                                            s++;
    if (/[A-Z]/.test(pw))                                         s++;
    if (/[a-z]/.test(pw))                                         s++;
    if (/[0-9]/.test(pw))                                         s++;
    if (/[!@#$%^&*()\-_=+\[\]{};':"\\|,.<>/?]/.test(pw))         s++;
    return s;
  }

  if (regPw) regPw.addEventListener("input", function () {
    var pw = regPw.value;
    if (!pw) { if (pwWrap) pwWrap.style.display = "none"; return; }
    if (pwWrap) pwWrap.style.display = "flex";
    var s    = calcStrength(pw);
    var cols = ["#e5e7eb","#ef4444","#ef4444","#f59e0b","#22c55e","#16a34a"];
    var lbls = ["","Weak","Weak","Fair","Good","Strong"];
    if (pwFill) { pwFill.style.width = ((s/5)*100) + "%"; pwFill.style.background = cols[s]; }
    if (pwLbl)  { pwLbl.textContent = lbls[s]; pwLbl.style.color = cols[s]; }
  });

  /* ─── Helpers ─── */
  function setStatus(id, msg, type) {
    var el = document.getElementById(id);
    if (!el) return;
    el.textContent = msg;
    el.className   = "auth-status " + type;
  }
  function setLoading(btnId, on) {
    var b = document.getElementById(btnId);
    if (!b) return;
    b.classList.toggle("loading", on);
    b.disabled = on;
  }

  /* ─── Login submit ─── */
  var loginForm = document.getElementById("loginForm");
  if (loginForm) loginForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    var email    = loginForm.querySelector("[name='email']").value.trim();
    var password = loginForm.querySelector("[name='password']").value;
    if (!email || !password) { setStatus("loginStatus","Please fill in all fields.","error"); return; }
    if (!email.includes("@")) { setStatus("loginStatus","Enter a valid email address.","error"); return; }
    setLoading("loginSubmit", true);
    setStatus("loginStatus","Signing in…","info");
    try {
      var res  = await fetch("/api/login",{ method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({email:email,password:password}) });
      var data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      setStatus("loginStatus","Login successful! Redirecting…","success");
      setTimeout(function(){ closeModal(); window.location.href="/index.html"; },1400);
    } catch(err) { setStatus("loginStatus",err.message,"error"); }
    finally { setLoading("loginSubmit",false); }
  });

  /* ─── Register submit ─── */
  var registerForm = document.getElementById("registerForm");
  if (registerForm) registerForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    var fullName        = registerForm.querySelector("[name='fullName']").value.trim();
    var email           = registerForm.querySelector("[name='email']").value.trim();
    var phone           = registerForm.querySelector("[name='phone']").value.trim();
    var password        = registerForm.querySelector("[name='password']").value;
    var confirmPassword = registerForm.querySelector("[name='confirmPassword']").value;
    if (!fullName||!email||!phone||!password||!confirmPassword){ setStatus("registerStatus","Please fill in all fields.","error"); return; }
    if (!email.includes("@")){ setStatus("registerStatus","Enter a valid email.","error"); return; }
    if (phone.replace(/\D/g,"").length < 10){ setStatus("registerStatus","Phone must be at least 10 digits.","error"); return; }
    if (calcStrength(password) < 3){ setStatus("registerStatus","Password is too weak.","error"); return; }
    if (password !== confirmPassword){ setStatus("registerStatus","Passwords do not match.","error"); return; }
    setLoading("registerSubmit",true);
    setStatus("registerStatus","Creating account…","info");
    try {
      var res  = await fetch("/api/register",{ method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({fullName:fullName,email:email,phone:phone,password:password}) });
      var data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");
      setStatus("registerStatus","Account created! Please sign in.","success");
      setTimeout(function(){ switchTab("login"); },2000);
    } catch(err) { setStatus("registerStatus",err.message,"error"); }
    finally { setLoading("registerSubmit",false); }
  });

  /* ─── Admin submit ─── */
  var adminForm = document.getElementById("adminForm");
  if (adminForm) adminForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    var username = adminForm.querySelector("[name='username']").value.trim();
    var password = adminForm.querySelector("[name='password']").value;
    if (!username||!password){ setStatus("adminStatus","Please fill in all fields.","error"); return; }
    setLoading("adminSubmit",true);
    setStatus("adminStatus","Verifying credentials…","info");
    try {
      var res  = await fetch("/api/login",{ method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({username:username,password:password}) });
      var data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      setStatus("adminStatus","Login successful! Redirecting to Admin…","success");
      setTimeout(function(){ window.location.href="/admin.html"; },1400);
    } catch(err) { setStatus("adminStatus",err.message,"error"); }
    finally { setLoading("adminSubmit",false); }
  });

  /* ─── Init ─── */
  requestAnimationFrame(function(){ moveIndicator("login"); });

})();
