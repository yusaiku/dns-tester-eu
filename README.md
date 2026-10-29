# DNS-Tester EU

Eine deutsche Seite, mit der du öffentliche DNS-Resolver aus Europa prüfen kannst.

Das Aussehen stammt vom [DNS-Tester](https://github.com/DarknessShade/DNS-Tester) von darknessShade. Die Texte sind deutsch. Die Vorliste enthält nur Resolver, die am 29. Oktober 2026 geprüft wurden.

## Was ein Eintrag bedeutet

Ein Resolver steht nur dann in der Vorliste, wenn alles davon zutraf:

- kostenlos und ohne Konto
- öffentlich erreichbar
- keine Sperrliste auf der genannten Adresse
- DNSSEC ist eingeschaltet
- der Betreiber schreibt, dass abgefragte Namen nicht gespeichert werden
- die Server stehen in der EU

Die Digitale Gesellschaft steht in Basel. Die Schweiz gehört nicht zur EU. Das steht am Eintrag.

Die Angaben zur Speicherung kommen von den Betreibern. Sie wurden nicht unabhängig geprüft.

Die Zahl neben einem Namen ist die Antwortzeit des verschlüsselten Web-Zugangs (DoH) in diesem Browser. Sie ist nicht die Dauer einer DNS-Abfrage. Digitalcourage spricht nur DoT. Der Browser kann das hier nicht messen, deshalb steht dort „nur DoT“.

Eigene Adressen kannst du mit dem Plus hinzufügen. Die gehören nicht zur geprüften Liste.

## Start

Im Projektordner:

```bash
python3 -m http.server 8765
```

Danach im Browser öffnen: <http://127.0.0.1:8765/>

Die Liste siehst du auch, wenn du `index.html` direkt öffnest. Die Prüfung funktioniert zuverlässig über den lokalen Server.

## Vorliste

| Resolver | Standort | DoH | DoT |
| --- | --- | --- | --- |
| X1 DNS | Deutschland | `https://dns.x1.to/dns-query` | `dns.x1.to` |
| FDN | Frankreich | `https://ns0.fdn.fr/dns-query` | `ns0.fdn.fr`, `ns1.fdn.fr` |
| Freifunk München | München und Wien | `https://doh.ffmuc.net/dns-query` | `dot.ffmuc.net` |
| Digitale Gesellschaft | Basel, Schweiz, nicht EU | `https://dns.digitale-gesellschaft.ch/dns-query` | `dns.digitale-gesellschaft.ch` |
| UncensoredDNS Unicast | Kopenhagen | `https://unicast.uncensoreddns.org/dns-query` | `unicast.uncensoreddns.org` |
| Applied Privacy | Wien | `https://doh.applied-privacy.net/query` | `dot1.applied-privacy.net` |
| Artikel10 | Deutschland | `https://dns.artikel10.org/dns-query` | `dns.artikel10.org` |
| HostuxDNS Standard | Luxemburg | `https://dns.hostux.net/dns-query` | `dns.hostux.net` |
| Digitalcourage | deutsches Rechenzentrum | keines | `dns3.digitalcourage.de` |

Adressen und Hinweise stehen im Info-Dialog jedes Eintrags. Die Quellen sind die Seiten der Betreiber.

Nicht aufgenommen wurden Dienste mit Sperrliste, ohne DNSSEC, mit Servern außerhalb der EU oder mit Kontozwang. Dazu gehören unter anderem Quad9, Cloudflare, Google, AdGuard, Mullvad, DNS4EU, Njalla und Nothing to Hide.

## Lizenz

Dies ist eine veränderte Fassung des DNS-Testers. Es ist nicht das Original.

- Original: <https://github.com/DarknessShade/DNS-Tester>
- Urheber der Vorlage: darknessShade
- Lizenz: MIT
- Copyright (c) 2025 darknessShade

Der vollständige Lizenztext steht in der Datei [LICENSE](LICENSE) und bleibt unverändert. Die MIT-Lizenz erlaubt das Nutzen, Kopieren, Ändern und Weitergeben. Bedingung: der Copyright-Hinweis und der Erlaubnishinweis aus dieser Datei müssen in jeder Kopie enthalten bleiben. Eine Garantie gibt es nicht.
