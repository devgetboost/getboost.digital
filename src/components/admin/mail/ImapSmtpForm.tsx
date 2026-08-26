import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { invokeIntegration } from "@/lib/integrationDiag";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnected?: () => void;
};

type Security = "ssl" | "starttls" | "none";

const PRESETS: Record<string, Partial<FormState>> = {
  gmail: {
    imap_host: "imap.gmail.com",
    imap_port: "993",
    imap_security: "ssl",
    smtp_host: "smtp.gmail.com",
    smtp_port: "465",
    smtp_security: "ssl",
  },
  outlook: {
    imap_host: "outlook.office365.com",
    imap_port: "993",
    imap_security: "ssl",
    smtp_host: "smtp.office365.com",
    smtp_port: "587",
    smtp_security: "starttls",
  },
  hostinger: {
    imap_host: "imap.hostinger.com",
    imap_port: "993",
    imap_security: "ssl",
    smtp_host: "smtp.hostinger.com",
    smtp_port: "465",
    smtp_security: "ssl",
  },
  custom: {},
};

type FormState = {
  email_address: string;
  display_name: string;
  username: string;
  password: string;
  imap_host: string;
  imap_port: string;
  imap_security: Security;
  smtp_host: string;
  smtp_port: string;
  smtp_security: Security;
};

const empty: FormState = {
  email_address: "",
  display_name: "",
  username: "",
  password: "",
  imap_host: "",
  imap_port: "993",
  imap_security: "ssl",
  smtp_host: "",
  smtp_port: "465",
  smtp_security: "ssl",
};

function errMessage(e: unknown, fallback: string): string {
  if (e instanceof Error && e.message) return e.message;
  if (e && typeof e === "object" && "message" in e) {
    const m = (e as { message?: unknown }).message;
    if (typeof m === "string" && m.trim()) return m;
  }
  if (typeof e === "string" && e.trim()) return e;
  return fallback;
}

export function ImapSmtpForm({ open, onOpenChange, onConnected }: Props) {
  const [form, setForm] = useState<FormState>(empty);
  const [preset, setPreset] = useState<string>("custom");
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const applyPreset = (id: string) => {
    setPreset(id);
    const p = PRESETS[id] ?? {};
    setForm((prev) => ({ ...prev, ...p }));
  };

  const submit = async () => {
    setSaving(true);
    setFieldErrors({});
    try {
      const username = form.username.trim() || form.email_address.trim();
      const { data, error } = await invokeIntegration("email-imap-smtp-connect", {
        body: {
          email_address: form.email_address.trim(),
          display_name: form.display_name.trim(),
          username,
          password: form.password,
          imap_host: form.imap_host.trim(),
          imap_port: Number(form.imap_port),
          imap_security: form.imap_security,
          smtp_host: form.smtp_host.trim(),
          smtp_port: Number(form.smtp_port),
          smtp_security: form.smtp_security,
        },
      });
      
      if (error) throw new Error(error.message || "Falha ao ligar IMAP/SMTP");
      
      const payload = data as { error?: string; fields?: Record<string, string>; email?: string };
      if (payload?.error === "validation_failed" && payload.fields) {
        setFieldErrors(payload.fields);
        throw new Error("Corrige os campos assinalados.");
      }
      if (payload?.error) throw new Error(payload.error);
      
      toast.success(`Conta IMAP ligada${payload?.email ? `: ${payload.email}` : ""}`);
      setForm(empty);
      onOpenChange(false);
      onConnected?.();
    } catch (e: unknown) {
      toast.error(errMessage(e, "Falha ao ligar IMAP/SMTP"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ligar IMAP / SMTP</DialogTitle>
          <DialogDescription>
            Usa as credenciais do teu fornecedor de email. A password é encriptada no servidor —
            nunca fica em claro no browser.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Preset</Label>
            <Select value={preset} onValueChange={applyPreset}>
              <SelectTrigger>
                <SelectValue placeholder="Escolher preset" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gmail">Gmail (IMAP)</SelectItem>
                <SelectItem value="outlook">Outlook / Microsoft 365</SelectItem>
                <SelectItem value="hostinger">Hostinger</SelectItem>
                <SelectItem value="custom">Personalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Email" error={fieldErrors.email_address}>
              <Input
                type="email"
                value={form.email_address}
                onChange={(e) => {
                  set("email_address", e.target.value);
                  if (!form.username) set("username", e.target.value);
                }}
                placeholder="tu@empresa.pt"
              />
            </Field>
            <Field label="Nome de exibição">
              <Input
                value={form.display_name}
                onChange={(e) => set("display_name", e.target.value)}
                placeholder="Getboost"
              />
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Username" error={fieldErrors.username}>
              <Input
                value={form.username}
                onChange={(e) => set("username", e.target.value)}
                placeholder="igual ao email na maioria dos casos"
              />
            </Field>
            <Field label="Password / App password" error={fieldErrors.password}>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                autoComplete="new-password"
              />
            </Field>
          </div>

          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-1">IMAP (receção)</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Host" error={fieldErrors.imap_host} className="sm:col-span-2">
              <Input value={form.imap_host} onChange={(e) => set("imap_host", e.target.value)} />
            </Field>
            <Field label="Porta" error={fieldErrors.imap_port}>
              <Input value={form.imap_port} onChange={(e) => set("imap_port", e.target.value)} />
            </Field>
          </div>
          <Field label="Segurança IMAP" error={fieldErrors.imap_security}>
            <Select value={form.imap_security} onValueChange={(v) => set("imap_security", v as Security)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ssl">SSL/TLS</SelectItem>
                <SelectItem value="starttls">STARTTLS</SelectItem>
                <SelectItem value="none">Nenhuma</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-1">SMTP (envio)</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Host" error={fieldErrors.smtp_host} className="sm:col-span-2">
              <Input value={form.smtp_host} onChange={(e) => set("smtp_host", e.target.value)} />
            </Field>
            <Field label="Porta" error={fieldErrors.smtp_port}>
              <Input value={form.smtp_port} onChange={(e) => set("smtp_port", e.target.value)} />
            </Field>
          </div>
          <Field label="Segurança SMTP" error={fieldErrors.smtp_security}>
            <Select value={form.smtp_security} onValueChange={(v) => set("smtp_security", v as Security)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ssl">SSL/TLS</SelectItem>
                <SelectItem value="starttls">STARTTLS</SelectItem>
                <SelectItem value="none">Nenhuma</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={saving} className="gap-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Ligar conta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  error,
  children,
  className,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label>{label}</Label>
      {children}
      {error && <p className="text-[11px] text-destructive">{error}</p>}
    </div>
  );
}

export default ImapSmtpForm;
