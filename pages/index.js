import Head from "next/head";
import { supabase } from "../lib/supabase";
import styles from "../styles/Home.module.css";

export default function Home({ posts, tgPosts }) {
  const allPosts = [
    ...posts.map(p => ({ ...p, source: "manual" })),
    ...tgPosts.map(p => ({ ...p, source: "telegram" })),
  ].sort((a, b) => new Date(b.created_at || b.date * 1000) - new Date(a.created_at || a.date * 1000));

  return (
    <>
      <Head>
        <title>Телекритик — Новини</title> 
    <meta name="google-site-verification" content="KaPiLAMdtFMCzwsHOF36LmdEgvaR9sLf50Cm_h3muKA" />
        <meta name="description" content="Новини з Telegram каналу Телекритик" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&family=Source+Serif+4:ital,wght@0,300;0,400;1,300&display=swap" rel="stylesheet" />
      </Head>

      <div className={styles.page}>
        <header className={styles.header}>
          <div className={styles.headerInner}>
            <p className={styles.headerLabel}>Telegram канал</p>
            <h1 className={styles.headerTitle}>Телекритик</h1>
            <p className={styles.headerSub}>Останні публікації каналу</p>
          </div>
        </header>

        <main className={styles.main}>
          {allPosts.length === 0 && (
            <div className={styles.empty}>
              <p>Постів поки немає.</p>
            </div>
          )}
          <div className={styles.feed}>
            {allPosts.map((post, i) => (
              <article key={i} className={styles.card}>
  {post.source === "manual" && (
    <a href={`/post/${post.id}`} className={styles.postTitleLink}>
                {post.photo_url && (
                  <div className={styles.cardImage}>
                    <img src={post.photo_url} alt="" />
                  </div>
                )}
                {post.photo && !post.photo_url && (
                  <div className={styles.cardImage}>
                    <img src={post.photo} alt="" />
                  </div>
                )}
                <div className={styles.cardBody}>
                  <time className={styles.cardDate}>
                    {post.source === "manual"
                      ? new Date(post.created_at).toLocaleDateString("uk-UA", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Kyiv" })
                      : post.dateStr}
                  </time>
                  <p className={styles.cardText}>{post.text}</p>
                  {post.link && (
                    <a href={post.link} target="_blank" rel="noopener noreferrer" className={styles.cardLink}>
                      {post.link_label || "Читати більше →"}
                    </a>
                  )}
                  {post.source === "telegram" && (
                    <a href={`https://t.me/telekritik/${post.id}`} target="_blank" rel="noopener noreferrer" className={styles.cardLink}>
                      Читати в Telegram →
                    </a>
                  )}
                </div>
              </a>)}</article>
            ))}
          </div>
        </main>

        <footer className={styles.footer}>
          <a href="https://t.me/telekritik" target="_blank" rel="noopener noreferrer">@telekritik</a>
        </footer>
      </div>
    </>
  );
}

export async function getServerSideProps() {
  // Manual posts from Supabase
  let posts = [];
  try {
    const { data } = await supabase.from("posts").select("*").order("created_at", { ascending: false }).limit(50);
    posts = data || [];
  } catch {}

  // Telegram posts
  let tgPosts = [];
  const TOKEN = process.env.BOT_TOKEN;
  if (TOKEN) {
    try {
      const res = await fetch(`https://api.telegram.org/bot${TOKEN}/getUpdates?limit=50`);
      const data = await res.json();
      if (data.ok) {
        tgPosts = await Promise.all(
          (data.result || [])
            .filter(u => u.channel_post && (u.channel_post.text || u.channel_post.caption))
            .map(async u => {
              const msg = u.channel_post;
              const dateStr = new Date(msg.date * 1000).toLocaleDateString("uk-UA", {
                day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
              });
              let photo = null;
              if (msg.photo?.length > 0) {
                try {
                  const f = await fetch(`https://api.telegram.org/bot${TOKEN}/getFile?file_id=${msg.photo[msg.photo.length-1].file_id}`);
                  const fd = await f.json();
                  if (fd.ok) photo = `https://api.telegram.org/file/bot${TOKEN}/${fd.result.file_path}`;
                } catch {}
              }
              return { id: msg.message_id, text: msg.text || msg.caption || "", dateStr, date: msg.date, photo };
            })
        );
        tgPosts.reverse();
      }
    } catch {}
  }

  return { props: { posts, tgPosts } };
}
