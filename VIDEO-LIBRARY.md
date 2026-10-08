# Přidávání videí do Nitiva

Úvodní stránka používá jeden vodorovný pás. Nové video přidejte jako další
`figure.vf` do `#video-strip`. Neměňte pás na mřížku a nepřidávejte další řádky.

Každé video má mít srozumitelný český název, viditelné téma a vlastní náhled.
Přehrávač na úvodní stránce používá `preload="none"`, rozměry 1080 × 1920
a poměr stran 9:16. Zachovejte skutečný poměr stran, pokud bude jiné video.

Pro přesné zařazení nastavte na kartě `data-topics`: `web`, `chatbot`,
`automatizace`, `socialni-site` nebo `grafika`. Více témat oddělte mezerou.
Do `data-keywords` přidejte běžné výrazy, podle kterých bude návštěvník hledat.
Viditelný štítek tématu je `span.vtopic` uvnitř `figcaption`.

Vyhledávání prochází název, štítek, popisek přehrávače a klíčová slova.
Funguje i bez diakritiky. Starší publikovací postupy, které metadata karty
nepřidají, zůstávají použitelné: témata se odvodí z názvu a popisku přehrávače.
Při více možných tématech je lepší zadat výslovné zařazení.

Samostatná stránka videa má obsahovat textové shrnutí, související odkazy,
kanonickou adresu, náhled pro sdílení a `VideoObject` se skutečným datem,
délkou a adresou souboru. Stránku i údaje o videu doplňte do `sitemap.xml`.

Před zveřejněním ověřte téma, hledání, přehrání a mobilní zobrazení.
Přidávání dalších karet musí prodlužovat pás do strany; výška jedné řady
se nesmí měnit podle počtu videí.
