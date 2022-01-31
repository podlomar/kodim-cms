import express, { Router, Request, Response } from 'express';
import { KodimCms } from '.';
import { ResourceProvider } from './content/provider';
import { Access, AccessGranted } from "./content/access.js";

export class CmsApp {
  public readonly router: Router;
  private cms: KodimCms;
  private getAccess: () => Access;

  public constructor(cms: KodimCms, getAccess: () => Access) {
    this.cms = cms;
    this.getAccess = getAccess;

    this.router = express.Router();
    this.router.use(express.json());
    this.router.get(['/content/kurzy', '/content/kurzy/*'], this.handleGetEntry);
    this.router.get(['/assets/kurzy', '/assets/kurzy/*'], this.handleGetAsset); 
    this.router.post('/hooks', this.handleHooks); 
  }

  private getProviderByPath(path: string): ResourceProvider {
    const links = path.split('/');
    const access = this.getAccess();
    return this.cms.getRoot(access).search(...links);
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

  private handleHooks = async (req: Request, res: Response) => {
    const url = req.body.repository.clone_url;
    const access = new AccessGranted();
    const provider = this.cms.getRoot(access).findRepo(url);
    console.log(url);
    if (provider === null) {
      res.sendStatus(400);
      return;
    }

    await provider?.reload();
    res.send(`reloaded ${url}`);
  }
}
