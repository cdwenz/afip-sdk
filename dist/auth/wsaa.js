"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WSAA = void 0;
const axios_1 = __importDefault(require("axios"));
const tra_1 = require("../utils/tra");
const signer_1 = require("../utils/signer");
const xml_1 = require("../utils/xml");
class WSAA {
    constructor(config) {
        this.config = config;
        this.token = null;
        this.sign = null;
        this.expiration = null;
    }
    get url() {
        return this.config.production
            ? "https://wsaa.afip.gov.ar/ws/services/LoginCms"
            : "https://wsaahomo.afip.gov.ar/ws/services/LoginCms";
    }
    async login() {
        if (this.token &&
            this.expiration &&
            this.expiration.getTime() - Date.now() > 60000) {
            return {
                token: this.token,
                sign: this.sign
            };
        }
        const tra = (0, tra_1.createTRA)();
        const cms = (0, signer_1.signTRA)(tra, this.config.certPath, this.config.keyPath);
        const soap = `
      <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
      <soapenv:Body>
        <loginCms>
        <in0>${cms}</in0>
        </loginCms>
      </soapenv:Body>
      </soapenv:Envelope>
      `;
        const { data } = await axios_1.default.post(this.url, soap, {
            headers: { "Content-Type": "text/xml" }
        });
        const parsed = await (0, xml_1.parseXML)(data);
        const cmsResponse = parsed["soap:Envelope"]["soap:Body"].loginCmsResponse.loginCmsReturn;
        const decoded = Buffer.from(cmsResponse, "base64").toString();
        const ticket = await (0, xml_1.parseXML)(decoded);
        this.token = ticket.loginTicketResponse.credentials.token;
        this.sign = ticket.loginTicketResponse.credentials.sign;
        this.expiration = new Date(ticket.loginTicketResponse.header.expirationTime);
        return {
            token: this.token,
            sign: this.sign
        };
    }
}
exports.WSAA = WSAA;
