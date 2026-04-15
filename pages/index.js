import Head from "next/head";
import styles from "../styles/Home.module.css";

export default function Home({ posts, error }) {
  return (
    <>
      <Head>
        <title>Телекритик — Новини</title>
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
          {error && (
            <div className={styles.error}>
              <p>Помилка: {error}</p>
            </div>
          )}
          {!error && posts.length === 0 && (
            <div className={styles.empty}>
              <p>Постів поки немає.</p>
            </div>
          )}
          <div className={styles.feed}>
            {posts.map((post) => (
              <article key={post.id} className={styles.card}>
                {post.photo && (
                  <div className={styles.cardImage}>
                    <img src={post.photo} alt="" />
                  </div>
                )}
                <div className={styles.cardBody}>
                  <time className={styles.cardDate}>{post.dateStr}</time>
                  <p className={styles.cardText}>{post.text}</p>
                  <a href={`https://t.me/telekritik/${post.id}`} target="_blank" rel="noopener noreferrer" className={styles.cardLink}>
                    Читати в Telegram →
                  </a>
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
  const TOKEN = process.env.BOT_TOKEN;
  if (!TOKEN) return { props: { posts: [], error: "BOT_TOKEN не знайдено" } };
  try {
    const res = await fetch(`https://api.telegram.org/bot${TOKEN}/getUpdates?limit=50`);
    const data = await res.json();
    if (!data.ok) return { props: { posts: [], error: data.description || "Помилка API" } };
    const posts = await Promise.all(
      (data.result || [])
        .filter((u) => u.channel_post && (u.channel_post.text || u.channel_post.caption))
        .map(async (u) => {
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
          return { id: msg.message_id, text: msg.text || msg.caption || "", dateStr, photo };
        })
    );
    posts.reverse();
    return { props: { posts, error: null } };
  } catch (e) {
    return { props: { posts: [], error: e.message } };
  }
}
