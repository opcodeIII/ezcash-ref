import { Got } from "got";
import fs from 'fs';

import { IClient } from '../ezcash/createSession';
import Captcha from '../captcha.js';

const captchaSolver = new Captcha("e60f782d94e78795acb9ff55a957255c");

interface IAuthorizationCreds {
    login: string;
    password: string;
    token: string;
}

interface ICaptcha {
    captcha_sid: string;
    captcha_key: string;
}

const getAuthorizationPayload = async (client: Got): Promise<object> => {
    const {body} = await client.get("https://vk.com/login");
    const to = body.match(/"to":"(.*?)"/);
    const ip_h = body.match(/name="ip_h" value="([a-z0-9]+)"/i);
    const lg_h = body.match(/name="lg_h" value="([a-z0-9]+)"/i);
    const lg_domain_h = body.match(/name="lg_domain_h" value="([a-z0-9]+)"/i);

    return {
        act: 'login',
        role: 'al_frame',
        expire: '',
        to: to !== null ? to[1] : null,
        'recaptcha': '',
        'captcha_sid': '',
        'captcha_key': '',
        '_origin': 'https://vk.com',
        'utf8': 1,
        ip_h: ip_h !== null ? ip_h[1] : null,
        lg_h: lg_h !== null ? lg_h[1] : null,
        lg_domain_h: lg_domain_h !== null ? lg_domain_h[1] : null,
        'ul': '',        
    }
}

const clearString = (s: string): string => {
    return s.replace('&nbsp;', '');
}

const logIn = async ({client, cookieJar}: IClient, authorization: IAuthorizationCreds, captcha: ICaptcha | null = null): Promise<boolean> => {
    let authorizationPayload = await getAuthorizationPayload(client);
    authorizationPayload = {...authorizationPayload, email: authorization.login, pass: authorization.password};

    if (captcha !== null)
        authorizationPayload = {...authorizationPayload, ...captcha};

    const response = await client.post("https://login.vk.com/?act=login", {
        form: authorizationPayload,
        headers: {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Referer': 'https://vk.com/',
            'Origin': 'https://vk.com',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; rv:91.0) Gecko/20100101 Firefox/91.0'
        },
        followRedirect: false
    });
    let url = response.headers.location || "";
    console.log(url);
    if (!url.includes('.php')) {
        url = url.replace('login', 'login.php');
    }
    const authResponse = await client.get(url);
    const authText = authResponse.body;

    if(authText.includes("onLoginReCaptcha(")) {
        console.log('[WARN] Recapctha required');
    } else if (authText.includes("onLoginFailed(4")) {
        console.log('[ERR] Invalid password');
        throw new Error("Invalid password");
    } else if (authText.includes("act=authcheck")) {
        console.log('[ERR] 2FA detected.');
        throw new Error("2FA detected.");
    } else if(authText.includes("onLoginCaptcha(")) {
        console.log("[WARN] Captcha detected");
        const captchaSid = authText.match(/onLoginCaptcha\('(\d+)'/)[1];
        const captchaImage = `https://vk.com/captcha.php?sid=${captchaSid}&dif=1`;

        const taskId = await captchaSolver.image(captchaImage);
        const captchaKey = await captchaSolver.waitResult(taskId);
        return await logIn({client, cookieJar}, authorization, {captcha_sid: captchaSid, captcha_key: captchaKey});
    }

    const cookies = cookieJar.getCookiesSync('https://vk.com');
    let success = false;
    cookies.forEach(cookie => {
        if (cookie.key === "remixsid" || cookie.key === "remixsid6") {
            success = true;
            return;
        }
    })

    if (!success) {
        console.log('[ERR] Cookie not found.');
        throw new Error(`Can not authorizete with ${authorization.login}:${authorization.password}`);
    }

    return true;
}

export default async (authorization: IAuthorizationCreds, client: IClient) => {
    await logIn(client, authorization);
}
