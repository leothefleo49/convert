/**
 * Fork configuration — edit this file when you fork this project.
 *
 * HOW THE CHAIN WORKS (fork-of-fork-of-fork topology):
 *
 *   p2r3/convert (original)
 *     └── leothefleo49/convert  ← syncs from p2r3 via sync-upstream.yml
 *           └── alice/convert   ← syncs from leothefleo49 via sync-from-parent.yml
 *                 └── bob/convert ← syncs from alice via sync-from-parent.yml
 *                       └── ∞ can continue arbitrarily deep
 *
 * Each fork ONLY needs to sync from its IMMEDIATE parent.
 * When alice triggers sync from leothefleo49, she gets all changes already
 * merged into leothefleo49 (including anything from p2r3). She does NOT need
 * a separate workflow for p2r3.
 *
 * WHAT syncSources IS FOR:
 *   - Each entry generates a STATUS card in the Sync Manager UI showing
 *     how many commits behind you are from that ancestor.
 *   - You only need a workflowFile for your IMMEDIATE parent.
 *     For ancestors further up, set workflowFile: "" or any name —
 *     those entries are status-only and the trigger button is disabled
 *     unless you have a workflow file set.
 *   - The "Sync from Parent" shortcut button always uses the LAST entry
 *     (your nearest parent).
 *
 * QUICK SETUP (if you forked leothefleo49/convert):
 *   1. Set `owner` to your GitHub username.
 *   2. Add a second entry to syncSources for leothefleo49 with your new
 *      workflow file name (e.g. "sync-from-parent.yml").
 *   3. Copy+tweak .github/workflows/sync-upstream.yml → sync-from-parent.yml,
 *      changing the upstream URL to leothefleo49/convert.
 *   4. Set `public contributor = "yourHandle"` on any handlers you add.
 *
 * EXAMPLE for alice forking leothefleo49:
 *
 *   owner: "alice",
 *   syncSources: [
 *     {
 *       owner: "p2r3", repo: "convert", branch: "master",
 *       displayName: "p2r3 (original)",
 *       workflowFile: "",            // status only — alice doesn't sync directly from p2r3
 *     },
 *     {
 *       owner: "leothefleo49", repo: "convert", branch: "master",
 *       displayName: "leothefleo49 (parent)",
 *       workflowFile: "sync-from-parent.yml",  // alice's actual sync workflow
 *     },
 *   ]
 *
 * ARBITRARY DEPTH: works correctly. A 10-level-deep fork just has 10 entries
 * in syncSources. The Sync Manager renders one status card per entry.
 * The chain of status checks is purely informational — each fork owner is
 * responsible for syncing their own fork from their own parent.
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
