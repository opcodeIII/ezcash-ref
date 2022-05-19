import { IClient } from './createSession';

export default async ({client}: IClient): Promise<string> => {
    const ezcashAuthorizationResponse = await client.get("https://ezcash.wtf/login/vk", {followRedirect: false});
    return ezcashAuthorizationResponse.headers?.location ?? "";
}
