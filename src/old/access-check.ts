import { Entry } from "./entry.js";

export interface User {
  login: string,
  access: 'public' | 'registered',
}

export interface AccessCheck {
  accepts(): boolean;
  step(entry: Entry): AccessCheck;
}

export class AccessDenyAll implements AccessCheck {
  public accepts(): boolean {
    return false;
  }

  public step(): AccessCheck {
    return this;
  }
}

export interface Transition {
  stateIdx: number,
  regex: RegExp;
  pattern: string,
}

export interface State {
  index: number,
  next: Transition[];
}

const regexFromPattern = (pattern: string): RegExp => {
  const parts = pattern.split('*');

  if (parts.length === 1) {
    return new RegExp(`^${parts[0]}$`);
  }

  return new RegExp(`^${parts.join('.*')}$`);
}

const addClaim = (states: State[], claim: string, stateIdx: number = 0): void => {
  if (claim === '') {
    return;
  }
    
  const slashIdx = claim.indexOf('/');
    
  const [pattern, rest] = slashIdx === -1
    ? [claim, '']
    : [claim.substring(0, slashIdx), claim.substring(slashIdx + 1)];
  
  if (pattern === '') {
    addClaim(states, rest, stateIdx);
    return;
  }

  const state = states[stateIdx];
  const transIdx = state.next.findIndex((trans) => trans.pattern === pattern);
  
  if (transIdx === -1) {
    const newStateIdx = states.length;
    
    if (pattern === '**') {
      state.next.push({ 
        pattern: '*',
        regex: regexFromPattern('*'),
        stateIdx
      });
      return;
    }
    
    const newState = { index: newStateIdx, next: [] };
    states.push(newState);
    state.next.push({ 
      pattern,
      regex: regexFromPattern(pattern), 
      stateIdx: newStateIdx 
    });
    addClaim(states, rest, newStateIdx);
    return;
  }

  addClaim(states, rest, state.next[transIdx].stateIdx);
}

export class AccessClaimCheck implements AccessCheck {
  private states: State[];
  private currentStates: Set<number>;
  private user: User;

  private constructor(
    states: State[],
    currentStates: Set<number>,
    user: User,
  ) {
    this.states = states;
    this.currentStates = currentStates;
    this.user = user;
  }

  public static create(user: User, ...claims: string[]): AccessClaimCheck {
    const states: State[] = [
      {
        index: 0,
        next: [],
      }
    ];

    for (const claim of claims) {
      addClaim(states, claim);
    }

    return new AccessClaimCheck(states, new Set([0]), user);
  }

  public accepts(): boolean {
    return true;
  }

  public step(entry: Entry): AccessCheck {
    const nextStates = new Set<number>();

    for (const stateIdx of this.currentStates) {
      const state = this.states[stateIdx];
      for (const transition of state.next) {
        if (transition.regex.test(entry.link)) {
          nextStates.add(transition.stateIdx);
        }
      }
    }

    if (entry.access === 'deny') {
      return new AccessDenyAll();
    }

    if (entry.draft) {
      if (entry.authors.includes(this.user.login)) {
        return new AccessClaimCheck(this.states, nextStates, this.user);
      } else {
        return new AccessDenyAll();
      }
    }

    if (entry.access === 'public') {
      return new AccessClaimCheck(this.states, nextStates, this.user);
    }

    if (entry.access === 'logged-in' && this.user.access === 'registered') {
      return new AccessClaimCheck(this.states, nextStates, this.user);
    }
    
    if (nextStates.size === 0) {
      return new AccessDenyAll();
    }
    
    return new AccessClaimCheck(this.states, nextStates, this.user);
  }
}

export class AccessGrantAll implements AccessCheck {
  public accepts(): boolean {
    return true;
  }

  public step(): this {
    return this;
  }
}
