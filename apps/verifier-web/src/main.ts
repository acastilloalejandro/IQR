import { parseQrPayload } from "../../../src/qr.js";
import { verifyCredential, canonicalJson } from "../../../src/verify.js";
import "./style.css";

const app = document.querySelector("#app") as HTMLDivElement;
app.innerHTML =
  '<section class="shell">' +
  '<div class="eyebrow">IQR · VERIFIER</div>' +
  '<h1>Verificar documento</h1>' +
  '<p class="lead">Pega un payload QR IQR. Se separan firma, emisor, integridad, estado y caducidad.</p>' +
  '<textarea id="input" placeholder="iqr1...."></textarea>' +
  '<div class="actions"><button id="verify">Verificar</button><button id="clear">Limpiar</button></div>' +
  '<div id="result" class="hidden"></div>' +
  '</section>';

const input = document.querySelector("#input") as HTMLTextAreaElement;
const result = document.querySelector("#result") as HTMLDivElement;

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  })[char] as string);
}

function showError(message: string): void {
  result.className = "card danger";
  result.innerHTML = "<strong>Error</strong><p>" + escapeHtml(message) + "</p>";
}

document.querySelector("#clear")!.addEventListener("click", () => {
  input.value = "";
  result.className = "hidden";
  result.innerHTML = "";
});

document.querySelector("#verify")!.addEventListener("click", async () => {
  try {
    const parsed = parseQrPayload(input.value.trim());
    if (parsed.mode === "online") {
      showError("Payload online detectado. Resolver: " + parsed.url.toString());
      return;
    }
    const verification = await verifyCredential(parsed.credential, { allowInlinePublicKey: true });
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
  } catch (error) {
    showError(error instanceof Error ? error.message : String(error));
  }
});