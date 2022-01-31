export interface Transition {
    stateIdx: number;
    regex: RegExp;
    pattern: string;
}
export interface State {
    index: number;
    next: Transition[];
}
export interface Access {
    accepts(): boolean;
    step(token: string): Access;
}
export declare class AccessMachine implements Access {
    private states;
    private currentStates;
    private constructor();
    static create(...claims: string[]): AccessMachine;
    accepts(): boolean;
    step(token: string): AccessMachine;
}
export declare class AccessGranted implements Access {
    accepts(): boolean;
    step(token: string): this;
}
