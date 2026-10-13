#!/usr/bin/env python3
"""R20.16 — add tracking onClick to untracked conversion Links.
Brace/quote-aware tag scanner (regexes corrupt multiline JSX tags).
Idempotent: skips tags that already have onClick.
"""
import io
import sys

SLUG = {
    'AgenciaLocal': 'agency_local', 'BlogPost': 'blog_post', 'BotsWhatsApp': 'bots',
    'CopywritingConteudo': 'copywriting', 'CrmSalesIntelligence': 'crm_sales',
    'DemoRequest': 'demo', 'DigitalAudit': 'digital_audit', 'DigitalAuditResults': 'digital_audit_results',
    'EmailMarketing': 'email', 'Equipa': 'team', 'FunisVendas': 'funis',
    'GestaoRedesSociais': 'redes', 'HostifyLanding': 'hostify', 'Investidores': 'investors',
    'LandingPages': 'landing_pages', 'Mvp30Dias': 'mvp', 'NotFound': 'notfound',
    'PiktoLanding': 'pikto', 'PoliticaCookies': 'cookies', 'PoliticaPrivacidade': 'privacy',
    'Prosafe360Landing': 'prosafe', 'ROICalculator': 'roi', 'Resources': 'resources',
    'SistemasGestaoPmes': 'sistemas', 'UxUiDesign': 'uxui', 'VideoFotografia': 'video',
}
LABEL = {'/booking': 'booking', '/contact': 'contact', '/demo': 'demo'}


def find_link_tags(s):
    """Yield (start, end, tag_text) for top-level <Link ...> tags."""
    out = []
    i = 0
    while True:
        j = s.find('<Link', i)
        if j == -1:
            break
        # must be followed by whitespace, /, or >
        k = j + 5
        if k < len(s) and s[k] not in (' ', '\t', '\n', '\r', '/', '>'):
            i = k
            continue
        depth = 0
        quote = None
        p = k
        while p < len(s):
            ch = s[p]
            if quote:
                if ch == quote and s[p - 1] != '\\':
                    quote = None
            elif ch in ('"', "'", '`'):
                quote = ch
            elif ch == '{':
                depth += 1
            elif ch == '}':
                depth -= 1
            elif ch == '>' and depth == 0:
                break
            p += 1
        if p >= len(s):
            break
        # self-closing?
        q = p - 1
        while q > j and s[q] in (' ', '\t', '\n', '\r'):
            q -= 1
        self_close = s[q] == '/'
        end = p + 1
        # exclude nested '<Link' inside (shouldn't happen for these tags)
        tag = s[j:end]
        if tag.count('<Link') == 1:
            out.append((j, end, tag, self_close))
        i = end
    return out


def main():
    import re
    failed = 0
    for name, slug in SLUG.items():
        path = f'src/pages/{name}.tsx'
        s = io.open(path, encoding='utf-8').read()
        hits = []
        for start, end, tag, self_close in find_link_tags(s):
            tm = re.search(r'to="(/[^"]+)"', tag)
            if not tm:
                continue
            d = tm.group(1)
            if d.split('?')[0] not in LABEL:
                continue
            if 'onClick' in tag:
                continue
            # sanity: tag must not contain a second component open
            hits.append((start, end, tag, d, self_close))
        n = len(hits)
        for idx, (start, end, tag, d, self_close) in enumerate(reversed(hits)):
            pos = 'hero' if (n == 1 or idx == n - 1) else 'cta'
            label = LABEL[d.split('?')[0]]
            addition = f" onClick={{() => analytics.trackClick('{slug}_{pos}', '{slug}_{label}', 'consideration')}}"
            if self_close:
                # <Link ... /> -> insert before />
                stripped = tag.rstrip()
                assert stripped.endswith('/>'), (path, tag[-40:])
                new_tag = stripped[:-2].rstrip() + addition + ' />'
            else:
                new_tag = tag + addition
                # NOTE: tag ends with '>'; append inside: replace trailing > — but
                # tag may end with '>\n'? No: find_link_tags ends exactly at '>'.
                new_tag = tag[:-1].rstrip() + addition + '>'
            # safety: the addition goes at the very end of the tag, after all
            # existing props — never inside a handler body.
            assert new_tag.rstrip().endswith('>'), (path, tag[-40:])
            s = s[:start] + new_tag + s[end:]
        if n > 0 and "from '@/lib/analytics'" not in s:
            m = re.search(r"import SEO[^;]*;\n", s)
            if not m:
                m = re.search(r"import Layout[^;]*;\n", s)
            assert m, path
            s = s[:m.end()] + "import { analytics } from '@/lib/analytics';\n" + s[m.end():]
        io.open(path, 'w', encoding='utf-8').write(s)
        print('ok', name, n)
    return failed


if __name__ == '__main__':
    sys.exit(main())
