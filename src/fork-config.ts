/**
 * Fork configuration — edit this file when you fork this project.
 *
 * QUICK SETUP (if you forked leothefleo49/convert):
 *   1. Change `owner` to your GitHub username.
 *   2. Add a second entry to `syncSources` for leothefleo49 (see example below).
 *   3. Create a `.github/workflows/sync-from-parent.yml` workflow that syncs
 *      from leothefleo49/convert — mirror how sync-upstream.yml works.
 *
 * EXAMPLE for a fork-of-a-fork:
 *   owner: "yourHandle",
 *   syncSources: [
 *     {
 *       owner: "p2r3", repo: "convert", branch: "master",
 *       displayName: "p2r3 (original)",
 *       workflowFile: "sync-upstream.yml",
 *     },
 *     {
 *       owner: "leothefleo49", repo: "convert", branch: "master",
 *       displayName: "leothefleo49 (parent)",
 *       workflowFile: "sync-from-parent.yml",
 *     },
 *   ]
 *
 * The Sync Manager UI reads this config to show per-source status, trigger
 * individual syncs, or sync all sources in chain order (root → parent).
 *
 * The filter buttons and stats bar also read contributor names from handlers
 * — set `public contributor = "yourHandle"` in any handler you add.
 */

export interface SyncSource {
  /** GitHub username of the source repo owner */
  owner: string;
  /** Repository name */
  repo: string;
  /** Branch to sync from */
  branch: string;
  /** Label shown in the Sync Manager UI */
  displayName: string;
  /** GitHub Actions workflow filename in THIS repo to trigger for this source */
  workflowFile: string;
}

export const FORK_CONFIG = {
  /** GitHub username of THIS fork's owner */
  owner: "leothefleo49",
  /** Repository name */
  repo: "convert",
  /** Primary working branch */
  branch: "master",

  /**
   * Sync sources ordered from root → nearest ancestor.
   * The Sync Manager shows an independent status card and trigger buttons
   * for each source. Add entries for every fork in your ancestry chain.
   */
  syncSources: [
    {
      owner: "p2r3",
      repo: "convert",
      branch: "master",
      displayName: "p2r3 (original)",
      workflowFile: "sync-upstream.yml",
    },
  ] as SyncSource[],
};
