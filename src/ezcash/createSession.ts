import got, { Got } from 'got';
import { HttpProxyAgent, HttpsProxyAgent } from 'hpagent';
import { CookieJar } from 'tough-cookie';

import userAgents from '../userAgents.const.js';
import { randomChoice, randomInt } from '../utils.js';
import checkProxy from '../checkProxy.js';

export interface IClient {
    client: Got
    cookieJar?: CookieJar
}

export default async (httpsProxy: string): Promise<IClient> => {
    const userAgent = randomChoice(userAgents);
    const cookieJar = new CookieJar();

    const client = got.extend({
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; rv:91.0) Gecko/20100101 Firefox/91.0",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"
        },
        // followRedirect: false,
        cookieJar,
        agent: {
            https: new HttpsProxyAgent({
                proxy: httpsProxy
            }),
            http: new HttpProxyAgent({
                proxy: httpsProxy
            })
        },
        timeout: {
            request: 30000
        },
        retry: {
            limit: 2,
            errorCodes: ['ERR_GOT_REQUEST_ERROR', 'ECONNRESET']
        }
    });

    console.log('[INFO] Before requests checking proxy');
    await checkProxy(client);

    return {
        client,
        cookieJar
    };
}
