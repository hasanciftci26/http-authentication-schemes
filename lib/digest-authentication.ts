import axios, { AxiosError } from "axios";
import { createHash, randomBytes } from "crypto";

export default class DigestAuthentication {
    private readonly apiHost = "https://httpbin.org";
    private readonly apiUri = "/digest-auth/auth/user/passwd";
    private readonly username = "user";
    private readonly password = "passwd";
    private realm: string; // Scope of the protection, the area that is protected
    private nonce: string; // Random value generated by the server, we should use it to calculate the response hash
    private qop: string; // Quality of Protection, it can be either auth or auth-int and usually it is auth
    private opaque: string; // Random value generated by the server. We should send it back to server without modifications
    private algorithm: string; // The hash algorithm that the server expects
    private nc: string; // Nonce Count, the count of the usage of the same nonce value, usually starts from 00000001 
    private cnonce: string; // Random value that we as a client should generate and use it in the hash calculation
    private response: string;
    private digest: string;

    public async run() {
        await this.sendAnonymousRequest();
        this.generateDigest();
        this.sendAuthenticatedRequest();
    }

    private async sendAnonymousRequest() {
        try {
            await axios.get(`${this.apiHost}${this.apiUri}`);
        } catch (error) {
            const response = (error as AxiosError).response;

            if (!response) {
                throw new Error("No response was identified.");
            }

            // GET the realm, nonce, qop, opaque, and algorithm values from the WWW-Authenticate header of the server response
            const auth: string = response.headers["www-authenticate"];
            const regex = /(\w+)=("[^"]*"|[^, ]+)/g;
            let match: RegExpExecArray | null;

            while ((match = regex.exec(auth)) !== null) {
                const key = match[1]; // The field name
                const value = match[2].replace(/^"|"$|,$/g, "");

                switch (key) {
                    case "realm":
                        this.realm = value;
                        break;
                    case "nonce":
                        this.nonce = value;
                        break;
                    case "qop":
                        this.qop = value;
                        break;
                    case "opaque":
                        this.opaque = value;
                        break;
                    case "algorithm":
                        this.algorithm = value;
                        break;
                    default:
                        break;
                }
            }
        }
    }

    // Generate the Authorization HTTP request header
    private generateDigest() {
        this.generateHash();
        this.digest = "Digest " + [
            `username="${this.username}"`,
            `realm="${this.realm}"`,
            `nonce="${this.nonce}"`,
            `uri="${this.apiUri}"`,
            `algorithm="${this.algorithm}"`,
            `qop=${this.qop}`,
            `nc=${this.nc}`,
            `cnonce="${this.cnonce}"`,
            `response="${this.response}"`,
            `opaque="${this.opaque}"`
        ].join(", ");
    }

    // Generate the response hash
    // HA1 = MD5(username:realm:password)
    // HA2 = MD5(HTTP_METHOD:uri)
    // response = MD5(HA1:nonce:nc:cnonce:qop:HA2)
    private generateHash() {
        this.nc = "00000001";
        this.cnonce = randomBytes(16).toString("hex");

        const hash1String = `${this.username}:${this.realm}:${this.password}`;
        const hash1 = createHash("md5").update(hash1String).digest("hex");

        const hash2String = `GET:${this.apiUri}`;
        const hash2 = createHash("md5").update(hash2String).digest("hex");

        const responseString = `${hash1}:${this.nonce}:${this.nc}:${this.cnonce}:${this.qop}:${hash2}`;
        this.response = createHash("md5").update(responseString).digest("hex");
    }

    private async sendAuthenticatedRequest() {
        try {
            const response = await axios.get(`${this.apiHost}${this.apiUri}`, {
                headers: {
                    Authorization: this.digest
                }
            });

            console.log("Digest Response: ", response.data);
        } catch (error) {
            console.log("Digest Error: ", (error as AxiosError).message);
        }
    }
}