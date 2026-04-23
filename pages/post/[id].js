import Head from "next/head";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import styles from "../../styles/Post.module.css";

export default function PostPage({ post, error }) {
  if (error || !post) {
    return (
      <div className={styles.page}>
        <div className={styles.notFound}>
          <p>Пост не знайдено.</p>
          <Link href="/">← Повернутись на головну</Link>
        </div>
      </div>
    );
  }

  const dateStr = new Date(post.created_at + '+00:00').toLocaleString("uk-UA", {
    day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
    timeZone: "Europe/Kyiv"
  });

  return (
    <>
      <Head>
        <title>{post.text.substring(0, 60)} — Телекритик</title>
        <meta name="description" content={post.text.substring(0, 160)} />
        <meta property="og:title" content={post.text.substring(0, 60)} />
        <meta property="og:description" content={post.text.substring(0, 160)} />
        {post.photo_url && <meta property="og:image" content={post.photo_url} />}
        <meta property="og:url" content={`https://telekritik.media/post/${post.id}`} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&family=Source+Serif+4:ital,wght@0,300;0,400;1,300&display=swap" rel="stylesheet" />
      </Head>

      <div className={styles.page}>
        <header className={styles.header}>
          <Link href="/" className={styles.back}>← Телекритик</Link>
        </header>

        <main className={styles.main}>
          <article className={styles.article}>
            {post.photo_url && (
              <div className={styles.image}>
                <img src={post.photo_url} alt="" />
              </div>
            )}
            <time className={styles.date}>{dateStr}</time>
            <p className={styles.text}>{post.text}</p>
            {post.link && (
              <a href={post.link} target="_blank" rel="noopener noreferrer" className={styles.link}>
                {post.link_label || "Читати більше →"}
              </a>
            )}
          </article>
        </main>

        <footer className={styles.footer}>
          <a href="https://t.me/telekritik" target="_blank" rel="noopener noreferrer">@telekritik</a>
        </footer>
      </div>
    </>
  );
}

export async function getServerSideProps({ params }) {
  const { id } = params;
  try {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .eq("id", id)
      .single();
    if (error || !data) return { props: { post: null, error: true } };
    return { props: { post: data, error: false } };
  } catch {
    return { props: { post: null, error: true } };
  }
}
