import { Form, useActionData, useNavigation } from "react-router";
import { useState } from "react";
import ArrowUpRight from "lucide-react/dist/esm/icons/arrow-up-right.js";
import Bot from "lucide-react/dist/esm/icons/bot.js";
import Check from "lucide-react/dist/esm/icons/check.js";
import Copy from "lucide-react/dist/esm/icons/copy.js";
import Download from "lucide-react/dist/esm/icons/download.js";
import ImageIcon from "lucide-react/dist/esm/icons/image.js";
import Menu from "lucide-react/dist/esm/icons/menu.js";
import MessageCircle from "lucide-react/dist/esm/icons/message-circle.js";
import Moon from "lucide-react/dist/esm/icons/moon.js";
import Plus from "lucide-react/dist/esm/icons/plus.js";
import Send from "lucide-react/dist/esm/icons/send.js";
import Sparkles from "lucide-react/dist/esm/icons/sparkles.js";
import WandSparkles from "lucide-react/dist/esm/icons/wand-sparkles.js";
import X from "lucide-react/dist/esm/icons/x.js";
import type { Route } from "./+types/home";

type ActionResult = { mode: "chat" | "image"; prompt: string; response?: string; imageDataUrl?: string; error?: string };

function responseText(result: unknown): string {
  if (typeof result === "string") return result;
  if (result && typeof result === "object" && "response" in result && typeof result.response === "string") return result.response;
  return JSON.stringify(result, null, 2);
}

export async function action({ request, context }: Route.ActionArgs): Promise<ActionResult> {
  const form = await request.formData();
  const mode = String(form.get("mode") ?? "chat") as "chat" | "image";
  const prompt = String(form.get("prompt") ?? "").trim();
  if (!prompt) return { mode, prompt: "", error: "Add a prompt to begin." };
  try {
    if (mode === "image") {
      const result = await context.cloudflare.env.CAMELAI.generateImage(prompt);
      return { mode, prompt, imageDataUrl: result.imageDataUrl ?? result.images?.[0]?.dataUrl, response: result.text ?? undefined };
    }
    const result = await context.cloudflare.env.AI.run("auto", {
      messages: [
        { role: "system", content: "You are Luma, an elegant, thoughtful creative copilot. Be useful, clear, and concise. Use markdown when it improves readability." },
        { role: "user", content: prompt },
      ],
    });
    return { mode, prompt, response: responseText(result) };
  } catch (error) {
    return { mode, prompt, error: error instanceof Error ? error.message : "The studio could not complete that request." };
  }
}

export function meta() {
  return [{ title: "Luma — Creative intelligence" }, { name: "description", content: "A premium AI studio for thinking and making." }];
}

const suggestions = ["Shape a launch strategy", "Write a bold brand manifesto", "Explain quantum computing simply"];

export default function Home() {
  const result = useActionData<typeof action>();
  const navigation = useNavigation();
  const [mode, setMode] = useState<"chat" | "image">("chat");
  const [prompt, setPrompt] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const busy = navigation.state !== "idle";
  const activeMode = result?.mode ?? mode;
  const imageSrc = result?.imageDataUrl;

  return (
    <div className="luma-shell">
      <header className="topbar">
        <a className="brand" href="/"><span className="brand-mark"><Sparkles size={16} /></span><span>LUMA</span></a>
        <nav className="desktop-nav"><a className="active" href="#studio">Studio</a><a href="#gallery">Gallery</a><a href="#about">About</a></nav>
        <div className="top-actions"><button className="icon-button" aria-label="Toggle theme"><Moon size={17} /></button><button className="avatar">K</button><button className="mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">{menuOpen ? <X size={19} /> : <Menu size={19} />}</button></div>
      </header>
      {menuOpen && <div className="mobile-nav"><a href="#studio">Studio</a><a href="#gallery">Gallery</a><a href="#about">About</a></div>}

      <main id="studio" className="studio-grid">
        <aside className="sidebar">
          <div className="side-label">Workspace</div>
          <button className="new-thread"><Plus size={16} /> New creation <span>⌘ K</span></button>
          <div className="side-label recent-label">Recent</div>
          <div className="history-item selected"><MessageCircle size={15} /><span>Untitled conversation</span><span className="dot" /></div>
          <div className="history-item"><ImageIcon size={15} /><span>Neon city study</span></div>
          <div className="side-footer"><div className="plan"><div className="plan-icon"><WandSparkles size={15} /></div><div><strong>Creator plan</strong><small>1,240 credits left</small></div></div><div className="credit-bar"><i /></div><a href="#upgrade">Upgrade workspace <ArrowUpRight size={13} /></a></div>
        </aside>

        <section className="main-panel">
          <div className="eyebrow"><span className="status-dot" /> Luma intelligence <span className="pill">BETA</span></div>
          <h1>Make something<br /><em>remarkable.</em></h1>
          <p className="hero-copy">Your private space for expansive thinking and beautiful making.</p>

          <div className="mode-switcher"><button className={mode === "chat" ? "mode active" : "mode"} onClick={() => setMode("chat")}><Bot size={17} /> Converse</button><button className={mode === "image" ? "mode active" : "mode"} onClick={() => setMode("image")}><ImageIcon size={17} /> Create images</button></div>

          <div className="result-area">
            {result && !result.error && activeMode === "chat" && <div className="conversation"><div className="user-bubble">{result.prompt}</div><div className="ai-answer"><div className="answer-head"><span className="mini-mark"><Sparkles size={13} /></span><span>Luma</span><button aria-label="Copy response"><Copy size={14} /></button></div><div className="answer-body">{result.response}</div></div></div>}
            {result && !result.error && activeMode === "image" && imageSrc && <div className="image-result"><img src={imageSrc} alt={result.prompt} /><div className="image-caption"><span>{result.prompt}</span><a href={imageSrc} download="luma-creation.png"><Download size={15} /> Download</a></div></div>}
            {result?.error && <div className="error-card">{result.error}</div>}
          </div>

          <Form method="post" className="composer" onSubmit={() => setPrompt("")}>
            <input type="hidden" name="mode" value={mode} />
            <textarea name="prompt" value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder={mode === "chat" ? "Ask anything. Think out loud..." : "Describe the image you want to create..."} rows={3} required />
            <div className="composer-bottom"><span className="composer-hint"><Sparkles size={13} /> {mode === "chat" ? "Powered by Workers AI" : "Luma image engine"}</span><button className="send-button" type="submit" disabled={busy}>{busy ? "Creating…" : mode === "chat" ? "Send" : "Generate"}<Send size={15} /></button></div>
          </Form>
          {mode === "chat" && <div className="suggestions">{suggestions.map((item) => <button key={item} onClick={() => setPrompt(item)}>{item}<ArrowUpRight size={13} /></button>)}</div>}
          <div className="fine-print">Luma can make mistakes. Check important information.</div>
        </section>

        <aside className="insight-card"><div className="insight-top"><span className="insight-kicker">A NEW KIND OF TOOL</span><span className="sparkle-orb"><Sparkles size={16} /></span></div><h2>Ideas have<br /><em>momentum.</em></h2><p>Move from a blank page to a clear point of view in seconds.</p><div className="insight-line" /><div className="insight-stat"><strong>01</strong><span>Think without limits</span></div><div className="insight-stat"><strong>02</strong><span>Make it tangible</span></div><div className="insight-stat"><strong>03</strong><span>Go further, faster</span></div></aside>
      </main>
      <footer><span>© 2025 Luma Studio</span><span>Built for the curious <Sparkles size={12} /></span></footer>
    </div>
  );
}
