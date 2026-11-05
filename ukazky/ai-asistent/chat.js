// Local demo replies. Pattern → answer.
const K=[
[/otev|hodin|kdy m|otevírací/i,"Máme otevřeno Po–Pá 7:30–17:00, v sobotu 8:00–12:00 (ukázkové údaje)."],
[/pneu|přezu|gum/i,"Přezutí pneumatik stojí od 600 Kč za sadu. Termín si můžete vybrat online, obvykle do 2 dnů."],
[/stk|emis/i,"Auto vám na STK rádi připravíme a odvezeme. Příprava od 490 Kč."],
[/cen|kolik|stojí/i,"Orientační ceny: přezutí od 600 Kč, diagnostika od 790 Kč, příprava na STK od 490 Kč. Přesnou nabídku potvrdíme po kontrole."],
[/termín|rezerv|objedn|kdy můž/i,"Napište preferovaný den a typ práce — připravíme vám termín a ozveme se e-mailem nebo do mobilu."],
[/olej|servis|prohlíd/i,"Běžný servis (olej, filtry) řešíme dle modelu. Orientačně od 1 200 Kč + materiál."],
[/kde|adres|brno/i,"Autoservis Novák — ukázková adresa v Brně. V ostrém webu tu bude vaše provozovna."],
[/ahoj|dobrý|zdrav/i,"Ahoj! Jsem asistent Autoservisu Novák. Zeptejte se na ceny, STK nebo termín."]
];
window.NitivaChat={
  answer(q){
    q=(q||"").trim();
    if(!q) return "Napište prosím otázku.";
    for(const [re,a] of K){ if(re.test(q)) return a; }
    return "Díky. Zkuste se zeptat na přezutí, STK, ceny nebo otevírací dobu — přesně na to je asistent připravený.";
  }
};
