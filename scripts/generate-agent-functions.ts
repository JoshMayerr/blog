import { mkdir, writeFile } from "node:fs/promises";
import { stringify } from "yaml";
import {
  functions,
  openapi,
  skill,
  type FunctionSlug,
} from "../lib/tollbit/contracts";
import { raceOpenapi, raceSkill } from "../lib/race/contract";
import { bookRaceOpenapi, bookRaceSkill } from "../lib/book-race/contract";
async function main() {
  // Preserve older version directories; generate the current book contract.
  await mkdir("agent-functions/joshmayer-race/v3.1.0", { recursive: true });
  await writeFile("agent-functions/joshmayer-race/v3.1.0/openapi.yaml", stringify(bookRaceOpenapi("https://www.joshmayer.net"), { aliasDuplicateObjects: false }));
  await writeFile("agent-functions/joshmayer-race/v3.1.0/SKILL.md", bookRaceSkill);
  await mkdir("agent-functions/joshmayer-race", { recursive: true });
  await writeFile(
    "agent-functions/joshmayer-race/openapi.yaml",
    stringify(raceOpenapi("https://www.joshmayer.net"), {
      aliasDuplicateObjects: false,
    }),
  );
  await writeFile("agent-functions/joshmayer-race/SKILL.md", raceSkill);
  for (const slug of Object.keys(functions) as FunctionSlug[]) {
    await mkdir(`agent-functions/${slug}`, { recursive: true });
    await writeFile(
      `agent-functions/${slug}/openapi.yaml`,
      stringify(openapi(slug, "https://www.joshmayer.net"), {
        aliasDuplicateObjects: false,
      }),
    );
    await writeFile(`agent-functions/${slug}/SKILL.md`, skill(slug));
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
