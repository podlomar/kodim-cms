const regexFromPattern = (pattern) => {
    const parts = pattern.split('*');
    if (parts.length === 1) {
        return new RegExp(`^${parts[0]}$`);
    }
    return new RegExp(`^${parts.join('.*')}$`);
};
const addClaim = (states, claim, stateIdx = 0) => {
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
};
export class AccessMachine {
    constructor(states, currentStates) {
        this.states = states;
        this.currentStates = currentStates;
    }
    static create(...claims) {
        const states = [
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
    accepts() {
        return this.currentStates.size > 0;
    }
    step(token) {
        const nextStates = new Set();
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
export class AccessGranted {
    accepts() {
        return true;
    }
    step(token) {
        return this;
    }
}
export class AccessDenied {
    accepts() {
        return false;
    }
    step(token) {
        return this;
    }
}
