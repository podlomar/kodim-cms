import express, { Router, Request, Response } from 'express';
import { KodimCms } from '.';
import { ResourceProvider } from './content/provider';

export class CmsApp {
  public readonly router: Router;
  private cms: KodimCms;

  public constructor(cms: KodimCms) {
    this.cms = cms;
    
    this.router = express.Router();
    this.router.get(['/content/kurzy', '/content/kurzy/*'], this.handleGetEntry);
    this.router.get(['/assets/kurzy', '/assets/kurzy/*'], this.handleGetAsset); 
  }

  private getProviderByPath(path: string): ResourceProvider {
    const links = path.split('/');
    return this.cms.getRoot().search(...links);
  }

  private handleGetEntry = async (req: Request, res: Response) => {
    const provider = this.getProviderByPath(req.params[0] ?? '');    
    res.json(await provider.fetch());
  }

  private handleGetAsset = async (req: Request, res: Response) => {
    const lastSlashIndex = req.params[0].lastIndexOf('/');
    const fileName = req.params[0].slice(lastSlashIndex + 1);
    const providerPath = req.params[0].slice(0, lastSlashIndex);
    const assetPath = this.getProviderByPath(providerPath).asset(fileName);  
    res.sendFile(assetPath as string);
  };
}
