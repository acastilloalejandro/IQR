import { analyze } from "../../../src/statistics/robust";
import "./style.css";

const app = document.querySelector("#app") as HTMLDivElement;
app.innerHTML = `
<section class="shell">
  <header>
    <div class="eyebrow">IQR · ROBUST DATA ANALYSIS</div>
    <h1>Detecta anomalías.<br><span>Comprende tus datos.</span></h1>
    <p class="lead">Análisis robusto con IQR y Tukey. Conserva los datos originales y declara las limitaciones antes de inventar certezas.</p>
  </header>

  <section class="input-card">
    <div class="toolbar">
      <button id="example" class="secondary">Cargar ejemplo</button>
      <label class="file">Importar CSV<input id="file" type="file" accept=".csv,text/csv"></label>
      <button id="analyze">Analizar</button>
      <button id="clear" class="secondary">Limpiar</button>
    </div>
    <textarea id="data" aria-label="Datos numéricos" placeholder="Pega una columna de números, separados por líneas, comas o punto y coma."></textarea>
    <p class="hint">Formato MVP: CSV/texto. Los valores no numéricos se ignoran y se contabilizan como incidencias.</p>
  </section>

  <section id="result" class="hidden" aria-live="polite"></section>
</section>`;

const data = document.querySelector("#data") as HTMLTextAreaElement;
const result = document.querySelector("#result") as HTMLElement;
const file = document.querySelector("#file") as HTMLInputElement;

function parse(raw: string): { values: number[]; invalid: number } {
  const tokens = raw.split(/[\\n,;\\t]+/).map(x => x.trim()).filter(Boolean);
  const values: number[] = [];
  let invalid = 0;
  for (const token of tokens) {
    const normalized = token.replace(/^"|"$/g, "").replace(",", ".");
    const value = Number(normalized);
    if (Number.isFinite(value)) values.push(value); else invalid++;
  }
  return { values, invalid };
}

function fmt(value: number): string {
  return new Intl.NumberFormat("es-ES", { maximumFractionDigits: 6 }).format(value);
}

function render(r: ReturnType<typeof analyze>, invalid: number): void {
  const outliers = r.outliers.length;
  const status = outliers === 0 ? "Sin señales" : "Revisión necesaria";
  const limitations = r.limitations.map(x => `<li>${escapeHtml(x)}</li>`).join("");
  const rows = r.outliers.map(x => `<tr><td>${x.index + 1}</td><td>${fmt(x.value)}</td><td>${escapeHtml(x.severity)}</td><td>${fmt(x.distance)}</td></tr>`).join("");

  result.className = "result";
  result.innerHTML = `
    <div class="summary">
      <div><small>ESTADO</small><strong>${status}</strong><span>${outliers} valores fuera de las cercas</span></div>
      <div><small>OBSERVACIONES</small><strong>${r.n}</strong><span>${invalid ? invalid + " incidencias no numéricas" : "sin incidencias de formato"}</span></div>
      <div><small>IQR</small><strong>${fmt(r.iqr)}</strong><span>Q1 ${fmt(r.q1)} · Mediana ${fmt(r.median)} · Q3 ${fmt(r.q3)}</span></div>
    </div>

    <div class="grid">
      <article class="card"><small>RANGO INTERCUARTÍLICO</small><h2>${fmt(r.iqr)}</h2><p>Q1 = ${fmt(r.q1)}<br>Q3 = ${fmt(r.q3)}</p></article>
      <article class="card"><small>CERCAS DE TUKEY</small><h2>${fmt(r.lowerFence)} / ${fmt(r.upperFence)}</h2><p>1,5 × IQR. Fuera de estas cercas = posible anomalía.</p></article>
      <article class="card"><small>EXTREMOS</small><h2>${fmt(r.outerLowerFence)} / ${fmt(r.outerUpperFence)}</h2><p>3 × IQR. Útil como segunda señal, no como sentencia.</p></article>
      <article class="card"><small>DISTRIBUCIÓN</small><h2>${r.skewness === null ? "n/d" : fmt(r.skewness)}</h2><p>Asimetría. Valores altos requieren interpretación contextual.</p></article>
    </div>

    <article class="card">
      <div class="card-head"><div><small>ANOMALÍAS</small><h2>${outliers || "Ninguna"}</h2></div></div>
      ${outliers ? `<div class="table-wrap"><table><thead><tr><th>Fila</th><th>Valor</th><th>Severidad</th><th>Distancia</th></tr></thead><tbody>${rows}</tbody></table></div>` : "<p>No se han identificado observaciones fuera de las cercas de Tukey.</p>"}
    </article>

    <article class="card warning">
      <small>CONTROL DE VALIDEZ</small>
      <h2>Interpretación, no automatización ciega</h2>
      <p>IQR marca valores estadísticamente inusuales. No demuestra que sean errores, fraude o datos que deban eliminarse.</p>
      ${limitations ? `<ul>${limitations}</ul>` : "<p>Sin limitaciones críticas detectadas en este conjunto según las reglas actuales.</p>"}
    </article>
  `;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;" }[c]!));
}

document.querySelector("#example")!.addEventListener("click", () => {
  data.value = "10\\n11\\n12\\n12\\n13\\n14\\n15\\n16\\n100";
});

document.querySelector("#clear")!.addEventListener("click", () => {
  data.value = "";
  result.className = "hidden";
  result.innerHTML = "";
  file.value = "";
});

file.addEventListener("change", async () => {
  const selected = file.files?.[0];
  if (!selected) return;
  data.value = await selected.text();
});

document.querySelector("#analyze")!.addEventListener("click", () => {
  const parsed = parse(data.value);
  if (!parsed.values.length) {
    result.className = "result error";
    result.textContent = "No hay valores numéricos válidos.";
    return;
  }
  try { render(analyze(parsed.values), parsed.invalid); }
  catch (error) { result.className = "result error"; result.textContent = error instanceof Error ? error.message : String(error); }
});
