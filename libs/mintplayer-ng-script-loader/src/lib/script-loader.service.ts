import { DOCUMENT, isPlatformServer } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID, Renderer2, RendererFactory2 } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ScriptLoader {

  constructor(rendererFactory: RendererFactory2, @Inject(PLATFORM_ID) private platformId: any, @Inject(DOCUMENT) doc: any) {
    this.document = doc;
    this.renderer = rendererFactory.createRenderer(null, null);

    this.document.querySelectorAll('script[src]').forEach((tag) => {
      const scriptTag = <HTMLScriptElement>tag;
      this.allScripts.set(scriptTag.src, {
        tag: scriptTag,
        fullyLoaded: true,
        initiallyLoaded: true,
        promisesToResolve: [],
      });
    });

  }

  document: Document;
  renderer: Renderer2;
  allScripts = new Map<string, ScriptInformation>();

  public loadScript(src: string, windowCallback?: string) {
    return new Promise<any[]>((resolve, reject) => {
      src = src.replace('"', '');
      // Only act if in the browser
      if (isPlatformServer(this.platformId)) {
        return resolve([]);
      }

      // Check if we're already handling this script url
      const existingScript = this.allScripts.get(src);
      if (existingScript) {
        if (existingScript.fullyLoaded) {
          // Script is already in DOM, and we already got the loaded callback
          return resolve(existingScript.receivedArgs ?? []);
        } else {
          // Script is already being loaded, but we didn't get the callback yet
          existingScript.promisesToResolve.push(resolve);
          return;
        }
      } else {
        const scriptInfo: ScriptInformation = {
          fullyLoaded: false,
          initiallyLoaded: false,
          promisesToResolve: [resolve],
        };
        this.allScripts.set(src, scriptInfo);

        // Create scripttag
        const scriptTag: HTMLScriptElement = this.renderer.createElement('script');
        // scriptTag.type = 'text/javascript';
        scriptTag.src = src;
        scriptInfo.tag = scriptTag;

        // Setup callback
        if (windowCallback) {
          (<any>window)[windowCallback] = (...args: any[]) => {
            scriptInfo.fullyLoaded = true;
            scriptInfo.receivedArgs = args;
            scriptInfo.promisesToResolve.forEach((p) => p(args));
          };
        } else {
          scriptTag.addEventListener('load', (...args: any[]) => {
            scriptInfo.fullyLoaded = true;
            scriptInfo.receivedArgs = args;
            scriptInfo.promisesToResolve.forEach((p) => p(args));
          });
        }

        scriptTag.addEventListener('error', () => reject(`${src} failed to load`));

        // Insert in DOM
        const firstScriptTag = this.document.getElementsByTagName('script')[0];
        if (!firstScriptTag) {
          this.renderer.appendChild(this.document.head, scriptTag);
        } else if (firstScriptTag.parentNode) {
          this.renderer.insertBefore(firstScriptTag.parentNode, scriptTag, firstScriptTag);
        } else {
          throw 'First script tag has no parent node';
        }
      }
    });
  }
}

interface ScriptInformation {
  tag?: HTMLScriptElement;
  fullyLoaded: boolean;
  initiallyLoaded: boolean;
  promisesToResolve: ((value: any[] | PromiseLike<any[]>) => void)[];

  /** These are the parameters received from the windowCallback or script.onload method. */
  receivedArgs?: any[];
}