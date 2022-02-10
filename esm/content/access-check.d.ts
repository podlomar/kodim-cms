import { Entry } from "./entry.js";
export interface User {
    login: string;
    access: 'public' | 'registered';
}
export interface AccessCheck {
    accepts(): boolean;
    step(entry: Entry): AccessCheck;
}
export declare class AccessDenyAll implements AccessCheck {
    accepts(): boolean;
    step(): AccessCheck;
}
export interface Transition {
    stateIdx: number;
    regex: RegExp;
    pattern: string;
}
export interface State {
    index: number;
    next: Transition[];
}
export declare class AccessClaimCheck implements AccessCheck {
    private states;
    private currentStates;
    private user;
    private constructor();
    static create(user: User, ...claims: string[]): AccessClaimCheck;
    accepts(): boolean;
    step(entry: Entry): AccessCheck;
}
export declare class AccessGrantAll implements AccessCheck {
    accepts(): boolean;
    step(): this;
}
