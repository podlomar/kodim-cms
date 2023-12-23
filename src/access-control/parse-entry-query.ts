import { Result } from 'monadix/result';

type PropertyValue = string | number | boolean | null;

interface PropertyFilter {
  readonly name: string;
  readonly op: string;
  readonly value: PropertyValue;
}

export interface EntryPattern {
  readonly name: string;
  readonly filter: PropertyFilter | null;
}

export class Tokenizer {
  public readonly input: string;
  public readonly index: number;
  public readonly value: string | null;

  private constructor(
    input: string,
    index: number,
    value: string | null,
  ) {
    this.input = input;
    this.index = index;
    this.value = value;
  }

  public static start(input: string): Tokenizer {
    return new Tokenizer(input, 0, '');
  }

  private success(index: number, value: string): Tokenizer {
    return new Tokenizer(this.input, index, value);
  }

  private fail(): Tokenizer {
    return new Tokenizer(this.input, this.index, null);
  }

  public isReady(): boolean {
    return this.value !== null;
  }

  public isEof(): boolean {
    return this.index === this.input.length;
  }

  public skipWs(): Tokenizer {
    if (!this.isReady()) {
      return this;
    }
    
    let index = this.index;
    while (index < this.input.length && this.input[index].match(/\s/) !== null) {
      index++;
    }

    return new Tokenizer(this.input, index, this.value);
  }

  private match(pattern: RegExp): Tokenizer {
    if (!this.isReady()) {
      return this;
    }
    
    if (this.isEof()) {
      return this.fail();
    }
    
    const match = this.input.slice(this.index).match(pattern);
    if (match === null) {
      return this.fail();
    }

    return this.success(this.index + match[0].length, match[0]);
  }
  
  public readChar(...chars: string[]): Tokenizer {
    if (!this.isReady()) {
      return this;
    }
    
    if (this.isEof()) {
      return this.fail();
    }
    
    if (chars.includes(this.input[this.index])) {
      return this.success(this.index + 1, this.input[this.index]);
    }
  
    return this.fail();
  }
  
  public readIdent(): Tokenizer {
    return this.match(/^[a-zA-Z_][a-zA-Z0-9_]*/);
  }
  
  public readStars(): Tokenizer {
    return this.match(/^\*\*?/);
  }

  public readOp(): Tokenizer {
    return this.match(/^!=|\*=|\^=|\$=|==|<=|>=|<|>|=/);
  }
  
  public readString = (): Tokenizer => {
    if (!this.isReady()) {
      return this;
    }
    
    if (this.isEof()) {
      return this.fail();
    }
    
    const [raw] = this.input.slice(this.index).match(/^"(?:(?=(\\?))\1.)*?"/) ?? [];
    if (raw === undefined) {
      return this.fail();
    }

    const value = JSON.parse(raw);
    return this.success(this.index + raw.length, value);
  }
  
  public readBoolean(): Tokenizer {
    return this.match(/^true|false/);
  }

  public readNull(): Tokenizer {
    return this.match(/^null/);
  }

  public readNumber(): Tokenizer {
    return this.match(/^[+-]?(\d+(\.\d*)?|\.\d+)/);
  }
};

interface SuccessResult<T> {
  readonly success: true;
  readonly value: T;
  readonly tokenizer: Tokenizer;
};

interface FailureResult {
  readonly success: false;
  readonly error: string;
  readonly index: number;
};

type ParseResult<T> = SuccessResult<T> | FailureResult;

const parseEntryName = (tokenizer: Tokenizer): ParseResult<string> => {
  let t = tokenizer.readStars();
  if (t.isReady()) {
    return { success: true, value: t.value!, tokenizer: t };
  }
  
  t = tokenizer.readIdent();
  if (t.isReady()) {
    return { success: true, value: t.value!, tokenizer: t };
  }
  
  return { success: false, error: 'Expected entry name pattern', index: tokenizer.index };
};

const parseValue = (tokenizer: Tokenizer): ParseResult<PropertyValue> => {
  let t = tokenizer.readString();
  if (t.isReady()) {
    return { success: true, value: t.value!, tokenizer: t };
  }

  t = tokenizer.readBoolean();
  if (t.isReady()) {
    return { success: true, value: t.value! === 'true', tokenizer: t };
  }

  t = tokenizer.readNull();
  if (t.isReady()) {
    return { success: true, value: null, tokenizer: t };
  }

  t = tokenizer.readNumber();
  if (t.isReady()) {
    return { success: true, value: Number(t.value!), tokenizer: t };
  }

  return { success: false, error: 'Expected value', index: tokenizer.index };
}

const parsePropertyFilter = (tokenizer: Tokenizer): ParseResult<PropertyFilter> => {
  let t: Tokenizer = tokenizer.readChar('[').skipWs().readChar('@').readIdent();
  if (!t.isReady()) {
    return {
      success: false,
      error: 'Expected property filter',
      index: t.index,
    };
  }

  const name = t.value!;

  t = t.skipWs().readOp();
  if (!t.isReady()) {
    return { 
      success: false,
      error: 'Expected property filter operator',
      index: tokenizer.index,
    };
  }
  
  const op = t.value!;
  t = t.skipWs();

  const valueResult = parseValue(t);
  if (!valueResult.success) {
    return valueResult;
  }
  
  t = valueResult.tokenizer.skipWs().readChar(']');
  if (!t.isReady()) {
    return {
      success: false,
      error: 'Expected closing bracket',
      index: tokenizer.index,
    };
  }

  return {
    success: true,
    value: { name, op, value: valueResult.value },
    tokenizer: t,
  };
}

const parseEntryPattern = (tokenizer: Tokenizer): ParseResult<EntryPattern> => {
  let t: Tokenizer = tokenizer.readChar('/');
  if (!t.isReady()) {
    return {
      success: false,
      error: 'Expected entry pattern',
      index: tokenizer.index,
    };
  }

  t = t.skipWs();
  const nameResult = parseEntryName(t);
  if (nameResult.success === false) {
    return nameResult;
  }

  t = nameResult.tokenizer.skipWs();
  const filterResult = parsePropertyFilter(t);
  if (filterResult.success === false) {
    return {
      success: true,
      value: {
        name: nameResult.value,
        filter: null,
      },
      tokenizer: nameResult.tokenizer,
    };
  }
  
  return {
    success: true,
    value: {
      name: nameResult.value,
      filter: filterResult.value,
    },
    tokenizer: filterResult.tokenizer,
  };
}

export type EntryQuery = EntryPattern[];

export const parseEntryQuery = (input: string): Result<EntryQuery, string> => {
  const query: EntryPattern[] = [];
  let t = Tokenizer.start(input).skipWs();
  
  while (!t.isEof()) {
    const entryResult = parseEntryPattern(t);
    if (entryResult.success === false) {
      return Result.fail(`Parse error at ${entryResult.index}: ${entryResult.error}`);
    }

    query.push(entryResult.value);
    t = entryResult.tokenizer.skipWs();
  }

  return Result.success(query);
}
