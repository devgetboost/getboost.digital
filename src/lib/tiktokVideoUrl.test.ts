import { describe, it, expect } from "vitest";
import { videoUrlSchema, validateVideoUrl, applyVideoUrlToOutput } from "./tiktokVideoUrl";

describe("videoUrlSchema", () => {
  it("aceita URLs https válidos", () => {
    const r = videoUrlSchema.safeParse("https://cdn.example.com/video.mp4");
    expect(r.success).toBe(true);
  });

  it("aceita URLs http válidos", () => {
    expect(videoUrlSchema.safeParse("http://example.com/a.mp4").success).toBe(true);
  });

  it("aceita string vazia (remover video_url)", () => {
    const r = videoUrlSchema.safeParse("");
    expect(r.success).toBe(true);
    if (r.success) expect(r.data).toBe("");
  });

  it("faz trim antes de validar", () => {
    const r = videoUrlSchema.safeParse("  https://a.com/v.mp4  ");
    expect(r.success).toBe(true);
    if (r.success) expect(r.data).toBe("https://a.com/v.mp4");
  });

  it("rejeita URLs sem protocolo http(s)", () => {
    expect(videoUrlSchema.safeParse("ftp://a.com/v.mp4").success).toBe(false);
    expect(videoUrlSchema.safeParse("example.com/v.mp4").success).toBe(false);
  });

  it("rejeita URLs com espaços", () => {
    expect(videoUrlSchema.safeParse("https://a.com/ v.mp4").success).toBe(false);
  });

  it("rejeita host sem ponto", () => {
    expect(videoUrlSchema.safeParse("https://localhost/v.mp4").success).toBe(false);
  });

  it("rejeita URLs demasiado longos (>2048)", () => {
    const long = "https://a.com/" + "x".repeat(2100);
    expect(videoUrlSchema.safeParse(long).success).toBe(false);
  });

  it("rejeita lixo", () => {
    expect(videoUrlSchema.safeParse("not a url").success).toBe(false);
    expect(videoUrlSchema.safeParse("https://").success).toBe(false);
  });
});

describe("validateVideoUrl", () => {
  it("devolve ok=true e remove=true para vazio", () => {
    const r = validateVideoUrl("   ");
    expect(r).toEqual({ ok: true, value: "", remove: true });
  });

  it("devolve ok=true e remove=false para URL válido", () => {
    const r = validateVideoUrl("https://cdn.a.com/v.mp4");
    expect(r).toEqual({ ok: true, value: "https://cdn.a.com/v.mp4", remove: false });
  });

  it("devolve ok=false com mensagem em PT para URL inválido", () => {
    const r = validateVideoUrl("javascript:alert(1)");
    expect(r.ok).toBe(false);
    if (r.ok === false) expect(r.error).toMatch(/URL inválido|http/i);
  });
});

describe("applyVideoUrlToOutput (integração com o payload do draft)", () => {
  it("adiciona video_url a um output existente sem tocar noutros campos", () => {
    const out = { corpo: "olá", hashtags: ["#a"] };
    const r = applyVideoUrlToOutput(out, "https://cdn.a.com/v.mp4");
    expect(r.ok).toBe(true);
    if (r.ok === true) {
      expect(r.output).toEqual({
        corpo: "olá",
        hashtags: ["#a"],
        video_url: "https://cdn.a.com/v.mp4",
      });
    }
    // não muta o original
    expect(out).toEqual({ corpo: "olá", hashtags: ["#a"] });
  });

  it("substitui um video_url anterior", () => {
    const r = applyVideoUrlToOutput(
      { video_url: "https://old.com/v.mp4", corpo: "x" },
      "https://new.com/v.mp4",
    );
    if (r.ok === true) expect(r.output.video_url).toBe("https://new.com/v.mp4");
  });

  it("remove video_url quando input é vazio", () => {
    const r = applyVideoUrlToOutput({ corpo: "x", video_url: "https://a.com/v.mp4" }, "");
    expect(r.ok).toBe(true);
    if (r.ok === true) {
      expect("video_url" in r.output).toBe(false);
      expect(r.output).toEqual({ corpo: "x" });
    }
  });

  it("remove video_url mesmo com whitespace apenas", () => {
    const r = applyVideoUrlToOutput({ video_url: "https://a.com/v.mp4" }, "   ");
    if (r.ok === true) expect("video_url" in r.output).toBe(false);
  });

  it("cria output novo quando o draft não tinha output", () => {
    const r = applyVideoUrlToOutput(null, "https://a.com/v.mp4");
    if (r.ok === true) expect(r.output).toEqual({ video_url: "https://a.com/v.mp4" });
  });

  it("ignora output que não é objecto (ex.: array)", () => {
    const r = applyVideoUrlToOutput(["nope"], "https://a.com/v.mp4");
    if (r.ok === true) expect(r.output).toEqual({ video_url: "https://a.com/v.mp4" });
  });

  it("devolve erro sem tocar no output quando URL é inválido", () => {
    const r = applyVideoUrlToOutput({ corpo: "x" }, "not-a-url");
    expect(r.ok).toBe(false);
    if (r.ok === false) expect(r.error).toBeTruthy();
  });
});
