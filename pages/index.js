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
        <meta name="description" content="Новини з Telegram каналу Телекритик" />
        <meta name="google-site-verification" content="KaPiLAMdtFMCzwsHOF36LmdEgvaR9sLf50Cm_h3muKA" />
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
                {(post.photo_url || post.photo) && (
                  <div className={styles.cardImage}>
                    <img src={post.photo_url || post.photo} alt="" />
                  </div>
                )}
                <div className={styles.cardBody}>
                  <time className={styles.cardDate}>
                    {post.source === "manual"
                      ? new Date(post.created_at + '+00:00').toLocaleString("uk-UA", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Kyiv" })
                      : post.dateStr}
                  </time>
                  <p className={styles.cardText}>{post.text.length > 200 ? post.text.substring(0, 200) + "..." : post.text}</p>
                  {post.text.length > 200 && post.source === "manual" && (
                    <a href={`/post/${post.id}`} className={styles.cardLink}>Читати далі</a>
                  )}
                  {post.text.length > 200 && post.source === "telegram" && (
                    <a href={"https://t.me/telekritik/" + post.id} target="_blank" rel="noopener noreferrer" className={styles.cardLink}>Читати в Telegram</a>
                  )}
                  {post.link && (
                    <a href={post.link} target="_blank" rel="noopener noreferrer" className={styles.cardLink}>
                      {post.link_label || "Читати більше"}
                    </a>
                  )}
                </div>
              </article>
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
  let posts = [];
  try {
    const { data } = await supabase.from("posts").select("*").order("created_at", { ascending: false }).limit(50);
    posts = data || [];
  } catch(e) {}

  let tgPosts = [];
  try {
    const { data } = await supabase.from("tg_posts").select("*").order("created_at", { ascending: false }).limit(50);
    tgPosts = (data || []).map(p => ({
      id: p.telegram_id,
      text: p.text,
      photo: p.photo_url,
      dateStr: new Date(p.created_at).toLocaleString("uk-UA", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Kyiv" }),
      date: new Date(p.created_at).getTime() / 1000,
      source: "telegram",
    }));
  } catch(e) {}

  return { props: { posts, tgPosts } };
}
