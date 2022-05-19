import { IClient } from './createSession';
import Captcha from '../captcha.js';

import executeVKApi from '../vk/executeVKApi.js';

const captcha = new Captcha("e60f782d94e78795acb9ff55a957255c");

export default async (token: string, client: IClient) => {
    const taskId1 = await captcha.recaptcha("6LcPIdIfAAAAAF-RKYgPZCW0UFCMhCaQDn0XTW_F", "https://ezcash.wtf");
    const taskId2 = await captcha.recaptcha("6LcPIdIfAAAAAF-RKYgPZCW0UFCMhCaQDn0XTW_F", "https://ezcash.wtf");
    const c = client.client;

    try {
        await executeVKApi('wall.repost', token, {
            object: "wall-175882095_46500"
        });    

        const captchaResponse = await captcha.waitResult(taskId1);
        const response = await c.post("https://ezcash.wtf/referral/social", {
            form: {
                type: "vkRepost",
                captcha: captchaResponse
            }
        });
        const responseRepost = JSON.parse(response.body);

        if (responseRepost.error) {
            console.log('[ERROR EZCASH] ' + responseRepost.error);
        }
        console.log('[EZCASH]', responseRepost)
    } catch (e: any) {
        console.log('[ERR BONUS]', e);
    }

    try {
        await executeVKApi('groups.join', token, {
            group_id: 175882095
        });
        
        const captchaResponse2 = await captcha.waitResult(taskId2);
        const response2 = await c.post("https://ezcash.wtf/referral/social", {
            form: {
                type: "vk",
                captcha: captchaResponse2
            }
        });
        const responseVk = JSON.parse(response2.body);
        if (responseVk.error) {
            console.log('[ERROR EZCASH] ' + responseVk.error);
        }
        console.log('[EZCASH]', responseVk)
    } catch (e: any) {
        console.log('[ERR BONUS]', e);
    }

    return true;
}
