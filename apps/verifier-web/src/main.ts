import { parseQrPayload } from "../../../src/qr.js";
import { verifyCredential, canonicalJson } from "../../../src/verify.js";
import "./style.css";

type Detector = new (options?: { formats?: string[] }) => {
  detect(source: HTMLVideoElement): Promise<Array<{ rawValue: string }>>;
};

const app = document.querySelector("#app") as HTMLDivElement;
app.innerHTML =
  '<section class="shell">' +
  '<div class="eyebrow">IQR · VERIFIER</div>' +
  '<h1>Verificar documento</h1>' +
  '<p class="lead">Pega un payload QR IQR o usa la cámara. Se separan firma, emisor, integridad, estado y caducidad.</p>' +
  '<div class="scan-row"><button id="camera">Escanear QR</button><span id="camera-status"></span></div>' +
  '<video id="preview" class="preview hidden" playsinline muted></video>' +
  '<textarea id="input" placeholder="iqr1.... o https://.../q/id"></textarea>' +
  '<div class="actions"><button id="verify">Verificar</button><button id="clear">Limpiar</button></div>' +
  '<div id="result" class="hidden"></div>' +
  '</section>';

const input = document.querySelector("#input") as HTMLTextAreaElement;
const result = document.querySelector("#result") as HTMLDivElement;
const preview = document.querySelector("#preview") as HTMLVideoElement;
const cameraStatus = document.querySelector("#camera-status") as HTMLSpanElement;
let stream: MediaStream | null = null;
let scanning = false;

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  })[char] as string);
}

function showError(message: string): void {
  result.className = "card danger";
  result.innerHTML = "<strong>Error</strong><p>" + escapeHtml(message) + "</p>";
}

async function resolveOnline(url: URL) {
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("Solo se permiten payloads HTTP(S).");
  }
  const response = await fetch(url, { headers: { accept: "application/json" } });
  if (!response.ok) throw new Error("El resolver devolvió HTTP " + response.status);
  return await response.json();
}

async function verifyInput(): Promise<void> {
  const parsed = parseQrPayload(input.value.trim());
  if (parsed.mode === "online") {
    const credential = await resolveOnline(parsed.url);
    const verification = await verifyCredential(credential, { allowInlinePublicKey: false });
    renderVerification(verification);
    return;
  }
  const verification = await verifyCredential(parsed.credential, { allowInlinePublicKey: true });
  renderVerification(verification);
}

function renderVerification(verification: Awaited<ReturnType<typeof verifyCredential>>): void {
  result.className = "card";
  result.innerHTML =
    "<div class='status'>" + escapeHtml(verification.status.toUpperCase()) + "</div>" +
    "<div class='meta'>" + escapeHtml(verification.credential.type) + " · v" + escapeHtml(verification.credential.version) + "</div>" +
    "<div class='checks'>" +
    Object.entries(verification.checks).map(([key,value]) =>
      "<div class='check'><span>" + escapeHtml(key) + "</span><b>" + (value ? "✓" : "✕") + "</b></div>"
    ).join("") +
    "</div>" +
    (verification.reasons.length ? "<h3>Motivos</h3><ul>" + verification.reasons.map((x) => "<li>" + escapeHtml(x) + "</li>").join("") + "</ul>" : "") +
    (verification.warnings.length ? "<h3>Avisos</h3><ul>" + verification.warnings.map((x) => "<li>" + escapeHtml(x) + "</li>").join("") + "</ul>" : "") +
    "<details><summary>Credencial</summary><pre>" + escapeHtml(canonicalJson(verification.credential)) + "</pre></details>";
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
    showError("Este navegador no expone BarcodeDetector. Usa un lector QR del sistema y pega el payload.");
    return;
  }
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

document.querySelector("#clear")!.addEventListener("click", () => {
  input.value = "";
  result.className = "hidden";
  result.innerHTML = "";
  void stopCamera();
});

document.querySelector("#verify")!.addEventListener("click", () => {
  void verifyInput().catch((error) => showError(error instanceof Error ? error.message : String(error)));
});