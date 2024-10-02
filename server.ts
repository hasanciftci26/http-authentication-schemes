import BasicAuthentication from "./lib/basic-authentication";
import DigestAuthentication from "./lib/digest-authentication";

const basic = new BasicAuthentication();
const digest = new DigestAuthentication();

basic.run();
digest.run();