import { isDemo } from "./demo/config";

/**
 * While true, every public page on the live site shows the "under construction"
 * notice instead of its content (Brittany is still correcting the wording).
 * The admin keeps working, and the GitHub Pages demo still shows the full site
 * so the wording can be reviewed there. Set to false to launch.
 */
const UNDER_CONSTRUCTION = true;

export const underConstruction = UNDER_CONSTRUCTION && !isDemo;
