# NITIVA – audit značky a implementačný záznam

Dátum kontroly: 17. 10. 2026  
Režim: audit + lokálna, vratná implementácia v samostatnej Git vetve  
Produkčné publikovanie: nevykonané

## 1. Skontrolované

- živá homepage nitiva.cz na desktopovej a mobilnej šírke;
- robots.txt a sitemap.xml;
- české stránky sociálnych sietí, tvorby webu, AI chatbota a AI telefónu;
- homepage metadata, nadpisy, canonical, robots, Open Graph a JSON-LD;
- interné odkazy, CTA a kontaktné formuláre na úrovni zdrojového kódu;
- verejný GitHub repozitár `Milos1616Milos/nitiva-web` a aktuálna vetva `main`;
- read-only vyhľadanie relevantných názvov v pripojenom Google Drive;
- existujúci HTML e-mailový podpis NITIVA v Google Drive;
- výskyty historických názvov BotEffex a Marketing srdcem/srdcom v HTML;
- lokálne staršie exporty `nasadenie-nitiva` a `nahlad-premium` iba ako porovnávací podklad.

## 2. Pôvodný stav

- Homepage H1 bol „Marketing, který dává smysl.“ a nekomunikoval AI, automatizáciu ani prepájanie služieb.
- Chýbala samostatná sekcia „Proč NITIVA?“.
- Hlavné SEO prvky už boli indexovateľné: canonical bol prítomný, robots povoľoval indexáciu a sitemap obsahovala české aj anglické alternatívy.
- Servisné stránky mali konkrétnu hodnotu a vlastné SEO zameranie; tie treba zachovať.
- Historické názvy sa na aktuálnej homepage používali ako výslovne historické označenie, nie ako samostatná ponuka.
- Google Drive obsahuje staršie prezentácie a priečinok BotEffex. Ide o historické materiály; bez ďalšieho rozhodnutia sa nemajú mazať ani hromadne prepisovať.
- Aktuálny e-mailový podpis už používa NITIVA, ale popisuje iba weby a AI asistentov a nemá nový slogan.
- Mobilná homepage pri šírke 390 px nemala horizontálne pretekanie. Kompletná manuálna kontrola všetkých interakcií nebola súčasťou počiatočného auditu.

## 3. Lokálne vykonané zmeny

- `index.html`: nový konkrétny hero text, slogan, sekcia „Proč NITIVA?“, navigačný odkaz, pätička, metadata a schema.org slogan.
- `index.html`: jemný vizuálny motív prepojených bodov a liniek, bez zmeny loga, palety alebo typografie.
- `ai-chatbot/index.html`: praktické vysvetlenie napojenia chatbota na web a odovzdanie dopytu.
- `ai-telefon/index.html`: praktické vysvetlenie ďalšieho kroku po hovore.
- `tvorba-webu/index.html`: vysvetlenie webu ako súčasti procesu, pričom web ostáva aj samostatnou službou.
- `socialni-site/index.html`: prepojenie obsahu so službou, landing page alebo formulárom.
- `.agents/product-marketing.md`: centrálny profil ponuky, zdroje, stavy a otvorené otázky.
- `docs/NITIVA-BRAND-STORY-COMMUNICATION-GUIDELINES.md`: centrálny brand a komunikačný manuál.
- `G:\Môj disk\nitiva.cz\Podpis Nitiva - navrh 2026-10-17.html`: samostatný návrh podpisu; pôvodný podpis zostal nezmenený.

## 4. Pripravené na schválenie

- texty homepage a štyroch servisných stránok;
- hlavný slogan a hierarchia podporných posolstiev;
- sociálne BIO, predstavenie značky, pripnutý príspevok a koncept Reels;
- obchodné texty, e-mailový podpis, CRM veta a odpoveď na otázku „Co znamená NITIVA?“;
- vizuálny motív liniek a uzlov v existujúcej palete;
- návrh SEO metadát homepage.

## 5. Nevykonané alebo neoverené

- žiadna zmena nebola zlúčená do `main` ani publikovaná na nitiva.cz;
- neboli zmenené sociálne profily, Google Business Profile, CRM, reklamy ani rozpočty;
- existujúce Google Drive materiály a marketingové systémy neboli prepisované; nová pracovná kópia v synchronizovanom priečinku však vytvorila nové návrhové súbory v Drive;
- nebol vykonaný E2E test reálneho odoslania formulára, aby nevznikol falošný dopyt;
- indexácia v Google nebola dokazovaná iba z HTTP alebo sitemap signálu;
- zmena názvu Instagram profilu `marketing.srdcem` nebola vykonaná, pretože URL je externý identifikátor a môže vyžadovať samostatné rozhodnutie.

## 6. Kontrola po prípadnom nasadení

1. Overiť HTTP 200 na homepage a štyroch servisných stránkach.
2. Čerstvo načítať title, description, H1, canonical, Open Graph a JSON-LD.
3. Skontrolovať desktop a mobil, najmä zalomenie hero nadpisu a navigáciu.
4. Kliknúť interné odkazy na sekciu „Proč NITIVA?“ a servisné stránky.
5. Otestovať formuláre iba do posledného kroku; reálne odoslanie vykonať len s autorizovaným testovacím dopytom.
6. Skontrolovať sitemap a lastmod po schválenom nasadení.
7. Verejný web označiť za upravený až po čerstvom readbacku; indexáciu uvádzať osobitne.

