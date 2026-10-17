# NITIVA – distribúcia kontextu do systémov

Aktualizované: 2026-10-17

Táto mapa určuje zdroje a odporúčaný spôsob synchronizácie. Sama osebe nepotvrdzuje, že každý uvedený externý profil alebo workflow už bol aktualizovaný. Pri produkčnej zmene zaznamenať konkrétnu verziu a overiť výsledok priamo v cieľovom systéme.

| Systém | Zdroj | Čo preberá | Spôsob aktualizácie | Overenie |
|---|---|---|---|---|
| Web nitiva.cz | brand guide + produktový profil | príbeh, slogan, služby, Poradňa | Git a nasadenie webu | verejná URL, obsah, mobil |
| Verejný NITIVA chatbot | krátky systémový kontext | ponuka, hranice odpovedí, Poradňa, kontakt | verziovaný n8n workflow | pevná regresná sada + verejný webhook |
| Facebook/Instagram DM návrhy | verejný chatbot | rovnaké odpovede | bez druhej kópie promptu | návrh sa vytvorí, nič sa samo neodošle |
| Denné príspevky | krátky kontext + obsahové piliere | témy, tón, CTA, vizuálne minimum | n8n workflow so schválením | izolovaná generácia, bez publikovania |
| Reely | krátky kontext + nitiva-motion | text, slogan, CTA, vizuál | plán v n8n, schválenie pred publikovaním | kontrola budúcich položiek plánu |
| NITIVA YouTube | brand guide + register projektu | nové témy a popisy bez duplicít | START-TU/STAV; VIDEA.csv až po publikovaní | verejné video a register |
| Obchodné a výskumné skilly | produktový profil + brand guide | aktuálna ponuka a pravidlá | odkaz v SKILL.md, nie kópia ponuky | kontrola načítania zdrojov |
| NITIVA motion skilly | brand guide + aktuálny web | paleta, typografia, slogan, hranice | SKILL.md | render a vizuálna kontrola |
| Voice AI pilot | krátky kontext + osobitné pravidlá hovoru | identita a rozsah; bez sľubu ceny/termínu | až pri pokračovaní pilotu | syntetický E2E hovor |
| Grok a interní agenti | krátky kontext | smerovanie úloh a aktuálna značka | odkaz alebo krátky verziovaný blok | kontrola výstupu bez externej akcie |

Staré weby a ich technické workflow sa nemenia bez samostatného rozhodnutia vlastníka. Historické názvy môžu zostať v identifikátoroch a routingu, ale nové NITIVA výstupy ich neprezentujú ako súčasné značky.
