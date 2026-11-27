/** Optional dependency — live crawl uses Crawlee when installed. */
declare module "crawlee" {
  export class CheerioCrawler {
    constructor(options: {
      maxRequestsPerCrawl: number;
      requestHandler: (ctx: {
        request: { url: string };
        $: CheerioAPI;
      }) => Promise<void>;
      errorHandler?: (ctx: { request: { url: string } }, err: Error) => void;
    });
    run(urls: string[]): Promise<void>;
  }

  type CheerioAPI = {
    (selector: string): { text: () => string };
    root: () => { text: () => string };
  };
}
