import dayjs from "dayjs";
import { Agent, Cursor, publicAgent as pAgent } from "filefish/cursor";
import { AccessRule, parseAccessRule } from "./parse-access-rule.js";
import { matchAccessRule } from "./match-access-rule.js";
import { Result } from "monadix/result";

export const publicAgent = pAgent;

export class ClaimsAgent implements Agent {
  private readonly rules: AccessRule[];

  public constructor(rules: string[]) {
    this.rules = Result.collectSuccess(rules.map(parseAccessRule));
  }

  public getPermission(cursor: Cursor): 'open' | 'locked' {
    const now = dayjs();
    for (const rule of this.rules) {
      if(matchAccessRule(cursor, rule, now)) {
        return 'open';
      }
    }

    return 'locked';
  }
}

export type CmsAgent = ClaimsAgent | typeof pAgent;
