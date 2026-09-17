export type Theme = "light" | "dark";

export const THEME_KEY = "reflex:theme";
export const THEME_EVENT = "reflex:theme-change";

/**
 * Inline script for <head>: applies the stored or system theme before first
 * paint so there is no flash. Plain module so the server layout can import it.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
  THEME_KEY,
)});if(t!=="light"&&t!=="dark"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme="light"}})();`;
