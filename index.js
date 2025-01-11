import express from 'express';
import bodyParser from 'body-parser';
import axios from 'axios';
import QueryString from 'qs';
import dotenv from 'dotenv';
import QRCode from 'qrcode';
import crypto from 'crypto';

const seq = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

class RandomUtil {
    static randomIntRange(min, max) {
        return parseInt(Math.random() * (max - min) + min, 10);
    }

    static randomInt(n) {
        return this.randomIntRange(0, n);
    }

    static randomSeq(count) {
        let str = '';
        for (let i = 0; i < count; ++i) {
            str += seq[this.randomInt(62)];
        }
        return str;
    }

    static randomLowerAndNum(count) {
        let str = '';
        for (let i = 0; i < count; ++i) {
            str += seq[this.randomInt(36)];
        }
        return str;
    }

    static randomUUID() {
        let d = new Date().getTime();
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            let r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c === 'x' ? r : (r & 0x7 | 0x8)).toString(16);
        });
    }

    static randomShadowsocksPassword() {
        const array = crypto.randomBytes(32); 
        return Buffer.from(array).toString('base64');
    }

    static randomShortId() {
        let shortIds = new Array(24).fill('');
        for (var ii = 1; ii < 24; ii++) {
            for (var jj = 0; jj <= this.randomInt(7); jj++){
                let randomNum = this.randomInt(256);
                shortIds[ii] += ('0' + randomNum.toString(16)).slice(-2)
            }
        }
        return shortIds;
    }
}
dotenv.config();

const app = express();
const port = 3000;
const qs = QueryString;
const basePort = process.env.PORT;
const secretURL = process.env.SECRET;
const host = process.env.HOST;
let baseUrl = `http://${host}:${basePort}/${secretURL}/xui/inbound/`;

if (secretURL == '') {
    baseUrl = `http://${host}:${basePort}/xui/inbound/`;
}

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

const credentials = qs.stringify({
    'username': process.env.USERNAME,
    'password': process.env.PASSWORD
});

const config = {
    method: 'post',
    maxBodyLength: Infinity,
    headers: { 
        'Content-Type': 'application/x-www-form-urlencoded'
    },
    withCredentials: true
};

(async () => {
    try {
        config.url = `http://${host}:${basePort}/${secretURL}/login`;
        if (secretURL == '') {
            config.url = `http://${host}:${basePort}/login`;
        }
        config.data = credentials;
        const response = await axios.request(config);
        const setCookieHeader = response.headers['set-cookie'];
        if (setCookieHeader) {
            config.headers['Cookie'] = setCookieHeader;
        } else {
            console.log('No cookies received in the response.');
        }
    } catch (error) {
        console.error('Error logging in:', error.message);
    }
})();

const generatorQR = async text => {
    try {
        return await QRCode.toDataURL(text);
    } catch (err) {
        console.error(err);
    }
}

async function getInbounds() {
    try {
        config.data = credentials;
        config.url = baseUrl + 'list/';
        const response = await axios.request(config);
        return response.data;
    } catch (error) {
        console.error(error);
    }
}



function generateClientCode(protocol, client, inbound) {
    const remark = "libertatem";
    if (protocol === 'vless') {
        const streamSettings = JSON.parse(inbound.streamSettings);
        const realitySettings = streamSettings.realitySettings.settings;

        const params = new URLSearchParams({
            type: streamSettings.network,
            security: streamSettings.security,
            pbk: realitySettings.publicKey,
            fp: realitySettings.fingerprint
        });

        if (client.flow) params.append("flow", client.flow);
        if (streamSettings.realitySettings.serverNames[0]) params.append("sni", streamSettings.realitySettings.serverNames[0]);

        const uri = `vless://${client.id}@${host}:${inbound.port}?${params.toString()}#${encodeURIComponent(remark)}`;
        return uri;

    } else if (protocol === 'shadowsocks') {
        const inboundSettings = JSON.parse(inbound.settings);
        const methodPassword = `${inboundSettings.method}:${inboundSettings.password}:${client.password}`;
        const encodedMethodPassword = Buffer.from(methodPassword).toString('base64');
        return `ss://${encodedMethodPassword}@${host}:${inbound.port}#${encodeURIComponent(remark)}`;
    }
}

app.get('/', async (req, res) => {
    res.render('index.ejs', { data: await getInbounds() });
});

app.post('/generate', async (req, res) => {
    const { inboundId, tgId } = req.body;
    const [id, protocol] = inboundId.split('?');

    config.url = baseUrl + 'addClient';

    let clients;
    if (protocol === 'vless') {
        clients = [{
            id: RandomUtil.randomUUID(),
            flow: 'xtls-rprx-vision',
            email: RandomUtil.randomLowerAndNum(9),
            totalGB: 0,
            expiryTime: 0,
            enable: true,
            tgId,
            subId: RandomUtil.randomLowerAndNum(16),
            reset: 0
        }];
    } else if (protocol === 'shadowsocks') {
        clients = [{
            method: "",
            password: RandomUtil.randomShadowsocksPassword(),
            email: RandomUtil.randomLowerAndNum(9),
            totalGB: 0,
            expiryTime: 0,
            enable: true,
            tgId,
            subId: RandomUtil.randomLowerAndNum(16),
            reset: 0
        }];
    } else {
        return res.end('We are working on it');
    }

    config.data = qs.stringify({
        username: process.env.USERNAME,
        password: process.env.PASSWORD,
        id,
        settings: JSON.stringify({ clients })
    });

    try {
        const response = await axios.request(config);
        if (response.data.success) {
            res.redirect('/code/' + protocol + '/' + clients[0].email);
        } else {
            console.error(response.data);
            res.end('Failed');
        }
    } catch (error) {
        console.error(error);
    }
});

app.get('/code/:protocol/:email', async (req, res) => {
    const { protocol, email } = req.params;
    const inbounds = await getInbounds();
    for (const inbound of inbounds.obj) {
        if (inbound.protocol !== protocol) continue;
        const inboundSettings = JSON.parse(inbound.settings);
        for (const client of inboundSettings.clients) {
            if (client.email === email) {
                const link = generateClientCode(protocol, client, inbound);
                const qr = await generatorQR(link);
                return res.render('code.ejs', { link, qr });
            }
        }
    }
});

app.get('/login', (req, res) => {
    res.render('login.ejs');
});

app.get('/register', (req, res) => {
    let pageData = { 'username' : '', 'email' : '', errors: [] };

    res.render('register.ejs', { pageData });
});

function checkPasswordSecurity(password) {
    let errors = [];
   
    if (password.length < 8) {
        errors.push('Password must be at least 8 characters long');
    }

    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }   

    if (!/[0-9]/.test(password)) {
        errors.push('Password must contain at least one number');
    }

    if (!/[^a-zA-Z0-9]/.test(password)) {
        errors.push('Password must contain at least one special character');
    }   

    return errors;
}

app.post('/register', async (req, res) => {

    let {username, email, password} = req.body;
    
    let pageData = { 'username' : username, 'email' : email, errors: checkPasswordSecurity(password) };

    if (pageData.errors.length > 0) {  
        res.render('register.ejs', { pageData });
        return;
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
