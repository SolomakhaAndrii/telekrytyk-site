import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import Head from "next/head";
import styles from "../styles/Admin.module.css";

export default function Admin() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [posts, setPosts] = useState([]);
  const [text, setText] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [link, setLink] = useState("");
  const [linkLabel, setLinkLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const ADMIN_LOGIN = process.env.NEXT_PUBLIC_ADMIN_LOGIN || "admin";
  const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "admin123";

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("admin_auth") === "true") {
      setLoggedIn(true);
    }
  }, []);

  useEffect(() => {
    if (loggedIn) loadPosts();
  }, [loggedIn]);

  async function loadPosts() {
    const { data } = await supabase.from("posts").select("*").order("created_at", { ascending: false });
    setPosts(data || []);
  }

  function handleLogin(e) {
    e.preventDefault();
    if (login === ADMIN_LOGIN && password === ADMIN_PASSWORD) {
      setLoggedIn(true);
      localStorage.setItem("admin_auth", "true");
      setLoginError("");
    } else {
      setLoginError("Невірний логін або пароль");
    }
  }

  function handleLogout() {
    setLoggedIn(false);
    localStorage.removeItem("admin_auth");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("posts").insert([{
      text: text.trim(),
      photo_url: photoUrl.trim() || null,
      link: link.trim() || null,
      link_label: linkLabel.trim() || null,
    }]);
    if (error) {
      setMessage("Помилка: " + error.message);
    } else {
      setMessage("Пост опубліковано! ✓");
      setText("");
      setPhotoUrl("");
      setLink("");
      setLinkLabel("");
      loadPosts();
      setTimeout(() => setMessage(""), 3000);
    }
    setSaving(false);
  }

  async function handleDelete(id) {
    if (!confirm("Видалити пост?")) return;
    await supabase.from("posts").delete().eq("id", id);
    loadPosts();
  }

  if (!loggedIn) {
    return (
      <>
        <Head><title>Адмін — Телекритик</title></Head>
        <div className={styles.loginPage}>
          <form onSubmit={handleLogin} className={styles.loginForm}>
            <h1>Вхід</h1>
            <input type="text" placeholder="Логін" value={login} onChange={e => setLogin(e.target.value)} required />
            <input type="password" placeholder="Пароль" value={password} onChange={e => setPassword(e.target.value)} required />
            {loginError && <p className={styles.error}>{loginError}</p>}
            <button type="submit">Увійти</button>
          </form>
        </div>
      </>
    );
  }

  return (
    <>
      <Head><title>Адмін — Телекритик</title></Head>
      <div className={styles.page}>
        <header className={styles.header}>
          <h1>Адмін панель</h1>
          <div className={styles.headerRight}>
            <a href="/" target="_blank">← Сайт</a>
            <button onClick={handleLogout} className={styles.logoutBtn}>Вийти</button>
          </div>
        </header>

        <div className={styles.content}>
          <section className={styles.formSection}>
            <h2>Новий пост</h2>
            <form onSubmit={handleSubmit} className={styles.form}>
              <textarea
                placeholder="Текст посту..."
                value={text}
                onChange={e => setText(e.target.value)}
                rows={5}
                required
              />
              <input
                type="url"
                placeholder="URL фото (необов'язково)"
                value={photoUrl}
                onChange={e => setPhotoUrl(e.target.value)}
              />
              <input
                type="url"
                placeholder="Посилання (необов'язково)"
                value={link}
                onChange={e => setLink(e.target.value)}
              />
              <input
                type="text"
                placeholder="Назва посилання (напр. 'Читати більше')"
                value={linkLabel}
                onChange={e => setLinkLabel(e.target.value)}
              />
              {message && <p className={styles.success}>{message}</p>}
              <button type="submit" disabled={saving}>
                {saving ? "Публікую..." : "Опублікувати"}
              </button>
            </form>
          </section>

          <section className={styles.postsSection}>
            <h2>Опубліковані пости ({posts.length})</h2>
            {posts.map(post => (
              <div key={post.id} className={styles.postCard}>
                {post.photo_url && <img src={post.photo_url} alt="" className={styles.postThumb} />}
                <div className={styles.postInfo}>
                  <p className={styles.postText}>{post.text.substring(0, 150)}{post.text.length > 150 ? "..." : ""}</p>
                  <p className={styles.postDate}>{new Date(post.created_at).toLocaleDateString("uk-UA", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Kyiv" })}</p>
                  {post.link && <a href={post.link} target="_blank" rel="noopener noreferrer" className={styles.postLink}>{post.link_label || post.link}</a>}
                </div>
                <button onClick={() => handleDelete(post.id)} className={styles.deleteBtn}>✕</button>
              </div>
            ))}
          </section>
        </div>
      </div>
    </>
  );
}
