import got from 'got';
import { IClient } from '../ezcash/createSession';
import Captcha from '../captcha.js';

const captcha = new Captcha("e60f782d94e78795acb9ff55a957255c");

const executor = async (method: string, access_token: string, params: object = {}) => {
    const payload = {
        access_token,
        v: "5.105",
        ...params
    }

    const response = await got.get(`https://api.vk.com/method/${method}`, {searchParams: payload});
    const data = JSON.parse(response.body);
    if (data.error !== undefined) {
        if (data.error.error_code === 17) {
            throw new Error("Captcha validation needed!")
        }
        throw new Error("VK Api error " + data.error.error_msg);
    }

    return data.response;
}

export default executor;
