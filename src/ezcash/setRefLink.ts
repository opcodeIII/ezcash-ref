import { Got } from "got";

export default async (client: Got) => {
    const url = `https://ezcash.wtf/referral/activate/${process.env.EZCASH_REF_PROMO}`;
    await client.get(url, {followRedirect: true});
}
