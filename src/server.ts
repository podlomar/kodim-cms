import express, { Router, Request, Response } from 'express';
import { KodimCms } from '.';
import { Query } from './core/query';
// import { AccessCheck, AccessGrantAll } from "./content/access-check.js";

export class CmsApp {
  public readonly router: Router;
  private cms: KodimCms;
  // private getAccessCheck: () => AccessCheck;

  public constructor(cms: KodimCms/*, getAccessCheck: () => AccessCheck*/) {
    this.cms = cms;
    // this.getAccessCheck = getAccessCheck;

    this.router = express.Router();
    this.router.use(express.json());
    this.router.get(['/content/kurzy', '/content/kurzy/*'], this.handleGetEntry);
    // this.router.get(['/assets/kurzy', '/assets/kurzy/*'], this.handleGetAsset); 
    // this.router.post('/hooks', this.handleHooks); 
  }

  private getQueryByPath(path: string): Query {
    const links = path.split('/');
    // const accessCheck = this.getAccessCheck();
    return this.cms.query().search(...links);
  }

  private handleGetEntry = async (req: Request, res: Response) => {
    const provider = this.getQueryByPath(req.params[0] ?? '');
    res.json(await provider.fetch());
  }

  //   private handleGetAsset = async (req: Request, res: Response) => {
  //     const lastSlashIndex = req.params[0].lastIndexOf('/');
  //     const fileName = req.params[0].slice(lastSlashIndex + 1);
  //     const providerPath = req.params[0].slice(0, lastSlashIndex);
  //     const assetPath = this.getProviderByPath(providerPath).asset(fileName);  

  //     if (assetPath === 'not-found') {
  //       res.sendStatus(404);
  //     } else if (assetPath === 'forbidden') {
  //       res.sendStatus(403);
  //     } else {
  //       res.sendFile(assetPath as string);
  //     }
  //   };

  //   private handleHooks = async (req: Request, res: Response) => {
  //     const url = req.body.repository.clone_url;
  //     const accessCheck = new AccessGrantAll();
  //     const provider = this.cms.getRoot(accessCheck).findRepo(url);
  //     console.log(url);
  //     if (provider === null) {
  //       res.sendStatus(400);
  //       return;
  //     }

  //     await provider?.reload();
  //     res.send(`reloaded ${url}`);
  //   }
}
