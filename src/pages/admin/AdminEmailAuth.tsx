import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, RefreshCw, ShieldCheck, ShieldAlert, Trash2, Plus, Info } from "lucide-react";
import { toast } from "sonner";
import { EmailDnsSetupStatus } from "@/components/admin/EmailDnsSetupStatus";

type CheckStatus = "pass" | "warn" | "fail" | "unknown";

interface CheckResult {
  status: CheckStatus;
  record?: string;
  message: string;
}

interface DomainReport {
  domain: string;
  checkedAt: string;
  spf: CheckResult;
  dkim: CheckResult;
  dmarc: CheckResult;
  dkimSelector: string;
}

const STORAGE_KEY = "admin.email-auth.domains";
const DEFAULT_DOMAINS = ["getboost.digital", "notify.getboost.digital"];
const DEFAULT_SELECTOR = "lovable"; // common Lovable-managed selector; user can override

async function dohTxt(name: string): Promise<string[]> {
  const url = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=TXT`;
  const res = await fetch(url, { headers: { accept: "application/dns-json" } });
  if (!res.ok) throw new Error(`DNS ${res.status}`);
  const data = await res.json();
  const answers: Array<{ data: string }> = data?.Answer ?? [];
  return answers.map((a) => a.data.replace(/^"|"$/g, "").replace(/"\s*"/g, ""));
}

function evalSpf(records: string[]): CheckResult {
  const spf = records.find((r) => r.toLowerCase().startsWith("v=spf1"));
  if (!spf) return { status: "fail", message: "Nenhum registo SPF (v=spf1) encontrado." };
  const dup = records.filter((r) => r.toLowerCase().startsWith("v=spf1")).length;
  if (dup > 1) return { status: "fail", record: spf, message: "Múltiplos registos SPF — apenas 1 permitido." };
  const all = /[-~?+]all\b/i.exec(spf)?.[0]?.toLowerCase();
  if (!all) return { status: "warn", record: spf, message: "SPF sem qualificador 'all' — recomenda-se ~all ou -all." };
  if (all === "+all") return { status: "fail", record: spf, message: "SPF com +all permite qualquer remetente." };
  if (all === "?all") return { status: "warn", record: spf, message: "SPF neutro (?all) — sem proteção efetiva." };
  return { status: "pass", record: spf, message: `SPF válido (${all}).` };
}

function evalDmarc(records: string[]): CheckResult {
  const dmarc = records.find((r) => r.toLowerCase().startsWith("v=dmarc1"));
  if (!dmarc) return { status: "fail", message: "Nenhum registo DMARC encontrado em _dmarc." };
  const policy = /p=(none|quarantine|reject)/i.exec(dmarc)?.[1]?.toLowerCase();
  if (!policy) return { status: "fail", record: dmarc, message: "DMARC sem política 'p='." };
  if (policy === "none") return { status: "warn", record: dmarc, message: "DMARC p=none (apenas monitorização)." };
  return { status: "pass", record: dmarc, message: `DMARC ativo (p=${policy}).` };
}

function evalDkim(records: string[]): CheckResult {
  const dkim = records.find((r) => /(^|;\s*)v=dkim1/i.test(r) || r.toLowerCase().includes("p="));
  if (!dkim) return { status: "fail", message: "Nenhum registo DKIM encontrado neste seletor." };
  const p = /p=([A-Za-z0-9+/=]*)/.exec(dkim)?.[1] ?? "";
  if (!p) return { status: "fail", record: dkim, message: "DKIM sem chave pública (p=)." };
  if (p.length < 100) return { status: "warn", record: dkim, message: "DKIM com chave curta (<1024 bits)." };
  return { status: "pass", record: dkim, message: "DKIM válido." };
}

async function checkDomain(domain: string, selector: string): Promise<DomainReport> {
  const clean = domain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  const [rootTxt, dmarcTxt, dkimTxt] = await Promise.allSettled([
    dohTxt(clean),
    dohTxt(`_dmarc.${clean}`),
    dohTxt(`${selector}._domainkey.${clean}`),
  ]);
  const get = (r: PromiseSettledResult<string[]>): string[] => (r.status === "fulfilled" ? r.value : []);
  return {
    domain: clean,
    checkedAt: new Date().toISOString(),
    dkimSelector: selector,
    spf: evalSpf(get(rootTxt)),
    dmarc: evalDmarc(get(dmarcTxt)),
    dkim: evalDkim(get(dkimTxt)),
  };
}

const statusStyles: Record<CheckStatus, string> = {
  pass: "bg-emerald-100 text-emerald-800 border-emerald-200",
  warn: "bg-amber-100 text-amber-800 border-amber-200",
  fail: "bg-red-100 text-red-800 border-red-200",
  unknown: "bg-muted text-muted-foreground",
};

function StatusBadge({ status }: { status: CheckStatus }) {
  const label = { pass: "OK", warn: "Aviso", fail: "Falha", unknown: "—" }[status];
  return <Badge variant="outline" className={statusStyles[status]}>{label}</Badge>;
}

function CheckRow({ label, result }: { label: string; result: CheckResult }) {
  return (
    <div className="border rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">{label}</span>
        <StatusBadge status={result.status} />
      </div>
      <p className="text-xs text-muted-foreground">{result.message}</p>
      {result.record && (
        <pre className="text-[11px] bg-muted/50 border rounded p-2 overflow-x-auto whitespace-pre-wrap break-all">
          {result.record}
        </pre>
      )}
    </div>
  );
}

export default function AdminEmailAuth() {
  const [domains, setDomains] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : DEFAULT_DOMAINS;
    } catch {
      return DEFAULT_DOMAINS;
    }
  });
  const [selector, setSelector] = useState<string>(() => localStorage.getItem(STORAGE_KEY + ".selector") || DEFAULT_SELECTOR);
  const [newDomain, setNewDomain] = useState("");
  const [reports, setReports] = useState<Record<string, DomainReport>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(domains));
  }, [domains]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY + ".selector", selector);
  }, [selector]);

  const runCheck = useCallback(async (domain: string) => {
    setLoading((l) => ({ ...l, [domain]: true }));
    try {
      const report = await checkDomain(domain, selector);
      setReports((r) => ({ ...r, [domain]: report }));
    } catch (e) {
      toast.error(`Falha ao verificar ${domain}`, { description: (e as Error).message });
    } finally {
      setLoading((l) => ({ ...l, [domain]: false }));
    }
  }, [selector]);

  const runAll = useCallback(() => {
    domains.forEach((d) => runCheck(d));
  }, [domains, runCheck]);

  useEffect(() => {
    runAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addDomain = () => {
    const d = newDomain.trim().toLowerCase();
    if (!d) return;
    if (domains.includes(d)) {
      toast.info("Domínio já monitorizado");
      return;
    }
    setDomains([...domains, d]);
    setNewDomain("");
    setTimeout(() => runCheck(d), 0);
  };

  const removeDomain = (d: string) => {
    setDomains(domains.filter((x) => x !== d));
    setReports(({ [d]: _, ...rest }) => rest);
  };

  const summary = domains.reduce(
    (acc, d) => {
      const r = reports[d];
      if (!r) return acc;
      [r.spf, r.dkim, r.dmarc].forEach((c) => {
        acc[c.status] = (acc[c.status] || 0) + 1;
      });
      return acc;
    },
    {} as Record<CheckStatus, number>,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            Autenticação de Email
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Monitoriza SPF, DKIM e DMARC por domínio e subdomínio.
          </p>
        </div>
        <Button onClick={runAll} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" /> Verificar todos
        </Button>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Como funciona</AlertTitle>
        <AlertDescription className="text-xs">
          Consultas DNS TXT em tempo real via Cloudflare DoH. DKIM depende do seletor abaixo — o seletor
          usado pelo Lovable Emails aparece em Cloud → Emails; substitui se necessário.
        </AlertDescription>
      </Alert>

      <EmailDnsSetupStatus />


      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Configuração</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <div>
            <label className="text-xs font-medium mb-1 block">Novo domínio</label>
            <div className="flex gap-2">
              <Input
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                placeholder="ex: notify.getboost.digital"
                onKeyDown={(e) => e.key === "Enter" && addDomain()}
              />
              <Button onClick={addDomain} size="icon" variant="secondary">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">Seletor DKIM</label>
            <Input value={selector} onChange={(e) => setSelector(e.target.value)} placeholder="lovable" />
          </div>
          <div className="flex items-end">
            <Button onClick={runAll} className="w-full md:w-auto">
              <RefreshCw className="h-4 w-4 mr-2" /> Re-verificar
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-4">
        {(["pass", "warn", "fail", "unknown"] as CheckStatus[]).map((s) => (
          <Card key={s}>
            <CardContent className="pt-6">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {{ pass: "OK", warn: "Avisos", fail: "Falhas", unknown: "Sem dados" }[s]}
              </p>
              <p className="text-2xl font-bold mt-1">{summary[s] || 0}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-4">
        {domains.length === 0 && (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Adiciona um domínio para começar a monitorizar.
            </CardContent>
          </Card>
        )}
        {domains.map((domain) => {
          const report = reports[domain];
          const isLoading = loading[domain];
          const anyFail = report && [report.spf, report.dkim, report.dmarc].some((c) => c.status === "fail");
          return (
            <Card key={domain}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    {anyFail ? (
                      <ShieldAlert className="h-4 w-4 text-red-600" />
                    ) : (
                      <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    )}
                    {domain}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {report && (
                      <span className="text-[11px] text-muted-foreground">
                        Verificado {new Date(report.checkedAt).toLocaleString("pt-PT")}
                      </span>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => runCheck(domain)} disabled={isLoading}>
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => removeDomain(domain)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {!report && !isLoading && (
                  <p className="text-sm text-muted-foreground">Ainda não verificado.</p>
                )}
                {isLoading && !report && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> A consultar DNS…
                  </div>
                )}
                {report && (
                  <div className="grid gap-3 md:grid-cols-3">
                    <CheckRow label="SPF" result={report.spf} />
                    <CheckRow label={`DKIM (${report.dkimSelector})`} result={report.dkim} />
                    <CheckRow label="DMARC" result={report.dmarc} />
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
