import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const update = req.body;
  const msg = update?.channel_post;
  if (!msg) return res.status(200).json({ ok: true });
  const text = msg.text || msg.caption || "";
  if (!text) return res.status(200).json({ ok: true });
  const TOKEN = process.env.BOT_TOKEN;
  let photo_url = null;
  if (msg.photo?.length > 0) {
    try {
      const fileId = msg.photo[msg.photo.length - 1].file_id;
      const f = await fetch(`https://api.telegram.org/bot${TOKEN}/getFile?file_id=${fileId}`);
      const fd = await f.json();
      if (fd.ok) photo_url = `https://api.telegram.org/file/bot${TOKEN}/${fd.result.file_path}`;
    } catch {}
  }
  const telegram_id = msg.message_id;
  const created_at = new Date(msg.date * 1000).toISOString();
  const { data: existing } = await supabase.from("tg_posts").select("id").eq("telegram_id", telegram_id).single();
  if (!existing) {
    await supabase.from("tg_posts").insert([{ telegram_id, text, photo_url, created_at, link: `https://t.me/telekritik/${telegram_id}` }]);
  }
  return res.status(200).json({ ok: true });
}
