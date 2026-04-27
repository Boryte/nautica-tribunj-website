import type { LocaleCode } from '@shared/index';

type LegalSection = {
  title: string;
  body?: string[];
  bullets?: string[];
};

type LegalPageContent = {
  title: string;
  description: string;
  heroEyebrow: string;
  heroTitle: string;
  heroBody: string;
  updatedLabel: string;
  updatedAt: string;
  sections: LegalSection[];
};

type LegalDocumentKey = 'privacy' | 'terms' | 'cookies';

const privacy: Record<LocaleCode, LegalPageContent> = {
  hr: {
    title: 'Politika privatnosti',
    description: 'Kako Nautica prikuplja, koristi i štiti osobne podatke vezane uz rezervacije, kontakte i korištenje web stranice.',
    heroEyebrow: 'Privatnost',
    heroTitle: 'Podaci gostiju trebaju biti tretirani jednako pažljivo kao i samo iskustvo dolaska.',
    heroBody: 'Ova politika objašnjava koje podatke prikupljamo kroz Nautica web stranicu, zašto ih obrađujemo, koliko ih čuvamo i kako možete ostvariti svoja prava.',
    updatedLabel: 'Zadnje ažuriranje',
    updatedAt: '10. travnja 2026.',
    sections: [
      {
        title: 'Voditelj obrade',
        body: [
          'Voditelj obrade za javnu web stranicu Nautice je ugostiteljski obrt Tre bocconi, Vl. Irena Cvitan, DONJA RIVA 55, 22212 Tribunj, Hrvatska.',
          'Za pitanja o privatnosti i ostvarivanje prava možete se javiti na trebocconi@trebocconi.com ili na broj objavljen na stranici.',
        ],
      },
      {
        title: 'Koje podatke prikupljamo',
        bullets: [
          'podatke koje sami unesete pri rezervaciji ili kontaktu, poput imena, e-mail adrese, telefona, datuma, vremena, broja gostiju i posebnih napomena',
          'tehničke podatke potrebne za sigurnost, stabilnost i administraciju sustava, uključujući zapise o pristupu, user agent i osnovne performansne metrike ako ste pristali na analitiku',
          'podatke o administratorskoj prijavi ako se koristi zaštićeni dio sustava',
          'postavke kolačića i lokalne preference koje odaberete na stranici',
        ],
      },
      {
        title: 'Svrhe i pravne osnove obrade',
        bullets: [
          'izvršenje radnji koje tražite, primjerice obrada rezervacijskog ili kontaktnog upita',
          'legitimni interes za sigurnost sustava, sprečavanje zlouporabe i osnovno održavanje stranice',
          'ispunjavanje zakonskih obveza ako su podaci potrebni radi računovodstvenih, poreznih ili regulatornih razloga',
          'privola za analitičke i marketinške kolačiće odnosno vanjske ugrađene sadržaje, kada je to primjenjivo',
        ],
      },
      {
        title: 'Primatelji i izvršitelji obrade',
        body: [
          'Podaci se mogu obrađivati kroz naše hosting, infrastrukturu, e-mail i komunikacijske alate te kroz tehničke dobavljače potrebne za rad stranice i upravljanje upitima.',
          'Ako odaberete učitavanje vanjskih sadržaja poput Google Maps ili Facebook widgeta, odgovarajući pružatelji tih usluga mogu obrađivati tehničke podatke u skladu sa svojim pravilima privatnosti.',
        ],
      },
      {
        title: 'Rokovi čuvanja',
        bullets: [
          'rezervacijski i kontaktni podaci čuvaju se onoliko dugo koliko je potrebno za obradu upita, internu evidenciju i eventualne povezane poslovne ili zakonske obveze',
          'sigurnosni i tehnički logovi čuvaju se razumno ograničeno radi dijagnostike, zaštite sustava i nadzora zlouporabe',
          'postavke kolačića čuvaju se do 180 dana ili do trenutka kada ih promijenite ili obrišete',
        ],
      },
      {
        title: 'Vaša prava',
        bullets: [
          'pravo na pristup podacima, ispravak i dopunu',
          'pravo na brisanje ili ograničenje obrade kada su ispunjeni zakonski uvjeti',
          'pravo na prigovor na obradu koja se temelji na legitimnom interesu',
          'pravo na povlačenje privole za kolačiće i slične tehnologije u bilo kojem trenutku',
          'pravo na podnošenje pritužbe nadležnom nadzornom tijelu, uključujući AZOP',
        ],
      },
    ],
  },
  en: {
    title: 'Privacy Policy',
    description: 'How Nautica collects, uses, and protects personal data connected to reservations, contact requests, and website use.',
    heroEyebrow: 'Privacy',
    heroTitle: 'Guest data should be handled with the same care as the visit itself.',
    heroBody: 'This policy explains which data we collect through the Nautica website, why we process it, how long we keep it, and how you can exercise your rights.',
    updatedLabel: 'Last updated',
    updatedAt: 'April 10, 2026',
    sections: [
      {
        title: 'Controller',
        body: [
          'The controller for the public Nautica website is Ugostiteljski obrt Tre bocconi, Vl. Irena Cvitan, DONJA RIVA 55, 22212 Tribunj, Croatia.',
          'For privacy questions or to exercise your rights, contact trebocconi@trebocconi.com or the phone number published on the website.',
        ],
      },
      {
        title: 'What we collect',
        bullets: [
          'data you submit in reservation or contact flows, such as your name, email address, phone number, date, time, party size, and special notes',
          'technical data needed for security, stability, and administration, including access logs, user agent details, and basic performance metrics if you have consented to analytics',
          'administrator login data if the protected admin area is used',
          'cookie settings and local preferences selected on the website',
        ],
      },
      {
        title: 'Purposes and legal bases',
        bullets: [
          'performing the actions you request, such as processing a reservation or contact enquiry',
          'our legitimate interest in system security, abuse prevention, and core website maintenance',
          'compliance with legal obligations where data is required for accounting, tax, or regulatory reasons',
          'consent for analytics and marketing cookies or external embedded content where required',
        ],
      },
      {
        title: 'Recipients and processors',
        body: [
          'Data may be processed through our hosting, infrastructure, email, and communication tools as well as technical providers required for website operation and enquiry handling.',
          'If you choose to load external content such as Google Maps or Facebook widgets, those providers may process technical data under their own privacy policies.',
        ],
      },
      {
        title: 'Retention',
        bullets: [
          'reservation and contact data is kept for as long as reasonably necessary to handle the enquiry, maintain internal records, and meet related business or legal obligations',
          'security and technical logs are kept for a limited period for diagnostics, protection of the service, and abuse monitoring',
          'cookie choices are stored for up to 180 days unless you change or delete them sooner',
        ],
      },
      {
        title: 'Your rights',
        bullets: [
          'the right of access, correction, and completion',
          'the right to erasure or restriction where the legal conditions are met',
          'the right to object to processing based on legitimate interests',
          'the right to withdraw cookie consent at any time',
          'the right to lodge a complaint with the competent supervisory authority, including AZOP',
        ],
      },
    ],
  },
};

const terms: Record<LocaleCode, LegalPageContent> = {
  hr: {
    title: 'Uvjeti korištenja',
    description: 'Pravila korištenja Nautica web stranice, rezervacijskih i kontaktnih funkcionalnosti te informativnog sadržaja.',
    heroEyebrow: 'Uvjeti',
    heroTitle: 'Javna stranica treba biti jasna, elegantna i po pravilima korištenja jednako čitljiva kao i ostatak iskustva.',
    heroBody: 'Ovi uvjeti uređuju korištenje Nautica web stranice, javnog sadržaja, obrasca za rezervacije, kontaktnih funkcionalnosti i povezanih vanjskih poveznica.',
    updatedLabel: 'Zadnje ažuriranje',
    updatedAt: '10. travnja 2026.',
    sections: [
      {
        title: 'Opseg i prihvat uvjeta',
        body: [
          'Korištenjem ove web stranice potvrđujete da ste pročitali i prihvatili ove uvjete u mjeri u kojoj su primjenjivi na vaše korištenje stranice.',
          'Ako se s uvjetima ne slažete, nemojte koristiti funkcionalnosti koje uključuju slanje podataka, rezervacije ili prijavu na zaštićena područja.',
        ],
      },
      {
        title: 'Informativni sadržaj',
        bullets: [
          'nastojimo održavati točne informacije o radnom vremenu, događanjima, meniju i kontaktu, ali sadržaj se može promijeniti bez prethodne najave',
          'objavljeni vizuali, opisi i termini služe kao informativni prikaz i ne predstavljaju zasebnu ugovornu ponudu ako nije izričito navedeno',
        ],
      },
      {
        title: 'Rezervacije i upiti',
        bullets: [
          'slanje zahtjeva kroz stranicu ne znači automatsku potvrdu rezervacije; konačna potvrda ovisi o stvarnoj dostupnosti, operativnim uvjetima i eventualnim posebnim pravilima događanja',
          'dužni ste unijeti točne i potpune podatke koji su potrebni za obradu upita',
          'zadržavamo pravo odbiti, odgoditi ili dodatno provjeriti upite koji su očito netočni, zloupotrebljavajući ili operativno neprovedivi',
        ],
      },
      {
        title: 'Dopušteno korištenje',
        bullets: [
          'nije dopušteno pokušavati neovlašten pristup, ometati rad stranice, automatizirano preuzimati sadržaj ili koristiti stranicu protivno primjenjivim propisima',
          'nije dopušteno unositi zlonamjeran kod, spam ili lažne rezervacije i prijave',
        ],
      },
      {
        title: 'Intelektualno vlasništvo',
        body: [
          'Tekstovi, fotografije, identitet brenda, raspored sadržaja i drugi elementi stranice zaštićeni su pravima intelektualnog vlasništva u mjeri dopuštenoj zakonom.',
          'Bez prethodnog dopuštenja nije dopušteno kopirati, distribuirati ili komercijalno koristiti sadržaj osim u okvirima zakonskih iznimaka.',
        ],
      },
      {
        title: 'Vanjske poveznice i ugrađeni servisi',
        body: [
          'Stranica može sadržavati poveznice ili ugrađene sadržaje trećih strana, uključujući društvene mreže i mape. Za njihove sadržaje, uvjete i prakse privatnosti odgovorni su njihovi pružatelji.',
        ],
      },
    ],
  },
  en: {
    title: 'Terms of Use',
    description: 'Rules for using the Nautica website, reservation and contact features, and the site’s informational content.',
    heroEyebrow: 'Terms',
    heroTitle: 'The public website should stay clear, refined, and legally readable in the same way the rest of the experience is.',
    heroBody: 'These terms govern use of the Nautica website, its public content, reservation flow, contact features, and related external links.',
    updatedLabel: 'Last updated',
    updatedAt: 'April 10, 2026',
    sections: [
      {
        title: 'Scope and acceptance',
        body: [
          'By using this website, you confirm that you have read and accepted these terms to the extent they apply to your use of the site.',
          'If you do not agree with them, do not use the functions that involve sending data, making reservation requests, or signing into protected areas.',
        ],
      },
      {
        title: 'Informational content',
        bullets: [
          'we aim to keep opening hours, events, menu information, and contact details accurate, but content may change without prior notice',
          'published visuals, descriptions, and time slots are informational and do not by themselves form a separate binding offer unless explicitly stated',
        ],
      },
      {
        title: 'Reservations and enquiries',
        bullets: [
          'sending a request through the website does not automatically confirm a reservation; final confirmation depends on real availability, operational conditions, and any specific event rules',
          'you are responsible for providing accurate and complete information needed to process the request',
          'we may refuse, delay, or further verify requests that are clearly inaccurate, abusive, or operationally unworkable',
        ],
      },
      {
        title: 'Permitted use',
        bullets: [
          'you must not attempt unauthorized access, interfere with the site, scrape content at scale, or use the website in breach of applicable law',
          'you must not submit malicious code, spam, or false reservations and sign-ups',
        ],
      },
      {
        title: 'Intellectual property',
        body: [
          'Texts, photography, brand identity, content structure, and other elements of the site are protected by intellectual property rights to the extent provided by law.',
          'Without prior permission, you may not copy, distribute, or commercially reuse content except where a legal exception applies.',
        ],
      },
      {
        title: 'External links and embeds',
        body: [
          'The website may contain third-party links or embedded content, including social platforms and maps. Their providers remain responsible for their own content, terms, and privacy practices.',
        ],
      },
    ],
  },
};

const cookies: Record<LocaleCode, LegalPageContent> = {
  hr: {
    title: 'Politika kolačića',
    description: 'Objašnjenje kolačića, local storage zapisa i vanjskih sadržaja koji se mogu učitati na Nautica web stranici.',
    heroEyebrow: 'Kolačići',
    heroTitle: 'Kolačići moraju biti jasni, kontrolabilni i svedeni samo na ono što stvarno treba raditi.',
    heroBody: 'Na stranici koristimo nužne tehnologije za rad servisa te opcionalne kategorije za preference, analitiku i vanjske sadržaje. Opcionalne kategorije možete prihvatiti ili odbiti te promijeniti kasnije.',
    updatedLabel: 'Zadnje ažuriranje',
    updatedAt: '10. travnja 2026.',
    sections: [
      {
        title: 'Kako sustav pristanka radi',
        body: [
          'Pri prvom posjetu prikazujemo izbor za kolačiće i slične tehnologije. Nužne stavke ostaju aktivne jer su potrebne za rad stranice, a ostale kategorije uključuju se tek nakon vašeg pristanka.',
          'Svoje postavke možete promijeniti u bilo kojem trenutku kroz postavke kolačića dostupne u podnožju stranice.',
        ],
      },
      {
        title: 'Nužni kolačići i slične tehnologije',
        bullets: [
          'admin session cookie poput nautica.sid za zaštićeni administratorski dio',
          'nautica_cookie_consent za spremanje vašeg izbora kolačića',
          'tehnički mehanizmi potrebni za sigurnost, usmjeravanje zahtjeva i slanje obrazaca koje ste izričito pokrenuli',
        ],
      },
      {
        title: 'Preference',
        bullets: [
          'spremanje jezika stranice u lokalnu pohranu',
          'spremanje stanja poput odbačenih obavijesti ili drugih nenametljivih korisničkih preferencija',
        ],
      },
      {
        title: 'Analitika',
        bullets: [
          'ako pristanete, koristimo osnovne performansne metrike web-vitals radi razumijevanja stabilnosti i brzine stranice',
          'ove metrike ne uključujemo dok ne dopustite analitičku kategoriju',
        ],
      },
      {
        title: 'Marketing i vanjski sadržaji',
        bullets: [
          'Google Maps widgeti i Facebook timeline učitavaju se tek nakon pristanka jer mogu postaviti kolačiće ili učitati sadržaj treće strane',
          'bez pristanka umjesto embedova prikazujemo lokalni placeholder i mogućnost ručnog otvaranja vanjske stranice',
        ],
      },
      {
        title: 'Trajanje i upravljanje',
        bullets: [
          'postavke pristanka čuvamo do 180 dana',
          'kolačiće možete obrisati i kroz svoj preglednik, ali tada će stranica ponovno tražiti vaš izbor',
          'ako ograničite nužne tehnologije kroz preglednik, dijelovi stranice možda neće raditi ispravno',
        ],
      },
    ],
  },
  en: {
    title: 'Cookie Policy',
    description: 'An explanation of cookies, local storage entries, and external content that may load on the Nautica website.',
    heroEyebrow: 'Cookies',
    heroTitle: 'Cookies should stay clear, controllable, and limited to what the site actually needs to do.',
    heroBody: 'We use necessary technologies for core site operation as well as optional categories for preferences, analytics, and external content. Optional categories remain off until you allow them, and you can change your choice later.',
    updatedLabel: 'Last updated',
    updatedAt: 'April 10, 2026',
    sections: [
      {
        title: 'How the consent flow works',
        body: [
          'On your first visit, we show a choice for cookies and similar technologies. Necessary items remain active because they are required for the service, while other categories only turn on after your consent.',
          'You can change your settings at any time through the cookie settings entry available in the footer.',
        ],
      },
      {
        title: 'Necessary cookies and similar technologies',
        bullets: [
          'an admin session cookie such as nautica.sid for the protected administration area',
          'nautica_cookie_consent to store your cookie choice',
          'technical mechanisms required for security, routing, and processing forms you explicitly submit',
        ],
      },
      {
        title: 'Preferences',
        bullets: [
          'storing the selected site language in local storage',
          'storing state such as dismissed announcements or other lightweight user preferences',
        ],
      },
      {
        title: 'Analytics',
        bullets: [
          'if you consent, we use basic web-vitals performance metrics to understand stability and speed',
          'these metrics stay off until you allow the analytics category',
        ],
      },
      {
        title: 'Marketing and external content',
        bullets: [
          'Google Maps widgets and the Facebook timeline only load after consent because they may set cookies or load third-party content',
          'without consent, we show a local placeholder and the option to open the external service manually',
        ],
      },
      {
        title: 'Duration and control',
        bullets: [
          'we keep your consent settings for up to 180 days',
          'you can also clear cookies through your browser, but the site will then ask for your choice again',
          'if you block necessary technologies through your browser, parts of the site may not work correctly',
        ],
      },
    ],
  },
};

const legalDocuments: Record<LegalDocumentKey, Record<LocaleCode, LegalPageContent>> = {
  privacy,
  terms,
  cookies,
};

export const getLegalDocument = (key: LegalDocumentKey, locale: LocaleCode) => legalDocuments[key][locale];
