import { ResourceProvider } from "./provider";

type ChildOf<T> = T extends ResourceProvider<infer C> 
  ? C 
  : never; 

export interface Query {
  getProvider(): ResourceProvider | null;
  find(link: string): Query;
  search(...links: string[]): Query
}

export class NotFoundQuery implements Query {
  public getProvider(): null {
    return null;    
  }

  public find(link: string): this {
    return this;
  }

  public search(...links: string[]): this {
    return this;
  }
}

export class SuccessQuery<P extends ResourceProvider = ResourceProvider> implements Query {
  private readonly provider: P;

  public constructor(provider: P) {
    this.provider = provider;
  }
  
  public getProvider(): P {
    return this.provider;    
  }

  public find(link: string): SuccessQuery<ChildOf<P>> | NotFoundQuery {
    const childProvider = this.provider.find(link);
    if (childProvider === null) {
      return new NotFoundQuery();
    }
    
    return new SuccessQuery<ChildOf<P>>(childProvider as ChildOf<P>);
  }

  public search(...links: string[]): SuccessQuery | NotFoundQuery {
    const childProvider = this.provider.search(...links);
    if (childProvider === null) {
      return new NotFoundQuery();
    }
    
    return new SuccessQuery(childProvider);
  }
}