import * as cheerio from 'cheerio'
import crypto, { randomInt } from 'crypto';
import fs from 'fs'

import { IClient } from '../ezcash/createSession';

export default async (link: string, {client, cookieJar}: IClient) => {
    let authorizationForm = await client.get(link, {followRedirect: false});
    let location = authorizationForm.headers.location;

    if (location && location.includes('login.vk.com')) {
        authorizationForm = await client.get(location, {followRedirect: false});
        location = authorizationForm.headers.location;

        let response = await client.get(location);
        console.log('[DEBUG] Redirect url is: ' + response.url);

        if (response.url.includes('oauth.vk.com')) {
            const redirectLink = "https://login.vk.com/" + response.body.match(/"https:\/\/login.vk.com\/(.*?)"/i)[1];
            console.log(redirectLink);
            response = await client.get(redirectLink);
            console.log('Allowed & redirected to: ' + response.url)
        }

        if (response.url.includes("/access")) {
            const $ = cheerio.load(response.body);
            const csrf = $("meta[name='csrf-token']").attr('content');
            const fingerPrintHash = crypto.createHash('md5').update(String(randomInt(10000, 1000000))).digest('hex');
            console.log(csrf, fingerPrintHash);
            try {
                await client.post("https://ezcash.wtf/access", {
                    headers: {
                        "X-CSRF-TOKEN": csrf
                    },
                    form: {
                        r: fingerPrintHash,
                        vc: "Google+Inc.+(Intel)~ANGLE+(Intel,+Intel(R)+UHD+Graphics+Direct3D11+vs_5_0+ps_5_0,+D3D11)"
                    }
                });
                
            } catch (e: any) {
                console.log(e.response.body);
                console.log('Error description body');
            }
            return true;
        } else if(response.url.includes('ezcash.wtf')) {
            const $ = cheerio.load(response.body);
            if ($("a[href=/login/vk]").text() !== null) {
                throw new Error("VK account banned!");
            }
            return true;
        } else {
            throw new Error("Unknown redirect: " + response.url);
        }
    } else {
        throw new Error('OAuth error.')
    }
}
