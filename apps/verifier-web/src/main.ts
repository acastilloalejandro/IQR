import { parseQrPayload } from "../../../src/qr.js";
import { verifyCredential, canonicalJson } from "../../../src/verify.js";
import "./style.css";

type Detector = new (options?: { formats?: string[] }) => {
  detect(source: HTMLVideoElement): Promise<Array<{ rawValue: string }>>;
};

const app = document.querySelector("#app") as HTMLDivElement;

app.innerHTML = `
  <header class="topbar">
    <a class="brand" href="./" aria-label="IQR inicio">
      <span class="brand-mark">IQR</span>
      <span class="brand-subtitle">VERIFIER</span>
    </a>
    <nav aria-label="Navegación principal">
      <a href="https://github.com/acastilloalejandro/IQR" target="_blank" rel="noreferrer">Código</a>
      <a href="#how-it-works">Cómo funciona</a>
    </nav>
  </header>

  <main class="shell">
    <section class="hero" aria-labelledby="title">
      <p class="eyebrow">VERIFICACIÓN CRIPTOGRÁFICA</p>
      <h1 id="title">Verifica lo que importa.</h1>
      <p class="lead">Comprueba un QR IQR y separa, en segundos, identidad del emisor, firma, integridad del documento, estado y caducidad.</p>
      <div class="hero-actions">
        <button id="camera" class="primary">Escanear QR</button>
        <button id="focus-input" class="secondary">Pegar payload</button>
      </div>
      <div class="trust-strip" aria-label="Capacidades de verificación">
        <span>Firma Ed25519</span><span>SHA-256</span><span>Estado</span><span>Caducidad</span>
      </div>
    </section>

    <section class="verify-panel" aria-labelledby="verify-title">
      <div class="section-heading">
        <div>
          <p class="eyebrow">01 · VERIFICAR</p>
          <h2 id="verify-title">Escanea o introduce el QR.</h2>
        </div>
        <span class="privacy-note">Procesamiento local cuando el payload es offline</span>
      </div>

      <div class="input-area">
        <video id="preview" class="preview hidden" playsinline muted aria-label="Vista previa de cámara"></video>
        <div id="camera-status" class="camera-status" aria-live="polite"></div>
        <label for="input">Payload IQR</label>
        <textarea id="input" spellcheck="false" autocomplete="off" placeholder="iqr1.... o https://.../q/id"></textarea>
        <div class="actions">
          <button id="verify" class="primary">Verificar</button>
          <button id="clear" class="secondary">Limpiar</button>
        </div>
      </div>

      <div id="result" class="hidden" aria-live="polite"></div>
    </section>

    <section id="how-it-works" class="how" aria-labelledby="how-title">
      <div class="section-heading">
        <div>
          <p class="eyebrow">02 · FLUJO</p>
          <h2 id="how-title">Una cadena de confianza, no un adorno.</h2>
        </div>
      </div>
      <div class="steps">
        <article><span>01</span><h3>Identifica</h3><p>Reconoce la credencial, su versión y su emisor.</p></article>
        <article><span>02</span><h3>Comprueba</h3><p>Valida la firma Ed25519 y la integridad SHA-256.</p></article>
        <article><span>03</span><h3>Contrasta</h3><p>Evalúa estado, caducidad, audiencia y nonce cuando existen.</p></article>
        <article><span>04</span><h3>Decide</h3><p>Presenta un resultado estructurado con motivos y avisos.</p></article>
      </div>
    </section>

    <footer>
      <span>IQR · QR como portador, criptografía como raíz de confianza.</span>
      <a href="https://github.com/acastilloalejandro/IQR" target="_blank" rel="noreferrer">Repositorio</a>
    </footer>
  </main>
`;

const input = document.querySelector("#input") as HTMLTextAreaElement;
const result = document.querySelector("#result") as HTMLDivElement;
const preview = document.querySelector("#preview") as HTMLVideoElement;
const cameraStatus = document.querySelector("#camera-status") as HTMLDivElement;
let stream: MediaStream | null = null;
let scanning = false;

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  })[char] as string);
}

function showError(message: string): void {
  result.className = "result-card danger";
  result.innerHTML = "<div class='result-head'><span class='result-icon'>!</span><div><p class='result-kicker'>VERIFICACIÓN</p><h3>No se pudo verificar</h3></div></div><p>" + escapeHtml(message) + "</p>";
}

async function resolveOnline(url: URL) {
  if (url.protocol !== "https:") {
    throw new Error("Los resolvers online deben utilizar HTTPS.");
  }
  const response = await fetch(url, { headers: { accept: "application/json" } });
  if (!response.ok) throw new Error("El resolver devolvió HTTP " + response.status);
  return await response.json();
}

async function verifyInput(): Promise<void> {
  const value = input.value.trim();
  if (!value) {
    input.focus();
    showError("Introduce un payload IQR o escanea un código QR.");
    return;
  }

  const parsed = parseQrPayload(value);
  if (parsed.mode === "online") {
    const credential = await resolveOnline(parsed.url);
    const verification = await verifyCredential(credential, { allowInlinePublicKey: false });
    renderVerification(verification);
    return;
  }

  const verification = await verifyCredential(parsed.credential, { allowInlinePublicKey: true });
  renderVerification(verification);
}

function statusLabel(status: string): string {
  return ({
    verified: "Verificado",
    invalid: "No verificado",
    revoked: "Revocado",
    suspended: "Suspendido",
    expired: "Caducado",
    unknown: "Estado desconocido"
  } as Record<string, string>)[status] ?? status;
}

function renderVerification(verification: Awaited<ReturnType<typeof verifyCredential>>): void {
  const statusClass = verification.status === "verified" ? "ok" : "not-ok";
  const passed = Object.values(verification.checks).filter(Boolean).length;
  const total = Object.keys(verification.checks).length;

  result.className = `result-card ${statusClass}`;
  result.innerHTML =
    "<div class='result-head'>" +
      "<span class='result-icon'>" + (verification.status === "verified" ? "✓" : "!") + "</span>" +
      "<div><p class='result-kicker'>RESULTADO</p><h3>" + escapeHtml(statusLabel(verification.status)) + "</h3><p class='result-meta'>" + escapeHtml(verification.credential.type) + " · v" + escapeHtml(verification.credential.version) + "</p></div>" +
    "</div>" +
    "<div class='score-line'><strong>" + passed + "/" + total + "</strong><span>comprobaciones superadas</span></div>" +
    "<div class='checks'>" +
      Object.entries(verification.checks).map(([key,value]) =>
        "<div class='check " + (value ? "pass" : "fail") + "'><span>" + escapeHtml(key) + "</span><b>" + (value ? "✓" : "✕") + "</b></div>"
      ).join("") +
    "</div>" +
    (verification.reasons.length ? "<div class='message-block'><h4>Motivos</h4><ul>" + verification.reasons.map((x) => "<li>" + escapeHtml(x) + "</li>").join("") + "</ul></div>" : "") +
    (verification.warnings.length ? "<div class='message-block warning'><h4>Avisos</h4><ul>" + verification.warnings.map((x) => "<li>" + escapeHtml(x) + "</li>").join("") + "</ul></div>" : "") +
    "<details><summary>Ver credencial</summary><pre>" + escapeHtml(canonicalJson(verification.credential)) + "</pre></details>";
}

async function stopCamera(): Promise<void> {
  scanning = false;
  stream?.getTracks().forEach((track) => track.stop());
  stream = null;
  preview.classList.add("hidden");
  preview.srcObject = null;
  cameraStatus.textContent = "";
}

async function scanCamera(): Promise<void> {
  const DetectorCtor = (window as Window & { BarcodeDetector?: Detector }).BarcodeDetector;
  if (!DetectorCtor) {
    showError("Este navegador no expone BarcodeDetector. Usa el lector QR del sistema y pega el payload.");
    return;
  }

  await stopCamera();
  stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
  preview.srcObject = stream;
  preview.classList.remove("hidden");
  await preview.play();
  scanning = true;
  cameraStatus.textContent = "Apunta al QR…";
  const detector = new DetectorCtor({ formats: ["qr_code"] });

  const loop = async () => {
    if (!scanning) return;
    try {
      const codes = await detector.detect(preview);
      const value = codes.find((code) => code.rawValue)?.rawValue;
      if (value) {
        input.value = value;
        await stopCamera();
        await verifyInput();
        return;
      }
    } catch {}
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

document.querySelector("#camera")!.addEventListener("click", () => {
  void scanCamera().catch((error) => showError(error instanceof Error ? error.message : String(error)));
});

document.querySelector("#focus-input")!.addEventListener("click", () => {
  input.focus();
  input.scrollIntoView({ behavior: "smooth", block: "center" });
});

document.querySelector("#clear")!.addEventListener("click", () => {
  input.value = "";
  result.className = "hidden";
  result.innerHTML = "";
  void stopCamera();
});

document.querySelector("#verify")!.addEventListener("click", () => {
  void verifyInput().catch((error) => showError(error instanceof Error ? error.message : String(error)));
});
