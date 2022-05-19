import got, {Got} from 'got';
import FormData from 'form-data';

import { sleep } from './utils.js';

interface ICaptchaResponse {
    status: number
    request: string
}

export default class Captcha {
    token: string;
    session: Got = got.extend({headers: {"Accept": "*/*"}})

    constructor(token: string) {
        this.token = token;
    }

    __errorHandler(response: ICaptchaResponse) {
        if (response.status === 0) {
            if (response.request !== "CAPCHA_NOT_READY") {
                throw new Error("Captcha.guru Error: " + response.request);
            }
        }
    }

    async __request(url: string, method: string, body: FormData): Promise<ICaptchaResponse> {
        const response = await this.session.post(
            "https://api.captcha.guru" + url,
            {
                body,
                headers: { ...body.getHeaders() },
                timeout: {
                    request: 30000
                }
            }
        );
        const data: ICaptchaResponse = JSON.parse(response.body);
        this.__errorHandler(data);

        return data;
    }

    async recaptcha(googleKey: string, page: string): Promise<string> {
        const form = new FormData();
        form.append("key", this.token);
        form.append("method", "userrecaptcha");
        form.append("googlekey", googleKey);
        form.append("pageurl", page);
        form.append("json", 1);

        const taskId = await this.__request("/in.php", "POST", form);
        return taskId.request;
    }

    async get_image(image_url: string): Promise<Buffer> {
        const response = await this.session.get(image_url, {responseType: 'buffer'});
        return response.body;
    }

    async image(image_url: string): Promise<string> {
        const imageContent = await this.get_image(image_url);
        const image = imageContent.toString('base64');

        const form = new FormData();
        form.append("key", this.token);
        form.append("method", "base64");
        form.append("body", image);
        form.append("json", 1);

        const taskId = await this.__request("/in.php", "POST", form);
        return taskId.request;
    }

    async waitResult(taskId: string) {
        await sleep(5000);

        for (var i = 0; i<40; i++) {
            const form = new FormData();
            form.append("key", this.token);
            form.append("action", "get");
            form.append("id", taskId);
            form.append("json", 1);
            const response = await this.__request('/res.php', 'POST', form);

            if (response.status === 1) {
                return response.request;
            } else {
                console.log('[CAPTCHA] Captcha not ready.');
            }
            
            await sleep(5000);
        }

        throw new Error("Captcha error");
    }
}
