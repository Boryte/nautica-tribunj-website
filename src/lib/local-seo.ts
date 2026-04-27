import type { FaqEntryDTO, LocaleCode } from '@shared/index';

export const supplementalFaqEntries: FaqEntryDTO[] = [
  {
    id: -1001,
    active: true,
    category: 'Location',
    sortOrder: 50,
    localizations: {
      hr: {
        question: 'Dolazimo iz Vodica ili Srime. Ima li smisla doći u Nauticu?',
        answer: 'Da. Nautica je dobar izbor za goste koji su smješteni u Vodicama ili Srimi i žele cocktail bar na rivi u Tribunju, mirniji sunset aperitivo ili večer uz more s rezervacijom unaprijed.',
      },
      en: {
        question: 'We are staying in Vodice or Srima. Is Nautica worth the trip?',
        answer: 'Yes. Nautica is a strong fit for guests staying in Vodice or Srima who want a seafront cocktail bar in Tribunj, a calmer sunset aperitivo, or a reserved evening by the sea.',
      },
    },
  },
  {
    id: -1002,
    active: true,
    category: 'Venue',
    sortOrder: 51,
    localizations: {
      hr: {
        question: 'Možemo li doći samo na kavu tijekom dana?',
        answer: 'Možete. Nautica nije samo večernji cocktail bar nego i caffe bar uz more, pa je mjesto jednako prirodno za jutarnju kavu, kasni popodnevni espresso ili lagani aperitivo pred zalazak.',
      },
      en: {
        question: 'Can we come just for coffee during the day?',
        answer: 'Yes. Nautica is not only an evening cocktail bar, but also a seafront coffee bar, so it works equally well for morning coffee, a late-afternoon espresso, or a light aperitivo before sunset.',
      },
    },
  },
  {
    id: -1003,
    active: true,
    category: 'Reservations',
    sortOrder: 52,
    localizations: {
      hr: {
        question: 'Jesu li potrebne rezervacije za sunset stolove?',
        answer: 'Za najtraženije termine oko zalaska i za stolove uz samu rivu rezervacija je snažno preporučena. Tako je veća šansa da dobijete pravi stol i pravi pogled, posebno vikendom i za event večeri.',
      },
      en: {
        question: 'Do we need a reservation for sunset tables?',
        answer: 'For the most requested sunset slots and front-row waterfront tables, a reservation is strongly recommended. It gives you a much better chance of getting the right table and the right view, especially on weekends and event nights.',
      },
    },
  },
  {
    id: -1004,
    active: true,
    category: 'Location',
    sortOrder: 53,
    localizations: {
      hr: {
        question: 'Postoji li parking u blizini rive u Tribunju?',
        answer: 'Parking ovisi o sezoni i gužvi, ali preporuka je doći nekoliko minuta ranije, posebno navečer. Nakon parkiranja najpraktičnije je nastaviti kratkom šetnjom do rive i Nautice.',
      },
      en: {
        question: 'Is there parking near the Tribunj waterfront?',
        answer: 'Parking depends on the season and the evening rush, so arriving a little earlier is recommended. From there, the easiest approach is usually a short walk down to the waterfront and Nautica.',
      },
    },
  },
  {
    id: -1005,
    active: true,
    category: 'Reservations',
    sortOrder: 54,
    localizations: {
      hr: {
        question: 'Primaju li se i gosti bez rezervacije?',
        answer: 'Da, kada raspoloživost to dopušta. Ako želite sigurnost za sunset termin, veće društvo ili posebnu večer, rezervacija je i dalje najbolji put.',
      },
      en: {
        question: 'Do you accept walk-ins as well?',
        answer: 'Yes, when availability allows it. If you want certainty for sunset, a larger group, or a special evening, reserving ahead is still the best option.',
      },
    },
  },
];

export const mergeFaqEntries = (entries: FaqEntryDTO[] | undefined): FaqEntryDTO[] => {
  const base = entries ?? [];
  const seenQuestions = new Set(base.map((entry) => entry.localizations.hr.question.trim().toLowerCase()));
  const extras = supplementalFaqEntries.filter((entry) => !seenQuestions.has(entry.localizations.hr.question.trim().toLowerCase()));

  return [...base, ...extras].sort((a, b) => {
    if (a.category !== b.category) return a.category.localeCompare(b.category, 'hr');
    return a.sortOrder - b.sortOrder;
  });
};

export const buildLocalAreaCards = (locale: LocaleCode) =>
  locale === 'hr'
    ? [
        {
          key: 'tribunj',
          title: 'Cocktail bar u Tribunju',
          body: 'Ako tražiš cocktail bar na samoj rivi u Tribunju, Nautica spaja jutarnju kavu, sunset aperitivo i večernji ritam bez osjećaja turističke buke.',
        },
        {
          key: 'vodice',
          title: 'Bar blizu Vodica',
          body: 'Za goste iz Vodica koji žele mirniji pogled, bolji zalazak i elegantniji tempo, Nautica je prirodan odmak prema Tribunju za kavu, koktel ili rezerviranu večer.',
        },
        {
          key: 'srima',
          title: 'Večer za goste iz Srime',
          body: 'Ako ste smješteni u Srimi i tražite mjesto uz more koje djeluje profinjenije i intimnije, Nautica je jednostavan izbor za kasno popodne i noć.',
        },
      ]
    : [
        {
          key: 'tribunj',
          title: 'A cocktail bar in Tribunj',
          body: 'If you are looking for a cocktail bar right on the Tribunj waterfront, Nautica ties together morning coffee, sunset aperitivo, and evening atmosphere without the usual tourist noise.',
        },
        {
          key: 'vodice',
          title: 'A seafront stop from Vodice',
          body: 'For guests staying in Vodice and looking for a calmer view, a better sunset, and a more refined pace, Nautica is a natural short detour toward Tribunj for coffee, cocktails, or a reserved evening.',
        },
        {
          key: 'srima',
          title: 'A nearby evening from Srima',
          body: 'If you are based in Srima and want a more polished and intimate place by the sea, Nautica is an easy choice for late afternoon and night.',
        },
      ];
