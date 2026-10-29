import assert from "node:assert/strict";
import { test } from "node:test";
import { readingMinutes } from "./html-meta.js";

const words = (n: number) => Array.from({ length: n }, (_, i) => `palabra${i}`).join(" ");

test("readingMinutes usa el texto de <article>", () => {
  const html = `<html><body><nav>${words(5000)}</nav><article><h1>Título</h1><p>${words(999)}</p></article></body></html>`;
  assert.equal(readingMinutes(html), 5);
});

test("readingMinutes usa el body si no hay <article>", () => {
  const html = `<html><head><title>x</title></head><body><header>${words(300)}</header><main><p>${words(400)}</p></main></body></html>`;
  assert.equal(readingMinutes(html), 2);
});

test("readingMinutes devuelve null en páginas cortas", () => {
  assert.equal(readingMinutes(`<html><body><p>${words(80)}</p></body></html>`), null);
});

test("readingMinutes no cuenta scripts ni estilos", () => {
  const html = `<body><script>${words(3000)}</script><style>${words(3000)}</style><p>${words(120)}</p></body>`;
  assert.equal(readingMinutes(html), 1);
});

test("readingMinutes decodifica entidades", () => {
  const html = `<body><p>${words(199)} &amp;nbsp; caf&eacute;</p></body>`;
  assert.equal(readingMinutes(html), 1);
});

test("readingMinutes solo cuenta párrafos, no tablas ni listas", () => {
  const html = `<body><main><table><tr><td>${words(4000)}</td></tr></table><ul><li>${words(2000)}</li></ul><p>${words(600)}</p></main></body>`;
  assert.equal(readingMinutes(html), 3);
});

test("readingMinutes cuenta párrafos HTML5 sin </p>", () => {
  const html = `<body><main>${Array.from({ length: 4 }, () => `<p>${words(100)}`).join("")}<div>fin</div></main></body>`;
  assert.equal(readingMinutes(html), 2);
});

test("readingMinutes usa el <article> exterior aunque haya otros dentro", () => {
  const html = `<body><article><p>${words(300)}</p><article><p>${words(10)}</p></article><p>${words(300)}</p></article></body>`;
  assert.equal(readingMinutes(html), 3);
});

test("readingMinutes no descarta las páginas envueltas en <form>", () => {
  assert.equal(readingMinutes(`<body><form><p>${words(400)}</p></form></body>`), 2);
});

test("readingMinutes tarda poco con 1 MB de etiquetas sin cerrar", () => {
  for (const chunk of ["<p>a b ", "<svg>a b ", "<header-x>a b ", "a < b "]) {
    const html = `<body>${chunk.repeat(Math.ceil(1_000_000 / chunk.length))}</body>`;
    const start = performance.now();
    readingMinutes(html);
    assert.ok(performance.now() - start < 500, `${chunk}: ${Math.round(performance.now() - start)} ms`);
  }
});

test("readingMinutes no cuenta los atributos de <p>", () => {
  const html = `<body>${Array.from({ length: 100 }, () => `<p class="x" data-a="y">uno</p>`).join("")}</body>`;
  assert.equal(readingMinutes(html), 1);
  assert.equal(readingMinutes(html.replaceAll("uno", "")), null);
});
