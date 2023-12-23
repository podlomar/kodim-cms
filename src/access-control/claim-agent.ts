import { Agent, Cursor } from "filefish/cursor";
import { EntryQuery } from "./parse-entry-query.js";
import { matchQuery } from "./match-query.js";

export const claimsAgent = (quries: EntryQuery[]): Agent => {
  return {
    getPermission: (cursor: Cursor): 'open' | 'locked' => {
      for (const q of quries) {
        if(matchQuery(cursor, q)) {
          return 'open';
        }
      }

      return 'locked';
    }
  }
};
