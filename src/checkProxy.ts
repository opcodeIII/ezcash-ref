import {Got} from 'got';

import { IClient } from './ezcash/createSession';
import { sleep } from './utils.js';

let lastIp: string;

export default async (client: Got) => {
    while (true) {
        try {
            const proxyInformationResponse = await client.get("http://ip-api.com/json");
            const proxyInformation = JSON.parse(proxyInformationResponse.body);

            const proxyIp = proxyInformation.query;
            const proxyCity = proxyInformation.city;

            console.log('[PROXY] IP: %s | City: %s', proxyIp, proxyCity);
            if (lastIp === proxyIp) {
                console.log('[PROXY] Last proxy ip === new proxy ip; waiting 20 seconds for recheck');
                await sleep(20000);
                continue;
            }
            lastIp = proxyIp;
            break;
        } catch (e: any) {
            if (e.code === "ERR_GOT_REQUEST_ERROR") {
                console.log("[PROXY] Proxy is now switching, check it after 10 seconds!");
                await sleep(10000);
            } else {
                throw new Error("Proxy invalid!");
            }
        }
    }
    return true;
}
