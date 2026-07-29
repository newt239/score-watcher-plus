import { useEffect } from "react";

type TypekitConfig = {
  kitId: string;
  scriptTimeout: number;
  async: boolean;
};

declare global {
  // Typekitのスクリプトが読み込まれるとwindowに生える（グローバル宣言はvarでのみ可能）
  var Typekit: { load: (config: TypekitConfig) => void } | undefined;
}

/** Adobe Typekitのフォントを非同期で読み込む */
const TypekitLoader: React.FC = () => {
  useEffect(() => {
    (function (d: Document) {
      const config: TypekitConfig = {
        kitId: "uel8jnk",
        scriptTimeout: 3000,
        async: true,
      };
      const h = d.documentElement;
      const t = setTimeout(() => {
        h.className = h.className.replace(/\bwf-loading\b/g, "") + " wf-inactive";
      }, config.scriptTimeout);
      const tk = d.createElement("script");

      h.className += "wf-loading";
      tk.src = `https://use.typekit.net/${config.kitId}.js`;
      tk.async = true;
      tk.onload = function () {
        clearTimeout(t);
        try {
          window.Typekit?.load(config);
        } catch (e) {
          console.log(e);
        }
      };
      tk.onerror = function () {
        clearTimeout(t);
      };

      const s = d.getElementsByTagName("script")[0];
      s.parentNode!.insertBefore(tk, s);
    })(document);
  }, []);

  return null;
};

export default TypekitLoader;
