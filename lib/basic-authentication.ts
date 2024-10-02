import axios, { AxiosError } from "axios";

export default class BasicAuthentication {
    private readonly apiHost = "https://postman-echo.com";
    private readonly apiUri = "/basic-auth";
    private readonly username = "postman";
    private readonly password = "password";

    public async run() {
        // Concatenate username and password seperated by colon and encode it to base64 
        const authorization = Buffer.from(`${this.username}:${this.password}`).toString("base64");

        try {
            const response = await axios.get(`${this.apiHost}${this.apiUri}`, {
                headers: {
                    Authorization: `Basic ${authorization}`
                }
            });

            console.log("Basic Response: ", response.data);
        } catch (error) {
            console.log("Basic Error: ", (error as AxiosError).message);
        }
    }
}