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

export interface Access {
  accepts(): boolean;
  step(token: string): Access;
}

export class AccessMachine implements Access {
  private states: State[];
  private currentStates: Set<number>;

  private constructor(states: State[], currentStates: Set<number>) {
    this.states = states;
    this.currentStates = currentStates;
  }

  public static create(...claims: string[]): AccessMachine {
    const states: State[] = [
      {
        index: 0,
        next: [],
      }
    ];

    for (const claim of claims) {
      addClaim(states, claim);
    }

    return new AccessMachine(states, new Set([0]));
  }

  public accepts(): boolean {
    return this.currentStates.size > 0;
  }

  public step(token: string): AccessMachine {
    const nextStates = new Set<number>();

    for (const stateIdx of this.currentStates) {
      const state = this.states[stateIdx];
      for (const transition of state.next) {
        if (transition.regex.test(token)) {
          nextStates.add(transition.stateIdx);
        }
      }
    }

    return new AccessMachine(this.states, nextStates);
  }
}

export class AccessGranted implements Access {
  public accepts(): boolean {
    return true;
  }

  public step(token: string): this {
    return this;
  }
}