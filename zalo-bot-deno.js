/* ═══════════════════════════════════════════════════════════════
   GOSHIP123 — ZALO BOT (Deno Deploy, miễn phí)
   Bộ não của Bot goship123: tự trả lời khách + đẩy đơn về Zalo của mày.

   ── CÁCH CÀI TRÊN DENO DEPLOY (5 bước, 0đ) ──────────────────────
   1. Vào https://dash.deno.com → bấm "Sign in with GitHub"
      (đăng nhập bằng tài khoản GitHub mày đang xài cho web)
   2. Bấm "New Playground" → xoá hết code mẫu → DÁN NGUYÊN FILE NÀY
      → bấm "Save & Deploy" (góc trên bên phải)
   3. Trong playground, bấm biểu tượng ⚙️ Settings (hoặc tab
      "Environment Variables") → thêm 3 biến:
      • BOT_TOKEN      = token bot Zalo của mày (ĐỪNG gửi cho ai)
      • WEBHOOK_SECRET = chuỗi bí mật tự đặt (VD: goship123-kin-abc789)
      • OWNER_CHAT_ID  = chat_id Zalo của mày (chưa có thì để trống,
        lát nhắn /id cho bot để lấy rồi quay lại điền)
      → Save xong bấm Deploy lại
   4. Copy URL của playground (dạng https://ten-gi-do.deno.dev)
      → vào bot.zaloplatforms.com → bot của mày → Thiết lập chung:
      • Webhook URL  = <URL đó>/webhook
      • Secret Token = đúng chuỗi WEBHOOK_SECRET ở bước 3 → Lưu
   5. Mở file index.html, tìm CONFIG.ZALO_WORKER_URL và dán URL
      deno.dev mới vào (thay URL workers.dev cũ nếu có) → up lại GitHub.
      Nhắn thử "sân bay" cho bot — nó trả lời là xong! 🎉

   ── LƯU Ý KỸ THUẬT ──────────────────────────────────────────────
   Zalo Bot API mới ra, cấu trúc giống Telegram. Nếu API base hoặc
   tên trường khác docs chính thức (bot.zaloplatforms.com → Docs),
   chỉ cần sửa 2 chỗ đánh dấu 🔧 bên dưới. Code parse tin nhắn được
   viết "phòng thủ" — không nhận diện được thì vẫn chuyển tiếp
   nguyên văn cho mày, không mất đơn.
   ═══════════════════════════════════════════════════════════════ */

/* 🔧 (1) API base — đối chiếu docs nếu gửi tin không chạy */
const API_BASE = "https://bot-api.zaloplatforms.com";

const WEB_URL   = "https://vaultadidas-collab.github.io/goship123-hubphuquoc/";
const HOTLINE   = "0775 218 017";

/* Đọc biến môi trường trên Deno Deploy */
const ENV = {
  BOT_TOKEN:      Deno.env.get("BOT_TOKEN")      || "",
  WEBHOOK_SECRET: Deno.env.get("WEBHOOK_SECRET") || "",
  OWNER_CHAT_ID:  Deno.env.get("OWNER_CHAT_ID")  || "",
  ADMIN_KEY:      Deno.env.get("ADMIN_KEY")      || "", /* 🔑 mật khẩu trang quản lý — TỰ ĐẶT */
};

/* 🗄️ Database miễn phí của Deno — lưu tài xế + đơn hàng */
const kv = await Deno.openKv();
const jres = (obj, cors, code=200) => new Response(JSON.stringify(obj), { status: code, headers: { ...cors, "Content-Type": "application/json" } });
const getDrv = async (phone, pin) => {
  if(!phone || !pin) return null;
  const r = await kv.get(["drv", String(phone)]);
  const d = r.value;
  return (d && d.pin === String(pin) && d.active !== false) ? { ...d, phone: String(phone) } : null;
};
const listOrders = async () => {
  const out = [];
  for await (const e of kv.list({ prefix: ["ord"] })) out.push(e.value);
  out.sort((a,b)=> b.t - a.t);
  return out.slice(0, 300);
};

Deno.serve(async (request) => {
    const url = new URL(request.url);

    /* ---------- CORS cho web gọi vào ---------- */
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };
    if (request.method === "OPTIONS") return new Response(null, { headers: cors });

    /* ---------- Gửi tin qua Zalo Bot API ---------- */
    const send = async (chatId, text) => {
      if (!chatId) return;
      try {
        await fetch(`${API_BASE}/bot${ENV.BOT_TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          /* 🔧 (2) nếu docs dùng tên trường khác (vd user_id) thì sửa tại đây */
          body: JSON.stringify({ chat_id: chatId, text }),
        });
      } catch (e) {}
    };

    /* ═══════ /order — WEB Goship123 bắn đơn vào đây ═══════ */
    if (url.pathname === "/order" && request.method === "POST") {
      let body = {};
      try { body = await request.json(); } catch (e) {}
      const text = body.text || "";
      /* 💾 nếu đơn có meta (mã, giá, cut) → lưu vào hệ tài xế */
      if (body.meta && body.meta.code && body.meta.fare) {
        const m = body.meta;
        const pay = Math.round(m.fare * (m.cut || 0.85) / 1000) * 1000; /* tiền TÀI XẾ nhận */
        await kv.set(["ord", m.code], {
          code: m.code, type: m.type || "Đơn", detail: (m.detail || "").slice(0, 400),
          fare: m.fare, pay, profit: m.fare - pay,
          status: "open", drv: null, t: Date.now(),
        });
      }
      if (text && ENV.OWNER_CHAT_ID) await send(ENV.OWNER_CHAT_ID, "🔔 ĐƠN MỚI TỪ WEB!\n\n" + text.slice(0, 3500));
      return jres({ ok: true }, cors);
    }

    /* ═══════ 🛵 API CỔNG TÀI XẾ ═══════ */
    if (url.pathname === "/api/login" && request.method === "POST") {
      let b={}; try { b = await request.json(); } catch(e){}
      const raw = (await kv.get(["drv", String(b.phone||"")])).value;
      if (raw && raw.pin === String(b.pin||"") && raw.pending) return jres({ ok:false, err:"Hồ sơ của bạn ĐANG CHỜ DUYỆT — admin sẽ gọi/nhắn xác nhận sớm nhé!" }, cors, 401);
      const d = await getDrv(b.phone, b.pin);
      return d ? jres({ ok:true, name:d.name }, cors) : jres({ ok:false, err:"Sai số ĐT hoặc mã PIN, hoặc tài khoản bị khoá" }, cors, 401);
    }

    /* ═══════ 📝 TỰ ĐĂNG KÝ TÀI XẾ (freelancer) — chờ admin duyệt ═══════ */
    if (url.pathname === "/api/register" && request.method === "POST") {
      let b={}; try { b = await request.json(); } catch(e){}
      const phone = String(b.phone||"").trim();
      if (!b.name || !phone || !b.pin || !b.vehicle) return jres({ ok:false, err:"Điền đủ tên, SĐT, loại xe và mã PIN" }, cors);
      const exist = (await kv.get(["drv", phone])).value;
      if (exist) return jres({ ok:false, err: exist.pending ? "SĐT này đã đăng ký, đang chờ duyệt" : "SĐT này đã là tài xế — đăng nhập luôn nhé" }, cors);
      await kv.set(["drv", phone], { name: String(b.name).slice(0,50), pin: String(b.pin), vehicle: String(b.vehicle).slice(0,30), plate: String(b.plate||"").slice(0,20), active: false, pending: true, reg: Date.now() });
      if (ENV.OWNER_CHAT_ID) await send(ENV.OWNER_CHAT_ID, `📝 TÀI XẾ MỚI ĐĂNG KÝ — CHỜ DUYỆT\n👤 ${b.name}\n📞 ${phone}\n🛵 ${b.vehicle}${b.plate?` · Biển số ${b.plate}`:""}\n→ Vào trang Quản Lý bấm DUYỆT là họ chạy được!`);
      return jres({ ok:true }, cors);
    }

    if (url.pathname === "/api/driver/orders") {
      const d = await getDrv(url.searchParams.get("phone"), url.searchParams.get("pin"));
      if (!d) return jres({ ok:false }, cors, 401);
      const all = await listOrders();
      const open = all.filter(o=>o.status==="open").map(o=>({ code:o.code, type:o.type, detail:o.detail, fare:o.fare, pay:o.pay, t:o.t }));
      const mine = all.filter(o=>o.drv && o.drv.phone===d.phone && o.status!=="cancel").map(o=>({ code:o.code, type:o.type, detail:o.detail, fare:o.fare, pay:o.pay, status:o.status, t:o.t }));
      return jres({ ok:true, open, mine }, cors);
    }

    if (url.pathname === "/api/accept" && request.method === "POST") {
      let b={}; try { b = await request.json(); } catch(e){}
      const d = await getDrv(b.phone, b.pin);
      if (!d) return jres({ ok:false }, cors, 401);
      const r = await kv.get(["ord", String(b.code)]);
      const o = r.value;
      if (!o || o.status !== "open") return jres({ ok:false, err:"Đơn đã có người nhận hoặc không tồn tại" }, cors);
      o.status = "taken"; o.drv = { phone: d.phone, name: d.name }; o.takenAt = Date.now();
      const ok = await kv.atomic().check(r).set(["ord", o.code], o).commit(); /* chống 2 tài xế giành 1 đơn */
      if (!ok.ok) return jres({ ok:false, err:"Đơn vừa bị người khác nhận trước" }, cors);
      if (ENV.OWNER_CHAT_ID) await send(ENV.OWNER_CHAT_ID, `🤝 TÀI XẾ NHẬN ĐƠN ${o.code}\n👤 ${d.name} (${d.phone})\n${o.type} — ${o.detail}\n💰 Thu khách ${o.fare.toLocaleString("vi")}đ | Tài xế ${o.pay.toLocaleString("vi")}đ | LỜI ${o.profit.toLocaleString("vi")}đ`);
      return jres({ ok:true }, cors);
    }

    if (url.pathname === "/api/done" && request.method === "POST") {
      let b={}; try { b = await request.json(); } catch(e){}
      const d = await getDrv(b.phone, b.pin);
      if (!d) return jres({ ok:false }, cors, 401);
      const r = await kv.get(["ord", String(b.code)]);
      const o = r.value;
      if (!o || !o.drv || o.drv.phone !== d.phone) return jres({ ok:false }, cors);
      o.status = "done"; o.doneAt = Date.now();
      await kv.set(["ord", o.code], o);
      if (ENV.OWNER_CHAT_ID) await send(ENV.OWNER_CHAT_ID, `✅ HOÀN TẤT ${o.code} — ${d.name}\n💰 Lời của mày: ${o.profit.toLocaleString("vi")}đ (thu về từ tài xế)`);
      return jres({ ok:true }, cors);
    }

    /* ═══════ 👑 API TRANG QUẢN LÝ (cần ADMIN_KEY) ═══════ */
    const isAdmin = (k) => ENV.ADMIN_KEY && k === ENV.ADMIN_KEY;

    if (url.pathname === "/api/admin/all") {
      if (!isAdmin(url.searchParams.get("key"))) return jres({ ok:false }, cors, 401);
      const drivers = [];
      for await (const e of kv.list({ prefix: ["drv"] })) drivers.push({ phone: e.key[1], ...e.value, pin: undefined });
      const orders = await listOrders();
      const today = new Date(); today.setHours(0,0,0,0);
      const profitToday = orders.filter(o=>o.status==="done" && o.t>=+today).reduce((a,o)=>a+o.profit,0);
      const profitAll = orders.filter(o=>o.status==="done").reduce((a,o)=>a+o.profit,0);
      return jres({ ok:true, drivers, orders, profitToday, profitAll }, cors);
    }

    if (url.pathname === "/api/admin/driver" && request.method === "POST") {
      let b={}; try { b = await request.json(); } catch(e){}
      if (!isAdmin(b.key)) return jres({ ok:false }, cors, 401);
      if (b.del) { await kv.delete(["drv", String(b.phone)]); return jres({ ok:true }, cors); }
      /* duyệt hồ sơ / khóa / mở — giữ nguyên PIN tài xế tự đặt */
      if (b.approve !== undefined || b.toggle !== undefined) {
        const cur = (await kv.get(["drv", String(b.phone)])).value;
        if (!cur) return jres({ ok:false }, cors);
        if (b.approve === true)  { cur.pending = false; cur.active = true; }
        if (b.approve === false) { await kv.delete(["drv", String(b.phone)]); return jres({ ok:true }, cors); }
        if (b.toggle !== undefined) cur.active = !!b.toggle;
        await kv.set(["drv", String(b.phone)], cur);
        return jres({ ok:true }, cors);
      }
      if (!b.phone || !b.pin || !b.name) return jres({ ok:false, err:"Thiếu SĐT / PIN / tên" }, cors);
      await kv.set(["drv", String(b.phone)], { name: b.name, pin: String(b.pin), vehicle: b.vehicle||"", plate: b.plate||"", active: b.active !== false, pending: false });
      return jres({ ok:true }, cors);
    }

    if (url.pathname === "/api/admin/order" && request.method === "POST") {
      let b={}; try { b = await request.json(); } catch(e){}
      if (!isAdmin(b.key)) return jres({ ok:false }, cors, 401);
      const r = await kv.get(["ord", String(b.code)]);
      if (!r.value) return jres({ ok:false }, cors);
      const o = r.value;
      if (b.action === "cancel") o.status = "cancel";
      if (b.action === "done") { o.status = "done"; o.doneAt = Date.now(); }
      if (b.action === "reopen") { o.status = "open"; o.drv = null; }
      await kv.set(["ord", o.code], o);
      return jres({ ok:true }, cors);
    }

    /* ═══════ /webhook — ZALO gọi vào khi khách nhắn bot ═══════ */
    if (url.pathname === "/webhook" && request.method === "POST") {
      /* xác thực secret (Zalo gửi kèm header) */
      const gotSecret =
        request.headers.get("x-bot-api-secret-token") ||
        request.headers.get("x-zalo-bot-api-secret-token") || "";
      if (ENV.WEBHOOK_SECRET && gotSecret !== ENV.WEBHOOK_SECRET)
        return new Response("forbidden", { status: 403 });

      let u = {};
      try { u = await request.json(); } catch (e) {}

      /* bóc tin nhắn kiểu "phòng thủ" — chấp mọi biến thể cấu trúc */
      const msg    = u.message || u.event?.message || u;
      const chatId = msg?.chat?.id ?? msg?.from?.id ?? u?.sender?.id ?? u?.user_id ?? null;
      const name   = msg?.from?.display_name || msg?.from?.first_name || msg?.sender_name || "Khách";
      const text   = (msg?.text || msg?.message?.text || "").trim();

      const reply = (t) => send(chatId, t);
      const low = text.toLowerCase();

      if (text === "/id") {
        await reply(`🆔 chat_id của bạn: ${chatId}\n(Chủ shop: dán số này vào biến OWNER_CHAT_ID trên Cloudflare)`);
      } else if (/(ô tô|o to|oto|4 chỗ|4 cho|7 chỗ|7 cho|sân bay|san bay|taxi|thuê xe|thue xe|đưa đón|dua don|xe hơi|xe hoi)/.test(low)) {
        await reply(`🚗 Ô TÔ & ĐƯA ĐÓN SÂN BAY — GOSHIP123\n• 4 chỗ: 35.000đ/2km đầu + 13.000đ/km\n• 7 chỗ: 45.000đ/2km đầu + 16.000đ/km\n• Đón/trả sân bay: phụ phí 40.000đ — giá CHỐT TRƯỚC, không phát sinh\n🏝️ THUÊ XE DU LỊCH (có tài xế + xăng):\n• 4 chỗ: 150k/giờ · 550k nửa ngày · 900k/ngày\n• 7 chỗ: 200k/giờ · 750k nửa ngày · 1.2tr/ngày\nĐặt ngay: ${WEB_URL} hoặc nhắn giờ đón + điểm đón vào đây, shop chốt liền!`);
        if (ENV.OWNER_CHAT_ID) await send(ENV.OWNER_CHAT_ID, `🚗 KHÁCH HỎI Ô TÔ/SÂN BAY/THUÊ XE (đơn ngon!)\n👤 ${name} (id ${chatId})\n💬 "${text}"\n→ Chốt sớm kẻo khách đi hãng khác!`);
      } else if (/(phí|phi|ship|giá|gia|bao nhiêu|nhiu)/.test(low)) {
        await reply(`💰 BẢNG PHÍ GOSHIP123\n• Đồ ăn: ship nội khu 15.000đ (voucher GIAM5K / FREESHIP)\n• Xe ôm: 13.000đ mở cửa + 5.500đ/km\n• Ô tô 4 chỗ: 35k/2km đầu + 13k/km · 7 chỗ: 45k/2km đầu + 16k/km\n• Đưa đón sân bay: +40k phụ phí, giá chốt trước\n• Thuê xe du lịch có tài xế: từ 150k/giờ\n• Mua hộ: từ 15.000đ theo giá trị hàng\nĐặt ngay: ${WEB_URL}`);
      } else if (/(menu|món|mon|quán|quan|ăn gì|an gi|đói|doi)/.test(low)) {
        await reply(`🍜 45+ quán 4★ trên Google Maps: bún quậy, hải sản Hàm Ninh, pizza, cơm tấm, món Hàn, bánh kem...\nXem menu & đặt tại: ${WEB_URL}\nHoặc nhắn thẳng món + địa chỉ vào đây, shop chốt liền!`);
      } else if (/(đặt|dat don|order|mua|giao|xe ôm|xe om|đặt xe|dat xe)/.test(low)) {
        await reply(`📝 ĐẶT ĐƠN NHANH — nhắn theo mẫu:\n• Món/đồ cần mua (mua được MỌI nơi có trên Google Maps, mart có hoá đơn)\n• Địa chỉ giao + SĐT\nShop xác nhận & báo cọc trong vài phút (7:00–22:00) ✅`);
        if (ENV.OWNER_CHAT_ID) await send(ENV.OWNER_CHAT_ID, `🛎️ KHÁCH MUỐN ĐẶT ĐƠN\n👤 ${name} (id ${chatId})\n💬 "${text}"\n→ Trả lời ngay để chốt!`);
      } else if (/(giờ|gio|mở cửa|mo cua|mấy h|may h)/.test(low)) {
        await reply(`⏰ Goship123 nhận đơn 7:00–22:00 mỗi ngày. Ngoài giờ cứ nhắn, sáng shop rep liền!\n📞 Hotline/Zalo: ${HOTLINE}`);
      } else if (/(cọc|coc|ứng|ung|boom|an toàn|an toan|lừa|lua)/.test(low)) {
        await reply(`🔒 Cọc chống boom đơn, an toàn 2 chiều:\n• Đồ ăn: cọc 30% (tối thiểu 20k), còn lại COD\n• Mua hộ: ứng tiền hàng + phí, hoá đơn chụp gửi kèm\n• QR có MÃ ĐƠN đối chiếu, chủ TK VO QUOC CUONG (MB Bank)\n• Hoàn 100% nếu shop huỷ/không mua được`);
      } else if (text) {
        await reply(`Shop nhận tin của bạn rồi nha! 🙌 Sẽ trả lời sớm nhất (7:00–22:00).\nGấp thì gọi ${HOTLINE} hoặc đặt nhanh tại ${WEB_URL}`);
        if (ENV.OWNER_CHAT_ID) await send(ENV.OWNER_CHAT_ID, `💬 TIN MỚI TỪ KHÁCH\n👤 ${name} (id ${chatId})\n"${text}"`);
      } else if (ENV.OWNER_CHAT_ID) {
        /* không bóc được text → đẩy nguyên cục dữ liệu cho chủ shop, không mất đơn */
        await send(ENV.OWNER_CHAT_ID, "📦 Sự kiện bot chưa nhận diện:\n" + JSON.stringify(u).slice(0, 1500));
      }
      return new Response("ok");
    }

    return new Response("Goship123 Zalo Bot Worker ✅ đang chạy", { headers: cors });
  });