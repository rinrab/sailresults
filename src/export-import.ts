import { dsqs, FinishboardEntry } from "./scoring";
import { PackedSeries } from "./storage"

function escape(str: string) {
  return str.replace(",", "").replace("\n", "")
}

function parseEntry(str: string): FinishboardEntry {
  const num = parseInt(str);
  if (! isNaN(num)) {
    if (num < 1) {
      throw new Error("entry can't be less than 1");
    } else {
      return num;
    }
  } else {
    if (dsqs[str]) {
      return str as FinishboardEntry;
    } else {
      throw new Error(`'${str}' is an invalid entry`);
    }
  }
}

export function fromCSV(csv: string): PackedSeries {
  const racers = [];
  const finishboard = [];
  let racesCount = -1;
  let max = 0;

  for (const line of csv.split("\n")) {
    const fields = line.split(",");

    if (fields.length == 0) {
      continue;
    }

    if (racesCount == -1) {
      racesCount = fields.length - 2;
      if (racesCount < 0) {
        throw new Error("must be at least two columns");
      }

      for (let i = 0; i < racesCount; i++) {
        finishboard.push([]);
      }
    }

    if (fields.length - 2 != racesCount) {
      throw new Error("malformed CSV table");
    }

    const [name, number, ...scores] = fields;

    for (let i = 0; i < racesCount; i++) {
      const entry = parseEntry(scores[i]);
      finishboard[i].push(entry);
      if (typeof(entry) == "number" && entry > max) {
        max = entry;
      }
    }

    racers.push({
      name: name,
      number: number,
    });
  }

  return {
    name: "",
    racers: racers,
    finishboards: finishboard,
  };
}

export function toCSV(series: PackedSeries): string {
  return series.racers
    .map(
      (racer, racerIndex) => [
        escape(racer.name),
        escape(racer.number),
        ...series.finishboards.map(race => race[racerIndex]),
      ].join(",")
    ).join("\n");
}

export function doExport(series: PackedSeries) {
  const csv = toCSV(series);

  const blob = new Blob([csv], { type: 'text/plain' });

  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${series.name}.csv`;

  link.click();

  URL.revokeObjectURL(link.href);
}

