import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import {join} from 'path';

import createSession from "./ezcash/createSession.js";
import VkLogIn from "./vk/logIn.js"
import getAuthorizationLink from './ezcash/getAuthorizationLink.js';
import oauth from './vk/oauth.js';
import getBonuses from './ezcash/getBonuses.js';
import executeVkApi from './vk/executeVKApi.js';
import setRefLink from './ezcash/setRefLink.js';

import { randomInt, sleep } from './utils.js';

const accounts: Array<string> = fs.readFileSync('./accounts.txt', 'utf-8').split('\n');
console.log('[STARTING] Script starting, loaded', accounts.length, 'accounts');

(async() => {
    for (var account of accounts) {
        const cred = account.split(":");
        const auth = {login: cred[0], password: cred[1], token: cred[2]};

        const files = fs.readdirSync('cookies').filter(acc => acc.includes(auth.login));
        if (files.length > 0) {
            console.log('\n[WARN] Account already authorized on ezcash!');
            continue;
        }

        console.log('\n[INFO] Prechecking VK token, before loggining to account. Token:', auth.token);
        let accountInformation;
        try {
            accountInformation = (await executeVkApi('users.get', auth.token))[0];
        } catch (e: any) {
            console.log('[ERROR] VK Api error: ' + e + ', skipping account.');
            await sleep(2500);
            continue;
        }

        if (accountInformation.deactivated !== undefined) {
            console.log('[ERROR] Account %s', accountInformation.deactivated);
            await sleep(2500);
            continue;
        }

        console.log('[INFO] VK Info: #id%s %s', accountInformation.id, accountInformation.first_name);

        console.log('[INFO] Creating session...');
        const client = await createSession("http://S0cKUe5suE:sbL9jtheX3@176.9.113.66:7832");

        console.log('[INFO] Now set ref cookie for ezcash.');
        try {
            await setRefLink(client.client);
        } catch (e: any) {
            console.log('[ERROR] Can not set ref becouse of error:', e);
            await sleep(5000);
            continue;
        }

        console.log('[INFO] LogIning to VK account...');
        try {
            await VkLogIn(auth, client);
        } catch (e: any) {
            console.log('[ERROR] Can not authorize:', e);
            await sleep(10000);
            continue;
        }
        console.log('[SUCCESS] Authorization in VK successful, getting authorization link.');
        const link = await getAuthorizationLink(client);
        console.log('[LINK] Authorization link is: %s', link);

        console.log('[INFO] Try to pass OAuth', auth.login, auth.password);
        try {
            await oauth(link, client);
        } catch (e: any) {
            console.log('[ERROR]', e);
            await sleep(5555);
            continue;
        }
        console.log('[SUCCESS] OAuth passed, now getting bonuses...');
        await getBonuses(auth.token, client);
        console.log('[SUCCESS] Saving cookies...');

        const path = join('cookies', `${auth.login}-${randomInt(1000, 10000)}`);
        fs.mkdirSync(path, {recursive: true});
        const vkCookies = join(path, 'vk.json');
        const ezCookies = join(path, 'ezcash.json');
        const credsPath = join(path, 'info.txt');

        fs.writeFileSync(vkCookies, JSON.stringify(client.cookieJar.getCookiesSync('https://vk.com').map(cookie => {
            return {...cookie, name: cookie.key}
        }), null, 2));
        fs.writeFileSync(ezCookies, JSON.stringify(
            client.cookieJar.getCookiesSync('https://ezcash.wtf').map(cookie => {
                return {...cookie, name: cookie.key}
            }),
            null,
            2
        ));
        fs.writeFileSync(credsPath, `=================
Login: ${auth.login}
Password: ${auth.password}
Token: ${auth.token}
=================`);

        console.log('[SUCCESS] Saved, waiting 25 secs...');
        await sleep(25000);
    }
})();

console.log('\n[END] Script ended his work!')
