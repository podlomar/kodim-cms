interface Creator<E extends Entry> {
    make(entry: E): Provider<E>;
}
interface Entry {
    title: string;
}
interface PokusEntry extends Entry {
}
interface Provider<E> {
    fetch(): E;
}
declare class StringProvider implements Provider<string> {
    fetch(): string;
}
declare class Store<T = never> {
    entries: T[];
    constructor();
    static create<T>(entries: T[]): Store<T>;
    use<E extends Entry>(func: (entry: E) => Provider<E>): Store<T | E>;
    wrap(entry: T): Provider<T>;
}
declare const pokus: Store<PokusEntry>;
