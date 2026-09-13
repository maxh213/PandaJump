type Random = () => number;

export interface Options {
  readonly random: Random;
  readonly timeScale: number;
}

const scriptedRandom = (script: string): Random => {
  const values = script.split(",");
  let index = 0;
  return () => {
    const value = Number(values[index % values.length]);
    index += 1;
    return value;
  };
};

export const readOptions = (search: string, random: Random): Options => {
  const params = new URLSearchParams(search);
  const script = params.get("random");
  return {
    random: script === null ? random : scriptedRandom(script),
    timeScale: params.get("clock") === "manual" ? 0 : 1,
  };
};
