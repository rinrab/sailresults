import { Finishboard, FinishboardEntry, Racer, Series } from "./scoring";
import { getStoredObject, nextRacerId, setStoredObject } from "./storage";

export interface PackedSeries {
  name: string;
  racers: { name: string, number: string }[];
  finishboards: FinishboardEntry[][];
};

export const samples: PackedSeries[] = [
  {
    name: "Catastrophic Tacking Championship",
    racers: [
      { name: "Luca Bianchi", number: "ITA 174321" },
      { name: "Emma Williams", number: "GBR 219845" },
      { name: "Noah Andersen", number: "DEN 184572" },
      { name: "Sophie Martin", number: "FRA 207634" },
      { name: "Max Müller", number: "GER 193417" },
      { name: "Hugo Svensson", number: "SWE 176285" },
      { name: "Finn O'Connor", number: "IRL 201936" },
      { name: "Matej Novak", number: "SLO 188504" },
      { name: "Jan de Vries", number: "NED 212478" },
      { name: "Aleksander Kowalski", number: "POL 181059" },
      { name: "Carlos Rodríguez", number: "ESP 205614" },
      { name: "João Silva", number: "POR 190873" },
      { name: "Ethan Smith", number: "USA 221907" },
      { name: "Jack Thompson", number: "AUS 198362" },
      { name: "Yuki Tanaka", number: "JPN 175428" }
    ],
    finishboards: [
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, "DNF", 14, 13],
      [3, 1, 5, 2, 4, 8, 6, 7, 10, 9, "UFD", 11, 12, 13, 14],
      [2, 4, 1, 5, 3, 7, 8, 6, 9, 10, 11, 12, 13, "RET", 14],
      [5, 2, 4, 1, 3, 6, 9, 7, 8, 10, 12, 11, 13, 14, "DSQ"],
      [1, 3, 2, 4, 6, 5, 7, 9, 8, 10, 11, "NSC", 12, 13, 14],
      [2, 1, 4, 3, 5, 7, 6, 8, "UFD", 9, 10, 11, 12, 13, 14]
    ],
  },
  {
    name: "Optimist Unknown Geniuses",
    racers: [
      { name: "Captain Crumb", number: "GBR 6248" },
      { name: "Soggy Socks", number: "GBR 5187" },
      { name: "Tiny Tornado", number: "GBR 7314" },
      { name: "Little Kraken", number: "GBR 6452" },
      { name: "Admiral Noodle", number: "GBR 5830" },
      { name: "Sea Biscuit", number: "GBR 6173" },
      { name: "Mini Hurricane", number: "GBR 7021" },
      { name: "Wave Goblin", number: "GBR 6645" }
    ],
    finishboards: [
      [1, 2, 3, 4, 5, 6, 7, 8],
      [2, 1, 3, 4, 5, 6, 7, 8],
      [1, 2, 4, 3, 5, 6, 7, "DNF"],
      [1, 3, 2, 4, 5, 6, 7, 8]
    ]
  },
  {
    name: "Definitely Not The America's Cup",
    racers: [
      { name: "Sir Tacks-a-Lot", number: "USA 71" },
      { name: "Windy McWindface", number: "USA 84" },
      { name: "The Floating Potato", number: "USA 92" },
      { name: "Captain Mistake", number: "USA 103" },
      { name: "No Brakes Racing", number: "USA 117" },
      { name: "Oops I Capsized", number: "USA 131" }
    ],
    finishboards: [
      [1, 2, 3, 4, 5, 6],
      [2, 1, 4, 3, 5, 6],
      [1, 2, "UFD", 3, 4, 5],
      [2, 1, 3, "RET", 4, 5],
      [1, "BFD", 2, 3, 4, 5]
    ]
  },
  {
    name: "The Great Mediterranean Disaster",
    racers: [
      { name: "Luca Bianchi", number: "ITA 174321" },
      { name: "Marco Rossi", number: "ITA 182940" },
      { name: "Giulia Ferrari", number: "ITA 191233" },
      { name: "Matteo Romano", number: "ITA 203812" },
      { name: "Sofia Marino", number: "ITA 217654" },
      { name: "Alessandro Conti", number: "ITA 220918" },
      { name: "Chiara Moretti", number: "ITA 225104" },
      { name: "Davide Russo", number: "ITA 229871" },
      { name: "Francesca Gallo", number: "ITA 230442" }
    ],
    finishboards: [
      [1, 2, 3, 4, 5, 6, 7, 8, 9],
      [3, 1, 2, 5, 4, 6, 7, 8, 9],
      [2, 3, 1, 4, "DNF", 6, 7, 8, 9],
      [1, 2, 4, 3, 5, 6, "RET", 8, 9],
      [2, 1, 3, 4, 5, 6, 7, "DSQ", 9]
    ]
  },
  {
    name: "Ctrl+Alt+Sea",
    racers: [
      { name: "James.exe / Oliver.dll", number: "GBR 821" },
      { name: "Marco.exe / Luca.dll", number: "ITA 912" },
      { name: "Pierre.exe / Hugo.dll", number: "FRA 744" },
      { name: "Ryan.exe / Ethan.dll", number: "USA 638" },
      { name: "Noah.exe / Mikkel.dll", number: "DEN 887" },
      { name: "Kai.exe / Felix.dll", number: "GER 791" },
      { name: "Jack.exe / Liam.dll", number: "AUS 954" }
    ],
    finishboards: [
      [1, 2, 3, 4, 5, 6, 7],
      [2, 1, 4, 3, 5, "RET", 6],
      [1, 2, 3, 4, "UFD", 5, 6],
      [2, 1, 3, 4, 5, 6, 7],
      [1, 2, 3, 4, 5, 6, 7]
    ]
  },
  {
    name: "The Wet Socks Championship",
    racers: [
      { name: "Hans Splash", number: "GER 11231" },
      { name: "Karl Keelbreaker", number: "GER 11288" },
      { name: "Fritz FullSpeed", number: "GER 11342" },
      { name: "Otto Overboard", number: "GER 11401" },
      { name: "Lena Lighthouse", number: "GER 11477" },
      { name: "Marta MastFail", number: "GER 11503" },
      { name: "Nina NoWind", number: "GER 11588" },
      { name: "Max Mayday", number: "GER 11644" },
      { name: "Eva EscapeRoute", number: "GER 11710" },
      { name: "Felix Floating", number: "GER 11822" }
    ],
    finishboards: [
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      [2, 1, 4, 3, 5, 6, 7, 8, 9, 10],
      [1, 3, 2, 4, 5, 6, "DNF", 8, 9, 10],
      [2, 1, 3, 4, 5, 6, 7, 8, "NSC", 10],
      [1, 2, 3, 4, 5, 6, 7, "RET", 9, 10],
      [2, 1, 3, 4, "DNS", 6, 7, 8, 9, 10]
    ]
  },
  {
    name: "404 Wind Not Found",
    racers: [
      { name: "404 Sailor Missing", number: "SWE 404" },
      { name: "Null Pointer", number: "SWE 405" },
      { name: "Undefined Wind", number: "SWE 406" },
      { name: "Stack Overflow", number: "SWE 407" },
      { name: "Infinite Tack Loop", number: "SWE 408" }
    ],
    finishboards: [
      [1, 2, 3, 4, 5],
      [2, 1, 3, 4, 5],
      [1, 2, "DNF", 4, 5]
    ]
  }
];

export function importSeries(pack: PackedSeries, ) {
  const racers = getStoredObject<{ [key: number]: Racer }>("racers", () => ({}));
  const series = getStoredObject<{ [key: number]: Series }>("series", () => ({}));

  const seriesRacers: number[] = [];

  let firstId: number;
  for (const racer of pack.racers) {
    const id = nextRacerId();
    if (!firstId) {
      firstId = id;
    }
    racers[id] = {
      id: id,
      ...racer,
    };
    seriesRacers.push(id);
  }

  const finishboards: Finishboard[] = [];
  for (const packedBoard of pack.finishboards) {
    const newBoard = {};
    for (let i = 0; i < packedBoard.length; i++) {
      newBoard[firstId + i] = packedBoard[i];
    }
    finishboards.push(newBoard);
  }

  const seriesId = nextRacerId();
  const newSeries: Series = {
    id: seriesId,
    name: pack.name,
    finishboards: finishboards,
    draftFinishboard: null,
    racers: seriesRacers,
  };

  setStoredObject("racers", racers);
  setStoredObject("series", { ...series, [seriesId]: newSeries });

  return seriesId;
}
