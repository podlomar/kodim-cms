export class AccessDenyAll {
    accepts() {
        return false;
    }
    step() {
        return this;
    }
}
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
export class AccessClaimCheck {
    constructor(states, currentStates, user) {
        this.states = states;
        this.currentStates = currentStates;
        this.user = user;
    }
    static create(user, ...claims) {
        const states = [
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
    accepts() {
        return true;
    }
    step(entry) {
        const nextStates = new Set();
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
            }
            else {
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
export class AccessGrantAll {
    accepts() {
        return true;
    }
    step() {
        return this;
    }
}
