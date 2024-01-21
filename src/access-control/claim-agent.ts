import { Agent, Cursor } from "filefish/cursor";
import { AccessRule, parseAccessRule } from "./parse-access-rule.js";
import { matchAccessRule } from "./match-access-rule.js";
import { Result } from "monadix/result";

export class ClaimsAgent implements Agent {
  private readonly rules: AccessRule[];

  public constructor(rules: string[]) {
    this.rules = Result.collectSuccess(rules.map(parseAccessRule));
  }

  public getPermission(cursor: Cursor): 'open' | 'locked' {
    for (const rule of this.rules) {
      if(matchAccessRule(cursor, rule)) {
        return 'open';
      }
    }

    return 'locked';
  }
}

export class PublicAgent implements Agent {
  public getPermission(): 'open' | 'locked' {
    return 'locked';
  }
}

export type CmsAgent = ClaimsAgent | PublicAgent;
