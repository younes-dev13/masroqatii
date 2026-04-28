import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  where,
  getDocs,
  serverTimestamp,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

/*
  مهم جدًا:
  استبدل القيم تحت بقيم مشروعك من Firebase.
  بدون هذا الاستبدال لن يعمل الاتصال بقاعدة البيانات.
*/
const firebaseConfig = {
  apiKey: "PUT_YOUR_API_KEY_HERE",
  authDomain: "PUT_YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "PUT_YOUR_PROJECT_ID",
  storageBucket: "PUT_YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "PUT_YOUR_MESSAGING_SENDER_ID",
  appId: "PUT_YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUser = null;
let reports = [];

const $ = (id) => document.getElementById(id);

const pages = document.querySelectorAll(".page");
const navLinks = document.querySelectorAll(".nav-links a");

function goTo(hash) {
  const pageId = (hash || "#home").replace("#", "");
  pages.forEach(p => p.classList.remove("active"));
  const target = $(pageId) || $("home");
  target.classList.add("active");
}
window.addEventListener("hashchange", () => goTo(location.hash));
goTo(location.hash);

function toast(message) {
  const el = $("toast");
  el.textContent = message;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 2600);
}

function normalizeSerial(value) {
  return String(value || "").trim().toUpperCase().replace(/\s+/g, "");
}

function typeIcon(type) {
  return { phone: "📱", car: "🚗", bike: "🚲", laptop: "💻", other: "📦" }[type] || "📦";
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

$("loginBtn").addEventListener("click", async () => {
  try {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
    toast("تم تسجيل الدخول");
  } catch (error) {
    console.error(error);
    toast("تعذر تسجيل الدخول. تأكد من تفعيل Google في Firebase.");
  }
});

$("logoutBtn").addEventListener("click", async () => {
  await signOut(auth);
  toast("تم تسجيل الخروج");
});

onAuthStateChanged(auth, (user) => {
  currentUser = user;
  $("userName").textContent = user ? (user.displayName || user.email) : "زائر";
  $("loginBtn").classList.toggle("hidden", !!user);
  $("logoutBtn").classList.toggle("hidden", !user);
  renderAll();
});

const reportsQuery = query(collection(db, "reports"), orderBy("createdAt", "desc"));

onSnapshot(reportsQuery, (snapshot) => {
  reports = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  renderAll();
}, (error) => {
  console.error(error);
  toast("خطأ في قراءة قاعدة البيانات. راجع Firebase Rules.");
});

$("reportForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!currentUser) {
    toast("سجل الدخول أولًا لإضافة بلاغ");
    return;
  }

  const serial = normalizeSerial($("serial").value);
  if (serial.length < 4) {
    toast("الرقم التسلسلي قصير جدًا");
    return;
  }

  const duplicateQuery = query(collection(db, "reports"), where("serialNormalized", "==", serial));
  const duplicate = await getDocs(duplicateQuery);

  if (!duplicate.empty) {
    toast("هذا الرقم موجود مسبقًا في بلاغ آخر");
    return;
  }

  const item = {
    type: $("itemType").value,
    title: $("title").value.trim(),
    serial: $("serial").value.trim(),
    serialNormalized: serial,
    city: $("city").value.trim(),
    lostDate: $("lostDate").value,
    imageUrl: $("imageUrl").value.trim(),
    description: $("description").value.trim(),
    ownerUid: currentUser.uid,
    ownerName: currentUser.displayName || currentUser.email || "مستخدم",
    createdAt: serverTimestamp()
  };

  try {
    await addDoc(collection(db, "reports"), item);
    $("reportForm").reset();
    toast("تم نشر البلاغ بنجاح");
    location.hash = "#home";
  } catch (error) {
    console.error(error);
    toast("حدث خطأ أثناء النشر");
  }
});

$("searchBtn").addEventListener("click", searchReport);
$("searchInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") searchReport();
});

async function searchReport() {
  const serial = normalizeSerial($("searchInput").value);
  const box = $("searchResult");

  if (!serial) {
    box.className = "result show danger";
    box.innerHTML = "اكتب الرقم التسلسلي أولًا.";
    return;
  }

  const q = query(collection(db, "reports"), where("serialNormalized", "==", serial));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    box.className = "result show success";
    box.innerHTML = "✅ لا توجد بلاغات مطابقة لهذا الرقم في قاعدة البيانات الحالية.";
    return;
  }

  const item = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
  box.className = "result show danger";
  box.innerHTML = `
    ⚠️ تم العثور على بلاغ مطابق: <strong>${escapeHtml(item.title)}</strong>
    <br>
    <button class="btn small" data-open="${item.id}" style="margin-top:10px">عرض التفاصيل</button>
  `;
  box.querySelector("[data-open]").addEventListener("click", () => openDetails(item.id));
}

$("filterInput").addEventListener("input", renderAll);

function renderAll() {
  renderStats();
  renderGrid("recentGrid", reports.slice(0, 6));
  renderGrid("reportsGrid", filteredReports());
}

function filteredReports() {
  const text = ($("filterInput")?.value || "").toLowerCase().trim();
  if (!text) return reports;
  return reports.filter(r =>
    String(r.title || "").toLowerCase().includes(text) ||
    String(r.city || "").toLowerCase().includes(text) ||
    String(r.serial || "").toLowerCase().includes(text) ||
    String(r.description || "").toLowerCase().includes(text)
  );
}

function renderStats() {
  $("totalReports").textContent = reports.length;
  $("myReports").textContent = currentUser ? reports.filter(r => r.ownerUid === currentUser.uid).length : 0;
  $("citiesCount").textContent = new Set(reports.map(r => r.city).filter(Boolean)).size;
}

function renderGrid(containerId, data) {
  const container = $(containerId);
  if (!container) return;

  if (!data.length) {
    container.innerHTML = `<div class="glass-card" style="grid-column:1/-1;text-align:center;color:var(--muted)">لا توجد بلاغات بعد.</div>`;
    return;
  }

  container.innerHTML = data.map(item => cardHtml(item)).join("");
  container.querySelectorAll("[data-open]").forEach(btn => {
    btn.addEventListener("click", () => openDetails(btn.dataset.open));
  });
}

function cardHtml(item) {
  const image = item.imageUrl
    ? `<img src="${escapeHtml(item.imageUrl)}" alt="${escapeHtml(item.title)}" onerror="this.outerHTML='${typeIcon(item.type)}'">`
    : typeIcon(item.type);

  return `
    <article class="card" data-open="${item.id}">
      <div class="card-img">${image}</div>
      <div class="card-body">
        <h3>${escapeHtml(item.title)}</h3>
        <div class="meta">${escapeHtml(item.city)} • ${escapeHtml(item.lostDate || "")}</div>
        <div class="meta">الرقم: ${escapeHtml(item.serial)}</div>
        <span class="tag">⚠️ مبلغ عنه</span>
      </div>
    </article>
  `;
}

function openDetails(id) {
  const item = reports.find(r => r.id === id);
  if (!item) return;

  $("modalTitle").textContent = item.title || "تفاصيل البلاغ";

  const canDelete = currentUser && currentUser.uid === item.ownerUid;

  $("modalBody").innerHTML = `
    <div class="card-img" style="height:240px;border-radius:18px;margin-bottom:16px">
      ${item.imageUrl ? `<img src="${escapeHtml(item.imageUrl)}" alt="${escapeHtml(item.title)}">` : typeIcon(item.type)}
    </div>
    <p><strong>الحالة:</strong> <span class="tag">⚠️ بلاغ مستخدم</span></p>
    <p><strong>النوع:</strong> ${escapeHtml(item.type)}</p>
    <p><strong>الرقم:</strong> ${escapeHtml(item.serial)}</p>
    <p><strong>المدينة:</strong> ${escapeHtml(item.city)}</p>
    <p><strong>التاريخ:</strong> ${escapeHtml(item.lostDate || "")}</p>
    <p><strong>الناشر:</strong> ${escapeHtml(item.ownerName || "مستخدم")}</p>
    <p><strong>الوصف:</strong><br>${escapeHtml(item.description)}</p>
    <div class="notice">هذه البيانات بلاغ مستخدم فقط ولا تعتبر إثباتًا قانونيًا.</div>
    ${canDelete ? `<button id="deleteBtn" class="btn" style="background:var(--danger);margin-top:16px">حذف بلاغي</button>` : ""}
  `;

  $("detailsDialog").showModal();

  const deleteBtn = $("deleteBtn");
  if (deleteBtn) {
    deleteBtn.addEventListener("click", async () => {
      await deleteDoc(doc(db, "reports", id));
      $("detailsDialog").close();
      toast("تم حذف البلاغ");
    });
  }
}

$("closeModal").addEventListener("click", () => $("detailsDialog").close());

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js").catch(() => {});
}
